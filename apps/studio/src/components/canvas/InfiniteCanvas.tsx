import React, { ReactNode } from 'react';
import { Hand } from 'lucide-react';
import { useCanvasGesture } from '@/hooks/useCanvasGesture';
import { ZoomControls } from './ZoomControls';

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
          backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
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
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-panel/90 border border-primary/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-primary shadow-xl pointer-events-none animate-in fade-in duration-100">
          <Hand className="w-3.5 h-3.5 animate-pulse" />
          <span>抓手平移模式 (拖拽移动画布)</span>
        </div>
      )}

      {/* 4. 独立可拖拽移动的快捷缩放与视口控制浮动胶囊 */}
      <ZoomControls
        scale={transform.scale}
        onZoomTo={zoomTo}
        onFitToScreen={fitToScreen}
        onResetZoom100={resetZoom100}
      />
    </div>
  );
}
