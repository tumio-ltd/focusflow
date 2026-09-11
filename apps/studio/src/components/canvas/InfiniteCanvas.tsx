import React, { ReactNode, useEffect, createContext, useContext } from 'react';
import { Hand, Compass } from 'lucide-react';
import { useCanvasGesture } from '@/hooks/useCanvasGesture';
import { ZoomControls } from './ZoomControls';
import { LaserCrosshairOverlay } from './LaserCrosshairOverlay';
import { cameraToFrustumRect, parseAspectRatio, type CameraConfig } from '@/utils/cameraMath';
import { useEditorStore, useProjectStore } from '@/stores';

export interface CanvasContextValue {
  scale: number;
  x: number;
  y: number;
  containerWidth?: number;
  containerHeight?: number;
}

export const CanvasContext = createContext<CanvasContextValue>({
  scale: 1.0,
  x: 0,
  y: 0,
  containerWidth: 1920,
  containerHeight: 1080,
});
export const useCanvasTransform = () => useContext(CanvasContext);
export const useCanvasScale = () => useContext(CanvasContext).scale;

export interface InfiniteCanvasProps {
  children?: ReactNode;
  contentWidth?: number;
  contentHeight?: number;
  className?: string;
  camera?: CameraConfig;
  isPlaying?: boolean;
  onTransformChange?: (
    transform: { scale: number; x: number; y: number },
    containerRect: { width: number; height: number },
  ) => void;
}

