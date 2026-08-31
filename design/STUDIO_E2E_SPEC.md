# 🧪 FocusFlow Studio · E2E 端到端测试用例矩阵与规范总览

> **规范定义**：本项目所有 Playwright E2E 测试用例必须遵循 **“用例逻辑 100% 抽离为独立的 async helper 函数，并在 `it()` / `test()` 块中纯净调用”** 的全局原则。  
> **文档定位**：本文件为 FocusFlow Studio 全阶段端到端测试用例的唯一权威台账。后续新增任何测试用例均需同步在此追加并维护。

---

## 📊 总体用例统计看板

| 阶段 / 模块 | 测试套件文件 | 用例数 | 状态 | 抽离函数规范 |
| :--- | :--- | :---: | :---: | :---: |
| **Stage 1: 工作台布局与基础交互** | `apps/studio/e2e/workbench.spec.ts` | 5 | ✅ 100% Pass | ✅ 独立 Async Helper |
| **Stage 2: 资产解析与本地持久化** | `apps/studio/e2e/stage2-ingestion-storage.spec.ts` | 4 | ✅ 100% Pass | ✅ 独立 Async Helper |
| **Stage 3: 可视化取景与标定工具** | `apps/studio/e2e/stage3-visual-tools.spec.ts` | 5 | ✅ 100% Pass | ✅ 独立 Async Helper |
| **Stage 4: 场景编排与不可变历史栈** | `apps/studio/e2e/stage4-timeline-history.spec.ts` | 5 | ✅ 100% Pass | ✅ 独立 Async Helper |
| **Stage 5: 离线编译打包与演播模式** | `apps/studio/e2e/stage5-export-compiler.spec.ts` | 4 | ✅ 100% Pass | ✅ 独立 Async Helper |
| **合计** | **5 个 Spec 文件** | **23** | **✅ 全部通过** | **100% 规范遵循** |

---

## 📑 23 项全量测试用例详细台账 (Test Cases Inventory)

### 🎨 Stage 1: 工作台布局、主题与基础交互
**测试套件文件**：[`apps/studio/e2e/workbench.spec.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/workbench.spec.ts)

| 用例 ID | 测试名称 | 对应独立异步函数 | 核心测试步骤与断言逻辑 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **TC01** | 验证五栏响应式工作台核心容器全部正常挂载 | `verifyWorkbenchLayoutMounted` | 1. 验证 `header` 全局控制台挂载<br/>2. 验证 `[data-testid="toolbox"]` 左侧工具栏可见<br/>3. 验证 `[data-testid="canvas-viewport"]` 视口可见<br/>4. 验证 `[data-testid="inspector"]` 属性面板可见<br/>5. 验证 `[data-testid="timeline"]` 场景时间轴可见 | ✅ Passed |
| **TC02** | 验证 Dark / Light 双主题响应式切换 | `verifyThemeToggleBehavior` | 1. 验证默认 `html` 包含 `.dark` 类<br/>2. 点击主题切换按钮，断言移除 `.dark`<br/>3. 再次点击，断言恢复 `.dark` 并持久化 | ✅ Passed |
| **TC03** | 验证中英双语动态切换无闪烁 | `verifyLanguageSwitchingBehavior` | 1. 初始为中文（断言出现“导出独立 HTML”、“添加新场景”）<br/>2. 点击语言切换按钮，断言无缝变为英文（“Export Standalone HTML”、“Add Scene”）<br/>3. 再次点击切回中文 | ✅ Passed |
| **TC04** | 验证左侧 5 大标定工具激活切换 | `verifyToolSelectionBehavior` | 1. 依次切换选择抓手、矩形选框、贝塞尔连线工具<br/>2. 断言被激活按钮带有高亮背景类 `bg-cyan-500`，未激活按钮样式正常清除 | ✅ Passed |
| **TC05** | 验证底部时间轴场景选择与新增场景 | `verifySceneTimelineNavigation` | 1. 断言初始包含 2 个场景卡片<br/>2. 点击第 2 个场景，断言卡片带有 `border-cyan-500` 选中态<br/>3. 点击“添加新场景”，断言卡片总数递增为 3 | ✅ Passed |

---

### 🖼️ Stage 2: 资产解析、模板中心与本地持久化
**测试套件文件**：[`apps/studio/e2e/stage2-ingestion-storage.spec.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage2-ingestion-storage.spec.ts)

