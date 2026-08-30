/**
 * FocusFlow Edge Snapper (Mode 2)
 * Advanced Sobel Gradient Spatial Integration & 1D Energy Projection Algorithm
 * (with Multi-Ray Voting Fallback)
 *
 * Samples raw image pixels via an offscreen canvas, applies a 3x3 Sobel spatial derivative convolution,
 * projects 1D edge energy along axes, and locks onto the card's continuous physical bounding box.
 */

export class EdgeSnapper {
  constructor(hud) {
    this.hud = hud;
    this.player = hud.player;
    this.offscreenCanvas = null;
    this.ctx = null;
    this.imgData = null;
    this.isReady = false;

    this.onClick = this.onClick.bind(this);
  }

  attach(overlayEl) {
    this.overlay = overlayEl;
    this.prepareCanvas();
    this.overlay.addEventListener('click', this.onClick);
  }

  detach() {
    if (this.overlay) {
      this.overlay.removeEventListener('click', this.onClick);
    }
  }

  prepareCanvas() {
    if (this.isReady) return;

    const img = this.player.imgEl;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = this.player.viewportWidth;
    canvas.height = this.player.viewportHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const drawAndCache = () => {
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        this.offscreenCanvas = canvas;
        this.ctx = ctx;
        this.isReady = true;
      } catch (err) {
        console.warn('[FocusFlow] EdgeSnapper: Unable to read image pixel data (possibly cross-origin).', err);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      drawAndCache();
    } else {
      img.addEventListener('load', drawAndCache, { once: true });
    }
  }

  onClick(e) {
    if (!e.altKey) return; // Option / Alt+Click triggers smart snap

    // If user dragged with Option/Alt key to create a manual box, do not trigger single click snap
    if (this.hud.boxPicker && this.hud.boxPicker.hasMovedSignificantly) {
      return;
    }

    const coords = this.hud.boxPicker.screenToCanvas(e.clientX, e.clientY);
    const box = this.snap(coords.x, coords.y);

    if (box) {
      this.hud.boxPicker.createTempRect(box.x, box.y);
      this.hud.boxPicker.tempRectEl.setAttribute('width', box.width);
      this.hud.boxPicker.tempRectEl.setAttribute('height', box.height);

      this.hud.setLastBox(box);
      this.hud.showToast(`🎯 Sobel 智能吸附成功: [${box.x}, ${box.y}, ${box.width}×${box.height}]`);
    } else {
      this.hud.showToast('⚠️ 未能吸附有效边界，可尝试点击卡片其他位置或使用拉框');
    }
  }

  /**
   * Primary Entry Point: Sobel Gradient Integration (with Multi-Ray Fallback)
   */
  snap(clickX, clickY, options = {}) {
    if (!this.imgData) {
      this.prepareCanvas();
      if (!this.imgData) return null;
    }

    // Try high-precision Sobel Gradient Integration first
    const sobelResult = this.sobelGradientSnap(clickX, clickY, options);
    if (sobelResult) {
      return sobelResult;
    }

    // Fallback to Multi-Ray Voting & Text Tunneling if Sobel ROI fails
    return this.multiRaySnap(clickX, clickY, options);
  }

