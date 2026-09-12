import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusFlowPlayer } from '@focusflow/player';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Eye, 
  EyeOff, 
} from 'lucide-react';
import { PlaybackIslandReact } from '@/components/playback/PlaybackIslandReact';
import { Button } from '@/components/ui';
import { speakWebSpeech, stopWebSpeech, getStoredTTSConfig } from '@/services/audio';
import { sanitizeDSL } from '@/stores/useProjectStore';
import { useEditorStore } from '@/stores/useEditorStore';

export interface AudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dsl: FocusFlowDSL;
  initialSceneIndex?: number;
  isRecording?: boolean;
  recordingElapsed?: number;
  onFinishRecording?: () => void;
}

export function AudienceModal({
  isOpen,
  onClose,
  dsl,
  initialSceneIndex = 0,
  isRecording = false,
  recordingElapsed = 0,
  onFinishRecording,
}: AudienceModalProps) {
  const { t } = useTranslation('export');
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(initialSceneIndex);
  const currentSceneIdxRef = useRef(initialSceneIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { playbackHudMode, cyclePlaybackHudMode, setPlaybackHudMode } = useEditorStore();

  // 拓扑自愈：过滤掉可能遗留的悬空孤儿路径与失效引用
  const sanitizedDsl = React.useMemo(() => sanitizeDSL(dsl), [dsl]);

  const dslRef = useRef(sanitizedDsl);
  dslRef.current = sanitizedDsl;

  const totalScenes = sanitizedDsl.scenes?.length || 1;
  const currentScene = sanitizedDsl.scenes?.[currentSceneIdx] || sanitizedDsl.scenes?.[0];

  // 分幕时长与整场时长高精度计算
  const getSceneDurationMs = useCallback((idx: number) => {
    const scene = sanitizedDsl.scenes?.[idx];
    if (scene && typeof scene.duration === 'number' && scene.duration > 0) {
      return scene.duration > 100 ? scene.duration : scene.duration * 1000;
    }
    return sanitizedDsl.meta?.controls?.interval || 3800;
  }, [sanitizedDsl]);

  const totalDurationMs = React.useMemo(() => {
    const scenes = sanitizedDsl.scenes || [];
    if (scenes.length === 0) return 3800;
    return scenes.reduce((sum, _, i) => sum + getSceneDurationMs(i), 0);
  }, [sanitizedDsl, getSceneDurationMs]);

  const currentSceneDurationMs = getSceneDurationMs(currentSceneIdx);

  const currentSceneStartMs = React.useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentSceneIdx; i++) {
      sum += getSceneDurationMs(i);
    }
    return sum;
  }, [currentSceneIdx, getSceneDurationMs]);

  const [sceneElapsedMs, setSceneElapsedMs] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  // requestAnimationFrame 高精度时钟推演
  useEffect(() => {
    if (!isOpen || !isPlaying) {
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
  }, [isOpen, isPlaying, currentSceneDurationMs]);

  const totalElapsedMs = Math.min(totalDurationMs, currentSceneStartMs + sceneElapsedMs);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 鼠标活跃度与 3 秒静止平滑淡出定时器
  const [isUserActive, setIsUserActive] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserActivity = useCallback(() => {
    setIsUserActive(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsUserActive(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // 每次打开弹窗或 initialSceneIndex 变更时，重置当前分幕索引
  useEffect(() => {
    if (isOpen) {
      setCurrentSceneIdx(initialSceneIndex);
      currentSceneIdxRef.current = initialSceneIndex;
      setIsPlaying(false);
      isPlayingRef.current = false;
      setSceneElapsedMs(0);
      setIsUserActive(true);
    }
  }, [isOpen, initialSceneIndex]);

  const playSceneTTS = useCallback((sceneIndex: number) => {
    const activeDsl = dslRef.current;
    const cfg = getStoredTTSConfig();
    const mainTrack = activeDsl.audio?.tracks?.[0];

    // 若工程中无任何音轨、或音轨处于静音/0音量状态，绝对不发声（删除音轨后彻底静音）
    if (!mainTrack || mainTrack.muted || (mainTrack.volume ?? 1) <= 0) {
      return;
    }

    const isOfflineVoice = Boolean(
      mainTrack.isOfflineTTS ||
      mainTrack.type === 'offline-tts'
    );
    const isBgmWithVoiceover = Boolean(
      mainTrack.type === 'music' || mainTrack.isBackgroundBGM
    );

    if (isOfflineVoice || isBgmWithVoiceover) {
      const scene = activeDsl.scenes?.[sceneIndex];
      const text = scene?.voiceoverScript?.trim() || (isOfflineVoice ? scene?.title : '');
      if (text) {
        speakWebSpeech(text, cfg.speed, undefined, cfg.voice);
      }
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current) return;
    const nextPlaying = !isPlayingRef.current;
    playerRef.current.togglePlay();
    setIsPlaying(nextPlaying);
    isPlayingRef.current = nextPlaying;
    lastTickTimeRef.current = performance.now();

    if (nextPlaying) {
      playSceneTTS(currentSceneIdxRef.current);
    } else {
      stopWebSpeech();
    }
  }, [playSceneTTS]);

  const handleNext = useCallback(() => {
    stopWebSpeech();
    setSceneElapsedMs(0);
    lastTickTimeRef.current = performance.now();
    playerRef.current?.next();
  }, []);

  const handlePrev = useCallback(() => {
    stopWebSpeech();
    setSceneElapsedMs(0);
    lastTickTimeRef.current = performance.now();
    playerRef.current?.prev();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // 核心 Player 实例生命周期：仅在弹窗打开或 DSL 结构变更时挂载一次，绝对不在切幕或播放状态变化时反复销毁重建
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    try {
      const player = new FocusFlowPlayer({
        container: containerRef.current,
        dsl: sanitizedDsl,
        initialSceneIndex,
        debug: false,
        showControls: false,
        enableKeyboard: false, // 由 AudienceModal 统一拦截并调度快捷键，防止与播放内核双重触发
        onSceneChange: (index: number) => {
          setCurrentSceneIdx(index);
          currentSceneIdxRef.current = index;
          setSceneElapsedMs(0);
          lastTickTimeRef.current = performance.now();
          if (isPlayingRef.current) {
            playSceneTTS(index);
          }
        },
      });

      player.on?.('playStateChange', (playing: boolean) => {
        setIsPlaying(playing);
        isPlayingRef.current = playing;
        if (!playing) {
          stopWebSpeech();
        }
      });

      player.on?.('ended', () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        stopWebSpeech();
        if (isRecording) {
          onFinishRecording?.();
        }
      });

      playerRef.current = player;
    } catch (err) {
      console.warn('Audience player init error:', err);
    }

    return () => {
      stopWebSpeech();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [isOpen, sanitizedDsl, initialSceneIndex, playSceneTTS, isRecording, onFinishRecording]);

  // 录制模式下自动从第 1 幕起播
  useEffect(() => {
    if (!isOpen || !isRecording) return;
    const timer = setTimeout(() => {
      if (playerRef.current && !isPlayingRef.current) {
        handleTogglePlay();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [isOpen, isRecording, handleTogglePlay]);

  const handleClose = useCallback(() => {
    stopWebSpeech();
    if (playbackHudMode === 'zen') {
      setPlaybackHudMode('full');
    }
    onClose();
  }, [playbackHudMode, setPlaybackHudMode, onClose]);

  // 全屏演播键盘快捷键监听
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRecording) {
          stopWebSpeech();
          onFinishRecording?.();
        } else {
          handleClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        cyclePlaybackHudMode();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, isRecording, onFinishRecording, handleTogglePlay, handleNext, handlePrev, toggleFullscreen, cyclePlaybackHudMode]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="audience-modal"
      onMouseMove={handleUserActivity}
      onMouseDown={handleUserActivity}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* 1. 顶部右侧控制按钮：录制模式下彻底隐藏，确保捕获视频 100% 纯净 */}
      {!isRecording && (
        <div
          className={`absolute top-4 right-6 flex items-center gap-2 pointer-events-auto z-30 transition-opacity duration-300 ${
            playbackHudMode === 'zen'
              ? (isUserActive ? 'opacity-90 hover:opacity-100' : 'opacity-0 pointer-events-none')
              : (isUserActive || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none')
          }`}
        >
          {/* HUD 模式切换与恢复按钮：任何模式下鼠标活动时均可在右上角直接点击切换或恢复，彻底消除“找不回控制栏” */}
          <Button
            size="icon"
            variant="ghost"
            data-testid="hud-mode-toggle-top"
            onClick={cyclePlaybackHudMode}
            className={`w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border text-slate-300 hover:text-white transition-all ${
              playbackHudMode === 'zen'
                ? 'border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/20 shadow-lg'
                : 'border-slate-800'
            }`}
            title={
              playbackHudMode === 'zen'
                ? '恢复 HUD 控制栏 (快捷键 H)'
                : playbackHudMode === 'minimal'
                ? '切换 HUD 模式: 沉浸纯净 (快捷键 H)'
                : '切换 HUD 模式: 微缩胶囊 (快捷键 H)'
            }
          >
            {playbackHudMode === 'zen' ? (
              <EyeOff className="w-4 h-4 text-cyan-400 animate-pulse" />
            ) : (
              <Eye className={`w-4 h-4 ${playbackHudMode === 'minimal' ? 'text-amber-400' : 'text-cyan-400'}`} />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white"
            title="全屏切换 (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            data-testid="close-audience-btn"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-rose-400"
            title="退出演示 (ESC)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 2. 核心 60FPS 渲染容器 */}
      <div ref={containerRef} className="w-full h-full relative flex-1 min-w-0 min-h-0" />

      {/* 3. 全场景统一演播控制浮岛 (PlaybackIslandReact) */}
      <PlaybackIslandReact
        isPlaying={isPlaying}
        currentSceneIdx={currentSceneIdx}
        totalScenes={totalScenes}
        currentSceneTitle={currentScene?.title}
        sceneElapsedMs={sceneElapsedMs}
        sceneDurationMs={currentSceneDurationMs}
        hudMode={playbackHudMode}
        isRecording={isRecording}
        isUserActive={isUserActive}
        elementCount={(currentScene?.activeElements.boxes || []).length}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onCycleHudMode={cyclePlaybackHudMode}
        onRestoreFull={() => setPlaybackHudMode('full')}
      />

      {/* 4. 开源版官方微型水印角标 (FocusFlow Official Watermark Badge · 录制出片与演播统一挂载) */}
      <a
        href="https://tumio-ltd.github.io/focusflow/"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="focusflow-watermark-badge"
        className={`fixed z-30 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-sky-500/22 shadow-lg backdrop-blur-md text-decoration-none select-none transition-all duration-200 hover:bg-slate-900/95 hover:border-sky-400/55 hover:-translate-y-0.5 group ${
          isRecording
            ? 'bottom-6 right-6 opacity-85 pointer-events-none'
            : 'bottom-6 right-6 max-sm:bottom-[74px] max-sm:right-3 opacity-80 hover:opacity-100'
        }`}
        title="FocusFlow · 动效架构演进演示 (点击探索)"
      >
        <div className="w-5 h-5 rounded-md bg-sky-500/12 border border-sky-500/25 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 group-hover:border-sky-500/45 transition-colors">
          <svg viewBox="0 0 128 128" className="w-3.5 h-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ffAudienceWatermarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="ffAudienceWatermarkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <g stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
              <path d="M 40 24 L 28 24 A 4 4 0 0 0 24 28 L 24 40" />
              <path d="M 88 24 L 100 24 A 4 4 0 0 1 104 28 L 104 40" />
              <path d="M 24 88 L 24 100 A 4 4 0 0 0 28 104 L 40 104" />
              <path d="M 104 88 L 104 100 A 4 4 0 0 1 100 104 L 88 104" />
            </g>
            <path d="M 28 96 C 52 96, 56 32, 100 32" stroke="url(#ffAudienceWatermarkGrad)" strokeWidth="11" strokeLinecap="round" filter="url(#ffAudienceWatermarkGlow)" />
            <circle cx="100" cy="32" r="7" fill="#ffffff" filter="url(#ffAudienceWatermarkGlow)" />
          </svg>
        </div>
        <span className="flex items-baseline gap-1 leading-none whitespace-nowrap">
          <span className="text-[10.5px] font-normal text-slate-400 max-sm:hidden">Powered by</span>
          <span className="text-[11px] font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            FocusFlow
          </span>
        </span>
      </a>
    </div>
  );
}
