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

  // camera.x > 0 表示镜头聚焦在底图中心右侧，camera.y > 0 表示镜头聚焦在底图中心下方
  const centerX = (naturalWidth / 2) + ((camera.x || 0) / 100) * naturalWidth;
  const centerY = (naturalHeight / 2) + ((camera.y || 0) / 100) * naturalHeight;

  return {
    x: Math.round(centerX - frameWidth / 2),
    y: Math.round(centerY - frameHeight / 2),
    width: Math.round(frameWidth),
    height: Math.round(frameHeight),
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

  const x = Math.round(((centerX - naturalWidth / 2) / naturalWidth * 100) * 10) / 10;
  const y = Math.round(((centerY - naturalHeight / 2) / naturalHeight * 100) * 10) / 10;

  return {
    zoom: Math.round(zoom * 10) / 10,
    x,
    y,
    duration,
  };
}

/**
 * 依据安全视口约束 |Tx|, |Ty| <= ((Z - 1) / (2 * Z)) * 100% 校验与钳位镜头偏移
 */
export function clampCameraBounds(zoom: number, x: number, y: number): { x: number; y: number } {
  if (zoom <= 1.0) {
    return { x: 0, y: 0 };
  }
  const maxOffset = ((zoom - 1.0) / (2.0 * zoom)) * 100;
  // 留出 15% 视觉缓冲余量提升创作者取景自由度
  const safeLimit = maxOffset * 1.15;
  const clampedX = Math.max(-safeLimit, Math.min(safeLimit, x));
  const clampedY = Math.max(-safeLimit, Math.min(safeLimit, y));
  return {
    x: Math.round(clampedX * 10) / 10,
    y: Math.round(clampedY * 10) / 10,
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
  // 当前工作台容器中心点在底图物理坐标系中的绝对坐标
  const viewportCenterX = (containerRect.width / 2 - transform.x) / transform.scale;
  const viewportCenterY = (containerRect.height / 2 - transform.y) / transform.scale;

  // 计算基准自适应铺满缩放倍率 (Fit-to-Screen)
  const baseScale = Math.min(
    containerRect.width / naturalWidth,
    containerRect.height / naturalHeight
  );

  const zoom = Math.max(transform.scale / (baseScale || 1), 1.0);

  // 计算镜头相对于底图中心点的偏移百分比 (x > 0 偏右, y > 0 偏下)
  const x = Math.round(((viewportCenterX - naturalWidth / 2) / naturalWidth * 100) * 10) / 10;
  const y = Math.round(((viewportCenterY - naturalHeight / 2) / naturalHeight * 100) * 10) / 10;
  const clamped = clampCameraBounds(zoom, x, y);

  return {
    zoom: Math.round(zoom * 10) / 10,
    x: clamped.x,
    y: clamped.y,
    duration,
  };
}
