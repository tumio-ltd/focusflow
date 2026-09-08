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
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui';
import { speakWebSpeech, stopWebSpeech, getStoredTTSConfig } from '@/services/audio';
import { sanitizeDSL } from '@/stores/useProjectStore';

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

  // 每次打开弹窗或 initialSceneIndex 变更时，重置当前分幕索引
  useEffect(() => {
    if (isOpen) {
      setCurrentSceneIdx(initialSceneIndex);
      currentSceneIdxRef.current = initialSceneIndex;
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [isOpen, initialSceneIndex]);

  // 拓扑自愈：过滤掉可能遗留的悬空孤儿路径与失效引用
  const sanitizedDsl = React.useMemo(() => sanitizeDSL(dsl), [dsl]);

  const dslRef = useRef(sanitizedDsl);
  dslRef.current = sanitizedDsl;

  const totalScenes = sanitizedDsl.scenes?.length || 1;
  const currentScene = sanitizedDsl.scenes?.[currentSceneIdx] || sanitizedDsl.scenes?.[0];

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

    if (nextPlaying) {
      playSceneTTS(currentSceneIdxRef.current);
    } else {
      stopWebSpeech();
    }
  }, [playSceneTTS]);

  const handleNext = useCallback(() => {
    stopWebSpeech();
    playerRef.current?.next();
  }, []);

  const handlePrev = useCallback(() => {
    stopWebSpeech();
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

  // 全屏演播键盘快捷键监听
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopWebSpeech();
        if (isRecording) {
          onFinishRecording?.();
        } else {
          onClose();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
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
  }, [isOpen, onClose, isRecording, onFinishRecording, handleTogglePlay, handleNext, handlePrev, toggleFullscreen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="audience-modal"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* 1. 顶部右侧控制按钮：录制模式下彻底隐藏，确保捕获视频 100% 纯净 */}
      {!isRecording && (
        <div className="absolute top-4 right-6 flex items-center gap-2 pointer-events-auto z-30">
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
            onClick={() => {
              stopWebSpeech();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-rose-400"
            title="退出演示 (ESC)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 2. 场景指示微缩胶囊 (下移至左下角，彻底避开顶部架构图主标题与技术栈标签) */}
      <div
        data-testid="audience-scene-pill"
        className="absolute bottom-6 left-6 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 pointer-events-auto z-30 shadow-lg"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-mono font-semibold text-white">
          {String(currentSceneIdx + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
        </span>
        <div className="h-3 w-px bg-slate-800" />
        <span className="text-xs text-slate-300 font-medium max-w-sm truncate">
          {currentScene?.title}
        </span>
      </div>

      {/* 3. 核心 60FPS 渲染容器 */}
      <div ref={containerRef} className="w-full h-full relative" />

      {/* 3. 底部半透明悬浮演播控制浮岛 (录制模式下自动隐匿，保证录出纯净画面) */}
      {!isRecording && (
        <div className="absolute bottom-6 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800/80 shadow-2xl z-30">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentSceneIdx === 0}
            className="h-8 w-8 text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="cyan"
            onClick={handleTogglePlay}
            className="h-9 w-9 rounded-xl"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            disabled={currentSceneIdx === totalScenes - 1}
            className="h-8 w-8 text-slate-300 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>{(currentScene?.activeElements.boxes || []).length} 图元</span>
          </div>
        </div>
      )}
    </div>
  );
}
