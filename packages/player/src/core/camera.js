/**
 * FocusFlow Camera Kinematics Engine
 * Manages GPU-accelerated 3D transforms and safe viewport bounding box calculations
 */

export class CameraKinematics {
  constructor(wrapElement, baseWidth = 5120, baseHeight = 2880) {
    this.wrap = wrapElement;
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.currentCamera = { zoom: 1.0, x: 0, y: 0, duration: 1.2 };
  }

  /**
   * Apply Camera Transformation
   * @param {Object} camera - { zoom: number, x: number, y: number, duration?: number }
   * @param {boolean} animate - Whether to apply CSS transition
   */
  apply(camera, animate = true) {
    const zoom = Math.max(1.0, Math.min(3.5, camera.zoom || 1.0));
    const duration = camera.duration !== undefined ? camera.duration : 1.2;

    // Apply safe viewport clamping
    const clamped = this.clampCamera(zoom, camera.x || 0, camera.y || 0);

    this.currentCamera = { zoom, x: clamped.x, y: clamped.y, duration };

    if (!animate) {
      this.wrap.style.transition = 'none';
    } else {
      this.wrap.style.transition = `transform ${duration}s cubic-bezier(0.4, 0.0, 0.2, 1.0)`;
    }

    this.wrap.style.transform = `scale(${zoom}) translate(${clamped.x}%, ${clamped.y}%)`;
  }

  /**
   * Safe Viewport Bounds Clamping Formula
   * |Tx|, |Ty| <= ((Z - 1) / (2 * Z)) * 100%
   */
  clampCamera(zoom, x, y) {
    if (zoom <= 1.0) {
      return { x: 0, y: 0 };
    }
    const maxOffset = ((zoom - 1.0) / (2.0 * zoom)) * 100;
    // Allow slight aesthetic margin (+15%)
    const safeLimit = maxOffset * 1.15;

    const clampedX = Math.max(-safeLimit, Math.min(safeLimit, x));
    const clampedY = Math.max(-safeLimit, Math.min(safeLimit, y));

    return { x: clampedX, y: clampedY };
  }

  getCurrentCamera() {
    return { ...this.currentCamera };
  }
}
