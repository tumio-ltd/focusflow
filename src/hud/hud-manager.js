/**
 * FocusFlow HUD Manager
 * Coordinates crosshair lines, debug panels, toast alerts, and calibration tools
 */

import { BoxPicker } from './box-picker.js';
import { EdgeSnapper } from './edge-snapper.js';
import { CameraCapturer } from './camera-capturer.js';

export class HUDManager {
  constructor(player) {
    this.player = player;
    this.isActive = false;
    this.lastBox = null;

    // Detect OS platform
    this.isMac = typeof navigator !== 'undefined' && (/Mac|iPod|iPhone|iPad/.test(navigator.platform || '') || /Macintosh|Mac OS X/.test(navigator.userAgent || ''));
    this.altKeyLabel = this.isMac ? 'Option' : 'Alt';
    this.shortcutKeyLabel = this.isMac ? '⌘+Shift+D' : 'Ctrl+Shift+D';

    this.boxPicker = new BoxPicker(this);
    this.edgeSnapper = new EdgeSnapper(this);
    this.cameraCapturer = new CameraCapturer(this);

    this.onWheel = this.onWheel.bind(this);
    this.onPanStart = this.onPanStart.bind(this);
    this.onPanMove = this.onPanMove.bind(this);
    this.onPanEnd = this.onPanEnd.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.isPanning = false;

    this.createHUDDOM();
  }

  createHUDDOM() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'ff-hud-overlay';
    this.overlayEl.style.display = 'none';

    this.overlayEl.innerHTML = `
      <div class="ff-crosshair-line-x" id="_ff_cross_x"></div>
      <div class="ff-crosshair-line-y" id="_ff_cross_y"></div>

      <div class="ff-hud-panel">
        <div class="ff-hud-header">
          <span>🎯 FocusFlow 标定助手</span>
          <span style="font-size:10px; color:#94a3b8;">ESC 退出 (${this.shortcutKeyLabel})</span>
        </div>
        <div class="ff-hud-coords" style="display:flex; flex-direction:column; gap:2px;">
          <div>📐 像素: <span id="_ff_hud_pixel_val" style="color:#38bdf8;">X: 0, Y: 0</span></div>
          <div>📍 百分比: <span id="_ff_hud_percent_val" style="color:#34d399;">L: 0.0%, T: 0.0%</span></div>
        </div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.4;">
          • 滚轮：微调缩放 / Shift+拖拽：平移<br/>
          • 鼠标拖拽：拉框 / ${this.altKeyLabel}+单击：吸附
        </div>
        <div class="ff-hud-actions" style="display:flex; flex-wrap:wrap; gap:6px;">
          <button class="ff-hud-btn" id="_ff_btn_copy_box" title="复制矩形选框 JSON">🔲 复制选框</button>
          <button class="ff-hud-btn" id="_ff_btn_copy_callout" title="复制当前光标位置气泡 JSON">💬 复制气泡</button>
          <button class="ff-hud-btn" id="_ff_btn_copy_cam" title="捕获当前镜头矩阵">📷 捕获镜头</button>
        </div>
      </div>

      <div class="ff-toast" id="_ff_toast"></div>
    `;

    this.player.stageEl.appendChild(this.overlayEl);

    this.pixelDisplayEl = this.overlayEl.querySelector('#_ff_hud_pixel_val');
    this.percentDisplayEl = this.overlayEl.querySelector('#_ff_hud_percent_val');
    this.crossXEl = this.overlayEl.querySelector('#_ff_cross_x');
    this.crossYEl = this.overlayEl.querySelector('#_ff_cross_y');
    this.toastEl = this.overlayEl.querySelector('#_ff_toast');

