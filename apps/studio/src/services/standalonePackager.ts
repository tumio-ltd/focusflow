import type { FocusFlowDSL } from '@focusflow/dsl';
import { blobToDataUrl } from '@/utils/imageDecoder';
// @ts-ignore
import playerCss from '@focusflow/player/styles.css?raw';
// @ts-ignore
import playerIife from '@focusflow/player/dist/focusflow.iife.js?raw';

/**
 * 编译 FocusFlow 0 依赖纯前端单文件独立 HTML
 */
export async function compileStandaloneHtml(dsl: FocusFlowDSL): Promise<string> {
  const title = dsl.meta?.title || 'FocusFlow 架构演进演示';

  // 深拷贝 DSL，避免篡改原对象
  const exportDSL = JSON.parse(JSON.stringify(dsl));

  // 独立单文件 HTML 脱机交付：必须强制启用控制栏（覆盖 Studio 内置的 showControls: false），让受众拥有完整的分幕切换、翻页与自控能力
  exportDSL.meta = exportDSL.meta || {};
  exportDSL.meta.controls = {
    autoplay: false,
    interval: exportDSL.meta.controls?.interval || 3800,
    ...exportDSL.meta.controls,
    showControls: true,
    showPlayBtn: true,
    showCounter: true,
    showProgress: true,
  };

  // 若底图不是 Base64 Data URL（如 blob: 或本地静态相对路径），自动转为内嵌 Base64 Data URL 确保脱机完全自包含与零 CORS 报错
  if (exportDSL.asset?.url && !exportDSL.asset.url.startsWith('data:')) {
    try {
      const resp = await fetch(exportDSL.asset.url);
      const blob = await resp.blob();
      exportDSL.asset.url = await blobToDataUrl(blob);
    } catch (e) {
      console.warn('Failed to embed base image as base64 in standalone HTML:', e);
    }
  }

  // 若存在叠加贴图/图标，统一转为 Base64 Data URL
  if (exportDSL.elements?.images?.length) {
    for (const img of exportDSL.elements.images) {
      if (img.url && !img.url.startsWith('data:')) {
        try {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          img.url = await blobToDataUrl(blob);
        } catch (e) {
          console.warn('Failed to embed overlay image as base64 in standalone HTML:', e);
        }
      }
    }
  }

  // 若音频轨不是 Base64 Data URL，自动转为内嵌 Base64 Data URL
  if (exportDSL.audio?.tracks?.length) {
    for (const track of exportDSL.audio.tracks) {
      if (track.url && !track.url.startsWith('data:')) {
        try {
          const resp = await fetch(track.url);
          const blob = await resp.blob();
          track.url = await blobToDataUrl(blob);
        } catch (e) {
          console.warn('Failed to embed audio track as base64 in standalone HTML:', e);
        }
      }
    }
  }

  // 若分幕配音 (voiceoverAudio) 不是 Base64 Data URL，自动转为内嵌 Base64 Data URL (杜绝泄漏 blob:http://localhost:5174 死链)
  if (exportDSL.scenes?.length) {
    for (const scene of exportDSL.scenes) {
      if (scene.voiceoverAudio?.url && !scene.voiceoverAudio.url.startsWith('data:')) {
        try {
          const resp = await fetch(scene.voiceoverAudio.url);
          const blob = await resp.blob();
          scene.voiceoverAudio.url = await blobToDataUrl(blob);
        } catch (e) {
          console.warn(`Failed to embed scene voiceover as base64 in standalone HTML (${scene.id}):`, e);
          delete scene.voiceoverAudio.url;
        }
      }
    }
  }

const WATERMARK_SVG_LOGO = `<svg viewBox="0 0 128 128" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" class="ff-watermark-icon">
  <defs>
    <linearGradient id="ffWatermarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="ffWatermarkGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <g stroke="#38bdf8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M 40 24 L 28 24 A 4 4 0 0 0 24 28 L 24 40" />
    <path d="M 88 24 L 100 24 A 4 4 0 0 1 104 28 L 104 40" />
    <path d="M 24 88 L 24 100 A 4 4 0 0 0 28 104 L 40 104" />
    <path d="M 104 88 L 104 100 A 4 4 0 0 1 100 104 L 88 104" />
  </g>
  <path d="M 28 96 C 52 96, 56 32, 100 32" stroke="url(#ffWatermarkGrad)" stroke-width="11" stroke-linecap="round" filter="url(#ffWatermarkGlow)" />
  <circle cx="100" cy="32" r="7" fill="#ffffff" filter="url(#ffWatermarkGlow)" />
</svg>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>${title}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      height: 100dvh;
      min-height: -webkit-fill-available;
      overflow: hidden;
      background-color: #0a0e17;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    #focusflow-root {
      width: 100%;
      height: 100%;
      min-height: -webkit-fill-available;
      position: relative;
      overflow: hidden;
    }
    ${playerCss || ''}

    /* ==========================================================================
       FocusFlow Official Watermark Badge (开源版官方微型水印角标)
       ========================================================================== */
    .ff-watermark-badge {
      --ff-watermark-y: 0px;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 40;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px 4px 5px;
      border-radius: 9999px;
      background: rgba(10, 14, 23, 0.78);
      border: 1px solid rgba(56, 189, 248, 0.22);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      text-decoration: none;
      user-select: none;
      cursor: pointer;
      opacity: 0.82;
      transform: translateY(var(--ff-watermark-y));
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ff-watermark-badge:hover {
      opacity: 1;
      background: rgba(13, 20, 36, 0.92);
      border-color: rgba(56, 189, 248, 0.55);
      transform: translateY(calc(var(--ff-watermark-y) - 1.5px));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 14px rgba(56, 189, 248, 0.2);
    }

    .ff-watermark-badge:active {
      transform: translateY(var(--ff-watermark-y));
      opacity: 0.95;
    }

    /* 避让右下角最小化胶囊控制器 (Scheme A: Upward Displacement) */
    body:has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
    :has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
    .ff-watermark-badge.ff-watermark-displaced {
      --ff-watermark-y: -42px;
    }

    .ff-watermark-logo-box {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .ff-watermark-badge:hover .ff-watermark-logo-box {
      background: rgba(56, 189, 248, 0.2);
      border-color: rgba(56, 189, 248, 0.45);
    }

    .ff-watermark-icon {
      width: 14px;
      height: 14px;
      display: block;
    }

    .ff-watermark-label {
      display: flex;
      align-items: baseline;
      gap: 4px;
      line-height: 1;
      white-space: nowrap;
    }

    .ff-watermark-prefix {
      font-size: 10.5px;
      font-weight: 400;
      letter-spacing: 0.02em;
      color: rgba(148, 163, 184, 0.85);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ff-watermark-brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: -0.01em;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* 移动端与窄屏自适应 (避让底部控制栏，精简字样) */
    @media (max-width: 640px) {
      .ff-watermark-badge {
        bottom: 74px;
        right: 12px;
        padding: 3px 8px 3px 4px;
      }
      body:has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
      :has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
      .ff-watermark-badge.ff-watermark-displaced {
        --ff-watermark-y: 0px;
      }
      .ff-watermark-prefix {
        display: none;
      }
      .ff-watermark-logo-box {
        width: 18px;
        height: 18px;
      }
      .ff-watermark-icon {
        width: 12px;
        height: 12px;
      }
      .ff-watermark-brand {
        font-size: 10px;
      }
    }

    /* 移动端竖屏横屏指引与自适应 */
    @media (max-width: 768px) and (orientation: portrait) {
      .ff-mobile-rotate-hint {
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 60;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(56, 189, 248, 0.3);
        color: #38bdf8;
        padding: 5px 14px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 500;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        animation: ffPulseHint 2.4s infinite ease-in-out;
      }
    }
    @media (orientation: landscape) or (min-width: 769px) {
      .ff-mobile-rotate-hint {
        display: none !important;
      }
    }
    @keyframes ffPulseHint {
      0%, 100% { opacity: 0.82; transform: translateX(-50%) translateY(0); }
      50% { opacity: 1; transform: translateX(-50%) translateY(-2px); }
    }

    /* 全屏演播模式自适应微暗 */
    :fullscreen .ff-watermark-badge,
    :-webkit-full-screen .ff-watermark-badge {
      bottom: 28px;
      right: 28px;
      opacity: 0.65;
    }

    :fullscreen .ff-watermark-badge:hover,
    :-webkit-full-screen .ff-watermark-badge:hover {
      opacity: 1;
    }
  </style>
</head>
<body>
  <div id="focusflow-root"></div>

  <!-- 移动端竖屏浏览指引徽章 -->
  <div class="ff-mobile-rotate-hint">
    <span>🔄</span>
    <span>建议旋转至横屏浏览全景</span>
  </div>

  <!-- FocusFlow Official Watermark Badge (开源版官方微型水印角标) -->
  <a
    href="https://tumio-ltd.github.io/focusflow/"
    target="_blank"
    rel="noopener noreferrer"
    class="ff-watermark-badge"
    data-testid="focusflow-watermark-badge"
    title="FocusFlow · 动效架构演进演示 (点击探索)"
  >
    <div class="ff-watermark-logo-box">
      ${WATERMARK_SVG_LOGO}
    </div>
    <span class="ff-watermark-label">
      <span class="ff-watermark-prefix">Powered by</span>
      <span class="ff-watermark-brand">FocusFlow</span>
    </span>
  </a>

  <script>
    ${playerIife || ''}
  </script>

  <script>
    (function() {
      try {
        const dsl = ${JSON.stringify(exportDSL, null, 2)};
        const container = document.getElementById('focusflow-root');
        const PlayerClass = window.FocusFlow?.FocusFlowPlayer || window.FocusFlowPlayer;
        if (!PlayerClass) {
          throw new Error('FocusFlow Player 核心引擎未能在当前浏览器环境中完成装载');
        }
        if (!container) {
          throw new Error('找不到播放容器 #focusflow-root');
        }
        const player = new PlayerClass({
          container: container,
          dsl: dsl,
          autoplay: false,
          debug: false,
          showControls: true,
        });
        window.player = player;
      } catch (err) {
        console.error('[FocusFlow Standalone Crash Guard]', err);
        const root = document.getElementById('focusflow-root');
        if (root && (!root.children || root.children.length === 0)) {
          root.innerHTML = \`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;text-align:center;box-sizing:border-box;">
              <div style="font-size:36px;margin-bottom:12px;">⚠️</div>
              <div style="font-size:16px;color:#f1f5f9;font-weight:600;margin-bottom:8px;">FocusFlow 演示加载提示</div>
              <div style="font-size:13px;max-width:320px;line-height:1.5;color:#94a3b8;margin-bottom:16px;">\${err && err.message ? err.message : '浏览器环境受限，请尝试切换横屏或使用现代浏览器打开'}</div>
              <button onclick="location.reload()" style="background:#38bdf8;color:#0a0e17;border:none;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;">重新加载</button>
            </div>
          \`;
        }
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * 浏览器端触发 0 延迟一键保存单文件 HTML
 */
export async function downloadStandaloneHtml(dsl: FocusFlowDSL, fileName?: string): Promise<void> {
  const htmlContent = await compileStandaloneHtml(dsl);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeTitle = (fileName || dsl.meta?.title || 'focusflow-presentation')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