  /**
   * Sobel Gradient Spatial Integration & 1D Energy Projection Algorithm
   * 1. Extracts a localized Region of Interest (ROI) around the click position.
   * 2. Computes 3x3 Sobel spatial derivatives: Gx (vertical edges) and Gy (horizontal edges).
   * 3. Projects 1D edge energy curves along X and Y axes (ProfileX and ProfileY).
   * 4. Scans outward from click center to find the first Dirac delta-like energy peak spikes.
   */
  sobelGradientSnap(clickX, clickY, options = {}) {
    const W = this.player.viewportWidth;
    const H = this.player.viewportHeight;
    const data = this.imgData;

    // 1. Define Local ROI Search Window (e.g. ±900px horizontal, ±600px vertical)
    const roiRadiusX = options.roiRadiusX || 900;
    const roiRadiusY = options.roiRadiusY || 600;

    const x1 = Math.max(1, Math.floor(clickX - roiRadiusX));
    const x2 = Math.min(W - 2, Math.ceil(clickX + roiRadiusX));
    const y1 = Math.max(1, Math.floor(clickY - roiRadiusY));
    const y2 = Math.min(H - 2, Math.ceil(clickY + roiRadiusY));

    const roiW = x2 - x1 + 1;
    const roiH = y2 - y1 + 1;

    if (roiW < 60 || roiH < 40) return null;

    const cx = Math.floor(clickX - x1); // Local click X inside ROI
    const cy = Math.floor(clickY - y1); // Local click Y inside ROI

    // 2. Grayscale conversion on ROI (Luminance: 0.299R + 0.587G + 0.114B)
    const gray = new Uint8Array(roiW * roiH);
    for (let ry = 0; ry < roiH; ry++) {
      const globalY = y1 + ry;
      const rowOffset = ry * roiW;
      for (let rx = 0; rx < roiW; rx++) {
        const globalX = x1 + rx;
        const idx = (globalY * W + globalX) * 4;
        gray[rowOffset + rx] = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
      }
    }

    // 3. Sobel Convolution & 1D Energy Projection
    // ProfileX: sums vertical edge strength |Gx| along each column rx (for detecting left/right borders)
    // ProfileY: sums horizontal edge strength |Gy| along each row ry (for detecting top/bottom borders)
    const profileX = new Float32Array(roiW);
    const profileY = new Float32Array(roiH);

    for (let ry = 1; ry < roiH - 1; ry++) {
      const r_prev = (ry - 1) * roiW;
      const r_curr = ry * roiW;
      const r_next = (ry + 1) * roiW;

      for (let rx = 1; rx < roiW - 1; rx++) {
        // Gx Kernel: [[-1, 0, +1], [-2, 0, +2], [-1, 0, +1]]
        const gx = (gray[r_prev + rx + 1] + 2 * gray[r_curr + rx + 1] + gray[r_next + rx + 1]) -
                   (gray[r_prev + rx - 1] + 2 * gray[r_curr + rx - 1] + gray[r_next + rx - 1]);

        // Gy Kernel: [[-1, -2, -1], [0, 0, 0], [+1, +2, +1]]
        const gy = (gray[r_next + rx - 1] + 2 * gray[r_next + rx] + gray[r_next + rx + 1]) -
                   (gray[r_prev + rx - 1] + 2 * gray[r_prev + rx] + gray[r_prev + rx + 1]);

        const absGx = Math.abs(gx);
        const absGy = Math.abs(gy);

        // Accumulate into 1D profiles
        profileX[rx] += absGx;
        profileY[ry] += absGy;
      }
    }

    // 4. 1D Smoothing Filter [1, 2, 1]/4 on profiles to suppress single-pixel noise
    const smoothX = new Float32Array(roiW);
    for (let i = 1; i < roiW - 1; i++) {
      smoothX[i] = (profileX[i - 1] + 2 * profileX[i] + profileX[i + 1]) * 0.25;
    }

    const smoothY = new Float32Array(roiH);
    for (let i = 1; i < roiH - 1; i++) {
      smoothY[i] = (profileY[i - 1] + 2 * profileY[i] + profileY[i + 1]) * 0.25;
    }

    // Find maximum energy values in the profiles for adaptive thresholding
    let maxEnergyX = 0;
    for (let i = 0; i < roiW; i++) {
      if (smoothX[i] > maxEnergyX) maxEnergyX = smoothX[i];
    }

    let maxEnergyY = 0;
    for (let i = 0; i < roiH; i++) {
      if (smoothY[i] > maxEnergyY) maxEnergyY = smoothY[i];
    }

    // Adaptive peak threshold (significantly higher than interior letter noise)
    const thresholdX = Math.max(800, maxEnergyX * 0.20);
    const thresholdY = Math.max(600, maxEnergyY * 0.20);

    // 5. Bilateral Outward Peak Search from click point (cx, cy)
    // Left Search (X_min)
    let bestLeftRx = -1;
    for (let rx = cx - 12; rx >= 6; rx--) {
      if (smoothX[rx] >= thresholdX && smoothX[rx] >= smoothX[rx - 1] && smoothX[rx] >= smoothX[rx + 1]) {
        bestLeftRx = rx;
        break;
      }
    }

    // Right Search (X_max)
    let bestRightRx = -1;
    for (let rx = cx + 12; rx <= roiW - 7; rx++) {
      if (smoothX[rx] >= thresholdX && smoothX[rx] >= smoothX[rx - 1] && smoothX[rx] >= smoothX[rx + 1]) {
        bestRightRx = rx;
        break;
      }
    }

    // Top Search (Y_min)
    let bestTopRy = -1;
    for (let ry = cy - 10; ry >= 6; ry--) {
      if (smoothY[ry] >= thresholdY && smoothY[ry] >= smoothY[ry - 1] && smoothY[ry] >= smoothY[ry + 1]) {
        bestTopRy = ry;
        break;
      }
    }

    // Bottom Search (Y_max)
    let bestBottomRy = -1;
    for (let ry = cy + 10; ry <= roiH - 7; ry++) {
      if (smoothY[ry] >= thresholdY && smoothY[ry] >= smoothY[ry - 1] && smoothY[ry] >= smoothY[ry + 1]) {
        bestBottomRy = ry;
        break;
      }
    }

    // If all 4 continuous borders are cleanly detected
    if (bestLeftRx !== -1 && bestRightRx !== -1 && bestTopRy !== -1 && bestBottomRy !== -1) {
      const minX = x1 + bestLeftRx;
      const maxX = x1 + bestRightRx;
      const minY = y1 + bestTopRy;
      const maxY = y1 + bestBottomRy;

      const width = maxX - minX;
      const height = maxY - minY;

      if (width >= 40 && height >= 25) {
        return {
          id: `box-${Date.now().toString().slice(-6)}`,
          type: 'rect',
          x: minX,
          y: minY,
          width: width,
          height: height,
          rx: 16
        };
      }
    }

    return null;
  }

