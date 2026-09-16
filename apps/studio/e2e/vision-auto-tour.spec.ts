import { test, expect, Page } from '@playwright/test';

const DUMMY_ASSET_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGqBUGAAY7CQE9+t5CAAAAAElFTkSuQmCC';

const MOCK_MODEL_VISION_OUTPUT = {
  projectTitle: 'Global Microservices Cloud Architecture',
  boxes: [
    {
      id: 'box-ingress',
      x: 120,
      y: 100,
      width: 600,
      height: 260,
      label: 'Edge Envoy Gateway',
    },
    {
      id: 'box-services',
      x: 120,
      y: 420,
      width: 600,
      height: 280,
      label: 'Core Microservices Engine',
    },
  ],
  callouts: [
    {
      id: 'callout-1',
      targetBoxId: 'box-ingress',
      x: 350,
      y: 80,
      title: 'Edge Ingress Routing',
      desc: 'BGP Anycast routing with TLS 1.3 termination and rate limiting.',
    },
  ],
  scenes: [
    {
      id: 'scene-0',
      title: '01 Enterprise Architecture Panorama',
      duration: 4500,
      voiceoverScript: 'Panoramic overview of the edge ingress and microservices cluster.',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      focusBoxIds: ['box-ingress', 'box-services'],
    },
    {
      id: 'scene-1',
      title: '02 Edge Gateway Ingress Deep Dive',
      duration: 5000,
      voiceoverScript: 'Incoming requests are authenticated and throttled at the edge.',
      camera: { zoom: 1.85, x: -12.5, y: -20.0, duration: 1.4 },
      focusBoxIds: ['box-ingress'],
    },
  ],
};

/**
 * 1. 验证未配置 API Key 时，模式 2 按钮处于禁用状态并给出指引
 */
async function verifyMode2DisabledWhenNoKey(page: Page): Promise<void> {
  // Clear any existing vault storage
  await page.addInitScript(() => {
    localStorage.removeItem('focusflow_ai_providers_vault');
    localStorage.removeItem('focusflow_vision_llm_settings');
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  const mode2Card = modal.locator('[data-testid="mode-vision-llm-card"]');
  await expect(mode2Card).toBeVisible();
  await expect(mode2Card).toContainText('未配置 API Key');

  // 按钮处于禁用态
  const mode2Btn = mode2Card.locator('button');
  await expect(mode2Btn).toBeDisabled();
  await expect(mode2Btn).toContainText('未配置 API Key');

  // 点击配置按钮可打开设置弹窗
  await mode2Card.locator('[data-testid="open-vision-settings-btn"]').click();
  const settingsModal = page.locator('[data-testid="vision-llm-settings-modal"]');
  await expect(settingsModal).toBeVisible();

  // 关闭设置弹窗与主弹窗
  await settingsModal.getByRole('button', { name: '取消' }).click();
  await expect(settingsModal).not.toBeVisible();
  await modal.locator('button:has-text("关闭")').click();
  await expect(modal).not.toBeVisible();
}

/**
 * 2. 验证配置有效 Key 后，模式 2 按钮被正确解冻激活
 */
async function verifyMode2ActivatedWhenKeyConfigured(page: Page): Promise<void> {
  // 注入已就绪的凭据
  await page.addInitScript(() => {
    localStorage.setItem(
      'focusflow_ai_providers_vault',
      JSON.stringify({
        gemini: {
          apiKey: 'AIzaSyValidGeminiKeyDemo123',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
      })
    );
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  const mode2Card = modal.locator('[data-testid="mode-vision-llm-card"]');
  await expect(mode2Card).toContainText('已就绪');
  await expect(mode2Card).toContainText('gemini-3.8-flash');

  // 模式 2 生成按钮已激活
  const generateBtn = modal.locator('[data-testid="generate-vision-tour-btn"]');
  await expect(generateBtn).toBeVisible();
  await expect(generateBtn).toBeEnabled();
  await expect(generateBtn).toContainText('一键视觉大模型生成');

  await modal.locator('button:has-text("关闭")').click();
  await expect(modal).not.toBeVisible();
}

/**
 * 3. 验证端到端执行视觉大模型导览生成、覆盖确认与 Cmd+Z 撤销
 */
async function verifyVisionTourExecutionAndUndo(page: Page): Promise<void> {
  // 注入已就绪的凭据
  await page.addInitScript(() => {
    localStorage.setItem(
      'focusflow_ai_providers_vault',
      JSON.stringify({
        gemini: {
          apiKey: 'AIzaSyValidGeminiKeyDemo123',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
      })
    );
  });

  // Mock Gemini 视觉大模型返回真实架构分析 JSON
  await page.route('**/models/*:generateContent*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: `\`\`\`json\n${JSON.stringify(MOCK_MODEL_VISION_OUTPUT)}\n\`\`\``,
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 280,
          candidatesTokenCount: 350,
          totalTokenCount: 630,
        },
      }),
    });
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  // 点击一键视觉大模型生成
  const generateBtn = modal.locator('[data-testid="generate-vision-tour-btn"]');
  await generateBtn.click();

  // 校验覆盖二次确认提示
  const warning = modal.locator('[data-testid="auto-tour-overwrite-warning"]');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('当前工程已有设计内容');

  // 点击确认覆盖生成
  const confirmBtn = modal.locator('[data-testid="confirm-overwrite-btn"]');
  await confirmBtn.click();

  // 弹窗关闭，且弹出成功 Toast
  await expect(modal).not.toBeVisible();
  const successToast = page.getByText(/视觉大模型成功生成/);
  await expect(successToast).toBeVisible();

  // 验证时间轴第一幕与第二幕标题更新为模型生成的架构标题
  const firstScene = page.locator('[data-testid^="scene-card-"]').first();
  await expect(firstScene).toBeVisible();
  await expect(firstScene).toContainText('01 Enterprise Architecture Panorama');

  const secondScene = page.locator('[data-testid^="scene-card-"]').nth(1);
  await expect(secondScene).toBeVisible();
  await expect(secondScene).toContainText('02 Edge Gateway Ingress Deep Dive');

  // 验证撤销还原 (Undo)
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  await expect(undoBtn).toBeEnabled();
  await undoBtn.click();

  // 恢复至初始 5 幕标杆工程
  const restoredScenes = page.locator('[data-testid^="scene-card-"]');
  await expect(restoredScenes).toHaveCount(5);
}

/**
 * 4. 验证接口异常时提示错误，并提供一键降级方案 A 兜底入口
 */
async function verifyVisionTourErrorAndFallbackToMode1(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'focusflow_ai_providers_vault',
      JSON.stringify({
        gemini: {
          apiKey: 'AIzaSyExpiredKey',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
      })
    );
  });

  // Mock Gemini 接口报错 401 Unauthorized
  await page.route('**/models/*:generateContent*', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: 'API key not valid. Please pass a valid API key.',
          status: 'UNAUTHENTICATED',
        },
      }),
    });
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  // 点击生成并确认覆盖
  await modal.locator('[data-testid="generate-vision-tour-btn"]').click();
  await modal.locator('[data-testid="confirm-overwrite-btn"]').click();

  // 验证弹出带有「切换为本地启发式生成」兜底操作与「复制错误信息」的错误 Toast
  const errorToast = page.getByText(/视觉大模型生成失败/);
  await expect(errorToast).toBeVisible();

  // 验证复制错误按钮存在，且可点击复制
  const copyBtn = page.locator('[data-testid="copy-error-btn"]');
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();

  // 验证弹出复制成功反馈 Toast
  const copiedToast = page.getByText(/已复制错误信息到剪贴板/);
  await expect(copiedToast).toBeVisible();

  const fallbackBtn = page.getByText('⚡ 切换为本地启发式生成 (方案 A)');
  await expect(fallbackBtn).toBeVisible();

  // 点击兜底按钮
  await fallbackBtn.click();

  // 验证成功切换并执行方案 A 启发式生成
  const heuristicToast = page.getByText(/已成功生成 4 幕电影级导览/);
  await expect(heuristicToast).toBeVisible();
}

