/**
 * FocusFlow Edge Snapper (Mode 2)
 * Samples raw image pixels via an offscreen canvas and auto-snaps to card boundaries on Alt+Click
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
    if (!e.altKey) return; // Alt+Click triggers smart snap

    const coords = this.hud.boxPicker.screenToCanvas(e.clientX, e.clientY);
    const box = this.snap(coords.x, coords.y);

    if (box) {
      this.hud.boxPicker.createTempRect(box.x, box.y);
      this.hud.boxPicker.tempRectEl.setAttribute('width', box.width);
      this.hud.boxPicker.tempRectEl.setAttribute('height', box.height);

      this.hud.setLastBox(box);
      this.hud.showToast(`🎯 智能吸附成功: [${box.x}, ${box.y}, ${box.width}×${box.height}]`);
    }
  }

  /**
   * 4-Way Ray Casting with Gradient Detection
   */
  snap(startX, startY, threshold = 28) {
    if (!this.imgData) {
      this.prepareCanvas();
      if (!this.imgData) return null;
    }

    const w = this.player.viewportWidth;
    const h = this.player.viewportHeight;
    const data = this.imgData;

    const getBrightness = (x, y) => {
      const idx = (y * w + x) * 4;
      return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    };

    const startB = getBrightness(startX, startY);

    // 1. Ray Cast Left
    let minX = startX;
    while (minX > 10 && Math.abs(getBrightness(minX, startY) - startB) < threshold) {
      minX -= 2;
    }

    // 2. Ray Cast Right
    let maxX = startX;
    while (maxX < w - 10 && Math.abs(getBrightness(maxX, startY) - startB) < threshold) {
      maxX += 2;
    }

    // 3. Ray Cast Top
    let minY = startY;
    while (minY > 10 && Math.abs(getBrightness(startX, minY) - startB) < threshold) {
      minY -= 2;
    }

    // 4. Ray Cast Bottom
    let maxY = startY;
    while (maxY < h - 10 && Math.abs(getBrightness(startX, maxY) - startB) < threshold) {
      maxY += 2;
    }

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    if (boxW < 30 || boxH < 20) {
      return null;
    }

    return {
      id: `box-${Date.now()}`,
      type: 'rect',
      x: minX,
      y: minY,
      width: boxW,
      height: boxH,
      rx: 16
    };
  }
}
