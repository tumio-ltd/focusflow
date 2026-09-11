import React, { useState, useRef, useCallback } from 'react';
import { Camera, Move } from 'lucide-react';
import {
  cameraToFrustumRect,
  clampCameraBounds,
  parseAspectRatio,
  CameraConfig,
} from '@/utils/cameraMath';
import type { ToolType } from '@/components/layout';
import { useEditorStore, useProjectStore } from '@/stores';
import { useCanvasScale } from './InfiniteCanvas';

export interface CameraFrustumFrameProps {
  camera: CameraConfig;
  naturalWidth: number;
  naturalHeight: number;
  visible?: boolean;
  activeTool?: ToolType;
  canvasScale?: number;
  onCameraChange?: (camera: CameraConfig) => void;
}

export function CameraFrustumFrame({
  camera,
  naturalWidth,
  naturalHeight,
  visible = true,
  activeTool = 'select',
  canvasScale,
  onCameraChange,
}: CameraFrustumFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const dsl = useProjectStore((s) => s.dsl);
  const targetAspect = parseAspectRatio(dsl.meta?.viewport?.aspectRatio);

  const isStageMatchActive = useEditorStore((s) => s.isStageMatchActive);
  const showStageMask = isSelected || isDragging || isResizing || isStageMatchActive;

  const contextScale = useCanvasScale();
  const scale = Math.max(0.05, canvasScale ?? contextScale ?? 1.0);
  const invScale = 1 / scale;

  const rect = cameraToFrustumRect(camera, naturalWidth, naturalHeight, targetAspect);
  const isInteractive = activeTool === 'select' && !!onCameraChange;

  // 当取景框处于全景状态 (例如 zoom <= 1.05) 时，边框向内安全内缩屏幕 20px 物理安全间距，杜绝与底图外边框在同一个亚像素栅格上重叠冲突
  const isFullOverview =
    camera.zoom <= 1.05 && Math.abs(camera.x || 0) < 1 && Math.abs(camera.y || 0) < 1;
  const insetWorldPx = isFullOverview ? Math.min(rect.width * 0.1, 20 * invScale) : 0;
  const frameX = rect.x + insetWorldPx;
  const frameY = rect.y + insetWorldPx;
  const frameWidth = Math.max(10, rect.width - insetWorldPx * 2);
  const frameHeight = Math.max(10, rect.height - insetWorldPx * 2);

  // 1. 拖拽平移取景框 (Drag-to-Move)
  const handlePointerDownMove = (e: React.PointerEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsSelected(true);
    setIsDragging(true);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startCamera = { ...camera };

    // 获取当前屏幕像素与逻辑物理像素的实际缩放比
    const domRect = frameRef.current?.getBoundingClientRect();
    const actualScale = domRect && frameWidth > 0 ? domRect.width / frameWidth : scale;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / actualScale;
      const dy = (moveEv.clientY - startClientY) / actualScale;

      const deltaXPercent = (dx / naturalWidth) * 100;
      const deltaYPercent = (dy / naturalHeight) * 100;

      const rawX = (startCamera.x || 0) + deltaXPercent;
      const rawY = (startCamera.y || 0) + deltaYPercent;

      const clamped = clampCameraBounds(startCamera.zoom, rawX, rawY);
      onCameraChange?.({
        ...startCamera,
        x: clamped.x,
        y: clamped.y,
      });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 2. 拖拽四角手柄等比例缩放镜头 (Corner Resize Zoom)
  const handleCornerResizeDown = (corner: 'nw' | 'ne' | 'sw' | 'se', e: React.PointerEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsSelected(true);
    setIsResizing(corner);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startCamera = { ...camera };
    const startFrameWidth = rect.width;

    const domRect = frameRef.current?.getBoundingClientRect();
    const actualScale = domRect && frameWidth > 0 ? domRect.width / frameWidth : scale;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / actualScale;
      const dy = (moveEv.clientY - startClientY) / actualScale;

      // 根据对角拖拽方向推算宽高变化量
      let deltaSize = 0;
      if (corner === 'se') {
        deltaSize = (dx + dy) / 2;
      } else if (corner === 'nw') {
        deltaSize = (-dx - dy) / 2;
      } else if (corner === 'ne') {
        deltaSize = (dx - dy) / 2;
      } else if (corner === 'sw') {
        deltaSize = (-dx + dy) / 2;
      }

      const newFrameWidth = Math.max(100, Math.min(naturalWidth, startFrameWidth + deltaSize));
      const newZoom = Math.max(1.0, Math.min(3.5, naturalWidth / newFrameWidth));
      const roundedZoom = Math.round(newZoom * 10) / 10;

      const clamped = clampCameraBounds(roundedZoom, startCamera.x || 0, startCamera.y || 0);

      onCameraChange?.({
        ...startCamera,
        zoom: roundedZoom,
        x: clamped.x,
        y: clamped.y,
      });
    };

    const onPointerUp = () => {
      setIsResizing(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // 3. 键盘方向键像素级精细微调
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isInteractive || !isSelected) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        const step = e.shiftKey ? 2.0 : 0.5;
        let nextX = camera.x || 0;
        let nextY = camera.y || 0;

        if (e.key === 'ArrowLeft') nextX -= step;
        if (e.key === 'ArrowRight') nextX += step;
        if (e.key === 'ArrowUp') nextY -= step;
        if (e.key === 'ArrowDown') nextY += step;

        const clamped = clampCameraBounds(camera.zoom, nextX, nextY);
        onCameraChange?.({
          ...camera,
          x: clamped.x,
          y: clamped.y,
        });
      } else if (e.key === 'Escape') {
        setIsSelected(false);
      }
    },
    [isInteractive, isSelected, camera, onCameraChange],
  );

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {/* 1. 安全取景框主体 (边框发光 + 准星，内部透明穿透不阻断画布操作) */}
      <div
        ref={frameRef}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={handleKeyDown}
        data-testid="camera-frustum-frame"
        className="absolute select-none outline-none pointer-events-none"
        style={{
          left: `${frameX}px`,
          top: `${frameY}px`,
          width: `${frameWidth}px`,
          height: `${frameHeight}px`,
          boxShadow: showStageMask ? '0 0 0 9999px rgba(0, 0, 0, 0.40)' : undefined,
        }}
      >
        {/* 矢量非缩放工业级精准捕镜框 (Non-Scaling Stroke) - 直角无曲率退化，彻底根除缩放颤动 */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          {/* 底层深色高对比描边 (Under-stroke for strong contrast on bright / varied backgrounds) */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={isSelected || isDragging || isResizing ? 'rgba(56, 189, 248, 0.05)' : 'none'}
            stroke="rgba(8, 51, 68, 0.85)"
            strokeWidth={isSelected || isDragging || isResizing ? 4 : 3.5}
            vectorEffect="non-scaling-stroke"
          />

          {/* 表层科技青色高亮描边 (科技高亮虚线/实线) */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke={isSelected || isDragging || isResizing ? '#67e8f9' : '#22d3ee'}
            strokeWidth={isSelected || isDragging || isResizing ? 2.5 : 2}
            strokeDasharray={isFullOverview ? '6 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />

          {/* 四角直角卡尺标定线 (Corner Calipers) - 屏幕恒定长 16px、厚度 2.5px */}
          {(() => {
            const caliperLen = 16 * invScale;
            return (
              <g
                stroke={isSelected || isDragging || isResizing ? '#67e8f9' : '#22d3ee'}
                strokeWidth="2.5"
                fill="none"
                vectorEffect="non-scaling-stroke"
              >
                {/* NW */}
                <path d={`M 0,${caliperLen} L 0,0 L ${caliperLen},0`} />
                {/* NE */}
                <path
                  d={`M ${frameWidth - caliperLen},0 L ${frameWidth},0 L ${frameWidth},${caliperLen}`}
                />
                {/* SW */}
                <path
                  d={`M 0,${frameHeight - caliperLen} L 0,${frameHeight} L ${caliperLen},${frameHeight}`}
                />
                {/* SE */}
                <path
                  d={`M ${frameWidth - caliperLen},${frameHeight} L ${frameWidth},${frameHeight} L ${frameWidth},${frameHeight - caliperLen}`}
                />
              </g>
            );
          })()}

          {/* 视口中心精准标定准星 (恒定屏幕像素尺寸，防坍塌) */}
          <g transform={`translate(${frameWidth / 2}, ${frameHeight / 2}) scale(${invScale})`}>
            <circle
              cx="0"
              cy="0"
              r="14"
              fill="none"
              stroke="rgba(8, 51, 68, 0.6)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx="0"
              cy="0"
              r="14"
              fill="none"
              stroke="rgba(34, 211, 238, 0.65)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="-20"
              y1="0"
              x2="-6"
              y2="0"
              stroke="#22d3ee"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="6"
              y1="0"
              x2="20"
              y2="0"
              stroke="#22d3ee"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="-20"
              x2="0"
              y2="-6"
              stroke="#22d3ee"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="6"
              x2="0"
              y2="20"
              stroke="#22d3ee"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="0" cy="0" r="1.5" fill="#22d3ee" />
          </g>
        </svg>

        {/* 左上角摄像机镜头标签 (scale(invScale) 逆矩阵，屏幕物理像素恒定 11px) */}
        <div
          style={{
            position: 'absolute',
            left: `${(isFullOverview || frameY * scale < 36 ? 8 : 0) * invScale}px`,
            top: `${(isFullOverview || frameY * scale < 36 ? 8 : -32) * invScale}px`,
            transform: `scale(${invScale})`,
            transformOrigin: 'top left',
          }}
          className="pointer-events-none z-20"
        >
          <div
            data-testid="camera-frustum-badge"
            onPointerDown={handlePointerDownMove}
            className={`flex items-center gap-1.5 bg-cyan-950/95 border border-cyan-500/40 px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-300 shadow-xl select-none ${
              isInteractive
                ? 'pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-cyan-900/95 hover:border-cyan-400'
                : 'pointer-events-none'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {camera.zoom.toFixed(1)}x · ({camera.x || 0}%, {camera.y || 0}%)
            </span>
            {isInteractive && (
              <span className="flex items-center gap-0.5 text-[9px] text-cyan-400/80 border-l border-cyan-500/40 pl-1.5 ml-0.5 whitespace-nowrap">
                <Move className="w-2.5 h-2.5" />
                <span>拖拽微调</span>
              </span>
            )}
          </div>
        </div>

        {/* 四周边缘热区 (按住边框可拖拽平移，热区厚度屏幕恒定 14px) */}
        {isInteractive && (
          <>
            <div
              onPointerDown={handlePointerDownMove}
              style={{
                position: 'absolute',
                top: `${-7 * invScale}px`,
                height: `${14 * invScale}px`,
                left: `${14 * invScale}px`,
                right: `${14 * invScale}px`,
              }}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              style={{
                position: 'absolute',
                bottom: `${-7 * invScale}px`,
                height: `${14 * invScale}px`,
                left: `${14 * invScale}px`,
                right: `${14 * invScale}px`,
              }}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              style={{
                position: 'absolute',
                left: `${-7 * invScale}px`,
                width: `${14 * invScale}px`,
                top: `${14 * invScale}px`,
                bottom: `${14 * invScale}px`,
              }}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              style={{
                position: 'absolute',
                right: `${-7 * invScale}px`,
                width: `${14 * invScale}px`,
                top: `${14 * invScale}px`,
                bottom: `${14 * invScale}px`,
              }}
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
          </>
        )}

        {/* 四角交互热区与视觉手柄 (屏幕恒定 12px 视觉尺寸与 28px 触控热区) */}
        {isInteractive && (
          <>
            {/* NW Handle */}
            <div
              data-testid="camera-handle-nw"
              onPointerDown={(e) => handleCornerResizeDown('nw', e)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `scale(${invScale})`,
                transformOrigin: 'center center',
              }}
              className="w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-nwse-resize group z-10"
              title="按住等比例缩放镜头"
            >
              <div className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 rounded-sm shadow-md group-hover:bg-cyan-300 group-hover:scale-125 transition-transform" />
            </div>

            {/* NE Handle */}
            <div
              data-testid="camera-handle-ne"
              onPointerDown={(e) => handleCornerResizeDown('ne', e)}
              style={{
                position: 'absolute',
                left: `${frameWidth}px`,
                top: 0,
                transform: `scale(${invScale})`,
                transformOrigin: 'center center',
              }}
              className="w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-nesw-resize group z-10"
              title="按住等比例缩放镜头"
            >
              <div className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 rounded-sm shadow-md group-hover:bg-cyan-300 group-hover:scale-125 transition-transform" />
            </div>

            {/* SW Handle */}
            <div
              data-testid="camera-handle-sw"
              onPointerDown={(e) => handleCornerResizeDown('sw', e)}
              style={{
                position: 'absolute',
                left: 0,
                top: `${frameHeight}px`,
                transform: `scale(${invScale})`,
                transformOrigin: 'center center',
              }}
              className="w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-nesw-resize group z-10"
              title="按住等比例缩放镜头"
            >
              <div className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 rounded-sm shadow-md group-hover:bg-cyan-300 group-hover:scale-125 transition-transform" />
            </div>

            {/* SE Handle */}
            <div
              data-testid="camera-handle-se"
              onPointerDown={(e) => handleCornerResizeDown('se', e)}
              style={{
                position: 'absolute',
                left: `${frameWidth}px`,
                top: `${frameHeight}px`,
                transform: `scale(${invScale})`,
                transformOrigin: 'center center',
              }}
              className="w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-nwse-resize group z-10"
              title="按住等比例缩放镜头"
            >
              <div className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 rounded-sm shadow-md group-hover:bg-cyan-300 group-hover:scale-125 transition-transform" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
