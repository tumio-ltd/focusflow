import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FocusFlowPlayer, type PlaybackHudMode } from '@focusflow/player';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { PlaybackIslandReact } from '@/components/playback/PlaybackIslandReact';
import { sanitizeDSL } from '@/stores/useProjectStore';
import { Maximize2, Minimize2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { speakWebSpeech, stopWebSpeech, getStoredTTSConfig } from '@/services/audio';
import { getSceneVoiceoverScript, ARCHITECTURE_TEMPLATES } from '@/templates';

export interface AudiencePlayerViewProps {
  projectId?: string;
  slug?: string;
  isEmbed?: boolean;
}

export const AudiencePlayerView: React.FC<AudiencePlayerViewProps> = ({
  projectId,
  slug,
  isEmbed = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);

  const [dsl, setDsl] = useState<FocusFlowDSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const currentSceneIdxRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const [playbackHudMode, setPlaybackHudMode] = useState<PlaybackHudMode>('full');
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  // 1. Fetch DSL from Cloud API, Shortlink, or fallback
  useEffect(() => {
    let isCancelled = false;

    async function loadPresentationDSL() {
      setLoading(true);
      setError(null);

      try {
        let targetProjectId = projectId;

        // Step A: If slug provided, resolve destination targetUrl via shortlink API
        if (slug) {
          const res = await fetch(`/api/platform/shortlinks/resolve/${slug}`);
          if (!res.ok) {
            throw new Error(`Shortlink '${slug}' not found or expired (${res.status})`);
          }
          const data = await res.json();
          const targetUrl: string = data.targetUrl || '';
          
          // Extract projectId from target URL (e.g. /share/prj_123 or ?project=prj_123)
          const shareMatch = targetUrl.match(/\/share\/([a-zA-Z0-9_-]+)/);
          if (shareMatch) {
            targetProjectId = shareMatch[1];
          } else {
            const projectMatch = targetUrl.match(/\/project\/([a-zA-Z0-9_-]+)/);
            if (projectMatch) {
              targetProjectId = projectMatch[1];
            }
          }
        }

        // Step B: Fetch project details & DSL from cloud API
        if (targetProjectId) {
          const projectRes = await fetch(`/api/focusflow/projects/${targetProjectId}`);
          if (projectRes.ok) {
            const projectData = await projectRes.json();
            const rawDsl = typeof projectData.dslJson === 'string'
              ? JSON.parse(projectData.dslJson)
              : projectData.dslJson;

            if (!isCancelled && rawDsl) {
              setDsl(sanitizeDSL(rawDsl));
              setLoading(false);
              return;
            }
          }
        }

        // Step C: Fallback to sample template if running standalone or offline
        if (!isCancelled) {
          setDsl(sanitizeDSL(ARCHITECTURE_TEMPLATES[0].dsl));
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load presentation.');
          setLoading(false);
        }
      }
    }

    loadPresentationDSL();

    return () => {
      isCancelled = true;
    };
  }, [projectId, slug]);

  const sanitizedDsl = useMemo(() => (dsl ? sanitizeDSL(dsl) : null), [dsl]);
  const totalScenes = sanitizedDsl?.scenes?.length || 1;
  const currentScene = sanitizedDsl?.scenes?.[currentSceneIdx] || sanitizedDsl?.scenes?.[0];

  const getSceneDurationMs = useCallback(
    (idx: number) => {
      if (!sanitizedDsl) return 3800;
      const scene = sanitizedDsl.scenes?.[idx];
      if (scene && typeof scene.duration === 'number' && scene.duration > 0) {
        return scene.duration > 100 ? scene.duration : scene.duration * 1000;
      }
      return sanitizedDsl.meta?.controls?.interval || 3800;
    },
    [sanitizedDsl]
  );

  const currentSceneDurationMs = getSceneDurationMs(currentSceneIdx);

  // User activity tracker for auto-hiding controls
  const handleMouseMove = useCallback(() => {
    setIsUserActive(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsUserActive(false);
    }, 2500);
  }, []);

  // requestAnimationFrame Clock for real-time progress bar
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTickTimeRef.current = null;
      return;
    }

    lastTickTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (lastTickTimeRef.current !== null) {
        const delta = now - lastTickTimeRef.current;
        lastTickTimeRef.current = now;
        setSceneElapsedMs((prev) => Math.min(prev + delta, currentSceneDurationMs));
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentSceneDurationMs]);

  // Voiceover TTS speaker for active scene
  const playSceneTTS = useCallback(
    (sceneIndex: number) => {
      if (!sanitizedDsl) return;
      const cfg = getStoredTTSConfig();
      const mainTrack = sanitizedDsl.audio?.tracks?.[0];

      if (!mainTrack || mainTrack.muted || (mainTrack.volume ?? 1) <= 0) {
        return;
      }

      const scene = sanitizedDsl.scenes?.[sceneIndex];
      const text = scene ? getSceneVoiceoverScript(scene, 'zh') : '';
      if (text) {
        speakWebSpeech(text, cfg.speed, undefined, cfg.voice);
      }
    },
    [sanitizedDsl]
  );

  // 2. Instantiate FocusFlowPlayer once DOM container and DSL are ready
  useEffect(() => {
    if (!playerContainerRef.current || !sanitizedDsl) return;

    try {
      const player = new FocusFlowPlayer({
        container: playerContainerRef.current,
        dsl: sanitizedDsl,
        initialSceneIndex: 0,
        showControls: false,
        enableKeyboard: false,
        autoplay: false,
        onSceneChange: (sceneIndex: number) => {
          setCurrentSceneIdx(sceneIndex);
          currentSceneIdxRef.current = sceneIndex;
          setSceneElapsedMs(0);
          lastTickTimeRef.current = performance.now();
          if (isPlayingRef.current) {
            playSceneTTS(sceneIndex);
          }
        },
        onPlayStateChange: (playing: boolean) => {
          setIsPlaying(playing);
          isPlayingRef.current = playing;
          if (!playing) {
            stopWebSpeech();
          }
        },
        onEnded: () => {
          setIsPlaying(false);
          isPlayingRef.current = false;
          stopWebSpeech();
        },
      });

      playerRef.current = player;
    } catch (err) {
      console.warn('FocusFlow audience player init error:', err);
    }

    return () => {
      stopWebSpeech();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [sanitizedDsl, playSceneTTS]);

  // Playback Control Handlers
  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    const nextState = !isPlaying;
    playerRef.current.togglePlay();
    setIsPlaying(nextState);
    isPlayingRef.current = nextState;
    lastTickTimeRef.current = performance.now();

    if (nextState) {
      playSceneTTS(currentSceneIdxRef.current);
    } else {
      stopWebSpeech();
    }
  }, [isPlaying, playSceneTTS]);

  const handlePrev = useCallback(() => {
    stopWebSpeech();
    setSceneElapsedMs(0);
    lastTickTimeRef.current = performance.now();
    playerRef.current?.prev();
  }, []);

  const handleNext = useCallback(() => {
    stopWebSpeech();
    setSceneElapsedMs(0);
    lastTickTimeRef.current = performance.now();
    playerRef.current?.next();
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setPlaybackHudMode((prev) => (prev === 'full' ? 'minimal' : prev === 'minimal' ? 'zen' : 'full'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleNext, handlePrev, handleToggleFullscreen]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
        <h2 className="text-lg font-medium text-neutral-200">FocusFlow Presentation</h2>
        <p className="text-sm text-neutral-500 mt-1">Loading scene topology & assets...</p>
      </div>
    );
  }

  if (error || !sanitizedDsl) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-semibold text-neutral-100">Presentation Unavailable</h2>
        <p className="text-sm text-neutral-400 mt-2 max-w-md">
          {error || 'The requested presentation could not be loaded or has expired.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="w-screen h-screen bg-neutral-950 relative overflow-hidden select-none"
    >
      {/* 1. Underlying Native FocusFlow Player Canvas */}
      <div ref={playerContainerRef} className="w-full h-full relative" />

      {/* 2. Sleek Floating Header Badge (auto-fades when inactive) */}
      <div
        className={`absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-30 ${
          isUserActive ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 px-3.5 py-1.5 rounded-full pointer-events-auto shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-neutral-200">
            {sanitizedDsl.meta?.title || 'FocusFlow Keynote'}
          </span>
          <span className="text-neutral-600 text-xs">•</span>
          <span className="text-xs text-neutral-400">
            {currentScene?.title || `Scene ${currentSceneIdx + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {!isEmbed && (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-full transition shadow-lg"
            >
              <span>Create with FocusFlow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="p-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white backdrop-blur-md border border-neutral-800 transition shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Floating Bottom Playback Island (WBS 10.2.1) */}
      <div
        className={`absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${
          isUserActive || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="pointer-events-auto">
          <PlaybackIslandReact
            isPlaying={isPlaying}
            currentSceneIdx={currentSceneIdx}
            totalScenes={totalScenes}
            currentSceneTitle={currentScene?.title}
            sceneElapsedMs={sceneElapsedMs}
            sceneDurationMs={currentSceneDurationMs}
            hudMode={playbackHudMode}
            isUserActive={isUserActive}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrev}
            onNext={handleNext}
            onCycleHudMode={() =>
              setPlaybackHudMode((prev) => (prev === 'full' ? 'minimal' : prev === 'minimal' ? 'zen' : 'full'))
            }
          />
        </div>
      </div>

      {/* 4. Powered by FocusFlow subtle watermark in embed mode */}
      {isEmbed && (
        <a
          href="https://focusflow.io"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-2 right-3 text-[10px] text-neutral-500 hover:text-neutral-400 transition z-20 pointer-events-auto bg-black/40 backdrop-blur px-2 py-0.5 rounded"
        >
          Powered by FocusFlow
        </a>
      )}
    </div>
  );
};
