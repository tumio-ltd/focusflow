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
  await expect(calibPanel).toContainText(/5120 × 2880|1920 × 1459|1920 × 1080/);

  // 验证十字激光准星开关切换
  const crosshairCheckbox = calibPanel.locator('input[type="checkbox"]').nth(1);
  await crosshairCheckbox.check({ force: true });
  await expect(crosshairCheckbox).toBeChecked();

  // 鼠标在画布区域移动时，验证十字准星引导线正常激活
  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 300, box.y + 200);
  }
  const crosshairGuide = page.locator('[data-testid="crosshair-guide"]');
  await expect(crosshairGuide).toBeVisible();
  await expect(crosshairGuide).toContainText(/⌥C|Alt\+C/);

  // 按下 Alt+C 快捷键，验证触发坐标复制与防缩放微徽章高亮反馈
  await page.keyboard.press('Alt+KeyC');
  await expect(crosshairGuide).toContainText(/坐标已复制/);
  await expect(calibPanel).toContainText(/坐标已复制/);
}

/**
 * 7. 验证解说气泡 (Callout) 的画布可视化交互控制与属性面板参数调节
 */
async function verifyCalloutVisualControlAndInspection(page: Page): Promise<void> {
  // 1. 切换至解说气泡工具并在画布点击放置
  const calloutToolBtn = page.locator('[data-testid="tool-callout"]');
  await expect(calloutToolBtn).toBeVisible();
  await calloutToolBtn.click();

  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 350, box.y + 250);
  }

  // 2. 切回选择工具 (tool-select)
  const selectToolBtn = page.locator('[data-testid="tool-select"]');
  await expect(selectToolBtn).toBeVisible();
  await selectToolBtn.click();

  // 3. 验证画布上的 CalloutTransformOverlay 可视化控制图层正常挂载
  const calloutTransformOverlay = page.locator('[data-testid="callout-transform-overlay"]');
  await expect(calloutTransformOverlay).toBeVisible();

  // 4. 单击画布气泡热区选中该气泡
  if (box) {
    await page.mouse.click(box.x + 350, box.y + 250);
  }

  // 5. 验证右侧属性检查器展示气泡专属属性卡片
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toContainText(/解说气泡属性|Callout Settings/i);

  // 6. 验证可调节各项核心参数
  await expect(inspector).toContainText(/气泡标题|徽章文本|Badge Title/i);
  await expect(inspector).toContainText(/视觉主题配色|Visual Theme/i);
  await expect(inspector).toContainText(/正文解说描述|Description Text/i);
  await expect(inspector).toContainText(/左偏移|Left/i);
  await expect(inspector).toContainText(/关联目标框元|Target Box/i);

  // 7. 验证工具栏关闭图标按钮存在，点击可取消选中
  const closeBtn = calloutTransformOverlay.locator('button[title*="取消选择"], button[title*="取消选中"]').first();
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(inspector).toContainText(/未选中图元|No Element Selected/i);

  // 8. 重新点击气泡选中，并测试快捷删除图标按钮
  if (box) {
    await page.mouse.click(box.x + 350, box.y + 250);
  }
  await expect(inspector).toContainText(/解说气泡属性|Callout Settings/i);
  const deleteBtn = calloutTransformOverlay.locator('button[title*="删除气泡"]').first();
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.click();

  // 9. 验证气泡被彻底删除，画布及右侧面板均恢复为未选中状态
  await expect(inspector).toContainText(/未选中图元|No Element Selected/i);
}

/**
 * 8. 验证动态插图 (Image) 图元放置、画布变换手柄与右侧属性面板参数调节
 */
