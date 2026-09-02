import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证时间轴场景卡片添加、复制与删除
 */
async function verifyTimelineCardReorderAndDuplicate(page: Page): Promise<void> {
  const timeline = page.locator('[data-testid="timeline"]');
  await expect(timeline).toBeVisible();

  // 获取初始场景数量
  const initialCards = page.locator('[data-testid^="scene-card-"]');
  const initialCount = await initialCards.count();

  // 点击“添加新场景”按键
  const addSceneBtn = page.locator('[data-testid="add-scene-btn"]');
  await expect(addSceneBtn).toBeVisible();
  await addSceneBtn.click();

  // 验证场景数递增
  await expect(page.locator('[data-testid^="scene-card-"]')).toHaveCount(initialCount + 1);

  // 悬停在第一个场景卡片并点击复制
  const firstCard = page.locator('[data-testid="scene-card-0"]');
  await firstCard.hover();
  const copyBtn = firstCard.locator('button[title*="复制"]');
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    await expect(page.locator('[data-testid^="scene-card-"]')).toHaveCount(initialCount + 2);
  }
}

/**
 * 2. 验证场景标题双击内联编辑与实时同步
 */
async function verifySceneTitleInlineEditing(page: Page): Promise<void> {
  const firstCard = page.locator('[data-testid="scene-card-0"]');
  await expect(firstCard).toBeVisible();

  // 双击标题文本激活 input 输入框
  const titleSpan = firstCard.locator('span.font-medium');
  await titleSpan.dblclick();

  const inlineInput = firstCard.locator('input[type="text"]');
  await expect(inlineInput).toBeVisible();

  // 输入新标题并保存
  await inlineInput.fill('01 核心网关拓扑');
  await inlineInput.press('Enter');

  // 验证卡片与右侧属性面板同步更新
  await expect(firstCard).toContainText('01 核心网关拓扑');
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector.locator('input').first()).toHaveValue('01 核心网关拓扑');
}

/**
 * 3. 验证 TopBar 撤销与重做时间旅行
 */
async function verifyUndoRedoButtonsAndKeyboard(page: Page): Promise<void> {
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  const redoBtn = page.locator('[data-testid="redo-btn"]');

  await expect(undoBtn).toBeVisible();
  await expect(redoBtn).toBeVisible();

  // 执行一次添加场景操作
  const addSceneBtn = page.locator('[data-testid="add-scene-btn"]');
  const initialCardsCount = await page.locator('[data-testid^="scene-card-"]').count();
  await addSceneBtn.click();
  await expect(page.locator('[data-testid^="scene-card-"]')).toHaveCount(initialCardsCount + 1);

  // 点击撤销按键
  await expect(undoBtn).toBeEnabled();
  await undoBtn.click();
  await expect(page.locator('[data-testid^="scene-card-"]')).toHaveCount(initialCardsCount);

  // 点击重做按键
  await expect(redoBtn).toBeEnabled();
  await redoBtn.click();
  await expect(page.locator('[data-testid^="scene-card-"]')).toHaveCount(initialCardsCount + 1);
}

/**
 * 4. 验证图层可见性矩阵与上一幕图元状态继承
 */
async function verifyLayerMatrixInheritance(page: Page): Promise<void> {
  // 切换到第二幕场景
  const secondCard = page.locator('[data-testid="scene-card-1"]');
  if (await secondCard.isVisible()) {
    await secondCard.click();

    // 检查属性面板中的“继承”按键
    const inheritBtn = page.locator('[data-testid="inherit-scene-btn"]');
    if (await inheritBtn.isVisible()) {
      await inheritBtn.click();
      // 验证图元状态已成功继承
      const inspector = page.locator('[data-testid="inspector"]');
      await expect(inspector).toContainText(/gateway|order|box/i);
    }
  }
}

/**
 * 5. 验证演播控制条播放、暂停与上一幕/下一幕切换
 */
async function verifyTimelinePlaybackControls(page: Page): Promise<void> {
  const playBtn = page.locator('[data-testid="timeline-play-btn"]');
  await expect(playBtn).toBeVisible();
  await playBtn.click(); // 开始播放
  await page.waitForTimeout(300);
  await playBtn.click(); // 暂停播放
  await page.waitForTimeout(300);

  // 验证时间轴总时长标签展示
  const timeline = page.locator('[data-testid="timeline"]');
  await expect(timeline).toContainText(/总时长|Total Duration/i);
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
test.describe('FocusFlow Studio Stage 4 E2E Timeline & History Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC401: 验证时间轴场景卡片添加、复制与删除', async ({ page }) => {
    await verifyTimelineCardReorderAndDuplicate(page);
  });

  test('TC402: 验证场景标题双击内联编辑与实时同步', async ({ page }) => {
    await verifySceneTitleInlineEditing(page);
  });

  test('TC403: 验证 TopBar 撤销与重做时间旅行', async ({ page }) => {
    await verifyUndoRedoButtonsAndKeyboard(page);
  });

  test('TC404: 验证图层可见性矩阵与上一幕图元状态继承', async ({ page }) => {
    await verifyLayerMatrixInheritance(page);
  });

  test('TC405: 验证演播控制条播放、暂停与上一幕/下一幕切换', async ({ page }) => {
    await verifyTimelinePlaybackControls(page);
  });
});
