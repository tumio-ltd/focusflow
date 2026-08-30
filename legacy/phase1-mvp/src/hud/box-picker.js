/**
 * FocusFlow Box Picker (Mode 1 & Mode 4)
 * Handles drag-to-box on canvas and reverse-projects screen coordinates to logical canvas coordinates.
 * Features "Smart Snap on Drag" (Auto-Refine): on mouseup, automatically executes narrow-band Sobel
 * gradient refinement within ±24px to magnetically snap the bounding box onto the card's exact physical borders.
 */

export class BoxPicker {
  constructor(hud) {
    this.hud = hud;
    this.player = hud.player;
    this.isDragging = false;
    this.hasMovedSignificantly = false;
    this.isSmartSnapEnabled = true;
    this.startX = 0;
    this.startY = 0;
    this.dragStartClientX = 0;
    this.dragStartClientY = 0;
    this.bypassSnap = false;
    this.currentBox = null;
    this.tempRectEl = null;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  attach(overlayEl) {
    this.overlay = overlayEl;
    this.overlay.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  detach() {
    if (this.overlay) {
      this.overlay.removeEventListener('mousedown', this.onMouseDown);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.removeTempRect();
  }

  /**
   * Reverse-projects screen coordinates (clientX, clientY) to logical canvas coordinates
   * Accounting for the wrap element's current CSS scale() and translate() transforms
   */
  screenToCanvas(clientX, clientY) {
    const wrapRect = this.player.wrapEl.getBoundingClientRect();
    const ratioX = (clientX - wrapRect.left) / wrapRect.width;
    const ratioY = (clientY - wrapRect.top) / wrapRect.height;

    const baseW = this.player.viewportWidth;
    const baseH = this.player.viewportHeight;

    const canvasX = Math.round(ratioX * baseW);
    const canvasY = Math.round(ratioY * baseH);

    const clampedX = Math.max(0, Math.min(baseW, canvasX));
    const clampedY = Math.max(0, Math.min(baseH, canvasY));

    const percentX = `${((clampedX / baseW) * 100).toFixed(1)}%`;
    const percentY = `${((clampedY / baseH) * 100).toFixed(1)}%`;

    return {
      x: clampedX,
      y: clampedY,
      percentX,
      percentY
    };
  }

  onMouseDown(e) {
    if (e.button !== 0) return; // Left mouse button only

    this.isDragging = true;
    this.hasMovedSignificantly = false;
    this.dragStartClientX = e.clientX;
    this.dragStartClientY = e.clientY;
    this.bypassSnap = e.metaKey || e.ctrlKey || e.altKey || !this.isSmartSnapEnabled;

    const coords = this.screenToCanvas(e.clientX, e.clientY);
    this.startX = coords.x;
    this.startY = coords.y;

    this.createTempRect(this.startX, this.startY);
  }

  onMouseMove(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    this.hud.updateCoordsDisplay(coords.x, coords.y, coords.percentX, coords.percentY);

    if (!this.isDragging || !this.tempRectEl) return;

    if (Math.hypot(e.clientX - this.dragStartClientX, e.clientY - this.dragStartClientY) > 5) {
      this.hasMovedSignificantly = true;
    }

    const curX = coords.x;
    const curY = coords.y;

    const x = Math.min(this.startX, curX);
    const y = Math.min(this.startY, curY);
    const w = Math.abs(curX - this.startX);
    const h = Math.abs(curY - this.startY);

    this.tempRectEl.setAttribute('x', x);
    this.tempRectEl.setAttribute('y', y);
    this.tempRectEl.setAttribute('width', w);
    this.tempRectEl.setAttribute('height', h);

    this.currentBox = { id: `box-${Date.now().toString().slice(-6)}`, type: 'rect', x, y, width: w, height: h, rx: 16 };
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.currentBox && this.currentBox.width > 20 && this.currentBox.height > 16 && this.hasMovedSignificantly) {
      const isBypassed = this.bypassSnap || e.metaKey || e.ctrlKey || e.altKey || !this.isSmartSnapEnabled;

      let finalBox = this.currentBox;
      let isRefined = false;

      if (!isBypassed) {
        // Execute Smart Snap on Drag (Narrow-Band Sobel Auto-Refinement)
        const refinedBox = this.autoRefineBox(this.currentBox);
        isRefined = refinedBox && (refinedBox.x !== this.currentBox.x || refinedBox.y !== this.currentBox.y || refinedBox.width !== this.currentBox.width || refinedBox.height !== this.currentBox.height);
        if (refinedBox) finalBox = refinedBox;
      }

      this.currentBox = finalBox;

      // Update visually on canvas
      if (this.tempRectEl) {
        this.tempRectEl.setAttribute('x', finalBox.x);
        this.tempRectEl.setAttribute('y', finalBox.y);
        this.tempRectEl.setAttribute('width', finalBox.width);
        this.tempRectEl.setAttribute('height', finalBox.height);
      }

      this.hud.setLastBox(finalBox);

      if (isBypassed) {
        this.hud.showToast(`🎯 纯手动选框: [${finalBox.x}, ${finalBox.y}, ${finalBox.width}×${finalBox.height}] (100% 原始坐标)`);
      } else if (isRefined) {
        this.hud.showToast(`✨ 智能像素贴合: [${finalBox.x}, ${finalBox.y}, ${finalBox.width}×${finalBox.height}] (已自动咬合边缘)`);
      } else {
        this.hud.showToast(`✅ 选框已就绪: [${finalBox.x}, ${finalBox.y}, ${finalBox.width}×${finalBox.height}]`);
      }
    }
  }

  /**
   * Smart Snap on Drag: Narrow-Band Sobel Auto-Refinement Algorithm
   * Refines each of the 4 borders (Left, Right, Top, Bottom) within ±24px of the user's rough drag
   * by finding the local maximum gradient energy line.
   */
  autoRefineBox(rawBox, searchRadius = 24) {
    if (!this.hud.edgeSnapper) return null;
    this.hud.edgeSnapper.prepareCanvas();
    const data = this.hud.edgeSnapper.imgData;
    if (!data) return null;

    const W = this.player.viewportWidth;
    const H = this.player.viewportHeight;

    const rawX1 = rawBox.x;
    const rawX2 = rawBox.x + rawBox.width;
    const rawY1 = rawBox.y;
    const rawY2 = rawBox.y + rawBox.height;

    // Helper: fast grayscale calculation (0-255)
    const getLuma = (x, y) => {
      const px = Math.max(0, Math.min(W - 1, x));
      const py = Math.max(0, Math.min(H - 1, y));
      const idx = (py * W + px) * 4;
      return (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
    };

    // Helper: vertical Sobel derivative |Gx|
    const getSobelGx = (x, y) => {
      return Math.abs(
        (getLuma(x + 1, y - 1) + 2 * getLuma(x + 1, y) + getLuma(x + 1, y + 1)) -
        (getLuma(x - 1, y - 1) + 2 * getLuma(x - 1, y) + getLuma(x - 1, y + 1))
      );
    };

    // Helper: horizontal Sobel derivative |Gy|
    const getSobelGy = (x, y) => {
      return Math.abs(
        (getLuma(x - 1, y + 1) + 2 * getLuma(x, y + 1) + getLuma(x + 1, y + 1)) -
        (getLuma(x - 1, y - 1) + 2 * getLuma(x, y - 1) + getLuma(x + 1, y - 1))
      );
    };

    // Skip corner radius buffer (8px)
    const yStart = Math.min(rawY1 + 10, rawY2 - 5);
    const yEnd = Math.max(rawY1 + 5, rawY2 - 10);
    const xStart = Math.min(rawX1 + 10, rawX2 - 5);
    const xEnd = Math.max(rawX1 + 5, rawX2 - 10);

    // 1. Refine Left Border (x1)
    let bestLeftX = rawX1;
    let maxLeftEnergy = 0;
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const curX = rawX1 + dx;
      if (curX < 2 || curX >= rawX2 - 20) continue;
      let energy = 0;
      for (let y = yStart; y <= yEnd; y += 4) {
        energy += getSobelGx(curX, y);
      }
      if (energy > maxLeftEnergy) {
        maxLeftEnergy = energy;
        bestLeftX = curX;
      }
    }

    // 2. Refine Right Border (x2)
    let bestRightX = rawX2;
    let maxRightEnergy = 0;
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const curX = rawX2 + dx;
      if (curX <= bestLeftX + 20 || curX >= W - 2) continue;
      let energy = 0;
      for (let y = yStart; y <= yEnd; y += 4) {
        energy += getSobelGx(curX, y);
      }
      if (energy > maxRightEnergy) {
        maxRightEnergy = energy;
        bestRightX = curX;
      }
    }

    // 3. Refine Top Border (y1)
    let bestTopY = rawY1;
    let maxTopEnergy = 0;
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const curY = rawY1 + dy;
      if (curY < 2 || curY >= rawY2 - 15) continue;
      let energy = 0;
      for (let x = xStart; x <= xEnd; x += 4) {
        energy += getSobelGy(x, curY);
      }
      if (energy > maxTopEnergy) {
        maxTopEnergy = energy;
        bestTopY = curY;
      }
    }

    // 4. Refine Bottom Border (y2)
    let bestBottomY = rawY2;
    let maxBottomEnergy = 0;
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      const curY = rawY2 + dy;
      if (curY <= bestTopY + 15 || curY >= H - 2) continue;
      let energy = 0;
      for (let x = xStart; x <= xEnd; x += 4) {
        energy += getSobelGy(x, curY);
      }
      if (energy > maxBottomEnergy) {
        maxBottomEnergy = energy;
        bestBottomY = curY;
      }
    }

