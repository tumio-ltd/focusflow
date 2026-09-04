# FocusFlow AI Agent 集成与自动化生成规范 (AI Agent Integration Spec)

> **文档定位**：定义第三方 AI Agent（如 Claude Desktop、Cursor、Antigravity、AutoGPT 等）如何调用与操控 FocusFlow，实现从“用户自然语言/输入图片”到“自动生成有展示价值的场景图元项目”，并自动化导出“0 依赖单文件 HTML”与“高画质 MP4/WebM 视频”的系统级设计。

---

## 一、 为什么 FocusFlow 天生适合 AI Agent？

传统在线画板与动画软件（如 Figma、Canva、After Effects）底层充斥着复杂的图元状态、非标准图层树与私有二进制存储，AI Agent 极难进行确定性推理与自动化生成。

FocusFlow 从第一天起便确立了 **“声明式 DSL 驱动（Schema-Driven）”** 与 **“播放引擎物理隔离（Engine-Player Decoupling）”** 的设计哲学：

```
                           ┌───────────────────────────┐
                           │      第三方 AI Agent      │
                           │ (Claude / GPT / Agentic)  │
                           └─────────────┬─────────────┘
                                         │ 生成/操作
                                         ▼
                           ┌───────────────────────────┐
                           │   FocusFlow DSL (JSON)    │
                           │  • meta (视口与原生分辨率)  │
                           │  • asset (底图绝对尺寸)   │
                           │  • scenes (摄像机/激活矩阵)│
                           │  • elements (框/线/点/气泡)│
                           └─────────────┬─────────────┘
                                         │ 驱动
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────────┐
│     FocusFlow Studio (GUI 工作台)    │     │   FocusFlow Player (无头播放核心) │
│ • 供人类创作者或 GUI Agent 交互操作    │     │ • 0 依赖纯原生 IIFE 运行时 (28KB) │
│ • 完备的 data-testid 可操纵标识体系   │     │ • 60FPS 确定性时间轴与插值数学    │
└──────────────────────────────────────┘     └─────────────────┬─────────────────┘
                                                               │ 一键多格式编译输出
                                             ┌─────────────────┴─────────────────┐
                                             ▼                                   ▼
                             【0 依赖单文件独立 HTML】                  【60FPS MP4/WebM 视频】
```

1. **100% 结构化 JSON DSL**：所有图元与运镜均为纯粹的 JSON 文本数据，符合 JSON Schema 规范，大语言模型（LLM）天生最擅长生成与解析。
2. **归一化坐标与相机数学**：框元、圆点、气泡与镜头参数基于底图绝对分辨率计算，具备严格的几何自洽性，多模态模型（VLM）极易通过图像识别提取坐标。
3. **已打通的单文件离线编译流水线**：现有系统已具备 `standalonePackager.ts` 与 `scripts/build-standalone.js`，可瞬间将 DSL + 播放引擎 + Base64 资产合流为单文件 HTML。
4. **确定性时间轴（Deterministic Timeline）**：每个场景的 `duration`、动效类型与转场缓动均有严格的数学时间戳，为自动化无头录制高画质视频提供了 100% 帧级同步保障。

## 二、 核心前置基石：AI Agent 认知模型（Mental Model）与 DSL 数据契约

在落地任何模式前，必须先解决一个本质问题：**如何让 AI Agent 建立关于 FocusFlow 工作方式的准确心智，并深刻理解 DSL 的数据结构？**

如果 Agent 没有建立起正确的领域认知（Domain Knowledge），生成的项目就会出现“有框无镜”、“坐标失准”、“气泡悬空”、“图元在场景中未激活”等典型幻觉。

### 1. Agent 必须建立的 2 个核心认知

