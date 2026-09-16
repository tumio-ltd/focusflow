import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');
const DOCS_ASSETS = path.resolve(ROOT_DIR, 'docs/assets');
const ARTIFACTS_DIR = '/Users/xt/.gemini/antigravity-cli/brain/fe3b97a1-c253-43bf-9dd4-8946fbac94b8';

// 读取已有图像 assets 转换为 base64 内联
const cameraFlowImgPath = path.join(DOCS_ASSETS, 'feature-camera-flow.png');
let cameraFlowBase64 = '';
if (fs.existsSync(cameraFlowImgPath)) {
  cameraFlowBase64 = `data:image/png;base64,${fs.readFileSync(cameraFlowImgPath).toString('base64')}`;
}

// 2560 x 1440 (YouTube 官方推荐尺寸，中央 1546 x 423 为桌面与手机安全区)
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FocusFlow YouTube Banner</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 2560px;
      height: 1440px;
      background: #060911;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Geist", Helvetica, Arial, sans-serif;
      color: #f8fafc;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 全局背景网格与光晕（适配 4K TV / 桌面） */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(56, 189, 248, 0.1) 1.5px, transparent 1.5px),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px, 80px 80px, 80px 80px;
      opacity: 0.9;
      pointer-events: none;
    }
    .glow-cyan-top {
      position: absolute;
      width: 1100px;
      height: 800px;
      left: 100px;
      top: 100px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(2, 132, 199, 0.04) 50%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
    }
    .glow-purple-bottom {
      position: absolute;
      width: 1200px;
      height: 900px;
      right: 100px;
      bottom: 100px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%);
      filter: blur(90px);
      pointer-events: none;
    }

    /* 安全区域（YouTube Safe Area: 1546px x 423px 居中条带） */
    .safe-area-strip {
      position: absolute;
      width: 100%;
      height: 424px;
      top: 508px; /* (1440 - 424) / 2 */
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    /* 顶部与底部的微弱发光分割线（界定桌面视口边际） */
    .strip-border-top {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.2) 20%, #38bdf8 50%, rgba(168, 85, 247, 0.2) 80%, transparent);
    }
    .strip-border-bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.3) 50%, transparent);
    }

    /* 安全核心内容容器（限宽 1546px） */
    .safe-content {
      width: 1546px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      position: relative;
    }

    /* 左侧文字排版 */
    .left-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      max-width: 860px;
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
      gap: 10px;
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

    .tag-by-tumio {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      margin-left: 6px;
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
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }

    .subheadline {
      font-size: 17px;
      font-weight: 400;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 22px;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      font-size: 13.5px;
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

    /* 右侧 3D 架构透视预览 */
    .right-preview {
      position: relative;
      width: 580px;
      height: 330px;
      perspective: 1200px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .mockup-card {
      position: relative;
      width: 540px;
      height: 290px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.9),
        0 0 35px rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(56, 189, 248, 0.35);
      transform: rotateY(-8deg) rotateX(4deg) scale(0.98);
      background: #0b1120;
    }

    .mockup-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }

    /* 浮动 Callout 拟真徽章 */
    .floating-callout {
      position: absolute;
      bottom: 24px;
      left: 0px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 8px 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7), 0 0 15px rgba(56, 189, 248, 0.35);
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
  <div class="grid-pattern"></div>
  <div class="glow-cyan-top"></div>
  <div class="glow-purple-bottom"></div>

  <!-- YouTube Safe Area 核心条带 -->
  <div class="safe-area-strip">
    <div class="strip-border-top"></div>
    <div class="strip-border-bottom"></div>

    <div class="safe-content">
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
          <span class="tag-by-tumio">by Tumio</span>
        </div>

        <div class="headline">
          Turn Architecture Diagrams into <span class="highlight">Cinematic Walkthroughs</span>
        </div>

        <div class="subheadline">
          Interactive 60fps camera director for software architectures, flowcharts & tech talks.
        </div>

        <div class="badges-row">
          <div class="badge"><span class="dot dot-cyan"></span> 60fps Camera & Frustum</div>
          <div class="badge"><span class="dot dot-emerald"></span> 100% Client-Side / Zero Backend</div>
          <div class="badge"><span class="dot dot-purple"></span> Audio Waveform Sync</div>
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
  </div>
</body>
</html>
`;

async function main() {
  const tempHtmlPath = path.join(ROOT_DIR, 'scratch/youtube-banner-template.html');
  fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('Launching browser for YouTube Banner (2560x1440)...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 1, // 原生 2560x1440 像素标准导出
  });

  await page.goto('file://' + tempHtmlPath);
  await page.waitForTimeout(500);

  const outputPathDocs = path.join(DOCS_ASSETS, 'youtube-banner.png');
  const outputPathArtifacts = path.join(ARTIFACTS_DIR, 'youtube_banner.png');

  fs.mkdirSync(DOCS_ASSETS, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  await page.screenshot({ path: outputPathDocs });
  await page.screenshot({ path: outputPathArtifacts });

  console.log('Successfully generated YouTube Banner:');
  console.log('1. Docs:', outputPathDocs);
  console.log('2. Artifacts:', outputPathArtifacts);

  await browser.close();
}

main().catch(err => {
  console.error('Failed to generate YouTube banner:', err);
  process.exit(1);
});
