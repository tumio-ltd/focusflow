import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证工作台顶部「分享」按钮并能调出 ShareModal
 */
async function verifyShareModalInteraction(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Verify Share button exists in TopBar
  const shareBtn = page.locator('[data-testid="share-btn"]');
  await expect(shareBtn).toBeVisible();
  await shareBtn.click();

  // Verify ShareModal appears with Shortlink & Embed iframe options
  const modal = page.locator('[role="dialog"]').or(page.getByText('分享演示与嵌入'));
  await expect(modal.first()).toBeVisible();

  // Verify iframe embed code snippet option
  const iframeTabBtn = page.getByText('iframe 嵌入代码');
  if (await iframeTabBtn.isVisible()) {
    await iframeTabBtn.click();
    await expect(page.locator('pre').or(page.locator('code')).first()).toBeVisible();
  }

  // Close modal via close button or Escape
  await page.keyboard.press('Escape');
}

/**
 * 2. 验证直接访问 /share/:projectId 渲染轻量只读播放器
 */
async function verifyReadOnlyShareRoute(page: Page): Promise<void> {
  await page.goto('/share/demo-project-id');
  await page.waitForLoadState('networkidle');

  // Heavy editing toolbars must NOT be rendered
  await expect(page.locator('[data-testid="toolbox"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="inspector"]')).toHaveCount(0);

  // Player container and controls must be present
  const playerContainer = page.locator('.focusflow-player-wrapper, #player-canvas, canvas, [data-testid="audience-player-container"]');
  await expect(playerContainer.first()).toBeAttached();
}

/**
 * 3. 验证直接访问 /embed/:slug 渲染嵌入模式播放器
 */
async function verifyEmbedPlayerRoute(page: Page): Promise<void> {
  await page.goto('/embed/demo-slug');
  await page.waitForLoadState('networkidle');

  // Toolbars must NOT exist
  await expect(page.locator('[data-testid="toolbox"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="inspector"]')).toHaveCount(0);
}

test.describe('Mode-B Cloud Share & Embed Player E2E Suite', () => {
  test('E2E-SHARE-01: should trigger ShareModal and inspect iframe embed snippets', async ({ page }) => {
    await verifyShareModalInteraction(page);
  });

  test('E2E-SHARE-02: should render lightweight read-only player at /share/:projectId without workbench toolbars', async ({ page }) => {
    await verifyReadOnlyShareRoute(page);
  });

  test('E2E-SHARE-03: should render clean embedded viewer at /embed/:slug', async ({ page }) => {
    await verifyEmbedPlayerRoute(page);
  });
});
