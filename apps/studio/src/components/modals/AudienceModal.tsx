import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusFlowPlayer } from '@focusflow/player';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  Layers,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
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
      mainTrack.type === 'offline-tts' ||
      mainTrack.id?.startsWith('track-ai-') ||
      mainTrack.id?.startsWith('tts-')
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
      if (initialSceneIndex > 0) {
        player.goToStep(initialSceneIndex);
      }
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
      <div ref={containerRef} className="w-full h-full relative" />

      {/* 3. 底部居中统一 MVP 演播控制胶囊 (完整态 full 下展示，录制模式下物理剥离 0 DOM) */}
      {!isRecording && playbackHudMode === 'full' && (
        <div
          data-testid="audience-controls"
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/90 shadow-2xl z-30 transition-all duration-300 max-w-[92vw] ${
            isUserActive || !isPlaying ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
          }`}
        >
          {/* 上一幕 */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentSceneIdx === 0}
            className="h-8 w-8 text-slate-300 hover:text-white rounded-full"
            title="上一幕 (ArrowLeft / PageUp)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* 播放 / 暂停 */}
          <Button
            size="icon"
            variant="cyan"
            onClick={handleTogglePlay}
            className="h-8 w-8 rounded-full shadow-sm"
            title={isPlaying ? '暂停 (Space)' : '自动演播 (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </Button>

          {/* 下一幕 */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            disabled={currentSceneIdx === totalScenes - 1}
            className="h-8 w-8 text-slate-300 hover:text-white rounded-full"
            title="下一幕 (ArrowRight / PageDown)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-slate-800" />

          {/* 分幕序号与标题指示器 */}
          <div data-testid="audience-scene-pill" className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-white">
              {String(currentSceneIdx + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
            </span>
            <div className="h-3 w-px bg-slate-800" />
            <span className="text-xs text-slate-300 font-medium max-w-[160px] truncate" title={currentScene?.title}>
              {currentScene?.title}
            </span>
          </div>

          {/* 动态时间刻度微区域：
              仅在自动演播推演中 (isPlaying=true) 动态展开，毫秒级秒表精准掌控排练节奏；
              手动单步交互态 (isPlaying=false) 下 100% 严格隐藏，消除无效时间焦虑！ */}
          {isPlaying && (
            <>
              <div className="h-4 w-px bg-slate-800" />
              <div
                data-testid="audience-scene-timer"
                className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/20 px-2.5 py-0.5 rounded-full animate-in fade-in zoom-in-95 duration-200"
                title={`当前分幕: ${formatTime(sceneElapsedMs)} / ${formatTime(currentSceneDurationMs)} · 整场累计: ${formatTime(totalElapsedMs)} / ${formatTime(totalDurationMs)}`}
              >
                <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{formatTime(sceneElapsedMs)} / {formatTime(currentSceneDurationMs)}</span>
              </div>
            </>
          )}

          <div className="h-4 w-px bg-slate-800" />

          {/* 图元统计 */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono hidden md:flex">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>{(currentScene?.activeElements.boxes || []).length}</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* HUD 模式切换按钮 */}
          <Button
            size="icon"
            variant="ghost"
            data-testid="hud-mode-toggle"
            onClick={cyclePlaybackHudMode}
            className="h-8 w-8 text-slate-300 hover:text-white rounded-full"
            title="切换 HUD 模式 (H: 完整/胶囊/沉浸)"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
          </Button>
        </div>
      )}

      {/* 4. 微缩胶囊态 (minimal) */}
      {!isRecording && playbackHudMode === 'minimal' && (
        <div
          data-testid="audience-hud-minimal"
          className={`absolute bottom-6 right-6 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-xl z-30 transition-opacity duration-300 ${
            isUserActive || !isPlaying ? 'opacity-90 hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ height: '32px' }}
        >
          <button
            onClick={() => setPlaybackHudMode('full')}
            className="flex items-center gap-2 hover:text-white transition group cursor-pointer"
            title="点击展开完整控制栏 (快捷键 H)"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[12px] font-mono font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
              {isPlaying
                ? `${formatTime(sceneElapsedMs)} / ${formatTime(currentSceneDurationMs)} · `
                : ''}
              {String(currentSceneIdx + 1).padStart(2, '0')}/{String(totalScenes).padStart(2, '0')}
            </span>
          </button>
          <div className="h-3 w-px bg-slate-800" />
          <button
            onClick={() => setPlaybackHudMode('full')}
            className="text-slate-400 hover:text-cyan-400 transition p-0.5 cursor-pointer"
            title="展开为完整控制栏"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid="hud-mode-toggle"
            onClick={cyclePlaybackHudMode}
            className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer"
            title="切换 HUD 模式: 沉浸纯净 (快捷键 H)"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      )}

      {/* 5. 沉浸纯净态 (zen) 下的底部感应区与唤醒恢复浮岛：
          鼠标移动或滑向屏幕底部时即刻柔和现身，点击直接一键恢复完整控制栏；静止 3 秒后再度平滑淡出 */}
      {!isRecording && playbackHudMode === 'zen' && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-auto"
            onMouseMove={handleUserActivity}
          />
          <button
            data-testid="zen-restore-hud-btn"
            onClick={() => setPlaybackHudMode('full')}
            className={`absolute bottom-6 flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/40 hover:border-cyan-400 shadow-2xl z-30 transition-all duration-300 text-xs font-medium cursor-pointer ${
              isUserActive ? 'opacity-90 hover:opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
            title="点击恢复演播控制栏 (或按键盘 H)"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>纯净演播中 · 点击恢复控制栏 (快捷键 H)</span>
          </button>
        </>
      )}
    </div>
  );
}