#### (1) 工作方式认知（Mental Model · 它不是绘图板，而是电影分镜导览）
Agent 必须理解 FocusFlow 的底层哲学是 **“电影镜头运镜 + 渐进式展开（Progressive Disclosure）”**：
- **全局图元池与单幕激活矩阵的解耦**：
  - `elements`（演员库）：保存整张架构图的全部演员（所有框元 Box、连线 Path、圆点 Dot、插图 Image）。它只定义实体“是什么、在哪里”。
  - `scenes[i].activeElements`（分镜登场表）：决定第 `i` 幕中有哪些演员登场。随着演播推进，图元是**逐幕递增点亮或切换**的。
- **镜头摄像机（Camera）的物理意义**：
  - 镜头不是无意义滚动，`camera.x, camera.y` 是聚焦的目标中心绝对坐标，`camera.zoom`（如 1.2x ~ 2.0x）是放大特写深度，`camera.duration`（如 1.2s）是运镜飞行时长。
- **气泡卡片（Callout）的从属绑定**：
  - 气泡不能无附着漂浮，它通过 `boxId` 强绑定到目标框元，在视觉上充当“讲解员”，并随着相机的运镜呈现在最佳阅读视线范围内。

#### (2) 数据契约认知（Data Structure · 严格的几何与引用自洽）
- **坐标基准（Coordinate Baseline）**：
  - 所有图元与视口必须严格基于底图的原生像素尺寸（Native Resolution，如 1920×1080）进行绝对坐标定义，严禁混用视口百分比或浏览器缩放像素。
- **引用完整性约束（Referential Integrity）**：
  - 连线 `path.from` 与 `path.to` 必须存在于 `elements.boxes` 中。
  - `scene.activeElements.boxes` 中的每一个 ID，都必须在全局 `elements.boxes` 中被预先声明。

---

### 2. 针对 3 种落地模式的“知识投喂与约束”工程策略

```
                    ┌───────────────────────────────────────────────┐
                    │      FocusFlow 领域知识库 (Domain Knowledge)  │
                    │   • DSL Schema 语法契约 (@focusflow/dsl)      │
                    │   • 电影运镜认知模型 (Mental Model Guide)       │
                    │   • 官方经典模板 (6 大场景 Few-Shot JSON)      │
                    └───────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
   【模式 A：无头生成】               【模式 B：MCP 工具化】             【模式 C：GUI 协同】
         │                                  │                                  │
 传递方式：System Prompt             传递方式：Tool Description          传递方式：Agent Skill
 + JSON Schema 严格校验             自解释参数结构 (Zod/Schema)        + data-testid 物理映射表
         │                                  │                                  │
 效果：Agent 一次性输出标准 DSL       效果：Agent 逐步调 API 组装合法 DSL 效果：Agent 像人类一样点击拖拽
```

- **模式 A（无头生成）**：
  - **核心解法**：`System Prompt + Schema 约束 + 1 个极简 Few-Shot 样本`。
  - **容错防线**：CLI 工具内置 `validateDSL(json)` 静态校验器，若缺少字段直接向 Agent 返回结构化错误日志，实现 1 秒内闭环自愈修正。
- **模式 B（MCP 工具化）**：
  - **核心解法**：`API 描述即说明书（Self-describing Tools）`。
  - **优势**：Agent 甚至无需记忆复杂的 DSL 全貌，每个工具的参数描述（如 `zoom: number // 建议 1.3~1.8`）直接指导 Agent 执行符合美学直觉的原子操作，由 MCP Server 内部组装出合法 DSL。
- **模式 C（GUI 协同）**：
  - **核心解法**：`Agent Skill 规则指南`。
  - **优势**：为多模态/Browser-use 智能体提供界面功能映射表（如工具栏 `tool-box` 对应框选、`layer-toggle-eye-*` 对应图层显隐）。

---

## 三、 AI Agent 接入的 3 种落地模式

根据实际业务架构与交互形态，AI Agent 可以通过以下 3 种递进模式使用 FocusFlow：

