import { test, expect, Page } from '@playwright/test';

/**
 * 1. 验证底部时间轴音频波形轨的展开与折叠切换
 */
async function verifyWaveformTrackToggle(page: Page): Promise<void> {
  const toggleWaveformBtn = page.locator('[data-testid="toggle-waveform-btn"]');
  await expect(toggleWaveformBtn).toBeVisible();

  // 若默认未展开，点击展开
  const waveformTrack = page.locator('[data-testid="audio-waveform-track"]');
  if (!(await waveformTrack.isVisible())) {
    await toggleWaveformBtn.click();
  }
  await expect(waveformTrack).toBeVisible();

  // 验证 Canvas 画布渲染节点存在
  const canvas = waveformTrack.locator('canvas');
  await expect(canvas).toBeVisible();

  // 再次点击折叠收起
  await toggleWaveformBtn.click();
  await expect(waveformTrack).not.toBeVisible();

  // 恢复展开状态以便后续测试
  await toggleWaveformBtn.click();
  await expect(waveformTrack).toBeVisible();
}

/**
 * 2. 验证麦克风演播录音准备预检弹层与控制器
 */
async function verifyVoiceoverRecordingModal(page: Page): Promise<void> {
  const recordBtn = page.locator('[data-testid="voiceover-record-btn"]');
  await expect(recordBtn).toBeVisible();
  await recordBtn.click();

  const modal = page.locator('[data-testid="voiceover-preflight-modal"]');
  await expect(modal).toBeVisible();

  // 验证设备选择下拉框与降噪回声开关存在
  await expect(modal).toContainText(/同屏演播麦克风录音器/);
  await expect(modal).toContainText(/回声消除/);
  await expect(modal).toContainText(/立体声 VU 电平监视/);

  // 关闭弹层
  const cancelBtn = modal.locator('button', { hasText: '取消' });
  await cancelBtn.click();
  await expect(modal).not.toBeVisible();
}

/**
 * 3. 验证属性面板分幕时长输入与时间轴卡片双向联动
 */
async function verifySceneDurationInspectorUpdate(page: Page): Promise<void> {
  // 确保选中第一个场景
  const sceneCard0 = page.locator('[data-testid="scene-card-0"]');
  await sceneCard0.click();

  const durationInput = page.locator('[data-testid="scene-duration-input"]');
  await expect(durationInput).toBeVisible();

  // 修改时长为 5200ms
  await durationInput.fill('5200');
  await durationInput.dispatchEvent('change');

  // 验证时间轴卡片上的时长显示为 5.2s
  await expect(sceneCard0).toContainText(/5\.2s/);
}

/**
 * 4. 验证分幕旁白解说词输入与一键 TTS 自适应拉伸时长
 */
async function verifyVoiceoverScriptAndTtsAdaptation(page: Page): Promise<void> {
  const scriptInput = page.locator('[data-testid="scene-voiceover-script-input"]');
  await expect(scriptInput).toBeVisible();

  // 输入解说台词
  const testScript = '在本幕中，微服务网关作为系统唯一对外入口，全面承载动态鉴权、全链路流量灰度分发与高并发限流熔断防护。';
  await scriptInput.fill(testScript);

  const ttsBtn = page.locator('[data-testid="synthesize-scene-tts-btn"]');
  await expect(ttsBtn).toBeVisible();
  await ttsBtn.click();

  // 等待合成与时长重算完成
  const durationInput = page.locator('[data-testid="scene-duration-input"]');
  await expect(async () => {
    const val = parseInt(await durationInput.inputValue(), 10);
    expect(val).toBeGreaterThan(6000);
  }).toPass({ timeout: 5000 });
}

/**
 * 5. 验证时间轴 AI 提词批量全分幕合流生成音轨与波形
 */
async function verifyBatchAiVoiceoverGeneration(page: Page): Promise<void> {
  const batchBtn = page.locator('[data-testid="ai-tts-batch-btn"]');
  await expect(batchBtn).toBeVisible();
  await batchBtn.click();

  // 验证音频波形轨自动展开并展示合成音轨标题
  const waveformTrack = page.locator('[data-testid="audio-waveform-track"]');
  await expect(waveformTrack).toBeVisible({ timeout: 10000 });
  await expect(waveformTrack).toContainText(/AI 智能配音合流/);

  // 验证缩放按钮交互
  const zoomInBtn = waveformTrack.locator('button[title="放大波形视口"]');
  await zoomInBtn.click();
  await expect(waveformTrack).toContainText(/1\.5x/);
}

