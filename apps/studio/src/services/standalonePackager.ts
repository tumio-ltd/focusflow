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

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${title}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: #0a0e17;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }
    #focusflow-root {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    ${playerCss || ''}
  </style>
</head>
<body>
  <div id="focusflow-root"></div>

  <script>
    ${playerIife || ''}
  </script>

  <script>
    (function() {
      const dsl = ${JSON.stringify(exportDSL, null, 2)};
      const container = document.getElementById('focusflow-root');
      if (container && window.FocusFlow && window.FocusFlow.FocusFlowPlayer) {
        const player = new window.FocusFlow.FocusFlowPlayer({
          container: container,
          dsl: dsl,
          autoplay: false,
          debug: false,
          showControls: true,
        });
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
