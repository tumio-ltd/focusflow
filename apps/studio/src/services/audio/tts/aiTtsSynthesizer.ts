/**
 * AI Voiceover Orchestrator & Adaptive Scene Duration Stretcher
 * Connects TTS synthesis with timeline scene camera duration stretching
 */

import type { SceneStep, AudioMarker, AudioTrackConfig } from '@focusflow/dsl';
import { WebSpeechTTSProvider } from './WebSpeechTTSProvider';
import { UserKeyOpenAITTSProvider } from './UserKeyOpenAITTSProvider';
import type { ITTSProvider } from './ttsProvider';
import { decodeAudioFile } from '../audioDecoder';
import { getStoredTTSConfig, TTS_PRESETS, type TTSStoredConfig } from './ttsConfigStore';

/**
 * Instantiate appropriate TTS Provider according to active configuration
 */
export function createTTSProviderFromConfig(config?: TTSStoredConfig): ITTSProvider {
  const cfg = config || getStoredTTSConfig();
  if (cfg.mode === 'cloud' && cfg.apiKey) {
    const presetDef = TTS_PRESETS[cfg.preset];
    return new UserKeyOpenAITTSProvider({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      name: presetDef?.name || 'Cloud TTS (BYOK)',
      customVoices: presetDef?.voices,
    });
  }
  return new WebSpeechTTSProvider();
}

/**
 * Calculate adaptive scene duration to fit audio voiceover:
 * - Keeps audio speech at its natural, normal rate (never stretch or slow down audio).
 * - If speech is longer than scene duration, extend the scene duration to speech duration + 500ms breathing buffer.
 * - If scene duration is already longer than speech, KEEP the original scene duration to leave visual blank space (留白)
 *   so the audience has comfortable time to digest the architectural graphics.
 */
export function adaptSceneDurationToAudio(
  scene: SceneStep,
  audioDurationMs: number,
  defaultInterval = 3800
): number {
  const currentDuration = scene.duration || defaultInterval;
  const cameraTransitionMs = Math.round((scene.camera?.duration ?? 1.2) * 1000);
  const requiredMinMs = Math.max(audioDurationMs + 500, cameraTransitionMs + 500);
  return Math.max(currentDuration, requiredMinMs);
}

export interface BatchVoiceoverResult {
  track: AudioTrackConfig;
  updatedScenes: SceneStep[];
}

/**
 * Synthesize voiceover for a single scene and return adapted duration
 */
export async function synthesizeSceneVoiceover(
  scene: SceneStep,
  provider?: ITTSProvider,
  voiceId?: string,
  speed?: number,
  defaultInterval = 3800
): Promise<{ audioBlob: Blob; durationMs: number; adaptedDuration: number }> {
  const cfg = getStoredTTSConfig();
  const activeProvider = provider || createTTSProviderFromConfig(cfg);
  const activeVoiceId = voiceId || cfg.voice;
  const activeSpeed = speed ?? cfg.speed ?? 1.0;

  const text = scene.voiceoverScript?.trim() || scene.title;
  const res = await activeProvider.synthesize(text, activeVoiceId, activeSpeed);
  const adaptedDuration = adaptSceneDurationToAudio(scene, res.durationMs, defaultInterval);

  return {
    audioBlob: res.audioBlob,
    durationMs: res.durationMs,
    adaptedDuration,
  };
}

/**
 * Synthesize voiceover for all scenes with text, stitch together into an AudioTrackConfig,
 * and adapt each scene's duration
 */
export async function synthesizeAllScenesVoiceover(
  scenes: SceneStep[],
  provider?: ITTSProvider,
  voiceId?: string,
  speed?: number,
  defaultInterval = 3800
): Promise<BatchVoiceoverResult> {
  const cfg = getStoredTTSConfig();
  const activeProvider = provider || createTTSProviderFromConfig(cfg);
  const activeVoiceId = voiceId || cfg.voice;
  const activeSpeed = speed ?? cfg.speed ?? 1.0;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();

  const renderedBlobs: Blob[] = [];
  const sceneDurations: number[] = [];
  const markers: AudioMarker[] = [];
  let currentOffsetMs = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const text = scene.voiceoverScript?.trim() || scene.title;
    const res = await activeProvider.synthesize(text, activeVoiceId, activeSpeed);

    renderedBlobs.push(res.audioBlob);
    const adaptedDuration = adaptSceneDurationToAudio(scene, res.durationMs, defaultInterval);
    sceneDurations.push(adaptedDuration);

    markers.push({
      id: `marker-scene-${i}`,
      timeMs: currentOffsetMs,
      label: scene.title,
      sceneIndex: i,
    });

    currentOffsetMs += adaptedDuration;
  }

  // Concatenate rendered audio blobs into one master AudioBuffer
  const decodedBuffers: AudioBuffer[] = [];
  for (const blob of renderedBlobs) {
    const decoded = await decodeAudioFile(blob);
    decodedBuffers.push(decoded.audioBuffer);
  }

  const sampleRate = decodedBuffers[0]?.sampleRate || 44100;
  const totalLength = Math.ceil((currentOffsetMs / 1000) * sampleRate);
  const combinedBuffer = ctx.createBuffer(1, Math.max(1, totalLength), sampleRate);
  const combinedChannel = combinedBuffer.getChannelData(0);

  let writeOffset = 0;
  for (let i = 0; i < decodedBuffers.length; i++) {
    const buf = decodedBuffers[i];
    const channel = buf.getChannelData(0);
    combinedChannel.set(channel, writeOffset);
    // Move to next scene's start time
    writeOffset = Math.floor((markers[i + 1]?.timeMs ?? currentOffsetMs) / 1000 * sampleRate);
  }

  // Encode combinedBuffer to WAV Blob
  const wavBlob = audioBufferToWavBlob(combinedBuffer);
  const trackUrl = URL.createObjectURL(wavBlob);

  const updatedScenes = scenes.map((scene, idx) => ({
    ...scene,
    duration: sceneDurations[idx],
  }));

  const isOffline = activeProvider.name.includes('Web Speech') || activeProvider.name.includes('离线') || cfg.mode === 'offline';
  const track: AudioTrackConfig = {
    id: `track-ai-${Date.now()}`,
    name: `AI 智能配音合流 (${activeProvider.name})`,
    url: trackUrl,
    durationMs: currentOffsetMs,
    volume: 1.0,
    muted: false,
    isOfflineTTS: isOffline,
    type: isOffline ? 'offline-tts' : 'voiceover',
    markers,
  };

  ctx.close().catch(() => {});

  return {
    track,
    updatedScenes,
  };
}

/**
 * Convert AudioBuffer to WAV format Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');

  // fmt
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);

  // data
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