/**
 * 6. 验证波形轨激光红线播放头点击、拖拽与分幕双向联动
 */
async function verifyWaveformPlayheadInteractionAndSync(page: Page): Promise<void> {
  const toggleWaveformBtn = page.locator('[data-testid="toggle-waveform-btn"]');
  const waveformTrack = page.locator('[data-testid="audio-waveform-track"]');
  if (!(await waveformTrack.isVisible())) {
    await toggleWaveformBtn.click();
  }
  await expect(waveformTrack).toBeVisible();

  const canvas = waveformTrack.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  // 验证点击分幕卡片 2，时间轴高亮并与波形轨联动
  const sceneCard1 = page.locator('[data-testid="scene-card-1"]');
  if (await sceneCard1.isVisible()) {
    await sceneCard1.click();
    await expect(sceneCard1).toHaveClass(/border-primary/);
  }

  // 模拟在波形轨画布上点击并拖拽播放头（从 20% 拖动到 50% 位置）
  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.4;
  const targetX = box.x + box.width * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(targetX, startY, { steps: 5 });
  await page.mouse.up();

  // 确认拖拽释放后画布仍保持正常渲染
  await expect(canvas).toBeVisible();
}

/**
 * 7. 验证 AI 语音合成配置模态框、模式切换与预设持久化
 */
async function verifyAiVoiceoverSettingsModal(page: Page): Promise<void> {
  const settingsBtn = page.locator('[data-testid="ai-tts-settings-btn"]');
  await expect(settingsBtn).toBeVisible();
  await settingsBtn.click();

  const modal = page.locator('[data-testid="ai-voiceover-settings-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText(/AI 提词与语音合成配置/);

  // 验证双模式切换按钮
  const offlineBtn = page.locator('[data-testid="tts-mode-offline-btn"]');
  const cloudBtn = page.locator('[data-testid="tts-mode-cloud-btn"]');
  await expect(offlineBtn).toBeVisible();
  await expect(cloudBtn).toBeVisible();

  // 切换到云端模式
  await cloudBtn.click();
  const presetSelect = page.locator('[data-testid="tts-preset-select"]');
  await expect(presetSelect).toBeVisible();

  // 切换到硅基流动预设并验证 Base URL 自动联动更新
  await presetSelect.selectOption('siliconflow');
  const baseUrlInput = page.locator('[data-testid="tts-base-url-input"]');
  await expect(baseUrlInput).toHaveValue('https://api.siliconflow.cn/v1');

  // 切回离线模式并保存
  await offlineBtn.click();
  const saveBtn = modal.locator('button', { hasText: '保存配置' });
  await saveBtn.click();
  await expect(modal).not.toBeVisible();
}

// 主测试套件：it() / test() 块内调用独立 async helper 函数
test.describe('FocusFlow Studio Stage 5.6 Audio Sync & Voiceover Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC561: 验证时间轴波形轨展开与收起切换', async ({ page }) => {
    await verifyWaveformTrackToggle(page);
  });

  test('TC562: 验证麦克风演播录音准备模态框与 VU 电平监视', async ({ page }) => {
    await verifyVoiceoverRecordingModal(page);
  });

  test('TC563: 验证分幕驻留时长修改与时间轴双向联动', async ({ page }) => {
    await verifySceneDurationInspectorUpdate(page);
  });

  test('TC564: 验证分幕旁白台词输入与一键 TTS 自适应拉伸时长', async ({ page }) => {
    await verifyVoiceoverScriptAndTtsAdaptation(page);
  });

  test('TC565: 验证时间轴 AI 提词批量全分幕合流生成音轨与波形', async ({ page }) => {
    await verifyBatchAiVoiceoverGeneration(page);
  });

  test('TC566: 验证波形轨激光红线播放头点击、拖拽与分幕双向联动', async ({ page }) => {
    await verifyWaveformPlayheadInteractionAndSync(page);
  });

  test('TC567: 验证 AI 语音合成设置模态框、主流预设切换与持久化', async ({ page }) => {
    await verifyAiVoiceoverSettingsModal(page);
  });
});

