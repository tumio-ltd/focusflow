export interface CameraConfig {
  zoom: number;
  x: number; // 相对底图中心点的百分比偏移 (-100 ~ 100)
  y: number; // 相对底图中心点的百分比偏移 (-100 ~ 100)
  duration?: number;
}

export interface FrustumRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 将摄像机参数 (zoom, x, y) 计算转换为在底图物理坐标系中的取景框矩形 (Frustum)
 */
export function cameraToFrustumRect(
  camera: CameraConfig,
  naturalWidth: number,
  naturalHeight: number
): FrustumRect {
  const zoom = Math.max(camera.zoom, 0.1);
  const frameWidth = naturalWidth / zoom;
  const frameHeight = naturalHeight / zoom;

  // 中心点物理坐标：Xcenter = W/2 * (1 + x/100)
  const centerX = (naturalWidth / 2) * (1 + (camera.x || 0) / 100);
  const centerY = (naturalHeight / 2) * (1 + (camera.y || 0) / 100);

  return {
    x: centerX - frameWidth / 2,
    y: centerY - frameHeight / 2,
    width: frameWidth,
    height: frameHeight,
  };
}

/**
 * 将底图物理坐标系中的取景框矩形反解转换为摄像机参数 (zoom, x, y)
 */
export function frustumRectToCamera(
  rect: FrustumRect,
  naturalWidth: number,
  naturalHeight: number,
  duration = 1.2
): CameraConfig {
  const zoom = Math.max(naturalWidth / Math.max(rect.width, 10), 0.1);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  // x = ((centerX - W/2) / (W/2)) * 100
  const x = Math.round((((centerX - naturalWidth / 2) / (naturalWidth / 2)) * 100) * 10) / 10;
  const y = Math.round((((centerY - naturalHeight / 2) / (naturalHeight / 2)) * 100) * 10) / 10;

  return {
    zoom: Math.round(zoom * 10) / 10,
    x,
    y,
    duration,
  };
}

/**
 * 根据当前 InfiniteCanvas 的缩放与平移变换，一键反推捕获当前摄像机视角参数
 */
export function captureCanvasToCamera(
  transform: { scale: number; x: number; y: number },
  containerRect: { width: number; height: number },
  naturalWidth: number,
  naturalHeight: number,
  duration = 1.2
): CameraConfig {
  // 视口在画布中的中心点
  const viewportCenterX = (containerRect.width / 2 - transform.x) / transform.scale;
  const viewportCenterY = (containerRect.height / 2 - transform.y) / transform.scale;

  // 基础缩放倍率 (Fit-to-Screen)
  const baseScale = Math.min(
    containerRect.width / naturalWidth,
    containerRect.height / naturalHeight
  );

  const zoom = Math.max(transform.scale / (baseScale || 1), 1.0);

  const x = Math.round((((viewportCenterX - naturalWidth / 2) / (naturalWidth / 2)) * 100) * 10) / 10;
  const y = Math.round((((viewportCenterY - naturalHeight / 2) / (naturalHeight / 2)) * 100) * 10) / 10;

  return {
    zoom: Math.round(zoom * 10) / 10,
    x: Math.max(Math.min(x, 100), -100),
    y: Math.max(Math.min(y, 100), -100),
    duration,
  };
}
