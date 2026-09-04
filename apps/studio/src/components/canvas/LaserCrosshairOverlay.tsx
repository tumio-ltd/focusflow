import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '@/stores';
import { coordinateBus } from '@/utils/coordinateBus';

export interface LaserCrosshairOverlayProps {
  transform: { x: number; y: number; scale: number };
  contentWidth: number;
  contentHeight: number;
}

export function LaserCrosshairOverlay({
  transform,
  contentWidth,
  contentHeight,
}: LaserCrosshairOverlayProps) {
  const isCrosshairEnabled = useEditorStore((s) => s.isCrosshairEnabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  const lastCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const isCopiedRef = useRef(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
  const shortcutLabel = isMac ? '⌥C' : 'Alt+C';

  const updateVisuals = (coords: { x: number; y: number } | null) => {
    if (!containerRef.current) return;
    if (!coords) {
      containerRef.current.style.display = 'none';
      return;
    }

    containerRef.current.style.display = 'block';
    const screenX = coords.x * transform.scale;
    const screenY = coords.y * transform.scale;

    if (hLineRef.current) {
      hLineRef.current.style.top = `${screenY}px`;
    }
    if (vLineRef.current) {
      vLineRef.current.style.left = `${screenX}px`;
    }
    if (badgeRef.current) {
      const badgeOffsetX = screenX > contentWidth * transform.scale - 180 ? -8 : 8;
      const badgeOffsetY = screenY < 32 ? 8 : -26;

      badgeRef.current.style.transform = badgeOffsetX < 0 ? 'translateX(-100%)' : 'none';
      badgeRef.current.style.left = `${screenX + badgeOffsetX}px`;
      badgeRef.current.style.top = `${screenY + badgeOffsetY}px`;

      if (!isCopiedRef.current) {
        badgeRef.current.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)} · ${shortcutLabel} 复制`;
      }
    }
  };

  // 1. 订阅鼠标坐标总线
  useEffect(() => {
    if (!isCrosshairEnabled) return;

    return coordinateBus.subscribe((coords) => {
      lastCoordsRef.current = coords;
      updateVisuals(coords);
    });
  }, [isCrosshairEnabled, transform.scale, contentWidth, contentHeight, shortcutLabel]);

  // 2. 当画布发生缩放或平移时，实时重定位（逆缩放补偿保证 1:1 绝对物理尺寸）
  useEffect(() => {
    if (isCrosshairEnabled && lastCoordsRef.current) {
      updateVisuals(lastCoordsRef.current);
    }
  }, [transform.x, transform.y, transform.scale, isCrosshairEnabled]);

  // 3. 订阅复制事件反馈
  useEffect(() => {
    return coordinateBus.subscribeCopy(() => {
      isCopiedRef.current = true;
      if (badgeRef.current) {
        badgeRef.current.textContent = '✓ 坐标已复制';
        badgeRef.current.className =
          'absolute bg-emerald-950/90 border border-emerald-500/70 rounded px-2 py-0.5 text-[11px] font-mono text-emerald-400 shadow-xl backdrop-blur-md pointer-events-none transition-all duration-150';
      }

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        isCopiedRef.current = false;
        if (badgeRef.current) {
          badgeRef.current.className =
            'absolute bg-panel/90 border border-primary/40 rounded px-2 py-0.5 text-[11px] font-mono text-primary shadow-lg backdrop-blur-md pointer-events-none transition-all duration-150';
          if (lastCoordsRef.current) {
            badgeRef.current.textContent = `${Math.round(lastCoordsRef.current.x)}, ${Math.round(
              lastCoordsRef.current.y
            )} · ${shortcutLabel} 复制`;
          }
        }
      }, 1500);
    });
  }, [shortcutLabel]);

  if (!isCrosshairEnabled) return null;

  return (
    <div
      ref={containerRef}
      data-testid="crosshair-guide"
      className="absolute pointer-events-none z-30 overflow-hidden select-none"
      style={{
        display: 'none',
        left: `${transform.x}px`,
        top: `${transform.y}px`,
        width: `${contentWidth * transform.scale}px`,
        height: `${contentHeight * transform.scale}px`,
      }}
    >
      {/* 恒定 1px 屏幕绝对细线 - 水平激光 */}
      <div
        ref={hLineRef}
        className="absolute left-0 right-0 h-px bg-primary/80 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
      />
      {/* 恒定 1px 屏幕绝对细线 - 垂直激光 */}
      <div
        ref={vLineRef}
        className="absolute top-0 bottom-0 w-px bg-primary/80 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
      />
      {/* 恒定物理尺寸的坐标与快捷键提示徽章 */}
      <div
        ref={badgeRef}
        className="absolute bg-panel/90 border border-primary/40 rounded px-2 py-0.5 text-[11px] font-mono text-primary shadow-lg backdrop-blur-md pointer-events-none transition-all duration-150"
      />
    </div>
  );
}
