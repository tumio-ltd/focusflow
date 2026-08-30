import React, { useState, useRef, useCallback } from 'react';
import type { ElementBox } from '@focusflow/dsl';
import { globalEdgeSnapper } from '@/utils/edgeSnapper';

export interface BoxDrawingOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  onBoxCreated: (box: ElementBox) => void;
}

export function BoxDrawingOverlay({
  contentWidth,
  contentHeight,
  active,
  onBoxCreated,
}: BoxDrawingOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragRect, setDragRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  const getCanvasCoords = useCallback((e: React.PointerEvent) => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = contentWidth / rect.width;
    const scaleY = contentHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return {
      x: Math.max(0, Math.min(x, contentWidth)),
      y: Math.max(0, Math.min(y, contentHeight)),
    };
  }, [contentWidth, contentHeight]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    // 允许非左键点击透传
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDragRect({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !dragRect) return;

    const coords = getCanvasCoords(e);
    setDragRect((prev) => (prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing || !dragRect) return;

    setIsDrawing(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    const rawX = Math.min(dragRect.startX, dragRect.currentX);
    const rawY = Math.min(dragRect.startY, dragRect.currentY);
    const rawW = Math.abs(dragRect.currentX - dragRect.startX);
    const rawH = Math.abs(dragRect.currentY - dragRect.startY);

    setDragRect(null);

    // 单击吸附判定 (移动距离 < 10px)
    if (rawW < 10 && rawH < 10) {
      const snapped = globalEdgeSnapper.snapPoint(rawX, rawY);
      if (snapped) {
        const newBox: ElementBox = {
          id: snapped.id,
          type: 'rect',
          x: Math.round(snapped.x),
          y: Math.round(snapped.y),
          width: Math.round(snapped.width),
          height: Math.round(snapped.height),
          rx: 16,
          ry: 16,
          style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
        };
        onBoxCreated(newBox);
      }
      return;
    }

    // 拖拽矩形选框
    if (rawW >= 30 && rawH >= 20) {
      let finalBounds = { x: rawX, y: rawY, width: rawW, height: rawH };

      // 若未按住 Option / Alt，则触发 Sobel 窄带边缘极大值贴合
      if (!e.altKey) {
        finalBounds = globalEdgeSnapper.snapRectBounds(finalBounds, 24);
      }

      const newBox: ElementBox = {
        id: `box-${Date.now().toString().slice(-4)}`,
        type: 'rect',
        x: Math.round(finalBounds.x),
        y: Math.round(finalBounds.y),
        width: Math.round(finalBounds.width),
        height: Math.round(finalBounds.height),
        rx: 16,
        ry: 16,
        style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
      };

      onBoxCreated(newBox);
    }
  };

  if (!active) return null;

  const currentRect = dragRect ? {
    x: Math.min(dragRect.startX, dragRect.currentX),
    y: Math.min(dragRect.startY, dragRect.currentY),
    w: Math.abs(dragRect.currentX - dragRect.startX),
    h: Math.abs(dragRect.currentY - dragRect.startY),
  } : null;

  return (
    <div
      ref={overlayRef}
      data-testid="box-drawing-overlay"
      className="absolute inset-0 z-20 cursor-crosshair select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 实时绘制中的矩形预览 */}
      {isDrawing && currentRect && (
        <div
          className="absolute border-2 border-cyan-400 bg-cyan-500/10 rounded-xl shadow-lg pointer-events-none transition-none"
          style={{
            left: `${currentRect.x}px`,
            top: `${currentRect.y}px`,
            width: `${currentRect.w}px`,
            height: `${currentRect.h}px`,
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
          }}
        >
          {/* 实时物理像素尺寸气泡 */}
          <div className="absolute -top-7 left-0 bg-slate-900/90 border border-cyan-500/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 shadow-md">
            {Math.round(currentRect.w)} × {Math.round(currentRect.h)} px
          </div>
        </div>
      )}
    </div>
  );
}
