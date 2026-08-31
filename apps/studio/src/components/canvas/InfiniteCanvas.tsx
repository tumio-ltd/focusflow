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
  onTransformChange?: (transform: { scale: number; x: number; y: number }, containerRect: { width: number; height: number }) => void;
}

export function InfiniteCanvas({
  children,
  contentWidth = 1920,
  contentHeight = 1080,
  className = '',
  onTransformChange,
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
    onTransformChange,
  });

  const zoomPercent = Math.round(transform.scale * 100);

  return (
    <div
      ref={containerRef}
      data-testid="infinite-canvas-container"
      className={`relative w-full h-full overflow-hidden select-none bg-canvas touch-none transition-colors duration-200 ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${className}`}
      {...pointerHandlers}
    >
      {/* 1. 科技点阵背景网格 (Grid Matrix) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgb(var(--primary)) 1px, transparent 1px)',
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
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-panel/90 border border-primary/40 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-medium text-primary shadow-xl pointer-events-none animate-in fade-in duration-100">
          <Hand className="w-4 h-4 animate-pulse" />
          <span>抓手平移模式 (拖拽移动画布)</span>
        </div>
      )}

      {/* 4. 右下角快捷缩放与视口控制浮动胶囊 */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-panel/90 border border-border/40 backdrop-blur-md p-1.5 rounded-xl shadow-xl z-30">
        <Tooltip content="缩小" shortcut="⌘ -">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => zoomTo(transform.scale * 0.8)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </Tooltip>

        <span 
          onClick={resetZoom100}
          className="text-xs font-mono text-primary font-bold px-2.5 cursor-pointer hover:bg-muted rounded-lg py-1 transition"
          title="点击重置为 100%"
        >
          {zoomPercent}%
        </span>

        <Tooltip content="放大" shortcut="⌘ +">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => zoomTo(transform.scale * 1.25)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border mx-0.5" />

        <Tooltip content="自适应视口居中" shortcut="⇧ 1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fitToScreen()}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </Tooltip>

        <Tooltip content="100% 原始大小" shortcut="⇧ 0">
          <Button
            size="icon"
            variant="ghost"
            onClick={resetZoom100}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