| 用例 ID | 测试名称 | 对应独立异步函数 | 核心测试步骤与断言逻辑 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **TC201** | 验证资产导入弹窗打开与 Tab 交互 | `verifyImageUploadModalInteraction` | 1. 点击 TopBar 导入资产按钮<br/>2. 断言 `image-upload-modal` 弹出<br/>3. 测试本地文件上传与远程 URL 导入 Tab 切换<br/>4. 测试输入框可见性与弹窗正常关闭 | ✅ Passed |
| **TC202** | 验证模板中心 6 大模板分类切换与一键应用 | `verifyTemplatesModalAndApplication` | 1. 打开模板中心弹窗<br/>2. 验证 LuxeHMS 与微服务中台等经典模板存在<br/>3. 点击“酒店 & 调度系统”分类过滤<br/>4. 点击“应用此模板创建工程”，断言弹窗关闭且 TopBar 标题更新为 LuxeHMS | ✅ Passed |
| **TC203** | 验证本地工程管理器打开与搜索过滤 | `verifyProjectManagerModalOperations` | 1. 点击 TopBar 我的项目按钮<br/>2. 断言 `project-manager-modal` 弹出<br/>3. 在搜索框中输入过滤关键字<br/>4. 验证列表动态过滤响应并关闭弹窗 | ✅ Passed |
| **TC204** | 验证项目标题修改与防抖保存持久化 | `verifyAutoSaveAndDraftPersistence` | 1. 点击 TopBar 项目标题进入内联编辑模式<br/>2. 输入新项目标题并回车提交<br/>3. 验证标题实时同步更新并触发 IndexedDB 防抖存盘 | ✅ Passed |

---

### 🛠️ Stage 3: 可视化取景与 4 大图元标定工具链
**测试套件文件**：[`apps/studio/e2e/stage3-visual-tools.spec.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage3-visual-tools.spec.ts)

| 用例 ID | 测试名称 | 对应独立异步函数 | 核心测试步骤与断言逻辑 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **TC301** | 验证镜头取景框可视化与一键捕获当前视口视角 | `verifyCameraFrustumAndCapture` | 1. 验证 `[data-testid="camera-frustum-frame"]` 取景框正常渲染<br/>2. 点击“捕获当前画布视角”按钮<br/>3. 断言触发运镜参数回填并在右侧检查器生效 | ✅ Passed |
| **TC302** | 验证智能选框工具激活与拖拽绘制 | `verifyBoxDrawingOverlay` | 1. 激活矩形选框工具<br/>2. 在画布上模拟鼠标按下拖拽创建选框<br/>3. 断言图元数据自动注入 DSL `elements.boxes` | ✅ Passed |
| **TC303** | 验证 8 向锚点捕捉与三次贝塞尔连线图层 | `verifyPathDrawingOverlay` | 1. 激活贝塞尔连线工具<br/>2. 捕捉起始图元与目标图元锚点并释放<br/>3. 断言生成平滑三次贝塞尔曲线 SVG 路径并在检查器呈现 | ✅ Passed |
| **TC304** | 验证脉冲定位圆点与解说气泡放置交互 | `verifyDotAndCalloutOverlay` | 1. 激活脉冲圆点工具并在画布点击放置<br/>2. 激活气泡工具并在指定坐标放置解说卡片<br/>3. 断言气泡与圆点图元正确写入当前场景 | ✅ Passed |
| **TC305** | 验证属性检查器图元状态切换与交互 | `verifyInspectorElementToggles` | 1. 在右侧检查器展开“当前场景图元”面板<br/>2. 切换图元可见性开关与高亮状态<br/>3. 验证检查器与画布图元状态实时双向绑定 | ✅ Passed |

---

### 🎬 Stage 4: 场景卡片流编排与不可变历史栈
**测试套件文件**：[`apps/studio/e2e/stage4-timeline-history.spec.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage4-timeline-history.spec.ts)

| 用例 ID | 测试名称 | 对应独立异步函数 | 核心测试步骤与断言逻辑 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **TC401** | 验证时间轴场景卡片添加、复制与删除 | `verifySceneTimelineCRUD` | 1. 点击“添加新场景”，断言卡片增加<br/>2. 点击卡片悬浮“复制副本”按键，验证克隆场景插入<br/>3. 点击“删除场景”按键，验证场景卡片正确移除 | ✅ Passed |
| **TC402** | 验证场景标题双击内联编辑与实时同步 | `verifySceneTitleInlineEditing` | 1. 双击第 1 个场景卡片标题文本激活 input<br/>2. 修改为“01 核心网关拓扑”并回车<br/>3. 断言卡片与右侧检查器标题输入框同步更新 | ✅ Passed |
| **TC403** | 验证 TopBar 撤销与重做时间旅行 | `verifyUndoRedoButtonsAndKeyboard` | 1. 执行新增场景动作<br/>2. 点击 TopBar 撤销按钮，断言恢复上一快照<br/>3. 点击重做按钮，断言重做恢复变更 | ✅ Passed |
| **TC404** | 验证图层可见性矩阵与上一幕图元状态继承 | `verifyLayerInheritance` | 1. 切换至第 2 个场景<br/>2. 点击检查器中的“继承上一幕全部图元”按钮<br/>3. 断言当前场景的 `activeElements` 自动同步上一幕图元 | ✅ Passed |
| **TC405** | 验证演播控制条播放、暂停与上一幕/下一幕切换 | `verifyPlaybackControls` | 1. 点击底部控制条“播放”按钮，断言变为暂停态<br/>2. 再次点击暂停<br/>3. 点击上一幕/下一幕按钮，断言当前高亮场景索引联动切换 | ✅ Passed |

