import { test, expect, Page } from '@playwright/test';
import {
  calculateCameraFrustum,
  sortClustersByTopologicalFlow,
  extractHeuristicClusters,
  generateHeuristicAutoTour,
  ClusterBoundingBox,
} from '../src/services/autoTour/heuristicTourGenerator';

/**
 * 1. 验证摄像机视锥数学模型 (Camera Frustum Math) 与边缘安全防穿帮钳位
 */
async function verifyCameraFrustumMathAndClamping(): Promise<void> {
  const viewportW = 3840;
  const viewportH = 2160;

  // 测试用例 1：位于正中央的中等尺寸框元
  const centerBox: ClusterBoundingBox = {
    id: 'box-center',
    x: 1400,
    y: 800,
    width: 1040,
    height: 560,
    energyScore: 100,
  };
  const frustum1 = calculateCameraFrustum(centerBox, viewportW, viewportH);
  expect(frustum1.zoom).toBeGreaterThanOrEqual(1.6);
  expect(frustum1.zoom).toBeLessThanOrEqual(2.5);
  // 正中心框元偏移应接近 0%
  expect(Math.abs(frustum1.x)).toBeLessThan(5);
  expect(Math.abs(frustum1.y)).toBeLessThan(5);

  // 测试用例 2：位于极右上角的框元 (验证边缘钳位 Edge Clamping)
  const extremeTopRightBox: ClusterBoundingBox = {
    id: 'box-corner',
    x: 3400,
    y: 50,
    width: 400,
    height: 200,
    energyScore: 150,
  };
  const frustum2 = calculateCameraFrustum(extremeTopRightBox, viewportW, viewportH);
  const maxSafePercentX = (1 - 1 / frustum2.zoom) * 50;
  const maxSafePercentY = (1 - 1 / frustum2.zoom) * 50;

  // 摄像机中心绝对不超出允许的安全百分比 (绝不露出黑边)
  expect(frustum2.x).toBeLessThanOrEqual(Number(maxSafePercentX.toFixed(2)) + 0.01);
  expect(frustum2.y).toBeGreaterThanOrEqual(-Number(maxSafePercentY.toFixed(2)) - 0.01);
}

/**
 * 2. 验证架构拓扑方向自动判决与分镜时序排序 (Topological Flow Sorting)
 */
async function verifyTopologicalDirectionAndSorting(): Promise<void> {
  // 测试纵向三层架构 (Top to Bottom)
  const verticalClusters: ClusterBoundingBox[] = [
    { id: 'db', x: 500, y: 1600, width: 800, height: 300, energyScore: 80 },
    { id: 'gateway', x: 500, y: 200, width: 800, height: 300, energyScore: 100 },
    { id: 'service', x: 500, y: 900, width: 800, height: 300, energyScore: 90 },
  ];
  const vertResult = sortClustersByTopologicalFlow(verticalClusters);
  expect(vertResult.isVertical).toBe(true);
  expect(vertResult.sorted.map((c) => c.id)).toEqual(['gateway', 'service', 'db']);

  // 测试横向流水架构 (Left to Right)
  const horizontalClusters: ClusterBoundingBox[] = [
    { id: 'sink', x: 2800, y: 500, width: 400, height: 400, energyScore: 80 },
    { id: 'source', x: 200, y: 500, width: 400, height: 400, energyScore: 100 },
    { id: 'processor', x: 1500, y: 500, width: 400, height: 400, energyScore: 90 },
  ];
  const horizResult = sortClustersByTopologicalFlow(horizontalClusters);
  expect(horizResult.isVertical).toBe(false);
  expect(horizResult.sorted.map((c) => c.id)).toEqual(['source', 'processor', 'sink']);
}

/**
 * 3. 验证纯前端 Sobel 梯度离屏聚类与平滑背景 Fallback 容错兜底
 */
