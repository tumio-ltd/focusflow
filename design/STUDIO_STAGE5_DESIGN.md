# FocusFlow Studio · Stage 5 详细技术开发设计文档
## 纯前端离线编译、单文件打包与本地视频录制 (Client Compiler, Packager & MediaRecorder)

---

## 1. 架构目标与工程全景 (Objectives & Packaging Pipeline)

Stage 5 是 **FocusFlow Studio 模式 A（离线自治模式）** 的最终工程化交付闭环，核心使命是实现 **100% 浏览器纯前端、零后端依赖、零网络外发** 的高保真成品输出：
1. **纯前端单文件独立 HTML 编译器 (`standalonePackager.ts`)**：
   - 将底图与覆盖图自动光栅化为 Base64 Data URI，并将 DSL 语法树、CSS 视觉样式表、`@focusflow/player` IIFE 核心运行时注入为单个 `.html` 文件；
   - 用户双击即可在任意无网设备（Mac、Windows、Linux、手机平板）的浏览器中流畅 60FPS 演播，具备企业级隐私与离线自治保障。
2. **纯前端 ZIP 工程归档导出器 (`zipExporter.ts`)**：
   - 基于 `jszip` 纯前端内存压缩流水线，生成标准化工程归档包（包含 `config.json`、`assets/` 高清图像、`index.html` 以及 `README.md`）。
3. **沉浸式受众全屏演示模式 (`AudienceModal.tsx`)**：
   - 提供给架构师与讲师在真实讲台演讲前的一键全屏受众视角试播，支持键盘 `←` / `→` / `Space` 翻页、ESC 退出、顶部精简进度条与全屏 API。
4. **纯前端客户端视频录制引擎 (`canvasRecorder.ts`)**：
   - 基于 HTML5 `MediaRecorder` API 与 Canvas/DOM 帧捕获流，实现无水印 60FPS 高清 WebM 视频录制与本地一键下载。
5. **多功能导出控制中心 (`ExportModal.tsx`)**：
   - 集成单文件 HTML 导出、ZIP 工程导出与视频录制三大输出通道，提供格式对比与一键打包下载。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FocusFlow Studio · Stage 5 纯前端编译与导出中枢               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ 1. 单文件 HTML 编译器    │ │ 2. 标准 ZIP 工程归档器   │ │ 3. 客户端高清视频录制器  │
│ - Base64 资产内联        │ │ - JSZip 内存打包         │ │ - MediaRecorder 60FPS    │
│ - Player IIFE 运行时注入 │ │ - config.json DSL 导出   │ │ - 实时录制计时器         │
│ - 0 依赖独立单文件 .html │ │ - assets/ 原始高清素材   │ │ - WebM 本地无损下载      │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
                                         │
                                         ▼
                       ┌───────────────────────────────────┐
                       │   4. 沉浸式受众全屏演播模式        │
                       │   100vw × 100vh 讲台演示 / 键盘翻页│
                       └───────────────────────────────────┘
```

---

## 2. 纯前端单文件独立 HTML 编译器设计 (Standalone HTML Compiler)

### 2.1 编译与注入模板设计 (`standalonePackager.ts`)

单文件编译核心是将所有外部资产打包为自包含的单个 HTML 文档：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title><!-- TITLE --></title>
  <style>
    /* 1. 内联 FocusFlow 核心视觉样式表与霓虹动画 */
    <!-- INLINE_CSS -->
  </style>
</head>
<body class="bg-slate-950 text-slate-100 overflow-hidden select-none m-0 p-0">
  <div id="focusflow-root" style="width: 100vw; height: 100vh; position: relative;"></div>

  <script>
    /* 2. 内联 FocusFlow Player 零依赖 IIFE 运行时 */
    <!-- INLINE_PLAYER_IIFE -->
  </script>

  <script>
    /* 3. 内联工程 DSL 语法树与自动引导逻辑 */
    (function() {
      const dsl = <!-- INLINE_DSL_JSON -->;
      const player = new FocusFlowPlayer({
        container: '#focusflow-root',
        dsl: dsl,
        autoplay: false,
        debug: false
      });
      player.init();
    })();
  </script>
</body>
</html>
```

### 2.2 浏览器端 Blob 下载流水线 (0-Latency Trigger)

$$\text{HTMLBlob} = \text{new Blob}([\text{compiledHtml}], \{ \text{type}: \text{"text/html;charset=utf-8"} \})$$
$$\text{DownloadURL} = \text{URL.createObjectURL}(\text{HTMLBlob})$$
创建虚拟 `<a>` 标签并自动触发 `a.click()`，瞬时将文件保存至用户本地 `Downloads` 目录。

---

## 3. 纯前端 ZIP 归档打包器设计 (ZIP Project Packager)

### 3.1 归档目录结构

```
[project-title].zip
├── config.json             # 标准 FocusFlow DSL 配置文件
├── index.html              # 引用相对路径 assets 的独立入口页
├── README.md               # 离线演播与集成指南
└── assets/
    └── architecture.png    # 原始底图素材
```

### 3.2 JSZip 压缩流水线

1. 初始化 `const zip = new JSZip()`；
2. 写入 `zip.file('config.json', JSON.stringify(dsl, null, 2))`；
3. 将 Base64 或 Blob 转换为 ArrayBuffer 写入 `zip.file('assets/architecture.png', buffer)`；
4. 异步生成 `zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })` 并自动触发浏览器下载。

---

## 4. 纯前端客户端视频录制设计 (Client Video Recorder)

