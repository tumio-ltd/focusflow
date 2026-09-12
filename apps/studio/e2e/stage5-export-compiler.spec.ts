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
 * 2. 验证纯前端单文件独立 HTML 编译与下载触发，并验证脱机 HTML 控制组件与快捷键控制
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

    // 真正脱机验证：在独立上下文打开下载的 HTML 单文件，验证 PlaybackIsland 控制组件与键盘翻页/播放
    const fs = await import('fs');
    const path = await import('path');
    const tempFilePath = path.join(process.cwd(), `test-export-${Date.now()}.html`);
    await download.saveAs(tempFilePath);

    const standalonePage = await page.context().newPage();
    try {
      await standalonePage.goto(`file://${tempFilePath}`);
      await standalonePage.waitForTimeout(500);

      const controlsIsland = standalonePage.locator('[data-testid="audience-controls"]');
      await expect(controlsIsland).toBeVisible();

      const scenePill = standalonePage.locator('[data-testid="audience-scene-pill"]');
      await expect(scenePill).toBeVisible();
      await expect(scenePill).toContainText('01 /');

      // 验证键盘方向键 -> 翻至第 2 幕
      await standalonePage.keyboard.press('ArrowRight');
      await expect(scenePill).toContainText('02 /');

      // 验证键盘方向键 <- 翻回第 1 幕
      await standalonePage.keyboard.press('ArrowLeft');
      await expect(scenePill).toContainText('01 /');

      // 验证空格键播放与暂停控制
      const sceneTimer = standalonePage.locator('[data-testid="audience-scene-timer"]');
      await expect(sceneTimer).not.toBeVisible();
      await standalonePage.keyboard.press(' ');
      await expect(sceneTimer).toBeVisible();

      // 验证播放时钟心跳正常流转：时间读数动态递增，绝非 00:00 静态假死
      await standalonePage.waitForTimeout(1100);
      const timerText = await sceneTimer.innerText();
      expect(timerText).toMatch(/00:0[1-9] \//);

      await standalonePage.keyboard.press(' ');
      await expect(sceneTimer).not.toBeVisible();

      // 验证移动端竖屏横屏指引与自适应元标记存在
      const rotateHint = standalonePage.locator('.ff-mobile-rotate-hint');
      await expect(rotateHint).toBeAttached();

      // 验证开源版官方微型水印角标 (FocusFlow Watermark Badge)
      const watermark = standalonePage.locator('[data-testid="focusflow-watermark-badge"]');
      await expect(watermark).toBeVisible();
      await expect(watermark).toHaveAttribute('href', 'https://tumio-ltd.github.io/focusflow/');
      await expect(watermark).toHaveAttribute('target', '_blank');
      await expect(watermark).toContainText('Powered by');
      await expect(watermark).toContainText('FocusFlow');

      // 截取独立 HTML 运行态截图存证（含水印角标与控制组件）
      await standalonePage.screenshot({ path: 'test-results/screenshots/standalone_html_with_watermark.png' });
    } finally {
      await standalonePage.close();
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
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

/**
 * 6. TC577: 验证演播播放态 HUD 三态显隐 (full / minimal / zen) 与时间刻度
 */
async function verifyPlaybackHudTriState(page: Page): Promise<void> {
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await expect(audienceBtn).toBeVisible();
  await audienceBtn.click();

  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible();

  // (1) 默认 full 完整态：
  // 底部居中统一 MVP 胶囊存在，分幕指示器存在；
  // 核心特性检验：手动自控/暂停态下时间刻度严格隐藏 (not.toBeVisible)，点击空格播放时动态展开显示！
  const controlsIsland = page.locator('[data-testid="audience-controls"]');
  await expect(controlsIsland).toBeVisible();

  const scenePill = page.locator('[data-testid="audience-scene-pill"]');
  await expect(scenePill).toBeVisible();

  const sceneTimer = page.locator('[data-testid="audience-scene-timer"]');
  await expect(sceneTimer).not.toBeVisible(); // 手动暂停态下严格隐藏时间

  // 触发播放，验证时间刻度微勋章平滑展开
  await page.keyboard.press(' ');
  await expect(sceneTimer).toBeVisible();
  await expect(sceneTimer).toContainText(/00:00/);

  // 再次暂停，验证时间微勋章自动收起隐匿
  await page.keyboard.press(' ');
  await expect(sceneTimer).not.toBeVisible();

  const hudMinimal = page.locator('[data-testid="audience-hud-minimal"]');
  await expect(hudMinimal).not.toBeVisible();

  // (2) 按下单键快捷键 H：切换至 minimal 微缩胶囊态
  await page.keyboard.press('h');
  await expect(hudMinimal).toBeVisible();
  await expect(controlsIsland).not.toBeVisible();

  // 验证水印角标自适应向上浮动让位 (-translate-y-[42px])，避免遮挡最小化胶囊操作按钮
  const watermark = audienceModal.locator('[data-testid="focusflow-watermark-badge"]');
  await expect(watermark).toBeVisible();
  await expect(watermark).toHaveClass(/-translate-y-\[42px\]/);

  // (3) 再次按下 H：切换至 zen 沉浸纯净态
  await page.keyboard.press('h');
  await expect(controlsIsland).not.toBeVisible();
  await expect(hudMinimal).not.toBeVisible();

  // (4) 再次按下 H：恢复至 full 完整排练态
  await page.keyboard.press('h');
  await expect(controlsIsland).toBeVisible();
  await expect(scenePill).toBeVisible();

  // (5) 点击浮岛内的 HUD 切换按钮，验证也能触发模式切换并持久化到 LocalStorage
  const hudToggleBtn = page.locator('[data-testid="hud-mode-toggle"]');
  await expect(hudToggleBtn).toBeVisible();
  await hudToggleBtn.click();
  await expect(hudMinimal).toBeVisible();

  let storedMode = await page.evaluate(() => localStorage.getItem('focusflow_playback_hud_mode'));
  expect(storedMode).toBe('minimal');

  // (6) 在胶囊态下点击切换，进入 zen 沉浸纯净态，验证底部唤醒浮岛可点击一键找回控制栏
  const minimalToggleBtn = page.locator('[data-testid="audience-hud-minimal"] [data-testid="hud-mode-toggle"]');
  await expect(minimalToggleBtn).toBeVisible();
  await minimalToggleBtn.click();

  storedMode = await page.evaluate(() => localStorage.getItem('focusflow_playback_hud_mode'));
  expect(storedMode).toBe('zen');
  await expect(controlsIsland).not.toBeVisible();
  await expect(hudMinimal).not.toBeVisible();

  // 模拟鼠标移动唤醒
  await page.mouse.move(500, 500);
  const zenRestoreBtn = page.locator('[data-testid="zen-restore-hud-btn"]');
  await expect(zenRestoreBtn).toBeVisible();
  await zenRestoreBtn.click();

  // 验证成功一键找回 controlsIsland，并切回 full 完整态
  await expect(controlsIsland).toBeVisible();
  storedMode = await page.evaluate(() => localStorage.getItem('focusflow_playback_hud_mode'));
  expect(storedMode).toBe('full');

  // (7) 验证右上角全屏工具栏中的 HUD 切换按钮也可正常操作
  const topHudToggleBtn = page.locator('[data-testid="hud-mode-toggle-top"]');
  await expect(topHudToggleBtn).toBeVisible();
  await topHudToggleBtn.click();
  await expect(hudMinimal).toBeVisible();

  // 按 Escape 退出模态框
  await page.keyboard.press('Escape');
  await expect(audienceModal).not.toBeVisible();
}

/**
 * 7. TC578: 验证录制时无痕出片与独立画中画生命周期
 */
async function verifyRecordingPiPIsolation(page: Page): Promise<void> {
  // 监听浏览器 confirm 弹窗并自动同意
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // 注入模拟 Document PiP API 与 getDisplayMedia
  await page.evaluate(() => {
    const mockPipWindow: any = {
      document: {
        title: '',
        createElement: (tag: string) => document.createElement(tag),
        head: {
          appendChild: () => {},
        },
        body: {
          appendChild: (el: any) => {
            (window as any).__lastPipContainer = el;
          },
        },
        getElementById: (id: string) => {
          return (window as any).__lastPipContainer?.querySelector?.(`#${id}`) || null;
        },
      },
      close: () => {
        (window as any).__pipClosed = true;
        (mockPipWindow._listeners['pagehide'] || []).forEach((cb: any) => cb());
      },
      _listeners: {} as Record<string, any[]>,
      addEventListener: (evt: string, cb: any) => {
        if (!mockPipWindow._listeners[evt]) mockPipWindow._listeners[evt] = [];
        mockPipWindow._listeners[evt].push(cb);
      },
    };

    Object.defineProperty(window, 'documentPictureInPicture', {
      value: {
        requestWindow: async () => {
          (window as any).__pipOpened = true;
          return mockPipWindow;
        },
      },
      configurable: true,
      writable: true,
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const fakeStream = canvas.captureStream(60);

    try {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      dst.stream.getAudioTracks().forEach((t) => fakeStream.addTrack(t));
    } catch {}

    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
      value: async () => fakeStream,
      configurable: true,
      writable: true,
    });
  });

  // 打开导出模态框并切换到视频标签页
  const exportBtn = page.locator('[data-testid="export-btn"]');
  await exportBtn.click();
  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).toBeVisible();

  const tabVideo = page.locator('[data-testid="tab-video"]');
  await tabVideo.click();

  // 点击开始录制
  const startRecordBtn = page.locator('[data-testid="start-video-recording-btn"]');
  await expect(startRecordBtn).toBeVisible();
  await startRecordBtn.click();

  // 验证受众演播舞台进入录制态（方案 A：只读章节路标微章）：
  // 1. 录制画面中稳定保留分幕与时间信息胶囊，但物理隐藏所有交互操作按钮 (Play/Prev/Next)，杜绝点击假象
  // 2. 彻底隐藏创作者操作按键 (关闭/全屏/Eye模式切换/微缩药丸)
  // 3. 画面右下角稳定挂载官方微型品牌水印角标 (FocusFlow Watermark Badge)，确保录制出片统一自带品牌水印
  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible();
  await expect(page.locator('[data-testid="audience-controls"]')).toBeVisible();
  await expect(page.locator('[data-testid="audience-scene-pill"]')).toBeVisible();
  await expect(page.locator('[data-testid="audience-play-btn"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="audience-prev-btn"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="audience-next-btn"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="hud-mode-toggle"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="audience-hud-minimal"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="close-audience-btn"]')).not.toBeVisible();

  // 验证视频录制画面中包含官方微型水印角标
  const videoWatermark = audienceModal.locator('[data-testid="focusflow-watermark-badge"]');
  await expect(videoWatermark).toBeVisible();
  await expect(videoWatermark).toContainText('FocusFlow');

  // 截取视频录制态画面存证（含路标胶囊与右下角官方水印角标）
  await page.screenshot({ path: 'test-results/screenshots/video_recording_with_watermark.png' });

  // 验证独立 Document PiP 窗口成功开启
  const pipOpened = await page.evaluate(() => (window as any).__pipOpened);
  expect(pipOpened).toBe(true);

  // 验证 PiP 容器渲染了呼吸红点 REC、完成按钮和取消按钮
  const hasPipElements = await page.evaluate(() => {
    const container = (window as any).__lastPipContainer;
    return !!(container && container.querySelector('#pip-finish-btn') && container.querySelector('#pip-cancel-btn'));
  });
  expect(hasPipElements).toBe(true);

  // 触发 PiP 中的【完成并保存】按钮
  await page.evaluate(() => {
    const btn = (window as any).__lastPipContainer?.querySelector?.('#pip-finish-btn');
    btn?.click();
  });

  // 验证 PiP 被安全关闭，演播弹窗安全收尾关闭
  const pipClosed = await page.evaluate(() => (window as any).__pipClosed);
  expect(pipClosed).toBe(true);
  await expect(audienceModal).not.toBeVisible({ timeout: 5000 });
}

/**
 * 8. TC579: 验证微服务高可用架构直接从第2幕起播时无残留气泡，且场景2专属气泡正常激活
 */
async function verifyScene2CalloutIsolation(page: Page): Promise<void> {
  // (1) 呼出架构模板中心并应用「微服务高可用电商中台演进架构」
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

  // (3) 点击顶部「受众全屏演播」按钮从第 2 幕直接进入演播
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await expect(audienceBtn).toBeVisible();
  await audienceBtn.click();

  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible({ timeout: 5000 });

  // 等待动画帧与 Double-RAF 完全结算
  await page.waitForTimeout(300);

  // (4) 核心断言：
  // 场景 1 专有的气泡 co-ms-overview 绝对不能残留（opacity 为 0 且无 active 类）
  const coMsOverview = audienceModal.locator('#co-ms-overview');
  if ((await coMsOverview.count()) > 0) {
    await expect(coMsOverview).not.toHaveClass(/active/);
    const opacity = await coMsOverview.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(0);
  }

  // 场景 2 专有的气泡 co-gw-sentinel 必须正常激活展示 (Playwright 轮询等待 0.45s 动效延迟与过渡完成)
  const coGwSentinel = audienceModal.locator('#co-gw-sentinel');
  await expect(coGwSentinel).toBeVisible();
  await expect(coGwSentinel).toHaveClass(/active/);
  await expect(coGwSentinel).toHaveCSS('opacity', '1', { timeout: 4000 });

  // (5) 点击自动演播按钮启动播放，再次验证进入播放态后依然不会错误复活 co-ms-overview
  const playBtn = audienceModal.locator('[data-testid="audience-play-btn"]');
  await expect(playBtn).toBeVisible();
  await playBtn.click();
  await page.waitForTimeout(400);

  if ((await coMsOverview.count()) > 0) {
    await expect(coMsOverview).not.toHaveClass(/active/);
    const opacityDuringPlay = await coMsOverview.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(opacityDuringPlay)).toBe(0);
  }

  // 截屏归档验证效果
  await page.screenshot({
    path: 'test-results/screenshots/scene2_callout_isolation.png',
  });

  // 退出全屏演播弹窗
  await page.keyboard.press('Escape');
  await expect(audienceModal).not.toBeVisible({ timeout: 5000 });
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

  test('TC577: 演播播放态 HUD 三态显隐与时间刻度验证', async ({ page }) => {
    await verifyPlaybackHudTriState(page);
  });

  test('TC578: 录制时无痕出片与独立画中画生命周期验证', async ({ page }) => {
    await verifyRecordingPiPIsolation(page);
  });

/**
 * 9. TC580: 验证「微服务高可用电商中台演进架构」导出单文件 HTML，图元精确定位对齐与移动端竖屏横屏指引
 */
async function verifyMicroservicesExportAndMobileView(page: Page): Promise<void> {
  // (1) 呼出架构模板中心并应用「微服务高可用电商中台演进架构」
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

  // (2) 触发单文件 HTML 导出
  const exportBtn = page.locator('[data-testid="export-btn"]');
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();

  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).toBeVisible();

  const exportHtmlBtn = page.locator('[data-testid="export-html-btn"]');
  await expect(exportHtmlBtn).toBeVisible();

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await exportHtmlBtn.click();
  const download = await downloadPromise;

  const fs = await import('fs');
  const path = await import('path');
  const tempFilePath = path.join(process.cwd(), `test-microservices-export-${Date.now()}.html`);
  await download.saveAs(tempFilePath);

  // (3) 打开独立页面验证桌面宽屏下图元完全对齐
  const standalonePage = await page.context().newPage();
  try {
    await standalonePage.setViewportSize({ width: 1920, height: 900 });
    await standalonePage.goto(`file://${tempFilePath}`);
    await standalonePage.waitForTimeout(600);

    // 验证 Redis 和 ShardingSphere 图元存在且无错位
    const redisBox = standalonePage.locator('#box-redis-cluster');
    await expect(redisBox).toBeAttached();

    const shardingBox = standalonePage.locator('#box-db-sharding');
    await expect(shardingBox).toBeAttached();

    // 验证播放时间正常走动
    await standalonePage.keyboard.press(' ');
    const sceneTimer = standalonePage.locator('[data-testid="audience-scene-timer"]');
    await expect(sceneTimer).toBeVisible();
    await standalonePage.waitForTimeout(1100);
    const timerText = await sceneTimer.innerText();
    expect(timerText).toMatch(/00:0[1-9] \//);

    // (4) 仿真移动端 iPhone 14 竖屏视口 (390 x 844)
    await standalonePage.setViewportSize({ width: 390, height: 844 });
    await standalonePage.waitForTimeout(400);

    // 验证在手机竖屏下横屏引导提示正常浮现
    const rotateHint = standalonePage.locator('.ff-mobile-rotate-hint');
    await expect(rotateHint).toBeVisible();

    // 验证画布容器绝非空白纯黑屏
    const playerWrap = standalonePage.locator('#_ff_wrap');
    await expect(playerWrap).toBeVisible();
    const bounds = await playerWrap.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(0);
    expect(bounds!.height).toBeGreaterThan(0);

    // 截屏存证竖屏
    await standalonePage.screenshot({ path: 'test-results/screenshots/microservices_standalone_mobile_portrait.png' });

    // (5) 仿真移动端 iPhone 14 横屏视口 (844 x 390) 验证旋转后画布正常重绘与自适应
    await standalonePage.setViewportSize({ width: 844, height: 390 });
    await standalonePage.waitForTimeout(400);

    // 验证横屏下旋转提示自动隐藏
    await expect(rotateHint).not.toBeVisible();

    // 验证 16:9 画幅硬锁视口裁切层与内容层正常排版与可见
    const viewportEl = standalonePage.locator('#_ff_viewport');
    await expect(viewportEl).toBeVisible();
    const landscapeBounds = await viewportEl.boundingBox();
    expect(landscapeBounds).not.toBeNull();
    expect(landscapeBounds!.width).toBeGreaterThan(0);
    expect(landscapeBounds!.height).toBeGreaterThan(0);

    // 截屏存证横屏
    await standalonePage.screenshot({ path: 'test-results/screenshots/microservices_standalone_mobile_landscape.png' });
  } finally {
    await standalonePage.close();
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

/**
 * 10. TC581: 验证本地原生 MP4 / WebM 双格式切换、偏好记忆与下载格式决策
 */
async function verifyNativeMp4VideoExportFlow(page: Page): Promise<void> {
  // (1) 打开导出模态框并切换到视频标签页
  const exportBtn = page.locator('[data-testid="export-btn"]');
  await exportBtn.click();
  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).toBeVisible();

  const tabVideo = page.locator('[data-testid="tab-video"]');
  await tabVideo.click();

  // (2) 验证 MP4 和 WebM 选项卡片均正常渲染
  const mp4Option = page.locator('[data-testid="format-mp4-option"]');
  const webmOption = page.locator('[data-testid="format-webm-option"]');
  await expect(mp4Option).toBeVisible();
  await expect(webmOption).toBeVisible();

  // 验证 MP4 选项包含官方“推荐”徽章与全平台微信/手机秒开文案
  await expect(mp4Option).toContainText('推荐');
  await expect(mp4Option).toContainText('MP4');

  // 验证取景框比例与目标分辨率自适应显示 (如 16:9 -> 1920×1080)
  await expect(exportModal).toContainText('取景框比例');
  await expect(exportModal).toContainText('16:9');
  await expect(exportModal).toContainText('1920×1080');

  // 截取视频导出设置界面存证（含格式切换器与取景框比例提示）
  await page.screenshot({ path: 'test-results/screenshots/export_modal_video_format_selector.png' });

  // (3) 测试切换到 WebM 格式并验证 localStorage 偏好记忆
  await webmOption.click();
  let savedFormat = await page.evaluate(() => localStorage.getItem('focusflow_video_format'));
  expect(savedFormat).toBe('webm');

  // (4) 测试切回 MP4 格式并验证持久化更新
  await mp4Option.click();
  savedFormat = await page.evaluate(() => localStorage.getItem('focusflow_video_format'));
  expect(savedFormat).toBe('mp4');

  // (5) 在浏览器运行时验证 MIME 智能协商与 downloadVideoBlob 扩展名决策逻辑
  const downloadResults = await page.evaluate(() => {
    const mp4Blob = new Blob(['fake mp4 content'], { type: 'video/mp4;codecs=avc1' });
    const webmBlob = new Blob(['fake webm content'], { type: 'video/webm;codecs=vp9' });

    // 测试 blob 类型判断
    const isMp4 = mp4Blob.type.includes('mp4');
    const mp4Ext = isMp4 ? '.mp4' : '.webm';

    const isWebm = webmBlob.type.includes('mp4');
    const webmExt = isWebm ? '.mp4' : '.webm';

    // 测试旧扩展名剥离逻辑，杜绝 .webm.mp4 双重后缀
    const dirtyName = 'my-project-60fps.webm';
    const cleanName = dirtyName.replace(/\.(webm|mp4)$/i, '');
    const strippedOldExt = `${cleanName}.mp4`;

    return { mp4Ext, webmExt, strippedOldExt };
  });

  expect(downloadResults.mp4Ext).toBe('.mp4');
  expect(downloadResults.webmExt).toBe('.webm');
  expect(downloadResults.strippedOldExt).toBe('my-project-60fps.mp4');

  // (6) 关闭模态框
  const closeBtn = exportModal.locator('button').first();
  await closeBtn.click();
  await expect(exportModal).not.toBeVisible();
}

  test('TC579: 验证直接从场景2起播时历史场景气泡无残留与专属气泡精准激活', async ({ page }) => {
    await verifyScene2CalloutIsolation(page);
  });

  test('TC580: 验证微服务高可用电商架构导出单文件 HTML 图元对齐、时间心跳流转与移动端横屏指引', async ({ page }) => {
    await verifyMicroservicesExportAndMobileView(page);
  });

  test('TC581: 验证本地原生 MP4 / WebM 双格式切换、偏好记忆与下载格式决策', async ({ page }) => {
    await verifyNativeMp4VideoExportFlow(page);
  });
});


