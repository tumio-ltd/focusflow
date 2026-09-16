import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '../../../docs/assets');

/**
 * 辅助函数：录制高能 Hero 动图与截取 3 张核心特性对比大图
 */
async function generateHeroAndFeatureAssets(browser: any): Promise<void> {
  // 1. 创建带录制视频的 Browser Context (1280x720 16:9)
  const tempVideoDir = path.resolve(__dirname, '../../../scratch/raw_video');
  fs.mkdirSync(tempVideoDir, { recursive: true });
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // Retina 2x for ultra crisp screenshots
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  await page.goto('/');

  // 确保英文环境
  const localeBtn = page.locator('[data-testid="locale-picker"]');
  await expect(localeBtn).toBeVisible();
  const langText = (await localeBtn.textContent()) || '';
  if (!langText.includes('EN')) {
    await localeBtn.click();
    await expect(localeBtn).toContainText('EN');
  }

  // 打开模板中心并应用微服务标杆模板
  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await openTemplatesBtn.click();
  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();
  const applyBtn = page.locator('[data-testid="apply-template-tpl-microservices"]');
  await applyBtn.click();
  await expect(modal).toBeHidden();
  await page.waitForTimeout(1000);

  // ========================================================
  // Feature 1: Studio 工作台 Sobel 智能吸附与架构编排视图
  // ========================================================
  const feat1Path = path.join(ASSETS_DIR, 'feature-sobel-snap.png');
  await page.screenshot({ path: feat1Path });
  console.log('Saved Feature 1 Screenshot:', feat1Path);

  // ========================================================
  // Feature 3: 音画波形对齐与分幕提词器联动
  // ========================================================
  const scene3Tab = page.locator('[data-testid="timeline"]').getByText('03 Order Center');
  if (await scene3Tab.isVisible()) {
    await scene3Tab.click();
  }
  const voiceoverPanel = page.locator('[data-testid="scene-voiceover-panel"]');
  if (await voiceoverPanel.isVisible()) {
    await voiceoverPanel.click();
  }
  await page.waitForTimeout(600);
  const feat3Path = path.join(ASSETS_DIR, 'feature-audio-sync.png');
  await page.screenshot({ path: feat3Path });
  console.log('Saved Feature 3 Screenshot:', feat3Path);

  // ========================================================
  // Feature 2: 观众模式全屏电影级运镜与流光拓扑
  // ========================================================
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await audienceBtn.click();
  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible();
  await page.waitForTimeout(1200);

  const feat2Path = path.join(ASSETS_DIR, 'feature-camera-flow.png');
  await page.screenshot({ path: feat2Path });
  console.log('Saved Feature 2 Screenshot:', feat2Path);

  // ========================================================
  // Hero 视频录制走位：电影级循环巡航 5 大分幕 (12-14秒)
  // ========================================================
  await page.keyboard.press('Home');
  await page.waitForTimeout(2500);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2400);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2400);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2400);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2800);

  const video = page.video();
  await page.close();
  await context.close();

  // ========================================================
  // 压缩与生成多格式 Hero 视频与 GIF (使用 ffmpeg)
  // ========================================================
  if (video) {
    const rawVideoPath = await video.path();
    console.log('Raw recorded video at:', rawVideoPath);

    const mp4Output = path.join(ASSETS_DIR, 'hero-demo.mp4');
    const webmOutput = path.join(ASSETS_DIR, 'hero-demo.webm');
    const gifOutput = path.join(ASSETS_DIR, 'hero-demo.gif');

    try {
      execSync(
        `/opt/homebrew/bin/ffmpeg -y -i "${rawVideoPath}" -c:v libx264 -pix_fmt yuv420p -crf 22 -preset medium -movflags +faststart "${mp4Output}"`,
        { stdio: 'inherit' }
      );
      console.log('Generated MP4:', mp4Output);

      execSync(
        `/opt/homebrew/bin/ffmpeg -y -i "${rawVideoPath}" -c:v libvpx-vp9 -b:v 0 -crf 30 -an "${webmOutput}"`,
        { stdio: 'inherit' }
      );
      console.log('Generated WebM:', webmOutput);

      execSync(
        `/opt/homebrew/bin/ffmpeg -y -i "${rawVideoPath}" -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${gifOutput}"`,
        { stdio: 'inherit' }
      );
      console.log('Generated GIF:', gifOutput);

      const gifStat = fs.statSync(gifOutput);
      console.log(`GIF File Size: ${(gifStat.size / (1024 * 1024)).toFixed(2)} MB`);
    } catch (err) {
      console.warn('FFmpeg conversion note:', err);
    }
  }
}

test.describe('Generate Open Source Launch Hero and Feature Assets', () => {
  test('TC: Capture 3 Feature Screenshots and Record Hero Walkthrough Video', async ({ browser }) => {
    test.setTimeout(120000);
    await generateHeroAndFeatureAssets(browser);
  });
});
