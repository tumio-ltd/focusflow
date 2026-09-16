import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DOCS_ASSETS = path.resolve(ROOT_DIR, 'docs/assets');
const ARTIFACTS_DIR = '/Users/xt/.gemini/antigravity-cli/brain/fe3b97a1-c253-43bf-9dd4-8946fbac94b8';

// 读取已有图像 assets 转换为 base64 内联，确保完全自包含
const cameraFlowImgPath = path.join(DOCS_ASSETS, 'feature-camera-flow.png');
let cameraFlowBase64 = '';
if (fs.existsSync(cameraFlowImgPath)) {
  cameraFlowBase64 = `data:image/png;base64,${fs.readFileSync(cameraFlowImgPath).toString('base64')}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FocusFlow Reddit Banner</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1920px;
      height: 384px;
      background: #070b14;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Geist", Helvetica, Arial, sans-serif;
      color: #f8fafc;
      overflow: hidden;
      display: flex;
      position: relative;
    }

    /* 背景网格与光晕 */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 32px 32px, 64px 64px, 64px 64px;
      opacity: 0.85;
      pointer-events: none;
    }
    .glow-cyan {
      position: absolute;
      width: 600px;
      height: 384px;
      left: 100px;
      top: -100px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 70%);
      filter: blur(40px);
      pointer-events: none;
    }
    .glow-purple {
      position: absolute;
      width: 700px;
      height: 400px;
      right: 150px;
      top: -50px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
      filter: blur(50px);
      pointer-events: none;
    }

    /* 顶部与底部极光边框 */
    .top-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #0284c7 20%, #38bdf8 50%, #a855f7 80%, transparent);
      z-index: 10;
    }
    .bottom-border {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3) 50%, transparent);
      z-index: 10;
    }

    /* 主容器 */
    .banner-container {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
    }

    /* 左侧文字与品牌区 */
    .left-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 950px;
      z-index: 3;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }

    .brand-logo-svg {
      width: 44px;
      height: 44px;
      filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.5));
    }

    .brand-title {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 60%, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-title span.flow {
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tag-pill {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 10px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 999px;
      color: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
    }

    .headline {
      font-size: 34px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.8px;
      color: #f1f5f9;
      margin-bottom: 12px;
    }

    .headline .highlight {
      color: #38bdf8;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
    }

    .subheadline {
      font-size: 18px;
      font-weight: 400;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #cbd5e1;
      backdrop-filter: blur(8px);
    }

    .badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-cyan { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
    .dot-emerald { background: #34d399; box-shadow: 0 0 8px #34d399; }
    .dot-purple { background: #a855f7; box-shadow: 0 0 8px #a855f7; }

    /* 右侧倾斜 3D 视觉预览卡片 */
    .right-preview {
      position: relative;
      width: 720px;
      height: 320px;
      perspective: 1200px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .mockup-card {
      position: relative;
      width: 660px;
      height: 290px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.85),
        0 0 35px rgba(56, 189, 248, 0.2);
      border: 1px solid rgba(56, 189, 248, 0.35);
      transform: rotateY(-10deg) rotateX(4deg) scale(0.98);
      background: #0b1120;
    }

    .mockup-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }

    /* 浮动标签点缀 */
    .floating-callout {
      position: absolute;
      bottom: 24px;
      left: 10px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 8px 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.3);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(-8px);
      z-index: 5;
    }

    .callout-indicator {
      width: 10px;
      height: 10px;
      background: #38bdf8;
      border-radius: 50%;
      animation: pulse 2s infinite;
      box-shadow: 0 0 10px #38bdf8;
    }

    .callout-text-title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }
    .callout-text-sub {
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="top-border"></div>
  <div class="bottom-border"></div>
  <div class="grid-pattern"></div>
  <div class="glow-cyan"></div>
  <div class="glow-purple"></div>

  <div class="banner-container">
    <!-- 左侧品牌与标语 -->
    <div class="left-section">
      <div class="brand-header">
        <!-- SVG Logo -->
        <svg class="brand-logo-svg" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 40 24 L 28 24 A 4 4 0 0 0 24 28 L 24 40" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
          <path d="M 88 24 L 100 24 A 4 4 0 0 1 104 28 L 104 40" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
          <path d="M 24 88 L 24 100 A 4 4 0 0 0 28 104 L 40 104" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
          <path d="M 104 88 L 104 100 A 4 4 0 0 1 100 104 L 88 104" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
          <path d="M 28 96 C 52 96, 56 32, 100 32" stroke="url(#flowGrad)" stroke-width="12" stroke-linecap="round"/>
          <circle cx="100" cy="32" r="8" fill="#ffffff"/>
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0284c7"/>
              <stop offset="60%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#818cf8"/>
            </linearGradient>
          </defs>
        </svg>

        <h1 class="brand-title">Focus<span class="flow">Flow</span></h1>
        <div class="tag-pill">Open Source</div>
      </div>

      <div class="headline">
        Turn Architecture Diagrams into <span class="highlight">Cinematic Walkthroughs</span>
      </div>

      <div class="subheadline">
        Interactive 60fps camera director for software architectures, flowcharts & tech talks.
      </div>

      <div class="badges-row">
        <div class="badge"><span class="dot dot-cyan"></span> 60fps Smooth Camera & Frustum</div>
        <div class="badge"><span class="dot dot-emerald"></span> 100% Client-Side / Zero Backend</div>
        <div class="badge"><span class="dot dot-purple"></span> Audio Waveform & Speech Sync</div>
        <div class="badge">github.com/tumio-ltd/focusflow</div>
      </div>
    </div>

    <!-- 右侧立体视角预览 -->
    <div class="right-preview">
      <div class="mockup-card">
        <img src="${cameraFlowBase64}" alt="FocusFlow Viewport Preview">
      </div>

      <!-- 浮动 Callout 拟真徽章 -->
      <div class="floating-callout">
        <div class="callout-indicator"></div>
        <div>
          <div class="callout-text-title">Scene 03: Order Processing Core</div>
          <div class="callout-text-sub">60fps Bezier Camera Pan & Neon Flow</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const tempHtmlPath = path.join(ROOT_DIR, 'scratch/reddit-banner-template.html');
  fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 384 },
    deviceScaleFactor: 2, // 2x Retina 导出 (3840x768 降采样或高清显示)
  });

  await page.goto('file://' + tempHtmlPath);
  await page.waitForTimeout(500);

  const outputPathDocs = path.join(DOCS_ASSETS, 'reddit-banner.png');
  const outputPathArtifacts = path.join(ARTIFACTS_DIR, 'reddit_banner.png');

  fs.mkdirSync(DOCS_ASSETS, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  await page.screenshot({ path: outputPathDocs, scale: 'css' });
  await page.screenshot({ path: outputPathArtifacts, scale: 'css' });

  console.log('Successfully generated Reddit Banner:');
  console.log('1. Docs:', outputPathDocs);
  console.log('2. Artifacts:', outputPathArtifacts);

  await browser.close();
}

main().catch(err => {
  console.error('Failed to generate banner:', err);
  process.exit(1);
});
