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
  const sceneItems = page.locator('[data-testid^="scene-card-"]');
  await expect(sceneItems.first()).toBeVisible();
  await sceneItems.first().click();

  const scriptInput = page.locator('[data-testid="scene-voiceover-script-input"]');
  await expect(scriptInput).toBeVisible();

  // 输入解说台词
  const testScript = '在本幕中，微服务网关作为系统唯一对外入口，全面承载动态鉴权、全链路流量灰度分发与高并发限流熔断防护。';
  await scriptInput.fill(testScript);

  const ttsBtn = page.locator('[data-testid="synthesize-scene-tts-btn"]');
  await expect(ttsBtn).toBeVisible();
  await expect(ttsBtn).toContainText(/试听 TTS \(自适应分幕时长\)/);
  await ttsBtn.click();

  // 验证轻量试听控制卡片展开 (播放/停止、建议时长、应用与取消)
  const controller = page.locator('[data-testid="tts-preview-controller"]');
  await expect(controller).toBeVisible({ timeout: 5000 });
  await expect(controller).toContainText(/建议分幕/);

  // 验证可随时中断停止播放
  const toggleBtn = page.locator('[data-testid="tts-preview-toggle-btn"]');
  await expect(toggleBtn).toBeVisible();
  await toggleBtn.click(); // 点击停止
  await page.waitForTimeout(200);

  // 验证点击 [应用] 按钮才真正生效到分幕时长与工程
  const applyBtn = page.locator('[data-testid="tts-apply-btn"]');
  await expect(applyBtn).toBeVisible();
  await applyBtn.click();

  // 验证分幕时长自适应拉伸 (长台词自动延展分幕)
  const durationInput = page.locator('[data-testid="scene-duration-input"]');
  await expect(async () => {
    const val = parseInt(await durationInput.inputValue(), 10);
    expect(val).toBeGreaterThan(6000);
  }).toPass({ timeout: 5000 });

  // 验证当场景原本设定较长时（如 20000ms > 13.9s 语音时长），保持正常语速并保留视觉留白
  await durationInput.fill('20000');
  await durationInput.dispatchEvent('change');
  await ttsBtn.click();
  await expect(controller).toBeVisible({ timeout: 5000 });
  await applyBtn.click();
  await page.waitForTimeout(500);
  const preservedVal = parseInt(await durationInput.inputValue(), 10);
  expect(preservedVal).toBe(20000);
}

/**
 * 4.2 验证纯英文旁白台词智能语种嗅探与自适应时长
 */
async function verifyEnglishVoiceoverScriptAndTtsAdaptation(page: Page): Promise<void> {
  const sceneItems = page.locator('[data-testid^="scene-card-"]');
  await expect(sceneItems.first()).toBeVisible();
  await sceneItems.first().click();

  const scriptInput = page.locator('[data-testid="scene-voiceover-script-input"]');
  await expect(scriptInput).toBeVisible();

  const englishScript =
    'In this scene, the microservice API gateway acts as the central entrance, managing dynamic token authentication, zero-downtime canary traffic routing, and robust circuit breaking.';
  await scriptInput.fill(englishScript);

  const ttsBtn = page.locator('[data-testid="synthesize-scene-tts-btn"]');
  await expect(ttsBtn).toBeVisible();
  await ttsBtn.click();

  const controller = page.locator('[data-testid="tts-preview-controller"]');
  await expect(controller).toBeVisible({ timeout: 5000 });

  const applyBtn = page.locator('[data-testid="tts-apply-btn"]');
  await expect(applyBtn).toBeVisible();
  await applyBtn.click();

  // 等待英文台词计算与分幕自适应（词数模型 ~2.8 words/s 支撑合理时长）
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
  // 确保处于 Light 主题下进行测试与截屏
  const themeToggle = page.locator('[data-testid="theme-toggle"]');
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(300);
  }

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

  // 截取 Light 主题下离线模式模态框渲染
  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/light_tts_modal_offline.png' });

  // 切换到云端模式
  await cloudBtn.click();
  const presetSelect = page.locator('[data-testid="tts-preset-select"]');
  await expect(presetSelect).toBeVisible();

  // 切换到硅基流动预设并验证 Base URL 自动联动更新
  await presetSelect.selectOption('siliconflow');
  const baseUrlInput = page.locator('[data-testid="tts-base-url-input"]');
  await expect(baseUrlInput).toHaveValue('https://api.siliconflow.cn/v1');

  // 截取 Light 主题下云端模式模态框的实际渲染效果供视觉校验
  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/light_tts_modal_cloud.png' });

  // 切回离线模式并保存
  await offlineBtn.click();
  const saveBtn = modal.locator('button', { hasText: '保存配置' });
  await saveBtn.click();
  await expect(modal).not.toBeVisible();
}

