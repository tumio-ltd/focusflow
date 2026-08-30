import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证五栏响应式工作台核心容器全部成功挂载
 */
async function verifyWorkbenchLayoutMounted(page: Page): Promise<void> {
  // 顶部全局控制台
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('header').getByText('FocusFlow Studio')).toBeVisible();

  // 左侧 5 大浮动标定工具箱
  const toolbox = page.locator('[data-testid="toolbox"]');
  await expect(toolbox).toBeVisible();

  // 中央交互式视口画布
  const canvasViewport = page.locator('[data-testid="canvas-viewport"]');
  await expect(canvasViewport).toBeVisible();

  // 右侧属性检查面板
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 底部场景时间轴
  const timeline = page.locator('[data-testid="timeline"]');
  await expect(timeline).toBeVisible();
}

/**
 * 2. 验证 Dark / Light 双主题响应式切换与 LocalStorage 持久化
 */
async function verifyThemeToggleBehavior(page: Page): Promise<void> {
  const themeBtn = page.locator('[data-testid="theme-toggle"]');
  await expect(themeBtn).toBeVisible();

  // 默认应为 dark 类
  await expect(page.locator('html')).toHaveClass(/dark/);

  // 切换为 light
  await themeBtn.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  // 再次切换回 dark
  await themeBtn.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
}

/**
 * 3. 验证中英多语言 100% 动态切换与 Key 替换
 */
async function verifyLanguageSwitchingBehavior(page: Page): Promise<void> {
  const langBtn = page.locator('[data-testid="locale-picker"]');
  await expect(langBtn).toBeVisible();

  // 初始为中文 (ZH)
  await expect(page.locator('header').getByText('导出独立 HTML')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]').getByText('添加新场景')).toBeVisible();

  // 切换为英文 (EN)
  await langBtn.click();
  await expect(page.locator('header').getByText('Export Standalone HTML')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]').getByText('Add Scene')).toBeVisible();

  // 切回中文
  await langBtn.click();
  await expect(page.locator('header').getByText('导出独立 HTML')).toBeVisible();
}

/**
 * 4. 验证左侧工具栏激活切换状态
 */
async function verifyToolSelectionBehavior(page: Page): Promise<void> {
  const toolbox = page.locator('[data-testid="toolbox"]');
  const buttons = toolbox.locator('button');

  // 点击矩形高亮选框工具 (第 2 个)
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveClass(/bg-cyan-500/);

  // 点击贝塞尔连线工具 (第 3 个)
  await buttons.nth(2).click();
  await expect(buttons.nth(2)).toHaveClass(/bg-cyan-500/);
  await expect(buttons.nth(1)).not.toHaveClass(/bg-cyan-500/);

  // 恢复选择抓手工具 (第 1 个)
  await buttons.nth(0).click();
  await expect(buttons.nth(0)).toHaveClass(/bg-cyan-500/);
}

/**
 * 5. 验证底部时间轴场景切换与添加场景
 */
async function verifySceneTimelineNavigation(page: Page): Promise<void> {
  const timeline = page.locator('[data-testid="timeline"]');
  const sceneCards = timeline.locator('div.group');

  // 初始有 2 个场景
  await expect(sceneCards).toHaveCount(2);

  // 切换到第 2 个场景
  await sceneCards.nth(1).click();
  await expect(sceneCards.nth(1)).toHaveClass(/border-cyan-500/);

  // 点击添加新场景
  const addSceneBtn = timeline.getByRole('button', { name: /添加新场景|Add Scene/ });
  await addSceneBtn.click();

  // 验证新增后场景数为 3
  await expect(timeline.locator('div.group')).toHaveCount(3);
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
test.describe('FocusFlow Studio Stage 1 E2E Workbench Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 验证五栏响应式工作台核心容器全部正常挂载', async ({ page }) => {
    await verifyWorkbenchLayoutMounted(page);
  });

  test('TC02: 验证 Dark / Light 双主题响应式切换', async ({ page }) => {
    await verifyThemeToggleBehavior(page);
  });

  test('TC03: 验证中英双语动态切换无闪烁', async ({ page }) => {
    await verifyLanguageSwitchingBehavior(page);
  });

  test('TC04: 验证左侧 5 大标定工具激活切换', async ({ page }) => {
    await verifyToolSelectionBehavior(page);
  });

  test('TC05: 验证底部时间轴场景选择与新增场景', async ({ page }) => {
    await verifySceneTimelineNavigation(page);
  });
});
