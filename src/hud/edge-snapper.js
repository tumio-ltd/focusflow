/**
 * FocusFlow Edge Snapper (Mode 2)
 * Advanced Multi-Ray Voting & Text Tunneling Algorithm
 * Samples raw image pixels via an offscreen canvas and auto-snaps to card boundaries on Option/Alt+Click
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

    const coords = this.hud.boxPicker.screenToCanvas(e.clientX, e.clientY);
    const box = this.snap(coords.x, coords.y);

    if (box) {
      this.hud.boxPicker.createTempRect(box.x, box.y);
      this.hud.boxPicker.tempRectEl.setAttribute('width', box.width);
      this.hud.boxPicker.tempRectEl.setAttribute('height', box.height);

      this.hud.setLastBox(box);
      this.hud.showToast(`🎯 智能吸附成功: [${box.x}, ${box.y}, ${box.width}×${box.height}]`);
    } else {
      this.hud.showToast('⚠️ 未能吸附有效边界，可尝试点击卡片其他空白位置或使用拉框');
    }
  }

  /**
   * Multi-Ray Voting & Text Tunneling Algorithm
   * Casts a dense array of parallel rays in each direction to pierce through internal text/icons
   * and accurately lock onto the card's outer bounding box.
   */
  snap(clickX, clickY, options = {}) {
    if (!this.imgData) {
      this.prepareCanvas();
      if (!this.imgData) return null;
    }

    const w = this.player.viewportWidth;
    const h = this.player.viewportHeight;
    const data = this.imgData;

    // Helper: sample RGB & Luminance
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

    // Color distance function (Euclidean RGB + Luminance bias)
    const colorDist = (p1, p2) => {
      const dr = p1.r - p2.r;
      const dg = p1.g - p2.g;
      const db = p1.b - p2.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    // 1. Initial Baseline Sampling: Sample local neighborhood to avoid clicking directly on text stroke
    let baseColor = getPixel(clickX, clickY);
    // If user clicked directly on bright text (lum > 140 on dark theme), search nearby for darker card background
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

    const threshold = options.threshold || 32; // Color delta threshold
    const maxTextTunnelWidth = 28; // Max font stroke / icon bridge to tunnel through (in pixels)

    /**
     * Casts a single ray with Text Tunneling
     * @param {number} startX 
     * @param {number} startY 
     * @param {number} dx (-1, 1, 0)
     * @param {number} dy (0, 0, -1, 1)
     * @param {number} maxDist 
     */
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
          // Inside card background
          if (inObstacle) {
            // Successfully tunneled through text/icon!
            inObstacle = false;
          }
          lastConsistentCoord = { x: curX, y: curY };
        } else {
          // Color difference exceeds threshold
          if (!inObstacle) {
            inObstacle = true;
            obstacleStartDist = dist;
          } else {
            // Check if obstacle is too wide to be internal text (e.g. reached outer background or adjacent card)
            if (dist - obstacleStartDist > maxTextTunnelWidth) {
              // Persistent color change! Outer boundary found.
              return dx !== 0 ? lastConsistentCoord.x : lastConsistentCoord.y;
            }
          }
        }
      }

      return dx !== 0 ? lastConsistentCoord.x : lastConsistentCoord.y;
    };

    // 2. Multi-Ray Array Generation
    // Cast 9 parallel rays for each direction with offsets: -48, -36, -24, -12, 0, 12, 24, 36, 48
    const rayOffsets = [-48, -36, -24, -12, 0, 12, 24, 36, 48];
    const maxSearchSpan = 2200; // max search radius

    // Left Rays
    const leftHits = rayOffsets
      .map(offset => castRay(clickX, clickY + offset, -1, 0, maxSearchSpan))
      .filter(x => x < clickX - 10);

    // Right Rays
    const rightHits = rayOffsets
      .map(offset => castRay(clickX, clickY + offset, 1, 0, maxSearchSpan))
      .filter(x => x > clickX + 10);

    // Top Rays
    const topHits = rayOffsets
      .map(offset => castRay(clickX + offset, clickY, 0, -1, maxSearchSpan))
      .filter(y => y < clickY - 10);

    // Bottom Rays
    const bottomHits = rayOffsets
      .map(offset => castRay(clickX + offset, clickY, 0, 1, maxSearchSpan))
      .filter(y => y > clickY + 10);

    if (leftHits.length === 0 || rightHits.length === 0 || topHits.length === 0 || bottomHits.length === 0) {
      return null;
    }

    /**
     * Robust Consensus Voting (Cluster & Median)
     * Finds the boundary coordinate with highest agreement among rays
     */
    const getConsensusCoord = (hits, isMin) => {
      hits.sort((a, b) => a - b);
      
      // Cluster hits within a 16px tolerance window
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

      // Prefer the largest cluster; if tie, prefer the outer boundary
      clusters.sort((c1, c2) => {
        if (c2.length !== c1.length) {
          return c2.length - c1.length; // More consensus votes
        }
        // Outer boundary preference: smaller for min, larger for max
        const m1 = c1[Math.floor(c1.length / 2)];
        const m2 = c2[Math.floor(c2.length / 2)];
        return isMin ? m1 - m2 : m2 - m1;
      });

      const bestCluster = clusters[0];
      // Return median of best cluster
      return Math.round(bestCluster[Math.floor(bestCluster.length / 2)]);
    };

    const minX = getConsensusCoord(leftHits, true);
    const maxX = getConsensusCoord(rightHits, false);
    const minY = getConsensusCoord(topHits, true);
    const maxY = getConsensusCoord(bottomHits, false);

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    // Minimum size constraint for valid card
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