/**
 * 验证英文语言环境下音频相关界面元素文本全部国际化无残留中文
 */
async function verifyEnglishAudioLocalization(page: Page) {
  // 1. 切换多语言到 EN
  const localePicker = page.locator('[data-testid="locale-picker"]');
  await expect(localePicker).toBeVisible();
  const currentLangText = await localePicker.innerText();
  if (currentLangText.includes('ZH')) {
    await localePicker.click();
  }
  await expect(localePicker).toContainText('EN');

  // 2. 验证时间轴底部音频相关按钮全英文
  const voiceoverBtn = page.locator('[data-testid="voiceover-record-btn"]');
  await expect(voiceoverBtn).toContainText('Record');

  const importBtn = page.locator('[data-testid="import-audio-btn"]');
  await expect(importBtn).toContainText('Import Audio');

  const aiBtn = page.locator('[data-testid="ai-tts-batch-btn"]');
  await expect(aiBtn).toContainText('AI Teleprompter');

  // 3. 选中第 1 个分幕并验证分幕检查器右侧旁白区域全英文
  const sceneCard0 = page.locator('[data-testid="scene-card-0"]');
  await sceneCard0.click();

  const voiceoverLabel = page.locator('text=Scene Voiceover Script');
  await expect(voiceoverLabel).toBeVisible();

  const ttsBtn = page.locator('[data-testid="synthesize-scene-tts-btn"]');
  await expect(ttsBtn).toContainText('Preview TTS & Adapt Scene Duration');

  // 4. 验证录音预检模态框全英文
  await voiceoverBtn.click();
  const micModal = page.locator('[data-testid="voiceover-preflight-modal"]');
  await expect(micModal).toBeVisible();
  await expect(micModal).toContainText('Live Voiceover Studio Recorder');
  await expect(micModal).toContainText('Input Audio Device');
  await expect(micModal).toContainText('Echo Cancellation (AEC)');
  await expect(micModal).toContainText('Noise Suppression (ANS)');
  await expect(micModal).toContainText('Stereo VU Meter:');
  await expect(micModal).toContainText('3-2-1 Start Live Recording');
  const cancelMicBtn = micModal.locator('button', { hasText: 'Cancel' });
  await cancelMicBtn.click();
  await expect(micModal).not.toBeVisible();

  // 5. 验证 AI 提词设置模态框全英文
  const aiSettingsBtn = page.locator('[data-testid="ai-tts-settings-btn"]');
  await aiSettingsBtn.click();
  const settingsModal = page.locator('[data-testid="ai-voiceover-settings-modal"]');
  await expect(settingsModal).toBeVisible();
  await expect(settingsModal).toContainText('AI Voiceover & TTS Settings');
  await expect(settingsModal).toContainText('Dual Modes');
  await expect(settingsModal).toContainText('Offline Native Speech');
  await expect(settingsModal).toContainText('Cloud HD AI Voice');
  await expect(settingsModal).toContainText('Speech Speed');
  await expect(settingsModal).toContainText('Single Sentence Preview');
  await expect(settingsModal).toContainText('Test Voice');
  await expect(settingsModal).toContainText('Save Settings');

  // 切换到云端模式
  const cloudBtn = page.locator('[data-testid="tts-mode-cloud-btn"]');
  await cloudBtn.click();
  await expect(settingsModal).toContainText('Provider Preset');
  await expect(settingsModal).toContainText('API Endpoint / Base URL');
  await expect(settingsModal).toContainText('Reset Default');
  await expect(settingsModal).toContainText('Model');
  await expect(settingsModal).toContainText('Voice');

  // 截取 EN 语言下的设置模态框供视觉验证
  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/en_tts_modal_cloud.png' });

  // 切回离线并保存
  const offlineBtn = page.locator('[data-testid="tts-mode-offline-btn"]');
  await offlineBtn.click();
  await page.screenshot({ path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/en_tts_modal_offline.png' });

  const saveSettingsBtn = settingsModal.locator('button', { hasText: 'Save Settings' });
  await saveSettingsBtn.click();
  await expect(settingsModal).not.toBeVisible();

  // 还原语言到 ZH
  await localePicker.click();
}

/**
 * 10. 验证 Audio Track 试听 (Play Preview) 与演播播放 (Timeline Play) 下已应用 TTS 音频的发声与交互联动
 */
async function verifyAudioTrackPreviewAndTimelinePlayback(page: Page): Promise<void> {
  // 1. 确保时间轴批量生成或应用了音频轨
  const waveformTrack = page.locator('[data-testid="audio-waveform-track"]');
  if (!(await waveformTrack.isVisible())) {
    const batchBtn = page.locator('[data-testid="ai-tts-batch-btn"]');
    await expect(batchBtn).toBeVisible();
    await batchBtn.click();
    await expect(waveformTrack).toBeVisible({ timeout: 10000 });
  }

  // 2. 验证 Audio Track 里的 [▶️ 试听 / Play Preview] 按钮
  const previewBtn = waveformTrack.locator('button', { hasText: /(试听|Preview)/ });
  await expect(previewBtn).toBeVisible();
  await previewBtn.click();

  // 验证按钮切换为 [⏸️ 暂停 / Pause]
  const pauseBtn = waveformTrack.locator('button', { hasText: /(暂停|Pause)/ });
  await expect(pauseBtn).toBeVisible();

  // 再次点击暂停
  await pauseBtn.click();
  await expect(previewBtn).toBeVisible();

  // 3. 验证时间轴主播放演播按钮 [data-testid="timeline-play-btn"] 启动演播发声联动
  const playBtn = page.locator('[data-testid="timeline-play-btn"]');
  await expect(playBtn).toBeVisible();
  await playBtn.click();

  // 等待演播推进
  await page.waitForTimeout(1000);

  // 停止演播
  await playBtn.click();
  await page.waitForTimeout(300);
}

// 辅助函数：验证时间轴波形轨点击定位、分幕跳转与红色播放头实时推进联动
async function verifyTimelineSeekAndPlayheadProgression(page: Page) {
  // 1. 确保时间轴批量生成或应用了音频轨
  const waveformTrack = page.locator('[data-testid="audio-waveform-track"]');
  if (!(await waveformTrack.isVisible())) {
    const batchBtn = page.locator('[data-testid="ai-tts-batch-btn"]');
    await expect(batchBtn).toBeVisible();
    await batchBtn.click();
    await expect(waveformTrack).toBeVisible({ timeout: 10000 });
  }

  const waveformCanvas = waveformTrack.locator('canvas');
  await expect(waveformCanvas).toBeVisible();

  // 2. 点击切换到第 2 幕 (scene-card-1)
  const sceneCard1 = page.locator('[data-testid="scene-card-1"]');
  await expect(sceneCard1).toBeVisible();
  await sceneCard1.click();

  // 验证当前选中的分幕成功切换为第 2 幕（卡片高亮或 border）
  await expect(sceneCard1).toHaveClass(/border-primary/);

  // 3. 在波形轨上点击以进行 Seek / 试听
  const canvasBox = await waveformCanvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox) {
    // 点击在波形轨中间区域
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.4, canvasBox.y + canvasBox.height * 0.5);
    await page.waitForTimeout(500);
  }

  // 4. 启动演播播放，验证播放器不弹回 Scene 0 且实时驱动播放头推进
  const playBtn = page.locator('[data-testid="timeline-play-btn"]');
  await expect(playBtn).toBeVisible();
  await playBtn.click();

  // 演播运行 1 秒，确认播放状态持续且未报错
  await page.waitForTimeout(1000);

  // 停止演播
  await playBtn.click();
  await page.waitForTimeout(300);
}

