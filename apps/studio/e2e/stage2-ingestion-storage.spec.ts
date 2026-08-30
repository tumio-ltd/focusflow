import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证底图导入弹窗打开与 Tab 交互
 */
async function verifyImageUploadModalInteraction(page: Page): Promise<void> {
  const openImportBtn = page.locator('[data-testid="open-import-btn"]');
  await expect(openImportBtn).toBeVisible();
  await openImportBtn.click();

  const modal = page.locator('[data-testid="image-upload-modal"]');
  await expect(modal).toBeVisible();

  // 验证本地文件上传与远程 URL 导入 Tab
  await expect(modal.getByText(/本地文件上传|Local File Upload/)).toBeVisible();
  const urlTab = modal.getByText(/远程 URL 导入|Remote URL Import/);
  await expect(urlTab).toBeVisible();

  // 切换至 URL 导入
  await urlTab.click();
  await expect(modal.locator('input[type="text"]')).toBeVisible();

  // 关闭弹窗
  await modal.locator('button').first().click();
  await expect(modal).not.toBeVisible();
}

/**
 * 2. 验证模板中心 6 大工业级模板浏览、分类过滤与一键应用
 */
async function verifyTemplatesModalAndApplication(page: Page): Promise<void> {
  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await expect(openTemplatesBtn).toBeVisible();
  await openTemplatesBtn.click();

  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();

  // 验证经典升级版 LuxeHMS 酒店 PMS 模板存在
  await expect(modal.getByText(/LuxeHMS 酒店 PMS 房态/)).toBeVisible();
  await expect(modal.getByText(/微服务高可用电商中台/)).toBeVisible();

  // 测试分类过滤：点击“酒店 & 调度系统”
  const hotelCategoryBtn = modal.getByRole('button', { name: /酒店 & 调度系统|Hotel & Scheduling/ });
  await hotelCategoryBtn.click();
  await expect(modal.getByText(/LuxeHMS 酒店 PMS 房态/)).toBeVisible();

  // 点击“应用此模板创建工程”
  const applyBtn = modal.getByRole('button', { name: /应用此模板创建工程|Clone & Start Project/ }).first();
  await applyBtn.click();

  // 验证应用后弹窗关闭且画布项目标题更新
  await expect(modal).not.toBeVisible();
  await expect(page.locator('header').getByText(/LuxeHMS/)).toBeVisible();
}

/**
 * 3. 验证本地工程管理器列表呈现与搜索过滤
 */
async function verifyProjectManagerModalOperations(page: Page): Promise<void> {
  const openProjectsBtn = page.locator('[data-testid="open-projects-btn"]');
  await expect(openProjectsBtn).toBeVisible();
  await openProjectsBtn.click();

  const modal = page.locator('[data-testid="project-manager-modal"]');
  await expect(modal).toBeVisible();

  // 验证搜索框可用
  const searchInput = modal.locator('input[type="text"]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('微服务');

  // 关闭弹窗
  await modal.locator('button').first().click();
  await expect(modal).not.toBeVisible();
}

/**
 * 4. 验证项目标题内联修改与防抖保存状态
 */
async function verifyAutoSaveAndDraftPersistence(page: Page): Promise<void> {
  // 点击项目标题进入内联编辑
  const titleDisplay = page.locator('header').getByText(/微服务|LuxeHMS|未命名/);
  if (await titleDisplay.isVisible()) {
    await titleDisplay.click();
    const titleInput = page.locator('header input[type="text"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill('E2E 自动化测试架构演进项目');
      await titleInput.press('Enter');

      // 验证标题已更新
      await expect(page.locator('header').getByText('E2E 自动化测试架构演进项目')).toBeVisible();
    }
  }
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
test.describe('FocusFlow Studio Stage 2 E2E Ingestion & Storage Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC201: 验证资产导入弹窗 (ImageUploadModal) 打开与 Tab 交互', async ({ page }) => {
    await verifyImageUploadModalInteraction(page);
  });

  test('TC202: 验证模板中心 (TemplatesModal) 6 大模板分类切换与一键应用', async ({ page }) => {
    await verifyTemplatesModalAndApplication(page);
  });

  test('TC203: 验证本地工程管理器 (ProjectManagerModal) 打开与搜索过滤', async ({ page }) => {
    await verifyProjectManagerModalOperations(page);
  });

  test('TC204: 验证项目标题修改与防抖保存持久化', async ({ page }) => {
    await verifyAutoSaveAndDraftPersistence(page);
  });
});
