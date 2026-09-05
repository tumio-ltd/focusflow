import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ElementBox, CalloutItem } from '@focusflow/dsl';
import { Trash2, X, Move, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { useEditorStore, useProjectStore } from '@/stores';

export interface CalloutTransformOverlayProps {
  contentWidth: number;
  contentHeight: number;
  active: boolean;
  boxes?: ElementBox[];
}

const THEME_COLORS: Record<string, { border: string; glow: string; text: string; bg: string; dot: string }> = {
  blue: {
    border: 'border-sky-400',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.7)]',
    text: 'text-sky-300',
    bg: 'bg-sky-500/20',
    dot: '#38bdf8',
  },
  green: {
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.7)]',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/20',
    dot: '#34d399',
  },
  amber: {
    border: 'border-amber-400',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.7)]',
    text: 'text-amber-300',
    bg: 'bg-amber-500/20',
    dot: '#fbbf24',
  },
  pink: {
    border: 'border-pink-400',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.7)]',
    text: 'text-pink-300',
    bg: 'bg-pink-500/20',
    dot: '#f472b6',
  },
  purple: {
    border: 'border-purple-400',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.7)]',
    text: 'text-purple-300',
    bg: 'bg-purple-500/20',
    dot: '#a855f7',
  },
};

const THEME_OPTIONS = [
  { id: 'blue', color: '#38bdf8', name: '蓝' },
  { id: 'green', color: '#34d399', name: '绿' },
  { id: 'amber', color: '#fbbf24', name: '黄' },
  { id: 'pink', color: '#f472b6', name: '粉' },
  { id: 'purple', color: '#a855f7', name: '紫' },
];

function parseCoord(coordStr: string | undefined, total: number): number {
  if (!coordStr) return 0;
  if (coordStr.endsWith('%')) {
    return (parseFloat(coordStr) / 100) * total;
  }
  return parseFloat(coordStr) || 0;
}

