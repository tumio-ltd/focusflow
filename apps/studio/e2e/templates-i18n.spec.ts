import { test, expect, Page } from '@playwright/test';

/**
 * 辅助函数：确保当前界面为英文模式
 */
async function ensureEnglishMode(page: Page): Promise<void> {
  const localeBtn = page.locator('[data-testid="locale-picker"]');
  await expect(localeBtn).toBeVisible();
  const currentText = (await localeBtn.textContent()) || '';
  if (!currentText.includes('EN')) {
    await localeBtn.click();
    await expect(localeBtn).toContainText('EN');
  }
}

/**
 * 1. 验证在英文模式下模板中心弹窗的标题、分类与三大主力标杆模板元数据全部自适应为地道英文
 */
async function verifyEnglishTemplatesModalDisplay(page: Page): Promise<void> {
  await ensureEnglishMode(page);

  // 打开模板中心
  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await openTemplatesBtn.click();

  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();

  // 验证弹窗标题为英文
  await expect(modal.getByRole('heading', { name: 'Architecture Templates Library' })).toBeVisible();

  // 验证分类按钮为英文
  await expect(modal.getByRole('button', { name: 'All Templates' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Microservices' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'AI & LLM RAG' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Streaming & Lakehouse' })).toBeVisible();

  // 验证三大主力标杆模板英文标题渲染
  await expect(modal.getByText('Cloud-Native High-Availability Microservices Topology')).toBeVisible();
  await expect(modal.getByText('Enterprise LLM RAG Pipeline & Semantic Retrieval')).toBeVisible();
  await expect(modal.getByText('Real-Time Lakehouse & Streaming Analytics Topology')).toBeVisible();

  // 验证单语言模板（如酒店 PMS 或 DDD）在英文界面下展示 ZH Only 语言提示徽章
  await expect(modal.getByText('ZH Only').first()).toBeVisible();

  // 关闭弹窗
  const closeBtn = page.locator('[data-testid="close-templates-btn"]');
  await closeBtn.click();
  await expect(modal).toBeHidden();
}

/**
 * 2. 验证多语言模糊搜索支持中英双向全量匹配
 */
async function verifyBilingualSearch(page: Page): Promise<void> {
  await ensureEnglishMode(page);

  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await openTemplatesBtn.click();

  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();

  const searchInput = modal.locator('input[type="text"]');
  await expect(searchInput).toBeVisible();

  // 搜索英文关键字 "Microservices"
  await searchInput.fill('Microservices');
  await expect(modal.locator('[data-testid="template-card-tpl-microservices"]')).toBeVisible();
  await expect(modal.locator('[data-testid="template-card-tpl-ai-rag-pipeline"]')).toBeHidden();

  // 清空后搜索中文关键字 "大模型" (跨语言检索命中 AI RAG 模板)
  await searchInput.fill('大模型');
  await expect(modal.locator('[data-testid="template-card-tpl-ai-rag-pipeline"]')).toBeVisible();
  await expect(modal.locator('[data-testid="template-card-tpl-microservices"]')).toBeHidden();

  // 搜索 "Lakehouse"
  await searchInput.fill('Lakehouse');
  await expect(modal.locator('[data-testid="template-card-tpl-realtime-lakehouse"]')).toBeVisible();
  await expect(modal.locator('[data-testid="template-card-tpl-microservices"]')).toBeHidden();

  // 关闭弹窗
  const closeBtn = page.locator('[data-testid="close-templates-btn"]');
  await closeBtn.click();
  await expect(modal).toBeHidden();
}

/**
 * 3. 验证在英文模式下应用标杆模板后，新工程标题与分幕标题/主台词自动实例化为地道英文
 */