/**
 * 5. 验证英文环境下视觉导览弹窗与提示零中文残留
 */
async function verifyVisionTourEnglishLocalization(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('focusflow_locale', 'en');
    localStorage.setItem(
      'focusflow_ai_providers_vault',
      JSON.stringify({
        gemini: {
          apiKey: 'AIzaSyEnglishKey123',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        },
      })
    );
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="open-auto-tour-btn"]');
  await page.locator('[data-testid="open-auto-tour-btn"]').click();

  const modal = page.locator('[data-testid="auto-tour-modal"]');
  await expect(modal).toBeVisible();

  // 验证模式 2 标题与按钮为英文
  const mode2Card = modal.locator('[data-testid="mode-vision-llm-card"]');
  await expect(mode2Card).toContainText('Ready (Shared gemini · gemini-3.8-flash)');

  const generateBtn = modal.locator('[data-testid="generate-vision-tour-btn"]');
  await expect(generateBtn).toContainText('Generate with Vision LLM');

  // 断言整个卡片无任何残留中文
  const mode2CardText = await mode2Card.innerText();
  expect(mode2CardText).not.toMatch(/[\u4e00-\u9fa5]/);

  await modal.locator('button:has-text("Close")').click();
  await expect(modal).not.toBeVisible();
}

// 主测试套件：遵循用户规范，it() / test() 块调用抽离的 async 函数
test.describe('Phase 3: Vision LLM Auto-Tour UI Integration & State Machine Suite', () => {
  test('TC701: verify mode 2 button disabled when no api key configured', async ({ page }) => {
    await verifyMode2DisabledWhenNoKey(page);
  });

  test('TC702: verify mode 2 button activated and ready when key configured', async ({ page }) => {
    await verifyMode2ActivatedWhenKeyConfigured(page);
  });

  test('TC703: verify end-to-end vision auto-tour execution and cmd+z undo restoration', async ({
    page,
  }) => {
    await verifyVisionTourExecutionAndUndo(page);
  });

  test('TC704: verify vision api error handling and fallback to heuristic tour', async ({
    page,
  }) => {
    await verifyVisionTourErrorAndFallbackToMode1(page);
  });

  test('TC705: verify pure english localization in vision tour modal and actions', async ({
    page,
  }) => {
    await verifyVisionTourEnglishLocalization(page);
  });
});
