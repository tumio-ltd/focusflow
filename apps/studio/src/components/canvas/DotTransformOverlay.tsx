import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ElementDot } from '@focusflow/dsl';
import { Trash2, X, Move } from 'lucide-react';
import { useEditorStore, useProjectStore } from '@/stores';

export interface DotTransformOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  dots: ElementDot[];
}

export function DotTransformOverlay({
  contentWidth,
  contentHeight,
  active,
  dots,
}: DotTransformOverlayProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const updateDotPosition = useProjectStore((s) => s.updateDotPosition);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const deleteElement = useProjectStore((s) => s.deleteElement);
  const activeSceneIndex = useEditorStore((s) => s.activeSceneIndex);
  const dsl = useProjectStore((s) => s.dsl);

  const [dragState, setDragState] = useState<{
    startPointerX: number;
    startPointerY: number;
    startDotX: number;
    startDotY: number;
    currentDotX: number;
    currentDotY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDot = dots.find((d) => d.id === selectedElementId);
  const activeDotIds = dsl.scenes[activeSceneIndex]?.activeElements?.dots;

  const getCanvasCoords = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
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

  // Keyboard Delete / Escape shortcuts
  useEffect(() => {
    if (!selectedDot || !active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        deleteElement('dots', selectedDot.id);
        setSelectedElementId(null);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDot, active, deleteElement, setSelectedElementId]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!selectedDot) return;
    e.stopPropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e);
    setDragState({
      startPointerX: coords.x,
      startPointerY: coords.y,
      startDotX: selectedDot.cx,
      startDotY: selectedDot.cy,
      currentDotX: selectedDot.cx,
      currentDotY: selectedDot.cy,
    });

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const coords = getCanvasCoords(e);
    const dx = coords.x - dragState.startPointerX;
    const dy = coords.y - dragState.startPointerY;

    const nextX = Math.max(0, Math.min(contentWidth, dragState.startDotX + dx));
    const nextY = Math.max(0, Math.min(contentHeight, dragState.startDotY + dy));

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentDotX: Math.round(nextX),
            currentDotY: Math.round(nextY),
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || !selectedDot) return;

    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    updateDotPosition(selectedDot.id, {
      cx: dragState.currentDotX,
      cy: dragState.currentDotY,
    });
    setDragState(null);
  };

  if (!active) return null;

  const currentCx = dragState ? dragState.currentDotX : selectedDot?.cx;
  const currentCy = dragState ? dragState.currentDotY : selectedDot?.cy;
  const radius = selectedDot?.r || 8;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 pointer-events-none"
      data-testid="dot-transform-overlay"
    >
      {/* 1. Render interactive hit areas for unselected dots */}
      {dots.map((d) => {
        const isSelected = d.id === selectedElementId;
        const isActiveInScene = activeDotIds?.includes(d.id) ?? false;
        if (isSelected) return null;
        if (!isActiveInScene) return null;

        const hitRadius = Math.max(d.r || 8, 12);
        const leftPct = (d.cx / contentWidth) * 100;
        const topPct = (d.cy / contentHeight) * 100;

        return (
          <div
            key={d.id}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${hitRadius * 2.8}px`,
              height: `${hitRadius * 2.8}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId(d.id);
            }}
            className="absolute rounded-full border border-dashed cursor-pointer transition-all pointer-events-auto flex items-center justify-center group border-amber-400/40 hover:border-amber-400 hover:bg-amber-400/10 hover:scale-125"
            title={`点击选中并移动圆点: ${d.id}`}
          >
            <div className="w-2 h-2 rounded-full bg-amber-400/60 opacity-0 group-hover:opacity-100 transition" />
          </div>
        );
      })}

      {/* 2. Selected Dot Drag Handle & Floating Controls */}
      {selectedDot && currentCx !== undefined && currentCy !== undefined && (
        <div
          style={{
            left: `${(currentCx / contentWidth) * 100}%`,
            top: `${(currentCy / contentHeight) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute pointer-events-auto select-none"
        >
          {/* 选中的外发光脉冲手柄 */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              width: `${Math.max(radius * 2.5, 34)}px`,
              height: `${Math.max(radius * 2.5, 34)}px`,
            }}
            className="rounded-full border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] ring-2 ring-amber-400/40 bg-amber-400/15 cursor-move active:cursor-grabbing flex items-center justify-center group hover:scale-105 transition-transform"
            title="按住拖拽平移圆点位置"
          >
            <Move className="w-3.5 h-3.5 text-amber-300 drop-shadow group-hover:scale-110 transition" />
          </div>

          {/* 顶部微型悬浮工具栏 */}
          <div
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 border border-amber-500/40 rounded-lg px-2 py-1 shadow-2xl pointer-events-auto z-30 animate-in fade-in duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-amber-300 font-bold px-1 border-r border-slate-700">
              {currentCx}, {currentCy}
            </span>

            {/* 快速调色 */}
            {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'].map((c) => (
              <button
                key={c}
                type="button"
                style={{ backgroundColor: c }}
                onClick={() => updateElementStyle(selectedDot.id, { fill: c, stroke: c })}
                className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition cursor-pointer"
                title={`设为颜色 ${c}`}
              />
            ))}

            <div className="w-px h-3 bg-slate-700 mx-0.5" />

            {/* 删除按钮 */}
            <button
              type="button"
              onClick={() => {
                deleteElement('dots', selectedDot.id);
                setSelectedElementId(null);
              }}
              className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
              title="删除圆点 (Delete)"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* 取消选中 */}
            <button
              type="button"
              onClick={() => setSelectedElementId(null)}
              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="取消选择 (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