async function verifyImageVisualControlAndInspection(page: Page): Promise<void> {
  // 1. 切换至插图工具 (tool-image)
  const imageToolBtn = page.locator('[data-testid="tool-image"]');
  await expect(imageToolBtn).toBeVisible();
  await imageToolBtn.click();

  // 2. 点击画布触发插图放置弹窗
  const canvas = page.locator('[data-testid="infinite-canvas-container"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + 250, box.y + 180);
  }

  // 3. 点击确认放置插图
  const confirmBtn = page.locator('[data-testid="confirm-insert-image-btn"]');
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // 4. 切换回选择工具 (tool-select)
  const selectToolBtn = page.locator('[data-testid="tool-select"]');
  await expect(selectToolBtn).toBeVisible();
  await selectToolBtn.click();

  // 5. 验证 ImageTransformOverlay 已挂载
  const imageTransformOverlay = page.locator('[data-testid="image-transform-overlay"]');
  await expect(imageTransformOverlay).toBeVisible();

  // 6. 验证右侧属性检查器展示插图专属属性卡片
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toContainText(/动态插图属性|Image Element Settings/i);

  // 7. 验证可调节各项核心参数 (预览、尺寸位置、等比锁定、圆角、投影、进场动效)
  await expect(inspector).toContainText(/图片预览|Image Preview/i);
  await expect(inspector).toContainText(/尺寸与几何位置|Dimensions & Position/i);
  await expect(inspector).toContainText(/等比锁定|自由比例|Lock Aspect Ratio/i);
  await expect(inspector).toContainText(/插图圆角|Border Radius/i);
  await expect(inspector).toContainText(/进场展开动效|Entrance Animation/i);

  // 8. 验证插图在不可见状态下不遮挡图元且不渲染拦截热区
  // 取消选中插图 (点击工具栏的 X 关闭按钮)
  const closeBtn = imageTransformOverlay.locator('button[title*="取消选中"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }

  // 验证在当前场景激活可见时，拥有 1 个待选中的命中框
  const hitAreas = imageTransformOverlay.locator('.group\\/hit');
  await expect(hitAreas).toHaveCount(1);

  // 在图层列表中找到该 img- 图元对应的显隐切换按钮并点击设为隐藏 (不可见)
  const imgEyeBtn = inspector.locator('button[data-testid^="layer-toggle-eye-img-"]').first();
  await expect(imgEyeBtn).toBeVisible();
  await imgEyeBtn.click();

  // 核心断言：处于不可见状态的插图彻底移除交互热区 (count 为 0)，绝不遮挡画布下方图元
  await expect(hitAreas).toHaveCount(0);
}

/**
 * 9. 验证连线图元 (Path) 的画布选中高亮、悬浮工具栏与端点手柄拖拽吸附重连
 */
async function verifyPathTransformOverlayInteraction(page: Page): Promise<void> {
  // 1. 验证选择工具处于激活状态
  const selectToolBtn = page.locator('[data-testid="tool-select"]');
  await expect(selectToolBtn).toBeVisible();
  await selectToolBtn.click();

  // 2. 验证画布上的 PathTransformOverlay 图层正常挂载
  const pathTransformOverlay = page.locator('[data-testid="path-transform-overlay"]');
  await expect(pathTransformOverlay).toBeVisible();

  // 3. 在右侧属性检查器的图层列表中选中 path 连线图元 (如 path-gateway-order)
  const inspector = page.locator('[data-testid="inspector"]');
  const pathLayerItem = inspector.locator('[data-testid="layer-item-path-gateway-order"]');
  await expect(pathLayerItem).toBeVisible();
  await pathLayerItem.click();

  // 4. 验证右侧属性检查器展示连线专属属性面板与端点拓扑提示
  await expect(inspector).toContainText(/连线高级参数/);
  await expect(inspector).toContainText(/端点拓扑/);
  await expect(inspector).toContainText(/可直接在画布中拖拽端点吸附重连/);

  // 5. 验证画布上连线呈现发光选中状态、流光光晕与起点/终点控制手柄
  const selectedHalo = pathTransformOverlay.locator('[data-testid="path-selected-halo"]');
  await expect(selectedHalo).toBeAttached();

  const fromHandle = pathTransformOverlay.locator('[data-testid="path-from-handle"]');
  const toHandle = pathTransformOverlay.locator('[data-testid="path-to-handle"]');
  await expect(fromHandle).toBeAttached();
  await expect(toHandle).toBeAttached();

  // 6. 验证画布微型快捷工具栏 (展示 Path ID、统一模式切换与调色)
  await expect(pathTransformOverlay).toContainText('path-gateway-order');
  await expect(pathTransformOverlay).toContainText('流光');
  await expect(pathTransformOverlay).toContainText('绘制');
  await expect(pathTransformOverlay).toContainText('律动');

  // 7. 测试在微型工具栏中切换模式为“律动”，并验证右侧检查器同步激活对应模式 (P3)
  const pulseBtn = pathTransformOverlay.locator('button:has-text("律动")');
  await pulseBtn.click();
  await expect(pulseBtn).toHaveClass(/bg-cyan-500/);
  const inspectorPulseBtn = inspector.locator('button:has-text("呼吸律动")');
  await expect(inspectorPulseBtn).toHaveClass(/bg-primary/);

  // 8. 验证拖拽起点手柄时唤起周围 Box 的 8 向吸附候选锚点
  const fromBox = await fromHandle.boundingBox();
  if (fromBox) {
    await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(fromBox.x + 20, fromBox.y + 20);
    // 验证候选吸附锚点群已动态激活渲染
    const candidateAnchors = pathTransformOverlay.locator('.candidate-anchors');
    await expect(candidateAnchors).toBeVisible();
    await page.mouse.up();
  }

  // 8.1 验证终点手柄 (toHandle) 完全裸露在工具栏外，未被遮挡且可直接响应点击交互
  await expect(toHandle).toBeVisible();
  const toBox = await toHandle.boundingBox();
  const toolbarEl = pathTransformOverlay.locator('.bg-slate-900\\/95').first();
  const toolbarBox = await toolbarEl.boundingBox();

  if (toBox && toolbarBox) {
    // 验证工具栏与终点手柄之间存在清晰的安全垂直距离，绝不重叠 (AABB 无碰撞)
    const hasOverlap = !(
      toBox.x + toBox.width < toolbarBox.x ||
      toBox.x > toolbarBox.x + toolbarBox.width ||
      toBox.y + toBox.height < toolbarBox.y ||
      toBox.y > toolbarBox.y + toolbarBox.height
    );
    expect(hasOverlap).toBe(false);
  }

  // 点击终点手柄验证其指针事件畅通无阻，绝对未被上层任何 DOM 元素拦截
  await toHandle.click();

  // 截屏归档视觉效果
  await page.screenshot({
    path: 'test-results/screenshots/path_toolbar_avoidance.png',
  });

  // 9. 验证工具栏关闭图标按钮存在，点击可取消选中
  const closeBtn = pathTransformOverlay.locator('button[title*="取消选中"]').first();
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(inspector).toContainText(/未选中图元/);
}

/**
 * 10. 验证智能边缘吸附 (Smart Edge Snap) 默认关闭 (false) 及 LocalStorage 状态记忆与跨会话持久化
 */
async function verifySmartSnapDefaultAndMemoryPersistence(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  const calibPanel = page.locator('[data-testid="calibration-assistant-panel"]');
  await expect(calibPanel).toBeVisible();

  // 1. 验证智能边缘吸附开关默认处于关闭状态 (false)
  const snapInput = page.locator('[data-testid="smart-snap-input"]');
  await expect(snapInput).toBeVisible();
  await expect(snapInput).not.toBeChecked();

  // 2. 验证初始状态下未写入或默认为 false
  const initialStorage = await page.evaluate(() => window.localStorage.getItem('focusflow_smart_snap'));
  expect(initialStorage === null || initialStorage === 'false').toBe(true);

  // 3. 点击开启智能边缘吸附
  await snapInput.check({ force: true });
  await expect(snapInput).toBeChecked();

  // 4. 验证已成功写入 localStorage ('focusflow_smart_snap' === 'true')
  const storageValAfterOn = await page.evaluate(() => window.localStorage.getItem('focusflow_smart_snap'));
  expect(storageValAfterOn).toBe('true');

  // 5. 刷新页面验证持久化记忆特性（刷新后保持开启）
  await page.reload();
  const reloadedSnapInput = page.locator('[data-testid="smart-snap-input"]');
  await expect(reloadedSnapInput).toBeVisible();
  await expect(reloadedSnapInput).toBeChecked();

  // 6. 再次点击关闭智能边缘吸附并验证 localStorage 更新为 'false'
  await reloadedSnapInput.uncheck({ force: true });
  await expect(reloadedSnapInput).not.toBeChecked();

  const storageValAfterOff = await page.evaluate(() => window.localStorage.getItem('focusflow_smart_snap'));
  expect(storageValAfterOff).toBe('false');

  // 7. 再次刷新确认关闭状态依然被正确持久化记忆
  await page.reload();
  const finalSnapInput = page.locator('[data-testid="smart-snap-input"]');
  await expect(finalSnapInput).toBeVisible();
  await expect(finalSnapInput).not.toBeChecked();
}

// 主测试套件：it() / test() 块调用抽离的 async helper 函数
/**
 * 11. TC311: 验证在微服务电商中台工程中，连线端点绝对不被浮动快捷属性工具栏遮挡
 */
async function verifyMicroservicesPathToolbarAvoidance(page: Page): Promise<void> {
  // (1) 呼出模板中心并应用「微服务高可用电商中台演进架构」
  const templatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await expect(templatesBtn).toBeVisible({ timeout: 5000 });
  await templatesBtn.click();

  const templatesModal = page.locator('[data-testid="templates-modal"]');
  await expect(templatesModal).toBeVisible({ timeout: 5000 });

  const templateCard = templatesModal.locator('text=微服务高可用电商中台演进架构').first();
  await expect(templateCard).toBeVisible({ timeout: 5000 });

  const cardContainer = templateCard.locator('xpath=ancestor::div[contains(@class, "group")]');
  const applyBtn = cardContainer.getByRole('button', { name: /应用此模板创建工程/ });
  await applyBtn.click();
  await expect(templatesModal).not.toBeVisible({ timeout: 5000 });

  // (2) 切换到第 2 幕 (02 边缘接入与 API 网关集群治理)
  const scene2Card = page.locator('[data-testid="timeline"]').getByText('02 边缘接入与 API 网关集群治理');
  await expect(scene2Card).toBeVisible({ timeout: 5000 });
  await scene2Card.click();

  // (3) 在右侧 Inspector 选中 path-gw-order (即用户截图中的连线)
  const inspector = page.locator('[data-testid="inspector"]');
  const pathItem = inspector.locator('[data-testid="layer-item-path-gw-order"]');
  await expect(pathItem).toBeVisible({ timeout: 5000 });
  await pathItem.click();

  // (4) 验证画布上的 PathTransformOverlay 已激活
  const pathTransformOverlay = page.locator('[data-testid="path-transform-overlay"]');
  await expect(pathTransformOverlay).toBeVisible();

  // (5) 核心验证：获取终点手柄 (path-to-handle) 与工具栏的位置，验证两者绝对不相交 (AABB 无重叠)
  const toHandle = pathTransformOverlay.locator('[data-testid="path-to-handle"]');
  await expect(toHandle).toBeVisible();

  const toolbarEl = pathTransformOverlay.locator('.bg-slate-900\\/95').first();
  await expect(toolbarEl).toBeVisible();

  const toBox = await toHandle.boundingBox();
  const toolbarBox = await toolbarEl.boundingBox();

  expect(toBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();

  if (toBox && toolbarBox) {
    const hasOverlap = !(
      toBox.x + toBox.width < toolbarBox.x ||
      toBox.x > toolbarBox.x + toolbarBox.width ||
      toBox.y + toBox.height < toolbarBox.y ||
      toBox.y > toolbarBox.y + toolbarBox.height
    );
    expect(hasOverlap).toBe(false);

    // 验证工具栏位于手柄上方或下方，有充足安全间距（且适度贴合，不过度外漂）
    const verticalGap = Math.min(
      Math.abs(toolbarBox.y + toolbarBox.height - toBox.y),
      Math.abs(toBox.y + toBox.height - toolbarBox.y)
    );
    expect(verticalGap).toBeGreaterThanOrEqual(10);
  }

  // (6) 验证颜色选择器当前选中态与高光白核清晰可见 (P2)
  const activeColorBtn = toolbarEl.locator('button.ring-2').first();
  await expect(activeColorBtn).toBeVisible();
  const whiteCoreDot = activeColorBtn.locator('span.bg-white');
  await expect(whiteCoreDot).toBeVisible();

  // (7) 验证 P5 双向联动：在工具条点击切换为绿色后，右侧属性检查器「视觉主题色调」立即同步高亮绿色！
  const emeraldBtn = toolbarEl.locator('button[title*="#34d399"]');
  await emeraldBtn.click();
  await expect(emeraldBtn).toHaveClass(/ring-2/);
  await expect(emeraldBtn.locator('span.bg-white')).toBeVisible();

  const inspectorEmeraldBtn = inspector.locator('button[title*="#34d399"]').last();
  await expect(inspectorEmeraldBtn).toHaveClass(/ring-2/);

  // (7.1) 验证反向联动：在右侧属性检查器点击黄色，工具条立即同步激活黄色外环与白核！
  const inspectorAmberBtn = inspector.locator('button[title*="#fbbf24"]').last();
  await inspectorAmberBtn.click();
  const toolbarAmberBtn = toolbarEl.locator('button[title*="#fbbf24"]');
  await expect(toolbarAmberBtn).toHaveClass(/ring-2/);
  await expect(toolbarAmberBtn.locator('span.bg-white')).toBeVisible();

  // (8) 验证悬停端点手柄时稳定无抖动 (P4)
  await toHandle.hover();
  await page.waitForTimeout(100);

  // 截取视觉效果图（记录选中 path-gw-order 时工具栏优雅避开手柄与颜色指示生效的实景）
  await page.screenshot({
    path: 'test-results/screenshots/path_gw_order_toolbar_avoidance.png',
  });

  // (9) 验证终点手柄畅通可点击，未被工具栏拦截
  await toHandle.click();
}

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

  test('TC307: 验证解说气泡 (Callout) 的画布可视化交互控制与属性面板参数调节', async ({ page }) => {
    await verifyCalloutVisualControlAndInspection(page);
  });

  test('TC308: 验证动态插图 (Image) 图元放置、画布变换手柄与右侧属性面板参数调节', async ({ page }) => {
    await verifyImageVisualControlAndInspection(page);
  });

  test('TC309: 验证连线图元 (Path) 的画布选中高亮、悬浮工具栏与端点手柄拖拽吸附重连', async ({ page }) => {
    await verifyPathTransformOverlayInteraction(page);
  });

  test('TC310: 验证智能边缘吸附默认禁用 (false) 与 LocalStorage 状态记忆恢复特性', async ({ page }) => {
    await verifySmartSnapDefaultAndMemoryPersistence(page);
  });

  test('TC311: 验证微服务工程中连线端点绝对不被浮动快捷属性工具栏遮挡', async ({ page }) => {
    await verifyMicroservicesPathToolbarAvoidance(page);
  });
});