```
                    ┌─────────────────────────┐
                    │     AI Agent (LLM)      │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
   【模式 A：无头直出】     【模式 B：MCP 协议工具】  【模式 C：GUI 协同】
 Agent 直接生成 DSL      封装为 Agent MCP Server   Agent 操控 Studio UI
         │                       │                       │
         ▼                       ▼                       ▼
  Node CLI 独立打包        Agent 自由增删改查场景       通过浏览器录制视频
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                     输出: 独立 HTML / MP4 视频
```

---

### 模式 A：无头 DSL 纯代码生成与导出（Headless DSL Pipeline）

#### 1. 适用场景
- **大规模批量自动化生产**：自动化周报架构演进演示、CI/CD 构建物自动可视化、监控拓扑图定时生成动态解说视频。
- **无界面服务端流水线**：在后台 Worker、CLI 终端或 GitHub Actions 中运行，不消耗显示资源。

#### 2. 工作流步骤
1. **多模态分析或输入结构化文本**：
   - Agent 接收用户的输入底图（如系统架构图、流程时序图、数据看板截图）与文本描述（如“按网关 ➔ 鉴权 ➔ 订单 ➔ 数据库的顺序制作演示”）。
2. **生成 FocusFlow DSL JSON**：
   - Agent 依照 `@focusflow/dsl` 规范，直接在内存或磁盘中输出标准的 `config.json`。
3. **自动化编译独立单文件 HTML**：
   - Agent 调用 FocusFlow 内置编译脚本：
     ```bash
     node scripts/build-standalone.js path/to/project/config.json dist/showcase.html
     ```
   - 输出一个内嵌 Base64 高清底图与 IIFE 播放引擎的独立 `.html`，可在任何设备无网双击秒开。
4. **无头录制为高清视频 (Headless Video Render)**：
   - Agent 调用无头录制脚本（基于 Playwright / CDP）：
     ```bash
     node scripts/render-video.js dist/showcase.html dist/showcase.mp4 --fps 60 --resolution 1080p
     ```
   - 脚本后台启动无头浏览器，自动触发 `player.play()`，并在演播结束时自动封装为 `.mp4` 或 `.webm` 视频文件。

---

### 模式 B：FocusFlow MCP Server / Agentic Tools（工具化接入）

#### 1. 适用场景
- **交互式 AI 伴侣**：在 Claude Desktop、Cursor、Antigravity 等支持 **Model Context Protocol (MCP)** 的现代智能体编辑器中。
- **增量式人机对话编排**：用户与 Agent 边聊边做，Agent 通过结构化工具调用（Tool Calls）一步步完善项目。

#### 2. MCP Tools API 规范清单

| 工具名称 | 输入参数 | 核心行为 | 输出结果 |
| :--- | :--- | :--- | :--- |
| `focusflow_create_project` | `title`, `imageUrl`, `viewportWidth`, `viewportHeight` | 创建新工程，初始化底图尺寸与默认镜头场景 | `projectId`, `dsl` |
| `focusflow_add_scene` | `title`, `camera: { x, y, zoom, duration }` | 追加新场景，设定目标视角焦点与转场时间 | `sceneIndex`, `sceneId` |
| `focusflow_add_box` | `id`, `x`, `y`, `width`, `height`, `label`, `sceneIndices` | 增加高亮框元，并在指定的一幕或多幕中激活 | `boxId` |
| `focusflow_add_callout` | `targetBoxId`, `title`, `description`, `theme`, `sceneIndex` | 在指定框元旁挂载解释气泡卡片 | `calloutId` |
| `focusflow_add_route` | `fromBoxId`, `toBoxId`, `style`, `sceneIndex` | 在两个服务框元之间建立贝塞尔流动连线 | `pathId` |
| `focusflow_inherit_scene` | `targetSceneIndex` | 让目标场景一键继承上一场景的所有激活图元 | `activeElements` |
| `focusflow_export_html` | `projectId` 或 `dslJson`, `outputPath` | 调用单文件打包引擎，输出独立 `.html` 文件 | `htmlPath`, `fileSize` |
| `focusflow_export_video` | `projectId` 或 `dslJson`, `outputPath`, `fps`, `resolution` | 启动无头录制管线，输出 `.mp4` 视频文件 | `videoPath`, `duration` |