export function InfiniteCanvas({
  children,
  contentWidth = 1920,
  contentHeight = 1080,
  className = '',
  camera,
  isPlaying = false,
  onTransformChange,
}: InfiniteCanvasProps) {
  const {
    containerRef,
    transform,
    zoomTo,
    fitToScreen,
    resetZoom100,
    flyToCamera,
    isPanning,
    isSpacePressed,
    isTransforming,
    pointerHandlers,
  } = useCanvasGesture({
    contentWidth,
    contentHeight,
    onTransformChange,
  });

  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const focusCameraVersion = useEditorStore((s) => s.focusCameraVersion);

  // 当处于播放态时，随着场景切换自动协同平滑运镜飞向当前场景摄像机
  useEffect(() => {
    if (isPlaying && camera) {
      flyToCamera(camera);
    }
  }, [isPlaying, camera?.zoom, camera?.x, camera?.y, camera?.duration, flyToCamera]);

  // 当外部双击场景或触发“镜头对齐”命令时，平滑运镜飞向当前场景摄像机
  useEffect(() => {
    if (focusCameraVersion > 0 && camera) {
      flyToCamera(camera);
    }
  }, [focusCameraVersion, camera, flyToCamera]);

  const dsl = useProjectStore((s) => s.dsl);
  const targetAspect = parseAspectRatio(dsl.meta?.viewport?.aspectRatio);

  // 视口边缘吸附雷达几何运算：检测取景框是否脱离当前屏幕视口窗口
  const radarInfo = React.useMemo(() => {
    if (!camera || isPlaying || containerSize.width <= 0 || containerSize.height <= 0) {
      return null;
    }

    const rect = cameraToFrustumRect(camera, contentWidth, contentHeight, targetAspect);
    const sLeft = transform.x + rect.x * transform.scale;
    const sTop = transform.y + rect.y * transform.scale;
    const sWidth = rect.width * transform.scale;
    const sHeight = rect.height * transform.scale;
    const sRight = sLeft + sWidth;
    const sBottom = sTop + sHeight;

    // 视口相交区域检测
    const visibleLeft = Math.max(0, sLeft);
    const visibleTop = Math.max(0, sTop);
    const visibleRight = Math.min(containerSize.width, sRight);
    const visibleBottom = Math.min(containerSize.height, sBottom);

    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // 取景框绝大部分脱离视口 (可见尺寸 < 30px) 时唤起雷达导引胶囊
    const isOffScreen = visibleWidth < 30 || visibleHeight < 30;
    if (!isOffScreen) return null;

    // 取景框屏幕中心点
    const frustumCenterX = sLeft + sWidth / 2;
    const frustumCenterY = sTop + sHeight / 2;

    // 视口容器中心点
    const vpCenterX = containerSize.width / 2;
    const vpCenterY = containerSize.height / 2;

    const dx = frustumCenterX - vpCenterX;
    const dy = frustumCenterY - vpCenterY;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // 沿视线射线求交视口边缘安全矩形
    const marginX = 110;
    const marginY = 36;
    const halfW = Math.max(20, vpCenterX - marginX);
    const halfH = Math.max(20, vpCenterY - marginY);

    const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : 10000;
    const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : 10000;
    const rayScale = Math.min(scaleX, scaleY);

    const radarX = Math.max(
      marginX,
      Math.min(containerSize.width - marginX, vpCenterX + dx * rayScale),
    );
    const radarY = Math.max(
      marginY,
      Math.min(containerSize.height - marginY, vpCenterY + dy * rayScale),
    );

    return {
      x: radarX,
      y: radarY,
      angleDeg,
      zoom: camera.zoom,
    };
  }, [camera, isPlaying, containerSize, contentWidth, contentHeight, transform, targetAspect]);

  return (
    <CanvasContext.Provider
      value={{
        ...transform,
        containerWidth: containerSize.width,
        containerHeight: containerSize.height,
      }}
    >
      <div
        ref={containerRef}
        data-testid="infinite-canvas-container"
        className={`relative w-full h-full overflow-hidden select-none bg-canvas touch-none ${
          isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } ${className}`}
        {...pointerHandlers}
      >
        {/* 1. 科技点阵背景网格 (Grid Matrix) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: `${((transform.x % 24) + 24) % 24}px ${((transform.y % 24) + 24) % 24}px`,
          }}
        />

        {/* 2. 核心 GPU 几何变换视口层 (Transform Content Layer - 亚像素高精浮点变换，杜绝整数化量化阶跃抖动) */}
        <div
          data-testid="canvas-content-layer"
          className="absolute origin-top-left ring-1 ring-border/40"
          style={{
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
            transform: `translate3d(${transform.x.toFixed(2)}px, ${transform.y.toFixed(2)}px, 0) scale(${transform.scale})`,
            transition: isPlaying
              ? `transform ${camera?.duration !== undefined ? camera.duration : 1.2}s cubic-bezier(0.4, 0.0, 0.2, 1.0)`
              : 'none',
            willChange: isTransforming ? 'transform' : 'auto',
            contain: isTransforming ? 'layout style' : 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            imageRendering: 'auto',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {children}
        </div>

        {/* 2.1 屏幕坐标系绝对画布外轮廓 (Screen-Space Canvas Border - 恒定 1px 屏幕绝对像素，彻底杜绝缩放闪烁) */}
        <div
          className="absolute pointer-events-none border border-border/60 shadow-lg z-10"
          style={{
            left: `${transform.x}px`,
            top: `${transform.y}px`,
            width: `${contentWidth * transform.scale}px`,
            height: `${contentHeight * transform.scale}px`,
          }}
        />

        {/* 2.2 屏幕坐标系绝对激光十字准星 (Screen-Space Laser Crosshair - 恒定 1px 细线与防缩放物理尺寸坐标徽章) */}
        <LaserCrosshairOverlay
          transform={transform}
          contentWidth={contentWidth}
          contentHeight={contentHeight}
        />

        {/* 3. 左下角抓手模式提示指示器 */}
        {isSpacePressed && (
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-panel/90 border border-primary/40 px-3 py-1.5 rounded-lg text-xs text-primary shadow-xl pointer-events-none animate-in fade-in duration-100">
            <Hand className="w-3.5 h-3.5" />
            <span>抓手平移模式 (拖拽移动画布)</span>
          </div>
        )}

        {/* 4. 视口边缘吸附导引雷达 (Off-screen Frustum Radar Indicator - 镜头移出视口时提供方位吸附与点击一键回正) */}
        {radarInfo && (
          <button
            type="button"
            data-testid="frustum-radar-pill"
            onClick={() => camera && flyToCamera(camera)}
            style={{
              left: `${radarInfo.x}px`,
              top: `${radarInfo.y}px`,
            }}
            className="absolute z-20 flex items-center gap-2 -translate-x-1/2 -translate-y-1/2 bg-cyan-950/95 border border-cyan-500/70 text-cyan-300 text-xs font-mono rounded-full px-3.5 py-1.5 shadow-2xl hover:bg-cyan-900 hover:border-cyan-400 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="点击导航至摄像机镜头视锥"
          >
            <Compass
              className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-transform duration-300"
              style={{ transform: `rotate(${radarInfo.angleDeg + 45}deg)` }}
            />
            <span className="whitespace-nowrap font-medium">
              镜头视锥 ({radarInfo.zoom.toFixed(1)}x) · 点击导向
            </span>
          </button>
        )}

        {/* 5. 独立可拖拽移动的快捷缩放与视口控制浮动胶囊 */}
        <ZoomControls
          scale={transform.scale}
          onZoomTo={zoomTo}
          onFitToScreen={fitToScreen}
          onResetZoom100={resetZoom100}
        />
      </div>
    </CanvasContext.Provider>
  );
}