  /**
   * Secondary Fallback: Multi-Ray Voting & Text Tunneling
   */
  multiRaySnap(clickX, clickY, options = {}) {
    const w = this.player.viewportWidth;
    const h = this.player.viewportHeight;
    const data = this.imgData;

    const getPixel = (x, y) => {
      const px = Math.max(0, Math.min(w - 1, Math.round(x)));
      const py = Math.max(0, Math.min(h - 1, Math.round(y)));
      const idx = (py * w + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return { r, g, b, lum };
    };

    const colorDist = (p1, p2) => {
      const dr = p1.r - p2.r;
      const dg = p1.g - p2.g;
      const db = p1.b - p2.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    let baseColor = getPixel(clickX, clickY);
    if (baseColor.lum > 140) {
      for (let dy = -16; dy <= 16; dy += 4) {
        for (let dx = -16; dx <= 16; dx += 4) {
          const candidate = getPixel(clickX + dx, clickY + dy);
          if (candidate.lum < baseColor.lum) {
            baseColor = candidate;
          }
        }
      }
    }

    const threshold = options.threshold || 32;
    const maxTextTunnelWidth = 28;

    const castRay = (startX, startY, dx, dy, maxDist) => {
      let curX = startX;
      let curY = startY;
      let dist = 0;
      let inObstacle = false;
      let obstacleStartDist = 0;
      let lastConsistentCoord = { x: startX, y: startY };

      while (dist < maxDist) {
        curX += dx * 2;
        curY += dy * 2;
        dist += 2;

        if (curX < 4 || curX >= w - 4 || curY < 4 || curY >= h - 4) {
          break;
        }

        const p = getPixel(curX, curY);
        const diff = colorDist(p, baseColor);

        if (diff < threshold) {
          if (inObstacle) inObstacle = false;
          lastConsistentCoord = { x: curX, y: curY };
        } else {
          if (!inObstacle) {
            inObstacle = true;
            obstacleStartDist = dist;
          } else {
            if (dist - obstacleStartDist > maxTextTunnelWidth) {
              return dx !== 0 ? lastConsistentCoord.x : lastConsistentCoord.y;
            }
          }
        }
      }

      return dx !== 0 ? lastConsistentCoord.x : lastConsistentCoord.y;
    };

    const rayOffsets = [-48, -36, -24, -12, 0, 12, 24, 36, 48];
    const maxSearchSpan = 2200;

    const leftHits = rayOffsets
      .map(offset => castRay(clickX, clickY + offset, -1, 0, maxSearchSpan))
      .filter(x => x < clickX - 10);

    const rightHits = rayOffsets
      .map(offset => castRay(clickX, clickY + offset, 1, 0, maxSearchSpan))
      .filter(x => x > clickX + 10);

    const topHits = rayOffsets
      .map(offset => castRay(clickX + offset, clickY, 0, -1, maxSearchSpan))
      .filter(y => y < clickY - 10);

    const bottomHits = rayOffsets
      .map(offset => castRay(clickX + offset, clickY, 0, 1, maxSearchSpan))
      .filter(y => y > clickY + 10);

    if (leftHits.length === 0 || rightHits.length === 0 || topHits.length === 0 || bottomHits.length === 0) {
      return null;
    }

    const getConsensusCoord = (hits, isMin) => {
      hits.sort((a, b) => a - b);
      const clusters = [];
      let curCluster = [hits[0]];

      for (let i = 1; i < hits.length; i++) {
        if (Math.abs(hits[i] - curCluster[curCluster.length - 1]) <= 16) {
          curCluster.push(hits[i]);
        } else {
          clusters.push(curCluster);
          curCluster = [hits[i]];
        }
      }
      clusters.push(curCluster);

      clusters.sort((c1, c2) => {
        if (c2.length !== c1.length) return c2.length - c1.length;
        const m1 = c1[Math.floor(c1.length / 2)];
        const m2 = c2[Math.floor(c2.length / 2)];
        return isMin ? m1 - m2 : m2 - m1;
      });

      const bestCluster = clusters[0];
      return Math.round(bestCluster[Math.floor(bestCluster.length / 2)]);
    };

    const minX = getConsensusCoord(leftHits, true);
    const maxX = getConsensusCoord(rightHits, false);
    const minY = getConsensusCoord(topHits, true);
    const maxY = getConsensusCoord(bottomHits, false);

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    if (boxW < 40 || boxH < 25) {
      return null;
    }

    return {
      id: `box-${Date.now().toString().slice(-6)}`,
      type: 'rect',
      x: minX,
      y: minY,
      width: boxW,
      height: boxH,
      rx: 16
    };
  }
}
