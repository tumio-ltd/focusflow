/**
 * Studio Voice Recorder
 * Microphone capture, real-time VU meter calculation, and punch-in scene markers
 */

import type { AudioMarker } from '@focusflow/dsl';

export interface RecorderOptions {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  deviceId?: string;
  onVuLevel?: (level: number, dbfs: number) => void;
  onTick?: (elapsedMs: number) => void;
}

export interface VoiceRecordingResult {
  blob: Blob;
  durationMs: number;
  markers: AudioMarker[];
}

export class StudioVoiceRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  private startTime = 0;
  private pausedTime = 0;
  private totalPausedDuration = 0;
  private isRecording = false;
  private isPaused = false;
  private markers: AudioMarker[] = [];
  private chunks: Blob[] = [];

  constructor(private options: RecorderOptions = {}) {}

  /**
   * Enumerate available microphone audio input devices
   */
  static async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }

  /**
   * Start microphone stream preflight (for testing VU levels before recording)
   */
  async startPreflight(): Promise<void> {
    this.stopPreflight();

    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: this.options.echoCancellation ?? true,
        noiseSuppression: this.options.noiseSuppression ?? true,
        deviceId: this.options.deviceId ? { exact: this.options.deviceId } : undefined,
      },
      video: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);

    this.startVuLoop();
  }

  stopPreflight(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.stream && !this.isRecording) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (!this.stream) {
      await this.startPreflight();
    }

    if (!this.stream) {
      throw new Error('No audio input stream available');
    }

    this.chunks = [];
    this.markers = [];
    this.startTime = Date.now();
    this.totalPausedDuration = 0;
    this.isRecording = true;
    this.isPaused = false;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(200);

    if (this.options.onTick) {
      this.tickIntervalId = setInterval(() => {
        if (!this.isPaused) {
          const elapsed = Date.now() - this.startTime - this.totalPausedDuration;
          this.options.onTick?.(Math.max(0, elapsed));
        }
      }, 100);
    }
  }

  /**
   * Add a scene punch-in marker at the current elapsed time
   */
  punchInMarker(label: string, sceneIndex?: number): AudioMarker {
    const elapsedMs = Math.max(0, Date.now() - this.startTime - this.totalPausedDuration);
    const marker: AudioMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timeMs: elapsedMs,
      label,
      sceneIndex,
    };
    this.markers.push(marker);
    return marker;
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.pausedTime = Date.now();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.totalPausedDuration += Date.now() - this.pausedTime;
    }
  }

  /**
   * Stop recording and return final audio blob and metadata
   */
  stop(): Promise<VoiceRecordingResult> {
    return new Promise((resolve) => {
      if (this.tickIntervalId) {
        clearInterval(this.tickIntervalId);
        this.tickIntervalId = null;
      }

      this.stopPreflight();

      const finalDuration = Math.max(0, Date.now() - this.startTime - this.totalPausedDuration);

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.isRecording = false;
        resolve({ blob, durationMs: finalDuration, markers: [...this.markers] });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.isRecording = false;
        resolve({ blob, durationMs: finalDuration, markers: [...this.markers] });
      };

      this.mediaRecorder.stop();
    });
  }

  private startVuLoop(): void {
    if (!this.analyser) return;

    const dataArray = new Float32Array(this.analyser.fftSize);

    const update = () => {
      if (!this.analyser) return;
      this.analyser.getFloatTimeDomainData(dataArray);

      let sumSq = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sumSq += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSq / dataArray.length);
      const dbfs = 20 * Math.log10(rms + 1e-9);

      // Map -60dB -> 0.0, 0dB -> 1.0
      const normalizedLevel = Math.max(0, Math.min(1, (dbfs + 60) / 60));

      this.options.onVuLevel?.(normalizedLevel, Math.round(dbfs));

      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }
}
