/**
 * FocusFlow Universal Player Engine (Core Orchestrator)
 * Pure JavaScript, 0-dependency runtime driven by standard JSON DSL
 */

import { CameraKinematics } from './camera.js';
import { StateMachine } from './state-machine.js';
import { EventManager } from './events.js';
import { GeometryCalculator } from '../motion/geometry.js';
import { BezierRouter } from '../motion/bezier-router.js';
import { MotionAnimator } from '../motion/animator.js';
import { HUDManager } from '../hud/hud-manager.js';

export class FocusFlowPlayer {
  constructor(options) {
    if (!options || !options.dsl) {
      throw new Error('[FocusFlow] Player requires a valid options object with a `dsl` configuration.');
    }

    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      throw new Error(`[FocusFlow] Container "${options.container}" not found in DOM.`);
    }

    this.dsl = options.dsl;
    this.options = options;
    this.basePath = options.basePath || '';
    this.debug = !!options.debug || window.location.search.includes('debug=1');

    // Controls configurations (Options override meta.controls)
    const metaControls = this.dsl.meta?.controls || {};
    this.autoplay = options.autoplay !== undefined ? !!options.autoplay : (metaControls.autoplay ?? false);
    this.autoplayInterval = options.autoPlayInterval || options.interval || metaControls.interval || 3800;
    this.showPlayBtn = options.showPlayBtn !== undefined ? !!options.showPlayBtn : (metaControls.showPlayBtn ?? true);
    this.showProgress = options.showProgress !== undefined ? !!options.showProgress : (metaControls.showProgress ?? true);
    this.showHUDButton = options.showHUDButton !== undefined ? !!options.showHUDButton : (metaControls.showHUDButton ?? true);

    this.viewportWidth = this.dsl.meta?.viewport?.width || 5120;
    this.viewportHeight = this.dsl.meta?.viewport?.height || 2880;

    this.elementsMap = new Map(); // id -> Element metadata & DOM reference
    this.calloutsMap = new Map(); // id -> DOM Element

