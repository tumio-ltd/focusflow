/**
 * FocusFlow Native Playback Island Component
 * Zero external dependencies. Single source of truth for presentation controls across Studio, HTML export, and 60FPS recording.
 */

const ICONS = {
  PREV: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  NEXT: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  PLAY: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
  PAUSE: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="lucide lucide-pause"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  CLOCK: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  LAYERS: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
  EYE: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  EYE_OFF: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
  MAXIMIZE: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
};

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class PlaybackIsland {
  constructor(options = {}) {
    this.options = options;
    this.state = {
      isPlaying: !!options.isPlaying,
      currentSceneIdx: options.currentSceneIdx || 0,
      totalScenes: options.totalScenes || 1,
      currentSceneTitle: options.currentSceneTitle || '',
      sceneElapsedMs: options.sceneElapsedMs || 0,
      sceneDurationMs: options.sceneDurationMs || 0,
      hudMode: options.hudMode || 'full',
      isRecording: !!options.isRecording,
      isUserActive: options.isUserActive !== undefined ? options.isUserActive : true,
      elementCount: options.elementCount || 0,
    };

    this.rootEl = null;
    this.fullIslandEl = null;
    this.minimalIslandEl = null;
    this.zenIslandEl = null;
    this.zenSensorEl = null;

    this.prevBtnEl = null;
    this.playBtnEl = null;
    this.nextBtnEl = null;
    this.navDividerEl = null;
    this.sceneIndexTextEl = null;
    this.sceneTitleTextEl = null;
    this.timerPillEl = null;
    this.timerTextEl = null;
    this.elementCountContainerEl = null;
    this.elementCountTextEl = null;
    this.hudDividerEl = null;
    this.hudToggleBtnEl = null;

    this.minimalTextEl = null;
    this.minimalExpandBtnEl = null;
    this.minimalToggleBtnEl = null;

    this.zenRestoreBtnEl = null;

    this._boundUserActivity = this._handleUserActivity.bind(this);
    this._idleTimer = null;

    if (options.container) {
      this.mount(options.container);
    }
  }

  mount(container) {
    if (!container) return;
    this.destroy();

    const root = document.createElement('div');
    root.className = 'ff-island-root';
    root.setAttribute('data-testid', 'playback-island-root');

    // 1. Full Island (MVP 居中药丸)
    const fullIsland = document.createElement('div');
    fullIsland.className = 'ff-island-full focusflow-controls';
    fullIsland.setAttribute('data-testid', 'audience-controls');
    fullIsland.innerHTML = `
      <button class="ff-island-nav-btn ff-island-prev-btn" data-testid="audience-prev-btn" title="上一幕 (ArrowLeft / PageUp)">
        ${ICONS.PREV}
      </button>
      <button class="ff-island-play-btn" data-testid="audience-play-btn" title="自动演播 (Space)">
        ${ICONS.PLAY}
      </button>
      <button class="ff-island-nav-btn ff-island-next-btn" data-testid="audience-next-btn" title="下一幕 (ArrowRight / PageDown)">
        ${ICONS.NEXT}
      </button>

      <div class="ff-island-divider ff-island-nav-divider"></div>

      <div class="ff-island-scene-pill" data-testid="audience-scene-pill">
        <div class="ff-island-dot"></div>
        <span class="ff-island-scene-idx font-mono font-semibold">01 / 01</span>
        <div class="ff-island-divider-sub"></div>
        <span class="ff-island-scene-title truncate" title=""></span>
      </div>

      <div class="ff-island-timer-wrapper" style="display: none;">
        <div class="ff-island-divider"></div>
        <div class="ff-island-timer-pill" data-testid="audience-scene-timer" style="display: none;">
          <span class="ff-island-timer-icon">${ICONS.CLOCK}</span>
          <span class="ff-island-timer-text font-mono">00:00 / 00:00</span>
        </div>
      </div>

      <div class="ff-island-element-wrapper">
        <div class="ff-island-divider"></div>
        <div class="ff-island-element-pill">
          ${ICONS.LAYERS}
          <span class="ff-island-element-count font-mono">0</span>
        </div>
      </div>

      <div class="ff-island-hud-wrapper">
        <div class="ff-island-divider ff-island-hud-divider"></div>
        <button class="ff-island-hud-btn" data-testid="hud-mode-toggle" title="切换 HUD 模式 (快捷键: H)">
          ${ICONS.EYE}
        </button>
      </div>
    `;

    // 2. Minimal Island (右下角微缩胶囊)
    const minimalIsland = document.createElement('div');
    minimalIsland.className = 'ff-island-minimal';
    minimalIsland.setAttribute('data-testid', 'audience-hud-minimal');
    minimalIsland.style.display = 'none';
    minimalIsland.innerHTML = `
      <div class="ff-island-dot"></div>
      <span class="ff-island-minimal-text font-mono font-medium">01/01</span>
      <div class="ff-island-divider-sub"></div>
      <button class="ff-island-minimal-expand-btn" title="展开为完整控制栏">
        ${ICONS.MAXIMIZE}
      </button>
      <button class="ff-island-minimal-toggle-btn" data-testid="hud-mode-toggle-minimal" title="切换 HUD 模式 (快捷键: H)">
        ${ICONS.EYE}
      </button>
    `;

    // 3. Zen Island (沉浸纯净唤醒感应带与浮岛)
    const zenSensor = document.createElement('div');
    zenSensor.className = 'ff-island-zen-sensor';
    zenSensor.style.display = 'none';

    const zenIsland = document.createElement('button');
    zenIsland.className = 'ff-island-zen-btn';
    zenIsland.setAttribute('data-testid', 'zen-restore-hud-btn');
    zenIsland.style.display = 'none';
    zenIsland.title = '点击恢复演播控制栏 (或按快捷键 H)';
    zenIsland.innerHTML = `
      <span class="text-cyan-400">${ICONS.EYE}</span>
      <span>纯净演播中 · 点击恢复控制栏 (快捷键 H)</span>
    `;

    root.appendChild(fullIsland);
    root.appendChild(minimalIsland);
    root.appendChild(zenSensor);
    root.appendChild(zenIsland);
    container.appendChild(root);

    this.rootEl = root;
    this.fullIslandEl = fullIsland;
    this.minimalIslandEl = minimalIsland;
    this.zenSensorEl = zenSensor;
    this.zenIslandEl = zenIsland;

    // Cache elements
    this.prevBtnEl = fullIsland.querySelector('.ff-island-prev-btn');
    this.playBtnEl = fullIsland.querySelector('.ff-island-play-btn');
    this.nextBtnEl = fullIsland.querySelector('.ff-island-next-btn');
    this.navDividerEl = fullIsland.querySelector('.ff-island-nav-divider');
    this.sceneIndexTextEl = fullIsland.querySelector('.ff-island-scene-idx');
    this.sceneTitleTextEl = fullIsland.querySelector('.ff-island-scene-title');
    this.timerWrapperEl = fullIsland.querySelector('.ff-island-timer-wrapper');
    this.timerPillEl = fullIsland.querySelector('.ff-island-timer-pill');
    this.timerTextEl = fullIsland.querySelector('.ff-island-timer-text');
    this.elementCountWrapperEl = fullIsland.querySelector('.ff-island-element-wrapper');
    this.elementCountTextEl = fullIsland.querySelector('.ff-island-element-count');
    this.hudWrapperEl = fullIsland.querySelector('.ff-island-hud-wrapper');
    this.hudDividerEl = fullIsland.querySelector('.ff-island-hud-divider');
    this.hudToggleBtnEl = fullIsland.querySelector('.ff-island-hud-btn');

    this.minimalTextEl = minimalIsland.querySelector('.ff-island-minimal-text');
    this.minimalExpandBtnEl = minimalIsland.querySelector('.ff-island-minimal-expand-btn');
    this.minimalToggleBtnEl = minimalIsland.querySelector('.ff-island-minimal-toggle-btn');

    this.zenRestoreBtnEl = zenIsland;

    // Bind event listeners
    this.prevBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onPrev?.();
    });

    this.playBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onTogglePlay?.();
    });

    this.nextBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onNext?.();
    });

    this.hudToggleBtnEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onCycleHudMode?.();
    });

    this.minimalExpandBtnEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onRestoreFull?.();
    });

    this.minimalToggleBtnEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onCycleHudMode?.();
    });

    zenIsland.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.onRestoreFull?.();
    });

    zenSensor.addEventListener('mousemove', this._boundUserActivity);
    zenSensor.addEventListener('mouseenter', this._boundUserActivity);

    // Initial render
    this.update(this.state);
  }

  _handleUserActivity() {
    this.state.isUserActive = true;
    this._renderVisibility();

    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      this.state.isUserActive = false;
      this._renderVisibility();
    }, 3000);
  }

  update(partialState = {}) {
    Object.assign(this.state, partialState);
    if (!this.rootEl) return;

    const {
      isPlaying,
      currentSceneIdx,
      totalScenes,
      currentSceneTitle,
      sceneElapsedMs,
      sceneDurationMs,
      hudMode,
      isRecording,
      isUserActive,
      elementCount,
    } = this.state;

    // Toggle Scheme A Read-Only Chapter Roadsign Badge in recording mode
    if (this.fullIslandEl) {
      this.fullIslandEl.classList.toggle('is-recording', isRecording);
    }

    // 1. Update Play Button (Hidden in recording mode to eliminate false affordance)
    if (this.playBtnEl) {
      this.playBtnEl.style.display = isRecording ? 'none' : 'inline-flex';
      this.playBtnEl.innerHTML = isPlaying ? ICONS.PAUSE : ICONS.PLAY;
      this.playBtnEl.title = isPlaying ? '暂停 (Space)' : '自动演播 (Space)';
    }

    // 2. Update Prev / Next Buttons & Nav Divider (Hidden in recording mode)
    if (this.prevBtnEl) {
      this.prevBtnEl.style.display = isRecording ? 'none' : 'inline-flex';
      this.prevBtnEl.disabled = currentSceneIdx === 0;
    }
    if (this.nextBtnEl) {
      this.nextBtnEl.style.display = isRecording ? 'none' : 'inline-flex';
      this.nextBtnEl.disabled = currentSceneIdx === totalScenes - 1;
    }
    if (this.navDividerEl) {
      this.navDividerEl.style.display = isRecording ? 'none' : 'block';
    }

    // 3. Update Scene Index & Title
    const sceneCurStr = String(currentSceneIdx + 1).padStart(2, '0');
    const sceneTotStr = String(totalScenes).padStart(2, '0');
    if (this.sceneIndexTextEl) {
      this.sceneIndexTextEl.textContent = `${sceneCurStr} / ${sceneTotStr}`;
    }
    if (this.sceneTitleTextEl) {
      this.sceneTitleTextEl.textContent = currentSceneTitle || '';
      this.sceneTitleTextEl.title = currentSceneTitle || '';
    }

    // 4. Update Dynamic Timer Pill (Playing -> Expanded, Paused -> Collapsed)
    if (this.timerWrapperEl) {
      this.timerWrapperEl.style.display = isPlaying ? 'flex' : 'none';
    }
    if (this.timerPillEl) {
      this.timerPillEl.style.display = isPlaying ? 'flex' : 'none';
      if (isPlaying && this.timerTextEl) {
        this.timerTextEl.textContent = `${formatTime(sceneElapsedMs)} / ${formatTime(sceneDurationMs)}`;
      }
    }

    // 5. Update Element Count (Hidden in recording mode)
    if (this.elementCountWrapperEl) {
      this.elementCountWrapperEl.style.display = isRecording ? 'none' : 'flex';
      const count = elementCount || 0;
      if (this.elementCountTextEl) {
        this.elementCountTextEl.textContent = String(count);
      }
    }

    // 6. Creator Controls Isolation during Recording
    if (this.hudWrapperEl) {
      this.hudWrapperEl.style.display = isRecording ? 'none' : 'flex';
    }

    // 7. Minimal Mode Update
    if (this.minimalTextEl) {
      const timePrefix = isPlaying ? `${formatTime(sceneElapsedMs)} / ${formatTime(sceneDurationMs)} · ` : '';
      this.minimalTextEl.textContent = `${timePrefix}${sceneCurStr}/${sceneTotStr}`;
    }

    // 8. Update HUD Mode visibility
    this._renderVisibility();
  }

  _renderVisibility() {
    if (!this.rootEl) return;
    const { hudMode, isRecording, isPlaying, isUserActive } = this.state;

    // Full Island
    if (hudMode === 'full') {
      this.fullIslandEl.style.display = 'flex';
      this.minimalIslandEl.style.display = 'none';
      this.zenSensorEl.style.display = 'none';
      this.zenIslandEl.style.display = 'none';

      if (this.hudToggleBtnEl) this.hudToggleBtnEl.setAttribute('data-testid', 'hud-mode-toggle');
      if (this.minimalToggleBtnEl) this.minimalToggleBtnEl.removeAttribute('data-testid');

      // Visibility transition
      const show = isRecording || !isPlaying || isUserActive;
      if (show) {
        this.fullIslandEl.classList.add('ff-island-visible');
        this.fullIslandEl.classList.remove('ff-island-hidden');
      } else {
        this.fullIslandEl.classList.add('ff-island-hidden');
        this.fullIslandEl.classList.remove('ff-island-visible');
      }
    } else if (hudMode === 'minimal') {
      this.fullIslandEl.style.display = 'none';
      this.minimalIslandEl.style.display = isRecording ? 'none' : 'flex';
      this.zenSensorEl.style.display = 'none';
      this.zenIslandEl.style.display = 'none';

      if (this.hudToggleBtnEl) this.hudToggleBtnEl.removeAttribute('data-testid');
      if (this.minimalToggleBtnEl) this.minimalToggleBtnEl.setAttribute('data-testid', 'hud-mode-toggle');

      const show = isRecording || !isPlaying || isUserActive;
      if (show) {
        this.minimalIslandEl.classList.add('ff-island-visible');
        this.minimalIslandEl.classList.remove('ff-island-hidden');
      } else {
        this.minimalIslandEl.classList.add('ff-island-hidden');
        this.minimalIslandEl.classList.remove('ff-island-visible');
      }
    } else if (hudMode === 'zen') {
      this.fullIslandEl.style.display = 'none';
      this.minimalIslandEl.style.display = 'none';
      this.zenSensorEl.style.display = isRecording ? 'none' : 'block';
      this.zenIslandEl.style.display = isRecording ? 'none' : 'flex';

      if (this.hudToggleBtnEl) this.hudToggleBtnEl.removeAttribute('data-testid');
      if (this.minimalToggleBtnEl) this.minimalToggleBtnEl.removeAttribute('data-testid');

      if (!isRecording && isUserActive) {
        this.zenIslandEl.classList.add('ff-island-visible');
        this.zenIslandEl.classList.remove('ff-island-hidden');
      } else {
        this.zenIslandEl.classList.add('ff-island-hidden');
        this.zenIslandEl.classList.remove('ff-island-visible');
      }
    }

    // Coordinate with watermark badge displacement (Scheme A: Upward Displacement)
    const isMinimalActive = (hudMode === 'minimal') && !isRecording && (isRecording || !isPlaying || isUserActive);
    const doc = this.options.container?.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (doc) {
      const watermarkEl = doc.querySelector('.ff-watermark-badge, [data-testid="focusflow-watermark-badge"]');
      if (watermarkEl) {
        watermarkEl.classList.toggle('ff-watermark-displaced', isMinimalActive);
      }
    }
  }

  setHudMode(mode) {
    this.update({ hudMode: mode });
  }

  destroy() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
    const doc = this.options.container?.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (doc) {
      const watermarkEl = doc.querySelector('.ff-watermark-badge, [data-testid="focusflow-watermark-badge"]');
      if (watermarkEl) {
        watermarkEl.classList.remove('ff-watermark-displaced');
      }
    }
    if (this.rootEl && this.rootEl.parentNode) {
      this.rootEl.parentNode.removeChild(this.rootEl);
    }
    this.rootEl = null;
  }
}
