import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Crosshair, Move } from 'lucide-react';
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
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* 1. 安全取景框主体 (边框发光 + 准星，内部透明穿透不阻断画布操作) */}
      <div
        ref={frameRef}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={handleKeyDown}
        data-testid="camera-frustum-frame"
        className={`absolute border-2 rounded-xl transition-shadow duration-150 select-none outline-none pointer-events-none ${
          isSelected || isDragging || isResizing
            ? 'border-cyan-300 shadow-[0_0_35px_rgba(56,189,248,0.45)] ring-1 ring-cyan-400'
            : 'border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.2)]'
        }`}
        style={{
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
      >
        {/* 左上角摄像机镜头标签 (可抓取拖拽平移取景框) */}
        <div
          data-testid="camera-frustum-badge"
          onPointerDown={handlePointerDownMove}
          className={`absolute -top-7 left-0 flex items-center gap-1.5 bg-cyan-950/90 border border-cyan-500/60 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-mono text-cyan-300 shadow-lg ${
            isInteractive ? 'pointer-events-auto cursor-grab active:cursor-grabbing hover:bg-cyan-900/90 hover:border-cyan-400' : 'pointer-events-none'
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

        {/* 视口中心准星 */}
        <div className="absolute inset-0 flex items-center justify-center text-cyan-400/40 pointer-events-none">
          <Crosshair className="w-6 h-6 animate-pulse" />
        </div>

        {/* 四角缩放手柄 */}
        {isInteractive ? (
          <>
            <div
              data-testid="camera-handle-nw"
              onPointerDown={(e) => handleCornerResizeDown('nw', e)}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-cyan-950 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-ne"
              onPointerDown={(e) => handleCornerResizeDown('ne', e)}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-cyan-950 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-sw"
              onPointerDown={(e) => handleCornerResizeDown('sw', e)}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-cyan-950 rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform"
              title="按住等比例缩放镜头"
            />
            <div
              data-testid="camera-handle-se"
              onPointerDown={(e) => handleCornerResizeDown('se', e)}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 border-2 border-cyan-950 rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform"
              title="按住等比例缩放镜头"
            />
          </>
        ) : (
          <>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300 pointer-events-none" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300 pointer-events-none" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300 pointer-events-none" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300 pointer-events-none" />
          </>
        )}
      </div>
    </div>
  );
}
