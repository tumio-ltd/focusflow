import { test, expect } from '@playwright/test';

test('Capture Scheme A Modern Soft Surface Studio Screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  // 等待核心组件就绪
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
  await page.waitForTimeout(1000);

  // 1. Dark Mode
  const darkExportBtn = await page.locator('[data-testid="export-btn"]').evaluate(el => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      border: cs.border,
      boxShadow: cs.boxShadow,
      className: el.className
    };
  });
  console.log('DARK_EXPORT_BTN:', JSON.stringify(darkExportBtn, null, 2));

  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/scheme-a-preview.png' });
  await page.locator('header').screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/topbar-dark.png' });

  // 2. Switch to Light Mode
  await page.locator('[data-testid="theme-toggle"]').click();
  await page.waitForTimeout(800);

  const lightExportBtn = await page.locator('[data-testid="export-btn"]').evaluate(el => {
    const cs = window.getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      border: cs.border,
      boxShadow: cs.boxShadow,
      className: el.className
    };
  });
  console.log('LIGHT_EXPORT_BTN:', JSON.stringify(lightExportBtn, null, 2));

  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/scheme-a-light.png' });
  await page.locator('header').screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/topbar-light.png' });
});
