import React, { useRef, useCallback } from 'react';
import type { ElementBox, CalloutItem } from '@focusflow/dsl';
import { calculateAdaptiveCalloutStyle } from '@/utils/calloutTypography';

export interface CalloutOverlayProps {
  contentWidth: number;
  contentHeight: number;
  boxes: ElementBox[];
  active: boolean;
  onCalloutCreated: (callout: CalloutItem) => void;
}

export function CalloutOverlay({
  contentWidth,
  contentHeight,
  boxes,
  active,
  onCalloutCreated,
}: CalloutOverlayProps) {
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
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);

    // 检查是否点击在某个现有选框内
    const clickedBox = boxes.find(
      (b) =>
        coords.x >= b.x &&
        coords.x <= b.x + b.width &&
        coords.y >= b.y &&
        coords.y <= b.y + b.height
    );

    const adaptiveStyle = calculateAdaptiveCalloutStyle({
      viewportWidth: contentWidth,
      viewportHeight: contentHeight,
      targetBox: clickedBox,
    });

    const calloutSuffix = clickedBox
      ? clickedBox.id.replace(/^(box|rect)[-_]/i, '')
      : Date.now().toString().slice(-4);
    const calloutId = `callout-${calloutSuffix}`;
    const defaultTitle = `callout-${calloutSuffix}`;

    const newCallout: CalloutItem = {
      id: calloutId,
      targetBoxId: clickedBox?.id,
      position: {
        left: `${Math.round(clickedBox ? clickedBox.x + 30 : coords.x)}px`,
        top: `${Math.round(clickedBox ? Math.max(20, clickedBox.y - 70) : coords.y)}px`,
      },
      theme: 'blue',
      title: defaultTitle,
      desc: '支持在右侧属性检查器中编辑详细架构原理、协议流程与高并发应对策略...',
      style: adaptiveStyle,
    };

    onCalloutCreated(newCallout);
  };

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      data-testid="callout-drawing-overlay"
      className="absolute inset-0 z-20 cursor-crosshair select-none touch-none"
      onPointerDown={handlePointerDown}
    />
  );
}
