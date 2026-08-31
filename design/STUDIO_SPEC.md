# FocusFlow - Phase 2 (Studio) 可视化创作工作台与全栈工程化设计规格说明书
## FocusFlow Studio & Full-Stack Cloud Architecture Specification

> **文档版本**：`v1.0.0`  
> **制定日期**：`2026-08-29`  
> **文档状态**：🚀 **Phase 2 (Studio 工作台与云端化) 核心工程规格 · 规划执行中**  
> **关联技术专刊**：
> - 📄 [PRODUCT_DESIGN.md (主产品方案与 PRD)](file:///Users/xt/WebstormProjects/focusflow/design/PRODUCT_DESIGN.md)
> - 🏗️ [MONOREPO_SPEC.md (Monorepo 工程化架构与改造规格)](file:///Users/xt/WebstormProjects/focusflow/design/MONOREPO_SPEC.md)
> - 📐 [MVP_SPEC.md (Phase 1 播放引擎与 HUD 执行规格)](file:///Users/xt/WebstormProjects/focusflow/design/MVP_SPEC.md)
> - 📐 [MOTION_ENGINE_SPEC.md (动效数学与渲染规格)](file:///Users/xt/WebstormProjects/focusflow/design/MOTION_ENGINE_SPEC.md)
> - 🔍 [EDGE_SNAPPER_ALGORITHM.md (智能边缘吸附与 Auto-Refine 算法专刊)](file:///Users/xt/WebstormProjects/focusflow/docs/EDGE_SNAPPER_ALGORITHM.md)
> 
> **适用对象**：前端架构师、全栈工程师、UI/UX 设计师、后端开发  
> **文档定位**：Phase 2 可视化创作工作室（FocusFlow Studio）从前端画布、时间轴到服务端项目管理、离线打包与视频渲染的端到端技术落地方案

---

## 目录 (Table of Contents)

- [1. Phase 2 核心定位与业务使命](#1-phase-2-核心定位与业务使命)
- [2. 系统整体架构：双模式运行体系 (Client-Only vs Cloud SaaS)](#2-系统整体架构双模式运行体系-client-only-vs-cloud-saas)
  - [2.1 模式 A (Client-Only) 纯前端零后端离线闭环机制与战略价值](#21-模式-a-client-only-纯前端零后端离线闭环机制与战略价值)
  - [2.2 模式 A 与 模式 B (云端全栈 SaaS) 清晰边界与全方位对比矩阵](#22-模式-a-与-模式-b-云端全栈-saas-清晰边界与全方位对比矩阵)
  - [2.3 双模式同构平滑演进与体验无缝切换](#23-双模式同构平滑演进与体验无缝切换)
- [3. 创作端 3 步闭环核心功能系统深度设计](#3-创作端-3-步闭环核心功能系统深度设计)
  - [3.1 环节一：项目创建与资产导入系统 (Project Ingestion)](#31-环节一项目创建与资产导入系统-project-ingestion)
  - [3.2 环节二：可视化无限画布与 4 大编辑工具 (Infinite Canvas & Tools)](#32-环节二可视化无限画布与-4-大编辑工具-infinite-canvas--tools)
  - [3.3 环节二 (续)：场景关键帧时间轴编排系统 (Scene & Sequence Timeline)](#33-环节二-续场景关键帧时间轴编排系统-scene--sequence-timeline)
  - [3.4 环节三：实时生成、预览与多形态导出下载 (Compilation, Preview & Exporter)](#34-环节三实时生成预览与多形态导出下载-compilation-preview--exporter)
- [4. 前端架构与技术栈选型规范 (Frontend Architecture)](#4-前端架构与技术栈选型规范-frontend-architecture)
  - [4.1 技术栈选型](#41-技术栈选型)
  - [4.2 前端目录规划与多包协作架构](#42-前端目录规划与当前项目目录的架构关系-repository--monorepo-architecture)
  - [4.3 科技双主题系统与纯 Token 语义类架构 (Theme System & Semantic Tokens Architecture)](#43-科技双主题系统与纯-token-语义类架构-theme-system--semantic-tokens-architecture)
- [5. 服务端全栈架构、REST API 与数据模型规范 (Full-Stack SaaS Backend)](#5-服务端全栈架构rest-api-与数据模型规范-full-stack-saas-backend)
- [6. Phase 2 研发任务分解与层级跟踪清单 (Hierarchical Task Checklist / WBS)](#6-phase-2-研发任务分解与层级跟踪清单-hierarchical-task-checklist--wbs)
- [7. Phase 2 验收测试标准 (Acceptance Criteria)](#7-phase-2-验收测试标准-acceptance-criteria)

---

## 1. Phase 2 核心定位与业务使命

### 1.1 阶段演进定位
在 **Phase 1 (MVP)** 阶段，FocusFlow 成功完成了**核心渲染引擎、动效数学、离线单文件打包与 HUD 快捷键标定工具**的建设，验证了极致的播放性能（60fps GPU 硬件加速、~35KB 极轻量体积）。但 Phase 1 仍要求创作者具备一定的代码与 JSON 编辑能力。

**Phase 2 的核心使命是：**
> **“从面向开发者的本地调试工具，全面跃迁为面向架构师、产品专家、讲师的现代化、零门槛 Web 可视化创作工作室（FocusFlow Studio）。”**

### 1.2 核心价值与 3 步闭环
创作者无需编写任何一行代码，只需 3 步即可完成顶级架构演进汇报：
```
       ┌────────────────────────┐      ┌──────────────────────────┐      ┌────────────────────────┐
       │   1. 拖入高分辨率架构图 │ ──>  │   2. 可视化框选与镜头编排 │ ──>  │ 3. 一键导出单文件/视频 │
       └────────────────────────┘      └──────────────────────────┘      └────────────────────────┘
                 [输入]                            [加工]                            [输出]
```

---

## 2. 系统整体架构：双模式运行体系 (Client-Only vs Cloud SaaS)

为兼顾“极客开发者的零成本私密离线使用”与“商业团队的在线云端协同与视频渲染”，Phase 2 采用**双模式同构架构**：

```mermaid
flowchart TB
    subgraph StudioUI ["🎨 FocusFlow Studio 前端工作台 (React 19 + Tailwind + shadcn/ui)"]
        direction TB
        TopBar["顶部栏: 项目标题 / 预设模板 / [💾 保存] / [🚀 导出 ▾]"]
        CanvasArea["无限画布区: 缩放/平移 / 实时取景器 / 智能吸附选框 / 贝塞尔连线 / 气泡拖拽"]
        SideInspector["右侧属性检查器: 场景配置 / 动效参数 / 气泡主题与文字"]
        BottomTimeline["底部场景时间轴: 场景卡片流 / 拖拽排序 / 持续时间 / 轮播设置"]
    end

    subgraph ModeA ["⚡ 模式 A: 纯前端零后端离线模式 (Local / Client-Only)"]
        LocalEngine["浏览器内存编译器 (In-Browser Packager)"]
        LocalFile["FileReader / Blob / ObjectURL"]
        DownloadA["直接弹出下载: standalone.html / config.json / project.zip"]
    end

    subgraph ModeB ["☁️ 模式 B: 云端全栈 SaaS 模式 (Full-Stack Cloud SaaS)"]
        direction TB
        API["⚡ apps/api (NestJS 主 REST API)<br/>项目管理 / S3 上传 / HTML 导出 / 短链"]
        Worker["🎥 apps/render-worker (NestJS Worker)<br/>BullMQ 队列 / Remotion 4K 60fps 视频转码"]
        DB["🗄️ packages/database<br/>PostgreSQL 18 + Prisma (框架无关数据层)"]
        Jobs["📜 packages/dsl/jobs.ts<br/>BullMQ 转码任务与进度强类型契约"]
        CloudShare["🌐 云端只读演示短链 (focusflow.io/s/xxx) + <iframe> 知识库嵌入"]
        
        API -->|投递任务| Jobs -->|消费任务| Worker
        API --> DB
        Worker --> DB
    end

    StudioUI -->|本地快速模式| ModeA
    StudioUI -->|云端协同模式| ModeB
```

---

### 2.1 模式 A (Client-Only) 纯前端零后端离线闭环机制与战略价值

模式 A 像 **Excalidraw、Photopea 或 CyberChef** 一样，**100% 完全不需要任何后端服务、数据库或 Redis 依赖**，整个应用完全作为一个纯静态站点（Static Web App）自治运行于浏览器沙箱中：

```
                    【模式 A：纯前端 100% 离线自治闭环流水线】

 1. 底图拖拽导入 ──> 浏览器原生 FileReader / URL.createObjectURL(file) 读取进内存
 2. 尺寸自动侦测 ──> 浏览器 new Image() 瞬间读取天然物理基准分辨率 (如 5120x2880)
 3. 像素边缘吸附 ──> Canvas API + Web Worker 在本地执行 Sobel 算子图像边缘探测
 4. 工程状态暂存 ──> 浏览器 IndexedDB / localStorage 本地持久化 (页面刷新永不丢失)
 5. 单文件 HTML  ──> standalonePackager.ts 纯前端将底图 Base64 与 Player 内联为单文件
 6. ZIP 工程打包 ──> jszip 在浏览器内存中直接生成标准 .zip 二进制压缩包
 7. 文件保存下载 ──> 触发浏览器原生 Blob + <a download="focusflow.html"> 直接落盘
```

#### 模式 A 的两大战略杀手级价值：
1. **解决企业最高等级的“架构图安全与保密”痛点（100% 数据私密）**：
   * 大厂架构师、金融与安全专家绘制的系统拓扑通常包含内部敏感主机名、拓扑 IP、密钥分发链路等高密数据；
   * 模式 A 允许创作者在**完全断网、内网机、保密开发环境或离线无网络状态**下自由创作，**不向外网发送任何一个字节，彻底消除数据泄露与合规顾虑**！
2. **极致的零获客门槛与零服务器托管成本**：
   * **零门槛体验**：用户无需注册、无需登录、零等待，打开网页即可直接拖图制作；
   * **极低分发成本**：纯静态产物可直接托管于 GitHub Pages、Vercel Edge 或 Cloudflare CDN，全球分发成本几乎为 $0。

#### 模式 A 的两种纯本地/单机视频导出方案 (零后端服务依赖)：
若处于离线/单机模式 A 的创作者需要导出视频，无需连接任何后端服务，可通过以下两种纯本地方案完成：
1. **方案 1：纯浏览器客户端录制 (Client-side `MediaRecorder`)**：
   * 浏览器利用原生 HTML5 Canvas Capture 与 `MediaRecorder` API，直接在用户电脑内存与显卡中实时录制动效，导出 `.webm` 或轻量 `.mp4` 文件直接下载；
2. **方案 2：开发者本地 CLI 脚本工具 (Local Node.js + FFmpeg CLI)**：
   * 开发者在本地终端运行 `node scripts/build-standalone.js`，直接调用本机已安装的 FFmpeg 执行离线批量渲染合成。

---

### 2.2 模式 A 与 模式 B (云端全栈 SaaS) 清晰边界与全方位对比矩阵

```
+------------------------+------------------------------------+------------------------------------+
| 评估维度                | ⚡ 模式 A: 纯前端零后端 (Client-Only)| ☁️ 模式 B: 云端全栈 SaaS (Cloud)    |
+------------------------+------------------------------------+------------------------------------+
| 1. 后端与数据库依赖    | 🏆 0 依赖 (无需 API / DB / Redis)  | 依赖 NestJS + PostgreSQL 18 + Redis|
| 2. render-worker 依赖  | 🏆 0 依赖 (完全不使用 render-worker)| 🏆 专属依赖 (BullMQ 异步队列驱动)  |
| 3. 数据保密性与离线    | 🏆 100% 离线自治 (数据绝不上云)    | 数据加密持久化于云端数据库         |
| 4. 工程持久化与管理    | 浏览器 IndexedDB / 本地文件导入导出| 云端多设备自动同步与完整版本快照   |
| 5. 独立 HTML 导出      | 🏆 纯前端 Base64 内联瞬间下载      | 云端流式导出与 CDN 加速分发        |
| 6. 4K 60fps 视频渲染   | 纯本地方案: MediaRecorder / 本地CLI| 🏆 专属服务: render-worker 云端集群|
| 7. 团队协同与权限控制  | 不支持 (单机独立创作)              | 🏆 CASL (Owner/Editor/Viewer 协同) |
| 8. 在线分享与嵌入      | 手动发送导出的 standalone.html     | 🏆 一键生成短链与 <iframe> 知识库嵌入|
| 9. 适用目标群体        | 极客开发者、内网保密项目、单机快速演练| 企业研发团队、跨国架构评审、SaaS 会员|
+------------------------+------------------------------------+------------------------------------+
```

#### 💡 `render-worker` 的核心定位：【模式 B 云端 SaaS 专属服务】
* **重度算力卸载**：4K 60fps 逐帧截帧与 H.265/ProRes 硬件转码属于极重 CPU/GPU 负载。若在用户端浏览器强行执行会导致低配设备发热卡死；
* **异步解耦体验**：在模式 B 中，云端 `render-worker` 独立部署于高性能 GPU 计算集群，用户提交渲染任务后即可关闭网页，转码完成后自动发送通知或生成 CDN 直链。模式 A 完全不与该服务发生任何交互。

---

### 2.3 双模式同构平滑演进与体验无缝切换

FocusFlow Studio 前端采用**适配器架构（Storage & Export Adapter Pattern）**：
* 当未登录或处于离线模式时，工作台自动挂载 `LocalStorageAdapter` 与 `ClientCompilerAdapter`，一切功能全部在本地浏览器内存中极速运转；
* 当用户点击“登录云端同步”时，工作台无缝切换为 `CloudApiAdapter`，将本地 DSL 与底图一键上传持久化至云端，实现**“离线即开即用，云端无缝升维”**的顶级用户体验！

---

## 3. 创作端 3 步闭环核心功能系统深度设计

### 3.1 环节一：项目创建与资产导入系统 (Project Ingestion)

#### 1. 拖拽极速创建 (Drag-to-Create)
* **交互体验**：打开 Studio 首页，直接将任意一张高分辨率 PNG、SVG、JPEG 拖入工作台；
* **分辨率自动侦测**：前端通过 `Image.decode()` 或二进制 ArrayBuffer 快速提取底图的天然物理分辨率（如 $5120\times 2880$），自动将其初始化为 `meta.viewport.width` 与 `meta.viewport.height`；
* **初始 DSL 生成**：自动生成 Scene 0（全局全景开场场景），立即进入编辑态。

#### 2. 工程重开与导入 (Re-Open & Import)
* 支持直接拖入历史导出的 `config.json` 或 `project.zip`，瞬间恢复所有场景、图层、气泡与镜头位置；
* 支持多图片管理（如新增画中画覆盖图 `images` 资产）。

#### 3. 预置行业模板库 (Template Gallery)
* 内置 5 套开箱即用的标准架构图模板（微服务电商、高可用容灾、云原生 K8s、AI 训练集群、金融支付风控），供创作者一键体验与克隆修改。

---

### 3.2 环节二：可视化无限画布与 4 大编辑工具 (Infinite Canvas & Tools)

```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ 🔍 [100% ▾] [✋ 抓手] [🔲 选框] [⚡ 连线] [💬 气泡] [🖼️ 覆盖图] │ 👁️ 预览  💾 保存  🚀 导出 ▾│
 ├────────────────────────────────────────────────────────┬────────────────────────┤
 │                                                        │ 🛠️ 属性检查器 (Inspector)│
 │                                                        ├────────────────────────┤
 │                                                        │ 📐 镜头与视口 (Camera)  │
 │                   🎨 可视化无限画布                    │ • 缩放比例: 1.75x      │
 │                                                        │ • 偏移: X:-14%, Y:8%   │
 │              ┌ - - - - - - - - - - - ┐                 ├────────────────────────┤
 │              ┆  [取景安全边界视口框] ┆                 │ 🔲 选中图元 (Box/Line) │
 │              ┆    ┌──────────────┐   ┆                 │ • ID: box-postgres     │
 │              ┆    │ PostgreSQL16 │   ┆                 │ • 描边: #34d399 (6px)  │
 │              ┆    └──────────────┘   ┆                 │ • 发光: [✓] 霓虹光晕   │
 │              └ - - - - - - - - - - - ┘                 ├────────────────────────┤
 │                                                        │ 💬 解说气泡 (Callout)  │
 │                                                        │ • 标题: PostgreSQL 16  │
 │                                                        │ • 主题: [ 🟢 Green ▾ ] │
 ├────────────────────────────────────────────────────────┴────────────────────────┤
 │ 🎬 场景序列时间轴: [01 全局总览] ➔ [02 核心数据链路] ➔ [03 鉴权下钻] ➔ [+] 新增场景 │
 └─────────────────────────────────────────────────────────────────────────────────┘
```

#### 工具 1：镜头取景器 (Camera Viewport Frame)
* **交互体验**：在画布上任意缩放和平移底图，画面中央实时呈现当前场景的“受众实际可视安全窗口（Frustum）”；
* **一键同步**：点击“捕获当前镜头”或调整右侧滑块，自动计算出精确的 `{ zoom, x, y, duration }`。

#### 工具 2：智能选框工具 (Smart Box Tool)
* **三重模式无缝融合**：
  * **模式 A（随手粗拉 + 自动贴合）**：随手拉框，松手瞬间调用 $\pm 24\text{px}$ 窄带 Sobel 精修算法，自动咬合外框；
  * **模式 B（纯手动精确拉框）**：按住 `⌘ / Option`（或关闭吸附开关）拖拽，100% 精确表达创作者自定义留白与局部框选；
  * **模式 C（单点智能吸附）**：Option/Alt+单击卡片空白处，50ms 内自动识别卡片包围盒；
* **圆角与描边可视化调整**：在右侧面板直接调节 `rx` 圆角、`stroke` 颜色、`strokeWidth` 及发光模式。

#### 工具 3：拓扑流光连线生成器 (Bezier Route Tool)
* **磁吸锚点连接**：点击源卡片的 8 向锚点（如 `box-folio.right`），鼠标拖出连线吸附至目标卡片锚点（如 `box-postgres.left-top`）；
* **自动三次贝塞尔曲线推导**：引擎实时绘制高科技流光动效预览；
* **模式切换**：支持一键切换 `stream`（跑马灯流动）或 `draw`（单次描边生长）。

#### 工具 4：毛玻璃气泡所见即所得编辑器 (Callout Visual Editor)
* **直接拖拽定位**：直接在画布上拖拽气泡至最佳展示位置，自动换算为自适应百分比坐标（如 `left: "33%", top: "33%"`）；
* **富文本与主题徽章**：可视化选择 5 大预设配色主题（Blue / Green / Amber / Pink / Cyan），实时预览阶梯弹入动效。

---

### 3.3 环节二 (续)：场景关键帧时间轴编排系统 (Scene & Sequence Timeline)

* **场景卡片流（Scene Sequence Track）**：
  * 底部直观展示当前项目的全部场景步骤缩略卡片（`Scene 1 ➔ Scene 2 ➔ Scene 3`）；
  * 支持鼠标拖拽卡片自由调整讲解先后顺序；
  * 支持一键“复制场景”、“删除场景”与“插入过渡帧”；
* **图元可见性开关矩阵（Active Elements Matrix）**：
  * 选中某个场景时，画布与右侧面板列出所有已有 Boxes、Paths、Dots、Images；
  * 创作者只需通过开关勾选，即可决定该元素在当前场景中是“激活展示”还是“平滑隐藏”。

---

### 3.4 环节三：实时生成、预览与多形态导出下载 (Compilation, Preview & Exporter)

```
                                【多形态一键导出矩阵】

                                   [🚀 点击导出]
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
【📦 独立离线单文件 HTML】        【📄 DSL 配置文件与源码包】       【🎥 4K 60fps MP4 / GIF】
 • 0 依赖，全 Base64 内联         • config.json + 资产包           • 服务端 Remotion / Puppeteer
 • 双击秒开，本地/内网完美演示   • 供开发者二次定制与 Git 托管    • 视频平台 / PPT 嵌入首选
```

#### 导出 1：独立离线单文件 HTML 下载 (`.html`)
* **原理**：前端调用内置的 Standalone Packager 引擎，将 DSL、CSS 样式、IIFE JS 运行库及底图（转为 Data URI）打包成单一 `.html` 文件；
* **体验**：浏览器点击一键弹出下载，文件大小通常仅 2~5MB，双击离线即开，无需任何环境。

#### 导出 2：标准 DSL 源码与工程包 (`config.json` / `project.zip`)
* 导出标准 FocusFlow DSL JSON 结构与图片素材压缩包，方便工程化版本控制。

#### 导出 3：视频渲染导出 (MP4 / GIF)
* **模式 A 本地单机导出**：
  * 浏览器端利用 HTML5 `MediaRecorder` API 捕获 Canvas 实时帧流，直接生成 WebM/MP4 供本地即刻下载；
  * 开发者亦可在本地运行 `scripts/build-standalone.js` 调用本机 FFmpeg 进行离线批量合成。
* **模式 B 云端 `render-worker` 导出 (4K 60fps 影院级)**：
  * **异步渲染管线**：Studio 提交任务 ➔ BullMQ 队列 ➔ 云端 `render-worker` 无头浏览器逐帧步进截帧 ➔ FFmpeg 硬件加速高码率转码；
  * **体验**：提供标准 1080P、2K 及 4K Ultra HD MP4 视频文件下载，可直接插入 Keynote、PPT 或发布到视频平台，完全不占用用户本机 CPU/GPU。

#### 导出 4：云端只读演示短链与知识库 `<iframe>` 嵌入
* 一键生成 `https://focusflow.io/s/[slug]` 短链；
* 提供自适应 `<iframe>` 代码，支持嵌入 Notion、飞书文档、语雀、Docusaurus。

---

## 4. 前端架构与技术栈选型规范 (Frontend Architecture)

### 4.1 技术栈选型
| 模块 | 选型技术 | 核心考量依据 |
| :--- | :--- | :--- |
| **UI 核心框架** | **React 19 + TypeScript** | 声明式状态机、与复杂树形/时间轴组件高度契合、生态最完善 |
| **样式与组件库** | **Tailwind CSS + shadcn/ui** | 极具现代科技感的暗黑设计风格、高定制性、零冗余运行时开销 |
| **全局状态管理** | **Zustand** | 极简无样板代码、支持切片（Slices）、与 Phase 1 Player 状态机天然同构 |
| **图标与视觉系统** | **Lucide React** | 统一现代矢量图标集 |
| **工程构建工具** | **Vite 8** | 毫秒级 HMR 热更新、极速生产打包与模块热替换 |

### 4.2 前端目录规划与当前项目目录的架构关系 (Repository & Monorepo Architecture)

#### 1. 核心定位与解耦关系
当前 FocusFlow 根工程（`focusflow/`）与 Phase 2 的 `focusflow-studio` 采用**“内核引擎（Core Engine）与上层工作台（Editor Shell）解耦”**的现代化 Monorepo / 多包协作架构：

```
                    【FocusFlow 现代化多包协同工程全景】

 ┌────────────────────────────────────────────────────────────────────────┐
 │                    FocusFlow Workspace (Monorepo)                      │
 ├───────────────────────────────────┬────────────────────────────────────┤
 │ 📦 packages/player-core (当前 src/)│ 🎨 apps/studio (focusflow-studio/)  │
 │ • 纯原生 JS / 零外部依赖运行时    │ • React 19 + Tailwind + shadcn/ui   │
 │ • 60fps GPU 镜头运动学与安全边界  │ • 可视化无限画布与 4 大编辑工具     │
 │ • SVG 几何测长与三次贝塞尔流光    │ • 关键帧场景时间轴与气泡实时编辑器  │
 │ • 离线独立单文件打包器模板        │ • 导入 @focusflow/player-core 实例  │
 ├───────────────────────────────────┴────────────────────────────────────┤
 │ 📦 packages/dsl-schema (类型与契约): 共享 FocusFlow DSL TypeScript 声明 │
 └────────────────────────────────────────────────────────────────────────┘
```

* **`packages/player-core`（即当前的 `src/` 核心目录）**：
  * **角色**：底层的**纯运行时播放器内核（Runtime Renderer）**；
  * **特性**：保持 100% 零外部大型框架依赖（~35KB 极简体积），专注于 60fps 动效渲染、镜头矩阵变换与单文件独立运行。
* **`apps/studio`（即 `focusflow-studio/` 工作台目录）**：
  * **角色**：上层的**可视化交互制作工具（Authoring Studio）**；
  * **协作方式**：直接依赖并实例化 `packages/player-core` 作为画布中央的“实时渲染视口（Live Viewport）”，通过 Zustand 状态变更实时驱动播放器，实现 100% 所见即所得的双向绑定！

#### 2. Studio 前端工程内部目录结构 (`apps/studio/` 或 `focusflow-studio/`)
```text
apps/studio/
├── public/templates/            # 预置官方架构图模板
├── src/
│   ├── routes/                  # 🚦 TanStack Router 强类型文件路由
│   │   ├── __root.tsx           # 根路由布局 (QueryClientProvider & Toaster)
│   │   ├── index.tsx            # / (项目大厅与模板中心)
│   │   ├── project.new.tsx      # /project/new (底图拖拽创建向导)
│   │   ├── project.$projectId.tsx # /project/:projectId (三栏可视化工作台)
│   │   └── share.$slug.tsx      # /share/:slug (云端只读分享视图)
│   ├── api/                     # 🌐 Orval 自动化生成的类型安全客户端 SDK
│   │   ├── generated/           # 自动生成的 React Query Hooks (useGetProjectById, useUpdateProject)
│   │   ├── model/               # 自动生成的 TypeScript DTO 契约模型
│   │   └── custom-fetch.ts      # 全局 Fetch 拦截器与 BaseURL 注入
│   ├── components/              # Studio 专属 UI 组件库
│   │   ├── canvas/              # 可视化无限画布与图层控制器
│   │   │   ├── InfiniteCanvas.tsx   # 缩放平移手势画布
│   │   │   ├── CameraFrame.tsx      # 镜头取景安全边界框
│   │   │   ├── BoxLayer.tsx         # 智能选框绘制图层
│   │   │   └── PathLayer.tsx        # 贝塞尔连线吸附图层
│   │   ├── timeline/            # 底部场景时间轴
│   │   │   ├── TimelineTrack.tsx    # 场景序列轨道
│   │   │   └── SceneCard.tsx        # 单场景缩略卡片
│   │   ├── inspector/           # 右侧属性检查器
│   │   │   ├── CameraInspector.tsx  # 镜头参数与转场时间
│   │   │   ├── BoxInspector.tsx     # 选框样式/颜色/圆角
│   │   │   └── CalloutInspector.tsx # 气泡文字/主题徽章
│   │   ├── topbar/              # 顶部导航栏与导出菜单
│   │   │   └── Topbar.tsx
│   │   └── modals/              # 弹窗 (全屏预览、模板选择等)
│   ├── stores/                  # Zustand 状态切片
│   │   ├── useProjectStore.ts   # 项目 DSL 与场景序列状态
│   │   ├── useCanvasStore.ts    # 画布平移、缩放与当前工具
│   │   └── useHistoryStore.ts   # 撤销/重做 (Undo/Redo 栈)
│   ├── compiler/                # 浏览器端纯前端打包编译器
│   │   └── standalonePackager.ts # 动态内联 Base64 生成单文件 HTML
│   ├── App.tsx
│   └── main.tsx
├── orval.config.ts              # ⚙️ Orval 自动化 OpenAPI 代码生成配置文件
├── package.json
└── vite.config.ts               # Vite 8 配置文件 (集成 @tanstack/router-plugin)
```

### 4.3 科技双主题系统与纯 Token 语义类架构 (Theme System & Semantic Tokens Architecture)

FocusFlow Studio 采用工业级 **CSS 变量分层映射 + Tailwind 纯 Token 语义类** 设计系统，实现全站零 `dark:` 前缀硬编码、高内聚且自适应换肤的主题体系：

#### 1. 完整分层架构与数据流向
```
                    ┌────────────────────────────────────────────────────────┐
                    │  1. 底层物理与语义变量表 (src/styles/tokens.css)         │
                    │     :root (Light): --ff-bg-app, --ff-text-primary, ... │
                    │     .dark (Dark):  --ff-bg-app, --ff-text-primary, ... │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ @import './styles/tokens.css'
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │  2. 标准设计系统语义映射层 (src/index.css)              │
                    │     :root / .dark:                                     │
                    │       --background: var(--ff-bg-app);                  │
                    │       --panel:      var(--ff-bg-panel);                │
                    │       --canvas:     var(--ff-bg-canvas);               │
                    │       --card:       var(--ff-bg-card);                 │
                    │       --primary:    var(--ff-accent);                  │
                    │       --border:     var(--ff-border);                  │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │  3. Tailwind 语义化 Token (packages/config-tailwind)   │
                    │     bg-background, bg-panel, bg-canvas, bg-card,       │
                    │     text-foreground, border-border, bg-primary, ...    │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │  4. UI 组件纯语义消费 (Components / Layouts / Modals)   │
                    │     <header className="bg-panel/90 border-border" />   │
                    │     <main className="bg-canvas" />                     │
                    │     <Button className="bg-primary text-primary-fg" />  │
                    └────────────────────────────────────────────────────────┘
```

#### 2. 核心语义 Token 定义与消费规范表
| Semantic Token | Tailwind 类名 | 极简明亮 (Light) | 科技暗黑 (Dark) | 对应 UI 区域与场景 |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `bg-background` / `text-background` | `#f8fafc` (灰白) | `#06090e` (深黑) | Studio 最外层工作台全屏容器底色 |
| `--panel` | `bg-panel` | `#ffffff` (纯白毛玻璃) | `#0b0f19` (暗黑毛玻璃) | 顶部栏 (TopBar)、工具箱 (Toolbox)、检查器、时间轴 |
| `--canvas` | `bg-canvas` | `#e2e8f0` (中灰蓝) | `#04060a` (极深黑) | 无限画布 (InfiniteCanvas) 视口背景 |
| `--card` | `bg-card` / `text-card-foreground` | `#ffffff` | `#111827` | 模板卡片、工程列表、所有模态弹窗 (Modals) 卡片 |
| `--foreground` | `text-foreground` | `#0f172a` (深岩灰) | `#f8fafc` (浅白) | 全局主标题、主要文字内容 |
| `--muted-foreground` | `text-muted-foreground` | `#94a3b8` (次灰) | `#64748b` (暗灰) | 副标题、占位符文字、次要说明、未激活图标 |
| `--primary` | `bg-primary` / `text-primary` | `#0284c7` (海天蓝) | `#38bdf8` (蓝青发光) | 主按键、当前激活图元、选中场景卡片高亮、流光描边 |
| `--primary-foreground` | `text-primary-foreground` | `#ffffff` | `#06090e` | 主强调按键内部的高对比度文字 |
| `--border` | `border-border` | `#e2e8f0` | `#1e293b` | 全局面版边框、分割线、输入框外框 |
| `--muted` | `bg-muted` / `hover:bg-muted` | `#f1f5f9` | `#1e293b` | 按钮悬停背景态、禁用轨道、次要背景胶囊 |
| `--popover` | `bg-popover` / `text-popover-foreground` | `#ffffff` | `#0b0f19` | 悬浮气泡提示 (Tooltip)、下拉弹出菜单 |

#### 3. TopBar 单键循环三态切换器 (3-State Cyclic Switcher)
Studio 顶部导航栏提供单键循环三态主题控制器：
- **状态流转**：`🌙 Dark (暗黑)` ➔ `☀️ Light (明亮)` ➔ `💻 System (跟随系统)` ➔ `🌙 Dark`
- **动态图标指示**：
  - 处于 Dark 态：呈现 `Moon` 图标（主题蓝青高亮）
  - 处于 Light 态：呈现 `Sun` 图标（暖日黄 `#f59e0b` 高亮）
  - 处于 System 态：呈现 `Laptop` 图标（天空蓝 `#0284c7` 高亮）
- **持久化机制**：基于 `next-themes` 自动将用户选中的状态写入 `localStorage.getItem('theme')`，并在页面初始化瞬间通过 inline script 注入 `html.dark` 类名，实现 0 闪烁（No FOUC）体验。

#### 4. 可读性升级排版标尺 (Enhanced Readability Typographic Scale)
为了彻底解决微小字号（$\le 11\text{px}$）在部分屏幕上的阅读费力问题，Studio 全站实行**“零低于 12px 文本”**的舒适性排版规范：
- **`16px (text-base) font-semibold`**：弹窗大标题、顶级操作文案
- **`14px (text-sm) font-semibold/medium`**：TopBar 标题、面板区块标题、表单输入框文本、场景卡片主标题、弹窗选项卡
- **`12px (text-xs) font-medium / font-mono`**：标准操作按键、表单标签 Label、说明文字、Badge 徽章、Tooltip 说明、时间轴切片时长与图元状态计数
- **`容器尺寸自适应联动`**：TopBar 高度升级为 `56px (h-14)`，右侧属性检查器宽度扩展为 `320px (w-80)`，底部时间轴高度升级为 `88px (h-22)`，场景卡片宽度扩展至 `min-w-[200px]`，确保大字号下呼吸感充足且信息紧凑。

---

## 5. 服务端全栈架构、REST API 与数据模型规范 (Full-Stack SaaS Backend)

### 5.1 与 PRODUCT_DESIGN.md 8.3 节的关联性与边界划分 (Correlation & Boundaries)

为了确保产品 PRD 与技术架构 SPEC 的严谨统一，两份文档的分工与边界定义如下：

```
+---------------------------------------------------------------------------------------------------------+
|                                  PRD 商业产品方案  vs  SPEC 技术规格落地                                  |
+----------------------+------------------------------------+---------------------------------------------+
| 评估维度              | PRODUCT_DESIGN.md (第 8.3 节)       | STUDIO_SPEC.md (第 5 节)                    |
+----------------------+------------------------------------+---------------------------------------------+
| 1. 文档定位与视角    | 宏观产品定位、商业价值与用户使用场景| 微观工程实现、API 契约、数据模型与转码管线   |
| 2. 核心回答问题      | “我们要给用户提供哪 4 大核心能力？”| “我们如何用技术架构、数据库与代码实现这 4 大能力？”|
| 3. 颗粒度与交付物    | 模块功能列表、交互流程、商业分享模式| Prisma Schema、REST API 端点签名、错误码定义|
+----------------------+------------------------------------+---------------------------------------------+
```

#### 4 大核心能力的一对一技术映射表：
1. **PRD 模块 1【服务端项目管理与资产托管】** ➔ 映射至 **SPEC §5.2 数据模型 (`Project` & `ProjectVersion` 表)** 与 **SPEC §5.3 项目 CRUD API (`POST /api/projects`, `PUT /api/projects/:id`)**；
2. **PRD 模块 2【服务端单文件 HTML 一键编译下载】** ➔ 映射至 **SPEC §5.3 流式下载控制器 (`GET /api/projects/:id/export/html`)** 与无状态内联打包算法；
3. **PRD 模块 3【服务端 4K 视频 / GIF 云端渲染管线】** ➔ 映射至 **SPEC §5.3 异步转码任务系统 (`POST /api/projects/:id/render/video`)** 与 Remotion / Puppeteer Worker 集群；
4. **PRD 模块 4【云端免部署只读分享与嵌入】** ➔ 映射至 **SPEC §5.3 短链路由 (`GET /s/:slug`)** 与 CSP / `<iframe>` 响应头配置。

---

### 5.2 服务端全栈多服务架构与选型 (Multi-App Backend Architecture)

为了杜绝 4K 视频转码重度消耗 CPU/GPU 导致主 Web API 卡死，服务端采用 **“主 API 服务与转码工作节点物理隔离”** 的多应用架构：

1. **主 RESTful API 服务 (`apps/api`)**：
   * **定位**：轻量 I/O 密集型服务，响应延迟 $<50\text{ms}$；
   * **技术栈**：NestJS + Swagger 接口文档 + DTO `class-validator` 强参数校验；
   * **职责**：项目 CRUD、PostgreSQL 18 数据持久化、S3/OSS 资产直传、独立 HTML 导出与只读短链路由。
2. **4K 视频转码工作节点 (`apps/render-worker`)**：
   * **定位**：重度计算密集型后台 Worker；
   * **技术栈**：NestJS + BullMQ / Redis Queue + Remotion / Puppeteer + FFmpeg 硬件加速；
   * **职责**：消费转码队列任务，无头浏览器逐帧截帧与视频合成，支持独立水平扩缩容。
3. **框架无关数据层 (`packages/database`)**：
   * **数据库**：**PostgreSQL 18** + Prisma ORM；
   * **零 NestJS 依赖**：保持纯粹数据模型定义，仅导出原生 `PrismaClient`，可供 API、Worker 以及离线 CLI 脚本灵活调用。
4. **消息队列强类型契约 (`packages/dsl/src/jobs.ts`)**：
   * 在 `@focusflow/dsl` 统一维护 `RenderVideoJobPayload` 与进度事件接口，确保生产者与消费者 100% 类型一致。

### 5.3 核心数据模型 (`packages/database/prisma/schema.prisma`)
```prisma
model Project {
  id          String   @id @default(uuid())
  title       String
  description String?
  slug        String   @unique
  viewportW   Int      @default(5120)
  viewportH   Int      @default(2880)
  bgImageUrl  String
  dslJson     Json     // 完整 FocusFlow DSL 数据结构
  isPublic    Boolean  @default(false)
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    ProjectVersion[]
}

model ProjectVersion {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versionNo Int
  dslJson   Json
  createdAt DateTime @default(now())
}
```

### 5.4 核心 RESTful API 契约
| 方法 | 端点 | 功能说明 | 核心入参 / 返回 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/projects` | 创建新项目并上传底图 | `multipart/form-data (image, title)` ➔ `{ id, slug, dslJson }` |
| `GET` | `/api/projects/:id` | 获取项目完整 DSL 与资产 | ➔ `{ id, title, dslJson, bgImageUrl }` |
| `PUT` | `/api/projects/:id` | 实时保存项目 DSL | `{ dslJson }` ➔ `{ success: true, updatedAt }` |
| `GET` | `/api/projects/:id/export/html` | 服务端一键下载单文件 HTML | ➔ `Content-Disposition: attachment; filename="*.html"` |
| `POST` | `/api/projects/:id/render/video` | 提交 4K 视频渲染任务 | `{ resolution: "4K"|"1080P", fps: 60 }` ➔ `{ taskId }` |
| `GET` | `/api/tasks/:taskId` | 查询视频渲染进度与下载链接 | ➔ `{ status: "processing"|"done", downloadUrl }` |
| `GET` | `/s/:slug` | 云端只读演示页面入口 | 返回渲染后的只读 FocusFlow Player 播放器 |

---

## 6. Phase 2 研发任务分解与层级跟踪清单 (Hierarchical Task Checklist / WBS)

```
                    【Phase 2 WBS 研发任务层级分解总览】

 ┌────────────────────────────────────────────────────────────────────────┐
 │ ⚡ 第一板块：模式 A（纯前端 100% 离线自治工作台 · 可独立先行发布）     │
 ├────────────────────────────────────────────────────────────────────────┤
 │  • Stage 1: Studio 前端工程基建、Dark/Light 双主题与 react-i18next     │
 │  • Stage 2: 资产导入、IndexedDB 本地持久化与 5 大模板中心              │
 │  • Stage 3: 可视化取景器与 4 大图元标定编辑工具 (Sobel 自动吸附)       │
 │  • Stage 4: 场景关键帧时间轴编排、撤销重做栈与图层矩阵                 │
 │  • Stage 5: 纯前端离线打包 (HTML/ZIP) 与 MediaRecorder 本地视频录制   │
 └────────────────────────────────────────────────────────────────────────┘
                                    │ (模式 A 交付后平滑升维)
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ ☁️ 第二板块：模式 B（云端全栈 SaaS、团队协同与 4K 视频集群）           │
 ├────────────────────────────────────────────────────────────────────────┤
 │  • Stage 6: 数据库层与 Redis 7 基础设施 (PostgreSQL 18 + Prisma)       │
 │  • Stage 7: 主 API 服务、JWT 双 Token 认证与 CASL 细粒度权限           │
 │  • Stage 8: OpenAPI 文档与 Orval 前端 React Query SDK 自动化代码生成   │
 │  • Stage 9: apps/render-worker 异步计算集群 (BullMQ + Remotion+FFmpeg) │
 │  • Stage 10: 云端只读短链分发与 Notion/飞书 iframe 嵌入体系            │
 │  • Stage 11: 前后端全链路联调、E2E 集成测试与双模式平滑切换验证        │
 └────────────────────────────────────────────────────────────────────────┘
```

---

### ⚡ 第一板块：模式 A（纯前端 100% 离线自治工作台研发任务）

#### 🎨 Stage 1: Studio 前端工程基建、双主题与多语言体系 (Foundation, Themes & i18n)
- [x] **1.1 项目脚手架与 UI 组件库搭建**
  - [x] 1.1.1 初始化 React 19 + TypeScript + Vite 8 工程，集成 Tailwind CSS 与原子 UI 组件库（Button, Input, Slider, Badge, Tooltip）
  - [x] 1.1.2 搭建暗黑科技感五栏工作台响应式布局（TopBar, LeftToolbox, CenterCanvas, RightInspector, BottomTimeline）
  - [x] 1.1.3 编写 `WorkbenchLayout.tsx` 沉浸式弹性视口容器
- [x] **1.2 Dark / Light 科技双主题系统与 Semantic Tokens 纯语义类重构**
  - [x] 1.2.1 配置 CSS 语义化颜色变量表（`tokens.css`）与 `next-themes` 主题切换器，建立三层设计系统 Token 映射体系
  - [x] 1.2.2 顶部栏集成 `☀️ Light / 🌙 Dark / 💻 System` 单键循环三态切换器与 localStorage 本地持久化
  - [x] 1.2.3 全站五栏工作台、画布、侧边栏、时间轴、各弹窗与原子 UI 全量重构为纯语义类（`bg-background`, `bg-panel`, `bg-canvas`, `border-border`, `bg-primary` 等），彻底消除 `dark:` 前缀硬编码
- [x] **1.3 强类型多语言国际化体系 (i18n)**
  - [x] 1.3.1 集成 `i18next` + `react-i18next`，按模块拆分中英双语词条模块（`common.ts`, `toolbar.ts`, `inspector.ts`, `timeline.ts`）
  - [x] 1.3.2 配置 `src/i18n.d.ts` 声明合并，实现 TS 编译期 100% 强类型 Key 智能联想补全
- [x] **1.4 可视化无限画布核心容器 (`InfiniteCanvas`)**
  - [x] 1.4.1 实现以光标为中心的平滑几何缩放（Zoom-to-Cursor 数学矩阵算法）与抓手平移（Pan/Grab）
  - [x] 1.4.2 实现视口自适应居中（Shift+1）与 1:1 物理像素对齐（Shift+0）快捷键
- [x] **1.5 全局状态与 E2E 自动化测试质量验证**
  - [x] 1.5.1 Zustand 状态切片架构（`useEditorStore`, `useProjectStore`）双向绑定
  - [x] 1.5.2 Playwright 端到端全流程测试套件编写（独立异步 helper 函数规范）并 100% 编译通过

---

#### 📥 Stage 2: 资产导入、IndexedDB 本地持久化与模板中心 (Ingestion, Local DB & Templates)
- [x] **2.1 极速创建项目与底图解析**
  - [x] 2.1.1 编写 `imageDecoder.ts` 与 `ImageUploadModal.tsx`，利用原生 `Image.decode()` 提取真实天然物理分辨率
  - [x] 2.1.2 自动生成 Scene 0 全景开场场景并初始化 FocusFlow DSL 语法树
- [x] **2.2 本地 IndexedDB 离线持久化与工程管理器**
  - [x] 2.2.1 引入 `idb-keyval` 封装 `storage.ts` 与 `useStorageStore.ts`，实现 500ms 防抖自动存盘与二进制 Blob 持久化
  - [x] 2.2.2 编写 `ProjectManagerModal.tsx`，支持本地工程列表搜索、双击重命名、复制副本、导出 JSON 与物理删除
- [x] **2.3 6 大工业级高精架构模板中心**
  - [x] 2.3.1 内置 6 套工业级预置架构 DSL（LuxeHMS 酒店 PMS 房态调度经典升级版、微服务集群、DDD 模型、K8s 云原生、分布式事务、AI RAG 链路）
  - [x] 2.3.2 编写 `TemplatesModal.tsx` 支持分类过滤与一键克隆应用
- [x] **2.4 全面多语言国际化与 E2E 自动化测试质量验证**
  - [x] 2.4.1 扩充 `upload`, `projects`, `templates` 中英双语模块与 TS 强类型合并
  - [x] 2.4.2 编写 Playwright E2E 全流程测试套件（`stage2-ingestion-storage.spec.ts`）并 100% 验证通过

---

#### 🛠️ Stage 3: 可视化取景与 4 大图元标定编辑工具 (Visual Tools & Framing)
- [x] **3.1 镜头取景器与视口视角捕获 (Camera Viewport Frame & Framing Engine)**
  - [x] 3.1.1 编写 `cameraMath.ts` 与 `CameraFrustumFrame.tsx`，在画布上可视化呈现当前场景的安全可视取景窗口（Frustum）
  - [x] 3.1.2 在属性面板提供“一键捕获当前画布视角”按键，自动计算反解精准 `{ zoom, x, y, duration }`
- [x] **3.2 智能选框可视化绘制与 Sobel 边缘吸附 (Smart Box Tool & Sobel Snapping)**
  - [x] 3.2.1 编写 `edgeSnapper.ts`，实现离屏 $3\times 3$ Sobel 梯度卷积与 $\pm 24\text{px}$ 窄带能量极大值投影算法
  - [x] 3.2.2 编写 `BoxDrawingOverlay.tsx`，支持实时拉框吸附与 `Option` 纯手动绘制直通
- [x] **3.3 拓扑流光连线与 8 向锚点吸附 (Bezier Route Tool & 8-Anchor Snapping)**
  - [x] 3.3.1 编写 `bezierMath.ts` 与 `PathDrawingOverlay.tsx`，实现卡片 8 向锚点可视化捕捉与三次贝塞尔流光连线生成
  - [x] 3.3.2 动态计算法向量与控制点曲率，自动生成平滑流光连线
- [x] **3.4 脉冲定位圆点与解说气泡组件 (Pulse Dot & Callout Badges)**
  - [x] 3.4.1 编写 `DotDrawingOverlay.tsx` 单击放置脉冲圆点与涟漪动效
  - [x] 3.4.2 编写 `CalloutOverlay.tsx` 支持智能选框挂载/绝对定位与发光主题色
  - [x] 3.4.3 编写 `CanvasOverlay.tsx` 统一调度 5 大标定图层状态机
- [x] **3.5 质量门禁与 Playwright E2E 自动化测试**
  - [x] 3.5.1 编写 `stage3-visual-tools.spec.ts` 端到端全流程测试套件并 100% 验证通过

---

#### 🎬 Stage 4: 场景关键帧时间轴编排与图层矩阵 (Sequence Timeline & Layer Matrix)
- [x] **4.1 场景卡片流时间轴 (`TimelineTrack`)**
  - [x] 4.1.1 升级 `BottomTimeline.tsx` 实现原生拖拽排序、复制、删除与双击就地重命名
  - [x] 4.1.2 支持单场景驻留时间（Duration）与总时长动态累加呈现
- [x] **4.2 历史时间旅行栈 (Undo / Redo)**
  - [x] 4.2.1 自研轻量不可变历史栈（`past`, `present`, `future`，上限 50 步），实现 `⌘Z` 撤销与 `⌘⇧Z` 重做
  - [x] 4.2.2 编写 `useHistoryKeyboard.ts` 全局监听快捷键，TopBar 双向绑定
- [x] **4.3 图层可见性矩阵管理与状态继承**
  - [x] 4.3.1 升级 `RightInspector.tsx` 支持全量图元显隐勾选、搜索过滤、快速删除与类型彩色图标
  - [x] 4.3.2 实现 `inheritPreviousSceneElements` 一键继承上一幕所有已点亮图元
- [x] **4.4 国际化与质量门禁 E2E 自动化测试**
  - [x] 4.4.1 扩充 `timeline.ts`, `inspector.ts` 中英双语词条
  - [x] 4.4.2 编写 `stage4-timeline-history.spec.ts` 端到端全流程测试套件并 100% 验证通过

---

#### 📦 Stage 5: 纯前端离线编译、单文件打包与本地视频录制 (Client Compiler, Packager & MediaRecorder)
- [x] **5.1 浏览器端单文件打包器 (`standalonePackager.ts`)**
  - [x] 5.1.1 纯前端将底图与覆盖图转为 Base64 Data URI
  - [x] 5.1.2 动态内联 CSS 样式与 `@focusflow/player` IIFE 运行时，使用 `Blob` 实现 0 延迟一键下载独立 `.html`
- [x] **5.2 纯前端 ZIP 工程压缩导出 (`zipExporter.ts`)**
  - [x] 5.2.1 集成 `jszip`，在浏览器内存中直接生成包含底图、覆盖图与 `config.json` 的标准压缩包
- [x] **5.3 纯前端客户端视频录制 (`canvasRecorder.ts`)**
  - [x] 5.3.1 基于 HTML5 `MediaRecorder` API 实现纯本地 60FPS 实时截帧录制，导出 WebM
- [x] **5.4 实时受众全屏预览模式 (`AudienceModal.tsx`)**
  - [x] 5.4.1 在工作台内提供一键全屏真实受众视角试播与翻页演示测试，支持键盘快捷键
- [x] **5.5 质量门禁与 Playwright E2E 自动化测试**
  - [x] 5.5.1 编写 `stage5-export-compiler.spec.ts` 端到端全流程测试套件并 100% 验证通过

---

### ☁️ 第二板块：模式 B（云端全栈 SaaS、团队协同与 4K 视频集群研发任务）

#### 🗄️ Stage 6: 数据库层与 Redis 7 基础设施 (PostgreSQL 18 + Prisma + Redis 7)
- [ ] **6.1 `packages/database` 纯粹数据层构建**
  - [ ] 6.1.1 编写 `schema.prisma` 模型定义（Project, ProjectVersion, Asset, RenderJob, User），配置 PostgreSQL 18 JSONB 字段
  - [ ] 6.1.2 执行 Prisma 首次迁移生成客户端代码
- [ ] **6.2 Prisma 事务、并发锁与自动审计日志**
  - [ ] 6.2.1 实现 Prisma Client 自动写入审计日志扩展（`audit.extension.ts`），记录每次 DSL 变更 Diff
- [ ] **6.3 Docker Compose 本地基础设施编排**
  - [ ] 6.3.1 编写根目录 `docker-compose.yml`，一键拉起 PostgreSQL 18 与 Redis 7 容器服务

---

#### ⚡ Stage 7: 主 API 服务、JWT 认证与 CASL 细粒度权限 (NestJS API, Auth & CASL)
- [ ] **7.1 NestJS RESTful API 基础架构**
  - [ ] 7.1.1 搭建 `apps/api` 工程，配置全局 `ValidationPipe`、Swagger OpenAPI 交互式文档与全局异常过滤器
  - [ ] 7.1.2 实现 `ProjectsService` 与项目 CRUD、版本快照保存逻辑
- [ ] **7.2 JWT 双 Token 身份认证体系 (AuthN)**
  - [ ] 7.2.1 实现登录注册、短效 Access Token (15min) 与 HttpOnly Cookie Refresh Token (7天) 静默刷新
  - [ ] 7.2.2 配置全局 `JwtAuthGuard` 守卫与 `@Public()` 装饰器白名单机制
- [ ] **7.3 CASL 前后端同构细粒度授权 (AuthZ / ABAC)**
  - [ ] 7.3.1 编写 `CaslAbilityFactory`，定义 Owner, Editor, Viewer 与免费用户 4K 渲染限制规则
  - [ ] 7.3.2 深度集成 `@casl/prisma`，实现项目列表安全查询（`accessibleBy` 自动注入 SQL WHERE）
  - [ ] 7.3.3 前端 Studio 引入 `@casl/react`，使用 `<Can>` 声明式控制按钮显隐与禁用态
- [ ] **7.4 静态资产直传与 CDN 托管**
  - [ ] 7.4.1 集成 S3 / 阿里云 OSS / 腾讯云 COS 对象存储直传凭证签发与元数据探测

---

#### 🌐 Stage 8: OpenAPI 规范与 Orval 强类型前端 SDK 自动生成 (Orval + React Query Integration)
- [ ] **8.1 OpenAPI 3.0 规范导出与 Orval 编译器配置**
  - [ ] 8.1.1 配置 NestJS 自动化导出 `apps/api/openapi.json` 规范文件
  - [ ] 8.1.2 配置 `apps/studio/orval.config.ts`，指定 `tags-split` 与原生 `fetch` 客户端
- [ ] **8.2 强类型 SDK 生成与 React Query 接入**
  - [ ] 8.2.1 配置 `pnpm generate:api` 命令，一键生成 React Query v5 Hooks 与 DTO Interface
  - [ ] 8.2.2 在 Studio 前端属性面板全面替换为自动生成的 `useUpdateProject` 等 Hooks，实现属性修改的乐观更新

---

#### 🎥 Stage 9: 4K 60fps 视频异步渲染计算集群 (Render-Worker + BullMQ + Remotion + FFmpeg)
- [ ] **9.1 消息队列强类型契约与分发 (`packages/dsl/jobs.ts`)**
  - [ ] 9.1.1 完善 `RenderVideoJobPayload` 契约，在 `apps/api` 中实现任务入队投递接口
- [ ] **9.2 渲染工作节点工程构建 (`apps/render-worker`)**
  - [ ] 9.2.1 搭建 NestJS Worker 守护进程，配置 `@nestjs/bullmq` 消费者与单节点并发限流（Concurrency = 2）
- [ ] **9.3 无头 Chromium 逐帧步进截帧与 FFmpeg 硬件加速合成**
  - [ ] 9.3.1 深度复用 `@focusflow/player` 内核，驱动无头浏览器执行精确时间步进（Deterministic Stepping）
  - [ ] 9.3.2 搭建 FFmpeg 硬件加速流水线（NVENC / VideoToolbox），支持 4K 60fps ProRes / H.265 / 高清 GIF 导出
- [ ] **9.4 实时进度广播与 WebSocket 推送**
  - [ ] 9.4.1 Worker 逐帧截帧时通过 Redis Pub/Sub 发布进度，主 API 订阅并通过 WebSocket 实时推送给 Studio 进度条

---

#### 🔗 Stage 10: 云端只读短链分发与知识库嵌入系统 (Share & Embed)
- [ ] **10.1 沉浸式只读短链路由 (`/s/:slug`)**
  - [ ] 10.1.1 实现极速只读演示页面，根据短链 Slug 秒级拉取 DSL 并挂载 Player 播放器
- [ ] **10.2 知识库 `<iframe>` 嵌入标签生成**
  - [ ] 10.2.1 提供自适应 HTML `<iframe>` 嵌入代码，支持无缝嵌入 Notion、飞书文档、语雀与 Docusaurus
  - [ ] 10.2.2 配置合规安全响应头（Content-Security-Policy & X-Frame-Options）

---

#### 🔄 Stage 11: 前后端全链路联调、E2E 集成测试与双模式切换验证 (Integration, E2E Testing & Verification)
- [ ] **11.1 身份认证与 Token 生命周期全链路联调**
  - [ ] 11.1.1 联调登录、注册、Logout 流程，验证 Access Token (Bearer) 注入与 HttpOnly Cookie 自动携带
  - [ ] 11.1.2 联调 401 Token 过期拦截器，验证无感静默调用 `/api/auth/refresh` 并在续期成功后无缝重试原请求
- [ ] **11.2 模式 A ➔ 模式 B 草稿“一键上云”与双向同步联调**
  - [ ] 11.2.1 联调本地草稿向云端持久化的迁移通道（`LocalStorageAdapter` ➔ `CloudApiAdapter`），一键将本地底图与 DSL 资产转存至 PostgreSQL 18
  - [ ] 11.2.2 验证云端项目保存、版本快照回滚与并发编辑冲突策略
- [ ] **11.3 S3/OSS 大文件直传与画布资产加载联调**
  - [ ] 11.3.1 联调前端直传 4K 底图与覆盖图至 S3/OSS，测试直传进度条与断点续传
  - [ ] 11.3.2 验证 CDN 加速直链返回后 Studio 画布与 Player 视口的像素级秒开加载
- [ ] **11.4 4K 视频云端异步渲染全链路闭环联调**
  - [ ] 11.4.1 联调 Studio 提交转码任务 ➔ API 写入 BullMQ ➔ `apps/render-worker` 消费执行无头 Chromium 逐帧截帧与 FFmpeg 硬件加速合成
  - [ ] 11.4.2 验证 Redis Pub/Sub 广播转码进度 ➔ WebSocket 直推 Studio 进度条 ➔ 渲染完成自动弹出 CDN 4K MP4 下载
- [ ] **11.5 CASL 团队协同与权限防越权联调**
  - [ ] 11.5.1 验证 Owner, Editor, Viewer 三种角色的前端 UI 控制（按钮显隐/禁用）与后端 Guard 拦截的 100% 一致性
  - [ ] 11.5.2 验证免费用户发起 4K 渲染时前端提示升级与后端 Guard 拦截闭环
- [ ] **11.6 自动化 E2E 全链路集成测试套件**
  - [ ] 11.6.1 编写 Playwright E2E 测试脚本（覆盖“从拖图创建 ➔ 选框编辑 ➔ 时间轴排序 ➔ 保存云端 ➔ 导出单文件/视频”全流程）
  - [ ] 11.6.2 集成至 CI/CD 自动化流水线，作为合并代码的核心质量红线守门员

---

## 7. Phase 2 验收测试标准 (Acceptance Criteria)

| 验收项 | 验收指标与测试标准 | 预期结果 |
| :--- | :--- | :--- |
| **1. 拖拽创建项目** | 将一张 4K/8K 架构图直接拖入 Studio 工作台 | 1 秒内完成分辨率探测，自动初始化画布与 Scene 0 镜头 |
| **2. 可视化取景与运镜** | 缩放画布至目标区域，点击“捕获镜头” | 自动换算精确的 `zoom/x/y`，在时间轴切换时精准还原运镜 |
| **3. 智能选框绘制** | 在目标卡片外随手粗拉框 | 松手瞬间触发 $\pm 24\text{px}$ Sobel 精修，自动咬合外边框 |
| **4. 纯手动直通拉框** | 按住 `⌘/Option` 拖拽选框 | 100% 精确保留手动画框坐标，零算法干预 |
| **5. 贝塞尔连线吸附** | 从卡片 A 锚点拖出线条连接至卡片 B 锚点 | 自动推导平滑三次贝塞尔曲线，并实时呈现跑马灯流光预览 |
| **6. 气泡所见即所得** | 拖拽气泡在画布任意位置并修改标题和描述 | 属性实时更新，并在演示预览时阶梯弹性弹入 |
| **7. 纯前端离线下载** | 在无网络/纯前端模式下点击“导出单文件 HTML” | 浏览器瞬间弹出独立 `.html` 下载，离线双击完美运行 |
| **8. 时间轴拖拽排序** | 在底部时间轴拖拽调整 Scene 1 和 Scene 2 的顺序 | 场景顺序立即更新，播放状态机按新顺序流转 |
| **9. 云端短链只读分享** | 打开 `https://focusflow.io/s/[slug]` | 任何设备免登录直接全屏交互式观看演示 |
| **10. 4K 视频云端渲染** | 提交 4K MP4 导出任务 | 服务端异步完成 60fps 高清转码并提供 MP4 文件下载 |
