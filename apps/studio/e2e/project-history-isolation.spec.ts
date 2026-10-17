import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    __PROJECT_STORE__: any;
    __STORAGE_STORE__: any;
  }
}

/**
 * 1. 验证工程切换后历史栈彻底清空，撤销按钮禁用 (TC-HIST-01)
 */
async function verifyProjectSwitchResetsHistory(page: Page): Promise<void> {
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  const addSceneBtn = page.locator('[data-testid="add-scene-btn"]');

  await expect(addSceneBtn).toBeVisible();
  await expect(undoBtn).toBeVisible();

  // 1. 初始状态下撤销按钮应为禁用
  await expect(undoBtn).toBeDisabled();

  // 2. 在当前工程 (Project A) 中添加一个新场景，确认触发历史入栈
  await addSceneBtn.click();
  await expect(undoBtn).toBeEnabled();

  const pastLengthA = await page.evaluate(() => window.__PROJECT_STORE__.getState().past.length);
  expect(pastLengthA).toBeGreaterThanOrEqual(1);

  // 3. 模拟切换至工程 B (Project B)
  const projectBId = await page.evaluate(async () => {
    const storage = window.__STORAGE_STORE__.getState();
    const currentDSL = window.__PROJECT_STORE__.getState().dsl;
    const projectBDSL = {
      ...currentDSL,
      meta: {
        ...currentDSL.meta,
        title: 'Project B Isolation Test',
      },
      scenes: [currentDSL.scenes[0]], // 仅保留 1 幕
    };
    const bId = await storage.createProject('Project B Isolation Test', projectBDSL);
    const recordB = await storage.openProject(bId);
    if (recordB?.dsl) {
      window.__PROJECT_STORE__.getState().loadProjectDSL(recordB.id, recordB.dsl);
    }
    return bId;
  });

  // 4. 断言：工程 B 加载后撤销按钮必须立刻恢复禁用 (past.length === 0)
  await expect(undoBtn).toBeDisabled();
  const pastLengthB = await page.evaluate(() => window.__PROJECT_STORE__.getState().past.length);
  expect(pastLengthB).toBe(0);

  const activeIdB = await page.evaluate(() => window.__PROJECT_STORE__.getState().activeProjectId);
  expect(activeIdB).toBe(projectBId);

  // 5. 模拟键盘快捷键 ⌘Z / Ctrl+Z，确认不会撤回工程 A 的历史
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');

  // 6. 断言：撤销依然禁用，工程 B 未被回滚为工程 A
  await expect(undoBtn).toBeDisabled();
  const currentTitle = await page.evaluate(() => window.__PROJECT_STORE__.getState().dsl.meta.title);
  expect(currentTitle).toBe('Project B Isolation Test');
}

/**
 * 2. 验证跨工程防覆写安全熔断门禁 (TC-HIST-02)
 */
async function verifyAntiOverwriteSafetyGate(page: Page): Promise<void> {
  // 1. 创建并持久化工程 X
  const projectXId = await page.evaluate(async () => {
    const storage = window.__STORAGE_STORE__.getState();
    const currentDSL = window.__PROJECT_STORE__.getState().dsl;
    const xDSL = {
      ...currentDSL,
      meta: { ...currentDSL.meta, title: 'Project X Protected' },
    };
    return await storage.createProject('Project X Protected', xDSL);
  });

  // 2. 创建并持久化工程 Y
  const projectYId = await page.evaluate(async () => {
    const storage = window.__STORAGE_STORE__.getState();
    const currentDSL = window.__PROJECT_STORE__.getState().dsl;
    const yDSL = {
      ...currentDSL,
      meta: { ...currentDSL.meta, title: 'Project Y Original' },
    };
    return await storage.createProject('Project Y Original', yDSL);
  });

  // 3. 正常载入工程 Y
  await page.evaluate(async (yId) => {
    const storage = window.__STORAGE_STORE__.getState();
    const recordY = await storage.openProject(yId);
    if (recordY?.dsl) {
      window.__PROJECT_STORE__.getState().loadProjectDSL(recordY.id, recordY.dsl);
    }
  }, projectYId);

  // 4. 模拟极端故障场景：Store 的 activeProjectId 人为篡改为 projectXId，但 Storage 的 currentProjectId 为 projectYId
  await page.evaluate((xId) => {
    window.__PROJECT_STORE__.setState({ activeProjectId: xId, isDirty: true });
  }, projectXId);

  // 等待 800ms 跨越 500ms 自动存盘防抖窗口
  await page.waitForTimeout(800);

  // 5. 校验工程 Y 在 IndexedDB 中的原始数据未被意外篡改
  const projectYRecord = await page.evaluate(async (yId) => {
    const storage = window.__STORAGE_STORE__.getState();
    return await storage.openProject(yId);
  }, projectYId);

  expect(projectYRecord?.title).toBe('Project Y Original');
  expect(projectYRecord?.dsl.meta.title).toBe('Project Y Original');
}

/**
 * 3. 验证模板套用与新图导入后零历史隔离 (TC-HIST-03)
 */
async function verifyTemplateAndImportCleanState(page: Page): Promise<void> {
  const undoBtn = page.locator('[data-testid="undo-btn"]');
  await expect(undoBtn).toBeVisible();

  // 1. 在当前工程做一次修改使其可撤销
  const addSceneBtn = page.locator('[data-testid="add-scene-btn"]');
  await addSceneBtn.click();
  await expect(undoBtn).toBeEnabled();

  // 2. 模拟从模板中心载入模板工程
  await page.evaluate(async () => {
    const storage = window.__STORAGE_STORE__.getState();
    const projectStore = window.__PROJECT_STORE__.getState();
    const templateDSL = {
      ...projectStore.dsl,
      meta: { ...projectStore.dsl.meta, title: 'Microservices Architecture Demo' },
    };
    const newId = await storage.createProject('Microservices Architecture Demo', templateDSL);
    projectStore.loadProjectDSL(newId, templateDSL);
  });

  // 3. 断言：套用模板后历史栈彻底清空，撤销按钮禁用
  await expect(undoBtn).toBeDisabled();
  const pastCount = await page.evaluate(() => window.__PROJECT_STORE__.getState().past.length);
  expect(pastCount).toBe(0);

  const isDirty = await page.evaluate(() => window.__PROJECT_STORE__.getState().isDirty);
  expect(isDirty).toBe(false);

  // 4. 在模板工程内新增一个操作，确认仅对当前工程内产生历史
  await addSceneBtn.click();
  await expect(undoBtn).toBeEnabled();

  // 5. 点击撤销，确认只撤销在模板工程内的操作，不会穿透到上一工程
  await undoBtn.click();
  await expect(undoBtn).toBeDisabled();
  const titleAfterUndo = await page.evaluate(() => window.__PROJECT_STORE__.getState().dsl.meta.title);
  expect(titleAfterUndo).toBe('Microservices Architecture Demo');
}

// 主测试套件编排
test.describe('FocusFlow Studio Project History Isolation & Safety Suite (RFC 42)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('TC-HIST-01: 工程切换后历史栈彻底清空，撤销按钮禁用', async ({ page }) => {
    await verifyProjectSwitchResetsHistory(page);
  });

  test('TC-HIST-02: 跨工程防覆写安全熔断门禁拦截', async ({ page }) => {
    await verifyAntiOverwriteSafetyGate(page);
  });

  test('TC-HIST-03: 模板套用与新图导入后零历史隔离', async ({ page }) => {
    await verifyTemplateAndImportCleanState(page);
  });
});
