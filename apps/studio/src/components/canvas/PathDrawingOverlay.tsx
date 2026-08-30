import React, { useState, useRef, useCallback } from 'react';
import type { ElementBox, ElementPath } from '@focusflow/dsl';
import { 
  getBoxAnchors, 
  findClosestAnchor, 
  computeCubicBezierPath, 
  ResolvedAnchor 
} from '@/utils/bezierMath';

export interface PathDrawingOverlayProps {
  contentWidth: number;
  contentHeight: number;
  boxes: ElementBox[];
  active: boolean;
  onPathCreated: (path: ElementPath) => void;
}

export function PathDrawingOverlay({
  contentWidth,
  contentHeight,
  boxes,
  active,
  onPathCreated,
}: PathDrawingOverlayProps) {
  const [hoverAnchor, setHoverAnchor] = useState<ResolvedAnchor | null>(null);
  const [dragStartAnchor, setDragStartAnchor] = useState<ResolvedAnchor | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);

  const overlayRef = useRef<SVGSVGElement>(null);

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
    const anchor = findClosestAnchor(coords, boxes, 40);

    if (anchor) {
      setDragStartAnchor(anchor);
      setCurrentMousePos(coords);
      (e.target as SVGElement).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    const coords = getCanvasCoords(e);
    const closest = findClosestAnchor(coords, boxes, 40);
    setHoverAnchor(closest);

    if (dragStartAnchor) {
      setCurrentMousePos(coords);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartAnchor) return;

    const coords = getCanvasCoords(e);
    const targetAnchor = findClosestAnchor(coords, boxes, 40);

    (e.target as SVGElement).releasePointerCapture?.(e.pointerId);

    if (targetAnchor && (targetAnchor.boxId !== dragStartAnchor.boxId || targetAnchor.anchorName !== dragStartAnchor.anchorName)) {
      const newPath: ElementPath = {
        id: `path-${Date.now().toString().slice(-4)}`,
        from: `${dragStartAnchor.boxId}.${dragStartAnchor.anchorName}`,
        to: `${targetAnchor.boxId}.${targetAnchor.anchorName}`,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 4,
          mode: 'stream',
          flowSpeed: 1.8,
        },
      };
      onPathCreated(newPath);
    }

    setDragStartAnchor(null);
    setCurrentMousePos(null);
  };

  if (!active) return null;

  // 所有选框的锚点集合
  const allAnchors = boxes.flatMap((b) => getBoxAnchors(b));

  // 当前动态绘制的贝塞尔曲线路径
  let activeBezierPath = '';
  if (dragStartAnchor && currentMousePos) {
    const targetEnd = hoverAnchor || {
      x: currentMousePos.x,
      y: currentMousePos.y,
      normal: { dx: 0, dy: 0 },
    };
    activeBezierPath = computeCubicBezierPath(dragStartAnchor, targetEnd);
  }

  return (
    <svg
      ref={overlayRef}
      data-testid="path-drawing-overlay"
      viewBox={`0 0 ${contentWidth} ${contentHeight}`}
      className="absolute inset-0 w-full h-full z-20 cursor-crosshair select-none touch-none pointer-events-auto overflow-visible"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <defs>
        {/* 流光渐变滤镜 */}
        <filter id="path-drawing-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. 绘制中的动态三次贝塞尔流光连线 */}
      {activeBezierPath && (
        <path
          d={activeBezierPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeDasharray="8 4"
          filter="url(#path-drawing-glow)"
          className="animate-pulse"
        />
      )}

      {/* 2. 8 向锚点交互高亮渲染 */}
      {allAnchors.map((anchor, idx) => {
        const isHovered = hoverAnchor?.boxId === anchor.boxId && hoverAnchor?.anchorName === anchor.anchorName;
        const isSelectedStart = dragStartAnchor?.boxId === anchor.boxId && dragStartAnchor?.anchorName === anchor.anchorName;

        return (
          <g key={`${anchor.boxId}-${anchor.anchorName}-${idx}`} className="transition-transform duration-100">
            {/* 外圈发光波纹 */}
            {(isHovered || isSelectedStart) && (
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r="12"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                className="animate-ping opacity-60"
              />
            )}

            {/* 核心锚点圆球 */}
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={isHovered || isSelectedStart ? 6 : 4}
              fill={isHovered || isSelectedStart ? '#38bdf8' : '#0284c7'}
              stroke="#ffffff"
              strokeWidth="2"
              className="cursor-pointer hover:scale-125 transition-transform"
            />
          </g>
        );
      })}
    </svg>
  );
}