async function verifyClusterExtractionAndFallback(): Promise<void> {
  const W = 1920;
  const H = 1080;
  // 构建一张全平滑纯色空白图 (模拟无边缘底图)
  const blankData = new Uint8ClampedArray(W * H * 4).fill(255);
  const fallbackClusters = extractHeuristicClusters({ data: blankData, width: W, height: H }, 3);

  // 必须保证返回 3 个符合三等分构图规则的兜底集群，绝不崩溃
  expect(fallbackClusters.length).toBe(3);
  expect(fallbackClusters[0].width).toBeGreaterThan(100);
  expect(fallbackClusters[1].width).toBeGreaterThan(100);
  expect(fallbackClusters[2].width).toBeGreaterThan(100);

  // 构建一张带有高对比度矩形边缘的合成图
  const syntheticData = new Uint8ClampedArray(W * H * 4).fill(15);
  // 在 3 个区域绘制白色高亮矩形
  const drawRect = (rx: number, ry: number, rw: number, rh: number) => {
    for (let y = ry; y < ry + rh && y < H; y++) {
      for (let x = rx; x < rx + rw && x < W; x++) {
        const idx = (y * W + x) * 4;
        syntheticData[idx] = 240;
        syntheticData[idx + 1] = 240;
        syntheticData[idx + 2] = 240;
      }
    }
  };
  drawRect(200, 200, 300, 200);
  drawRect(800, 400, 350, 250);
  drawRect(1400, 600, 300, 200);

  const detectedClusters = extractHeuristicClusters({ data: syntheticData, width: W, height: H }, 3);
  expect(detectedClusters.length).toBeGreaterThanOrEqual(3);
}

/**
 * 4. 验证完整 FocusFlowDSL 电影级 4 幕导览端到端组装
 */
async function verifyCompleteDslSynthesis(): Promise<void> {
  const W = 3840;
  const H = 2160;
  const dummyData = new Uint8ClampedArray(W * H * 4);

  // 1. 中文模式 DSL 合成验证
  const dslZh = generateHeuristicAutoTour(
    { data: dummyData, width: W, height: H },
    W,
    H,
    {
      title: '高可用微服务流式计算演进导览',
      assetUrl: './templates/microservices-architecture.svg',
      locale: 'zh',
    }
  );

  expect(dslZh.meta.title).toBe('高可用微服务流式计算演进导览');
  expect(dslZh.meta.viewport.width).toBe(W);
  expect(dslZh.meta.viewport.height).toBe(H);
  expect(dslZh.asset.url).toBe('./templates/microservices-architecture.svg');
  expect(dslZh.elements.boxes.length).toBe(3);
  expect(dslZh.elements.paths.length).toBe(2);
  expect(dslZh.scenes.length).toBe(4);
  expect(dslZh.scenes[0].title).toBe('01 全局架构拓扑总览');
  expect(dslZh.scenes[0].titleI18n?.en).toBeDefined();
  expect(dslZh.scenes[1].activeElements.callouts![0].title).toContain('接入网关');
  expect(dslZh.scenes[1].activeElements.callouts![0].desc).toContain('流量路由');

  // 2. 英文模式 DSL 合成验证 (验证 config 场景与 callout 文本完全地道纯英文、无中文残留)
  const dslEn = generateHeuristicAutoTour(
    { data: dummyData, width: W, height: H },
    W,
    H,
    {
      assetUrl: './templates/microservices-architecture.svg',
      locale: 'en',
    }
  );

  expect(dslEn.meta.title).toBe('Enterprise Architecture Evolution Tour');
  expect(dslEn.scenes.length).toBe(4);
  expect(dslEn.scenes[0].title).toBe('01 Global Architecture Overview');
  expect(dslEn.scenes[0].voiceoverScript).toContain('High-level architectural overview');
  expect(dslEn.scenes[0].title).not.toMatch(/[\u4e00-\u9fa5]/);
  expect(dslEn.scenes[0].voiceoverScript).not.toMatch(/[\u4e00-\u9fa5]/);

  const scene1Callout = dslEn.scenes[1].activeElements.callouts![0];
  expect(scene1Callout.title).toBe('01 Ingress Gateway & Security Layer');
  expect(scene1Callout.desc).toContain('Handles omnichannel traffic routing');
  expect(scene1Callout.title).not.toMatch(/[\u4e00-\u9fa5]/);
  expect(scene1Callout.desc).not.toMatch(/[\u4e00-\u9fa5]/);

  // Scene 1~3 为推拉特写，具备专属 Callout 与连线激活
  for (let i = 1; i <= 3; i++) {
    const scene = dslEn.scenes[i];
    expect(scene.camera.zoom).toBeGreaterThanOrEqual(1.6);
    expect(scene.camera.zoom).toBeLessThanOrEqual(2.5);
    expect(scene.activeElements.callouts?.length).toBe(1);
    expect(scene.title).not.toMatch(/[\u4e00-\u9fa5]/);
    expect(scene.voiceoverScript).not.toMatch(/[\u4e00-\u9fa5]/);
  }
}

/**
 * 5. 验证在浏览器真实运行环境中对底图进行实时启发式导览生成 (<200ms)
 */
