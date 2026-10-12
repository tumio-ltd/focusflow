#!/usr/bin/env node

/**
 * FocusFlow Automated Headless Video Rendering Pipeline
 * Mode A-2 Dual-Track Headless Architecture & Agent CLI Pipeline
 *
 * Usage: node scripts/render-video.mjs <input> -o <output> [options]
 * Example: node scripts/render-video.mjs examples/overlay-demo -o dist/demo.mp4 --resolution 1080p --fps 60
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync, execSync } from 'child_process';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

// Exit codes
const EXIT_SUCCESS = 0;
const ERR_INVALID_DSL = 1;
const ERR_ASSET_LOAD_FAILED = 2;
const ERR_BROWSER_CRASH = 3;
const ERR_FFMPEG_ENCODE = 4;
const ERR_RENDER_TIMEOUT = 5;

// Load Playwright Chromium
let chromium;
try {
  const pw = await import('../apps/studio/node_modules/@playwright/test/index.mjs');
  chromium = pw.chromium;
} catch {
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (err) {
    emitJsonOrLog({
      type: 'error',
      code: 'ERR_BROWSER_CRASH',
      message: 'Playwright not found in apps/studio or root.',
      suggestion: 'Run pnpm install in root or apps/studio.',
    });
    process.exit(ERR_BROWSER_CRASH);
  }
}

function detectOptimalWorkers() {
  if (process.env.RENDER_WORKERS) {
    const v = parseInt(process.env.RENDER_WORKERS, 10);
    if (!isNaN(v) && v > 0) return v;
  }
  const count = os.cpus()?.length || 4;
  return Math.max(1, Math.min(8, Math.floor(count / 2)));
}

// Parse Command Line Arguments
const rawArgs = process.argv.slice(2);
const options = parseCliArgs(rawArgs);

function parseCliArgs(args) {
  const result = {
    input: '',
    output: path.resolve(projectRoot, 'dist/output.mp4'),
    resolution: '1080p',
    fps: 60,
    mode: 'stepper', // 'stepper' | 'screencast'
    audio: '',
    hwaccel: 'auto', // 'auto' | 'videotoolbox' | 'nvenc' | 'vaapi' | 'cpu'
    workers: detectOptimalWorkers(),
    format: 'jpeg', // 'jpeg' | 'png'
    quality: 98, // 1-100 (for jpeg)
    startFrame: undefined,
    endFrame: undefined,
    json: false,
    timeout: 120,
    debug: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      result.output = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '-r' || arg === '--resolution') {
      result.resolution = args[++i]?.toLowerCase() || '1080p';
    } else if (arg === '-f' || arg === '--fps') {
      result.fps = parseInt(args[++i], 10) || 60;
    } else if (arg === '-m' || arg === '--mode') {
      result.mode = args[++i]?.toLowerCase() || 'stepper';
    } else if (arg === '-a' || arg === '--audio') {
      result.audio = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--hwaccel') {
      result.hwaccel = args[++i]?.toLowerCase() || 'auto';
    } else if (arg === '-w' || arg === '--workers') {
      result.workers = Math.max(1, parseInt(args[++i], 10) || 1);
    } else if (arg === '--format') {
      result.format = args[++i]?.toLowerCase() === 'png' ? 'png' : 'jpeg';
    } else if (arg === '-q' || arg === '--quality') {
      result.quality = Math.max(1, Math.min(100, parseInt(args[++i], 10) || 98));
    } else if (arg === '--start-frame') {
      result.startFrame = parseInt(args[++i], 10);
    } else if (arg === '--end-frame') {
      result.endFrame = parseInt(args[++i], 10);
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--timeout') {
      result.timeout = parseInt(args[++i], 10) || 120;
    } else if (arg === '--callout-scale') {
      result.calloutScale = parseFloat(args[++i]);
    } else if (arg === '--controls-scale') {
      result.controlsScale = parseFloat(args[++i]);
    } else if (arg === '--debug') {
      result.debug = true;
    } else if (!arg.startsWith('-') && !result.input) {
      result.input = path.resolve(process.cwd(), arg);
    }
    i++;
  }

  return result;
}

function emitJsonOrLog(obj) {
  if (options.json) {
    console.log(JSON.stringify(obj));
  } else {
    if (obj.type === 'error') {
      console.error(`\x1b[31m[ERROR] (${obj.code}) ${obj.message}\x1b[0m`);
      if (obj.suggestion) {
        console.error(`\x1b[33m💡 Suggestion: ${obj.suggestion}\x1b[0m`);
      }
    } else if (obj.type === 'progress') {
      const stage = obj.stage === 'rendering' ? 'Rendering frame' : (obj.stage === 'concatenating' ? 'Concatenating' : 'Muxing');
      process.stdout.write(`\r⏳ ${stage} ${obj.currentFrame}/${obj.totalFrames} (${obj.percent}%)`);
    } else if (obj.type === 'complete') {
      const timeStr = formatDuration(obj.elapsedSeconds);
      console.log(`\n\x1b[32m✔ Video render complete in ${timeStr}: ${obj.outputPath} (${(obj.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB, ${obj.avgFps} fps)\x1b[0m`);
    } else if (obj.type === 'init') {
      console.log(`🎬 FocusFlow Headless Renderer [${obj.mode.toUpperCase()}]`);
      console.log(`   Resolution: ${obj.resolution.width}x${obj.resolution.height} @ ${obj.fps}fps`);
      console.log(`   Encoder: ${obj.hwaccel}`);
      console.log(`   Workers: ${obj.workers}`);
      console.log(`   Capture Format: ${obj.format.toUpperCase()}${obj.format === 'jpeg' ? ` (q=${obj.quality})` : ''}`);
      if (obj.calloutScale) {
        console.log(`   Callout Scale: ${obj.calloutScale}x`);
      }
      if (obj.controlsScale) {
        console.log(`   Controls Scale: ${obj.controlsScale}x`);
      }
      if (obj.hasAudio) {
        console.log(`   Audio Track: Enabled (${obj.audioSource})`);
      }
    }
  }
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0s';
  const s = Math.round(sec);
  const minutes = Math.floor(s / 60);
  const remainingSec = s % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSec}s (${sec.toFixed(1)}s)`;
  }
  return `${sec.toFixed(1)}s`;
}

// 1. Validate Input
if (!options.input) {
  emitJsonOrLog({
    type: 'error',
    code: 'ERR_INVALID_DSL',
    message: 'Missing input path. Provide a path to a directory, config.json, or .html file.',
    suggestion: 'Usage: node scripts/render-video.mjs <input> -o <output.mp4>',
  });
  process.exit(ERR_INVALID_DSL);
}

// Map Resolution
const RESOLUTION_MAP = {
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
};
const resConfig = RESOLUTION_MAP[options.resolution] || RESOLUTION_MAP['1080p'];

// Compute Resolution-Aware Callout Scaling Factor (Scheme D Specification)
// S_callout = (W_current / 1920) * K_boost (K_boost = 1.35)
const defaultCalloutScale = Number(((resConfig.width / 1920) * 1.35).toFixed(3));
const calloutScaleFactor = typeof options.calloutScale === 'number' && !isNaN(options.calloutScale) && options.calloutScale > 0
  ? options.calloutScale
  : defaultCalloutScale;

// Compute Playback Island / Controls Resolution Scaling Factor (Section 6.5 Specification)
// S_island = W_current / 1920 (1080p: 1.0, 2K: 1.333, 4K: 2.0)
const defaultControlsScale = Number((resConfig.width / 1920).toFixed(3));
const controlsScaleFactor = typeof options.controlsScale === 'number' && !isNaN(options.controlsScale) && options.controlsScale > 0
  ? options.controlsScale
  : defaultControlsScale;

// Detect Hardware Acceleration
const detectedEncoder = detectEncoder(options.hwaccel);

function detectEncoder(pref) {
  if (pref !== 'auto') {
    if (pref === 'videotoolbox') return { codec: 'h264_videotoolbox', extraArgs: ['-b:v', '14M', '-pix_fmt', 'yuv420p'] };
    if (pref === 'nvenc') return { codec: 'h264_nvenc', extraArgs: ['-preset', 'p7', '-cq', '19', '-b:v', '14M', '-pix_fmt', 'yuv420p'] };
    if (pref === 'vaapi') return { codec: 'h264_vaapi', extraArgs: ['-vaapi_device', '/dev/dri/renderD128', '-vf', 'format=nv12,hwupload'] };
    return { codec: 'libx264', extraArgs: ['-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p'] };
  }

  // Auto-detect
  if (process.platform === 'darwin') {
    return { codec: 'h264_videotoolbox', extraArgs: ['-b:v', '14M', '-pix_fmt', 'yuv420p'] };
  }

  try {
    execSync('nvidia-smi', { stdio: 'ignore' });
    return { codec: 'h264_nvenc', extraArgs: ['-preset', 'p7', '-cq', '19', '-b:v', '14M', '-pix_fmt', 'yuv420p'] };
  } catch {}

  if (fs.existsSync('/dev/dri/renderD128')) {
    return { codec: 'h264_vaapi', extraArgs: ['-vaapi_device', '/dev/dri/renderD128', '-vf', 'format=nv12,hwupload'] };
  }

  return { codec: 'libx264', extraArgs: ['-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p'] };
}

// 2. Prepare HTML & Assets
const tempFilesToClean = new Set();

function getTempDir() {
  const distDir = path.resolve(projectRoot, 'dist');
  try {
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.accessSync(distDir, fs.constants.W_OK);
    return distDir;
  } catch {
    return process.env.TMPDIR || os.tmpdir();
  }
}

let htmlFilePath = '';
let tempHtmlCreated = false;
let tempAudioPath = '';
let dslObj = null;

try {
  let stats = fs.statSync(options.input);
  if (stats.isDirectory()) {
    const configPath = path.join(options.input, 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`config.json not found in directory: ${options.input}`);
    }
    htmlFilePath = createTempStandaloneHtml(options.input, configPath);
    tempHtmlCreated = true;
  } else if (options.input.endsWith('.html')) {
    htmlFilePath = options.input;
    // Auto-detect and extract embedded audio from standalone HTML for FFmpeg muxing
    if (!options.audio) {
      try {
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        const match = htmlContent.match(/data:audio\/([a-zA-Z0-9]+);base64,([A-Za-z0-9+/=]+)/);
        if (match) {
          const ext = match[1] || 'wav';
          const audioBuffer = Buffer.from(match[2], 'base64');
          const tempDir = getTempDir();
          tempAudioPath = path.join(tempDir, `.temp-audio-${Date.now()}.${ext}`);
          fs.writeFileSync(tempAudioPath, audioBuffer);
          tempFilesToClean.add(tempAudioPath);
          options.audio = tempAudioPath;
        }
      } catch (err) {
        if (options.debug) {
          console.warn('[DEBUG] Failed to extract audio from HTML:', err);
        }
      }
    }
  } else if (options.input.endsWith('.json')) {
    const baseDir = path.dirname(options.input);
    htmlFilePath = createTempStandaloneHtml(baseDir, options.input);
    tempHtmlCreated = true;
  } else {
    throw new Error(`Unsupported input format: ${options.input}`);
  }
} catch (err) {
  emitJsonOrLog({
    type: 'error',
    code: 'ERR_INVALID_DSL',
    message: err.message,
    suggestion: 'Provide a valid config.json, project folder, or standalone HTML file.',
  });
  process.exit(ERR_INVALID_DSL);
}

function createTempStandaloneHtml(baseDir, configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  dslObj = JSON.parse(content);

  // Inlining assets
  if (dslObj.asset?.url && !dslObj.asset.url.startsWith('data:') && !dslObj.asset.url.startsWith('http')) {
    const cleanImgPath = dslObj.asset.url.startsWith('./') ? dslObj.asset.url.slice(2) : dslObj.asset.url;
    const absImgPath = path.isAbsolute(cleanImgPath) ? cleanImgPath : path.resolve(baseDir, cleanImgPath);
    if (!fs.existsSync(absImgPath)) {
      emitJsonOrLog({
        type: 'error',
        code: 'ERR_ASSET_NOT_FOUND',
        message: `Underlying architecture image failed to load: ${absImgPath}`,
        suggestion: 'Verify file path relative to config.json or provide a public HTTPS asset URL.',
      });
      process.exit(ERR_ASSET_LOAD_FAILED);
    }
    const ext = path.extname(absImgPath).slice(1) || 'png';
    const b64 = fs.readFileSync(absImgPath).toString('base64');
    dslObj.asset.url = `data:image/${ext};base64,${b64}`;
  }

  // Inlining overlay images
  if (dslObj.elements?.images) {
    dslObj.elements.images.forEach((img) => {
      if (img.url && !img.url.startsWith('data:') && !img.url.startsWith('http')) {
        const cleanImgPath = img.url.startsWith('./') ? img.url.slice(2) : img.url;
        const absImgPath = path.isAbsolute(cleanImgPath) ? cleanImgPath : path.resolve(baseDir, cleanImgPath);
        if (fs.existsSync(absImgPath)) {
          const ext = path.extname(absImgPath).slice(1) || 'png';
          const b64 = fs.readFileSync(absImgPath).toString('base64');
          img.url = `data:image/${ext};base64,${b64}`;
        }
      }
    });
  }

  // Inlining DSL audio tracks if referenced as relative/absolute file, or extracting base64 audio for FFmpeg
  const audioTracks = dslObj.audio?.tracks || (dslObj.audio?.track ? [dslObj.audio.track] : []);
  if (audioTracks.length > 0) {
    for (const track of audioTracks) {
      if (track.url) {
        if (!track.url.startsWith('data:') && !track.url.startsWith('http')) {
          const cleanAudioPath = track.url.startsWith('./') ? track.url.slice(2) : track.url;
          const absAudioPath = path.isAbsolute(cleanAudioPath) ? cleanAudioPath : path.resolve(baseDir, cleanAudioPath);
          if (fs.existsSync(absAudioPath)) {
            const ext = path.extname(absAudioPath).slice(1) || 'mp3';
            const b64 = fs.readFileSync(absAudioPath).toString('base64');
            track.url = `data:audio/${ext};base64,${b64}`;
            if (!options.audio) {
              options.audio = absAudioPath;
            }
          }
        } else if (track.url.startsWith('data:audio/') && !options.audio) {
          // Extract base64 audio to temp file for FFmpeg muxing
          const match = track.url.match(/^data:audio\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (match) {
            const ext = match[1] || 'wav';
            const audioBuffer = Buffer.from(match[2], 'base64');
            const tempDir = getTempDir();
            tempAudioPath = path.join(tempDir, `.temp-audio-${Date.now()}.${ext}`);
            fs.writeFileSync(tempAudioPath, audioBuffer);
            tempFilesToClean.add(tempAudioPath);
            options.audio = tempAudioPath;
          }
        }
      }
    }
  }

  // Audio track inlining if external file passed via CLI
  if (options.audio && fs.existsSync(options.audio)) {
    const ext = path.extname(options.audio).slice(1) || 'mp3';
    const b64 = fs.readFileSync(options.audio).toString('base64');
    dslObj.audio = {
      tracks: [
        {
          id: 'track-cli-audio',
          url: `data:audio/${ext};base64,${b64}`,
          durationMs: 0,
        },
      ],
    };
  }

  const playerCss = fs.readFileSync(path.join(projectRoot, 'packages/player/src/styles/focusflow.css'), 'utf-8');
  const playerJs = fs.readFileSync(path.join(projectRoot, 'packages/player/dist/focusflow.iife.js'), 'utf-8');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body {
      margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #000;
    }
    #focusflow-root { width: 100vw; height: 100vh; position: relative; }
    ${playerCss}

    /* FocusFlow Official Watermark Badge for Video Render */
    .ff-watermark-badge {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 50;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px 4px 5px;
      border-radius: 9999px;
      background: rgba(10, 14, 23, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.25);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      text-decoration: none;
      user-select: none;
    }
    .ff-watermark-logo-box {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ff-watermark-icon { width: 14px; height: 14px; display: block; }
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
      color: rgba(148, 163, 184, 0.9);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .ff-watermark-brand {
      font-size: 11px;
      font-weight: 700;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="focusflow-root"></div>

  <!-- FocusFlow Official Watermark Badge -->
  <div class="ff-watermark-badge">
    <div class="ff-watermark-logo-box">
      <svg viewBox="0 0 128 128" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" class="ff-watermark-icon">
        <defs>
          <linearGradient id="ffRenderWatermarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="50%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
          <filter id="ffRenderWatermarkGlow" x="-20%" y="-20%" width="140%" height="140%">
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
        <path d="M 28 96 C 52 96, 56 32, 100 32" stroke="url(#ffRenderWatermarkGrad)" stroke-width="11" stroke-linecap="round" filter="url(#ffRenderWatermarkGlow)" />
        <circle cx="100" cy="32" r="7" fill="#ffffff" filter="url(#ffRenderWatermarkGlow)" />
      </svg>
    </div>
    <span class="ff-watermark-label">
      <span class="ff-watermark-prefix">Powered by</span>
      <span class="ff-watermark-brand">FocusFlow</span>
    </span>
  </div>

  <script>${playerJs}</script>
  <script>
    window.FocusFlowDSL = ${JSON.stringify(dslObj)};
    window.FocusFlowInstance = new window.FocusFlow.FocusFlowPlayer({
      container: document.getElementById('focusflow-root'),
      dsl: window.FocusFlowDSL,
      autoplay: false,
      showControls: false,
      debug: false
    });
  </script>
</body>
</html>`;

  const tempDir = getTempDir();
  const tempPath = path.join(tempDir, `.temp-render-${Date.now()}.html`);
  fs.writeFileSync(tempPath, html, 'utf-8');
  tempFilesToClean.add(tempPath);
  return tempPath;
}

// 3. Main Render Execution
async function run() {
  emitJsonOrLog({
    type: 'init',
    resolution: resConfig,
    fps: options.fps,
    mode: options.mode,
    hwaccel: detectedEncoder.codec,
    workers: options.workers,
    format: options.format,
    quality: options.quality,
    calloutScale: calloutScaleFactor,
    controlsScale: controlsScaleFactor,
    hasAudio: Boolean(options.audio && fs.existsSync(options.audio)),
    audioSource: options.audio ? (tempAudioPath === options.audio ? 'Extracted from DSL/HTML' : path.basename(options.audio)) : 'None',
  });

  const outDir = path.dirname(options.output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const startTime = performance.now();
  const fileUrl = htmlFilePath.startsWith('http') ? htmlFilePath : `file://${path.resolve(htmlFilePath)}`;

  // Launch Chromium
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu-vsync',
      '--hide-scrollbars',
    ],
  });

  // Probe Page: used to probe duration and reused by Worker 0
  const probeContext = await browser.newContext({
    viewport: { width: resConfig.width, height: resConfig.height },
    deviceScaleFactor: 1,
  });

  const probePage = await probeContext.newPage();
  const virtualClockSource = fs.readFileSync(path.join(__dirname, 'virtualClock.js'), 'utf-8');
  await probePage.addInitScript({ content: virtualClockSource });
  await probePage.goto(fileUrl, { waitUntil: 'load' });

  // Watchdog 1: Wait for __FOCUSFLOW_READY__ (up to 15s)
  try {
    await probePage.waitForFunction(() => window.__FOCUSFLOW_READY__ === true, { timeout: 15000 });
  } catch (e) {
    await browser.close();
    cleanupTemp();
    emitJsonOrLog({
      type: 'error',
      code: 'ERR_BROWSER_CRASH',
      message: 'FocusFlow player engine initialization timed out (15s).',
      suggestion: 'Check if base image or fonts failed to load.',
    });
    process.exit(ERR_BROWSER_CRASH);
  }

  await preparePageForRender(probePage, calloutScaleFactor, controlsScaleFactor);

  const totalDurationMs = await probePage.evaluate(() => {
    return window.FocusFlowInstance?.getTotalDuration?.() || 5000;
  });

  const fps = options.fps;
  const totalFrames = Math.ceil((totalDurationMs / 1000) * fps);
  const tailFrames = Math.ceil(0.6 * fps);
  const grandTotalFrames = totalFrames + tailFrames;

  const hasAudioFile = Boolean(options.audio && fs.existsSync(options.audio));
  const tempDir = getTempDir();

  // Watchdog 2: Max timeout limit
  const adaptiveTimeoutSec = Math.max(options.timeout, Math.ceil((totalDurationMs / 1000) * 3 + 30));
  const maxTimeoutMs = adaptiveTimeoutSec * 1000;
  const isAbortedRef = { aborted: false };
  const timeoutTimer = setTimeout(() => {
    isAbortedRef.aborted = true;
    try { browser.close(); } catch {}
    cleanupTemp();
    emitJsonOrLog({
      type: 'error',
      code: 'ERR_RENDER_TIMEOUT',
      message: `Rendering exceeded timeout limit of ${adaptiveTimeoutSec}s.`,
      suggestion: 'Increase --timeout value or optimize scene counts.',
    });
    process.exit(ERR_RENDER_TIMEOUT);
  }, maxTimeoutMs);

  // Partition slices
  let slices = [];
  let isSingleSliceMode = false;
  let pass1FinalVideoPath = '';

  if (options.startFrame !== undefined && options.endFrame !== undefined) {
    // Explicit frame slice mode (e.g. Serverless Worker invoked for a specific slice)
    isSingleSliceMode = true;
    slices = [{
      workerId: 0,
      startFrame: Math.max(0, options.startFrame),
      endFrame: Math.min(grandTotalFrames, options.endFrame),
      output: options.output,
    }];
  } else if (options.workers <= 1 || grandTotalFrames <= 10) {
    // Single worker mode
    isSingleSliceMode = true;
    pass1FinalVideoPath = hasAudioFile
      ? path.join(tempDir, `.temp-video-${Date.now()}.mp4`)
      : options.output;
    if (hasAudioFile) tempFilesToClean.add(pass1FinalVideoPath);
    slices = [{
      workerId: 0,
      startFrame: 0,
      endFrame: grandTotalFrames,
      output: pass1FinalVideoPath,
    }];
  } else {
    // Multi-worker chunking
    const K = Math.min(options.workers, grandTotalFrames);
    pass1FinalVideoPath = hasAudioFile
      ? path.join(tempDir, `.temp-video-${Date.now()}.mp4`)
      : options.output;
    if (hasAudioFile) tempFilesToClean.add(pass1FinalVideoPath);

    for (let i = 0; i < K; i++) {
      const sf = Math.floor(i * (grandTotalFrames / K));
      const ef = (i === K - 1) ? grandTotalFrames : Math.floor((i + 1) * (grandTotalFrames / K));
      const chunkPath = path.join(tempDir, `.temp-chunk-${Date.now()}-${i}.mp4`);
      tempFilesToClean.add(chunkPath);
      slices.push({
        workerId: i,
        startFrame: sf,
        endFrame: ef,
        output: chunkPath,
      });
    }
  }

  let totalRenderedFrames = 0;
  function handleProgress() {
    totalRenderedFrames++;
    const percent = Math.min(100, Math.round((totalRenderedFrames / grandTotalFrames) * 100));
    emitJsonOrLog({
      type: 'progress',
      currentFrame: totalRenderedFrames,
      totalFrames: grandTotalFrames,
      percent,
      stage: 'rendering',
    });
  }

  // Execute slice rendering in parallel
  const slicePromises = slices.map((slice) => {
    const isWorker0 = slice.workerId === 0;
    return renderSlice({
      workerId: slice.workerId,
      browser,
      fileUrl,
      resConfig,
      calloutScaleFactor,
      controlsScaleFactor,
      startFrame: slice.startFrame,
      endFrame: slice.endFrame,
      fps,
      totalDurationMs,
      outputVideoPath: slice.output,
      detectedEncoder,
      options,
      onProgress: handleProgress,
      isAbortedRef,
      existingPage: isWorker0 ? probePage : null,
      existingContext: isWorker0 ? probeContext : null,
    });
  });

  try {
    await Promise.all(slicePromises);
  } catch (err) {
    isAbortedRef.aborted = true;
    clearTimeout(timeoutTimer);
    await browser.close().catch(() => {});
    cleanupTemp();
    throw err;
  }

  clearTimeout(timeoutTimer);

  // If multi-slice, concatenate using FFmpeg concat protocol
  if (slices.length > 1) {
    emitJsonOrLog({
      type: 'progress',
      currentFrame: grandTotalFrames,
      totalFrames: grandTotalFrames,
      percent: 100,
      stage: 'concatenating',
    });

    const concatListPath = path.join(tempDir, `.temp-concat-${Date.now()}.txt`);
    tempFilesToClean.add(concatListPath);
    const concatContent = slices.map((s) => `file '${s.output.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent, 'utf-8');

    const concatArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      pass1FinalVideoPath,
    ];

    if (options.debug) {
      console.log('[DEBUG] Concat command:', 'ffmpeg', concatArgs.join(' '));
    }

    const concatResult = spawnSync('ffmpeg', concatArgs, {
      encoding: 'utf-8',
      stdio: ['ignore', options.debug ? 'inherit' : 'pipe', options.debug ? 'inherit' : 'pipe'],
    });

    if (concatResult.status !== 0) {
      throw new Error(`FFmpeg chunk concat failed (exit ${concatResult.status}): ${concatResult.stderr || ''}`);
    }
  }

  // Pass 2: Fast muxing via stream copy for video, AAC for audio
  if (hasAudioFile && !isSingleSliceMode) {
    emitJsonOrLog({
      type: 'progress',
      currentFrame: grandTotalFrames,
      totalFrames: grandTotalFrames,
      percent: 100,
      stage: 'muxing',
    });

    const muxArgs = [
      '-y',
      '-i', pass1FinalVideoPath,
      '-i', options.audio,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-shortest',
      '-movflags', '+faststart',
      options.output,
    ];

    if (options.debug) {
      console.log('[DEBUG] Pass 2 Mux command:', 'ffmpeg', muxArgs.join(' '));
    }

    const muxResult = spawnSync('ffmpeg', muxArgs, {
      encoding: 'utf-8',
      stdio: ['ignore', options.debug ? 'inherit' : 'pipe', options.debug ? 'inherit' : 'pipe'],
    });

    if (muxResult.status !== 0) {
      throw new Error(`FFmpeg audio muxing failed (exit ${muxResult.status}): ${muxResult.stderr || muxResult.error?.message || ''}`);
    }
  }

  await browser.close().catch(() => {});
  cleanupTemp();

  const totalTimeSeconds = (performance.now() - startTime) / 1000;
  const avgFps = parseFloat((grandTotalFrames / totalTimeSeconds).toFixed(1));
  const stats = fs.statSync(options.output);

  emitJsonOrLog({
    type: 'complete',
    outputPath: options.output,
    totalDurationMs,
    totalFrames: grandTotalFrames,
    fileSizeBytes: stats.size,
    elapsedSeconds: totalTimeSeconds,
    avgFps,
  });

  process.exit(EXIT_SUCCESS);
}

async function preparePageForRender(page, calloutScale, controlsScale) {
  // Scheme D & Section 6.5: Inject Resolution-Aware Compensation & Deterministic Pulse Patch
  await page.addStyleTag({
    content: `
      :root {
        --ff-callout-res-scale: ${calloutScale.toFixed(3)};
        --ff-island-res-scale: ${controlsScale.toFixed(3)};
      }
      .ff-callout {
        transform: translateY(12px) scale(calc(var(--ff-callout-res-scale, 1) * 0.96 / var(--ff-camera-zoom, 1))) !important;
      }
      .ff-callout.active {
        transform: translateY(0) scale(calc(var(--ff-callout-res-scale, 1) / var(--ff-camera-zoom, 1))) !important;
      }
      .ff-island-full {
        transform-origin: bottom center !important;
        transform: translateX(-50%) scale(var(--ff-island-res-scale, 1)) !important;
        bottom: calc(24px * var(--ff-island-res-scale, 1)) !important;
      }
      /* Disable asynchronous CSS keyframes so virtual clock stepper drives deterministic pulse */
      .ff-island-dot,
      .ff-dot.active {
        animation: none !important;
      }
    `,
  });

  // Initialize deterministic frame stepper with continuous cubic-bezier camera interpolation
  await page.evaluate(() => {
    function createCubicBezierSolver(x1, y1, x2, y2) {
      const cx = 3.0 * x1;
      const bx = 3.0 * (x2 - x1) - cx;
      const ax = 1.0 - cx - bx;
      const cy = 3.0 * y1;
      const by = 3.0 * (y2 - y1) - cy;
      const ay = 1.0 - cy - by;

      function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }
      function sampleY(t) { return ((ay * t + by) * t + cy) * t; }
      function sampleDerivativeX(t) { return (3.0 * ax * t + 2.0 * bx) * t + cx; }

      return function solve(x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 8; i++) {
          const xEst = sampleX(t) - x;
          if (Math.abs(xEst) < 1e-6) return sampleY(t);
          const dX = sampleDerivativeX(t);
          if (Math.abs(dX) < 1e-6) break;
          t -= xEst / dX;
        }
        let t0 = 0.0, t1 = 1.0;
        t = x;
        while (t0 < t1) {
          const xEst = sampleX(t);
          if (Math.abs(xEst - x) < 1e-6) return sampleY(t);
          if (x > xEst) t0 = t;
          else t1 = t;
          t = (t1 + t0) * 0.5;
        }
        return sampleY(t);
      };
    }

    const ease = createCubicBezierSolver(0.4, 0.0, 0.2, 1.0);

    function clampCamera(zoom, x, y) {
      if (zoom <= 1.0) return { x: 0, y: 0 };
      const maxOffset = ((zoom - 1.0) / (2.0 * zoom)) * 100;
      const safeLimit = maxOffset * 1.15;
      const clampedX = Math.max(-safeLimit, Math.min(safeLimit, x));
      const clampedY = Math.max(-safeLimit, Math.min(safeLimit, y));
      return {
        x: Math.round(clampedX * 10) / 10,
        y: Math.round(clampedY * 10) / 10,
      };
    }

    const player = window.FocusFlowInstance;
    const scenes = player?.dsl?.scenes || [];
    let accum = 0;
    const timeline = scenes.map((s, idx) => {
      const dur = typeof s.duration === 'number' && s.duration > 0 ? s.duration : 3800;
      const startTime = accum;
      accum += dur;
      const rawCam = s.camera || { zoom: 1.0, x: 0, y: 0 };
      const zoom = Math.max(1.0, Math.min(3.5, rawCam.zoom || 1.0));
      const clamped = clampCamera(zoom, rawCam.x || 0, rawCam.y || 0);
      const transDuration = (rawCam.duration !== undefined ? rawCam.duration : 1.2) * 1000;
      return {
        index: idx,
        startTime,
        duration: dur,
        endTime: accum,
        targetCamera: { zoom, x: clamped.x, y: clamped.y },
        transDuration,
      };
    });

    const wrapEl = document.getElementById('_ff_wrap') || player?.wrapEl;

    window.__ffRenderStepper = {
      timeline,
      totalDuration: accum,
      lastSceneIdx: -1,
      wrapEl,
      ease,
      clampCamera,
    };

    window.__stepFocusFlowFrame = function (targetTimeMs, deltaMs) {
      const st = window.__ffRenderStepper;
      const timeline = st.timeline;
      if (!timeline || timeline.length === 0) return;

      // 1. Locate current scene
      let curSceneIdx = 0;
      for (let i = 0; i < timeline.length; i++) {
        if (targetTimeMs >= timeline[i].startTime) {
          curSceneIdx = i;
        } else {
          break;
        }
      }

      const curScene = timeline[curSceneIdx];

      // 2. Dispatch scene change only when crossing scene boundaries
      if (curSceneIdx !== st.lastSceneIdx) {
        if (window.FocusFlowInstance?.goToStep) {
          window.FocusFlowInstance.goToStep(curSceneIdx, false);
        } else if (window.FocusFlowInstance?.goTo) {
          window.FocusFlowInstance.goTo(curSceneIdx, false);
        }
        st.lastSceneIdx = curSceneIdx;
      }

      // 3. Compute continuous camera transformation
      let curZoom = curScene.targetCamera.zoom;
      let curX = curScene.targetCamera.x;
      let curY = curScene.targetCamera.y;

      if (curSceneIdx > 0) {
        const prevScene = timeline[curSceneIdx - 1];
        const elapsed = targetTimeMs - curScene.startTime;
        const transDur = curScene.transDuration;

        if (elapsed < transDur && transDur > 0) {
          const u = Math.max(0, Math.min(1, elapsed / transDur));
          const p = st.ease(u);
          curZoom = prevScene.targetCamera.zoom + (curScene.targetCamera.zoom - prevScene.targetCamera.zoom) * p;
          curX = prevScene.targetCamera.x + (curScene.targetCamera.x - prevScene.targetCamera.x) * p;
          curY = prevScene.targetCamera.y + (curScene.targetCamera.y - prevScene.targetCamera.y) * p;
        }
      }

      // 4. Apply camera directly to DOM without CSS transition lag
      const clamped = st.clampCamera(curZoom, curX, curY);
      if (st.wrapEl) {
        st.wrapEl.style.transition = 'none';
        st.wrapEl.style.transform = `scale(${curZoom.toFixed(4)}) translate(${-clamped.x}%, ${-clamped.y}%)`;
        st.wrapEl.style.setProperty('--ff-camera-zoom', curScene.targetCamera.zoom.toFixed(3));
      }

      // 5. Update micro-progress
      const localElapsed = targetTimeMs - curScene.startTime;
      if (window.FocusFlowInstance?._updateMicroProgress) {
        window.FocusFlowInstance._updateMicroProgress(localElapsed, curScene.duration);
      }

      // 6. Deterministic Sine Pulse Stepper
      const pulsePeriodMs = 1800;
      const pulseU = (Math.sin((targetTimeMs / pulsePeriodMs) * 2 * Math.PI - Math.PI / 2) + 1) / 2;
      const dotScale = 0.85 + pulseU * (1.25 - 0.85);
      const dotOpacity = 0.65 + pulseU * (1.0 - 0.65);

      if (!st.pulseDots || st.pulseDots.length === 0 || curSceneIdx !== st.lastPulseSceneIdx) {
        st.pulseDots = Array.from(document.querySelectorAll('.ff-island-dot, .ff-dot.active'));
        st.lastPulseSceneIdx = curSceneIdx;
      }
      for (let i = 0; i < st.pulseDots.length; i++) {
        st.pulseDots[i].style.transform = `scale(${dotScale.toFixed(3)})`;
        st.pulseDots[i].style.opacity = dotOpacity.toFixed(3);
      }

      // 7. Step virtual clock for SVG stream paths and CSS animations
      if (typeof window.__stepVirtualTime === 'function') {
        window.__stepVirtualTime(deltaMs);
      }
    };
  });
}

async function renderSlice({
  workerId,
  browser,
  fileUrl,
  resConfig,
  calloutScaleFactor,
  controlsScaleFactor,
  startFrame,
  endFrame,
  fps,
  totalDurationMs,
  outputVideoPath,
  detectedEncoder,
  options,
  onProgress,
  isAbortedRef,
  existingPage = null,
  existingContext = null,
}) {
  let context = existingContext;
  let page = existingPage;
  let cdp;

  if (!page) {
    context = await browser.newContext({
      viewport: { width: resConfig.width, height: resConfig.height },
      deviceScaleFactor: 1,
    });
    page = await context.newPage();
    const virtualClockSource = fs.readFileSync(path.join(__dirname, 'virtualClock.js'), 'utf-8');
    await page.addInitScript({ content: virtualClockSource });
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__FOCUSFLOW_READY__ === true, { timeout: 15000 });
    await preparePageForRender(page, calloutScaleFactor, controlsScaleFactor);
    cdp = await context.newCDPSession(page);
  } else {
    cdp = await context.newCDPSession(page);
  }

  // Pre-roll / align to start frame
  const startTimeMs = Math.min(totalDurationMs, (startFrame / fps) * 1000);
  await page.evaluate(({ t, dt }) => {
    if (typeof window.__setVirtualTime === 'function') {
      window.__setVirtualTime(t);
    }
    window.__stepFocusFlowFrame(t, dt);
  }, { t: startTimeMs, dt: 1000 / fps });

  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', options.format === 'jpeg' ? 'mjpeg' : 'png',
    '-framerate', String(fps),
    '-i', '-',
    '-c:v', detectedEncoder.codec, ...detectedEncoder.extraArgs,
    '-movflags', '+faststart',
    outputVideoPath,
  ];

  if (options.debug) {
    console.log(`[DEBUG] Worker ${workerId} FFmpeg command:`, 'ffmpeg', ffmpegArgs.join(' '));
  }

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['pipe', options.debug ? 'inherit' : 'ignore', options.debug ? 'inherit' : 'pipe'],
  });

  let ffmpegError = '';
  if (ffmpegProcess.stderr) {
    ffmpegProcess.stderr.on('data', (d) => {
      ffmpegError += d.toString();
    });
  }

  ffmpegProcess.stdin.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      console.error(`[Worker ${workerId}] FFmpeg stdin error:`, err);
    }
  });

  const screenshotOptions = {
    format: options.format === 'png' ? 'png' : 'jpeg',
    fromSurface: true,
  };
  if (screenshotOptions.format === 'jpeg') {
    screenshotOptions.quality = options.quality;
  }

  for (let frame = startFrame; frame < endFrame; frame++) {
    if (isAbortedRef.aborted) break;

    const targetTimeMs = Math.min(totalDurationMs, (frame / fps) * 1000);

    await page.evaluate(({ t, dt }) => {
      window.__stepFocusFlowFrame(t, dt);
    }, { t: targetTimeMs, dt: 1000 / fps });

    const screenshot = await cdp.send('Page.captureScreenshot', screenshotOptions);
    const buffer = Buffer.from(screenshot.data, 'base64');

    if (!ffmpegProcess.stdin.destroyed && ffmpegProcess.stdin.writable) {
      const ok = ffmpegProcess.stdin.write(buffer);
      if (!ok) {
        await new Promise((resolve) => ffmpegProcess.stdin.once('drain', resolve));
      }
    } else {
      break;
    }

    onProgress(workerId);
  }

  if (!ffmpegProcess.stdin.destroyed && ffmpegProcess.stdin.writable) {
    ffmpegProcess.stdin.end();
  }

  await new Promise((resolve, reject) => {
    ffmpegProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Worker ${workerId} FFmpeg exited with code ${code}: ${ffmpegError}`));
    });
  });

  if (context && context !== existingContext) {
    await context.close().catch(() => {});
  }
}

function cleanupTemp() {
  if (tempHtmlCreated && htmlFilePath && fs.existsSync(htmlFilePath)) {
    try {
      fs.unlinkSync(htmlFilePath);
    } catch {}
  }
  for (const filePath of tempFilesToClean) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
}

process.on('SIGINT', () => {
  cleanupTemp();
  process.exit(130);
});

process.on('SIGTERM', () => {
  cleanupTemp();
  process.exit(143);
});

run().catch((err) => {
  cleanupTemp();
  emitJsonOrLog({
    type: 'error',
    code: 'ERR_FFMPEG_ENCODE',
    message: err.message,
    suggestion: 'Run with --hwaccel cpu or --debug to inspect FFmpeg error details.',
  });
  process.exit(ERR_FFMPEG_ENCODE);
});
