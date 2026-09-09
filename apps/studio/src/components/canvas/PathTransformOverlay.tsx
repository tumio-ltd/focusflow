import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ElementBox, ElementPath } from '@focusflow/dsl';
import { Trash2, X, Activity, Waves, PenTool } from 'lucide-react';
import { useEditorStore, useProjectStore } from '@/stores';
import { useCanvasScale } from './InfiniteCanvas';
import { PATH_FLOW_MODES } from '@/utils/pathModes';
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
  const setActiveDrawingColor = useEditorStore((s) => s.setActiveDrawingColor);
  const updatePathEndpoints = useProjectStore((s) => s.updatePathEndpoints);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const deleteElement = useProjectStore((s) => s.deleteElement);
  const contextScale = useCanvasScale();

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
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-30"
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

          const isDraggingThis = dragState && dragState.pathId === path.id;
          let bezierD: string;

          if (!isDraggingThis) {
            const domEl = document.getElementById(path.id);
            const domD = domEl?.getAttribute('d');
            bezierD = path.d || domD || computeCubicBezierPath(dynamicFrom, dynamicTo);
          } else {
            bezierD = computeCubicBezierPath(dynamicFrom, dynamicTo);
          }

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
                    className="cursor-grab active:cursor-grabbing pointer-events-auto group"
                    onPointerDown={(e) => handleStartDrag(e, path.id, 'from')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 透明热区圆 (独占捕获指针事件，杜绝内外子元素撕裂) */}
                    <circle
                      cx={dynamicFrom.x}
                      cy={dynamicFrom.y}
                      r={22}
                      fill="transparent"
                      className="cursor-grab active:cursor-grabbing"
                    />
                    {/* 外圈视觉圆：采用纯描边加粗与高亮过渡，彻底消除 SVG CSS scale 引起的乒乓抖动 */}
                    <circle
                      cx={dynamicFrom.x}
                      cy={dynamicFrom.y}
                      r={14}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      className="pointer-events-none group-hover:stroke-[4px] group-hover:stroke-cyan-300 transition-all duration-150 drop-shadow-md"
                    />
                    {/* 内圈实心圆 */}
                    <circle
                      cx={dynamicFrom.x}
                      cy={dynamicFrom.y}
                      r={5}
                      fill="#38bdf8"
                      className="pointer-events-none group-hover:fill-cyan-300 transition-colors duration-150"
                    />
                  </g>

                  {/* 2.5 End Endpoint Handle ('to') */}
                  <g
                    data-testid="path-to-handle"
                    className="cursor-grab active:cursor-grabbing pointer-events-auto group"
                    onPointerDown={(e) => handleStartDrag(e, path.id, 'to')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 透明热区圆 (独占捕获指针事件，杜绝内外子元素撕裂) */}
                    <circle
                      cx={dynamicTo.x}
                      cy={dynamicTo.y}
                      r={22}
                      fill="transparent"
                      className="cursor-grab active:cursor-grabbing"
                    />
                    {/* 外圈视觉圆：采用纯描边加粗与高亮过渡，彻底消除 SVG CSS scale 引起的乒乓抖动 */}
                    <circle
                      cx={dynamicTo.x}
                      cy={dynamicTo.y}
                      r={14}
                      fill="#0f172a"
                      stroke="#34d399"
                      strokeWidth={3}
                      className="pointer-events-none group-hover:stroke-[4px] group-hover:stroke-emerald-300 transition-all duration-150 drop-shadow-md"
                    />
                    {/* 内圈实心圆 */}
                    <circle
                      cx={dynamicTo.x}
                      cy={dynamicTo.y}
                      r={5}
                      fill="#34d399"
                      className="pointer-events-none group-hover:fill-emerald-300 transition-colors duration-150"
                    />
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* 3. Floating Quick Action Toolbar for Selected Path (Scheme A: Safe Bounding Box Anchoring + Scheme C: Compact Layout) */}
      {selectedPath && !dragState && (() => {
        if (!selectedPath.from || !selectedPath.to) return null;
        const { from, to } = resolvePathAnchors(boxes, selectedPath.from, selectedPath.to);
        if (!from || !to) return null;

        // 计算贝塞尔控制点以获得整个 Path 曲线的最真实外包围盒 (AABB)
        const normFrom = from.normal || { dx: 1, dy: 0 };
        const normTo = to.normal || { dx: -1, dy: 0 };
        const tension = 0.55;
        const dx = Math.abs(to.x - from.x) * tension;
        const dy = Math.abs(to.y - from.y) * tension;

        let cp1x = from.x + normFrom.dx * dx;
        let cp1y = from.y + normFrom.dy * dy;
        let cp2x = to.x + normTo.dx * dx;
        let cp2y = to.y + normTo.dy * dy;

        if (normFrom.dx !== 0 && normTo.dx !== 0) {
          cp1y = from.y;
          cp2y = to.y;
        } else if (normFrom.dy !== 0 && normTo.dy !== 0) {
          cp1x = from.x;
          cp2x = to.x;
        }

        // 1. 计算三阶贝塞尔曲线在 t=0.5 处的确切空间坐标与切线中点
        const midCurveX = 0.125 * from.x + 0.375 * cp1x + 0.375 * cp2x + 0.125 * to.x;
        const midCurveY = 0.125 * from.y + 0.375 * cp1y + 0.375 * cp2y + 0.125 * to.y;

        // 曲线与两端点的综合垂直边界
        const topBound = Math.min(from.y, to.y, midCurveY);
        const bottomBound = Math.max(from.y, to.y, midCurveY);

        // 方案 A 改进版：优雅适度收敛安全间距（屏幕物理间距维持在 ~16px，既亲密贴合又确保手柄畅通无阻）
        const scale = Math.max(0.05, contextScale ?? 1.0);
        const invScale = 1 / scale;
        // 适当收敛：保证屏幕像素距离维持在 14~18px 之间，彻底消除过量 invScale 导致的外漂悬空
        const safeOffset = Math.max(38, 18 + 14 * invScale);
        const placeAbove = topBound >= safeOffset + 24;
        
        // 横向以曲线物理中点 midCurveX 为基准，保留两端安全内缩防溢出
        const clampedMidX = Math.max(160, Math.min(contentWidth - 160, midCurveX));
        const anchorY = placeAbove 
          ? Math.max(10, topBound - safeOffset) 
          : Math.min(contentHeight - 10, bottomBound + safeOffset);

        const leftPct = (clampedMidX / contentWidth) * 100;
        const topPct = (anchorY / contentHeight) * 100;
        const currentMode = selectedPath.style?.mode || 'stream';
        const currentColor = (selectedPath.style?.stroke || '#38bdf8').trim();

        return (
          <div
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)',
            }}
            className="absolute pointer-events-auto select-none z-30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 bg-slate-900/95 border border-cyan-500/40 rounded-xl px-2 py-1 shadow-2xl backdrop-blur-md text-xs">
              {/* Path ID Badge - 限制最大宽度并截字，支持 hover 查看全称 */}
              <span
                className="text-[10px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 max-w-[96px] truncate"
                title={selectedPath.id}
              >
                {selectedPath.id}
              </span>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Mode Switcher - 紧凑型模式切换 (与 RightInspector 严格对齐流光/生长绘制/呼吸律动) */}
              <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 shrink-0">
                {PATH_FLOW_MODES.map((m) => {
                  const Icon = m.icon;
                  const isActive = currentMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateElementStyle(selectedPath.id, { mode: m.id })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={m.desc}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{m.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Color Swatches - 紧凑型色彩选择，高亮当前活跃色彩 (标准 Tailwind ring-2 + 核心白点指示，同步更新全局画笔色) */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-1.5 py-0.5 rounded-lg border border-slate-700/80 shrink-0">
                {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899'].map((c) => {
                  const isActive = currentColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        setActiveDrawingColor(c);
                        updateElementStyle(selectedPath.id, { stroke: c });
                      }}
                      className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer flex items-center justify-center relative ${
                        isActive
                          ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-115'
                      }`}
                      title={`设为颜色 ${c}`}
                    >
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-3.5 bg-slate-700 mx-0.5 shrink-0" />

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  deleteElement('paths', selectedPath.id);
                  setSelectedElementId(null);
                }}
                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer shrink-0"
                title="删除连线 (Delete / Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedElementId(null)}
                className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0"
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
