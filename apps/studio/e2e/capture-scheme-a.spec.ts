import { test, expect } from '@playwright/test';

test('Capture Scheme A Modern Soft Surface Studio Screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  // 等待核心组件与图像就绪
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
  await page.waitForTimeout(1000);

  const targetPath1 = '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/scheme-a-preview.png';
  const targetPath2 = '/Users/xt/WebstormProjects/focusflow/apps/studio/test-results/scheme-a-preview.png';

  await page.screenshot({ path: targetPath1 });
  await page.screenshot({ path: targetPath2 });
  console.log(`Successfully captured Scheme A Studio screenshot to:\n${targetPath1}\n${targetPath2}`);
});