#### 3. 典型对话流程
```
User: "请帮我把这个微服务架构图做成演示。重点突出 3 个部分：网关入口、订单结算事务、MySQL 只读库。"
Agent: [Tool Call] focusflow_create_project(title="微服务架构导览", imageUrl="...")
       [Tool Call] focusflow_add_box(x=120, y=80, width=300, height=180, label="微服务网关", sceneIndices=[0])
       [Tool Call] focusflow_add_callout(targetBoxId="box-gateway", title="流量入口", description="全局动态鉴权与分流", sceneIndex=0)
       [Tool Call] focusflow_add_scene(title="02 订单分布式事务", camera={x=680, y=340, zoom=1.8, duration=1.2})
       ...
       [Tool Call] focusflow_export_html(outputPath="dist/microservices-demo.html")
       [Tool Call] focusflow_export_video(outputPath="dist/microservices-demo.mp4")
Agent: "演示项目已为您构建完成！已导出为独立 HTML 文件与 1080P MP4 视频，共计 3 幕场景，总时长 7.5 秒。"
```

---

### 模式 C：GUI 自动化协同（Human-Agent Co-Creation）

#### 1. 适用场景
- **人类创作者在场微调**：Agent 完成初版绘制，创作者接手在工作台上通过鼠标拖拽微调气泡排版或颜色。
- **视觉多模态 Browser-use 智能体**：Agent 直接操纵浏览器前端界面。

#### 2. 核心支撑机制：高稳定性 `data-testid`
Studio 前端已经注入了完整的自动化操作锚点：
- **工具切换**：`[data-testid="tool-select"]`, `[data-testid="tool-box"]`, `[data-testid="tool-callout"]`, `[data-testid="tool-image"]`
- **图层操作**：`[data-testid="layer-item-${id}"]`, `[data-testid="layer-toggle-eye-${id}"]`
- **导出与录制**：`[data-testid="export-modal"]`, `[data-testid="export-html-btn"]`, `[data-testid="export-zip-btn"]`
- **全屏受众演播**：`[data-testid="audience-modal"]`, `[data-testid="timeline-play-btn"]`

---

## 四、 自动化生成“视频”的具体实现方案

导出单文件 HTML 为纯静态文本组装（由 `standalonePackager.ts` 毫秒级完成）；而导出高画质 MP4/WebM 视频则有以下 3 种技术实现路径：

### 方案 1：Playwright / CDP 无头录制（推荐，极简轻量、开箱即用）

- **技术原理**：
  1. 通过 Node.js 启动 Playwright Chromium 无头实例（配置指定视口分辨率，如 1920x1080）；
  2. 加载生成的 `standalone.html`（或加载 Studio 页面并直接注入 DSL）；
  3. 页面就绪后，通过 `page.evaluate(() => window.FocusFlowInstance.play())` 触发全自动演播；
  4. 开启 Playwright 原生视频录制选项（`recordVideo: { dir: './dist', size: { width: 1920, height: 1080 } }`）或使用 Chrome DevTools Protocol (CDP) `Page.startScreencast` 高速抓取帧流；
  5. 演播完毕触发 `onEnded` 回调后关闭页面，通过内置的 `fluent-ffmpeg` 将视频转码为目标 `h264` MP4。
- **优点**：无需复杂图形卡驱动，100% 还原 CSS 3D GPU 硬件加速动画与发光动效。
- **实现脚本**：`scripts/render-video.js`。

### 方案 2：Remotion 帧级无掉帧离线渲染（广播级 4K 60FPS）

- **技术原理**：
  - FocusFlow 的动效全部由时间驱动（场景时长 `duration` 与缓动函数 `cubic-bezier`）。
  - 在 Node.js 端利用 Remotion 渲染器，将播放器的时间轴映射为每秒 60 帧的固定切片（第 0 帧、第 1/60s 帧...），每一帧调用播放器 `seekTo(t)` 抓取无头快照，最后由 FFmpeg 拼装。
