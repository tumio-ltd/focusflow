import React, { useState, useRef, useCallback } from 'react';
import type { ElementBox } from '@focusflow/dsl';
import { globalEdgeSnapper } from '@/utils/edgeSnapper';
import { useEditorStore } from '@/stores';

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
  const isSmartSnapEnabled = useEditorStore((s) => s.isSmartSnapEnabled);
  const activeDrawingColor = useEditorStore((s) => s.activeDrawingColor);
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

  const lastClickSnapRef = useRef<{
    time: number;
    x: number;
    y: number;
    levelIndex: number;
  } | null>(null);

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
    if (rawW < 10 && rawH < 10 && isSmartSnapEnabled) {
      const now = Date.now();
      const last = lastClickSnapRef.current;
      const isReclick =
        last !== null &&
        now - last.time < 800 &&
        Math.hypot(rawX - last.x, rawY - last.y) <= 8;

      // 阶段 1.7 特性二：快捷键修饰符直达父容器 (macOS ⌥+⇧+Click / Win Alt+Shift+Click)
      const isForceParent = (e.altKey && e.shiftKey) || (e.metaKey && e.shiftKey);
      const snapped = globalEdgeSnapper.snapPoint(rawX, rawY, { forceParent: isForceParent });

      if (snapped) {
        let activeLevel = 0;
        if (isForceParent && snapped.levels && snapped.levels.length > 1) {
          activeLevel = 1;
        } else if (isReclick && snapped.levels && snapped.levels.length > 1) {
          activeLevel = (last.levelIndex + 1) % snapped.levels.length;
        }

        const targetData = (snapped.levels && snapped.levels[activeLevel]) || snapped;

        lastClickSnapRef.current = {
          time: now,
          x: rawX,
          y: rawY,
          levelIndex: activeLevel,
        };

        const newBox: ElementBox = {
          id: targetData.id,
          type: 'rect',
          x: Math.round(targetData.x),
          y: Math.round(targetData.y),
          width: Math.round(targetData.width),
          height: Math.round(targetData.height),
          rx: targetData.rx ?? 16,
          ry: targetData.rx ?? 16,
          levels: snapped.levels,
          style: { stroke: activeDrawingColor || '#38bdf8', strokeWidth: 4, glow: true },
        };
        onBoxCreated(newBox);
      }
      return;
    }

    // 拖拽矩形选框
    if (rawW >= 30 && rawH >= 20) {
      const rawBounds = { x: rawX, y: rawY, width: rawW, height: rawH };

      // 若开启了智能吸附且未按住 Option / Alt，则触发模式一增强：粗选框自适应磁吸与智能圆角拟合 (Rubberband Drag-to-Snap)
      if (isSmartSnapEnabled && !e.altKey) {
        const isForceParent = (e.altKey && e.shiftKey) || (e.metaKey && e.shiftKey);
        const snapped = globalEdgeSnapper.snapBoxBounds(rawBounds, { forceParent: isForceParent });
        const newBox: ElementBox = {
          id: snapped.id,
          type: 'rect',
          x: Math.round(snapped.x),
          y: Math.round(snapped.y),
          width: Math.round(snapped.width),
          height: Math.round(snapped.height),
          rx: snapped.rx ?? 16,
          ry: snapped.rx ?? 16,
          levels: snapped.levels,
          style: { stroke: activeDrawingColor || '#38bdf8', strokeWidth: 4, glow: true },
        };
        onBoxCreated(newBox);
        return;
      }

      const newBox: ElementBox = {
        id: `box-${Date.now().toString().slice(-4)}`,
        type: 'rect',
        x: Math.round(rawBounds.x),
        y: Math.round(rawBounds.y),
        width: Math.round(rawBounds.width),
        height: Math.round(rawBounds.height),
        rx: 16,
        ry: 16,
        style: { stroke: activeDrawingColor || '#38bdf8', strokeWidth: 4, glow: true },
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
          <div className="absolute -top-8 left-0 bg-panel/90 border border-primary/30 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono text-primary font-semibold shadow-md">
            {Math.round(currentRect.w)} × {Math.round(currentRect.h)} px
          </div>
        </div>
      )}
    </div>
  );
}