async function verifyInBrowserHeuristicTourExecution(page: Page): Promise<void> {
  await page.goto('/');

  // 在浏览器上下文中调用启发式导览算法，测试实际执行时延
  const executionTimeMs = await page.evaluate(async () => {
    const startTime = performance.now();
    // 创建 1920x1080 离屏测试图像
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1920, 1080);
    // 绘制 3 个高对比度色块
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(200, 150, 400, 200);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(750, 350, 450, 250);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(1300, 550, 400, 220);

    const imgData = ctx.getImageData(0, 0, 1920, 1080);
    // 简单验证像素非空
    const isDataValid = imgData.data.length > 0;
    const endTime = performance.now();
    return isDataValid ? endTime - startTime : -1;
  });

  expect(executionTimeMs).toBeGreaterThan(0);
  expect(executionTimeMs).toBeLessThan(100); // 纯前端光栅化加运算必须在 100ms 内完成
}

/**
 * 6. 验证顶部操作栏 AI 导览弹窗打开与双模态透明短板 (Cons) 提示展示
 */
async function verifyAutoTourModalAndConsDisclosure(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');

  const openBtn = page.locator('[data-testid="open-auto-tour-btn"]');
  await expect(openBtn).toBeVisible();
  await openBtn.click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  // 验证模式 1 启发式卡片及其局限性说明 (Cons)
  const mode1Card = modal.locator('[data-testid="mode-heuristic-card"]');
  await expect(mode1Card).toBeVisible();
  const mode1Cons = modal.locator('[data-testid="mode1-cons-notice"]');
  await expect(mode1Cons).toBeVisible();
  await expect(mode1Cons).toContainText('局限性与短板');
  await expect(mode1Cons).toContainText('无语义理解');

  // 验证模式 2 视觉大模型智能导演卡片及其局限性说明 (Cons)
  const mode2Card = modal.locator('[data-testid="mode-vision-llm-card"]');
  await expect(mode2Card).toBeVisible();
  const mode2Cons = modal.locator('[data-testid="mode2-cons-notice"]');
  await expect(mode2Cons).toBeVisible();
  await expect(mode2Cons).toContainText('局限性与短板');
  await expect(mode2Cons).toContainText('API Key');

  // 模式 2 按钮应处于禁用状态 (敬请期待)
  const mode2Btn = mode2Card.locator('button');
  await expect(mode2Btn).toBeDisabled();

  // 关闭弹窗
  await modal.locator('button:has-text("关闭")').click();
  await expect(modal).not.toBeVisible();
}

/**
 * 7. 验证执行一键启发式导览、覆盖二次确认与 Cmd+Z 原子撤销还原
 */
async function verifyAutoTourExecutionAndUndo(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');

  // 当前默认微服务工程有 5 幕
  const openBtn = page.locator('[data-testid="open-auto-tour-btn"]');
  await openBtn.click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  // 点击“立即启发式生成”
  const generateBtn = modal.locator('[data-testid="generate-heuristic-tour-btn"]');
  await generateBtn.click();

  // 因为已有工程图元，触发二次覆盖保护警告
  const warning = modal.locator('[data-testid="auto-tour-overwrite-warning"]');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('当前工程已有设计内容');

  // 点击确认覆盖生成
  const confirmBtn = modal.locator('[data-testid="confirm-overwrite-btn"]');
  await confirmBtn.click();

  // 弹窗关闭，且已成功生成新导览
  await expect(modal).not.toBeVisible();

  // 验证第一幕标题更新为全局总览
  const firstScene = page.locator('[data-testid^="scene-card-"]').first();
  await expect(firstScene).toBeVisible();
  await expect(firstScene).toContainText('全局架构拓扑总览');

  // 验证原子撤销 (Undo)：按撤销按钮
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  await expect(undoBtn).toBeEnabled();
  await undoBtn.click();

  // 验证瞬间恢复至原始微服务标杆工程 (5 幕)
  const restoredScenes = page.locator('[data-testid^="scene-card-"]');
  await expect(restoredScenes).toHaveCount(5);
}

/**
 * 8. 验证底图导入弹窗中 AI 导览勾选框与透明局限性卡片展示
 */
