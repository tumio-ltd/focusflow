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

// 1200 x 900 (4:3 比例，小红书个人主页标准背景图，上方展示产品，下方渐变暗色避免遮挡头像文字)
const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>FocusFlow Xiaohongshu Profile Cover</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 900px;
      background: #060911;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, "Inter", sans-serif;
      color: #f8fafc;
      overflow: hidden;
      position: relative;
    }

    /* 背景蓝图网格与光晕 */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(56, 189, 248, 0.12) 1.5px, transparent 1.5px),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 36px 36px, 72px 72px, 72px 72px;
      opacity: 0.85;
      pointer-events: none;
    }
    .glow-cyan-top {
      position: absolute;
      width: 700px;
      height: 500px;
      left: 100px;
      top: -100px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }
    .glow-purple-right {
      position: absolute;
      width: 700px;
      height: 600px;
      right: -50px;
      top: 50px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 70%);
      filter: blur(70px);
      pointer-events: none;
    }

    /* 上半部分展示产品实机 */
    .top-showcase {
      position: absolute;
      top: 50px;
      left: 60px;
      right: 60px;
      height: 540px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 2;
    }

    .info-box {
      max-width: 520px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .brand-logo-svg {
      width: 38px;
      height: 38px;
      filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.6));
    }

    .brand-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff 60%, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-name span.flow {
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tag-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 999px;
      color: #38bdf8;
    }

    .title-cn {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.3;
      color: #f8fafc;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .title-cn span.highlight {
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
    }

    .desc-cn {
      font-size: 17px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .pills-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 13.5px;
      color: #cbd5e1;
      backdrop-filter: blur(8px);
    }

    .pill-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-blue { background: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
    .dot-green { background: #34d399; box-shadow: 0 0 8px #34d399; }
    .dot-purple { background: #a855f7; box-shadow: 0 0 8px #a855f7; }

    /* 3D 架构透视卡片 */
    .mockup-container {
      position: relative;
      width: 520px;
      height: 380px;
      perspective: 1200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mockup-card {
      position: relative;
      width: 500px;
      height: 310px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 
        0 25px 50px -10px rgba(0, 0, 0, 0.9),
        0 0 35px rgba(56, 189, 248, 0.25);
      border: 1px solid rgba(56, 189, 248, 0.4);
      transform: rotateY(-10deg) rotateX(4deg);
      background: #0b1120;
    }

    .mockup-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
    }

    .floating-badge {
      position: absolute;
      bottom: 25px;
      left: 10px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #38bdf8;
      border-radius: 8px;
      padding: 8px 14px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.35);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 5;
    }

    .badge-indicator {
      width: 8px;
      height: 8px;
      background: #38bdf8;
      border-radius: 50%;
      box-shadow: 0 0 8px #38bdf8;
    }

    .badge-title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }
    .badge-sub {
      font-size: 11px;
      color: #94a3b8;
    }

    /* 底部柔和暗夜渐变（确保小红书头像、名字、粉丝数与简介绝对清晰） */
    .bottom-fade {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 380px;
      background: linear-gradient(to top, #060911 40%, rgba(6, 9, 17, 0.85) 75%, transparent 100%);
      z-index: 3;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="grid-pattern"></div>
  <div class="glow-cyan-top"></div>
  <div class="glow-purple-right"></div>

  <!-- 上半部焦点展示区 -->
  <div class="top-showcase">
    <div class="info-box">
      <div class="brand-row">
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
        <div class="brand-name">Focus<span class="flow">Flow</span></div>
        <div class="tag-pill">开源 1 号作品</div>
      </div>

      <div class="title-cn">
        让静态架构图变成<br/><span class="highlight">60fps 电影级运镜导览</span>
      </div>

      <div class="desc-cn">
        专为系统架构师与技术汇报打造的电影级视觉引擎。<br/>纯前端离线运行 · 智能边缘吸附 · 毫秒级音画同步。
      </div>

      <div class="pills-group">
        <div class="pill"><span class="pill-dot dot-blue"></span> 60fps 视锥推拉</div>
        <div class="pill"><span class="pill-dot dot-green"></span> 100% 纯前端零后端</div>
        <div class="pill"><span class="pill-dot dot-purple"></span> 单文件 HTML 导出</div>
      </div>
    </div>

    <!-- 右侧 3D 悬浮视锥预览 -->
    <div class="mockup-container">
      <div class="mockup-card">
        <img src="${cameraFlowBase64}" alt="FocusFlow 架构图实机预览">
      </div>
      <div class="floating-badge">
        <div class="badge-indicator"></div>
        <div>
          <div class="badge-title">微服务订单中台 · 视锥聚焦</div>
          <div class="badge-sub">60fps 贝塞尔流光与分幕气泡</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 底部渐变阴影区（留给小红书头像、名字与个人简介） -->
  <div class="bottom-fade"></div>
</body>
</html>
`;

async function main() {
  const tempHtmlPath = path.join(ROOT_DIR, 'scratch/xiaohongshu-cover-template.html');
  fs.mkdirSync(path.dirname(tempHtmlPath), { recursive: true });
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('Launching browser for Xiaohongshu Cover (1200x900)...');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2, // 2x Retina 高清导出
  });

  await page.goto('file://' + tempHtmlPath);
  await page.waitForTimeout(500);

  const outputPathDocs = path.join(DOCS_ASSETS, 'xiaohongshu-cover.png');
  const outputPathArtifacts = path.join(ARTIFACTS_DIR, 'xiaohongshu_cover.png');

  fs.mkdirSync(DOCS_ASSETS, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  await page.screenshot({ path: outputPathDocs, scale: 'css' });
  await page.screenshot({ path: outputPathArtifacts, scale: 'css' });

  console.log('Successfully generated Xiaohongshu Cover:');
  console.log('1. Docs:', outputPathDocs);
  console.log('2. Artifacts:', outputPathArtifacts);

  await browser.close();
}

main().catch(err => {
  console.error('Failed to generate Xiaohongshu cover:', err);
  process.exit(1);
});
