import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ElementBox, ElementPath } from '@focusflow/dsl';
import { Trash2, X, Activity, Waves, PenTool } from 'lucide-react';
import { useEditorStore, useProjectStore } from '@/stores';
import { 
  getBoxAnchors, 
  resolvePathAnchors, 
  computeCubicBezierPath, 
  findClosestAnchor, 
  ResolvedAnchor 
} from '@/utils/bezierMath';

export interface PathTransformOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean; // activeTool === 'select'
  boxes: ElementBox[];
  paths: ElementPath[];
  activePathIds?: string[];
}

interface DragEndpointState {
  pathId: string;
  handle: 'from' | 'to';
  pointerId: number;
  currentPos: { x: number; y: number };
  targetAnchor: ResolvedAnchor | null;
}

export function PathTransformOverlay({
  contentWidth,
  contentHeight,
  active,
  boxes,
  paths,
  activePathIds,
}: PathTransformOverlayProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const updatePathEndpoints = useProjectStore((s) => s.updatePathEndpoints);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const deleteElement = useProjectStore((s) => s.deleteElement);

  const [hoveredPathId, setHoveredPathId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragEndpointState | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const selectedPath = paths.find((p) => p.id === selectedElementId);

  // Keyboard Delete / Escape shortcuts
  useEffect(() => {
    if (!selectedPath || !active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        deleteElement('paths', selectedPath.id);
        setSelectedElementId(null);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPath, active, deleteElement, setSelectedElementId]);

  const getCanvasCoords = useCallback(
    (e: React.PointerEvent) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = contentWidth / rect.width;
      const scaleY = contentHeight / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      return {
        x: Math.max(0, Math.min(x, contentWidth)),
        y: Math.max(0, Math.min(y, contentHeight)),
      };
    },
    [contentWidth, contentHeight]
  );

  const handleStartDrag = (
    e: React.PointerEvent,
    pathId: string,
    handle: 'from' | 'to'
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);
    const closest = findClosestAnchor(coords, boxes, 48);

    setDragState({
      pathId,
      handle,
      pointerId: e.pointerId,
      currentPos: coords,
      targetAnchor: closest,
    });

    (e.target as SVGElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const coords = getCanvasCoords(e);
    const closest = findClosestAnchor(coords, boxes, 48);

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentPos: coords,
            targetAnchor: closest,
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;

    (e.target as SVGElement).releasePointerCapture?.(e.pointerId);

    if (dragState.targetAnchor) {
      const newAnchorSpec = `${dragState.targetAnchor.boxId}.${dragState.targetAnchor.anchorName}`;
      if (dragState.handle === 'from') {
        updatePathEndpoints(dragState.pathId, { from: newAnchorSpec });
      } else {
        updatePathEndpoints(dragState.pathId, { to: newAnchorSpec });
      }
    }

    setDragState(null);
  };

  if (!active) return null;

  // Filter paths active in current scene, OR the currently selected path
  const visiblePaths = paths.filter((p) => {
    if (p.id === selectedElementId) return true;
    if (!activePathIds) return true;
    return activePathIds.includes(p.id);
  });

  return (
    <div
      data-testid="path-transform-overlay"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
    >
      <svg
        ref={svgRef}
        className="w-full h-full absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${contentWidth} ${contentHeight}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Candidate Anchors when dragging endpoint */}
        {dragState && (
          <g className="candidate-anchors pointer-events-none">
            {boxes.flatMap((box) => getBoxAnchors(box)).map((anchor, idx) => {
              const isTarget =
                dragState.targetAnchor?.boxId === anchor.boxId &&
                dragState.targetAnchor?.anchorName === anchor.anchorName;

              return (
                <g key={`anchor-${anchor.boxId}-${anchor.anchorName}-${idx}`}>
                  {/* Subtle target ring */}
                  <circle
                    cx={anchor.x}
                    cy={anchor.y}
                    r={isTarget ? 14 : 7}
                    fill={isTarget ? '#38bdf8' : '#0f172a'}
                    stroke={isTarget ? '#ffffff' : '#38bdf8'}
                    strokeWidth={isTarget ? 3 : 1.5}
                    strokeOpacity={isTarget ? 1 : 0.6}
                    className={isTarget ? 'animate-ping' : ''}
                  />
                  <circle
                    cx={anchor.x}
                    cy={anchor.y}
                    r={isTarget ? 8 : 4}
                    fill={isTarget ? '#ffffff' : '#38bdf8'}
                  />
                  {isTarget && (
                    <text
                      x={anchor.x}
                      y={anchor.y - 18}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="12"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="drop-shadow-md"
                    >
                      {anchor.boxId}.{anchor.anchorName}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 2. Render Paths & Interaction Overlays */}
        {visiblePaths.map((path) => {
          if (!path.from || !path.to) return null;
          const { from, to } = resolvePathAnchors(boxes, path.from, path.to);
          if (!from || !to) return null;

          const isSelected = path.id === selectedElementId;
          const isHovered = path.id === hoveredPathId && !isSelected;

          // If dragging an endpoint of this path, dynamically recalculate bezier
          let dynamicFrom = from;
          let dynamicTo = to;

          if (dragState && dragState.pathId === path.id) {
            if (dragState.handle === 'from') {
              dynamicFrom = dragState.targetAnchor || {
                x: dragState.currentPos.x,
                y: dragState.currentPos.y,
                normal: from.normal,
                boxId: '',
                anchorName: from.anchorName,
              };
            } else if (dragState.handle === 'to') {
              dynamicTo = dragState.targetAnchor || {
                x: dragState.currentPos.x,
                y: dragState.currentPos.y,
                normal: to.normal,
                boxId: '',
                anchorName: to.anchorName,
              };
            }
          }

          const bezierD = computeCubicBezierPath(dynamicFrom, dynamicTo);
          const strokeColor = path.style?.stroke || '#38bdf8';
          const strokeWidth = path.style?.strokeWidth || 4;

          return (
            <g key={path.id} className="path-interaction-group">
              {/* 2.1 Transparent Hit Area for Clicking */}
              <path
                d={bezierD}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(28, strokeWidth + 20)}
                strokeLinecap="round"
                data-testid={`path-hit-area-${path.id}`}
                className="cursor-pointer pointer-events-auto"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(path.id);
                }}
                onPointerEnter={() => setHoveredPathId(path.id)}
                onPointerLeave={() => setHoveredPathId(null)}
              />

              {/* 2.2 Hover Highlight */}
              {isHovered && (
                <path
                  d={bezierD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth + 4}
                  strokeOpacity={0.4}
                  strokeDasharray="8 6"
                  className="pointer-events-none transition-all"
                />
              )}

              {/* 2.3 Selected Glow & Outline */}
              {isSelected && (
                <>
                  {/* Outer Pulsing Glow */}
                  <path
                    d={bezierD}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={strokeWidth + 8}
                    strokeOpacity={0.6}
                    strokeDasharray="10 6"
                    data-testid="path-selected-halo"
                    className="pointer-events-none animate-pulse"
                    filter="url(#path-glow)"
                  />
                  {/* Inner Crisp Stroke */}
                  <path
                    d={bezierD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={strokeWidth + 2}
                    strokeOpacity={0.8}
                    className="pointer-events-none"
                  />

                  {/* 2.4 Start Endpoint Handle ('from') */}
                  <g
                    data-testid="path-from-handle"
                    className="cursor-grab active:cursor-grabbing pointer-events-auto"
                    onPointerDown={(e) => handleStartDrag(e, path.id, 'from')}
                  >
                    <circle
                      cx={dynamicFrom.x}
                      cy={dynamicFrom.y}
                      r={14}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      className="hover:scale-125 transition-transform drop-shadow-lg"
                    />
                    <circle
                      cx={dynamicFrom.x}
                      cy={dynamicFrom.y}
                      r={5}
                      fill="#38bdf8"
                    />
                  </g>

                  {/* 2.5 End Endpoint Handle ('to') */}
                  <g
                    data-testid="path-to-handle"
                    className="cursor-grab active:cursor-grabbing pointer-events-auto"
                    onPointerDown={(e) => handleStartDrag(e, path.id, 'to')}
                  >
                    <circle
                      cx={dynamicTo.x}
                      cy={dynamicTo.y}
                      r={14}
                      fill="#0f172a"
                      stroke="#34d399"
                      strokeWidth={3}
                      className="hover:scale-125 transition-transform drop-shadow-lg"
                    />
                    <circle
                      cx={dynamicTo.x}
                      cy={dynamicTo.y}
                      r={5}
                      fill="#34d399"
                    />
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* 3. Floating Quick Action Toolbar for Selected Path */}
      {selectedPath && !dragState && (() => {
        if (!selectedPath.from || !selectedPath.to) return null;
        const { from, to } = resolvePathAnchors(boxes, selectedPath.from, selectedPath.to);
        if (!from || !to) return null;

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const leftPct = (midX / contentWidth) * 100;
        const topPct = (midY / contentHeight) * 100;
        const currentMode = selectedPath.style?.mode || 'stream';

        return (
          <div
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: 'translate(-50%, -100%) translateY(-24px)',
            }}
            className="absolute pointer-events-auto select-none z-30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 bg-slate-900/95 border border-cyan-500/40 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
              {/* Path ID Badge */}
              <span className="text-[10px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {selectedPath.id}
              </span>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              {/* Mode Switcher */}
              <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => updateElementStyle(selectedPath.id, { mode: 'stream' })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                    currentMode === 'stream'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="流光粒子 (Stream)"
                >
                  <Waves className="w-3 h-3" />
                  <span>流光</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateElementStyle(selectedPath.id, { mode: 'pulse' })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                    currentMode === 'pulse'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="脉冲闪烁 (Pulse)"
                >
                  <Activity className="w-3 h-3" />
                  <span>脉冲</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateElementStyle(selectedPath.id, { mode: 'draw' })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                    currentMode === 'draw'
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="静态描边 (Draw)"
                >
                  <PenTool className="w-3 h-3" />
                  <span>描边</span>
                </button>
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              {/* Color Swatches */}
              {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899'].map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  onClick={() => updateElementStyle(selectedPath.id, { stroke: c, fill: c })}
                  className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition cursor-pointer"
                  title={`设为颜色 ${c}`}
                />
              ))}

              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  deleteElement('paths', selectedPath.id);
                  setSelectedElementId(null);
                }}
                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                title="删除连线 (Delete / Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedElementId(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="取消选中 (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
