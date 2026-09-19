import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DOCS_ASSETS = path.resolve(ROOT_DIR, 'docs/assets');
const ARTIFACTS_DIR = '/Users/xt/.gemini/antigravity-cli/brain/fe3b97a1-c253-43bf-9dd4-8946fbac94b8';
const AVATARS_INTERNAL = path.resolve(ROOT_DIR, 'docs-internal/marketing/avatars');

const sourceLogoPath = '/Users/xt/Downloads/陈铭/途铭/logo/tumio-logo-orange-SF-Pro-Display-Regular.png';
if (!fs.existsSync(sourceLogoPath)) {
  console.error('Source logo does not exist:', sourceLogoPath);
  process.exit(1);
}

const logoBase64 = `data:image/png;base64,${fs.readFileSync(sourceLogoPath).toString('base64')}`;

// 生成 4 种不同质感与背景的官方头像版本 (512x512)
const variants = [
  {
    id: 'tumio_avatar_dark_obsidian',
    name: '1. 极简黑曜石暗夜版 (Dark Obsidian - 强烈推荐)',
    desc: '纯正深邃黑曜石背景 (#080b12)，纯净橙色禅环与 Tumi 字体，极高对比度，为社交平台圆形裁切预留 15% 呼吸边缘',
    bg: '#080b12',
    glow: 'none',
    border: 'none',
    scale: 0.78,
  },
  {
    id: 'tumio_avatar_dark_glow',
    name: '2. 极客琥珀微光版 (Tech Amber Glow)',
    desc: '深空蓝黑背景，背后带有极微妙的暖橙漫射微光，增添现代科技与流光质感',
    bg: '#060911',
    glow: 'radial-gradient(circle, rgba(234, 88, 12, 0.22) 0%, rgba(234, 88, 12, 0.04) 55%, transparent 70%)',
    border: '1px solid rgba(234, 88, 12, 0.2)',
    scale: 0.76,
  },
  {
    id: 'tumio_avatar_pure_white',
    name: '3. 极简纯白包豪斯版 (Pure White Minimalist)',
    desc: '纯白背景 (#ffffff)，完全忠实原版原色，清晰干净，适合浅色平台',
    bg: '#ffffff',
    glow: 'none',
    border: 'none',
    scale: 0.78,
  },
  {
    id: 'tumio_avatar_slate_card',
    name: '4. 钛金深灰方圆基座版 (Titanium Slate Squircle)',
    desc: '深钛金哑光微倒角圆角盘，外圈带有微妙金属光泽边缘',
    bg: '#0d1117',
    glow: 'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
    border: '1.5px solid rgba(255, 255, 255, 0.1)',
    scale: 0.75,
  }
];

async function main() {
  fs.mkdirSync(AVATARS_INTERNAL, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const variant of variants) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 512px;
      height: 512px;
      background: ${variant.bg};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .glow-layer {
      position: absolute;
      width: 440px;
      height: 440px;
      background: ${variant.glow};
      pointer-events: none;
    }
    .logo-wrapper {
      position: relative;
      z-index: 2;
      width: ${512 * variant.scale}px;
      height: ${512 * variant.scale}px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="glow-layer"></div>
  <div class="logo-wrapper">
    <img src="${logoBase64}" alt="Tumio Official Logo">
  </div>
</body>
</html>`;

    const page = await browser.newPage({
      viewport: { width: 512, height: 512 },
      deviceScaleFactor: 2, // 2x Retina 导出 (1024x1024 超清)
    });

    await page.setContent(html);
    await page.waitForTimeout(100);

    const artifactPath = path.join(ARTIFACTS_DIR, `${variant.id}.png`);
    const internalPath = path.join(AVATARS_INTERNAL, `${variant.id}.png`);

    await page.screenshot({ path: artifactPath, scale: 'css' });
    await page.screenshot({ path: internalPath, scale: 'css' });

    console.log(`Rendered: ${variant.id} -> ${artifactPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All 4 Tumio authentic avatar variants generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