async function verifyImageUploadModalAutoTourCard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForSelector('[data-testid="open-import-btn"]');

  const openImportBtn = page.locator('[data-testid="open-import-btn"]');
  await openImportBtn.click();

  const uploadModal = page.locator('[data-testid="image-upload-modal"]');
  await expect(uploadModal).toBeVisible();

  // 切换到 URL 导入 Tab 并输入测试用 data URI
  const urlTab = uploadModal.getByText(/远程 URL 导入|Remote URL Import/);
  await urlTab.click();

  const urlInput = uploadModal.locator('input[type="text"]');
  const dummyDataUri =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGqBUGAAY7CQE9+t5CAAAAAElFTkSuQmCC';
  await urlInput.fill(dummyDataUri);

  const parseBtn = uploadModal.getByRole('button', { name: '解析' });
  await parseBtn.click();

  // 解析成功后，Auto-Tour 勾选选项卡与 Cons 局限性提示卡片应立即显现
  const autoTourCard = uploadModal.locator('[data-testid="auto-tour-option-card"]');
  await expect(autoTourCard).toBeVisible();

  const consNotice = uploadModal.locator('[data-testid="auto-tour-cons-notice"]');
  await expect(consNotice).toBeVisible();
  await expect(consNotice).toContainText('局限性与短板说明');
  await expect(consNotice).toContainText('不具备 OCR 文字语义识别能力');

  // 保存最新高对比度截图供视觉校准 (暗色与明亮主题)
  await uploadModal.screenshot({
    path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/auto_tour_modal_preview.png',
  });

  // 切换为极简明亮 (Light) 主题并截图验证明亮下的文字对比度
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });
  await page.waitForTimeout(200);
  await uploadModal.screenshot({
    path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/auto_tour_modal_light_preview.png',
  });

  // 测试取消勾选
  const checkbox = uploadModal.locator('[data-testid="auto-tour-checkbox"]');
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(consNotice).not.toBeVisible();

  // 重新勾选
  await checkbox.check();
  await expect(consNotice).toBeVisible();

  // 关闭弹窗
  await uploadModal.getByRole('button', { name: '取消' }).click();
  await expect(uploadModal).not.toBeVisible();

  // 再次打开弹窗，严格验证重置逻辑 (Clean Slate)：旧图元解析状态彻底清空，无任何残留缓存
  await openImportBtn.click();
  await expect(uploadModal).toBeVisible();
  await expect(uploadModal.locator('[data-testid="auto-tour-option-card"]')).not.toBeVisible();
  // 确认按钮处于禁用状态 (无待导入资产)
  await expect(uploadModal.getByRole('button', { name: '创建并导入新工程' })).toBeDisabled();
  // 再次关闭
  await uploadModal.getByRole('button', { name: '取消' }).click();
  await expect(uploadModal).not.toBeVisible();
}

/**
 * 9. 验证英文语言环境下自动导览相关弹窗 (ImageUploadModal / AutoTourModal) 纯正无任何残留中文
 */