---

### 📦 Stage 5: 离线编译器、ZIP 归档与演播模式
**测试套件文件**：[`apps/studio/e2e/stage5-export-compiler.spec.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage5-export-compiler.spec.ts)

| 用例 ID | 测试名称 | 对应独立异步函数 | 核心测试步骤与断言逻辑 | 状态 |
| :--- | :--- | :--- | :--- | :---: |
| **TC501** | 验证多功能导出中心模态框呼出与选项卡切换 | `verifyExportModalOpenAndTabs` | 1. 点击 TopBar 导出按钮呼出 `export-modal`<br/>2. 切换独立 HTML、ZIP 归档包、客户端视频录制三大选项卡<br/>3. 断言各选项卡内容面板与导出按键正常渲染 | ✅ Passed |
| **TC502** | 验证纯前端单文件独立 HTML 编译与下载触发 | `verifyStandaloneHtmlExportTrigger` | 1. 打开导出弹窗并选择 HTML 选项卡<br/>2. 监听浏览器原生 `download` 事件并点击导出<br/>3. 断言生成并下载以 `.html` 结尾的单文件自包含包 | ✅ Passed |
| **TC503** | 验证纯前端 ZIP 工程归档打包与下载触发 | `verifyZipProjectExportTrigger` | 1. 打开导出弹窗并切换至 ZIP 选项卡<br/>2. 监听下载事件并点击立即下载<br/>3. 断言生成并下载以 `.zip` 结尾的工程压缩归档包 | ✅ Passed |
| **TC504** | 验证受众全屏演播模式呼出、翻页与退出 | `verifyAudienceModeFullscreen` | 1. 点击 TopBar 演播按钮呼出 `AudienceModal`<br/>2. 验证 100vw × 100vh 真实受众演示容器与顶部进度胶囊渲染<br/>3. 点击右上角关闭按钮或按 ESC，断言演示模式平滑退出 | ✅ Passed |

---

## 📈 后续新增用例维护规范

当后续开发阶段（如 Stage 6 数据库协同、Stage 7 BFF 认证、Stage 8 云端渲染等）引入新测试时，请遵循以下流程：
1. 在 `apps/studio/e2e/` 对应的 `spec.ts` 文件中，编写语义明确的独立 `async function verifyXxx(...)`；
2. 在 `test('TCxxx: ...', async ({ page }) => { await verifyXxx(page); })` 内部调用；
3. 将新增用例登记于本文档对应阶段表格中，保持用例编号唯一递增。

---

## 🕒 测试报告生成与多版本时间戳归档规范

### 1. 测试报告查看与格式
Playwright 在每次执行后均会自动输出交互式 HTML 可视化报告与结构化 JSON 数据：
- **HTML 报告入口**：`apps/studio/playwright-report/index.html`
- **JSON 数据源**：`apps/studio/playwright-report/test-results.json`
- **本地可视化预览**：
  ```bash
  pnpm --filter @focusflow/studio test:e2e:report
  ```

### 2. 多版本时间戳归档机制 (Timestamped Archiving)
为满足历史测试轨迹留存、版本发布追溯与审计需求，系统提供了自动打时间戳的报告归档工具：
```bash
# 执行测试后，将当前报告完整复制并打上精确时间戳归档
pnpm --filter @focusflow/studio test:e2e:archive
```
- **归档路径格式**：`apps/studio/playwright-reports/report-YYYY-MM-DDTHH-mm-ss-sssZ/`
- **归档内容**：完整包含当前测试批次的 `index.html`、失败截图、Trace 链路与 JSON 汇总数据，互不覆盖，永久可查。

### 3. Git 版本控制策略与工程规范
- **禁止提交测试报告与结果文件**：`playwright-report/`、`playwright-reports/` 和 `test-results/` 属于测试运行时产生的瞬态中间产物（Ephemeral Artifacts），包含大量二进制快照与 Trace 追踪，频繁提交会导致 Git 仓库严重膨胀。
- **已配置 `.gitignore` 规则**：
  ```gitignore
  # Playwright Test Reports & Artifacts
  playwright-report/
  playwright-reports/
  test-results/
  ```
- **CI/CD 发布实践**：在自动化构建流水线中，通过 GitHub Actions 的 `actions/upload-artifact` 步骤提取报告，或直接发布至内网静态监控看板，源码仓库仅保持核心代码与本台账文档的纯净。

---
*FocusFlow Quality & E2E Testing Working Group · 2026.08*

