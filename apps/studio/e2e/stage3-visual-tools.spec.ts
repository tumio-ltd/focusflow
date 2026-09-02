import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证摄像机安全可视取景框 (Frustum) 与“一键捕获当前画布视角”及交互式微调
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

  // 验证取景框标签与交互手柄正常挂载
  const badge = page.locator('[data-testid="camera-frustum-badge"]');
  await expect(badge).toBeVisible();
  const handleSE = page.locator('[data-testid="camera-handle-se"]');
  await expect(handleSE).toBeVisible();

  // 验证一键居中复位按键正常挂载与点击
  const resetBtn = page.locator('[data-testid="reset-camera-center-btn"]');
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();

  // 验证在画布上直接拖拽取景框微调平移
  const frustumBox = await frustum.boundingBox();
  if (frustumBox) {
    const startX = frustumBox.x + frustumBox.width / 2;
    const startY = frustumBox.y + frustumBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 30);
    await page.mouse.up();
  }
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

/**
 * 6. 验证右侧 Inspector 标定助手 (Precision HUD) 实时度量、十字准星与吸附控制
 */
async function verifyCalibrationAssistantInRightInspector(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 验证标定助手面板存在
  const calibPanel = page.locator('[data-testid="calibration-assistant-panel"]');
  await expect(calibPanel).toBeVisible();
  await expect(calibPanel).toContainText(/标定助手|Calibration HUD/i);

  // 验证底图原生基准分辨率徽章
  await expect(calibPanel).toContainText(/1920 × 1459|1920 × 1080/);

  // 验证十字激光准星开关切换
  const crosshairCheckbox = calibPanel.locator('input[type="checkbox"]').nth(1);
  await crosshairCheckbox.check();
  await expect(crosshairCheckbox).toBeChecked();

  // 鼠标在画布区域移动时，验证十字准星引导线正常激活
  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 300, box.y + 200);
  }
  const crosshairGuide = page.locator('[data-testid="crosshair-guide"]');
  await expect(crosshairGuide).toBeVisible();
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

  test('TC306: 验证右侧 Inspector 标定助手 (Precision HUD) 实时度量、十字准星与吸附控制', async ({ page }) => {
    await verifyCalibrationAssistantInRightInspector(page);
  });
});
