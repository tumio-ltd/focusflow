import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Move } from 'lucide-react';
import { cameraToFrustumRect, clampCameraBounds, CameraConfig } from '@/utils/cameraMath';
import type { ToolType } from '@/components/layout';

export interface CameraFrustumFrameProps {
  camera: CameraConfig;
  naturalWidth: number;
  naturalHeight: number;
  visible?: boolean;
  activeTool?: ToolType;
  onCameraChange?: (camera: CameraConfig) => void;
}

export function CameraFrustumFrame({
  camera,
  naturalWidth,
  naturalHeight,
  visible = true,
  activeTool = 'select',
  onCameraChange,
}: CameraFrustumFrameProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const rect = cameraToFrustumRect(camera, naturalWidth, naturalHeight);
  const isInteractive = activeTool === 'select' && !!onCameraChange;

  // 当取景框处于全景状态 (例如 zoom <= 1.05) 时，边框向内微调 2px 避让，杜绝与底图外边框在同一个亚像素栅格上重叠冲突
  const isFullOverview = camera.zoom <= 1.05 && Math.abs(camera.x || 0) < 1 && Math.abs(camera.y || 0) < 1;
  const frameX = isFullOverview ? rect.x + 2 : rect.x;
  const frameY = isFullOverview ? rect.y + 2 : rect.y;
  const frameWidth = isFullOverview ? Math.max(10, rect.width - 4) : rect.width;
  const frameHeight = isFullOverview ? Math.max(10, rect.height - 4) : rect.height;

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
    const scale = domRect && rect.width > 0 ? domRect.width / rect.width : 1;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / scale;
      const dy = (moveEv.clientY - startClientY) / scale;

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
    const startZoom = camera.zoom;
    const startCamera = { ...camera };
    const startFrameWidth = rect.width;

    const domRect = frameRef.current?.getBoundingClientRect();
    const scale = domRect && rect.width > 0 ? domRect.width / rect.width : 1;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / scale;
      const dy = (moveEv.clientY - startClientY) / scale;

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
    [isInteractive, isSelected, camera, onCameraChange]
  );

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
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
        }}
      >
        {/* 矢量非缩放工业级精准捕镜框 (Non-Scaling Stroke) - 直角无圆角无曲率退化，彻底根除缩放时的贝塞尔重细分颤动 */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={isSelected || isDragging || isResizing ? 'rgba(56, 189, 248, 0.04)' : 'none'}
            stroke={isSelected || isDragging || isResizing ? '#67e8f9' : 'rgba(34, 211, 238, 0.85)'}
            strokeWidth={isSelected || isDragging || isResizing ? 2.5 : 2}
            vectorEffect="non-scaling-stroke"
          />

          {/* 工业级四角 L 型标尺 (Non-Scaling Stroke) */}
          <path
            d={`M 0 20 L 0 0 L 20 0 M ${frameWidth - 20} 0 L ${frameWidth} 0 L ${frameWidth} 20 M 0 ${frameHeight - 20} L 0 ${frameHeight} L 20 ${frameHeight} M ${frameWidth - 20} ${frameHeight} L ${frameWidth} ${frameHeight} L ${frameWidth} ${frameHeight - 20}`}
            fill="none"
            stroke="#67e8f9"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />

          {/* 视口中心精准标定准星 (SVG 恒定线宽，彻底告别位图图标缩放走样) */}
          <g transform={`translate(${frameWidth / 2}, ${frameHeight / 2})`}>
            <circle cx="0" cy="0" r="12" fill="none" stroke="rgba(34, 211, 238, 0.45)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1="-18" y1="0" x2="-5" y2="0" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1="5" y1="0" x2="18" y2="0" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="-18" x2="0" y2="-5" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="5" x2="0" y2="18" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </g>

          {/* 交互状态下的四角视觉手柄 (Non-Scaling Stroke，恒定 8px，杜绝 HTML Div 缩放闪烁) */}
          {isInteractive && (
            <>
              <rect x="-4" y="-4" width="8" height="8" fill="#22d3ee" stroke="#042f2e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <rect x={frameWidth - 4} y="-4" width="8" height="8" fill="#22d3ee" stroke="#042f2e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <rect x="-4" y={frameHeight - 4} width="8" height="8" fill="#22d3ee" stroke="#042f2e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <rect x={frameWidth - 4} y={frameHeight - 4} width="8" height="8" fill="#22d3ee" stroke="#042f2e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        {/* 左上角摄像机镜头标签 */}
        <div
          data-testid="camera-frustum-badge"
          onPointerDown={handlePointerDownMove}
          className={`absolute ${
            frameY < 32 ? 'top-1.5 left-1.5' : '-top-7 left-0'
          } flex items-center gap-1.5 bg-cyan-950/95 px-2.5 py-0.5 rounded-md text-[11px] font-mono text-cyan-300 shadow-lg ${
            isInteractive ? 'pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-cyan-900/95' : 'pointer-events-none'
          }`}
        >
          <Camera className="w-3 h-3 text-cyan-400" />
          <span>
            {camera.zoom.toFixed(1)}x · ({camera.x || 0}%, {camera.y || 0}%)
          </span>
          {isInteractive && (
            <span className="flex items-center gap-0.5 text-[9px] text-cyan-400/70 border-l border-cyan-500/40 pl-1.5 ml-0.5">
              <Move className="w-2.5 h-2.5" />
              <span>拖拽微调</span>
            </span>
          )}
        </div>

        {/* 四周边缘热区 (按住边框可拖拽平移) */}
        {isInteractive && (
          <>
            <div
              onPointerDown={handlePointerDownMove}
              className="absolute -top-1 left-3 right-3 h-3 pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              className="absolute -bottom-1 left-3 right-3 h-3 pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              className="absolute top-3 bottom-3 -left-1 w-3 pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
            <div
              onPointerDown={handlePointerDownMove}
              className="absolute top-3 bottom-3 -right-1 w-3 pointer-events-auto cursor-grab active:cursor-grabbing"
              title="按住边框拖拽微调镜头"
            />
          </>
        )}

        {/* 四角交互热区 (透明触发层，确保大触控区域与精美视觉分离) */}
        {isInteractive && (
          <>
            <div
              data-testid="camera-handle-nw"
              onPointerDown={(e) => handleCornerResizeDown('nw', e)}
              className="absolute -top-3 -left-3 w-6 h-6 pointer-events-auto cursor-nwse-resize"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-ne"
              onPointerDown={(e) => handleCornerResizeDown('ne', e)}
              className="absolute -top-3 -right-3 w-6 h-6 pointer-events-auto cursor-nesw-resize"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-sw"
              onPointerDown={(e) => handleCornerResizeDown('sw', e)}
              className="absolute -bottom-3 -left-3 w-6 h-6 pointer-events-auto cursor-nesw-resize"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-se"
              onPointerDown={(e) => handleCornerResizeDown('se', e)}
              className="absolute -bottom-3 -right-3 w-6 h-6 pointer-events-auto cursor-nwse-resize"
              title="按住等比例缩放镜头"
            />
          </>
        )}
      </div>
    </div>
  );
}
