import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '../../..');
const PUBLIC_DIR = resolve(ROOT_DIR, 'apps/studio/public');
const DOCS_ASSETS_DIR = resolve(ROOT_DIR, 'docs/assets');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FocusFlow Studio Architecture Diagram 4K</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 3840px;
      height: 2160px;
      overflow: hidden;
      background-color: #06080f;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(249, 115, 22, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 50% 25%, rgba(6, 182, 212, 0.07) 0%, transparent 50%),
        radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.07) 0%, transparent 45%),
        linear-gradient(rgba(56, 189, 248, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.035) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      padding: 48px 64px 40px 64px;
      position: relative;
    }

    /* Ambient top highlight */
    .top-glow-line {
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #f97316, #06b6d4, #10b981, transparent);
      box-shadow: 0 0 24px rgba(6, 182, 212, 0.8);
    }

    /* Header Bar */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 36px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 28px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .logo-container {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: linear-gradient(135deg, #182033, #0a0d17);
      border: 1.5px solid rgba(249, 115, 22, 0.4);
      box-shadow: 0 8px 32px rgba(249, 115, 22, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .logo-inner {
      font-size: 38px;
      font-weight: 800;
      background: linear-gradient(135deg, #f97316, #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
    }
    .brand-titles h1 {
      font-size: 46px;
      font-weight: 800;
      letter-spacing: -0.8px;
      background: linear-gradient(180deg, #ffffff 40%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .version-tag {
      font-size: 18px;
      font-weight: 700;
      color: #f97316;
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.35);
      border-radius: 8px;
      padding: 4px 12px;
      vertical-align: middle;
      -webkit-text-fill-color: #f97316;
    }
    .brand-titles p {
      font-size: 20px;
      color: #94a3b8;
      font-weight: 400;
      letter-spacing: 0.2px;
    }
    .brand-titles p span {
      color: #38bdf8;
      font-weight: 600;
    }

    /* Badges */
    .badge-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
      max-width: 1400px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .badge.badge-amber {
      border-color: rgba(249, 115, 22, 0.4);
      color: #fed7aa;
    }
    .badge.badge-cyan {
      border-color: rgba(6, 182, 212, 0.4);
      color: #a5f3fc;
    }
    .badge.badge-emerald {
      border-color: rgba(16, 185, 129, 0.4);
      color: #a7f3d0;
    }
    .badge.badge-purple {
      border-color: rgba(168, 85, 247, 0.4);
      color: #e9d5ff;
    }
    .badge.badge-blue {
      border-color: rgba(59, 130, 246, 0.4);
      color: #bfdbfe;
    }

    /* 3 Main Columns Layout */
    .columns-container {
      display: grid;
      grid-template-columns: 1.15fr 1.35fr 1.15fr;
      gap: 36px;
      flex: 1;
      height: 1840px;
    }

    .column-box {
      background: rgba(13, 18, 32, 0.72);
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
      position: relative;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }

    .column-box::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    .col-workbench::before {
      background: linear-gradient(90deg, #f97316, #eab308);
    }
    .col-engine::before {
      background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899);
    }
    .col-runtime::before {
      background: linear-gradient(90deg, #10b981, #06b6d4);
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .column-title-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .column-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .col-workbench .column-icon {
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.35);
      color: #fb923c;
    }
    .col-engine .column-icon {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.35);
      color: #38bdf8;
    }
    .col-runtime .column-icon {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .column-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #f8fafc;
    }
    .column-tier {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
    }

    /* Subsystem Cards */
    .card {
      background: rgba(18, 25, 45, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .card:hover {
      border-color: rgba(255, 255, 255, 0.16);
      background: rgba(22, 31, 56, 0.8);
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-pill {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }
    .pill-orange {
      background: rgba(249, 115, 22, 0.15);
      color: #fdba74;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }
    .pill-cyan {
      background: rgba(6, 182, 212, 0.15);
      color: #67e8f9;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    .pill-emerald {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pill-purple {
      background: rgba(168, 85, 247, 0.15);
      color: #d8b4fe;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .card-desc {
      font-size: 15px;
      line-height: 1.5;
      color: #94a3b8;
    }

    /* Sub-items grid */
    .item-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .item-block {
      background: rgba(10, 14, 26, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .item-detail {
      font-size: 12px;
      color: #64748b;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }

    /* Algorithm Formula Box */
    .formula-box {
      background: rgba(3, 7, 18, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.25);
      border-radius: 12px;
      padding: 12px 16px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 13px;
      color: #38bdf8;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .formula-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .formula-math {
      color: #f1f5f9;
      font-weight: 600;
    }

    /* Pipeline Step Sequence */
    .step-seq {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 4px;
    }
    .step-node {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .step-arrow {
      color: #f97316;
      font-weight: 700;
      font-size: 14px;
    }

    /* Footer */
    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 16px;
      color: #64748b;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .footer-left span {
      color: #94a3b8;
    }
    .footer-right {
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="top-glow-line"></div>

  <!-- Header -->
  <header>
    <div class="header-left">
      <div class="logo-container">
        <div class="logo-inner">FF</div>
      </div>
      <div class="brand-titles">
        <h1>FocusFlow Studio — System Architecture & Workbench Topology <span class="version-tag">v1.0.0 OSS</span></h1>
        <p>Pure Client-Side 60fps Architecture Cinematics • <span>Real-Time Sobel CV Edge Snapping</span> • Zero-Dependency Offline Single-File HTML Bundler</p>
      </div>
    </div>
    <div class="badge-bar">
      <div class="badge badge-amber">⚡ React 19 + Vite 8</div>
      <div class="badge badge-cyan">📘 TypeScript 5.5 Strict</div>
      <div class="badge badge-blue">🎨 Tailwind CSS v4 Engine</div>
      <div class="badge badge-purple">🐻 Zustand Atomic State</div>
      <div class="badge badge-cyan">👁️ 3×3 Sobel CV Kernel (&lt;1ms)</div>
      <div class="badge badge-emerald">📦 Single-File HTML (&lt;5MB)</div>
      <div class="badge badge-amber">🚀 MIT / AGPL-3.0 Dual License</div>
    </div>
  </header>

  <!-- 3 Columns Architecture -->
  <div class="columns-container">

    <!-- COLUMN 1: WORKBENCH ECOSYSTEM (apps/studio) -->
    <div class="column-box col-workbench">
      <div class="column-header">
        <div class="column-title-group">
          <div class="column-icon">🎨</div>
          <div>
            <div class="column-title">Workbench Anatomy</div>
            <div style="font-size: 13px; color: #94a3b8;">apps/studio • Interactive Authoring Tier</div>
          </div>
        </div>
        <div class="column-tier">Client Tier</div>
      </div>

      <!-- Card 1.1: 4-Zone Studio Layout Engine -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">📐 4-Zone Workspace Layout Engine</div>
          <div class="card-pill pill-orange">UI Layout</div>
        </div>
        <div class="card-desc">
          Modular, responsive flexbox workstation designed for high-density 4K diagram directing, multi-layer inspection, and audio-visual synchronization.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">🗂️ Left Library Panel</div>
            <div class="item-detail">Assets, shape primitives, 4K templates (Microservices, AI RAG, Lakehouse)</div>
          </div>
          <div class="item-block">
            <div class="item-name">🖼️ Center Canvas Viewport</div>
            <div class="item-detail">Infinite pan/zoom stage, 60fps GPU frustum projection, snapping HUD</div>
          </div>
          <div class="item-block">
            <div class="item-name">🎙️ Bottom Audio Timeline</div>
            <div class="item-detail">Web Audio waveform tracks, stepped teleprompter, speech-to-dwell sync</div>
          </div>
          <div class="item-block">
            <div class="item-name">🎛️ Right Camera Director</div>
            <div class="item-detail">Camera FOV, aspect ratio (16:9 / 9:16), Sobel sensitivity, Bezier styling</div>
          </div>
        </div>
      </div>

      <!-- Card 1.2: Dual-Space Coordinate Mapping -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🌐 Dual-Space Coordinate Projection</div>
          <div class="card-pill pill-orange">Math / Kinematics</div>
        </div>
        <div class="card-desc">
          Seamlessly translates between screen-space pointer events and world-space diagram canvas coordinates with sub-pixel floating point precision.
        </div>
        <div class="formula-box">
          <div class="formula-row">
            <span>Coordinate Transform:</span>
            <span class="formula-math">P_world = (P_screen - Offset) / Scale</span>
          </div>
          <div class="formula-row">
            <span>Camera Inverse Viewport:</span>
            <span class="formula-math">Matrix_cam = Scale(s) · Translate3d(x, y, 0)</span>
          </div>
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">🖐️ Trackpad Gesture Smoothing</div>
            <div class="item-detail">Inertial panning & pinch-to-zoom curves</div>
          </div>
          <div class="item-block">
            <div class="item-name">🎯 Multi-Touch Canvas Probe</div>
            <div class="item-detail">Zero-latency pixel color & edge sampling</div>
          </div>
        </div>
      </div>

      <!-- Card 1.3: Interactive Callouts & Annotations Layer -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">💬 Interactive Glassmorphism Callouts</div>
          <div class="card-pill pill-orange">DOM / SVG Overlay</div>
        </div>
        <div class="card-desc">
          High-contrast, frosted-glass popup callouts anchored to specific diagram nodes, dynamically appearing and disappearing along keyframe steps.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">✨ Backdrop Blur & Border Glow</div>
            <div class="item-detail">Hardware-accelerated CSS filters</div>
          </div>
          <div class="item-block">
            <div class="item-name">⏱️ Keyframe Step Sequencer</div>
            <div class="item-detail">Timeline triggered entrance/exit motions</div>
          </div>
        </div>
      </div>

      <!-- Card 1.4: State Store -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🐻 Reactive Project State Machine</div>
          <div class="card-pill pill-orange">Zustand Store</div>
        </div>
        <div class="card-desc">
          Atomic Zustand store managing background assets, camera keyframes, Bezier flowlines, audio blobs, and active step indices with zero re-render overhead.
        </div>
      </div>

    </div>

    <!-- COLUMN 2: CORE ENGINE PIPELINES (packages/player & @focusflow/dsl) -->
    <div class="column-box col-engine">
      <div class="column-header">
        <div class="column-title-group">
          <div class="column-icon">⚡</div>
          <div>
            <div class="column-title">Core Engine Pipelines</div>
            <div style="font-size: 13px; color: #94a3b8;">packages/player • Computer Vision & Kinematics</div>
          </div>
        </div>
        <div class="column-tier">Engine Tier</div>
      </div>

      <!-- Card 2.1: Sobel CV Edge Snapping Kernel -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">👁️ Real-time Sobel Edge CV Snapping</div>
          <div class="card-pill pill-cyan">&lt;1ms Kernel</div>
        </div>
        <div class="card-desc">
          In-browser computer vision convolution kernel scanning pixel luminance gradients on offscreen HTML5 Canvas. Snaps bounding boxes to microservices in &lt;1ms.
        </div>
        <div class="formula-box">
          <div class="formula-row">
            <span>Sobel X Kernel (Horizontal):</span>
            <span class="formula-math">G_x = [[-1, 0, +1], [-2, 0, +2], [-1, 0, +1]]</span>
          </div>
          <div class="formula-row">
            <span>Sobel Y Kernel (Vertical):</span>
            <span class="formula-math">G_y = [[-1, -2, -1], [ 0,  0,  0], [+1, +2, +1]]</span>
          </div>
          <div class="formula-row">
            <span>Gradient Magnitude:</span>
            <span class="formula-math">|G| = √(G_x² + G_y²) &gt; Threshold (Auto-Snap)</span>
          </div>
        </div>
        <div class="step-seq">
          <div class="step-node">🖱️ Drag Cursor</div>
          <div class="step-arrow">→</div>
          <div class="step-node">📊 Pixel Sampling</div>
          <div class="step-arrow">→</div>
          <div class="step-node">⚡ 3×3 Convolution</div>
          <div class="step-arrow">→</div>
          <div class="step-node">🧲 Boundary Magnet</div>
        </div>
      </div>

      <!-- Card 2.2: 60fps GPU Kinematics Engine -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🎬 60fps GPU Kinematics Engine</div>
          <div class="card-pill pill-cyan">Zero-Lag Interpolation</div>
        </div>
        <div class="card-desc">
          Camera director powered by native CSS 3D affine matrix transformations and requestAnimationFrame loops. Flawless 60fps motion with zero frame drops on 4K/8K canvas.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">🏎️ Hardware Affine Transforms</div>
            <div class="item-detail">matrix3d, translate3d, scale, rotate</div>
          </div>
          <div class="item-block">
            <div class="item-name">📈 Cubic Bezier Easing Splines</div>
            <div class="item-detail">Kinematic acceleration & deceleration</div>
          </div>
          <div class="item-block">
            <div class="item-name">🪟 Sub-pixel Anti-Aliasing</div>
            <div class="item-detail">Zero text pixelation on extreme zooms</div>
          </div>
          <div class="item-block">
            <div class="item-name">⚡ Zero CPU Viewport Culling</div>
            <div class="item-detail">100% GPU composited layer handling</div>
          </div>
        </div>
      </div>

      <!-- Card 2.3: Dynamic Bezier Flowline Engine -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">⚡ Dynamic Bezier Flowline & Pulse Engine</div>
          <div class="card-pill pill-cyan">Neon SVG Glow</div>
        </div>
        <div class="card-desc">
          Renders real-time cubic Bezier curves with directional neon traveling pulses to illustrate RPC calls, message queues, and distributed data pipelines.
        </div>
        <div class="formula-box">
          <div class="formula-row">
            <span>Cubic Bezier Spline:</span>
            <span class="formula-math">B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃</span>
          </div>
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">📍 Relative Spatial Anchors</div>
            <div class="item-detail">Dynamic boundary port auto-routing</div>
          </div>
          <div class="item-block">
            <div class="item-name">✨ Traveling Light Pulses</div>
            <div class="item-detail">SVG strokeDashoffset pulse telemetry</div>
          </div>
        </div>
      </div>

      <!-- Card 2.4: Audio-Visual Sync Pipeline -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🎙️ Audio Waveform & Speech Sync Pipeline</div>
          <div class="card-pill pill-purple">Speech-to-Dwell</div>
        </div>
        <div class="card-desc">
          Analyzes audio buffer via Web Audio API AudioContext. Automatically derives camera dwell times from script word counts and aligns stepped playback to narration.
        </div>
      </div>

    </div>

    <!-- COLUMN 3: DECOUPLED RUNTIME & OFFLINE DISTRIBUTION -->
    <div class="column-box col-runtime">
      <div class="column-header">
        <div class="column-title-group">
          <div class="column-icon">📦</div>
          <div>
            <div class="column-title">Runtime & Distribution</div>
            <div style="font-size: 13px; color: #94a3b8;">Zero-Dependency Core & Ecosystem</div>
          </div>
        </div>
        <div class="column-tier">Runtime Tier</div>
      </div>

      <!-- Card 3.1: Decoupled Player Core -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🚀 @focusflow/player (~35KB Runtime)</div>
          <div class="card-pill pill-emerald">MIT License</div>
        </div>
        <div class="card-desc">
          Ultra-lightweight player runtime written in pure vanilla TypeScript. Zero React/Vue/Svelte dependencies. Drop it into any website, blog, or documentation via a single &lt;script&gt; tag.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">🪶 ~35KB Gzipped Bundle</div>
            <div class="item-detail">Zero external UI framework dependencies</div>
          </div>
          <div class="item-block">
            <div class="item-name">⌨️ Universal Keyboard Controls</div>
            <div class="item-detail">Space (Play/Pause), Left/Right, Home/End</div>
          </div>
          <div class="item-block">
            <div class="item-name">📱 Responsive Touch Gestures</div>
            <div class="item-detail">Mobile swipe navigation & auto-scaling</div>
          </div>
          <div class="item-block">
            <div class="item-name">🔌 Headless Embed API</div>
            <div class="item-detail">Simple player.play(), player.seekToStep()</div>
          </div>
        </div>
      </div>

      <!-- Card 3.2: 100% Offline Single-File HTML Compiler -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">📁 100% Offline Single-File HTML Compiler</div>
          <div class="card-pill pill-emerald">Privacy First</div>
        </div>
        <div class="card-desc">
          One-click bundler compiles 4K background bitmaps, audio tracks, keyframe motion scripts, and player runtime into a single standalone .html file (&lt;5MB).
        </div>
        <div class="step-seq">
          <div class="step-node">🖼️ 4K Base64 Inliner</div>
          <div class="step-arrow">→</div>
          <div class="step-node">📄 DSL JSON Bundle</div>
          <div class="step-arrow">→</div>
          <div class="step-node">⚡ Vanilla Player Script</div>
          <div class="step-arrow">→</div>
          <div class="step-node">💾 Single .html (&lt;5MB)</div>
        </div>
        <div style="font-size: 13px; color: #34d399; font-weight: 600; margin-top: 4px;">
          ✔ AirDrop to thumb drive • Double-click in any browser • Complete offline security
        </div>
      </div>

      <!-- Card 3.3: Client-Side Canvas MediaRecorder Engine -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">🎥 Client-Side MediaStream Recorder</div>
          <div class="card-pill pill-emerald">In-Browser 60fps</div>
        </div>
        <div class="card-desc">
          Zero-backend browser recording pipeline combining HTML5 Canvas captureStream and Web Audio API destination for instant 60fps MP4 / WebM export.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">⚡ Canvas captureStream(60)</div>
            <div class="item-detail">Direct GPU frame pipe with zero IPC latency</div>
          </div>
          <div class="item-block">
            <div class="item-name">🎙️ Real-time Audio Multiplexer</div>
            <div class="item-detail">Hardware MediaStreamDestination mixdown</div>
          </div>
          <div class="item-block">
            <div class="item-name">🎞️ Native H.264 / AVC & VP9</div>
            <div class="item-detail">Hardware-accelerated client MediaRecorder</div>
          </div>
          <div class="item-block">
            <div class="item-name">🛡️ 100% Private Local Export</div>
            <div class="item-detail">Direct file download without cloud ingestion</div>
          </div>
        </div>
      </div>

      <!-- Card 3.4: Project DSL Contract & Serialization Engine -->
      <div class="card">
        <div class="card-title-row">
          <div class="card-title">📜 @focusflow/dsl (Type-Safe Contract)</div>
          <div class="card-pill pill-emerald">DSL & Schema</div>
        </div>
        <div class="card-desc">
          Strict, versioned JSON Schema specification governing all camera keyframes, Bezier spatial coordinates, audio timestamps, and client-side playback lifecycles.
        </div>
        <div class="item-grid">
          <div class="item-block">
            <div class="item-name">📐 Zod & TS AST Validation</div>
            <div class="item-detail">Runtime schema assertion & validation</div>
          </div>
          <div class="item-block">
            <div class="item-name">🔄 Backward-Compatible Migration</div>
            <div class="item-detail">Deterministic project JSON v1.0 versioning</div>
          </div>
          <div class="item-block">
            <div class="item-name">💾 Lossless State Persistence</div>
            <div class="item-detail">IndexedDB autosave & snapshot restoration</div>
          </div>
          <div class="item-block">
            <div class="item-name">⚙️ Deterministic Keyframe Protocol</div>
            <div class="item-detail">Frame-accurate stepped timeline & kinematics bridge</div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- Footer -->
  <footer>
    <div class="footer-left">
      <span>🛡️ <strong>100% Client-Side Architecture</strong>: Enterprise Zero-Telemetry Privacy (Zero Backend Diagram Uploads)</span>
      <span>•</span>
      <span>📜 <strong>Dual-License Model</strong>: MIT (@focusflow/player) & AGPL-3.0 (apps/studio)</span>
      <span>•</span>
      <span>⚡ <strong>Designed for High-Density Technical Reviews & Conference Presentations</strong></span>
    </div>
    <div class="footer-right">
      <span>FocusFlow OSS Project</span>
      <span>•</span>
      <span>Tumio Soft Technology Co., Ltd.</span>
      <span>•</span>
      <span style="color: #38bdf8;">https://focusflow.tumio.site/</span>
    </div>
  </footer>
</body>
</html>
`;

async function main() {
  console.log('🎨 Generating 4K FocusFlow Studio Architecture Diagram (3840x2160)...');

  // Save HTML template
  const tempHtmlPath = resolve(__dirname, 'focusflow_arch_4k.html');
  writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  // Launch Playwright at 3840x2160 resolution
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=none',
      '--force-color-profile=srgb',
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 1
  });

  const fileUrl = 'file://' + tempHtmlPath;
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Ensure directories exist
  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!existsSync(DOCS_ASSETS_DIR)) mkdirSync(DOCS_ASSETS_DIR, { recursive: true });

  const targetPublic = resolve(PUBLIC_DIR, 'focusflow_architecture_dark.png');
  const targetDocs = resolve(DOCS_ASSETS_DIR, 'focusflow_architecture_dark.png');

  console.log('📸 Capturing 4K PNG screenshot...');
  await page.screenshot({
    path: targetPublic,
    type: 'png'
  });

  await page.screenshot({
    path: targetDocs,
    type: 'png'
  });

  await browser.close();

  console.log('✔ Generated 4K Architecture Diagram:');
  console.log('   1. ' + targetPublic);
  console.log('   2. ' + targetDocs);
}

main().catch(err => {
  console.error('Failed to generate diagram:', err);
  process.exit(1);
});
