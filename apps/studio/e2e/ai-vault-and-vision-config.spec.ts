import { test, expect, Page } from '@playwright/test';
import {
  getAllProviderCredentials,
  getProviderCredentials,
  setProviderCredentials,
  purgeAllCredentials,
  VAULT_STORAGE_KEY,
} from '../src/services/ai/aiProviderVault';
import {
  getStoredVisionConfig,
  saveStoredVisionConfig,
  getEffectiveVisionCredentials,
  VISION_PRESETS,
} from '../src/services/autoTour/visionLLMConfigStore';
import {
  getStoredTTSConfig,
  saveStoredTTSConfig,
  TTS_PRESETS,
} from '../src/services/audio/tts/ttsConfigStore';
import { testAIProviderConnection } from '../src/services/ai/aiConnectivityTester';

/**
 * 1. 验证通用 AI 凭据库 (aiProviderVault) 的存储、继承与一键物理抹除
 */
async function verifyAIVaultStorageAndPurge(): Promise<void> {
  // Clear any existing storage
  purgeAllCredentials();

  // Initially empty
  const credsGemini = getProviderCredentials('gemini');
  expect(credsGemini.apiKey).toBe('');

  // Set Gemini credentials
  setProviderCredentials('gemini', {
    apiKey: 'AIzaSyTestGeminiKey123',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  });

  const updatedGemini = getProviderCredentials('gemini');
  expect(updatedGemini.apiKey).toBe('AIzaSyTestGeminiKey123');
  expect(updatedGemini.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');

  // Purge all credentials
  purgeAllCredentials();
  const purgedGemini = getProviderCredentials('gemini');
  expect(purgedGemini.apiKey).toBe('');
}

/**
 * 2. 验证 AI 提词 (TTS) 与视觉导览 (Vision) 的凭据双向互通与模型解耦
 */
async function verifyTTSAndVisionKeySharingAndModelDecoupling(): Promise<void> {
  purgeAllCredentials();

  // Step 1: User saves an OpenAI key in TTS settings
  saveStoredTTSConfig({
    preset: 'openai',
    apiKey: 'sk-proj-testOpenAITTSKey999',
    model: 'tts-1-hd',
  });

  // Step 2: Check shared vault
  const vaultOpenAI = getProviderCredentials('openai');
  expect(vaultOpenAI.apiKey).toBe('sk-proj-testOpenAITTSKey999');

  // Step 3: Check Vision LLM config - with inheritKeyFromVault (default true), it automatically inherits the key
  saveStoredVisionConfig({
    provider: 'openai',
    inheritKeyFromVault: true,
    model: 'gpt-4o',
  });

  const effectiveVision = getEffectiveVisionCredentials();
  expect(effectiveVision.apiKey).toBe('sk-proj-testOpenAITTSKey999');
  expect(effectiveVision.model).toBe('gpt-4o');
  expect(effectiveVision.isKeyReady).toBe(true);
  expect(effectiveVision.isInherited).toBe(true);

  // Step 4: Verify models are specialized and decoupled
  const ttsConfig = getStoredTTSConfig();
  const visionConfig = getStoredVisionConfig();
  expect(ttsConfig.model).toBe('tts-1-hd'); // Audio model
  expect(visionConfig.model).toBe('gpt-4o'); // Vision model
  expect(ttsConfig.model).not.toBe(visionConfig.model);

  // Clean up
  purgeAllCredentials();
}

/**
 * 3. 验证连通性测试探针 (aiConnectivityTester) 逻辑与空值校验
 */
async function verifyConnectivityTesterLogic(): Promise<void> {
  // Test 1: Empty API key should immediately return error without network call
  const emptyRes = await testAIProviderConnection({
    provider: 'gemini',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  });
  expect(emptyRes.ok).toBe(false);
  expect(emptyRes.error).toContain('API Key is empty');

  // Test 2: Whitespace-only API key
  const whitespaceRes = await testAIProviderConnection({
    provider: 'openai',
    apiKey: '   ',
    baseUrl: 'https://api.openai.com/v1',
  });
  expect(whitespaceRes.ok).toBe(false);
  expect(whitespaceRes.error).toContain('API Key is empty');
}

/**
 * 4. 验证在 Studio UI 中打开视觉设置弹窗并完成配置与连通性交互
 */
async function verifyVisionSettingsModalInUI(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Open Auto Tour Modal from Topbar
  const autoTourBtn = page.locator('[data-testid="open-auto-tour-btn"]');
  await expect(autoTourBtn).toBeVisible({ timeout: 5000 });
  await autoTourBtn.click();

  // Auto Tour Modal is now open
  const autoTourModal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(autoTourModal).toBeVisible();

  // Mode 2 Card should be visible
  const mode2Card = page.locator('[data-testid="mode-vision-llm-card"]');
  await expect(mode2Card).toBeVisible();

  // Click Configure Model & Key button
  const configBtn = page.locator('[data-testid="open-vision-settings-btn"]');
  await expect(configBtn).toBeVisible();
  await configBtn.click();

  // Vision Settings Modal should be visible
  const visionModal = page.locator('[data-testid="vision-llm-settings-modal"]');
  await expect(visionModal).toBeVisible();

  // Switch between providers
  const geminiBtn = page.locator('[data-testid="vision-provider-gemini"]');
  const openaiBtn = page.locator('[data-testid="vision-provider-openai"]');
  await expect(geminiBtn).toBeVisible();
  await expect(openaiBtn).toBeVisible();

  await openaiBtn.click();
  const apiKeyInput = page.locator('[data-testid="vision-api-key-input"]');
  await expect(apiKeyInput).toBeVisible();
  await apiKeyInput.fill('sk-test-playwright-vision-key-888');

  // Save and close
  const saveBtn = page.locator('[data-testid="vision-save-btn"]');
  await saveBtn.click();

  // Modal should be closed
  await expect(visionModal).not.toBeVisible();

  // Verify Mode 2 card shows ready status
  await expect(mode2Card).toContainText('已就绪');
}

/**
 * 5. Verify VisionLLMSettingsModal in English mode has zero Chinese characters across all tabs and options
 */
async function verifyVisionSettingsModalEnglishLocalization(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('focusflow_locale', 'en');
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const autoTourModal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(autoTourModal).toBeVisible();

  // Open Vision Settings Modal
  await page.locator('[data-testid="open-vision-settings-btn"]').click();
  const visionModal = page.locator('[data-testid="vision-llm-settings-modal"]');
  await expect(visionModal).toBeVisible();

  // Verify modal body text contains zero Chinese characters
  const modalText = await visionModal.innerText();
  expect(modalText).not.toMatch(/[\u4e00-\u9fa5]/);

  // Verify Gemini options contain zero Chinese
  const geminiOptions = await page.locator('[data-testid="vision-model-select"] option').allInnerTexts();
  for (const opt of geminiOptions) {
    expect(opt).not.toMatch(/[\u4e00-\u9fa5]/);
  }

  // Switch to OpenAI and verify options
  await page.locator('[data-testid="vision-provider-openai"]').click();
  const openaiOptions = await page.locator('[data-testid="vision-model-select"] option').allInnerTexts();
  for (const opt of openaiOptions) {
    expect(opt).not.toMatch(/[\u4e00-\u9fa5]/);
  }

  // Switch to SiliconFlow and verify options
  await page.locator('[data-testid="vision-provider-siliconflow"]').click();
  const sfOptions = await page.locator('[data-testid="vision-model-select"] option').allInnerTexts();
  for (const opt of sfOptions) {
    expect(opt).not.toMatch(/[\u4e00-\u9fa5]/);
  }

  // Switch to Custom and verify options
  await page.locator('[data-testid="vision-provider-custom"]').click();
  const customOptions = await page.locator('[data-testid="vision-model-select"] option').allInnerTexts();
  for (const opt of customOptions) {
    expect(opt).not.toMatch(/[\u4e00-\u9fa5]/);
  }

  // Verify custom model toggle text
  const customToggleBtn = page.getByRole('button', { name: 'Enter Custom Model ID' });
  await expect(customToggleBtn).toBeVisible();
  await customToggleBtn.click();
  await expect(page.locator('[data-testid="vision-custom-model-input"]')).toBeVisible();
  const selectPresetBtn = page.getByRole('button', { name: 'Select Preset Model' });
  await expect(selectPresetBtn).toBeVisible();

  // Save updated screenshot to artifacts directory for inspection
  await visionModal.screenshot({
    path: '/Users/xt/.gemini/antigravity-cli/brain/39760395-6d6e-42f7-b904-0fdf569233e1/vision_settings_en_preview.png',
  });

  // Cancel and close
  await visionModal.getByRole('button', { name: 'Cancel' }).click();
  await expect(visionModal).not.toBeVisible();
}

// Playwright test block declarations
test.describe('Phase 1: Unified AI Provider Vault & Vision LLM Settings', () => {
  test('1. should verify AI vault credentials storage, update and purge', async () => {
    await verifyAIVaultStorageAndPurge();
  });

  test('2. should verify TTS and Vision key sharing and model decoupling', async () => {
    await verifyTTSAndVisionKeySharingAndModelDecoupling();
  });

  test('3. should verify connectivity tester logic and parameter validation', async () => {
    await verifyConnectivityTesterLogic();
  });

  test('4. should interact with VisionLLMSettingsModal in Studio UI', async ({ page }) => {
    await verifyVisionSettingsModalInUI(page);
  });

  test('5. should verify VisionLLMSettingsModal has zero Chinese characters in English locale', async ({
    page,
  }) => {
    await verifyVisionSettingsModalEnglishLocalization(page);
  });
});
