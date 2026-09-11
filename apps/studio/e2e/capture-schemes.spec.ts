import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Capture 3 Schemes and TTS Inspector in Temp Directory', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
  await page.waitForTimeout(1000);

  const tempDir = '/Users/xt/WebstormProjects/focusflow/temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const artifactDir = '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1';

  // Helper to save to both tempDir and artifactDir
  const saveShot = async (locator: any, filename: string) => {
    const p1 = path.join(tempDir, filename);
    const p2 = path.join(artifactDir, filename);
    await locator.screenshot({ path: p1 });
    await locator.screenshot({ path: p2 });
  };

  // 1. Fill voiceover script to show charCount badge and synthesize button
  const scriptInput = page.locator('[data-testid="scene-voiceoverScript-input"], [data-testid="scene-voiceover-script-input"]');
  if (await scriptInput.isVisible()) {
    await scriptInput.fill('这里是微服务电商架构演进的全局网关入口，负责全站流量鉴权与动态分流。');
    await page.waitForTimeout(500);
  }

  const inspectorPanel = page.locator('#right-inspector');

  // --- Capture TTS in Dark Mode ---
  // Ensure dark mode first
  const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
  if (!isDark) {
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
  }
  await saveShot(inspectorPanel, 'tts-inspector-dark.png');

  // --- Capture TTS in Light Mode ---
  await page.locator('[data-testid="theme-toggle"]').click(); // switch to light
  await page.waitForTimeout(500);
  await saveShot(inspectorPanel, 'tts-inspector-light.png');

  // Helper to set CTA button class and inline colors
  const setExportBtnClasses = async (extraClass: string, color?: string, bg?: string) => {
    await page.locator('[data-testid="export-btn"]').evaluate((el, { cls, c, b }) => {
      const htmlEl = el as HTMLElement;
      htmlEl.className = `inline-flex items-center justify-center transition-all duration-150 ease-spring focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg whitespace-nowrap shrink-0 cursor-pointer border active:scale-[0.985] text-xs gap-1.5 h-8 px-3 ${cls}`;
      if (c) htmlEl.style.color = c; else htmlEl.style.color = '';
      if (b) htmlEl.style.backgroundColor = b; else htmlEl.style.backgroundColor = '';
    }, { cls: extraClass, c: color, b: bg });
    await page.waitForTimeout(200);
  };

  const schemes = [
    {
      id: 'scheme-A',
      name: 'Scheme A (Linear Minimalist Monochrome)',
      darkClass: 'font-semibold shadow-keycap border-white/20',
      darkColor: '#000000',
      darkBg: '#ffffff',
      lightClass: 'font-semibold shadow-keycap border-slate-900/40',
      lightColor: '#ffffff',
      lightBg: '#0f172a',
    },
    {
      id: 'scheme-B',
      name: 'Scheme B (Brand Accent Solid Cyan/Blue)',
      darkClass: 'bg-primary text-primary-foreground font-semibold shadow-keycap-cyan border-primary/30',
      darkColor: '#06090e',
      darkBg: '#38bdf8',
      lightClass: 'bg-primary text-primary-foreground font-semibold shadow-keycap-cyan border-primary/40',
      lightColor: '#ffffff',
      lightBg: '#0284c7',
    },
    {
      id: 'scheme-C',
      name: 'Scheme C (Bevel Gradient & Subtle Glow)',
      darkClass: 'ff-btn-primary font-semibold',
      lightClass: 'ff-btn-primary font-semibold',
    },
  ];

  for (const scheme of schemes) {
    // 1. Dark Mode
    const currentlyDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    if (!currentlyDark) {
      // Currently light, click twice to get back to dark (light -> system -> dark)
      await page.locator('[data-testid="theme-toggle"]').click();
      await page.locator('[data-testid="theme-toggle"]').click();
      await page.waitForTimeout(500);
    }
    await setExportBtnClasses(scheme.darkClass, scheme.darkColor, scheme.darkBg);
    await saveShot(page.locator('header'), `${scheme.id}-dark-topbar.png`);
    await saveShot(page, `${scheme.id}-dark-full.png`);

    // 2. Light Mode
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
    await setExportBtnClasses(scheme.lightClass, scheme.lightColor, scheme.lightBg);
    await saveShot(page.locator('header'), `${scheme.id}-light-topbar.png`);
    await saveShot(page, `${scheme.id}-light-full.png`);
  }

  // --- Capture Final Native Application State (Scheme A CTA + Unified AI Domain Tokens) ---
  const isDarkFinal = await page.locator('html').evaluate(el => el.classList.contains('dark'));
  if (!isDarkFinal) {
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(500);
  }
  await page.reload();
  await page.waitForTimeout(800);
  const scriptInput2 = page.locator('[data-testid="scene-voiceover-script-input"]');
  if (await scriptInput2.isVisible()) {
    await scriptInput2.fill('这里是微服务电商架构演进的全局网关入口，负责全站流量鉴权与动态分流。');
    await page.waitForTimeout(500);
  }
  await saveShot(page.locator('header'), 'final-topbar-dark.png');
  await saveShot(page.locator('[data-testid="timeline"]'), 'final-timeline-dark.png');
  await saveShot(page.locator('#right-inspector'), 'final-inspector-dark.png');
  await saveShot(page, 'final-unified-dark.png');

  // Light Mode
  await page.locator('[data-testid="theme-toggle"]').click();
  await page.waitForTimeout(500);
  await saveShot(page.locator('header'), 'final-topbar-light.png');
  await saveShot(page.locator('[data-testid="timeline"]'), 'final-timeline-light.png');
  await saveShot(page.locator('#right-inspector'), 'final-inspector-light.png');
  await saveShot(page, 'final-unified-light.png');

  console.log('All screenshots successfully generated in temp and artifact directories!');
});
