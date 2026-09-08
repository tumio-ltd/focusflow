/**
 * FocusFlow Document Picture-in-Picture (PiP) 录制独立浮窗控制器
 * 基于 Chrome 111+ 原生 documentPictureInPicture API
 * 将录制状态、实时计时码与完成操作独立物理隔离在 OS 原生桌面浮窗中，实现录制画面 100% 纯净无痕
 */

export interface RecordingPiPOptions {
  totalDurationSeconds?: number;
  fps?: number;
  resolution?: string;
  onFinish: () => void;
  onCancel?: () => void;
}

export interface RecordingPiPInstance {
  updateElapsed: (seconds: number) => void;
  close: () => void;
  isClosed: () => boolean;
  getWindow: () => Window | null;
}

export function isDocumentPiPSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'documentPictureInPicture' in window &&
    typeof (window as any).documentPictureInPicture?.requestWindow === 'function'
  );
}

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const remS = (s % 60).toString().padStart(2, '0');
  return `${m}:${remS}`;
}

export async function openRecordingPiP(
  options: RecordingPiPOptions
): Promise<RecordingPiPInstance | null> {
  const {
    totalDurationSeconds = 60,
    fps = 60,
    resolution = '1080p',
    onFinish,
    onCancel,
  } = options;

  if (!isDocumentPiPSupported()) {
    console.info('[FocusFlow PiP] 当前环境不支持 Document Picture-in-Picture API，跳过独立浮窗');
    return null;
  }

  try {
    const pipWindow: Window = await (window as any).documentPictureInPicture.requestWindow({
      width: 340,
      height: 130,
    });

    pipWindow.document.title = 'FocusFlow REC';

    // 注入精美暗色玻璃拟态独立样式
    const styleEl = pipWindow.document.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
      body {
        background-color: #090d16;
        color: #f1f5f9;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100vh;
        padding: 12px 14px;
        overflow: hidden;
      }
      .header-row { display: flex; align-items: center; justify-content: space-between; }
      .rec-badge { display: flex; align-items: center; gap: 6px; }
      .rec-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #ef4444; animation: rec-pulse 1.5s infinite; }
      .rec-text { font-size: 11px; font-weight: 700; color: #f87171; letter-spacing: 0.05em; }
      .fps-tag { font-size: 10px; font-family: ui-monospace, monospace; color: #94a3b8; background: #1e293b; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; }
      .time-row { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
      .time-main { font-size: 22px; font-weight: 700; font-family: ui-monospace, monospace; color: #ffffff; letter-spacing: -0.02em; }
      .time-total { font-size: 12px; font-family: ui-monospace, monospace; color: #64748b; }
      .progress-wrap { width: 100%; height: 3px; background: #1e293b; border-radius: 2px; overflow: hidden; margin: 6px 0; }
      .progress-bar { width: 0%; height: 100%; background: #06b6d4; transition: width 0.3s ease; }
      .btn-row { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
      .btn { border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease; }
      .btn-primary { background: #059669; color: #ffffff; flex: 1; justify-content: center; }
      .btn-primary:hover { background: #10b981; }
      .btn-cancel { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
      .btn-cancel:hover { background: #334155; color: #e2e8f0; }
      @keyframes rec-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
    `;
    pipWindow.document.head.appendChild(styleEl);

    // 构建 DOM
    const container = pipWindow.document.createElement('div');
    container.innerHTML = `
      <div class="header-row">
        <div class="rec-badge">
          <div class="rec-dot"></div>
          <span class="rec-text">REC</span>
        </div>
        <span class="fps-tag">${fps}fps · ${resolution}</span>
      </div>

      <div class="time-row">
        <span class="time-main" id="pip-time-elapsed">00:00</span>
        <span class="time-total" id="pip-time-total">/ ${formatSeconds(totalDurationSeconds)}</span>
      </div>

      <div class="progress-wrap">
        <div class="progress-bar" id="pip-progress-bar"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" id="pip-finish-btn" data-testid="pip-finish-btn">
          <span>💾 完成并保存</span>
        </button>
        <button class="btn btn-cancel" id="pip-cancel-btn" data-testid="pip-cancel-btn">
          <span>放弃</span>
        </button>
      </div>
    `;
    pipWindow.document.body.appendChild(container);

    let isHandled = false;
    let isWindowClosed = false;

    const elapsedEl = pipWindow.document.getElementById('pip-time-elapsed');
    const progressEl = pipWindow.document.getElementById('pip-progress-bar');
    const finishBtn = pipWindow.document.getElementById('pip-finish-btn');
    const cancelBtn = pipWindow.document.getElementById('pip-cancel-btn');

    const handleFinish = () => {
      if (isHandled) return;
      isHandled = true;
      try {
        pipWindow.close();
      } catch {}
      onFinish();
    };

    const handleCancel = () => {
      if (isHandled) return;
      isHandled = true;
      try {
        pipWindow.close();
      } catch {}
      onCancel?.();
    };

    finishBtn?.addEventListener('click', handleFinish);
    cancelBtn?.addEventListener('click', handleCancel);

    // 用户主动关闭 OS 浮窗时，平滑收尾导出，绝不丢失已录制成果
    pipWindow.addEventListener('pagehide', () => {
      isWindowClosed = true;
      if (!isHandled) {
        isHandled = true;
        onFinish();
      }
    });

    return {
      updateElapsed: (seconds: number) => {
        if (isWindowClosed) return;
        try {
          if (elapsedEl) {
            elapsedEl.textContent = formatSeconds(seconds);
          }
          if (progressEl && totalDurationSeconds > 0) {
            const pct = Math.min(100, (seconds / totalDurationSeconds) * 100);
            progressEl.style.width = `${pct}%`;
          }
        } catch {}
      },
      close: () => {
        if (isWindowClosed) return;
        isHandled = true;
        isWindowClosed = true;
        try {
          pipWindow.close();
        } catch {}
      },
      isClosed: () => isWindowClosed,
      getWindow: () => (isWindowClosed ? null : pipWindow),
    };
  } catch (err) {
    console.warn('[FocusFlow PiP] 唤起 Document PiP 窗口失败:', err);
    return null;
  }
}
