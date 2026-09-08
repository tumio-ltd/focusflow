import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { extractPeaks, decodeAudioFile, getAudioContext } from '@/services/audio/audioDecoder';
import { analyzeVadSilences, snapTimeToSilence, type SilenceBand } from '@/services/audio/vadAnalyzer';
import { speakWebSpeech, stopWebSpeech } from '@/services/audio/tts/WebSpeechTTSProvider';
import { getStoredTTSConfig } from '@/services/audio/tts/ttsConfigStore';
import { type SceneStep } from '@focusflow/dsl';
import { Volume2, VolumeX, ZoomIn, ZoomOut, Trash2, Play, Pause, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function generateSpeechPeaks(totalDurationMs: number, scenes: SceneStep[], sampleCount: number = 800): Float32Array {
  const peaks = new Float32Array(sampleCount);
  let accumMs = 0;
  for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
    const scene = scenes[sIdx];
    const durMs = (scene.duration || 3.8) * 1000;
    const sceneStartRatio = accumMs / Math.max(1, totalDurationMs);
    const sceneEndRatio = (accumMs + durMs) / Math.max(1, totalDurationMs);
    const startSample = Math.floor(sceneStartRatio * sampleCount);
    const endSample = Math.min(sampleCount, Math.floor(sceneEndRatio * sampleCount));

    const sceneSampleCount = endSample - startSample;
    for (let i = startSample; i < endSample; i++) {
      const relIdx = i - startSample;
      const progress = relIdx / Math.max(1, sceneSampleCount);
      if (progress < 0.05 || progress > 0.85) {
        peaks[i] = 0.02 + Math.abs(Math.sin(i * 0.5)) * 0.03;
      } else {
        const envelope = Math.sin(progress * Math.PI);
        const cadence = Math.sin(i * 0.4) * Math.cos(i * 0.15) * 0.35 + 0.45;
        const jitter = Math.sin(i * 1.8) * 0.15;
        peaks[i] = Math.min(1.0, Math.max(0.06, (cadence + jitter) * envelope));
      }
    }
    accumMs += durMs;
  }
  return peaks;
}

interface AudioWaveformTrackProps {
  currentPlayheadMs?: number;
  onSeek?: (timeMs: number) => void;
  onSelectScene?: (index: number) => void;
  height?: number;
}

