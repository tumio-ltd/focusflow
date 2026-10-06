import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证 Path 端点拖拽吸附时的原生 SVG <animate> 雷达波扩散动效、圆心绝对锁定与无 animate-ping 漂移
 */
async function verifyPathEndpointAnchorSnapRadarAnimation(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 切换至图元属性 Tab
  const elementsTab = inspector.locator('button:has-text("图元属性")');
  if (await elementsTab.isVisible()) {
    await elementsTab.click();
  }

  // 选中已有微服务模板中的拓扑连线 (path-ingress-gw)
  const pathLayerItem = inspector.locator('[data-testid="layer-item-path-ingress-gw"]');
  await expect(pathLayerItem).toBeVisible({ timeout: 5000 });
  await pathLayerItem.click();

  // 验证 Path 变换外框挂载
  const pathTransformOverlay = page.locator('[data-testid="path-transform-overlay"]');
  await expect(pathTransformOverlay).toBeVisible();

  // 定位起点控制手柄 (from-handle)
  const fromHandle = pathTransformOverlay.locator('[data-testid="path-from-handle"]');
  await expect(fromHandle).toBeVisible();

  const handleBox = await fromHandle.boundingBox();
  expect(handleBox).not.toBeNull();

  if (handleBox) {
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    // 鼠标按下并微移，触发 dragState 激活候选吸附锚点层
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 10, startY + 10);

    // 验证候选吸附锚点容器正常渲染
    const candidateAnchors = pathTransformOverlay.locator('.candidate-anchors');
    await expect(candidateAnchors).toBeVisible();

    // 核心验证 1：确保 candidate-anchors 内部没有任何可能引发向右下角暴射位移的 animate-ping 样式
    const pingElements = candidateAnchors.locator('.animate-ping');
    await expect(pingElements).toHaveCount(0);

    // 核心验证 2：移动到目标锚点附近触发吸附锁定 (isTarget)
    // 寻找任意候选锚点并移动光标贴近其坐标
    const targetAnchorGroup = pathTransformOverlay.locator('[data-anchor-target="true"]').first();
    
    // 如果微移已经命中了最近的锚点：
    if (await targetAnchorGroup.isVisible()) {
      // 验证目标激活结构存在
      const activeGroup = targetAnchorGroup.locator('[data-testid="anchor-target-active"]');
      await expect(activeGroup).toBeVisible();

      // 验证原生 SVG <animate> 标签正常挂载在扩散圆上
      const animRadius = activeGroup.locator('animate[attributeName="r"]');
      await expect(animRadius).toBeAttached();
      await expect(animRadius).toHaveAttribute('from', '8');
      await expect(animRadius).toHaveAttribute('to', '24');

      const animOpacity = activeGroup.locator('animate[attributeName="opacity"]');
      await expect(animOpacity).toBeAttached();
      await expect(animOpacity).toHaveAttribute('from', '1');
      await expect(animOpacity).toHaveAttribute('to', '0');
    }

    // 松开鼠标恢复
    await page.mouse.up();
  }
}

/**
 * 2. 验证激活 Path 连线绘制工具（十字光标模式）时，悬停可选连接锚点呈现原生 SVG animate 雷达波扩散动效，彻底杜绝 animate-ping 暴射漂移
 */
async function verifyPathDrawingToolAnchorHoverRadarAnimation(page: Page): Promise<void> {
  const toolbox = page.locator('[data-testid="toolbox"]');
  await expect(toolbox).toBeVisible();

  // 1. 选中左侧工具栏中的 Path 连线工具 (tool-path)
  const toolPathBtn = page.locator('[data-testid="tool-path"]');
  await expect(toolPathBtn).toBeVisible();
  await toolPathBtn.click();

  // 2. 验证挂载 PathDrawingOverlay 且鼠标呈现十字光标
  const pathDrawingOverlay = page.locator('[data-testid="path-drawing-overlay"]');
  await expect(pathDrawingOverlay).toBeVisible();
  await expect(pathDrawingOverlay).toHaveClass(/cursor-crosshair/);

  // 3. 验证此时画布上没有任何遗留的 animate-ping 类
  const pingElements = pathDrawingOverlay.locator('.animate-ping');
  await expect(pingElements).toHaveCount(0);

  // 4. 定位首个可选连线圆点 (circle)，获取其坐标并模拟鼠标光标悬停贴近
  const firstAnchorDot = pathDrawingOverlay.locator('[data-testid="anchor-core-dot"]').first();
  await expect(firstAnchorDot).toBeVisible();

  const dotBox = await firstAnchorDot.boundingBox();
  expect(dotBox).not.toBeNull();

  if (dotBox) {
    const dotCenterX = dotBox.x + dotBox.width / 2;
    const dotCenterY = dotBox.y + dotBox.height / 2;

    // 移动十字光标至可连线圆点中心
    await page.mouse.move(dotCenterX, dotCenterY);

    // 5. 验证外圈发光波纹触发并挂载 anchor-hover-radar
    const hoverRadar = pathDrawingOverlay.locator('[data-testid="anchor-hover-radar"]');
    await expect(hoverRadar).toBeVisible();

    // 核心验证：确保雷达圆圈使用原生 SVG <animate> 动画标签进行半径与透明度扩散，绝对锁定圆心坐标
    const animRadius = hoverRadar.locator('animate[attributeName="r"]');
    await expect(animRadius).toBeAttached();
    await expect(animRadius).toHaveAttribute('from', '8');
    await expect(animRadius).toHaveAttribute('to', '24');

    const animOpacity = hoverRadar.locator('animate[attributeName="opacity"]');
    await expect(animOpacity).toBeAttached();
    await expect(animOpacity).toHaveAttribute('from', '0.9');
    await expect(animOpacity).toHaveAttribute('to', '0');

    // 再次确认悬停激活后依然零 animate-ping、零 scale-125 以及零 transition-transform 漂移类
    await expect(pathDrawingOverlay.locator('.animate-ping')).toHaveCount(0);
    await expect(pathDrawingOverlay.locator('[class*="scale-125"]')).toHaveCount(0);
    await expect(pathDrawingOverlay.locator('[class*="transition-transform"]')).toHaveCount(0);
  }
}

