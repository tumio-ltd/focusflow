import React from 'react';
import type { ElementBox, ElementPath, ElementDot, CalloutItem } from '@focusflow/dsl';
import type { ToolType } from '@/components/layout';
import type { CameraConfig } from '@/utils/cameraMath';
import { CameraFrustumFrame } from './CameraFrustumFrame';
import { BoxDrawingOverlay } from './BoxDrawingOverlay';
import { PathDrawingOverlay } from './PathDrawingOverlay';
import { DotDrawingOverlay } from './DotDrawingOverlay';
import { CalloutOverlay } from './CalloutOverlay';

export interface CanvasOverlayProps {
  contentWidth: number;
  contentHeight: number;
  activeTool: ToolType;
  camera: CameraConfig;
  boxes: ElementBox[];
  isPlaying?: boolean;
  onBoxCreated: (box: ElementBox) => void;
  onPathCreated: (path: ElementPath) => void;
  onDotCreated: (dot: ElementDot) => void;
  onCalloutCreated: (callout: CalloutItem) => void;
}

export function CanvasOverlay({
  contentWidth,
  contentHeight,
  activeTool,
  camera,
  boxes,
  isPlaying = false,
  onBoxCreated,
  onPathCreated,
  onDotCreated,
  onCalloutCreated,
}: CanvasOverlayProps) {
  return (
    <>
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

      {/* 5. 摄像机安全取景框 (Frustum) */}
      <CameraFrustumFrame
        camera={camera}
        naturalWidth={contentWidth}
        naturalHeight={contentHeight}
        visible={!isPlaying}
      />
    </>
  );
}
