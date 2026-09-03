import React, { useCallback } from 'react';
import type { ElementBox, ElementPath, ElementDot, ElementImage, CalloutItem } from '@focusflow/dsl';
import type { ToolType } from '@/components/layout';
import type { CameraConfig } from '@/utils/cameraMath';
import { useEditorStore, useProjectStore } from '@/stores';
import { CameraFrustumFrame } from './CameraFrustumFrame';
import { BoxDrawingOverlay } from './BoxDrawingOverlay';
import { BoxTransformOverlay } from './BoxTransformOverlay';
import { DotTransformOverlay } from './DotTransformOverlay';
import { CalloutTransformOverlay } from './CalloutTransformOverlay';
import { PathDrawingOverlay } from './PathDrawingOverlay';
import { DotDrawingOverlay } from './DotDrawingOverlay';
import { CalloutOverlay } from './CalloutOverlay';
import { ImageDrawingOverlay } from './ImageDrawingOverlay';

export interface CanvasOverlayProps {
  contentWidth: number;
  contentHeight: number;
  activeTool: ToolType;
  camera: CameraConfig;
  boxes: ElementBox[];
  isPlaying?: boolean;
  onCameraChange?: (camera: CameraConfig) => void;
  onBoxCreated: (box: ElementBox) => void;
  onPathCreated: (path: ElementPath) => void;
  onDotCreated: (dot: ElementDot) => void;
  onCalloutCreated: (callout: CalloutItem) => void;
  onImageCreated?: (image: ElementImage) => void;
  onlyCoordinates?: boolean;
  showFrustumOnly?: boolean;
  showCrosshairAndFrustum?: boolean;
}

import { coordinateBus } from '@/utils/coordinateBus';

