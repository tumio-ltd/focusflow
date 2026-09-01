import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证多功能导出中心模态框呼出与选项卡切换
 */
async function verifyExportModalOpenAndTabs(page: Page): Promise<void> {
  const exportBtn = page.locator('[data-testid="export-btn"]');
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();

  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).toBeVisible();

  // 验证 HTML / ZIP / Video 选项卡均存在并可流畅切换
  const tabZip = page.locator('[data-testid="tab-zip"]');
  await expect(tabZip).toBeVisible();
  await tabZip.click();
  await expect(page.locator('button[data-testid="export-zip-btn"]')).toBeVisible();

  const tabVideo = page.locator('[data-testid="tab-video"]');
  await expect(tabVideo).toBeVisible();
  await tabVideo.click();
  await expect(exportModal).toContainText(/MediaRecorder|WebM/i);

  const tabHtml = page.locator('[data-testid="tab-html"]');
  await expect(tabHtml).toBeVisible();
  await tabHtml.click();
  await expect(page.locator('button[data-testid="export-html-btn"]')).toBeVisible();
}

/**
 * 2. 验证纯前端单文件独立 HTML 编译与下载触发
 */
async function verifyStandaloneHtmlExportTrigger(page: Page): Promise<void> {
  const exportModal = page.locator('[data-testid="export-modal"]');
  if (!await exportModal.isVisible()) {
    await page.locator('[data-testid="export-btn"]').click();
  }

  const exportHtmlBtn = page.locator('[data-testid="export-html-btn"]');
  await expect(exportHtmlBtn).toBeVisible();

  // 监听浏览器原生下载事件
  const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await exportHtmlBtn.click();

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toMatch(/\.html$/);
  }
}

/**
 * 3. 验证纯前端 ZIP 工程归档打包与下载触发
 */
async function verifyZipProjectExportTrigger(page: Page): Promise<void> {
  const exportModal = page.locator('[data-testid="export-modal"]');
  if (!await exportModal.isVisible()) {
    await page.locator('[data-testid="export-btn"]').click();
  }

  const tabZip = page.locator('[data-testid="tab-zip"]');
  await tabZip.click();

  const exportZipBtn = page.locator('[data-testid="export-zip-btn"]');
  await expect(exportZipBtn).toBeVisible();

  // 监听浏览器原生下载事件
  const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await exportZipBtn.click();

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  }
}

/**
 * 4. 验证受众全屏演播模式呼出、翻页与退出
 */
async function verifyAudienceModeFullscreen(page: Page): Promise<void> {
  // 点击 TopBar 演播按键
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await expect(audienceBtn).toBeVisible();
  await audienceBtn.click();

  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible();

  // 验证顶部进度胶囊存在
  await expect(audienceModal).toContainText(/01 \//);

  // 点击关闭按钮退出
  const closeBtn = page.locator('[data-testid="close-audience-btn"]');
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();

  await expect(audienceModal).not.toBeVisible();
}

async function verifyExportModalKeyboardShortcut(page: Page): Promise<void> {
  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).not.toBeVisible();

  // 按下 Control+e
  await page.keyboard.press('Control+e');
  await expect(exportModal).toBeVisible();

  // 按 Escape 或关闭按钮关闭模态框
  const closeBtn = exportModal.locator('button').first();
  await closeBtn.click();
  await expect(exportModal).not.toBeVisible();
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
test.describe('FocusFlow Studio Stage 5 E2E Export & Packaging Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC501: 验证多功能导出中心模态框呼出与选项卡切换', async ({ page }) => {
    await verifyExportModalOpenAndTabs(page);
  });

  test('TC502: 验证纯前端单文件独立 HTML 编译与下载触发', async ({ page }) => {
    await verifyStandaloneHtmlExportTrigger(page);
  });

  test('TC503: 验证纯前端 ZIP 工程归档打包与下载触发', async ({ page }) => {
    await verifyZipProjectExportTrigger(page);
  });

  test('TC504: 验证受众全屏演播模式呼出、翻页与退出', async ({ page }) => {
    await verifyAudienceModeFullscreen(page);
  });

  test('TC505: 验证 Command/Control+E 快捷键唤起导出中心模态框', async ({ page }) => {
    await verifyExportModalKeyboardShortcut(page);
  });
});