    // Event listeners
    this.overlayEl.querySelector('#_ff_btn_copy_box').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyLastBoxJSON();
    });

    this.overlayEl.querySelector('#_ff_btn_copy_callout').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyCalloutJSON();
    });

    this.overlayEl.querySelector('#_ff_btn_copy_cam').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyCameraJSON();
    });
  }

  onWheel(e) {
    e.preventDefault();
    const current = this.player.camera.getCurrentCamera();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const nextZoom = Math.max(1.0, Math.min(3.0, current.zoom + delta));
    this.player.camera.apply({ zoom: nextZoom, x: current.x, y: current.y, duration: 0.1 }, true);
    this.showToast(`🔍 缩放: ${nextZoom.toFixed(2)}x [X: ${current.x}%, Y: ${current.y}%]`);
  }

  onKeyDown(e) {
    if (e.key === 'Shift') {
      if (!this.boxPicker.isDrawing) {
        this.overlayEl.classList.add('is-panning-ready');
      }
    }
  }

  onKeyUp(e) {
    if (e.key === 'Shift') {
      this.overlayEl.classList.remove('is-panning-ready');
      if (!this.isPanning) {
        this.overlayEl.classList.remove('is-panning');
      }
    }
  }

  onPanStart(e) {
    if (!e.shiftKey && e.button !== 1 && e.button !== 2) return;
    this.isPanning = true;
    this.overlayEl.classList.add('is-panning');
    this.overlayEl.classList.remove('is-panning-ready');
    this.panStartX = e.clientX;
    this.panStartY = e.clientY;
    this.cameraStart = this.player.camera.getCurrentCamera();
  }

  onPanMove(e) {
    if (!this.isPanning) return;
    const dx = e.clientX - this.panStartX;
    const dy = e.clientY - this.panStartY;

    const wrapRect = this.player.wrapEl.getBoundingClientRect();
    const shiftPercentX = (dx / wrapRect.width) * 100;
    const shiftPercentY = (dy / wrapRect.height) * 100;

    const nextX = Number((this.cameraStart.x + shiftPercentX).toFixed(1));
    const nextY = Number((this.cameraStart.y + shiftPercentY).toFixed(1));

    this.player.camera.apply({ zoom: this.cameraStart.zoom, x: nextX, y: nextY, duration: 0 }, false);
  }

  onPanEnd(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.overlayEl.classList.remove('is-panning');
      if (e && e.shiftKey) {
        this.overlayEl.classList.add('is-panning-ready');
      }
      const current = this.player.camera.getCurrentCamera();
      this.showToast(`📷 视口平移: [X: ${current.x}%, Y: ${current.y}%]`);
    }
  }

  activate() {
    this.isActive = true;
    this.overlayEl.style.display = 'block';
    this.overlayEl.classList.add('active');

    if (this.player.hudToggleBtnEl) {
      this.player.hudToggleBtnEl.classList.add('active');
      const textEl = this.player.hudToggleBtnEl.querySelector('.ff-btn-text');
      if (textEl) textEl.textContent = '退出标定';
    }

    this.overlayEl.addEventListener('wheel', this.onWheel, { passive: false });
    this.overlayEl.addEventListener('mousedown', this.onPanStart);
    window.addEventListener('mousemove', this.onPanMove);
    window.addEventListener('mouseup', this.onPanEnd);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.boxPicker.attach(this.overlayEl);
    this.edgeSnapper.attach(this.overlayEl);
    this.showToast(`🎯 开发者标定模式已激活 (${this.shortcutKeyLabel} 切换)`);
  }

  deactivate() {
    this.isActive = false;
    this.overlayEl.style.display = 'none';
    this.overlayEl.classList.remove('active');
    this.overlayEl.classList.remove('is-panning-ready');
    this.overlayEl.classList.remove('is-panning');

    if (this.player.hudToggleBtnEl) {
      this.player.hudToggleBtnEl.classList.remove('active');
      const textEl = this.player.hudToggleBtnEl.querySelector('.ff-btn-text');
      if (textEl) textEl.textContent = '标定助手';
    }

    this.overlayEl.removeEventListener('wheel', this.onWheel);
    this.overlayEl.removeEventListener('mousedown', this.onPanStart);
    window.removeEventListener('mousemove', this.onPanMove);
    window.removeEventListener('mouseup', this.onPanEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mouseup', this.onPanEnd);

    this.boxPicker.detach();
    this.edgeSnapper.detach();
  }

  toggle(forceState) {
    const nextState = forceState !== undefined ? forceState : !this.isActive;
    if (nextState) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  updateCoordsDisplay(x, y, percentX, percentY) {
    this.lastCoords = { x, y, percentX, percentY };
    if (this.pixelDisplayEl) {
      this.pixelDisplayEl.textContent = `X: ${x}px, Y: ${y}px`;
    }
    if (this.percentDisplayEl) {
      this.percentDisplayEl.textContent = `L: ${percentX}, T: ${percentY}`;
    }
  }

  updateBounds() {
    if (this.edgeSnapper) {
      this.edgeSnapper.prepareCanvas();
    }
  }

  setLastBox(box) {
    this.lastBox = box;
  }

  copyLastBoxJSON() {
    if (!this.lastBox) {
      this.showToast('⚠️ 请先拉框或 Alt+点击 选中一个区域');
      return;
    }

    const jsonStr = JSON.stringify(this.lastBox, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast('📋 选框 JSON 已复制到剪贴板！');
      console.log('[FocusFlow] Extracted Box DSL:\n', jsonStr);
    }).catch(() => {
      console.log('[FocusFlow] Box DSL:', jsonStr);
      this.showToast('📋 JSON 已输出到控制台 Console');
    });
  }

  copyCalloutJSON() {
    const coords = this.lastCoords || { percentX: '33.0%', percentY: '33.0%' };
    const calloutObj = {
      id: `co-${Date.now().toString().slice(-4)}`,
      position: {
        left: coords.percentX,
        top: coords.percentY
      },
      theme: "blue",
      title: "模块标题 (Title)",
      desc: "在此输入解说文本或功能特性..."
    };

    const jsonStr = JSON.stringify(calloutObj, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast(`💬 气泡 JSON 已复制: [${coords.percentX}, ${coords.percentY}]`);
      console.log('[FocusFlow] Callout DSL:\n', jsonStr);
    }).catch(() => {
      console.log('[FocusFlow] Callout DSL:', jsonStr);
      this.showToast('💬 气泡 JSON 已输出到控制台 Console');
    });
  }

  copyCameraJSON() {
    const cam = this.cameraCapturer.capture();
    const jsonStr = JSON.stringify({ camera: cam }, null, 2);

    navigator.clipboard.writeText(jsonStr).then(() => {
      this.showToast(`📷 镜头配置已复制: zoom ${cam.zoom}x [${cam.x}%, ${cam.y}%]`);
      console.log('[FocusFlow] Captured Camera DSL:\n', jsonStr);
    }).catch(() => {
      console.log('[FocusFlow] Camera DSL:', jsonStr);
      this.showToast('📷 镜头配置已输出到 Console');
    });
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2400);
  }

  destroy() {
    this.deactivate();
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
    }
  }
}