    this.init();
  }

  getAssetUrl(customUrl) {
    const rawUrl = customUrl || this.dsl.asset?.url || '';
    if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('/')) {
      return rawUrl;
    }
    if (this.basePath) {
      const cleanBase = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
      const cleanRelative = rawUrl.startsWith('./') ? rawUrl.slice(2) : rawUrl;
      return cleanBase + cleanRelative;
    }
    return rawUrl;
  }

  init() {
    this.buildDOM();
    
    // Initialize sub-engines
    this.camera = new CameraKinematics(this.wrapEl, this.viewportWidth, this.viewportHeight);
    this.geometry = new GeometryCalculator(this.svgEl, this.viewportWidth, this.viewportHeight);
    this.router = new BezierRouter(this.elementsMap);
    this.animator = new MotionAnimator(this.elementsMap, this.calloutsMap);
    this.events = new EventManager(this);

    // Render elements into SVG & Callout container
    this.renderElements();

    // State machine initialization
    this.stateMachine = new StateMachine(this.dsl.scenes, {
      autoPlayInterval: this.autoplayInterval,
      onStepChange: (index, scene, animate) => this.applyScene(index, scene, animate),
      onPlayStateChange: (isPlaying) => this.updatePlayButton(isPlaying)
    });

    this.events.bind();

    // HUD Calibration tool
    this.hud = new HUDManager(this);
    if (this.debug) {
      this.hud.activate();
    }

    // Go to step 0 immediately
    this.goToStep(0, false);

    // Trigger autoplay if enabled
    if (this.autoplay) {
      this.stateMachine.togglePlay();
    }
  }

  get isDebugActive() {
    return this.hud ? this.hud.isActive : false;
  }

  buildDOM() {
    const assetUrl = this.getAssetUrl();
    this.container.classList.add('focusflow-container');
    this.container.innerHTML = `
      <div class="focusflow-stage">
        <!-- Top Progress Track -->
        <div class="focusflow-progress-track">
          <div class="focusflow-progress-fill" id="_ff_progress"></div>
        </div>

        <!-- 3-Layer Visual Stack -->
        <div class="focusflow-wrap" id="_ff_wrap">
          <!-- Layer 0: Base Image -->
          <img class="focusflow-img" id="_ff_img" src="${assetUrl}" alt="${this.dsl.meta?.title || 'Architecture'}" />

          <!-- Layer 0.5: Dynamic Image Overlays -->
          <div class="focusflow-overlay-images" id="_ff_overlay_images"></div>

          <!-- Layer 1: SVG Vector Motion Overlay -->
          <svg class="focusflow-svg" id="_ff_svg" viewBox="0 0 ${this.viewportWidth} ${this.viewportHeight}" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="ff-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <!-- Layer 2: Callout Text Layer -->
          <div class="focusflow-callout-layer" id="_ff_callouts"></div>
        </div>

        <!-- Floating Bottom Controls -->
        <div class="focusflow-controls">
          <button class="ff-play-btn" id="_ff_play_btn" title="播放 / 暂停 (快捷键: P)">▶</button>
          <div class="ff-step-tabs" id="_ff_tabs"></div>
          <div class="ff-controls-divider"></div>
          <button class="ff-hud-toggle-btn" id="_ff_hud_toggle_btn" title="点击打开/关闭标定助手 (快捷键: Ctrl+Shift+D / ⌘+Shift+D)">
            <span class="ff-btn-icon">🎯</span>
            <span class="ff-btn-text">标定助手</span>
            <span class="ff-shortcut-badge">Ctrl+Shift+D</span>
          </button>
        </div>
      </div>
    `;

    this.stageEl = this.container.querySelector('.focusflow-stage');
    this.wrapEl = this.container.querySelector('#_ff_wrap');
    this.imgEl = this.container.querySelector('#_ff_img');
    this.overlayImagesLayerEl = this.container.querySelector('#_ff_overlay_images');
    this.svgEl = this.container.querySelector('#_ff_svg');
    this.calloutLayerEl = this.container.querySelector('#_ff_callouts');
    this.progressFillEl = this.container.querySelector('#_ff_progress');
    this.playBtnEl = this.container.querySelector('#_ff_play_btn');
    this.tabsContainerEl = this.container.querySelector('#_ff_tabs');
    this.hudToggleBtnEl = this.container.querySelector('#_ff_hud_toggle_btn');

    // Controls visibility switches
    if (!this.showProgress) {
      const progressTrack = this.container.querySelector('.focusflow-progress-track');
      if (progressTrack) progressTrack.style.display = 'none';
    }

    if (!this.showPlayBtn && this.playBtnEl) {
      this.playBtnEl.style.display = 'none';
    }

    if (!this.showHUDButton) {
      if (this.hudToggleBtnEl) this.hudToggleBtnEl.style.display = 'none';
      const divider = this.container.querySelector('.ff-controls-divider');
      if (divider) divider.style.display = 'none';
    }

    // Build Tabs
    this.tabsContainerEl.innerHTML = (this.dsl.scenes || []).map((scene, idx) => `
      <button class="ff-tab-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        ${idx + 1}. ${scene.title}
      </button>
    `).join('');

    // Tab click delegation
    this.tabsContainerEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.ff-tab-btn');
      if (btn) {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        this.goToStep(idx, true);
      }
    });

    // Play button click
    this.playBtnEl.addEventListener('click', () => {
      this.togglePlay();
    });

    // HUD toggle button click
    if (this.hudToggleBtnEl) {
      this.hudToggleBtnEl.addEventListener('click', () => {
        this.toggleDebugMode();
      });
    }
  }

  renderElements() {
    const elements = this.dsl.elements || { boxes: [], paths: [], dots: [] };

    // 1. Render Boxes (<rect>)
    (elements.boxes || []).forEach(box => {
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rectEl.setAttribute('id', box.id);
      rectEl.setAttribute('class', 'ff-box');
      rectEl.setAttribute('x', box.x);
      rectEl.setAttribute('y', box.y);
      rectEl.setAttribute('width', box.width);
      rectEl.setAttribute('height', box.height);
      rectEl.setAttribute('rx', box.rx || 16);
      rectEl.setAttribute('ry', box.rx || 16);

      const stroke = box.style?.stroke || 'var(--ff-accent)';
      const strokeWidth = box.style?.strokeWidth || 6;
      rectEl.setAttribute('stroke', stroke);
      rectEl.setAttribute('stroke-width', strokeWidth);

      if (box.style?.glow !== false) {
        rectEl.setAttribute('filter', 'url(#ff-glow)');
      }

      this.svgEl.appendChild(rectEl);

      // Compute precise perimeter & set initial dash offset
      const perimeter = this.geometry.getBoxPerimeter(box);
      rectEl.style.strokeDasharray = `${perimeter}`;
      rectEl.style.strokeDashoffset = `${perimeter}`;

      this.elementsMap.set(box.id, { data: box, dom: rectEl, type: 'box', perimeter });
    });

    // 2. Render Paths (<path>)
    (elements.paths || []).forEach(pathData => {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('id', pathData.id);
      pathEl.setAttribute('class', 'ff-path');

      // Auto-compute Bézier route if 'from' and 'to' are given without explicit 'd'
      const d = pathData.d || this.router.route(pathData.from, pathData.to);
      pathEl.setAttribute('d', d);

      const stroke = pathData.style?.stroke || 'var(--ff-accent)';
      const strokeWidth = pathData.style?.strokeWidth || 5;
      pathEl.setAttribute('stroke', stroke);
      pathEl.setAttribute('stroke-width', strokeWidth);

      if (pathData.style?.glow !== false) {
        pathEl.setAttribute('filter', 'url(#ff-glow)');
      }

      this.svgEl.appendChild(pathEl);

      // Auto measure path length
      const length = Math.ceil(pathEl.getTotalLength()) + 20;
      pathEl.style.strokeDasharray = `${length}`;
      pathEl.style.strokeDashoffset = `${length}`;

      this.elementsMap.set(pathData.id, { data: pathData, dom: pathEl, type: 'path', length, d });
    });

    // 3. Render Dots (<circle>)
    (elements.dots || []).forEach(dotData => {
      const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleEl.setAttribute('id', dotData.id);
      circleEl.setAttribute('class', 'ff-dot');
      circleEl.setAttribute('cx', dotData.cx);
      circleEl.setAttribute('cy', dotData.cy);
      circleEl.setAttribute('r', dotData.r || 10);
      circleEl.setAttribute('fill', dotData.style?.fill || 'var(--ff-accent)');

      if (dotData.style?.glow !== false) {
        circleEl.setAttribute('filter', 'url(#ff-glow)');
      }

      this.svgEl.appendChild(circleEl);
      this.elementsMap.set(dotData.id, { data: dotData, dom: circleEl, type: 'dot' });
    });

    // 4. Render Dynamic Overlay Images (<img>)
    (elements.images || []).forEach(imgData => {
      const overlayImg = document.createElement('img');
      overlayImg.setAttribute('id', imgData.id);
      overlayImg.setAttribute('class', `ff-overlay-img ${imgData.style?.animation || 'zoom-fade'}`);
      overlayImg.src = this.getAssetUrl(imgData.url);
      overlayImg.alt = imgData.id;

      // Coordinate mapping relative to logical viewport
      const leftPct = ((imgData.x / this.viewportWidth) * 100).toFixed(4);
      const topPct = ((imgData.y / this.viewportHeight) * 100).toFixed(4);
      const widthPct = ((imgData.width / this.viewportWidth) * 100).toFixed(4);
      const heightPct = ((imgData.height / this.viewportHeight) * 100).toFixed(4);

      overlayImg.style.left = `${leftPct}%`;
      overlayImg.style.top = `${topPct}%`;
      overlayImg.style.width = `${widthPct}%`;
      overlayImg.style.height = `${heightPct}%`;

      if (imgData.style?.borderRadius) {
        overlayImg.style.borderRadius = `${imgData.style.borderRadius}px`;
      }
      if (imgData.style?.border) {
        overlayImg.style.border = imgData.style.border;
      }
      if (imgData.style?.boxShadow === true) {
        overlayImg.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.2)';
      } else if (typeof imgData.style?.boxShadow === 'string') {
        overlayImg.style.boxShadow = imgData.style.boxShadow;
      }

      this.overlayImagesLayerEl.appendChild(overlayImg);
      this.elementsMap.set(imgData.id, { data: imgData, dom: overlayImg, type: 'image' });
    });

    // 5. Render Callouts
    (this.dsl.scenes || []).forEach(scene => {
      (scene.activeElements?.callouts || []).forEach(callout => {
        if (!this.calloutsMap.has(callout.id)) {
          const cardEl = document.createElement('div');
          cardEl.setAttribute('id', callout.id);
          cardEl.setAttribute('class', 'ff-callout');
          cardEl.style.left = callout.position.left;
          cardEl.style.top = callout.position.top;

          const theme = callout.theme || 'blue';
          cardEl.innerHTML = `
            <div class="ff-badge ${theme}">${callout.title}</div>
            <div class="ff-desc">${callout.desc}</div>
          `;

          this.calloutLayerEl.appendChild(cardEl);
          this.calloutsMap.set(callout.id, { data: callout, dom: cardEl });
        }
      });
    });
  }

  applyScene(index, scene, animate = true) {
    // 1. Camera Transition
    this.camera.apply(scene.camera, animate);

    // 2. Reset All Animated Elements
    this.animator.resetAll();

    // 3. Double-RAF Staggered Activation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animator.activate(scene.activeElements);
      });
    });

    // 4. Update UI Tab & Progress Bar
    this.updateControlsUI(index);

    if (this.options.onSceneChange) {
      this.options.onSceneChange(index, scene);
    }
  }

  updateControlsUI(activeIdx) {
    const total = this.dsl.scenes.length;
    const progress = total > 1 ? (activeIdx / (total - 1)) * 100 : 100;
    if (this.progressFillEl) {
      this.progressFillEl.style.width = `${progress}%`;
    }

    const tabs = this.tabsContainerEl.querySelectorAll('.ff-tab-btn');
    tabs.forEach((tab, idx) => {
      if (idx === activeIdx) {
        tab.classList.add('active');
        // Smoothly scroll active tab into view when many scenes exist
        if (typeof tab.scrollIntoView === 'function') {
          tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      } else {
        tab.classList.remove('active');
      }
    });
  }

  updatePlayButton(isPlaying) {
    this.playBtnEl.textContent = isPlaying ? '⏸' : '▶';
    this.playBtnEl.title = isPlaying ? '暂停 (P)' : '播放 (P)';
  }

  // Public APIs
  goToStep(index, animate = true) {
    this.stateMachine.goTo(index, animate);
  }

  next() {
    this.stateMachine.next();
  }

  prev() {
    this.stateMachine.prev();
  }

  togglePlay() {
    this.stateMachine.togglePlay();
  }

  toggleDebugMode(forceState) {
    if (this.hud) {
      this.hud.toggle(forceState);
    }
  }

  destroy() {
    this.events.unbind();
    this.stateMachine.destroy();
    if (this.hud) this.hud.destroy();
    this.container.innerHTML = '';
  }
}