export function CalloutTransformOverlay({
  contentWidth,
  contentHeight,
  active,
  boxes = [],
}: CalloutTransformOverlayProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const activeSceneIndex = useEditorStore((s) => s.activeSceneIndex);
  const dsl = useProjectStore((s) => s.dsl);
  const updateCallout = useProjectStore((s) => s.updateCallout);
  const deleteElement = useProjectStore((s) => s.deleteElement);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentScene = dsl.scenes[activeSceneIndex];
  const activeCallouts = currentScene?.activeElements?.callouts || [];

  // 聚合所有场景可能选中的 Callout (响应式计算，删除后立即同步更新)
  const allCalloutsMap = useMemo(() => {
    const map = new Map<string, CalloutItem>();
    dsl.scenes.forEach((s) => {
      (s.activeElements?.callouts || []).forEach((c) => {
        map.set(c.id, c);
      });
    });
    return map;
  }, [dsl.scenes]);

  const selectedCallout =
    activeCallouts.find((c) => c.id === selectedElementId) ||
    allCalloutsMap.get(selectedElementId || '');

  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (!selectedCallout) return;
      deleteElement('callouts', selectedCallout.id);
      setSelectedElementId(null);
    },
    [selectedCallout, deleteElement, setSelectedElementId]
  );

  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      e?.preventDefault();
      setSelectedElementId(null);
    },
    [setSelectedElementId]
  );

  const [dragState, setDragState] = useState<{
    startPointerX: number;
    startPointerY: number;
    startCalloutX: number;
    startCalloutY: number;
    currentCalloutX: number;
    currentCalloutY: number;
  } | null>(null);

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
    if (!selectedCallout || !active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCallout, active, handleDelete, handleClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!selectedCallout) return;
    e.stopPropagation();
    e.preventDefault();

    const coords = getCanvasCoords(e);
    const initialX = parseCoord(selectedCallout.position.left, contentWidth);
    const initialY = parseCoord(selectedCallout.position.top, contentHeight);

    setDragState({
      startPointerX: coords.x,
      startPointerY: coords.y,
      startCalloutX: initialX,
      startCalloutY: initialY,
      currentCalloutX: initialX,
      currentCalloutY: initialY,
    });

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;

    const coords = getCanvasCoords(e);
    const dx = coords.x - dragState.startPointerX;
    const dy = coords.y - dragState.startPointerY;

    const nextX = Math.max(0, Math.min(contentWidth - 60, dragState.startCalloutX + dx));
    const nextY = Math.max(0, Math.min(contentHeight - 40, dragState.startCalloutY + dy));

    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentCalloutX: Math.round(nextX),
            currentCalloutY: Math.round(nextY),
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState || !selectedCallout) return;

    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    updateCallout(selectedCallout.id, {
      position: {
        left: `${dragState.currentCalloutX}px`,
        top: `${dragState.currentCalloutY}px`,
      },
    });
    setDragState(null);
  };

  if (!active) return null;

  const currentX = dragState
    ? dragState.currentCalloutX
    : selectedCallout
      ? parseCoord(selectedCallout.position.left, contentWidth)
      : 0;

  const currentY = dragState
    ? dragState.currentCalloutY
    : selectedCallout
      ? parseCoord(selectedCallout.position.top, contentHeight)
      : 0;

  const currentTheme = selectedCallout ? (THEME_COLORS[selectedCallout.theme || 'blue'] || THEME_COLORS.blue) : THEME_COLORS.blue;

  // 检查是否有绑定的目标框元
  const targetBox = selectedCallout?.targetBoxId
    ? boxes.find((b) => b.id === selectedCallout.targetBoxId)
    : null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 pointer-events-none"
      data-testid="callout-transform-overlay"
    >
      {/* 1. 若选中气泡且绑定了目标 Box，绘制连接指示流光虚线 */}
      {selectedCallout && targetBox && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <linearGradient id="callout-leader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.dot} stopOpacity="0.8" />
              <stop offset="100%" stopColor={currentTheme.dot} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* 连接线：从框元中心连向气泡左上卡片 */}
          <line
            x1={targetBox.x + targetBox.width / 2}
            y1={targetBox.y + targetBox.height / 2}
            x2={currentX + 16}
            y2={currentY + 16}
            stroke="url(#callout-leader-grad)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          {/* 框元中心锚定圆环 */}
          <circle
            cx={targetBox.x + targetBox.width / 2}
            cy={targetBox.y + targetBox.height / 2}
            r="5"
            fill={currentTheme.dot}
            className="animate-ping"
            opacity="0.6"
          />
          <circle
            cx={targetBox.x + targetBox.width / 2}
            cy={targetBox.y + targetBox.height / 2}
            r="4"
            fill={currentTheme.dot}
          />
        </svg>
      )}

      {/* 2. 当前场景未被选中的 Callout：可悬停点击选中热区 */}
      {activeCallouts.map((c) => {
        const isSelected = c.id === selectedElementId;
        if (isSelected) return null;

        const leftPx = parseCoord(c.position.left, contentWidth);
        const topPx = parseCoord(c.position.top, contentHeight);
        const theme = THEME_COLORS[c.theme || 'blue'] || THEME_COLORS.blue;

        const customMaxWidth = c.style?.maxWidth ? `${c.style.maxWidth}px` : '320px';

        return (
          <div
            key={c.id}
            style={{
              left: `${(leftPx / contentWidth) * 100}%`,
              top: `${(topPx / contentHeight) * 100}%`,
              minWidth: '200px',
              maxWidth: customMaxWidth,
              width: 'max-content',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElementId(c.id);
            }}
            className="absolute rounded-xl border border-dashed border-white/25 hover:border-sky-400/90 hover:bg-sky-400/10 transition-all duration-150 p-2.5 cursor-pointer pointer-events-auto select-none group bg-slate-900/60"
            title={`点击选中并调节解说气泡: ${c.title || c.id}`}
          >
            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: theme.dot }}
              />
              <span
                style={{
                  fontSize: c.style?.titleFontSize ? `${c.style.titleFontSize}px` : undefined,
                }}
                className="text-[10px] font-mono text-white/80 font-bold truncate"
              >
                {c.title || c.id}
              </span>
            </div>
          </div>
        );
      })}

      {/* 3. 选中的 Callout：发光边框、移动手柄与悬浮操作栏 */}
      {selectedCallout && (() => {
        const selectedMaxWidth = selectedCallout.style?.maxWidth
          ? `${selectedCallout.style.maxWidth}px`
          : '340px';

        return (
          <div
            style={{
              left: `${(currentX / contentWidth) * 100}%`,
              top: `${(currentY / contentHeight) * 100}%`,
              minWidth: '200px',
              maxWidth: selectedMaxWidth,
              width: 'max-content',
            }}
            className="absolute pointer-events-auto select-none"
          >
          {/* 顶部微型悬浮工具栏 */}
          <div
            className="absolute -top-10 left-0 flex items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 rounded-lg px-2 py-1 shadow-2xl backdrop-blur-md pointer-events-auto z-30 animate-in fade-in duration-100 select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 pr-1 border-r border-slate-700">
              <MessageSquare className="w-3 h-3 text-sky-400" />
              <span className="text-[10px] font-mono text-sky-300 font-bold">
                {selectedCallout.id}
              </span>
            </div>

            {/* 快速调色 */}
            <div className="flex items-center gap-1 px-1">
              {THEME_OPTIONS.map((opt) => {
                const isActive = (selectedCallout.theme || 'blue') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    style={{ backgroundColor: opt.color }}
                    onClick={() => updateCallout(selectedCallout.id, { theme: opt.id })}
                    className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-white scale-125 border-white'
                        : 'border-white/30 hover:scale-125'
                    }`}
                    title={`切换配色: ${opt.name}`}
                  />
                );
              })}
            </div>

            {targetBox && (
              <div
                className="flex items-center gap-0.5 px-1 bg-slate-800 rounded text-[9px] text-sky-300 font-mono border border-slate-700/60"
                title={`已关联框元: ${targetBox.id}`}
              >
                <LinkIcon className="w-2.5 h-2.5" />
                <span className="truncate max-w-[60px]">{targetBox.id}</span>
              </div>
            )}

            <div className="w-px h-3 bg-slate-700 mx-0.5" />

            {/* 快捷删除 */}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
              title="删除气泡 (Delete)"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* 取消选中 / 关闭 */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              title="取消选择 (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* 气泡卡片主体 (支持拖拽移动) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              maxWidth: selectedCallout.style?.maxWidth ? `${selectedCallout.style.maxWidth}px` : undefined,
            }}
            className={`relative rounded-xl border-2 ${currentTheme.border} ${currentTheme.glow} bg-slate-900/95 p-3.5 cursor-move active:cursor-grabbing group hover:border-opacity-100 transition shadow-2xl`}
            title="按住拖拽移动解说气泡位置"
          >
            {/* 拖拽指示器角标与快捷关闭按钮 */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 text-slate-400 group-hover:text-white transition">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleClose}
                className="p-0.5 hover:bg-white/20 text-slate-400 hover:text-white rounded transition cursor-pointer"
                title="取消选中 / 关闭 (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <Move className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </div>

            {/* 徽章标题 */}
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                style={{
                  fontSize: selectedCallout.style?.titleFontSize ? `${selectedCallout.style.titleFontSize}px` : undefined,
                }}
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${currentTheme.bg} ${currentTheme.text} border border-current`}
              >
                {selectedCallout.title || '解说气泡'}
              </span>
            </div>

            {/* 正文描述预览 */}
            <div
              style={{
                fontSize: selectedCallout.style?.fontSize ? `${selectedCallout.style.fontSize}px` : undefined,
              }}
              className="text-[12px] text-slate-300 line-clamp-3 leading-relaxed"
            >
              {selectedCallout.desc || '（暂无描述，可在右侧属性面板编辑）'}
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
