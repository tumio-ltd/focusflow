import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ElementBox } from '@focusflow/dsl';
import { useEditorStore, useProjectStore } from '@/stores';
import { globalEdgeSnapper } from '@/utils/edgeSnapper';
import { Trash2, X, Move, Sparkles } from 'lucide-react';

export interface BoxTransformOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  boxes: ElementBox[];
  activeBoxIds?: string[];
}

type HandleType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  handle: HandleType;
  startPointerX: number;
  startPointerY: number;
  startBox: { x: number; y: number; width: number; height: number };
  currentBox: { x: number; y: number; width: number; height: number };
}

const PALETTE_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899', '#ffffff'];

export function BoxTransformOverlay({
  contentWidth,
  contentHeight,
  active,
  boxes,
  activeBoxIds,
}: BoxTransformOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const isSmartSnapEnabled = useEditorStore((s) => s.isSmartSnapEnabled);
  const updateBoxBounds = useProjectStore((s) => s.updateBoxBounds);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const deleteElement = useProjectStore((s) => s.deleteElement);

  const [dragState, setDragState] = useState<DragState | null>(null);

  // Find currently selected box
  const selectedBox = boxes.find((b) => b.id === selectedElementId);

  // Get canvas coordinates from pointer event
  const getCanvasCoords = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = contentWidth / rect.width;
      const scaleY = contentHeight / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [contentWidth, contentHeight]
  );

  // Handle keyboard shortcut for Delete and Escape
  useEffect(() => {
    if (!active || !selectedElementId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedElementId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement('boxes', selectedElementId);
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, selectedElementId, setSelectedElementId, deleteElement]);

  // Click on background to deselect
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if (!active || dragState) return;
    // If clicked directly on the overlay background (not on a box)
    if (e.target === containerRef.current) {
      const coords = getCanvasCoords(e);
      // Check if clicked inside any box
      const hitBox = [...boxes].reverse().find((b) => {
        return (
          coords.x >= b.x &&
          coords.x <= b.x + b.width &&
          coords.y >= b.y &&
          coords.y <= b.y + b.height
        );
      });

      if (hitBox) {
        setSelectedElementId(hitBox.id);
      } else {
        setSelectedElementId(null);
      }
    }
  };

  const handleStartDrag = (handle: HandleType, e: React.PointerEvent) => {
    if (!selectedBox) return;
    e.stopPropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e);
    setDragState({
      handle,
      startPointerX: coords.x,
      startPointerY: coords.y,
      startBox: {
        x: selectedBox.x,
        y: selectedBox.y,
        width: selectedBox.width,
        height: selectedBox.height,
      },
      currentBox: {
        x: selectedBox.x,
        y: selectedBox.y,
        width: selectedBox.width,
        height: selectedBox.height,
      },
    });

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const coords = getCanvasCoords(e);
    const dx = coords.x - dragState.startPointerX;
    const dy = coords.y - dragState.startPointerY;
    const { startBox, handle } = dragState;

    let nextX = startBox.x;
    let nextY = startBox.y;
    let nextW = startBox.width;
    let nextH = startBox.height;

    switch (handle) {
      case 'move':
        nextX = Math.max(0, Math.min(contentWidth - nextW, startBox.x + dx));
        nextY = Math.max(0, Math.min(contentHeight - nextH, startBox.y + dy));
        break;
      case 'nw':
        nextX = Math.min(startBox.x + startBox.width - 30, startBox.x + dx);
        nextY = Math.min(startBox.y + startBox.height - 20, startBox.y + dy);
        nextW = startBox.width - (nextX - startBox.x);
        nextH = startBox.height - (nextY - startBox.y);
        break;
      case 'n':
        nextY = Math.min(startBox.y + startBox.height - 20, startBox.y + dy);
        nextH = startBox.height - (nextY - startBox.y);
        break;
      case 'ne':
        nextW = Math.max(30, startBox.width + dx);
        nextY = Math.min(startBox.y + startBox.height - 20, startBox.y + dy);
        nextH = startBox.height - (nextY - startBox.y);
        break;
      case 'e':
        nextW = Math.max(30, startBox.width + dx);
        break;
      case 'se':
        nextW = Math.max(30, startBox.width + dx);
        nextH = Math.max(20, startBox.height + dy);
        break;
      case 's':
        nextH = Math.max(20, startBox.height + dy);
        break;
      case 'sw':
        nextX = Math.min(startBox.x + startBox.width - 30, startBox.x + dx);
        nextW = startBox.width - (nextX - startBox.x);
        nextH = Math.max(20, startBox.height + dy);
        break;
      case 'w':
        nextX = Math.min(startBox.x + startBox.width - 30, startBox.x + dx);
        nextW = startBox.width - (nextX - startBox.x);
        break;
    }

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentBox: {
              x: Math.round(nextX),
              y: Math.round(nextY),
              width: Math.round(nextW),
              height: Math.round(nextH),
            },
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || !selectedBox) return;

    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    let finalBounds = dragState.currentBox;

    // Apply smart edge snapping on release if enabled and not holding Alt
    if (isSmartSnapEnabled && !e.altKey) {
      finalBounds = globalEdgeSnapper.snapRectBounds(finalBounds);
    }

    updateBoxBounds(selectedBox.id, finalBounds);
    setDragState(null);
  };

  if (!active) return null;

  const displayBox = dragState ? dragState.currentBox : selectedBox;

  // Convert logical coordinates to percentage style
  const toPctStyle = (box: { x: number; y: number; width: number; height: number }) => ({
    left: `${(box.x / contentWidth) * 100}%`,
    top: `${(box.y / contentHeight) * 100}%`,
    width: `${(box.width / contentWidth) * 100}%`,
    height: `${(box.height / contentHeight) * 100}%`,
  });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 pointer-events-none"
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      data-testid="box-transform-overlay"
    >
      {/* 1. Render interactive hit areas for unselected boxes */}
      {boxes.map((b) => {
        const isSelected = b.id === selectedElementId;
        const isActiveInScene = activeBoxIds?.includes(b.id) ?? true;
        if (isSelected) return null;

        return (
          <div
            key={b.id}
            style={toPctStyle(b)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId(b.id);
            }}
            className={`absolute border border-dashed rounded-xl cursor-pointer transition-all pointer-events-auto ${
              isActiveInScene
                ? 'border-white/20 hover:border-primary/80 hover:bg-primary/5'
                : 'border-white/10 opacity-40 hover:opacity-100 hover:border-primary/50'
            }`}
            title={`点击选中: ${b.id}`}
          />
        );
      })}

      {/* 2. Render Active Transform Handles for Selected Box */}
      {displayBox && selectedBox && (
        <div
          style={toPctStyle(displayBox)}
          className="absolute border-2 border-primary rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] pointer-events-auto select-none group"
        >
          {/* Central Body Drag Area */}
          <div
            onPointerDown={(e) => handleStartDrag('move', e)}
            className="absolute inset-2 cursor-move flex items-center justify-center bg-primary/5 hover:bg-primary/10 rounded-lg transition"
            title="按住鼠标左键平移此高亮框 (支持松手磁吸)"
          >
            <span className="opacity-0 group-hover:opacity-80 transition bg-background/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-primary flex items-center gap-1 shadow-sm">
              <Move className="w-3 h-3" />
              <span>拖拽移动</span>
            </span>
          </div>

          {/* Top Floating Mini Toolbar */}
          <div
            className="absolute -top-10 left-0 flex items-center gap-1.5 bg-panel/95 border border-primary/40 px-2 py-1 rounded-lg shadow-xl backdrop-blur-md z-30"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-primary font-bold pr-1 border-r border-border">
              {selectedBox.id}
            </span>

            {/* Quick Color Palette */}
            <div className="flex items-center gap-1 px-1">
              {PALETTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ backgroundColor: color }}
                  onClick={() => updateElementStyle(selectedBox.id, { stroke: color, fill: color })}
                  className={`w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition cursor-pointer ${
                    (selectedBox.style?.stroke || '#38bdf8') === color ? 'ring-2 ring-primary scale-110' : ''
                  }`}
                  title={`设为 ${color}`}
                />
              ))}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => {
                deleteElement('boxes', selectedBox.id);
                setSelectedElementId(null);
              }}
              className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition cursor-pointer"
              title="删除此框选"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* Close / Deselect */}
            <button
              type="button"
              onClick={() => setSelectedElementId(null)}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition cursor-pointer"
              title="取消选中 (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* 8 Resize Control Handles */}
          {/* Top Left */}
          <div
            onPointerDown={(e) => handleStartDrag('nw', e)}
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-nw-resize hover:scale-125 transition shadow-md"
          />
          {/* Top Center */}
          <div
            onPointerDown={(e) => handleStartDrag('n', e)}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-n-resize hover:scale-125 transition shadow-md"
          />
          {/* Top Right */}
          <div
            onPointerDown={(e) => handleStartDrag('ne', e)}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-ne-resize hover:scale-125 transition shadow-md"
          />
          {/* Right Center */}
          <div
            onPointerDown={(e) => handleStartDrag('e', e)}
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-e-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Right */}
          <div
            onPointerDown={(e) => handleStartDrag('se', e)}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-se-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Center */}
          <div
            onPointerDown={(e) => handleStartDrag('s', e)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-s-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Left */}
          <div
            onPointerDown={(e) => handleStartDrag('sw', e)}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-sw-resize hover:scale-125 transition shadow-md"
          />
          {/* Left Center */}
          <div
            onPointerDown={(e) => handleStartDrag('w', e)}
            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-primary rounded-full cursor-w-resize hover:scale-125 transition shadow-md"
          />
        </div>
      )}
    </div>
  );
}