function LaserCrosshairOverlay() {
  const isCrosshairEnabled = useEditorStore((s) => s.isCrosshairEnabled);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hLineRef = React.useRef<HTMLDivElement>(null);
  const vLineRef = React.useRef<HTMLDivElement>(null);
  const badgeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isCrosshairEnabled) return;
    return coordinateBus.subscribe((coords) => {
      if (!containerRef.current) return;
      if (!coords) {
        containerRef.current.style.display = 'none';
        return;
      }
      containerRef.current.style.display = 'block';
      if (hLineRef.current) {
        hLineRef.current.style.top = `${coords.y}px`;
      }
      if (vLineRef.current) {
        vLineRef.current.style.left = `${coords.x}px`;
      }
      if (badgeRef.current) {
        badgeRef.current.style.left = `${coords.x}px`;
        badgeRef.current.style.top = `${coords.y}px`;
        badgeRef.current.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)}`;
      }
    });
  }, [isCrosshairEnabled]);

  if (!isCrosshairEnabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
      data-testid="crosshair-guide"
      style={{ display: 'none' }}
    >
      {/* 水平激光辅助线 */}
      <div
        ref={hLineRef}
        className="absolute left-0 right-0 h-px bg-primary/80 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
      />
      {/* 垂直激光辅助线 */}
      <div
        ref={vLineRef}
        className="absolute top-0 bottom-0 w-px bg-primary/80 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
      />
      {/* 激光十字中心坐标微徽章 */}
      <div
        ref={badgeRef}
        className="absolute bg-panel/90 border border-primary/40 rounded px-1.5 py-0.5 text-[10px] font-mono text-primary shadow-lg backdrop-blur-md pointer-events-none transform -translate-y-full ml-2 -mt-1"
      />
    </div>
  );
}

function CanvasOverlayComponent({
  contentWidth,
  contentHeight,
  activeTool,
  camera,
  boxes,
  isPlaying = false,
  onCameraChange,
  onBoxCreated,
  onPathCreated,
  onDotCreated,
  onCalloutCreated,
  onImageCreated,
  onlyCoordinates = false,
  showFrustumOnly = false,
  showCrosshairAndFrustum = false,
}: CanvasOverlayProps) {
  const dots = useProjectStore((s) => s.dsl.elements.dots || []);
  const rafRef = React.useRef<number | null>(null);
  const lastCoordsRef = React.useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 拖拽或平移画布时 (按住鼠标中键/左键)，不更新悬停坐标读数，彻底消除平移过程中的一切副作用
      if (e.buttons !== 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scaleX = contentWidth / rect.width;
        const scaleY = contentHeight / rect.height;
        const x = Math.round(Math.max(0, Math.min(contentWidth, (clientX - rect.left) * scaleX)));
        const y = Math.round(Math.max(0, Math.min(contentHeight, (clientY - rect.top) * scaleY)));

        // 亚像素与静止过滤：整数坐标未发生变化时不重复更新
        if (lastCoordsRef.current && lastCoordsRef.current.x === x && lastCoordsRef.current.y === y) {
          rafRef.current = null;
          return;
        }

        lastCoordsRef.current = { x, y };
        coordinateBus.emit({ x, y });
        rafRef.current = null;
      });
    },
    [contentWidth, contentHeight]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastCoordsRef.current = null;
    coordinateBus.emit(null);
  }, []);

  if (onlyCoordinates) {
    return (
      <div
        className="absolute inset-0 z-10"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    );
  }

  if (showFrustumOnly) {
    return (
      <div
        className="absolute inset-0 z-10"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* 5. 摄像机安全取景框 (Frustum) */}
        <CameraFrustumFrame
          camera={camera}
          naturalWidth={contentWidth}
          naturalHeight={contentHeight}
          visible={!isPlaying}
          activeTool={activeTool}
          onCameraChange={onCameraChange}
        />
      </div>
    );
  }

  if (showCrosshairAndFrustum) {
    return (
      <div
        className="absolute inset-0 z-10"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* 5. 摄像机安全取景框 (Frustum) */}
        <CameraFrustumFrame
          camera={camera}
          naturalWidth={contentWidth}
          naturalHeight={contentHeight}
          visible={!isPlaying}
          activeTool={activeTool}
          onCameraChange={onCameraChange}
        />

        {/* 6. 十字激光准星标定辅助线 (Laser Crosshair) */}
        <LaserCrosshairOverlay />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-10"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* 0. 选中框元拖拽/拉伸/变色控制图层 */}
      <BoxTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        boxes={boxes}
      />

      {/* 0.1 选中圆点拖拽平移控制图层 */}
      <DotTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        dots={dots}
      />

      {/* 0.2 选中解说气泡拖拽平移/调色控制图层 */}
      <CalloutTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        boxes={boxes}
      />

      {/* 1. 智能选框绘制图层 */}
      <BoxDrawingOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'box'}
        onBoxCreated={onBoxCreated}
      />

      {/* 2. 8 向锚点三次贝塞尔流光连线绘制图层 */}
      <PathDrawingOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        boxes={boxes}
        active={activeTool === 'path'}
        onPathCreated={onPathCreated}
      />

      {/* 3. 脉冲定位圆点放置图层 */}
      <DotDrawingOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'dot'}
        onDotCreated={onDotCreated}
      />

      {/* 4. 解说气泡卡片放置图层 */}
      <CalloutOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        boxes={boxes}
        active={activeTool === 'callout'}
        onCalloutCreated={onCalloutCreated}
      />

      {/* 4.1 场景局部插图/下钻子图放置图层 */}
      {onImageCreated && (
        <ImageDrawingOverlay
          contentWidth={contentWidth}
          contentHeight={contentHeight}
          active={activeTool === 'image'}
          onImageCreated={onImageCreated}
        />
      )}

      {/* 5. 摄像机安全取景框 (Frustum) */}
      <CameraFrustumFrame
        camera={camera}
        naturalWidth={contentWidth}
        naturalHeight={contentHeight}
        visible={!isPlaying}
        activeTool={activeTool}
        onCameraChange={onCameraChange}
      />

      {/* 6. 十字激光准星标定辅助线 (Laser Crosshair) */}
      <LaserCrosshairOverlay />
    </div>
  );
}

export const CanvasOverlay = React.memo(CanvasOverlayComponent);
