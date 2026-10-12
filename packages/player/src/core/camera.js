/**
 * FocusFlow Camera Kinematics Engine
 * Manages GPU-accelerated 3D transforms and safe viewport bounding box calculations
 */

export class CameraKinematics {
  constructor(wrapElement, baseWidth = 5120, baseHeight = 2880, options = {}) {
    this.wrap = wrapElement;
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.disabled = !!options?.disabled;
    this.currentCamera = { zoom: 1.0, x: 0, y: 0, duration: 1.2 };
    if (this.wrap?.style) {
      this.wrap.style.setProperty('--ff-camera-zoom', '1');
    }
  }

  /**
   * Apply Camera Transformation
   * @param {Object} camera - { zoom: number, x: number, y: number, duration?: number }
   * @param {boolean} animate - Whether to apply CSS transition
   */
  apply(camera, animate = true) {
    if (this.disabled) {
      this.wrap.style.transform = 'none';
      this.wrap.style.setProperty('--ff-camera-zoom', '1');
      return;
    }
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

    this.wrap.style.transform = `scale(${zoom}) translate(${-clamped.x}%, ${-clamped.y}%)`;
    this.wrap.style.setProperty('--ff-camera-zoom', zoom.toFixed(3));
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

    return {
      x: Math.round(clampedX * 10) / 10,
      y: Math.round(clampedY * 10) / 10,
    };
  }

  getCurrentCamera() {
    return { ...this.currentCamera };
  }

  /**
   * Build cubic-bezier evaluation solver for standard CSS easing
   */
  static createCubicBezierSolver(x1, y1, x2, y2) {
    const cx = 3.0 * x1;
    const bx = 3.0 * (x2 - x1) - cx;
    const ax = 1.0 - cx - bx;
    const cy = 3.0 * y1;
    const by = 3.0 * (y2 - y1) - cy;
    const ay = 1.0 - cy - by;

    function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }
    function sampleY(t) { return ((ay * t + by) * t + cy) * t; }
    function sampleDerivativeX(t) { return (3.0 * ax * t + 2.0 * bx) * t + cx; }

    return function solve(x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const xEst = sampleX(t) - x;
        if (Math.abs(xEst) < 1e-6) return sampleY(t);
        const dX = sampleDerivativeX(t);
        if (Math.abs(dX) < 1e-6) break;
        t -= xEst / dX;
      }
      let t0 = 0.0, t1 = 1.0;
      t = x;
      while (t0 < t1) {
        const xEst = sampleX(t);
        if (Math.abs(xEst - x) < 1e-6) return sampleY(t);
        if (x > xEst) t0 = t;
        else t1 = t;
        t = (t1 + t0) * 0.5;
      }
      return sampleY(t);
    };
  }

  /**
   * Standard FocusFlow Easing Curve: cubic-bezier(0.4, 0.0, 0.2, 1.0)
   */
  static defaultEase = CameraKinematics.createCubicBezierSolver(0.4, 0.0, 0.2, 1.0);

  /**
   * Interpolate camera transformation parameters with easing
   * @param {Object} fromCamera - Source camera state
   * @param {Object} toCamera - Target camera state
   * @param {number} progress - Normalized progression [0, 1]
   * @param {Function} [easingFn] - Easing function (defaults to cubic-bezier(0.4, 0.0, 0.2, 1.0))
   */
  static interpolate(fromCamera, toCamera, progress, easingFn = CameraKinematics.defaultEase) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const p = easingFn(clampedProgress);

    const fZoom = Math.max(1.0, Math.min(3.5, fromCamera?.zoom || 1.0));
    const tZoom = Math.max(1.0, Math.min(3.5, toCamera?.zoom || 1.0));
    const zoom = fZoom + (tZoom - fZoom) * p;

    const fX = fromCamera?.x || 0;
    const tX = toCamera?.x || 0;
    const x = fX + (tX - fX) * p;

    const fY = fromCamera?.y || 0;
    const tY = toCamera?.y || 0;
    const y = fY + (tY - fY) * p;

    return { zoom, x, y };
  }

  /**
   * Apply frame-accurate interpolated camera without CSS transition delay
   */
  applyInterpolated(fromCamera, toCamera, progress, easingFn) {
    if (this.disabled) {
      this.wrap.style.transform = 'none';
      this.wrap.style.setProperty('--ff-camera-zoom', '1');
      return;
    }
    const interpolated = CameraKinematics.interpolate(fromCamera, toCamera, progress, easingFn);
    const clamped = this.clampCamera(interpolated.zoom, interpolated.x, interpolated.y);

    this.currentCamera = {
      zoom: interpolated.zoom,
      x: clamped.x,
      y: clamped.y,
      duration: 0,
    };

    this.wrap.style.transition = 'none';
    this.wrap.style.transform = `scale(${interpolated.zoom.toFixed(4)}) translate(${-clamped.x}%, ${-clamped.y}%)`;
    this.wrap.style.setProperty('--ff-camera-zoom', interpolated.zoom.toFixed(3));
  }
}