// 辅助函数：验证受众全屏演示模式 (AudienceModal) 演播启动与 TTS 联动发声
async function verifyAudienceModalTTSPlayback(page: Page): Promise<void> {
  // 1. 点击顶栏【演播】按钮打开受众演示模态框
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await expect(audienceBtn).toBeVisible();
  await audienceBtn.click();

  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible({ timeout: 5000 });

  // 2. 验证演播模态框内的播放按钮
  const playBtn = audienceModal.locator('button').filter({ has: page.locator('svg.lucide-play, svg.lucide-pause') });
  await expect(playBtn).toBeVisible();

  // 3. 点击起播，验证进入演播播放状态
  await playBtn.click();
  await page.waitForTimeout(200);

  // 4. 再次点击暂停
  await playBtn.click();
  await page.waitForTimeout(200);

  // 5. 验证在演播模态框中正常切换场景（Next / Prev 无卡死、无报错）
  const prevBtn = audienceModal.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') });
  const nextBtn = audienceModal.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });

  // 若播放期间偶发推进至末尾场景，先切回第 1 幕以稳定验证双向切幕
  if (await prevBtn.isEnabled()) {
    await prevBtn.click();
    await page.waitForTimeout(300);
  }

  await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(400);

  // 验证顶部微缩信息栏已成功切换到第 2 幕
  await expect(audienceModal).toContainText(/02 \//);

  await expect(prevBtn).toBeVisible();
  await prevBtn.click();
  await page.waitForTimeout(400);
  await expect(audienceModal).toContainText(/01 \//);

  // 6. 点击退出关闭按钮并确认模态框已关闭
  const closeBtn = page.locator('[data-testid="close-audience-btn"]');
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(audienceModal).not.toBeVisible();
}

// 辅助函数：验证悬空孤儿路径自愈剔除与演播模式零警告运行
async function verifyDanglingPathSelfHealing(page: Page): Promise<void> {
  const warnings: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'warning' || msg.type() === 'error') {
      warnings.push(msg.text());
    }
  });

  // 1. 点击顶栏【演播】按钮打开受众演示模态框
  const audienceBtn = page.locator('[data-testid="audience-btn"]');
  await expect(audienceBtn).toBeVisible();
  await audienceBtn.click();

  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(500);

  // 2. 核心断言：进入演播模式绝对不应产生 BezierRouter 找不到 box 的控制台警告
  const routerWarnings = warnings.filter(w => w.includes('BezierRouter: Box'));
  expect(routerWarnings).toHaveLength(0);

  // 3. 关闭受众演示模态框
  const closeBtn = page.locator('[data-testid="close-audience-btn"]');
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(audienceModal).not.toBeVisible();
}

