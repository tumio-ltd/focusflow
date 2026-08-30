import React, { useEffect, useRef, useState } from 'react';
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

export interface AudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dsl: FocusFlowDSL;
  initialSceneIndex?: number;
}

export function AudienceModal({
  isOpen,
  onClose,
  dsl,
  initialSceneIndex = 0,
}: AudienceModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(initialSceneIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalScenes = dsl.scenes?.length || 1;
  const currentScene = dsl.scenes?.[currentSceneIdx] || dsl.scenes?.[0];

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const player = new FocusFlowPlayer({
      container: containerRef.current,
      dsl,
      debug: false,
      onSceneChange: (index: number) => {
        setCurrentSceneIdx(index);
      },
    });

    player.init().then(() => {
      playerRef.current = player;
      if (initialSceneIndex > 0) {
        player.goToScene(initialSceneIndex);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        player.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        player.prev();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      player.destroy();
      playerRef.current = null;
    };
  }, [isOpen, dsl, initialSceneIndex, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleNext = () => {
    playerRef.current?.next();
  };

  const handlePrev = () => {
    playerRef.current?.prev();
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    playerRef.current.togglePlay();
    setIsPlaying(!isPlaying);
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="audience-modal"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* 1. 顶部精简微缩信息栏 */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-white">
            {String(currentSceneIdx + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}
          </span>
          <div className="h-3 w-px bg-slate-800" />
          <span className="text-xs text-slate-300 font-medium max-w-sm truncate">
            {currentScene?.title}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
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
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-rose-400"
            title="退出演示 (ESC)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. 核心 60FPS 渲染容器 */}
      <div ref={containerRef} className="w-full h-full relative" />

      {/* 3. 底部半透明悬浮演播控制浮岛 */}
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
    </div>
  );
}