    const finalW = bestRightX - bestLeftX;
    const finalH = bestBottomY - bestTopY;

    if (finalW >= 24 && finalH >= 20) {
      return {
        id: `box-${Date.now().toString().slice(-6)}`,
        type: 'rect',
        x: bestLeftX,
        y: bestTopY,
        width: finalW,
        height: finalH,
        rx: 16
      };
    }

    return rawBox;
  }

  createTempRect(x, y) {
    this.removeTempRect();
    this.tempRectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    this.tempRectEl.setAttribute('id', '_ff_temp_rect');
    this.tempRectEl.setAttribute('x', x);
    this.tempRectEl.setAttribute('y', y);
    this.tempRectEl.setAttribute('width', 0);
    this.tempRectEl.setAttribute('height', 0);
    this.tempRectEl.setAttribute('rx', 16);
    this.tempRectEl.setAttribute('stroke', '#38bdf8');
    this.tempRectEl.setAttribute('stroke-width', '4');
    this.tempRectEl.setAttribute('stroke-dasharray', '12,8');
    this.tempRectEl.setAttribute('fill', 'rgba(56, 189, 248, 0.12)');
    this.player.svgEl.appendChild(this.tempRectEl);
  }

  removeTempRect() {
    if (this.tempRectEl && this.tempRectEl.parentNode) {
      this.tempRectEl.parentNode.removeChild(this.tempRectEl);
      this.tempRectEl = null;
    }
  }
}
