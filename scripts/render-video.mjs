#!/usr/bin/env node

/**
 * FocusFlow Automated Headless Video Rendering Pipeline
 * Mode A-2 Dual-Track Headless Architecture & Agent CLI Pipeline
 *
 * Usage: node scripts/render-video.mjs <input> -o <output> [options]
 * Example: node scripts/render-video.mjs examples/overlay-demo -o dist/demo.mp4 --resolution 1080p --fps 60
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
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
    } else if (arg === '--json') {
      result.json = true;
    } else if (arg === '--timeout') {
      result.timeout = parseInt(args[++i], 10) || 120;
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
      process.stdout.write(`\r⏳ Rendering frame ${obj.currentFrame}/${obj.totalFrames} (${obj.percent}%)`);
    } else if (obj.type === 'complete') {
      console.log(`\n\x1b[32m✔ Video render complete: ${obj.outputPath} (${(obj.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)\x1b[0m`);
    } else if (obj.type === 'init') {
      console.log(`🎬 FocusFlow Headless Renderer [${obj.mode.toUpperCase()}]`);
      console.log(`   Resolution: ${obj.resolution.width}x${obj.resolution.height} @ ${obj.fps}fps`);
      console.log(`   Encoder: ${obj.hwaccel}`);
    }
  }
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
let htmlFilePath = '';
let tempHtmlCreated = false;
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

  // Inlining DSL audio track if referenced as relative/absolute file
  if (dslObj.audio?.track?.url && !dslObj.audio.track.url.startsWith('data:') && !dslObj.audio.track.url.startsWith('http')) {
    const cleanAudioPath = dslObj.audio.track.url.startsWith('./') ? dslObj.audio.track.url.slice(2) : dslObj.audio.track.url;
    const absAudioPath = path.isAbsolute(cleanAudioPath) ? cleanAudioPath : path.resolve(baseDir, cleanAudioPath);
    if (fs.existsSync(absAudioPath)) {
      const ext = path.extname(absAudioPath).slice(1) || 'mp3';
      const b64 = fs.readFileSync(absAudioPath).toString('base64');
      dslObj.audio.track.url = `data:audio/${ext};base64,${b64}`;
      if (!options.audio) {
        options.audio = absAudioPath;
      }
    }
  }

  // Audio track inlining if external file exists
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
  </style>
</head>
<body>
  <div id="focusflow-root"></div>
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

  const distDir = path.resolve(projectRoot, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const tempPath = path.join(distDir, `.temp-render-${Date.now()}.html`);
  fs.writeFileSync(tempPath, html, 'utf-8');
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
  });

  const outDir = path.dirname(options.output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

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

  const context = await browser.newContext({
    viewport: { width: resConfig.width, height: resConfig.height },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Inject deterministic virtual clock
  const virtualClockSource = fs.readFileSync(path.join(__dirname, 'virtualClock.js'), 'utf-8');
  await page.addInitScript({ content: virtualClockSource });

  // Navigate
  const fileUrl = htmlFilePath.startsWith('http') ? htmlFilePath : `file://${path.resolve(htmlFilePath)}`;
  await page.goto(fileUrl, { waitUntil: 'load' });

  // Watchdog 1: Wait for __FOCUSFLOW_READY__ (up to 15s)
  try {
    await page.waitForFunction(() => window.__FOCUSFLOW_READY__ === true, { timeout: 15000 });
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

  // Get total duration from player
  const totalDurationMs = await page.evaluate(() => {
    return window.FocusFlowInstance?.getTotalDuration?.() || 5000;
  });

  const fps = options.fps;
  const totalFrames = Math.ceil((totalDurationMs / 1000) * fps);
  // Add 600ms tail freezing buffer
  const tailFrames = Math.ceil(0.6 * fps);
  const grandTotalFrames = totalFrames + tailFrames;

  // Build FFmpeg Command & Spawn Process
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(fps),
    '-i', '-',
  ];

  // If audio track exists
  const hasAudioFile = options.audio && fs.existsSync(options.audio);
  if (hasAudioFile) {
    ffmpegArgs.push('-i', options.audio);
  }

  ffmpegArgs.push('-c:v', detectedEncoder.codec, ...detectedEncoder.extraArgs);

  if (hasAudioFile) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest');
  }

  ffmpegArgs.push('-movflags', '+faststart', options.output);

  if (options.debug) {
    console.log('[DEBUG] FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
  }

  let ffmpegProcess;
  try {
    ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['pipe', options.debug ? 'inherit' : 'ignore', options.debug ? 'inherit' : 'pipe'],
    });
  } catch (err) {
    await browser.close();
    cleanupTemp();
    emitJsonOrLog({
      type: 'error',
      code: 'ERR_FFMPEG_ENCODE',
      message: `Failed to spawn FFmpeg: ${err.message}`,
      suggestion: 'Ensure ffmpeg is installed and available in PATH.',
    });
    process.exit(ERR_FFMPEG_ENCODE);
  }

  let ffmpegError = '';
  if (ffmpegProcess.stderr) {
    ffmpegProcess.stderr.on('data', (d) => {
      ffmpegError += d.toString();
    });
  }

  // CDP Session for zero-latency in-memory screenshot stream
  const cdp = await context.newCDPSession(page);

  const startTime = performance.now();

  // Watchdog 2: Max timeout limit (adaptive formula: duration * 3 + 30s)
  const adaptiveTimeoutSec = Math.max(options.timeout, Math.ceil((totalDurationMs / 1000) * 3 + 30));
  const maxTimeoutMs = adaptiveTimeoutSec * 1000;
  const timeoutTimer = setTimeout(() => {
    try {
      ffmpegProcess.kill('SIGKILL');
      browser.close();
    } catch {}
    cleanupTemp();
    emitJsonOrLog({
      type: 'error',
      code: 'ERR_RENDER_TIMEOUT',
      message: `Rendering exceeded timeout limit of ${adaptiveTimeoutSec}s.`,
      suggestion: 'Increase --timeout value or optimize scene counts.',
    });
    process.exit(ERR_RENDER_TIMEOUT);
  }, maxTimeoutMs);

  // Deterministic Frame-Stepping Loop
  for (let frame = 0; frame < grandTotalFrames; frame++) {
    const targetTimeMs = Math.min(totalDurationMs, (frame / fps) * 1000);

    // Seek player to exact timestamp
    await page.evaluate((t) => {
      window.FocusFlowInstance.seekTo(t);
    }, targetTimeMs);

    // Step virtual clock
    await page.evaluate((dt) => {
      window.__stepVirtualTime(dt);
    }, 1000 / fps);

    // Capture screenshot buffer directly from Chromium surface
    const screenshot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });

    const buffer = Buffer.from(screenshot.data, 'base64');
    ffmpegProcess.stdin.write(buffer);

    emitJsonOrLog({
      type: 'progress',
      currentFrame: frame + 1,
      totalFrames: grandTotalFrames,
      percent: Math.round(((frame + 1) / grandTotalFrames) * 100),
      stage: 'rendering',
    });
  }

  clearTimeout(timeoutTimer);

  // Close stdin to signal EOF to FFmpeg
  ffmpegProcess.stdin.end();

  // Wait for FFmpeg process exit
  await new Promise((resolve, reject) => {
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}: ${ffmpegError}`));
      }
    });
  });

  await browser.close();
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
    avgFps,
  });

  process.exit(EXIT_SUCCESS);
}

function cleanupTemp() {
  if (tempHtmlCreated && htmlFilePath && fs.existsSync(htmlFilePath)) {
    try {
      fs.unlinkSync(htmlFilePath);
    } catch {}
  }
}

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