- **优点**：彻底消除客户端因为电脑掉帧导致的卡顿，100% 保证在任何低配机器上都能输出丝滑的 4K 60FPS 视频。

### 方案 3：Studio 浏览器端 MediaRecorder 录制（前端交互式）

- **技术原理**：
  - 在 Studio 工作台中直接利用 HTML5 `MediaRecorder` API 捕获画布元素绘制流，生成 WebM 视频并由浏览器直接下载。
- **优点**：纯前端运行，无需 Node.js 环境或后端服务器。

---

## 五、 Agent 生成的 FocusFlow DSL 规范模板 (Prompt 参考)

为了让任何大语言模型都能 100% 生成正确合法的 FocusFlow DSL，提供如下 System Prompt 与结构化模板：

```json
{
  "meta": {
    "title": "系统架构演进演示",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "theme": {
      "primaryColor": "#38bdf8",
      "bg": "#0a0e17"
    }
  },
  "asset": {
    "url": "https://example.com/arch.png",
    "width": 1920,
    "height": 1080
  },
  "elements": {
    "boxes": [
      {
        "id": "box-gateway",
        "x": 200,
        "y": 150,
        "width": 240,
        "height": 140,
        "style": { "borderRadius": 12, "border": "2px solid #38bdf8" }
      },
      {
        "id": "box-order",
        "x": 600,
        "y": 150,
        "width": 240,
        "height": 140,
        "style": { "borderRadius": 12, "border": "2px solid #34d399" }
      }
    ],
    "paths": [
      {
        "id": "path-gateway-order",
        "from": "box-gateway",
        "to": "box-order",
        "style": { "flow": true, "stroke": "#38bdf8" }
      }
    ],
    "dots": [],
    "images": []
  },
  "scenes": [
    {
      "id": "scene-1",
      "title": "01 网关接入层",
      "camera": { "x": 0, "y": 0, "zoom": 1.0, "duration": 1.2 },
      "activeElements": {
        "boxes": ["box-gateway"],
        "callouts": [
          {
            "id": "callout-gateway",
            "boxId": "box-gateway",
            "title": "API Gateway",
            "description": "负责鉴权、限流与灰度分流",
            "theme": "cyan"
          }
        ]
      }
    },
    {
      "id": "scene-2",
      "title": "02 订单服务调用",
      "camera": { "x": 200, "y": 0, "zoom": 1.4, "duration": 1.5 },
      "activeElements": {
        "boxes": ["box-gateway", "box-order"],
        "paths": ["path-gateway-order"],
        "callouts": [
          {
            "id": "callout-order",
            "boxId": "box-order",
            "title": "Order Service",
            "description": "分布式下单事务引擎",
            "theme": "emerald"
          }
        ]
      }
    }
  ]
}
```

---

## 六、 后续演进 Checklist

- [ ] **1. CLI 自动化脚本包 (`scripts/agent/`)**
  - [ ] `scripts/agent/render-video.mjs`: 提供基于 Playwright Headless 的单文件 HTML 到 MP4 自动录制脚本
  - [ ] `scripts/agent/validate-dsl.mjs`: 基于 `@focusflow/dsl` 的 JSON Schema 静态校验工具
- [ ] **2. 官方 MCP Server (`packages/mcp-server`)**
  - [ ] 实现 `@modelcontextprotocol/sdk` 标准服务端
  - [ ] 导出 `focusflow_create_project`, `focusflow_add_scene`, `focusflow_export_html`, `focusflow_export_video` 等 8 项标准工具
- [ ] **3. 多模态视觉自动框选（Auto-Detection Skill）**
  - [ ] 配合视觉大模型（如 GPT-4o / Claude 3.7 Sonnet），自动识别底图中的拓扑节点并输出精确像素坐标
