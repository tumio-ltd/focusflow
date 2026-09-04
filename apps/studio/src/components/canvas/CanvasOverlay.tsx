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
import { ImageTransformOverlay } from './ImageTransformOverlay';
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
  const dsl = useProjectStore((s) => s.dsl);
  const activeSceneIndex = useEditorStore((s) => s.activeSceneIndex);
  const currentScene = dsl.scenes[activeSceneIndex];
  const dots = dsl.elements.dots || [];
  const images = dsl.elements.images || [];
  const activeBoxIds = currentScene?.activeElements?.boxes || [];
  const activeImageIds = currentScene?.activeElements?.images || [];
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
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-10"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* 0. 选中插图拖拽平移/拉伸缩放控制图层 (Layer 0.5 底层覆盖插图) */}
      <ImageTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        images={images}
        activeImageIds={activeImageIds}
      />

      {/* 1. 选中框元拖拽/拉伸/变色控制图层 (Layer 1 矢量运动框元) */}
      <BoxTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        boxes={boxes}
        activeBoxIds={activeBoxIds}
      />

      {/* 1.1 选中圆点拖拽平移控制图层 (Layer 1 脉冲圆点) */}
      <DotTransformOverlay
        contentWidth={contentWidth}
        contentHeight={contentHeight}
        active={activeTool === 'select'}
        dots={dots}
      />

      {/* 2. 选中解说气泡拖拽平移/调色控制图层 (Layer 2 浮动解说卡片) */}
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
    </div>
  );
}

export const CanvasOverlay = React.memo(CanvasOverlayComponent);