### 4.1 MediaRecorder 核心算法流

1. **画布流捕获**：
   - 获取容器中的 `<canvas>` 或 `<video>` 流：`const stream = canvasElement.captureStream(60)`；
2. **初始化录制器**：
   ```typescript
   const mediaRecorder = new MediaRecorder(stream, {
     mimeType: 'video/webm;codecs=vp9',
     videoBitsPerSecond: 8000000 // 8Mbps 1080P 高码率
   });
   ```
3. **时钟触发与分片组装**：
   - 监听 `ondataavailable` 累加 `chunks`；
   - 监听 `onstop` 组装 `new Blob(chunks, { type: 'video/webm' })` 并触发自动下载。

---

## 5. 沉浸式受众全屏演示模式 (`AudienceModal.tsx`)

### 5.1 界面布局与快捷键支持

- **全屏容器**：`100vw × 100vh` 黑色毛玻璃背景，隐藏所有编辑栏、工具箱与属性检查器；
- **顶部精简进度栏**：微缩呈现当前场景序号、标题与进度指示线；
- **底部浮动控制浮岛**：上一幕、播放/暂停、下一幕、全屏切换与退出；
- **全局按键监听**：
  - `←` / `PageUp`：上一幕；
  - `→` / `PageDown` / `Space`：下一幕；
  - `F`：全屏切换；
  - `ESC`：退出全屏演示模式。

---

## 6. Playwright E2E 自动化测试设计 (Testing Strategy)

严格遵循全局规则（**测试用例逻辑全部提取为独立的异步 helper 函数，在 `it()` / `test()` 中调用**）：

```typescript
// apps/studio/e2e/stage5-export-compiler.spec.ts

async function verifyExportModalOpenAndTabs(page: Page): Promise<void>;
async function verifyStandaloneHtmlExportDownload(page: Page): Promise<void>;
async function verifyZipProjectExportDownload(page: Page): Promise<void>;
async function verifyAudienceModeFullscreen(page: Page): Promise<void>;
async function verifyVideoRecordingWorkflow(page: Page): Promise<void>;

test.describe('FocusFlow Studio Stage 5 E2E Export & Packaging Suite', () => {
  test('TC501: 验证多功能导出中心模态框呼出与选项卡切换', async ({ page }) => {
    await verifyExportModalOpenAndTabs(page);
  });

  test('TC502: 验证纯前端单文件独立 HTML 编译与下载', async ({ page }) => {
    await verifyStandaloneHtmlExportDownload(page);
  });

  test('TC503: 验证纯前端 ZIP 工程归档压缩与下载', async ({ page }) => {
    await verifyZipProjectExportDownload(page);
  });

  test('TC504: 验证受众全屏演播模式呼出与键盘翻页交互', async ({ page }) => {
    await verifyAudienceModeFullscreen(page);
  });
});
```

---

## 7. Stage 5 任务分解与执行清单 (WBS Checklist)

- [x] **Task 5.1: 纯前端单文件独立 HTML 编译器 (Standalone HTML Packager)**
  - [x] 5.1.1 编写 `src/services/standalonePackager.ts`：实现 CSS、Player IIFE 运行时与 DSL 的内存拼装
  - [x] 5.1.2 实现 `downloadStandaloneHtml(dsl)`：Blob 封装与浏览器 0 延迟一键触发下载
- [x] **Task 5.2: 纯前端 ZIP 工程归档导出器 (ZIP Project Exporter)**
  - [x] 5.2.1 引入 `jszip` 并编写 `src/services/zipExporter.ts`
  - [x] 5.2.2 将 DSL、素材与独立 HTML 封装为标准 ZIP 归档包
- [ ] **Task 5.3: 沉浸式受众全屏演示模式 (Audience Fullscreen Presenter)**
  - [ ] 5.3.1 编写 `src/components/modals/AudienceModal.tsx`：实现 100vw × 100vh 全屏沉浸式挂载
  - [ ] 5.3.2 实现键盘 `←` / `→` / `Space` 翻页与顶部精简进度条
- [ ] **Task 5.4: 多功能导出控制中心与视频录制 (Export Modal & Video Recorder)**
  - [ ] 5.4.1 编写 `src/components/modals/ExportModal.tsx`：提供 HTML / ZIP / 视频多通道导出
  - [ ] 5.4.2 编写 `src/services/canvasRecorder.ts`：基于 `MediaRecorder` 实现纯本地 60FPS 录制
  - [ ] 5.4.3 在 `TopBar.tsx` 绑定“一键导出”与“全屏试播”按键
- [ ] **Task 5.5: 国际化词条扩充与类型声明 (i18n Augmentation)**
  - [ ] 5.5.1 扩充 `src/locales/zh/export.ts` 与 `src/locales/en/export.ts`
- [ ] **Task 5.6: 质量门禁与 Playwright E2E 自动化测试 (Quality Gates & Verification)**
  - [ ] 5.6.1 编写 `e2e/stage5-export-compiler.spec.ts`（独立异步 helper 函数规范）
  - [ ] 5.6.2 运行 `pnpm lint`（Oxlint 极速静态检查 0 警告 0 错误）
  - [ ] 5.6.3 运行 `pnpm typecheck`（TypeScript 复合类型 100% 编译通过）
  - [ ] 5.6.4 运行 `pnpm build`（Turborepo 全局拓扑构建验证通过）

---
*FocusFlow Studio Architecture Working Group · 2026.08*