async function verifyEnglishTemplateInstantiation(page: Page): Promise<void> {
  await ensureEnglishMode(page);

  // 打开模板中心并应用微服务标杆模板
  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await openTemplatesBtn.click();

  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();

  // 点击应用微服务标杆模板按键
  const applyBtn = page.locator('[data-testid="apply-template-tpl-microservices"]');
  await applyBtn.click();

  // 弹窗关闭
  await expect(modal).toBeHidden();

  // 验证工作台工程标题已初始化为英文
  const titleSpan = page.locator('[data-testid="project-title-text"]');
  await expect(titleSpan).toHaveText('Cloud-Native High-Availability Microservices Topology');

  // 验证底部时间轴 Scene 1 标题为英文
  const timelineSceneTitle = page.locator('[data-testid="timeline"]').getByText('01 Global Microservices Topology');
  await expect(timelineSceneTitle).toBeVisible();

  // 展开右侧分幕旁白面板并验证提词脚本已实例化为英文
  const voiceoverPanel = page.locator('[data-testid="scene-voiceover-panel"]');
  await expect(voiceoverPanel).toBeVisible();
  const scriptInput = page.locator('[data-testid="scene-voiceover-script-input"]');
  if (!(await scriptInput.isVisible())) {
    await voiceoverPanel.click();
  }
  await expect(scriptInput).toBeVisible();
  await expect(scriptInput).toHaveValue(/Welcome to the FocusFlow/);

  // 验证画布上的 Callout 气泡已自适应为英文
  const calloutBadge = page.locator('.ff-callout .ff-badge');
  await expect(calloutBadge.first()).toHaveText('Microservices E-Commerce Hub');
  const calloutDesc = page.locator('.ff-callout .ff-desc');
  await expect(calloutDesc.first()).toContainText('APISIX Gateway');
}

/**
 * 4. 验证中文模式下应用标杆模板渲染中文 Callout，且支持动态语言切换并以英文为默认兜底
 */
async function verifyCalloutBilingualAndFallback(page: Page): Promise<void> {
  // 确保中文模式
  const localeBtn = page.locator('[data-testid="locale-picker"]');
  await expect(localeBtn).toBeVisible();
  const currentText = (await localeBtn.textContent()) || '';
  if (!currentText.includes('ZH')) {
    await localeBtn.click();
    await expect(localeBtn).toContainText('ZH');
  }

  // 打开模板中心并应用微服务模板
  const openTemplatesBtn = page.locator('[data-testid="open-templates-btn"]');
  await openTemplatesBtn.click();
  const modal = page.locator('[data-testid="templates-modal"]');
  await expect(modal).toBeVisible();
  const applyBtn = page.locator('[data-testid="apply-template-tpl-microservices"]');
  await applyBtn.click();
  await expect(modal).toBeHidden();

  // 验证中文模式下 Callout 渲染中文
  const calloutBadge = page.locator('.ff-callout .ff-badge');
  await expect(calloutBadge.first()).toHaveText('微服务电商中台枢纽');

  // 点击语言切换为英文，验证画布 Callout 无缝切换为英文（且以英文默认 title 兜底）
  await localeBtn.click();
  await expect(localeBtn).toContainText('EN');
  await expect(calloutBadge.first()).toHaveText('Microservices E-Commerce Hub');
}

test.describe('FocusFlow Studio Architecture Templates Multi-language Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 验证英文模式下模板中心弹窗的标题、分类与三大主力标杆模板元数据为英文', async ({ page }) => {
    await verifyEnglishTemplatesModalDisplay(page);
  });

  test('TC02: 验证多语言模糊搜索支持中英双向全量匹配', async ({ page }) => {
    await verifyBilingualSearch(page);
  });

  test('TC03: 验证英文模式下应用标杆模板后，新工程标题与分幕标题/主台词自动实例化为英文', async ({ page }) => {
    await verifyEnglishTemplateInstantiation(page);
  });

  test('TC04: 验证中文模式下应用标杆模板渲染中文 Callout，且支持动态切换至英文并以英文作为兜底', async ({ page }) => {
    await verifyCalloutBilingualAndFallback(page);
  });
});
