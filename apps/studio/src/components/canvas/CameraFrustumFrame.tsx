import React from 'react';
import { Camera, Crosshair } from 'lucide-react';
import { cameraToFrustumRect, CameraConfig } from '@/utils/cameraMath';

export interface CameraFrustumFrameProps {
  camera: CameraConfig;
  naturalWidth: number;
  naturalHeight: number;
  visible?: boolean;
}

export function CameraFrustumFrame({
  camera,
  naturalWidth,
  naturalHeight,
  visible = true,
}: CameraFrustumFrameProps) {
  if (!visible) return null;

  const rect = cameraToFrustumRect(camera, naturalWidth, naturalHeight);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* 1. 安全取景框主体 (发光边框 + 准星) */}
      <div
        data-testid="camera-frustum-frame"
        className="absolute border-2 border-primary/80 rounded-xl transition-all duration-150 ease-out shadow-2xl"
        style={{
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(56, 189, 248, 0.1)',
        }}
      >
        {/* 左上角摄像机镜头标签 */}
        <div className="absolute -top-8 left-0 flex items-center gap-1.5 bg-panel/90 border border-primary/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-mono text-primary shadow-lg font-semibold">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span>
            {camera.zoom.toFixed(1)}x · ({camera.x || 0}%, {camera.y || 0}%)
          </span>
        </div>

        {/* 视口中心准星 */}
        <div className="absolute inset-0 flex items-center justify-center text-primary/40">
          <Crosshair className="w-6 h-6 animate-pulse" />
        </div>

        {/* 四角标记手柄 */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-primary" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-primary" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-primary" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-primary" />
      </div>
    </div>
  );
}
