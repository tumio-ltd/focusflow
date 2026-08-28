/**
 * FocusFlow Box Picker (Mode 1)
 * Handles drag-to-box on canvas and reverse-projects screen coordinates to logical 5120x2880 canvas coordinates
 */

export class BoxPicker {
  constructor(hud) {
    this.hud = hud;
    this.player = hud.player;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
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
    // If Alt key is pressed, let EdgeSnapper handle it
    if (e.altKey) return;
    if (e.button !== 0) return; // Left mouse button only

    this.isDragging = true;
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    this.startX = coords.x;
    this.startY = coords.y;

    this.createTempRect(this.startX, this.startY);
  }

  onMouseMove(e) {
    const coords = this.screenToCanvas(e.clientX, e.clientY);
    this.hud.updateCoordsDisplay(coords.x, coords.y, coords.percentX, coords.percentY);

    if (!this.isDragging || !this.tempRectEl) return;

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

    this.currentBox = { id: `box-${Date.now()}`, type: 'rect', x, y, width: w, height: h, rx: 16 };
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.currentBox && this.currentBox.width > 20 && this.currentBox.height > 20) {
      this.hud.setLastBox(this.currentBox);
      this.hud.showToast(`✅ 选框已生成: ${this.currentBox.width}×${this.currentBox.height}`);
    }
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