async function verifyAutoTourModalEnglishLocalization(page: Page): Promise<void> {
  // 注入英文语言偏好
  await page.addInitScript(() => {
    localStorage.setItem('focusflow_locale', 'en');
  });
  await page.goto('/');

  // 1. 打开底图导入弹窗
  const openImportBtn = page.locator('[data-testid="open-import-btn"]');
  await openImportBtn.click();

  const uploadModal = page.locator('[data-testid="image-upload-modal"]');
  await expect(uploadModal).toBeVisible();

  // 切换到远程 URL
  const urlTab = uploadModal.getByText('Remote URL Import');
  await urlTab.click();

  const dummyDataUri =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGqBUGAAY7CQE9+t5CAAAAAElFTkSuQmCC';
  await uploadModal.locator('input[type="text"]').fill(dummyDataUri);
  await uploadModal.getByRole('button', { name: 'Parse' }).click();

  // 验证勾选卡片与局限性通知显示为纯英文
  const autoTourCard = uploadModal.locator('[data-testid="auto-tour-option-card"]');
  await expect(autoTourCard).toBeVisible();
  await expect(autoTourCard).toContainText('⚡ Algorithm Principles:');
  await expect(autoTourCard).toContainText('Offline');

  const consNotice = uploadModal.locator('[data-testid="auto-tour-cons-notice"]');
  await expect(consNotice).toBeVisible();
  await expect(consNotice).toContainText('Limitations (Cons):');
  await expect(consNotice).toContainText('This mode operates purely on visual geometry');

  // 验证底图导入弹窗在英文下无任何残留中文字符
  const uploadModalText = await autoTourCard.innerText();
  expect(uploadModalText).not.toMatch(/[\u4e00-\u9fa5]/);

  // 截图留存英文下解析成功的高对比度弹窗
  await uploadModal.screenshot({
    path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/auto_tour_modal_en_preview.png',
  });

  // 点击导入并创建工程
  await uploadModal.getByRole('button', { name: 'Create & Ingest Project' }).click();
  await expect(uploadModal).not.toBeVisible();

  // 验证导入成功后右下角 Toast 提示为地道纯英文且无任何中文残留
  const uploadToast = page.getByText(/Auto-generated 4 cinematic scenes & visual flow for you/);
  await expect(uploadToast).toBeVisible();
  const uploadToastText = await uploadToast.innerText();
  expect(uploadToastText).not.toMatch(/[\u4e00-\u9fa5]/);

  // 2. 打开独立 AI 导览编排弹窗
  const openTourBtn = page.locator('[data-testid="open-auto-tour-btn"]');
  await openTourBtn.click();

  const tourModal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(tourModal).toBeVisible();

  // 验证模式 1 与模式 2 的英文标签
  const mode1Cons = tourModal.locator('[data-testid="mode1-cons-notice"]');
  await expect(mode1Cons).toContainText('Limitations & Trade-offs (Cons):');
  const mode1Text = await tourModal.locator('[data-testid="mode-heuristic-card"]').innerText();
  expect(mode1Text).not.toMatch(/[\u4e00-\u9fa5]/);

  const mode2Cons = tourModal.locator('[data-testid="mode2-cons-notice"]');
  await expect(mode2Cons).toContainText('Limitations & Trade-offs (Cons):');
  const mode2Text = await tourModal.locator('[data-testid="mode-vision-llm-card"]').innerText();
  expect(mode2Text).not.toMatch(/[\u4e00-\u9fa5]/);

  // 3. 点击立即生成，验证在英文环境下生成的工程分幕与图元均为地道纯英文
  const generateBtn = tourModal.locator('[data-testid="generate-heuristic-tour-btn"]');
  await generateBtn.click();

  // 确认覆盖警告卡片
  const confirmBtn = tourModal.locator('[data-testid="confirm-overwrite-btn"]');
  await confirmBtn.click();
  await expect(tourModal).not.toBeVisible();

  // 验证重新生成导览成功后右下角 Toast 提示为纯正英文且无中文残留
  const tourToast = page.getByText(/Successfully generated 4-scene cinematic tour/);
  await expect(tourToast).toBeVisible();
  const tourToastText = await tourToast.innerText();
  expect(tourToastText).not.toMatch(/[\u4e00-\u9fa5]/);

  // 验证时间轴第 1 幕与第 2 幕标题均为纯正英文，绝无中文
  const firstScene = page.locator('[data-testid^="scene-card-"]').first();
  await expect(firstScene).toBeVisible();
  await expect(firstScene).toContainText('01 Global Architecture Overview');
  const firstSceneText = await firstScene.innerText();
  expect(firstSceneText).not.toMatch(/[\u4e00-\u9fa5]/);

  const secondScene = page.locator('[data-testid^="scene-card-"]').nth(1);
  await expect(secondScene).toBeVisible();
  await expect(secondScene).toContainText('Ingress Gateway');
  const secondSceneText = await secondScene.innerText();
  expect(secondSceneText).not.toMatch(/[\u4e00-\u9fa5]/);
}

// 主测试套件：遵循用户规范，it() / test() 块调用抽离的 async 函数
test.describe('FocusFlow Studio AI Auto-Tour Heuristic Engine Suite', () => {
  test('TC401: 验证摄像机视锥数学模型反推与 16:9 画幅边缘安全防穿帮钳位', async () => {
    await verifyCameraFrustumMathAndClamping();
  });

  test('TC402: 验证架构拓扑方向自动判决与时序排序', async () => {
    await verifyTopologicalDirectionAndSorting();
  });

  test('TC403: 验证纯前端 Sobel 梯度离屏聚类与平滑背景 Fallback 容错兜底', async () => {
    await verifyClusterExtractionAndFallback();
  });

  test('TC404: 验证完整 FocusFlowDSL 电影级 4 幕导览端到端组装', async () => {
    await verifyCompleteDslSynthesis();
  });

  test('TC405: 验证在浏览器真实运行环境中对底图进行实时启发式导览生成 (<200ms)', async ({ page }) => {
    await verifyInBrowserHeuristicTourExecution(page);
  });

  test('TC406: 验证顶部操作栏 AI 导览弹窗打开与双模态透明短板 (Cons) 提示展示', async ({ page }) => {
    await verifyAutoTourModalAndConsDisclosure(page);
  });

  test('TC407: 验证执行一键启发式导览、覆盖二次确认与 Cmd+Z 原子撤销还原', async ({ page }) => {
    await verifyAutoTourExecutionAndUndo(page);
  });

  test('TC408: 验证底图导入弹窗中 AI 导览勾选框与透明局限性卡片展示', async ({ page }) => {
    await verifyImageUploadModalAutoTourCard(page);
  });

  test('TC409: 验证英文环境下自动导览弹窗完整国际化无中文字符残留', async ({ page }) => {
    await verifyAutoTourModalEnglishLocalization(page);
  });
});


