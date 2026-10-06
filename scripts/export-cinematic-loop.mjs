#!/usr/bin/env node

/**
 * FocusFlow Cinematic Loop Showcase Pipeline
 * 
 * Automates the recording and dual-channel export (60fps MP4 & TrueColor GIF)
 * of FocusFlow's continuous affine camera flight and bezier flow animation.
 * 
 * Usage:
 *   node scripts/export-cinematic-loop.mjs
 *   or: pnpm export:cinematic
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'media/docs/cinematic-showcase');
const SCRATCH_DIR = path.resolve(ROOT_DIR, 'scratch/cinematic_pipeline');

// Resolve Playwright
async function getChromium() {
  try {
    const pw = await import('playwright');
    return pw.chromium;
  } catch {
    try {
      const pwPath = path.resolve(ROOT_DIR, 'apps/studio/node_modules/@playwright/test/index.mjs');
      const pw = await import(pwPath);
      return pw.chromium;
    } catch (e) {
      throw new Error(`Playwright not found. Please install playwright or run pnpm install in apps/studio. (${e.message})`);
    }
  }
}

// Check FFmpeg
function getFFmpegPath() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    if (fs.existsSync('/opt/homebrew/bin/ffmpeg')) return '/opt/homebrew/bin/ffmpeg';
    if (fs.existsSync('/usr/local/bin/ffmpeg')) return '/usr/local/bin/ffmpeg';
    throw new Error('FFmpeg is required but not found in PATH.');
  }
}

// Check server connectivity
async function checkServer(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function recordShowcase(studioUrl) {
  const chromium = await getChromium();
  fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n🚀 Launching Headless Chromium with native 60fps video capture (1920x1080)...`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: SCRATCH_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  console.log(`🌐 Connecting to FocusFlow Studio at ${studioUrl}...`);
  await page.goto(studioUrl);

  // Set English locale and dark mode
  await page.evaluate(() => {
    localStorage.setItem('focusflow_locale', 'en');
    localStorage.setItem('focusflow_theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.reload();
  await page.waitForTimeout(600);

  // Load Microservices Architecture template
  console.log('📐 Applying Microservices Topology template...');
  const openTplBtn = page.locator('[data-testid="open-templates-btn"]');
  if (await openTplBtn.isVisible()) {
    await openTplBtn.click();
    await page.waitForTimeout(400);
    const applyBtn = page.locator('[data-testid="apply-template-tpl-microservices"]');
    await applyBtn.click();
    await page.waitForTimeout(800);
  }

  // Launch Audience Presentation Mode
  console.log('📽️ Opening Audience Presentation Mode...');
  const audBtn = page.locator('[data-testid="audience-btn"]');
  await audBtn.click();
  await page.waitForTimeout(1000);

  // Wait for Audience Player handle
  await page.waitForFunction(() => !!window.__AUDIENCE_PLAYER__);
  await page.mouse.move(0, 0);

  // Initialize at Scene 0 (Global Overview Anchor)
  console.log('🎯 Step 0: Stabilizing at Scene 0 (Global Topology)...');
  await page.evaluate(() => {
    window.__AUDIENCE_PLAYER__.goToScene(0, false);
  });
  await page.waitForTimeout(1800);

  // Flight into Scene 1 (Gateway & Ingress)
  console.log('✈️ Step 1: Flying to Scene 1 (API Gateway Cluster)...');
  await page.evaluate(() => {
    window.__AUDIENCE_PLAYER__.goToScene(1, true);
  });
  await page.waitForTimeout(2200);

  // Flight into Scene 2 (Order Core Microservice)
  console.log('✈️ Step 2: Flying to Scene 2 (Order Core Microservice & Beziers)...');
  await page.evaluate(() => {
    window.__AUDIENCE_PLAYER__.goToScene(2, true);
  });
  await page.waitForTimeout(2200);

  // Flight into Scene 3 (Inventory Engine)
  console.log('✈️ Step 3: Flying to Scene 3 (Inventory & Anti-Overselling Engine)...');
  await page.evaluate(() => {
    window.__AUDIENCE_PLAYER__.goToScene(3, true);
  });
  await page.waitForTimeout(2200);

  // Seamless Return to Scene 0 (Loop Closure)
  console.log('🔄 Step 4: Flying back to Scene 0 (Global Loop Closure)...');
  await page.evaluate(() => {
    window.__AUDIENCE_PLAYER__.goToScene(0, true);
  });
  await page.waitForTimeout(2400);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (!video) throw new Error('Video recording failed');
  const rawPath = await video.path();
  console.log(`✅ Raw 60fps recording saved: ${rawPath}`);
  return rawPath;
}

function encodeOutputs(rawVideoPath) {
  const ffmpeg = getFFmpegPath();
  const startSec = '00:00:01.5';
  const durationSec = '8.8';

  console.log('\n🎞️ --- Exporting Channel 1: 1280x720 60fps MP4 ---');
  const mp4Out = path.join(OUTPUT_DIR, 'focusflow-cinematic-loop-1280x720.mp4');
  const mp4Cmd = `"${ffmpeg}" -y -ss ${startSec} -t ${durationSec} -i "${rawVideoPath}" ` +
    `-vf "scale=1280:720:flags=lanczos,unsharp=3:3:0.5:3:3:0.0" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "${mp4Out}"`;
  execSync(mp4Cmd, { stdio: 'inherit' });

  console.log('\n🎨 --- Exporting Channel 2: 1280x720 TrueColor GIF (Sierra2 Dither) ---');
  const paletteHq = path.join(SCRATCH_DIR, 'palette_hq.png');
  const gifHqOut = path.join(OUTPUT_DIR, 'focusflow-cinematic-loop-1280x720.gif');
  const gifPass1 = `"${ffmpeg}" -y -ss ${startSec} -t ${durationSec} -i "${rawVideoPath}" ` +
    `-vf "fps=16,scale=1280:720:flags=lanczos,unsharp=3:3:0.5:3:3:0.0,palettegen=max_colors=256:stats_mode=diff" "${paletteHq}"`;
  execSync(gifPass1, { stdio: 'inherit' });

  const gifPass2 = `"${ffmpeg}" -y -ss ${startSec} -t ${durationSec} -i "${rawVideoPath}" -i "${paletteHq}" ` +
    `-filter_complex "[0:v]fps=16,scale=1280:720:flags=lanczos,unsharp=3:3:0.5:3:3:0.0[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" "${gifHqOut}"`;
  execSync(gifPass2, { stdio: 'inherit' });

  console.log('\n⚡ --- Exporting Channel 3: 1280x720 Lite GIF (Optimized Size) ---');
  const paletteLite = path.join(SCRATCH_DIR, 'palette_lite.png');
  const gifLiteOut = path.join(OUTPUT_DIR, 'focusflow-cinematic-loop-1280x720-lite.gif');
  const litePass1 = `"${ffmpeg}" -y -ss ${startSec} -t ${durationSec} -i "${rawVideoPath}" ` +
    `-vf "fps=12,scale=1280:720:flags=lanczos,palettegen=max_colors=192:stats_mode=diff" "${paletteLite}"`;
  execSync(litePass1, { stdio: 'inherit' });

  const litePass2 = `"${ffmpeg}" -y -ss ${startSec} -t ${durationSec} -i "${rawVideoPath}" -i "${paletteLite}" ` +
    `-filter_complex "[0:v]fps=12,scale=1280:720:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle" "${gifLiteOut}"`;
  execSync(litePass2, { stdio: 'inherit' });

  // Print Summary Table
  console.log('\n=================== 📦 EXPORT SUMMARY ===================');
  const files = [mp4Out, gifHqOut, gifLiteOut];
  for (const f of files) {
    if (fs.existsSync(f)) {
      const sz = (fs.statSync(f).size / (1024 * 1024)).toFixed(2);
      console.log(`  - ${path.basename(f)}: ${sz} MB`);
    }
  }
  console.log(`Destination directory: ${OUTPUT_DIR}`);
  console.log('=========================================================\n');
}

async function main() {
  const STUDIO_URL = process.env.STUDIO_URL || 'http://localhost:5174';
  const isUp = await checkServer(STUDIO_URL);
  if (!isUp) {
    console.error(`\n❌ Error: FocusFlow Studio is not running at ${STUDIO_URL}.`);
    console.error('Please start the studio server first with: pnpm dev:studio\n');
    process.exit(1);
  }

  const raw = await recordShowcase(STUDIO_URL);
  encodeOutputs(raw);
}

main().catch((err) => {
  console.error('\n❌ Pipeline failed:', err);
  process.exit(1);
});
