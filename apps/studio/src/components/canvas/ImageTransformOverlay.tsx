import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ElementImage } from '@focusflow/dsl';
import { useEditorStore, useProjectStore } from '@/stores';
import { Trash2, X, Move, Lock, Unlock, Image as ImageIcon } from 'lucide-react';

export interface ImageTransformOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  images: ElementImage[];
  activeImageIds?: string[];
}

type HandleType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  handle: HandleType;
  startPointerX: number;
  startPointerY: number;
  startBox: { x: number; y: number; width: number; height: number };
  currentBox: { x: number; y: number; width: number; height: number };
  aspectRatio: number;
}

const PALETTE_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899', '#ffffff'];

export function ImageTransformOverlay({
  contentWidth,
  contentHeight,
  active,
  images,
  activeImageIds,
}: ImageTransformOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const updateImage = useProjectStore((s) => s.updateImage);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const deleteElement = useProjectStore((s) => s.deleteElement);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isRatioLocked, setIsRatioLocked] = useState(true);

  // Find currently selected image
  const selectedImage = images.find((img) => img.id === selectedElementId);

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
        deleteElement('images', selectedElementId);
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, selectedElementId, setSelectedElementId, deleteElement]);

  // Click on background to deselect or hit-test unselected images
  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if (!active || dragState) return;
    if (e.target === containerRef.current) {
      const coords = getCanvasCoords(e);
      const hitImage = [...images].reverse().find((img) => {
        return (
          coords.x >= img.x &&
          coords.x <= img.x + img.width &&
          coords.y >= img.y &&
          coords.y <= img.y + img.height
        );
      });

      if (hitImage) {
        setSelectedElementId(hitImage.id);
      } else {
        setSelectedElementId(null);
      }
    }
  };

  const handleStartDrag = (handle: HandleType, e: React.PointerEvent) => {
    if (!selectedImage) return;
    e.stopPropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e);
    const initialAspect = selectedImage.width / (selectedImage.height || 1);

    setDragState({
      handle,
      startPointerX: coords.x,
      startPointerY: coords.y,
      startBox: {
        x: selectedImage.x,
        y: selectedImage.y,
        width: selectedImage.width,
        height: selectedImage.height,
      },
      currentBox: {
        x: selectedImage.x,
        y: selectedImage.y,
        width: selectedImage.width,
        height: selectedImage.height,
      },
      aspectRatio: initialAspect > 0 ? initialAspect : 1.5,
    });

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const coords = getCanvasCoords(e);
    const dx = coords.x - dragState.startPointerX;
    const dy = coords.y - dragState.startPointerY;
    const { startBox, handle, aspectRatio } = dragState;
    const lockRatio = isRatioLocked || e.shiftKey;

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
        if (lockRatio) {
          const change = Math.max(dx, dy * aspectRatio);
          nextW = Math.max(40, startBox.width - change);
          nextH = nextW / aspectRatio;
          nextX = startBox.x + (startBox.width - nextW);
          nextY = startBox.y + (startBox.height - nextH);
        } else {
          nextX = Math.min(startBox.x + startBox.width - 40, startBox.x + dx);
          nextY = Math.min(startBox.y + startBox.height - 40, startBox.y + dy);
          nextW = startBox.width - (nextX - startBox.x);
          nextH = startBox.height - (nextY - startBox.y);
        }
        break;
      case 'n':
        nextY = Math.min(startBox.y + startBox.height - 40, startBox.y + dy);
        nextH = startBox.height - (nextY - startBox.y);
        if (lockRatio) nextW = nextH * aspectRatio;
        break;
      case 'ne':
        if (lockRatio) {
          nextW = Math.max(40, startBox.width + dx);
          nextH = nextW / aspectRatio;
          nextY = startBox.y + (startBox.height - nextH);
        } else {
          nextW = Math.max(40, startBox.width + dx);
          nextY = Math.min(startBox.y + startBox.height - 40, startBox.y + dy);
          nextH = startBox.height - (nextY - startBox.y);
        }
        break;
      case 'e':
        nextW = Math.max(40, startBox.width + dx);
        if (lockRatio) nextH = nextW / aspectRatio;
        break;
      case 'se':
        if (lockRatio) {
          nextW = Math.max(40, startBox.width + dx);
          nextH = nextW / aspectRatio;
        } else {
          nextW = Math.max(40, startBox.width + dx);
          nextH = Math.max(40, startBox.height + dy);
        }
        break;
      case 's':
        nextH = Math.max(40, startBox.height + dy);
        if (lockRatio) nextW = nextH * aspectRatio;
        break;
      case 'sw':
        if (lockRatio) {
          nextW = Math.max(40, startBox.width - dx);
          nextH = nextW / aspectRatio;
          nextX = startBox.x + (startBox.width - nextW);
        } else {
          nextX = Math.min(startBox.x + startBox.width - 40, startBox.x + dx);
          nextW = startBox.width - (nextX - startBox.x);
          nextH = Math.max(40, startBox.height + dy);
        }
        break;
      case 'w':
        nextX = Math.min(startBox.x + startBox.width - 40, startBox.x + dx);
        nextW = startBox.width - (nextX - startBox.x);
        if (lockRatio) nextH = nextW / aspectRatio;
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
    if (!dragState || !selectedImage) return;

    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    const finalBounds = dragState.currentBox;
    updateImage(selectedImage.id, finalBounds);
    setDragState(null);
  };

  if (!active) return null;

  const displayImage = dragState ? dragState.currentBox : selectedImage;

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
      data-testid="image-transform-overlay"
    >
      {/* 1. Render interactive hit areas for unselected images */}
      {images.map((img) => {
        const isSelected = img.id === selectedElementId;
        const isActiveInScene = activeImageIds?.includes(img.id) ?? true;
        if (isSelected) return null;

        return (
          <div
            key={img.id}
            style={toPctStyle(img)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId(img.id);
            }}
            className={`absolute border border-dashed rounded-xl cursor-pointer transition-all pointer-events-auto group/hit ${
              isActiveInScene
                ? 'border-pink-500/30 hover:border-pink-400 hover:bg-pink-500/10'
                : 'border-white/10 opacity-40 hover:opacity-100 hover:border-pink-400/50'
            }`}
            title={`点击选中插图: ${img.id}`}
          >
            <span className="absolute top-1.5 left-1.5 opacity-0 group-hover/hit:opacity-90 transition bg-panel/90 text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 shadow">
              <ImageIcon className="w-2.5 h-2.5" />
              <span>{img.id}</span>
            </span>
          </div>
        );
      })}

      {/* 2. Render Active Transform Box & Handles for Selected Image */}
      {displayImage && selectedImage && (
        <div
          style={toPctStyle(displayImage)}
          className="absolute border-2 border-pink-500 rounded-xl shadow-[0_0_24px_rgba(236,72,153,0.45)] pointer-events-auto select-none group"
        >
          {/* Central Body Drag Area */}
          <div
            onPointerDown={(e) => handleStartDrag('move', e)}
            className="absolute inset-2 cursor-move flex items-center justify-center bg-pink-500/5 hover:bg-pink-500/15 rounded-lg transition"
            title="按住鼠标左键拖拽位移此插图"
          >
            <span className="opacity-0 group-hover:opacity-90 transition bg-background/95 px-2.5 py-1 rounded-md text-[10px] font-mono text-pink-400 flex items-center gap-1.5 shadow-md border border-pink-500/30">
              <Move className="w-3 h-3" />
              <span>拖拽移动 ({displayImage.width}×{displayImage.height})</span>
            </span>
          </div>

          {/* Top Floating Mini Toolbar */}
          <div
            className="absolute -top-10 left-0 flex items-center gap-1.5 bg-panel/95 border border-pink-500/40 px-2 py-1 rounded-lg shadow-xl z-30"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-mono text-pink-400 font-bold pr-1 border-r border-border flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-pink-400" />
              <span>{selectedImage.id}</span>
            </span>

            {/* Dimensions readout */}
            <span className="text-[10px] font-mono text-muted-foreground px-1">
              {displayImage.width}×{displayImage.height}
            </span>

            {/* Lock Aspect Ratio button */}
            <button
              type="button"
              onClick={() => setIsRatioLocked(!isRatioLocked)}
              className={`p-1 rounded transition cursor-pointer flex items-center gap-0.5 text-[10px] ${
                isRatioLocked
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={isRatioLocked ? '等比缩放已锁定 (点击解锁)' : '自由缩放 (点击锁定等比)'}
            >
              {isRatioLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>

            {/* Quick Border Color Palette */}
            <div className="flex items-center gap-1 px-1 border-l border-border/50">
              {PALETTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ backgroundColor: color }}
                  onClick={() => updateElementStyle(selectedImage.id, { border: `2px solid ${color}` })}
                  className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition cursor-pointer"
                  title={`设为边框颜色 ${color}`}
                />
              ))}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => {
                deleteElement('images', selectedImage.id);
                setSelectedElementId(null);
              }}
              className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition cursor-pointer"
              title="删除此插图"
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
            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-nw-resize hover:scale-125 transition shadow-md"
          />
          {/* Top Center */}
          <div
            onPointerDown={(e) => handleStartDrag('n', e)}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-n-resize hover:scale-125 transition shadow-md"
          />
          {/* Top Right */}
          <div
            onPointerDown={(e) => handleStartDrag('ne', e)}
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-ne-resize hover:scale-125 transition shadow-md"
          />
          {/* Right Center */}
          <div
            onPointerDown={(e) => handleStartDrag('e', e)}
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-e-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Right */}
          <div
            onPointerDown={(e) => handleStartDrag('se', e)}
            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-se-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Center */}
          <div
            onPointerDown={(e) => handleStartDrag('s', e)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-s-resize hover:scale-125 transition shadow-md"
          />
          {/* Bottom Left */}
          <div
            onPointerDown={(e) => handleStartDrag('sw', e)}
            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-sw-resize hover:scale-125 transition shadow-md"
          />
          {/* Left Center */}
          <div
            onPointerDown={(e) => handleStartDrag('w', e)}
            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3.5 h-3.5 bg-background border-2 border-pink-500 rounded-full cursor-w-resize hover:scale-125 transition shadow-md"
          />
        </div>
      )}
    </div>
  );
}
