import React, { ReactNode } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Hand 
} from 'lucide-react';
import { useCanvasGesture } from '@/hooks/useCanvasGesture';
import { Button, Tooltip } from '@/components/ui';

export interface InfiniteCanvasProps {
  children?: ReactNode;
  contentWidth?: number;
  contentHeight?: number;
  className?: string;
}

export function InfiniteCanvas({
  children,
  contentWidth = 1920,
  contentHeight = 1080,
  className = '',
}: InfiniteCanvasProps) {
  const {
    containerRef,
    transform,
    zoomTo,
    fitToScreen,
    resetZoom100,
    isPanning,
    isSpacePressed,
    pointerHandlers,
  } = useCanvasGesture({
    contentWidth,
    contentHeight,
  });

  const zoomPercent = Math.round(transform.scale * 100);

  return (
    <div
      ref={containerRef}
      data-testid="infinite-canvas-container"
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 touch-none ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${className}`}
      {...pointerHandlers}
    >
      {/* 1. 科技点阵背景网格 (Grid Matrix) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${transform.x % 24}px ${transform.y % 24}px`,
        }}
      />

      {/* 2. 核心 GPU 几何变换视口层 (Transform Content Layer) */}
      <div
        className="absolute origin-top-left will-change-transform transition-transform duration-75 ease-out shadow-2xl"
        style={{
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>

      {/* 3. 左下角抓手模式提示指示器 */}
      {isSpacePressed && (
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-cyan-300 shadow-xl pointer-events-none animate-in fade-in duration-100">
          <Hand className="w-3.5 h-3.5 animate-pulse" />
          <span>抓手平移模式 (拖拽移动画布)</span>
        </div>
      )}

      {/* 4. 右下角快捷缩放与视口控制浮动胶囊 */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-xl shadow-2xl z-30">
        <Tooltip content="缩小" shortcut="⌘ -">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => zoomTo(transform.scale * 0.8)}
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <span 
          onClick={resetZoom100}
          className="text-[11px] font-mono text-cyan-400 font-semibold px-2 cursor-pointer hover:bg-slate-800/80 rounded py-1 transition"
          title="点击重置为 100%"
        >
          {zoomPercent}%
        </span>

        <Tooltip content="放大" shortcut="⌘ +">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => zoomTo(transform.scale * 1.25)}
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <div className="h-3.5 w-px bg-slate-800 mx-0.5" />

        <Tooltip content="自适应视口居中" shortcut="⇧ 1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fitToScreen()}
            className="h-7 w-7 text-slate-400 hover:text-cyan-300"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="100% 原始大小" shortcut="⇧ 0">
          <Button
            size="icon"
            variant="ghost"
            onClick={resetZoom100}
            className="h-7 w-7 text-slate-400 hover:text-cyan-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
