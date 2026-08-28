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

    this.boxPicker = new BoxPicker(this);
    this.edgeSnapper = new EdgeSnapper(this);
    this.cameraCapturer = new CameraCapturer(this);

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
          <span style="font-size:10px; color:#94a3b8;">ESC 退出</span>
        </div>
        <div class="ff-hud-coords">坐标: <span id="_ff_hud_coords">X: 0, Y: 0</span></div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.4;">
          • 鼠标拖拽：自由拉框<br/>
          • Alt + 单击：智能吸附卡片
        </div>
        <div class="ff-hud-actions">
          <button class="ff-hud-btn" id="_ff_btn_copy_box">📋 复制选框 JSON</button>
          <button class="ff-hud-btn" id="_ff_btn_copy_cam">📷 捕获镜头</button>
        </div>
      </div>

      <div class="ff-toast" id="_ff_toast"></div>
    `;

    this.player.stageEl.appendChild(this.overlayEl);

    this.coordsDisplayEl = this.overlayEl.querySelector('#_ff_hud_coords');
    this.crossXEl = this.overlayEl.querySelector('#_ff_cross_x');
    this.crossYEl = this.overlayEl.querySelector('#_ff_cross_y');
    this.toastEl = this.overlayEl.querySelector('#_ff_toast');

    // Event listeners
    this.overlayEl.querySelector('#_ff_btn_copy_box').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyLastBoxJSON();
    });

    this.overlayEl.querySelector('#_ff_btn_copy_cam').addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyCameraJSON();
    });
  }

  activate() {
    this.isActive = true;
    this.overlayEl.style.display = 'block';
    this.overlayEl.classList.add('active');

    this.boxPicker.attach(this.overlayEl);
    this.edgeSnapper.attach(this.overlayEl);
    this.showToast('🎯 开发者标定模式已激活 (Ctrl+Shift+D 切换)');
  }

  deactivate() {
    this.isActive = false;
    this.overlayEl.style.display = 'none';
    this.overlayEl.classList.remove('active');

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

  updateCoordsDisplay(x, y) {
    if (this.coordsDisplayEl) {
      this.coordsDisplayEl.textContent = `X: ${x}, Y: ${y}`;
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