export const AudioWaveformTrack: React.FC<AudioWaveformTrackProps> = ({
  currentPlayheadMs = 0,
  onSeek,
  onSelectScene,
  height = 72,
}) => {
  const { t } = useTranslation('audio');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { dsl, setAudioTrack, removeAudioTrack, updateSceneDuration } = useProjectStore();
  const track = dsl.audio?.tracks?.[0];
  const scenes = dsl.scenes;

  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [vadSilences, setVadSilences] = useState<SilenceBand[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 10x
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingSceneIndex, setDraggingSceneIndex] = useState<number | null>(null);
  const [snapFeedback, setSnapFeedback] = useState<{ snapped: boolean; deltaMs: number } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [playheadMs, setPlayheadMs] = useState<number>(currentPlayheadMs || 0);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const activeScrubSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrubStartTimeRef = useRef<number | null>(null);
  const scrubHasMovedRef = useRef<boolean>(false);
  const prevExternalPlayheadRef = useRef<number>(currentPlayheadMs || 0);
  const userInteractedTimestampRef = useRef<number>(0);
  const grainAnimRef = useRef<number | null>(null);

  const stopGrainAnim = useCallback(() => {
    if (grainAnimRef.current) {
      cancelAnimationFrame(grainAnimRef.current);
      grainAnimRef.current = null;
    }
  }, []);

  // Sync external currentPlayheadMs changes (e.g. user clicked another scene card in timeline)
  useEffect(() => {
    if (currentPlayheadMs !== prevExternalPlayheadRef.current) {
      prevExternalPlayheadRef.current = currentPlayheadMs;
      // Only apply if user isn't scrubbing and didn't just interact within 600ms
      if (!isScrubbing && Date.now() - userInteractedTimestampRef.current >= 600) {
        stopGrainAnim();
        setPlayheadMs(currentPlayheadMs);
      }
    }
  }, [currentPlayheadMs, isScrubbing, stopGrainAnim]);

  const offlineTtsAnimRef = useRef<number | null>(null);

  const stopOfflineTtsPreview = useCallback(() => {
    stopWebSpeech();
    if (offlineTtsAnimRef.current) {
      cancelAnimationFrame(offlineTtsAnimRef.current);
      offlineTtsAnimRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopGrainAnim();
      stopOfflineTtsPreview();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [stopGrainAnim, stopOfflineTtsPreview]);

  // Sync playhead smoothly while full audio preview is playing
  useEffect(() => {
    let animId: number;
    const isOffline = Boolean(
      track?.isOfflineTTS ||
      track?.type === 'offline-tts' ||
      track?.id?.startsWith('track-ai-') ||
      track?.id?.startsWith('tts-')
    );
    if (isPlayingAudio && !isOffline) {
      stopGrainAnim();
      const updateFrame = () => {
        if (audioPreviewRef.current && !audioPreviewRef.current.paused) {
          setPlayheadMs(audioPreviewRef.current.currentTime * 1000);
          animId = requestAnimationFrame(updateFrame);
        }
      };
      animId = requestAnimationFrame(updateFrame);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlayingAudio, stopGrainAnim, track]);

  const toggleAudioPreview = () => {
    if (!track) return;
    stopGrainAnim();

    if (isPlayingAudio) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      stopOfflineTtsPreview();
      setIsPlayingAudio(false);
      return;
    }

    const isOffline = Boolean(
      track.isOfflineTTS ||
      track.type === 'offline-tts' ||
      track.id.startsWith('track-ai-') ||
      track.id.startsWith('tts-')
    );

    if (isOffline) {
      stopOfflineTtsPreview();
      const cfg = getStoredTTSConfig();

      // Find starting scene from current playheadMs
      let accum = 0;
      let startIdx = 0;
      for (let i = 0; i < scenes.length; i++) {
        const durMs = (scenes[i].duration || dsl.meta.controls?.interval || 3800);
        if (playheadMs < accum + durMs) {
          startIdx = i;
          break;
        }
        accum += durMs;
        startIdx = i;
      }

      setIsPlayingAudio(true);

      const playSceneVoice = (idx: number) => {
        if (idx >= scenes.length) {
          setIsPlayingAudio(false);
          stopOfflineTtsPreview();
          return;
        }
        onSelectScene?.(idx);
        const scene = scenes[idx];
        const fullText = scene.voiceoverScript?.trim() || scene.title;

        let sStartMs = 0;
        for (let i = 0; i < idx; i++) {
          sStartMs += (scenes[i].duration || dsl.meta.controls?.interval || 3800);
        }
        const sDurMs = (scene.duration || dsl.meta.controls?.interval || 3800);

        // Smart text slicing if starting mid-scene
        let textToSpeak = fullText;
        if (idx === startIdx && playheadMs > sStartMs + 500) {
          const ratio = Math.max(0, Math.min(1, (playheadMs - sStartMs) / Math.max(1, sDurMs)));
          const sentences = fullText.split(/(?<=[。！？；\n,.!?;])\s*/).map((s) => s.trim()).filter(Boolean);
          if (sentences.length > 1) {
            const sentenceIdx = Math.min(sentences.length - 1, Math.floor(ratio * sentences.length));
            textToSpeak = sentences.slice(sentenceIdx).join(' ');
          }
        }

        const startT = performance.now();
        const startPh = idx === startIdx ? Math.max(sStartMs, playheadMs) : sStartMs;

        const step = () => {
          const elapsed = performance.now() - startT;
          const currentMs = Math.min(sStartMs + sDurMs, startPh + elapsed);
          setPlayheadMs(currentMs);
          if (currentMs < sStartMs + sDurMs) {
            offlineTtsAnimRef.current = requestAnimationFrame(step);
          }
        };
        if (offlineTtsAnimRef.current) cancelAnimationFrame(offlineTtsAnimRef.current);
        offlineTtsAnimRef.current = requestAnimationFrame(step);

        speakWebSpeech(textToSpeak, cfg.speed, undefined, cfg.voice, () => {
          setPlayheadMs(sStartMs + sDurMs);
          playSceneVoice(idx + 1);
        });
      };

      playSceneVoice(startIdx);
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(track.url);
      audioPreviewRef.current.onended = () => setIsPlayingAudio(false);
    } else {
      audioPreviewRef.current.src = track.url;
    }
    // Start playing right from current playhead position
    const startSec = Math.max(0, Math.min((track.durationMs || 99999) / 1000, playheadMs / 1000));
    audioPreviewRef.current.currentTime = startSec;
    audioPreviewRef.current.play().then(() => {
      setIsPlayingAudio(true);
    }).catch((e) => {
      console.warn('Audio preview play failed:', e);
    });
  };

  const handleDownloadAudio = async () => {
    if (!track?.url) return;
    try {
      const resp = await fetch(track.url);
      const blob = await resp.blob();
      const mime = blob.type || 'audio/webm';
      let ext = 'webm';
      if (mime.includes('mp4')) ext = 'm4a';
      else if (mime.includes('wav')) ext = 'wav';
      else if (mime.includes('ogg')) ext = 'ogg';
      else if (mime.includes('mpeg') || mime.includes('mp3')) ext = 'mp3';

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeName = (track.name || 'focusflow-audio').replace(/[\\/:*?"<>|]/g, '_');
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.warn('Failed to download audio file:', err);
    }
  };

  // Total timeline duration (ms)
  const totalDurationMs = useMemo(() => {
    const sceneSum = scenes.reduce((sum, s) => sum + (s.duration || dsl.meta.controls?.interval || 3800), 0);
    return Math.max(sceneSum, track?.durationMs || 0, 5000);
  }, [scenes, track, dsl.meta.controls?.interval]);

  // Scene boundaries in milliseconds [s0_end, s1_end, ...]
  const sceneBoundaries = useMemo(() => {
    const boundaries: { index: number; endMs: number; title: string }[] = [];
    let accum = 0;
    scenes.forEach((s, idx) => {
      accum += (s.duration || dsl.meta.controls?.interval || 3800);
      boundaries.push({ index: idx, endMs: accum, title: s.title });
    });
    return boundaries;
  }, [scenes, dsl.meta.controls?.interval]);

  const lastDecodedUrlRef = useRef<string | null>(null);
  const scenesRef = useRef(scenes);
  scenesRef.current = scenes;
  const totalDurationMsRef = useRef(totalDurationMs);
  totalDurationMsRef.current = totalDurationMs;

  // Load and decode audio when track URL changes
  useEffect(() => {
    if (!track?.url) {
      lastDecodedUrlRef.current = null;
      setPeaks(null);
      setAudioBuffer(null);
      setVadSilences([]);
      setDecodeError(null);
      return;
    }

    // 防死循环重入守卫：若当前 URL 已成功解码，严禁重复拉取、解码与派发 Web Worker
    if (lastDecodedUrlRef.current === track.url) {
      return;
    }
    lastDecodedUrlRef.current = track.url;

    setDecodeError(null);
    let isMounted = true;
    (async () => {
      try {
        const resp = await fetch(track.url);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const blob = await resp.blob();
        const info = await decodeAudioFile(blob);
        if (!isMounted) return;

        setAudioBuffer(info.audioBuffer);
        const extracted = await extractPeaks(info.audioBuffer, 1200);
        if (!isMounted) return;

        const isOffline = Boolean(
          track.isOfflineTTS ||
          track.type === 'offline-tts' ||
          track.id.startsWith('track-ai-') ||
          track.id.startsWith('tts-')
        );

        let maxPeak = 0;
        for (let i = 0; i < extracted.length; i++) {
          if (extracted[i] > maxPeak) maxPeak = extracted[i];
        }

        if (isOffline || maxPeak < 0.01) {
          const speechPeaks = generateSpeechPeaks(track.durationMs || totalDurationMsRef.current, scenesRef.current, 1200);
          setPeaks(speechPeaks);
        } else {
          setPeaks(extracted);
        }

        const silences = analyzeVadSilences(info.audioBuffer, -42, 120);
        if (!isMounted) return;
        setVadSilences(silences);

        // Update track metadata in store if needed
        if (track.durationMs !== info.durationMs) {
          setAudioTrack({
            ...track,
            durationMs: info.durationMs,
            vadSilences: silences,
          });
        }
      } catch (err) {
        console.warn('[AudioWaveform] Failed to decode audio track:', err);
        if (isMounted) {
          setDecodeError('音频会话已过期或文件丢失');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [track?.url, setAudioTrack]);

  // Scrub audio preview: play a 2.5-second phrase snippet with smooth envelope and animate playhead
  const playScrubGrain = useCallback((timeMs: number, durationSec: number = 2.5) => {
    stopGrainAnim();
    stopOfflineTtsPreview();

    const isOffline = Boolean(
      track?.isOfflineTTS ||
      track?.type === 'offline-tts' ||
      track?.id.startsWith('track-ai-') ||
      track?.id.startsWith('tts-')
    );

    if (isOffline) {
      let accum = 0;
      let targetIdx = 0;
      let targetStartMs = 0;
      for (let i = 0; i < scenes.length; i++) {
        const durMs = (scenes[i].duration || dsl.meta.controls?.interval || 3800);
        if (timeMs < accum + durMs) {
          targetIdx = i;
          targetStartMs = accum;
          break;
        }
        accum += durMs;
        targetIdx = i;
        targetStartMs = accum;
      }
      const targetScene = scenes[targetIdx];
      const fullText = targetScene?.voiceoverScript?.trim() || targetScene?.title || '';
      if (!fullText) return;

      // Smart Sentence Slicing:
      // If the scene is longer and click offset is in the later portion of the scene,
      // split by sentence marks and start speaking from the sentence matching the offset!
      const targetDurMs = (targetScene?.duration || dsl.meta.controls?.interval || 3800);
      const ratioInScene = Math.max(0, Math.min(1, (timeMs - targetStartMs) / Math.max(1, targetDurMs)));

      const sentences = fullText
        .split(/(?<=[。！？；\n,.!?;])\s*/)
        .map((s) => s.trim())
        .filter(Boolean);

      let textToSpeak = fullText;
      if (sentences.length > 1 && ratioInScene > 0.15) {
        const sentenceIdx = Math.min(sentences.length - 1, Math.floor(ratioInScene * sentences.length));
        textToSpeak = sentences.slice(sentenceIdx).join(' ');
      }

      const cfg = getStoredTTSConfig();
      speakWebSpeech(textToSpeak, cfg.speed, undefined, cfg.voice);

      // Animate playhead forward for durationSec smoothly so red laser line visibly progresses
      const startPerfTime = performance.now();
      const maxMs = track?.durationMs || totalDurationMs;
      const targetEndMs = Math.min(maxMs, timeMs + durationSec * 1000);
      const tick = () => {
        const elapsed = performance.now() - startPerfTime;
        if (elapsed < durationSec * 1000) {
          const progress = elapsed / (durationSec * 1000);
          const nextMs = Math.min(targetEndMs, timeMs + progress * (targetEndMs - timeMs));
          setPlayheadMs(nextMs);
          grainAnimRef.current = requestAnimationFrame(tick);
        } else {
          setPlayheadMs(targetEndMs);
          grainAnimRef.current = null;
        }
      };
      grainAnimRef.current = requestAnimationFrame(tick);
      return;
    }

    if (!audioBuffer) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop previous grain to prevent overlap cacophony
      if (activeScrubSourceRef.current) {
        try {
          activeScrubSourceRef.current.stop();
        } catch {}
        activeScrubSourceRef.current = null;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      // Smooth fade-in (20ms) & fade-out (60ms) envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.02);
      gain.gain.setValueAtTime(0.7, now + Math.max(0.1, durationSec - 0.06));
      gain.gain.linearRampToValueAtTime(0.001, now + durationSec);

      source.connect(gain);
      gain.connect(ctx.destination);

      const startOffset = Math.max(0, Math.min(audioBuffer.duration - 0.05, timeMs / 1000));
      source.start(now, startOffset, durationSec);
      activeScrubSourceRef.current = source;

      // Animate playhead forward for durationSec smoothly
      const startPerfTime = performance.now();
      const maxMs = track?.durationMs || totalDurationMs;
      const targetEndMs = Math.min(maxMs, timeMs + durationSec * 1000);
      const totalAnimMs = targetEndMs - timeMs;

      if (totalAnimMs > 50) {
        const tick = () => {
          const elapsed = performance.now() - startPerfTime;
          if (elapsed < durationSec * 1000) {
            const progress = elapsed / (durationSec * 1000);
            const nextMs = Math.min(targetEndMs, timeMs + progress * (targetEndMs - timeMs));
            setPlayheadMs(nextMs);
            grainAnimRef.current = requestAnimationFrame(tick);
          } else {
            setPlayheadMs(targetEndMs);
            grainAnimRef.current = null;
          }
        };
        grainAnimRef.current = requestAnimationFrame(tick);
      }
    } catch {
      // AudioContext policy fallback
    }
  }, [audioBuffer, stopGrainAnim, totalDurationMs, track?.durationMs]);

  // Render Canvas 2D Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, width, height);

    // Horizontal center line
    const midY = height / 2;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    const pixelsPerMs = (width * zoomLevel) / totalDurationMs;

    // Draw VAD silence zones (soft dark-emerald bands)
    vadSilences.forEach((silence) => {
      const xStart = silence.startMs * pixelsPerMs - scrollLeft;
      const xEnd = silence.endMs * pixelsPerMs - scrollLeft;
      if (xEnd > 0 && xStart < width) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(xStart, 0, Math.max(2, xEnd - xStart), height);
        // Center dotted tick
        const xCenter = silence.centerMs * pixelsPerMs - scrollLeft;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(xCenter, 0);
        ctx.lineTo(xCenter, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw Waveform Bars
    if (peaks && peaks.length > 0) {
      const numBuckets = peaks.length / 2;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(0.5, '#06b6d4');
      gradient.addColorStop(1, '#3b82f6');

      ctx.fillStyle = gradient;

      const trackMs = track?.durationMs || totalDurationMs;
      for (let i = 0; i < numBuckets; i++) {
        const bucketTimeMs = (i / numBuckets) * trackMs;
        const x = bucketTimeMs * pixelsPerMs - scrollLeft;
        if (x < -2 || x > width + 2) continue;

        const min = peaks[i * 2];
        const max = peaks[i * 2 + 1];
        const amplitude = Math.max(0.04, (max - min) / 2);
        const barHeight = amplitude * (height * 0.85);

        ctx.fillRect(x, midY - barHeight / 2, Math.max(1, (width * zoomLevel) / numBuckets), barHeight);
      }
    } else if (decodeError) {
      // Decode or fetch error placeholder
      ctx.fillStyle = '#f87171';
      ctx.font = '11px sans-serif';
      ctx.fillText(`⚠️ ${decodeError}，请清除后重新录制或导入音频`, 20, midY + 4);
    } else if (track) {
      // Placeholder while loading
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(t('decodingWaveform'), 20, midY + 4);
    }

    // Draw Scene Piercing Boundaries
    sceneBoundaries.forEach((b, idx) => {
      const x = b.endMs * pixelsPerMs - scrollLeft;
      if (x >= 0 && x <= width) {
        const isDragging = draggingSceneIndex === idx;
        const isSnapped = isDragging && snapFeedback?.snapped;

        ctx.strokeStyle = isSnapped ? '#10b981' : isDragging ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = isDragging ? 2 : 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Boundary Handle Capsule
        ctx.fillStyle = isSnapped ? '#10b981' : isDragging ? '#38bdf8' : '#334155';
        ctx.beginPath();
        ctx.roundRect(x - 5, height - 16, 10, 14, 2);
        ctx.fill();

        // Scene Number Tag
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(x - 22, 2, 20, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`S${idx + 1}`, x - 19, 12);
      }
    });

    // Draw Playhead
    const rawPlayheadX = playheadMs * pixelsPerMs - scrollLeft;
    const playheadX = Math.max(6, Math.min(width - 6, rawPlayheadX));

    if (playheadX >= 0 && playheadX <= width) {
      ctx.save();
      // Laser red glow line
      ctx.shadowColor = 'rgba(244, 63, 94, 0.65)';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top Playhead Pentagon / Flag handle
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX + 6, 7);
      ctx.lineTo(playheadX, 13);
      ctx.lineTo(playheadX - 6, 7);
      ctx.closePath();
      ctx.fill();

      // Center dot in top handle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playheadX, 5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Bottom anchor dot
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(playheadX, height - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Floating time label during scrubbing
      if (isScrubbing) {
        const timeText = `${(playheadMs / 1000).toFixed(2)}s`;
        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        const textW = ctx.measureText(timeText).width;
        const badgeW = textW + 10;
        const badgeH = 18;
        const badgeX = Math.max(4, Math.min(width - badgeW - 4, playheadX - badgeW / 2));
        const badgeY = 16;

        ctx.fillStyle = 'rgba(244, 63, 94, 0.95)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(timeText, badgeX + 5, badgeY + 13);
      }
      ctx.restore();
    }
  }, [
    peaks,
    track,
    height,
    totalDurationMs,
    sceneBoundaries,
    vadSilences,
    zoomLevel,
    scrollLeft,
    playheadMs,
    isScrubbing,
    draggingSceneIndex,
    snapFeedback,
    decodeError,
  ]);

  // Handle Scrubbing and Scene Boundary Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pixelsPerMs = (rect.width * zoomLevel) / totalDurationMs;
    const clickTimeMs = Math.max(0, Math.min(totalDurationMs, (clickX + scrollLeft) / pixelsPerMs));

    stopGrainAnim();
    if (isPlayingAudio && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    }
    userInteractedTimestampRef.current = Date.now();

    // Check proximity to current playhead
    const currentPlayX = playheadMs * pixelsPerMs - scrollLeft;
    const isNearPlayhead = Math.abs(clickX - currentPlayX) <= 12;

    // Check if clicking near scene boundary (within 8px)
    let foundBoundaryIdx: number | null = null;
    if (!isNearPlayhead) {
      sceneBoundaries.forEach((b) => {
        const bx = b.endMs * pixelsPerMs - scrollLeft;
        if (Math.abs(clickX - bx) <= 8) {
          foundBoundaryIdx = b.index;
        }
      });
    }

    if (foundBoundaryIdx !== null) {
      setDraggingSceneIndex(foundBoundaryIdx);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      setIsScrubbing(true);
      scrubStartTimeRef.current = clickTimeMs;
      scrubHasMovedRef.current = false;
      setPlayheadMs(clickTimeMs);
      onSeek?.(clickTimeMs);
      playScrubGrain(clickTimeMs, 2.5); // 2.5s clear sentence preview
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Auto-switch to the scene under this timestamp
      if (onSelectScene && sceneBoundaries.length > 0) {
        let prevEnd = 0;
        for (let i = 0; i < sceneBoundaries.length; i++) {
          if (clickTimeMs >= prevEnd && (clickTimeMs < sceneBoundaries[i].endMs || i === sceneBoundaries.length - 1)) {
            onSelectScene(i);
            break;
          }
          prevEnd = sceneBoundaries[i].endMs;
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const pixelsPerMs = (rect.width * zoomLevel) / totalDurationMs;
    const currentTimeMs = Math.max(0, Math.min(totalDurationMs, (currentX + scrollLeft) / pixelsPerMs));

    if (draggingSceneIndex !== null) {
      // Dragging scene boundary to adjust duration
      const currentBoundary = sceneBoundaries[draggingSceneIndex];
      if (!currentBoundary) return;

      // Previous boundary timestamp
      const prevBoundaryMs = draggingSceneIndex > 0 ? sceneBoundaries[draggingSceneIndex - 1].endMs : 0;
      let targetBoundaryMs = Math.max(prevBoundaryMs + 500, currentTimeMs);

      // Snap to VAD silence pause
      const snap = snapTimeToSilence(targetBoundaryMs, vadSilences, 60);
      if (snap.snapped) {
        targetBoundaryMs = snap.targetMs;
        setSnapFeedback({ snapped: true, deltaMs: snap.deltaMs });
      } else {
        setSnapFeedback(null);
      }

      const newSceneDuration = targetBoundaryMs - prevBoundaryMs;
      updateSceneDuration(draggingSceneIndex, newSceneDuration);
    } else if (isScrubbing) {
      userInteractedTimestampRef.current = Date.now();
      stopGrainAnim();
      const clampedMs = currentTimeMs;
      setPlayheadMs(clampedMs);

      if (scrubStartTimeRef.current !== null && Math.abs(clampedMs - scrubStartTimeRef.current) > 50) {
        scrubHasMovedRef.current = true;
        // While dragging, stop the initial click playback so the drag operation is silent and responsive
        if (activeScrubSourceRef.current) {
          try {
            activeScrubSourceRef.current.stop();
          } catch {}
          activeScrubSourceRef.current = null;
        }
      }
      onSeek?.(clampedMs);
    } else {
      // Dynamic hover cursor
      const currentPlayX = playheadMs * pixelsPerMs - scrollLeft;
      if (Math.abs(currentX - currentPlayX) <= 10) {
        canvas.style.cursor = 'ew-resize';
      } else {
        let nearBoundary = false;
        sceneBoundaries.forEach((b) => {
          const bx = b.endMs * pixelsPerMs - scrollLeft;
          if (Math.abs(currentX - bx) <= 8) {
            nearBoundary = true;
          }
        });
        canvas.style.cursor = nearBoundary ? 'col-resize' : 'pointer';
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    userInteractedTimestampRef.current = Date.now();
    if (isScrubbing && scrubHasMovedRef.current) {
      // User dragged to a new position: on release, preview 2.5s from the final dropped location!
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const pixelsPerMs = (rect.width * zoomLevel) / totalDurationMs;
        const finalMs = Math.max(0, Math.min(totalDurationMs, (currentX + scrollLeft) / pixelsPerMs));
        setPlayheadMs(finalMs);
        playScrubGrain(finalMs, 2.5);

        if (onSelectScene && sceneBoundaries.length > 0) {
          let prevEnd = 0;
          for (let i = 0; i < sceneBoundaries.length; i++) {
            if (finalMs >= prevEnd && (finalMs < sceneBoundaries[i].endMs || i === sceneBoundaries.length - 1)) {
              onSelectScene(i);
              break;
            }
            prevEnd = sceneBoundaries[i].endMs;
          }
        }
      }
    }

    setIsScrubbing(false);
    scrubStartTimeRef.current = null;
    scrubHasMovedRef.current = false;
    setDraggingSceneIndex(null);
    setSnapFeedback(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full border-t border-border bg-background select-none flex flex-col"
      data-testid="audio-waveform-track"
    >
      {/* Waveform Controls Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-panel/80 text-[11px] text-muted-foreground border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary flex items-center gap-1">
            🎵 {t('audioTrack')}: {track?.name || t('mainVoiceoverTrack')}
          </span>
          {track && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {(track.durationMs / 1000).toFixed(1)}s
            </span>
          )}
          {track && (
            <button
              onClick={toggleAudioPreview}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              }`}
              title={isPlayingAudio ? t('pausePreview') : t('playPreviewTitle')}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  <span>{t('pausePreview')}</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{t('playPreview')}</span>
                </>
              )}
            </button>
          )}
          {track && !decodeError && (
            <button
              onClick={handleDownloadAudio}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer bg-muted hover:bg-muted/80 text-foreground border border-border"
              title={t('downloadAudioTitle')}
            >
              <Download className="w-2.5 h-2.5" />
              <span>{t('downloadAudio')}</span>
            </button>
          )}
          {decodeError && (
            <span className="text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
              ⚠️ {t('trackInvalid')}
            </span>
          )}
          {track && decodeError && (
            <button
              onClick={() => removeAudioTrack(track.id)}
              className="text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 px-2 py-0.5 rounded border border-red-800/50 transition cursor-pointer"
              title={t('clearInvalidTrack')}
            >
              {t('clearInvalidTrack')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/60 rounded px-1 py-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="hover:text-foreground p-0.5"
              title={t('zoomOutWaveform')}
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] w-6 text-center">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(10, z + 0.5))}
              className="hover:text-foreground p-0.5"
              title={t('zoomInWaveform')}
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {track && (
            <button
              onClick={() => removeAudioTrack(track.id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10"
              title={t('removeTrack')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Waveform Viewport */}
      <div className="relative w-full overflow-hidden">
        <canvas
          data-testid="waveform-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (!isScrubbing && draggingSceneIndex === null && canvasRef.current) {
              canvasRef.current.style.cursor = 'default';
            }
          }}
          className="w-full block"
        />
      </div>
    </div>
  );
};