/**
 * 2. 验证属性检查器 5 大图元头部交互式 ID 复制胶囊徽章、剪贴板写入与 Sonner Toast 联动
 */
async function verifyCopyableIdBadgeAndToastFeedback(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 切换至图元属性 Tab
  const elementsTab = inspector.locator('button:has-text("图元属性")');
  if (await elementsTab.isVisible()) {
    await elementsTab.click();
  }

  // 1. 测试 Box 图元 ID 复制
  const boxItem = inspector.locator('[data-testid="layer-item-box-gateway"]');
  await expect(boxItem).toBeVisible({ timeout: 5000 });
  await boxItem.click();

  // 验证 Box 卡片头部的 CopyableIdBadge
  const boxBadge = inspector.locator('[data-testid="copyable-id-badge"]').first();
  await expect(boxBadge).toBeVisible();
  await expect(boxBadge).toContainText('box-gateway');
  await expect(boxBadge).toHaveAttribute('title', /box-gateway/);

  // 点击复制徽章
  await boxBadge.click();

  // 验证微动效：图标切换为 Check 绿勾，且具有 data-copied 标记
  const checkIcon = boxBadge.locator('[data-testid="copy-check-icon"]');
  await expect(checkIcon).toBeVisible();
  await expect(boxBadge).toHaveAttribute('data-copied', 'true');

  // 验证全局 Sonner Toast 弹出
  const toastSuccess = page.locator('[data-sonner-toast]');
  await expect(toastSuccess.first()).toBeVisible({ timeout: 3000 });
  await expect(toastSuccess.first()).toContainText('box-gateway');

  // 2. 测试 Path 图元 ID 复制
  const pathItem = inspector.locator('[data-testid="layer-item-path-ingress-gw"]');
  await expect(pathItem).toBeVisible();
  await pathItem.click();

  const pathBadge = inspector.locator('[data-testid="copyable-id-badge"]').first();
  await expect(pathBadge).toBeVisible();
  await expect(pathBadge).toContainText('path-ingress-gw');
  await pathBadge.click();

  await expect(toastSuccess.first()).toContainText('path-ingress-gw');
}

/**
 * 3. 验证属性检查器几何坐标数值展示区解冻局部 select-text，允许用户鼠标划选
 */
async function verifyInspectorCoordinatesSelectTextEnabled(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 切换至图元属性 Tab
  const elementsTab = inspector.locator('button:has-text("图元属性")');
  if (await elementsTab.isVisible()) {
    await elementsTab.click();
  }

  // 选中 box-gateway
  const boxItem = inspector.locator('[data-testid="layer-item-box-gateway"]');
  await expect(boxItem).toBeVisible({ timeout: 5000 });
  await boxItem.click();

  // 验证坐标网格容器挂载了 select-text 类
  const coordGrid = inspector.locator('.grid.grid-cols-2:has-text("X:")');
  await expect(coordGrid).toBeVisible();
  await expect(coordGrid).toHaveClass(/select-text/);
}

/**
 * 4. 验证图层层级列表（Layer Hierarchy List）保留整洁宽度，移除易引起“复制图元”歧义的按钮，并保持 select-text 支持鼠标划选
 */
async function verifyLayerListSelectableTextWithoutDuplicationButton(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 验证图层项元素名称挂载 select-text 与 font-mono 类，并具有原生 title 提示
  const boxLayerItem = page.locator('[data-testid="layer-item-box-gateway"]');
  await expect(boxLayerItem).toBeVisible({ timeout: 5000 });

  const titleSpan = boxLayerItem.locator('span.select-text');
  await expect(titleSpan).toBeVisible();
  await expect(titleSpan).toHaveAttribute('title', 'box-gateway');
  await expect(titleSpan).toHaveClass(/select-text/);

  // 核心验证：确保图层行内不存在挤占标题宽度且易混淆为“复制图元”的复制按钮
  const redundantCopyBtn = boxLayerItem.locator('[data-testid="layer-copy-btn-box-gateway"]');
  await expect(redundantCopyBtn).toHaveCount(0);
}

