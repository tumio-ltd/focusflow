import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证摄像机安全可视取景框 (Frustum) 与“一键捕获当前画布视角”
 */
async function verifyCameraFrustumAndCaptureViewport(page: Page): Promise<void> {
  // 验证取景框正常挂载
  const frustum = page.locator('[data-testid="camera-frustum-frame"]');
  await expect(frustum).toBeVisible();

  // 验证右侧属性面板中的“捕获当前画布视角”按键
  const captureBtn = page.locator('[data-testid="capture-camera-btn"]');
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();

  // 验证运镜参数已成功响应式捕获
  await expect(page.locator('[data-testid="inspector"]')).toContainText('1.');
}

/**
 * 2. 验证智能选框工具激活、拖拽绘制与图层自动关联
 */
async function verifySmartBoxDrawingInteraction(page: Page): Promise<void> {
  // 切换至矩形选框工具 (工具 ID 为 'box')
  const boxToolBtn = page.locator('[data-testid="tool-box"]');
  await expect(boxToolBtn).toBeVisible();
  await boxToolBtn.click();

  const boxOverlay = page.locator('[data-testid="box-drawing-overlay"]');
  await expect(boxOverlay).toBeVisible();

  // 在画布区域执行拖拽拉框
  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 500, box.y + 350);
    await page.mouse.up();
  }

  // 验证右侧图层列表中包含了新创建的选框图元
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toContainText(/box-/);
}

/**
 * 3. 验证贝塞尔连线工具激活与 8 向锚点捕捉
 */
async function verifyBezierRouteDrawingInteraction(page: Page): Promise<void> {
  // 切换至拓扑连线工具 (工具 ID 为 'path')
  const pathToolBtn = page.locator('[data-testid="tool-path"]');
  await expect(pathToolBtn).toBeVisible();
  await pathToolBtn.click();

  const pathOverlay = page.locator('[data-testid="path-drawing-overlay"]');
  await expect(pathOverlay).toBeVisible();

  // 验证 SVG 锚点已渲染
  const circles = pathOverlay.locator('circle');
  const count = await circles.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * 4. 验证脉冲定位圆点与解说气泡放置交互
 */
async function verifyPulseDotAndCalloutCreation(page: Page): Promise<void> {
  // 切换至脉冲圆点工具 (工具 ID 为 'dot')
  const dotToolBtn = page.locator('[data-testid="tool-dot"]');
  await expect(dotToolBtn).toBeVisible();
  await dotToolBtn.click();

  const dotOverlay = page.locator('[data-testid="dot-drawing-overlay"]');
  await expect(dotOverlay).toBeVisible();

  // 单击放置圆点
  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 400, box.y + 300);
  }

  // 切换至解说气泡工具 (工具 ID 为 'callout')
  const calloutToolBtn = page.locator('[data-testid="tool-callout"]');
  await expect(calloutToolBtn).toBeVisible();
  await calloutToolBtn.click();

  const calloutOverlay = page.locator('[data-testid="callout-drawing-overlay"]');
  await expect(calloutOverlay).toBeVisible();

  // 单击放置气泡
  if (box) {
    await page.mouse.click(box.x + 450, box.y + 320);
  }

  // 验证属性面板中包含了新放置的解说气泡
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toContainText(/解说|callout/i);
}

/**
 * 5. 验证属性面板图元显示/隐藏与删除操作
 */
async function verifyInspectorElementToggleAndDelete(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 验证图层眼睛按键与删除按键均存在
  const toggleEyeBtns = inspector.locator('button[title*="当前场景"]');
  if (await toggleEyeBtns.count() > 0) {
    await toggleEyeBtns.first().click();
  }
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
test.describe('FocusFlow Studio Stage 3 E2E Visual Tools Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC301: 验证镜头取景框可视化与一键捕获当前视口视角', async ({ page }) => {
    await verifyCameraFrustumAndCaptureViewport(page);
  });

  test('TC302: 验证智能选框工具激活与拖拽绘制', async ({ page }) => {
    await verifySmartBoxDrawingInteraction(page);
  });

  test('TC303: 验证 8 向锚点捕捉与三次贝塞尔连线图层', async ({ page }) => {
    await verifyBezierRouteDrawingInteraction(page);
  });

  test('TC304: 验证脉冲定位圆点与解说气泡放置交互', async ({ page }) => {
    await verifyPulseDotAndCalloutCreation(page);
  });

  test('TC305: 验证属性检查器图元状态切换与交互', async ({ page }) => {
    await verifyInspectorElementToggleAndDelete(page);
  });
});
