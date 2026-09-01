import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  GripVertical 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip } from '@/components/ui';

export interface ZoomControlsProps {
  scale: number;
  onZoomTo: (targetScale: number) => void;
  onFitToScreen: () => void;
  onResetZoom100: () => void;
  className?: string;
}

export function ZoomControls({
  scale,
  onZoomTo,
  onFitToScreen,
  onResetZoom100,
  className = '',
}: ZoomControlsProps) {
  const { t } = useTranslation();
  const zoomPercent = isNaN(scale) ? 100 : Math.round(scale * 100);

  // 相对默认右下角 (bottom-6 right-6) 的偏移量 (x, y)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: position.x,
      initY: position.y,
    };
  }, [position]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // 避免在点击具体操作按钮时误触发拖拽
    if ((e.target as HTMLElement).closest('button, span[data-action]')) {
      return;
    }
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, span[data-action]')) {
      return;
    }
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      if (!dragStartRef.current) return;
      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;

      setPosition({
        x: dragStartRef.current.initX + deltaX,
        y: dragStartRef.current.initY + deltaY,
      });
    };

    const handlePointerMove = (e: PointerEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={capsuleRef}
      data-testid="zoom-controls-capsule"
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`absolute bottom-6 right-6 flex items-center gap-1 bg-panel/95 border border-border backdrop-blur-md p-1 rounded-xl shadow-2xl z-40 select-none transition-shadow ${
        isDragging ? 'cursor-grabbing shadow-primary/20 ring-2 ring-primary/40' : 'cursor-grab'
      } ${className}`}
    >
      {/* 拖拽手柄 */}
      <Tooltip content={t('dragToMove')} position="top">
        <div 
          data-testid="zoom-drag-handle"
          className="flex items-center justify-center h-7 px-1 text-muted-foreground/60 hover:text-foreground transition rounded cursor-grab active:cursor-grabbing"
          title={t('dragToMove')}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </Tooltip>

      {/* 缩小 */}
      <Tooltip content={t('zoomOut')} shortcut="⌘ -" position="top">
        <Button
          size="icon"
          variant="ghost"
          data-testid="zoom-out-btn"
          onClick={() => onZoomTo(scale * 0.8)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      {/* 缩放比例重置 */}
      <Tooltip content={t('resetZoom')} shortcut="⇧ 0" position="top">
        <span 
          data-action="reset-zoom"
          onClick={onResetZoom100}
          className="text-[11px] font-mono text-primary font-semibold px-2 cursor-pointer hover:bg-muted rounded py-1 transition"
        >
          {zoomPercent}%
        </span>
      </Tooltip>

      {/* 放大 */}
      <Tooltip content={t('zoomIn')} shortcut="⌘ +" position="top">
        <Button
          size="icon"
          variant="ghost"
          data-testid="zoom-in-btn"
          onClick={() => onZoomTo(scale * 1.25)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      <div className="h-3.5 w-px bg-border mx-0.5" />

      {/* 自适应视口居中 */}
      <Tooltip content={t('fitToScreen')} shortcut="⇧ 1" position="top">
        <Button
          size="icon"
          variant="ghost"
          data-testid="fit-screen-btn"
          onClick={() => onFitToScreen()}
          className="h-7 w-7 text-muted-foreground hover:text-primary"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>

      {/* 100% 原始大小 */}
      <Tooltip content={t('resetZoom')} shortcut="⇧ 0" position="top">
        <Button
          size="icon"
          variant="ghost"
          data-testid="reset-100-btn"
          onClick={() => onResetZoom100()}
          className="h-7 w-7 text-muted-foreground hover:text-primary"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </Tooltip>
    </div>
  );
}
