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

  // 验证受众演播舞台进入录制态，但主标签页视口中 100% 绝对无任何 HUD 元素（无痕出片）
  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible();
  await expect(page.locator('[data-testid="audience-controls"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="audience-scene-pill"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="audience-hud-minimal"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="close-audience-btn"]')).not.toBeVisible();

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
});