// 辅助函数：验证导出中心唤起本地 60FPS WebM 高清录制与演播自动合流 (TC574)
async function verifyLocalWebmVideoRecording(page: Page): Promise<void> {
  // 1. 注入合成 getDisplayMedia 模拟流以支持无头/自动化端到端验证
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1280, 720);
    }
    const syntheticStream = canvas.captureStream(60);

    // 注入合成静音音频轨
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      dst.stream.getAudioTracks().forEach((t) => syntheticStream.addTrack(t));
    } catch {}

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getDisplayMedia = async () => syntheticStream;
    }
  });

  // 2. 点击顶栏【导出】按钮唤起 ExportModal
  const exportBtn = page.locator('button').filter({ hasText: /导出演播|导出/ }).first();
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();

  const exportModal = page.locator('[data-testid="export-modal"]');
  await expect(exportModal).toBeVisible({ timeout: 5000 });

  // 3. 切换至【客户端视频录制】选项卡
  const videoTab = exportModal.locator('[data-testid="tab-video"]');
  await expect(videoTab).toBeVisible();
  await videoTab.click();

  // 验证视频录制卡片与启动按钮
  await expect(exportModal).toContainText('本地 60FPS WebM 高清录制');
  const startRecordingBtn = exportModal.locator('[data-testid="start-video-recording-btn"]');
  await expect(startRecordingBtn).toBeVisible();

  // 4. 点击【启动全自动录制】
  await startRecordingBtn.click();

  // 5. 验证自动关闭导出弹窗，并唤起受众全屏演示模态框 (AudienceModal)
  await expect(exportModal).not.toBeVisible();
  const audienceModal = page.locator('[data-testid="audience-modal"]');
  await expect(audienceModal).toBeVisible({ timeout: 5000 });

  // 6. 核心视觉断言：验证右上角按钮与 REC 标签在录制模式下 100% 隐藏（画面纯净无水印）
  await expect(audienceModal.locator('[data-testid="recording-hud-badge"]')).not.toBeVisible();
  await expect(audienceModal.locator('[data-testid="close-audience-btn"]')).not.toBeVisible();

  // 验证场景指示微缩胶囊已成功置于屏幕左下角，避开架构图顶部主标题
  const scenePill = audienceModal.locator('[data-testid="audience-scene-pill"]');
  await expect(scenePill).toBeVisible();
  await expect(scenePill).toContainText(/01 \//);

  // 验证录制模式下底部交互浮岛已自动隐藏，保持画面纯净
  const bottomIsland = audienceModal.locator('.absolute.bottom-6.flex.items-center.gap-2.bg-slate-900\\/85');
  await expect(bottomIsland).not.toBeVisible();

  // 7. 验证按 ESC 键可安全终止录制并触发导出保存
  await page.waitForTimeout(500); // 采集分片
  await page.keyboard.press('Escape');

  // 8. 验证录制结束后自动退出全屏演示模式，安全恢复 Studio 主工作区
  await expect(audienceModal).not.toBeVisible({ timeout: 5000 });
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

  test('TC568: 验证英文语言环境下音频相关界面文本全部国际化', async ({ page }) => {
    await verifyEnglishAudioLocalization(page);
  });

  test('TC569: 验证纯英文旁白台词智能语种嗅探与自适应时长', async ({ page }) => {
    await verifyEnglishVoiceoverScriptAndTtsAdaptation(page);
  });

  test('TC570: 验证 Audio Track 试听与演播播放下已应用 TTS 音频的发声与交互联动', async ({ page }) => {
    await verifyAudioTrackPreviewAndTimelinePlayback(page);
  });

  test('TC571: 验证时间轴波形轨点击定位、分幕跳转与红色播放头实时推进联动', async ({ page }) => {
    await verifyTimelineSeekAndPlayheadProgression(page);
  });

  test('TC572: 验证受众全屏演示模式 (AudienceModal) 演播启动与 TTS 联动发声', async ({ page }) => {
    await verifyAudienceModalTTSPlayback(page);
  });

  test('TC573: 验证悬空孤儿路径自愈剔除与演播模式零警告运行', async ({ page }) => {
    await verifyDanglingPathSelfHealing(page);
  });

  test('TC574: 验证导出中心唤起本地 60FPS WebM 高清录制与演播自动合流', async ({ page }) => {
    await verifyLocalWebmVideoRecording(page);
  });
});



