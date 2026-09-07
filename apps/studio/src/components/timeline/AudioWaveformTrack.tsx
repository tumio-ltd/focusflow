import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { extractPeaks, decodeAudioFile, getAudioContext } from '@/services/audio/audioDecoder';
import { analyzeVadSilences, snapTimeToSilence, type SilenceBand } from '@/services/audio/vadAnalyzer';
import { Volume2, VolumeX, ZoomIn, ZoomOut, Trash2, Play, Pause } from 'lucide-react';

interface AudioWaveformTrackProps {
  currentPlayheadMs?: number;
  onSeek?: (timeMs: number) => void;
  height?: number;
}

export const AudioWaveformTrack: React.FC<AudioWaveformTrackProps> = ({
  currentPlayheadMs = 0,
  onSeek,
  height = 72,
}) => {
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
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const toggleAudioPreview = () => {
    if (!track?.url) return;
    if (isPlayingAudio) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(track.url);
        audioPreviewRef.current.onended = () => setIsPlayingAudio(false);
      } else {
        audioPreviewRef.current.src = track.url;
      }
      audioPreviewRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => {
        console.warn('Audio preview play failed:', e);
      });
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

  // Load and decode audio when track URL changes
  useEffect(() => {
    if (!track?.url) {
      setPeaks(null);
      setAudioBuffer(null);
      setVadSilences([]);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const resp = await fetch(track.url);
        const blob = await resp.blob();
        const info = await decodeAudioFile(blob);
        if (!isMounted) return;

        setAudioBuffer(info.audioBuffer);
        const extracted = await extractPeaks(info.audioBuffer, 1200);
        if (!isMounted) return;
        setPeaks(extracted);

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
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [track?.url]);

  // Scrub audio preview: play a 60ms click / tone grain
  const playScrubGrain = useCallback((timeMs: number) => {
    if (!audioBuffer) return;
    try {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      source.connect(gain);
      gain.connect(ctx.destination);

      const startOffset = Math.max(0, Math.min(audioBuffer.duration, timeMs / 1000));
      source.start(0, startOffset, 0.06);
    } catch {
      // AudioContext policy fallback
    }
  }, [audioBuffer]);

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
    } else if (track) {
      // Placeholder while loading
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('波形正在离屏解码中...', 20, midY + 4);
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
    const playheadX = currentPlayheadMs * pixelsPerMs - scrollLeft;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top Playhead Diamond
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(playheadX, 8);
      ctx.lineTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.closePath();
      ctx.fill();
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
    currentPlayheadMs,
    draggingSceneIndex,
    snapFeedback,
  ]);

  // Handle Scrubbing and Scene Boundary Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pixelsPerMs = (rect.width * zoomLevel) / totalDurationMs;
    const clickTimeMs = (clickX + scrollLeft) / pixelsPerMs;

    // Check if clicking near any scene boundary (within 8px)
    let foundBoundaryIdx: number | null = null;
    sceneBoundaries.forEach((b) => {
      const bx = b.endMs * pixelsPerMs - scrollLeft;
      if (Math.abs(clickX - bx) <= 8) {
        foundBoundaryIdx = b.index;
      }
    });

    if (foundBoundaryIdx !== null) {
      setDraggingSceneIndex(foundBoundaryIdx);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      setIsScrubbing(true);
      onSeek?.(clickTimeMs);
      playScrubGrain(clickTimeMs);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const pixelsPerMs = (rect.width * zoomLevel) / totalDurationMs;
    const currentTimeMs = (currentX + scrollLeft) / pixelsPerMs;

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
      const clampedMs = Math.max(0, Math.min(totalDurationMs, currentTimeMs));
      onSeek?.(clampedMs);
      playScrubGrain(clampedMs);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsScrubbing(false);
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
            🎵 音频轨: {track?.name || '主解说声道'}
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
              title={isPlayingAudio ? '暂停试听' : '播放试听录音'}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  <span>暂停试听</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>播放试听</span>
                </>
              )}
            </button>
          )}
          {snapFeedback?.snapped && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              🧲 已磁吸至停顿带 ({snapFeedback.deltaMs > 0 ? `+${snapFeedback.deltaMs}` : snapFeedback.deltaMs}ms)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/60 rounded px-1 py-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="hover:text-foreground p-0.5"
              title="缩小波形视口"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] w-6 text-center">{zoomLevel}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(10, z + 0.5))}
              className="hover:text-foreground p-0.5"
              title="放大波形视口"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {track && (
            <button
              onClick={() => removeAudioTrack(track.id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10"
              title="移除音轨"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Waveform Viewport */}
      <div className="relative w-full overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full block"
        />
      </div>
    </div>
  );
};