/**
 * 5. 验证画布变换浮动工具栏（Canvas Overlay Floating Toolbar）中的图元 ID 复制胶囊微交互
 */
async function verifyCanvasOverlayCopyableIdBadge(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 选中 box-gateway
  const boxItem = inspector.locator('[data-testid="layer-item-box-gateway"]');
  await expect(boxItem).toBeVisible({ timeout: 5000 });
  await boxItem.click();

  // 定位画布上的 Box 悬浮工具栏中的 ID 胶囊 (非 inspector 里的)
  const canvasBadge = page.locator('.absolute.-top-10 [data-testid="copyable-id-badge"]').first();
  await expect(canvasBadge).toBeVisible({ timeout: 3000 });
  await expect(canvasBadge).toContainText('box-gateway');

  // 点击画布上的复制胶囊
  await canvasBadge.click();

  // 验证绿勾微动效与 Toast
  const checkIcon = canvasBadge.locator('[data-testid="copy-check-icon"]');
  await expect(checkIcon).toBeVisible();
  const toastSuccess = page.locator('[data-sonner-toast]');
  await expect(toastSuccess.first()).toBeVisible({ timeout: 3000 });
  await expect(toastSuccess.first()).toContainText('box-gateway');
}

/**
 * 6. 验证在现代 navigator.clipboard 模拟异常/权限拒绝时，自动降级至 document.execCommand('copy') 保证复制成功
 */
async function verifyClipboardFallbackWhenNavigatorClipboardFails(page: Page): Promise<void> {
  const inspector = page.locator('[data-testid="inspector"]');
  await expect(inspector).toBeVisible();

  // 切换至图元属性 Tab 并选中 box-gateway
  const elementsTab = inspector.locator('button:has-text("图元属性")');
  if (await elementsTab.isVisible()) {
    await elementsTab.click();
  }

  const boxItem = inspector.locator('[data-testid="layer-item-box-gateway"]');
  await expect(boxItem).toBeVisible({ timeout: 5000 });
  await boxItem.click();

  // 模拟 navigator.clipboard.writeText 抛出 PermissionDenied 异常（模拟非安全上下文/受限环境）
  await page.evaluate(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText = () =>
        Promise.reject(new DOMException('Permission denied by browser policy', 'NotAllowedError'));
    }
  });

  // 点击检查器卡片头部的 CopyableIdBadge
  const boxBadge = inspector.locator('[data-testid="copyable-id-badge"]').first();
  await expect(boxBadge).toBeVisible();
  await boxBadge.click();

  // 验证降级方案依然成功：绿勾对勾出现，且 Toast 成功提示弹出！
  const checkIcon = boxBadge.locator('[data-testid="copy-check-icon"]');
  await expect(checkIcon).toBeVisible();

  const toastSuccess = page.locator('[data-sonner-toast]');
  await expect(toastSuccess.first()).toBeVisible({ timeout: 3000 });
  await expect(toastSuccess.first()).toContainText('box-gateway');
}

// 主测试套件
test.describe('ISSUE-08 & ISSUE-03 Studio Craftsmanship & Interaction E2E Suites', () => {
  test.beforeEach(async ({ page, context }) => {
    // 授予剪贴板权限，确保 navigator.clipboard.writeText 顺利执行
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
  });

  test('TC801: 验证 Path 端点拖拽吸附原生 SVG animate 雷达波扩散动效与无 animate-ping 漂移', async ({ page }) => {
    await verifyPathEndpointAnchorSnapRadarAnimation(page);
  });

  test('TC802: 验证激活 Path 连线绘制工具 (cursor-crosshair) 时，悬停目标圆点呈现绝对锁定雷达波且无 animate-ping 暴射漂移', async ({ page }) => {
    await verifyPathDrawingToolAnchorHoverRadarAnimation(page);
  });

  test('TC301: 验证属性检查器 ID 复制胶囊徽章微交互、绿勾状态与全局 Sonner Toast 联动', async ({ page }) => {
    await verifyCopyableIdBadgeAndToastFeedback(page);
  });

  test('TC302: 验证属性检查器尺寸坐标数值展示区解冻局部 select-text 支持鼠标划选', async ({ page }) => {
    await verifyInspectorCoordinatesSelectTextEnabled(page);
  });

  test('TC303: 验证图层层级列表移除易混淆的复制图标按钮以保障排版空间，并解冻图元名称 select-text 鼠标划选', async ({ page }) => {
    await verifyLayerListSelectableTextWithoutDuplicationButton(page);
  });

  test('TC304: 验证画布变换浮动工具栏（Canvas Overlay Floating Toolbar）中的图元 ID 复制胶囊微交互', async ({ page }) => {
    await verifyCanvasOverlayCopyableIdBadge(page);
  });

  test('TC305: 验证在现代 navigator.clipboard 模拟异常/权限拒绝时，自动降级至 document.execCommand 保证复制成功', async ({ page }) => {
    await verifyClipboardFallbackWhenNavigatorClipboardFails(page);
  });
});
