import React, { useRef, useCallback } from 'react';
import type { ElementDot } from '@focusflow/dsl';
import { useEditorStore } from '@/stores';

export interface DotDrawingOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  onDotCreated: (dot: ElementDot) => void;
}

export function DotDrawingOverlay({
  contentWidth,
  contentHeight,
  active,
  onDotCreated,
}: DotDrawingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeDrawingColor = useEditorStore((s) => s.activeDrawingColor);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);

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
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);
    const newDot: ElementDot = {
      id: `dot-${Date.now().toString().slice(-4)}`,
      cx: Math.round(coords.x),
      cy: Math.round(coords.y),
      r: 8,
      style: {
        fill: activeDrawingColor || '#38bdf8',
        glow: true,
        pulse: true,
      },
    };

    onDotCreated(newDot);
    setSelectedElementId(newDot.id);
  };

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      data-testid="dot-drawing-overlay"
      className="absolute inset-0 z-20 cursor-crosshair select-none touch-none"
      onPointerDown={handlePointerDown}
    />
  );
}
