# FocusFlow - Phase 1 (MVP) 研发执行规格与极简标定开发指南
## MVP Engineering & In-Player Calibration Tooling Specification

> **关联文档**：
> - 📄 [PRODUCT_DESIGN.md (主产品方案与 PRD)](file:///Users/xt/WebstormProjects/focusflow/design/PRODUCT_DESIGN.md)
> - 📐 [MOTION_ENGINE_SPEC.md (动效数学与渲染规格)](file:///Users/xt/WebstormProjects/focusflow/design/MOTION_ENGINE_SPEC.md)
> 
> **适用对象**：Phase 1 核心研发工程师、前端开发  
> **文档定位**：MVP 阶段直接落地的代码级执行手册

---

## 目录 (Table of Contents)
- [1. MVP 核心定位与工程边界](#1-mvp-核心定位与工程边界)
- [2. MVP 文件组织结构与交付物](#2-mvp-文件组织结构与交付物)
- [3. 消费端播放器核心实现规范 (Player Core)](#3-消费端播放器核心实现规范-player-core)
- [4. 内置极简标定模式深度设计 (HUD Calibration Mode)](#4-内置极简标定模式深度设计-hud-calibration-mode)
  - [4.1 模式一：鼠标拖拽拉框与实时坐标生成](#41-模式一鼠标拖拽拉框与实时坐标生成-drag-to-box)
  - [4.2 模式二：单点点击像素边缘智能吸附](#42-模式二单点点击像素边缘智能吸附-pixel-edge-snap)
  - [4.3 模式三：一键捕获当前镜头矩阵参数](#43-模式三一键捕获当前镜头矩阵参数-camera-capture)
  - [4.4 标定浮层 UI 与一键复制 JSON](#44-标定浮层-ui-与一键复制-json)
- [5. MVP 核心代码骨架参考 (Reference Code)](#5-mvp-核心代码骨架参考-reference-code)
- [6. MVP 研发任务分解与层级跟踪清单 (Hierarchical Task Checklist)](#6-mvp-研发任务分解与层级跟踪清单-hierarchical-task-checklist)
- [7. MVP 研发测试与验收标准 (Acceptance Criteria)](#7-mvp-研发测试与验收标准-acceptance-criteria)
- [8. 客户端形态定位考量与全栈服务端 (SaaS) 平滑演进全景](#8-客户端形态定位考量与全栈服务端-saas-平滑演进全景)
  - [8.1 当前 MVP 客户端与本地优先 (Local-First) 的定位考量](#81-当前-mvp-客户端与本地优先-local-first-的定位考量)
  - [8.2 服务端 (SaaS) 演进的 4 大核心能力模块](#82-服务端-saas-演进的-4-大核心能力模块)
  - [8.3 当前 MVP 架构资产在服务端的 100% 平滑复用机制](#83-当前-mvp-架构资产在服务端的-100-平滑复用机制)

---

## 1. MVP 核心定位与工程边界

### 1.1 核心目标
在 **零外部大型 UI 框架依赖**（无需 React 复杂编辑器、无需庞大构建流水线）的前提下，用最克制、优雅的原生代码实现两大目标：
1. **震撼的消费端交互播放体验**：达到并超越 `arch-explorer.html` 的视觉与交互标准（全景 ➔ 细节运镜、SVG 生长发光、数据流线、气泡阶梯弹入、全套键盘/轮播控制）。
2. **极速的制作标定辅助工具（HUD Overlay）**：在播放器内内置一个仅需快捷键触发的透明调试层，实现“**在图上点几下、框几下，一键复制 JSON**”，将新图配置时间从数小时压缩至 3 分钟以内。

### 1.2 明确工程边界
```
+-----------------------------------------------------------------------------------------------+
|                                    MVP 阶段功能范围界定                                         |
+----------------------------------------------------+------------------------------------------+
| ✅ Phase 1 MVP 必须做 (Must Have)                   | ❌ Phase 1 MVP 坚决不做 (Postponed to P2/P3)  |
+----------------------------------------------------+------------------------------------------+
| • 数据解耦的通用播放器类 FocusFlowPlayer           | • 复杂的 Web 编辑器后台与侧边栏多面板    |
| • 纯 JSON DSL 驱动的场景/图形动态渲染              | • 在线多用户协同编辑与云端数据库存储     |
| • 自动几何测长与三次贝塞尔流线推导                 | • 可视化拖拽时间轴控件 (Timeline Track)  |
| • 内置 HUD 标定工具（十字准星 / 拖拽拉框 / 点击吸附)| • AI 视觉全自动识别云端服务              |
| • 静态独立单文件 HTML 导出                         | • 服务端 Remotion 视频云渲染管线         |
+----------------------------------------------------+------------------------------------------+
```

---

## 2. 工程目录结构与平滑演进路线 (Directory Structure & Progressive Evolution)

### 2.1 MVP 标准工程目录规划
项目采用**职责高度解耦**的现代化工程目录，将“设计文档”、“验证性 POC”、“通用渲染引擎源码”与“实战示例”清晰划界：

```
focusflow/
├── 📚 design/                     # 产品设计与技术规格文档
│   ├── PRODUCT_DESIGN.md         # 主 PRD 与产品演进路线图
│   ├── MVP_SPEC.md               # Phase 1 研发执行与 HUD 标定模式手册
│   └── MOTION_ENGINE_SPEC.md     # 动效数学、坐标映射与渲染管线专刊
│
├── 🧪 poc/                        # 历史验证性原型 (硬编码验证代码与原图)
│   ├── 01-system_architecture_dark.png
│   └── arch-explorer.html        # 4 场景全交互 POC 单文件
│
├── 🚀 src/                        # MVP 通用播放器与标定器核心源码 (纯 TypeScript/JS)
│   ├── core/                     # 核心生命周期与状态机
│   │   ├── player.js             # FocusFlowPlayer 主类
│   │   ├── state-machine.js      # 场景步骤与自动轮播状态机
│   │   └── camera.js             # GPU 3D 镜头运动学与安全边界算法
│   ├── motion/                   # 矢量与动效子引擎
│   │   ├── geometry.js           # 自动几何测长与圆角矩形周长推导
│   │   ├── bezier-router.js      # 8向锚点与三次贝塞尔自动控制点推导
│   │   └── animator.js           # 双 RAF 描边生长与阶梯气泡调度
│   ├── hud/                      # 内置开发者标定工具层
│   │   ├── crosshair.js          # 十字准星与坐标逆投影计算
│   │   ├── box-picker.js         # 鼠标拖拽拉框生成选框
│   │   └── edge-snapper.js       # 离屏 Canvas 像素梯度智能边缘吸附
│   ├── styles/                   # 样式与滤镜
│   │   └── focusflow.css         # 播放器与 HUD 标定 UI 样式
│   └── index.js                  # 统一入口导出
│
├── 💡 examples/                   # 官方示例演示库
│   ├── luxehms/                  # LuxeHMS 拓扑图完整实战示例
│   │   ├── config.json           # 标准 DSL 配置文件
│   │   ├── image.png             # 底图
│   │   └── index.html            # 运行预览入口
│   └── simple-demo/              # 极简双模块示例 (用于快速测试)
│
├── 📦 bin/                        # [Phase 1 后期] 极简 CLI 打包工具
│   └── focusflow-build.js        # 一条命令将 config.json + image 编译为单文件 HTML
│
├── 📖 README.md                   # 项目首页介绍与快速上手指南
├── ⚙️ package.json                # 项目元数据与脚本 (npm run dev / npm test)
└── 🛡️ .gitignore                  # Git 忽略配置
```

---

### 2.2 核心解耦架构：为什么此结构能无缝延续到 React 时代？

在 MVP 阶段编写的算法和逻辑（坐标变换、三次贝塞尔推导、像素梯度边缘吸附、几何周长测算）属于 **“纯数学与图形学渲染底座”**，**天然与任何 UI 框架解耦**：

```
+---------------------------------------------------------------------------------------+
|  上层 UI 生态层  |  [React 播放器组件]   [React 19 Studio 工作台]   [Vue/WebComponent 包装] |
|                 |  (@focusflow/react)    (SaaS 可视化编辑器)         (技术文档站嵌入)       |
+-----------------+---------------------------------------------------------------------+
                                         ↓ 均调用同一套底层内核
+---------------------------------------------------------------------------------------+
|  底层核心引擎层  |  FocusFlow Core Engine (纯 TypeScript / JavaScript 数学与渲染底座)   |
|  (MVP 沉淀产物) |  • 贝塞尔路由推导 (BezierRouter)    • 像素边缘梯度吸附 (EdgeSnapper)    |
|                 |  • 自动几何测长 (GeometryCalc)      • GPU 镜头运动学 (Camera)           |
+---------------------------------------------------------------------------------------+
```

---

### 2.3 引入 React 后的平滑目录演进（两种路径）

#### 路径 1：轻量平滑演进（单工程目录，推荐中小规模）
无需重构项目骨架，直接在 `src/` 中按职责新增 `react/`（组件包装）与 `studio/`（工作台界面）：

```
focusflow/
├── design/                 # 文档规范
├── poc/                    # 历史原型
├── src/
│   ├── core/               # 【MVP沉淀】纯 JS/TS 动效算法内核 (Camera, Bezier, Geometry)
│   ├── hud/                # 【MVP沉淀】极简标定工具 (Crosshair, EdgeSnapper)
│   │
│   ├── react/              # 【引入 React 后新增】React 专属封装
│   │   ├── useFocusFlow.ts # React 自定义 Hook
│   │   └── Player.tsx      # <FocusFlowPlayer dsl={...} /> 组件
│   │
│   └── studio/             # 【引入 React 后新增】React 19 创作工作室界面
│       ├── components/     # TopBar, Inspector, Timeline, AssetPanel (shadcn/ui)
│       ├── store/          # Zustand 状态管理
│       └── App.tsx         # Studio 工作台根组件
│
├── examples/               # 官方示例 (含 React 版与原生版 Demo)
└── package.json
```

#### 路径 2：工业级 Monorepo 演进（pnpm workspace，如 tldraw / excalidraw）
若后续将产品开源或作为独立 NPM 包矩阵发布，可无缝升级为 Monorepo：

```
focusflow/
├── packages/
│   ├── core/               # @focusflow/core (MVP 沉淀的纯算法与渲染内核包)
│   ├── react/              # @focusflow/react (React 播放器组件包)
│   ├── studio/             # @focusflow/studio (React 19 可视化 Web SaaS 网站)
│   └── cli/                # @focusflow/cli (命令行单文件离线打包工具)
```

---

## 3. 消费端播放器核心实现规范 (Player Core)

### 3.1 完整 TypeScript 类型定义 (Data Contract)
```typescript
export interface FocusFlowDSL {
  $schema?: string;
  meta: {
    title: string;
    viewport: { width: number; height: number };
    theme?: {
      bg?: string;
      accent?: string;
      warn?: string;
      green?: string;
      amber?: string;
      [key: string]: string | undefined;
    };
  };
  asset: {
    url: string; // 支持相对路径、绝对路径或 base64
  };
  elements: {
    boxes: ElementBox[];
    paths: ElementPath[];
    dots?: ElementDot[];
    images?: ElementImage[]; // ✨ 动态覆盖图元池
  };
  scenes: SceneStep[];
}

export interface ElementBox {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    glow?: boolean;
  };
}

export interface ElementPath {
  id: string;
  from?: string; // e.g. "box-folio.right"
  to?: string;   // e.g. "box-postgres.left"
  d?: string;    // 手动指定的 SVG 路径 (若无则由引擎自动推导三次贝塞尔)
  style?: {
    stroke?: string;
    strokeWidth?: number;
    mode?: 'draw' | 'stream' | 'pulse'; // 动画模式
  };
}

export interface ElementDot {
  id: string;
  cx: number;
  cy: number;
  r?: number;
  style?: {
    fill?: string;
    glow?: boolean;
  };
}

export interface ElementImage {
  id: string;
  url: string;        // 图片路径 (支持相对路径、绝对路径或 base64)
  x: number;          // 5120x2880 坐标系 X 坐标
  y: number;          // 5120x2880 坐标系 Y 坐标
  width: number;      // 宽度
  height: number;     // 高度
  style?: {
    borderRadius?: number; // 圆角
    boxShadow?: boolean;   // 是否启用悬浮立体投影
    animation?: 'fade' | 'zoom-fade'; // 弹入动效模式
  };
}

export interface CalloutItem {
  id: string;
  targetBoxId?: string;
  position: { left: string; top: string };
  theme?: 'blue' | 'pink' | 'green' | 'amber';
  title: string;
  desc: string;
}

export interface SceneStep {
  id: string;
  title: string;
  camera: {
    zoom: number;       // 缩放倍率 (e.g. 1.0 ~ 2.5)
    x: number;          // 水平偏移百分比 (e.g. -14 ~ 23)
    y: number;          // 垂直偏移百分比 (e.g. 0 ~ 15)
    duration?: number;  // 运镜过渡时长 (秒，默认 1.2s)
  };
  activeElements: {
    boxes?: string[];     // 当前场景激活的高亮框 ID 列表
    paths?: string[];     // 当前场景激活的流动连线 ID 列表
    dots?: string[];      // 当前场景激活的脉冲点 ID 列表
    images?: string[];    // ✨ 当前场景激活的动态覆盖图片 ID 列表
    callouts?: CalloutItem[]; // 当前场景展示的解说气泡列表
  };
}
```

---

### 3.2 `FocusFlowPlayer` 类架构与状态机生命周期
```javascript
export class FocusFlowPlayer {
  constructor(options) {
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) 
      : options.container;
    this.dsl = options.dsl;
    this.debug = !!options.debug;
    this.autoPlayInterval = options.autoPlayInterval || 3800;

    // 内部运行时状态
    this.curStep = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.elementsMap = new Map(); // id -> DOM Element

    this.init();
  }

  init() {
    this.buildDOM();
    this.renderSVGAndCallouts();
    this.bindEvents();
    this.goToStep(0, false); // 初始全景无动画瞬切
    if (this.debug) this.initHUD();
  }

  // 1. 构建外层容器、Stage、底图
  buildDOM() { /* ... */ }

  // 2. 动态挂载 SVG 元素并自动调用几何计算
  renderSVGAndCallouts() { /* ... */ }

  // 3. 核心场景调度与双重 RAF 防抖过渡
  goToStep(stepIndex, animate = true) {
    const scene = this.dsl.scenes[stepIndex];
    if (!scene) return;
    this.curStep = stepIndex;

    // A. 驱动 GPU 镜头运镜
    this.applyCamera(scene.camera, animate);

    // B. 重置所有非当前场景元素
    this.resetAllElements();

    // C. 双重 RAF 延迟激活当前场景元素，保证 CSS transition 平滑
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.activateElements(scene.activeElements);
      });
    });

    // D. 同步进度条与底栏高亮
    this.updateControlsUI();
  }

  // 4. 事件监听 (键盘 ArrowLeft/Right/Space/P/Home/End、窗口 resize 自适应)
  bindEvents() { /* ... */ }

  // 5. 自动轮播控制器
  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.playTimer = setInterval(() => {
        const nextIdx = (this.curStep + 1) % this.dsl.scenes.length;
        this.goToStep(nextIdx);
      }, this.autoPlayInterval);
    } else {
      clearInterval(this.playTimer);
    }
    this.updatePlayButtonUI();
  }
}
```

---

## 4. 内置极简标定模式深度设计 (HUD Calibration Mode)

在播放器运行时，通过追加 URL 参数 `?debug=1` 或按下快捷键 `Ctrl + Shift + D`，即激活 **HUD 开发者标定层**。

```
+-----------------------------------------------------------------------------------+
|  [HUD Active] 鼠标逻辑坐标: (X: 1664, Y: 780) | 当前缩放: 1.75x                      |
|                                                                                   |
|    +----------------------------------+                                           |
|    |  [拉框 / 点击吸附高亮预览框]      |  <--- 鼠标拖拽或单点点击自动生成的选框      |
|    +----------------------------------+                                           |
|                                                                                   |
|  [ 浮层操作条 ]                                                                   |
|  [ 复制选框 JSON ]  [ 自动吸附最近边缘 ]  [ 捕获当前镜头矩阵 ]  [ 退出标定 (ESC) ]  |
+-----------------------------------------------------------------------------------+
```

---

### 4.1 模式一：鼠标拖拽拉框与实时坐标生成 (Drag-to-Box)

#### 1. 屏幕坐标 ➔ 画布逻辑坐标逆变换公式
由于外层容器处于 `scale(Z)` 与 `translate(Tx%, Ty%)` 状态，鼠标事件获取的屏幕像素 $(X_{screen}, Y_{screen})$ 必须转换为原始图片的逻辑像素 $(X_{canvas}, Y_{canvas})$：

```javascript
function screenToCanvasCoords(clientX, clientY, imageWrapEl, baseWidth, baseHeight) {
  const rect = imageWrapEl.getBoundingClientRect();
  // 计算在当前缩放矩形内的相对比例 (0.0 ~ 1.0)
  const ratioX = (clientX - rect.left) / rect.width;
  const ratioY = (clientY - rect.top) / rect.height;
  
  // 映射到原始物理分辨率 (如 5120 x 2880)
  const x = Math.round(ratioX * baseWidth);
  const y = Math.round(ratioY * baseHeight);
  return { x: Math.max(0, Math.min(baseWidth, x)), y: Math.max(0, Math.min(baseHeight, y)) };
}
```

#### 2. 拖拽交互事件流
* **`mousedown`**：记录起点 $(X_0, Y_0)$，在 SVG 动态插入临时选框 `<rect id="_debug_temp_box" stroke-dasharray="8,8" stroke="#38bdf8" fill="rgba(56,189,248,0.15)">`。
* **`mousemove`**：计算当前点 $(X_t, Y_t)$，实时更新选框位置与大小：
  $x = \min(X_0, X_t), \quad y = \min(Y_0, Y_t), \quad w = |X_t - X_0|, \quad h = |Y_t - Y_0|$。
* **`mouseup`**：完成绘制，弹窗显示参数，并自动调用 `navigator.clipboard.writeText(...)` 复制标准 DSL 片段。

---

### 4.2 模式二：单点点击像素边缘智能吸附 (Pixel Edge Snap)

在标定模式下，按住 `Alt` 键在某个卡片内部单击一下，算法自动向四周扩展并锁死卡片边界：

```javascript
function autoSnapBoxFromPoint(clickCanvasX, clickCanvasY, offscreenCtx, baseWidth, baseHeight) {
  const imgData = offscreenCtx.getImageData(0, 0, baseWidth, baseHeight).data;
  
  function getBrightness(x, y) {
    const idx = (y * baseWidth + x) * 4;
    return (imgData[idx] + imgData[idx + 1] + imgData[idx + 2]) / 3;
  }
  
  const startB = getBrightness(clickCanvasX, clickCanvasY);
  const THRESHOLD = 25; // 色差跃变阈值
  
  // 向左探测
  let minX = clickCanvasX;
  while (minX > 0 && Math.abs(getBrightness(minX, clickCanvasY) - startB) < THRESHOLD) minX--;
  
  // 向右探测
  let maxX = clickCanvasX;
  while (maxX < baseWidth && Math.abs(getBrightness(maxX, clickCanvasY) - startB) < THRESHOLD) maxX++;
  
  // 向上探测
  let minY = clickCanvasY;
  while (minY > 0 && Math.abs(getBrightness(clickCanvasX, minY) - startB) < THRESHOLD) minY--;
  
  // 向下探测
  let maxY = clickCanvasY;
  while (maxY < baseHeight && Math.abs(getBrightness(clickCanvasX, maxY) - startB) < THRESHOLD) maxY++;
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rx: 16
  };
}
```

---

### 4.3 模式三：一键捕获当前镜头矩阵参数 (Camera Capture)

当创作者在标定模式下自由缩放平移至满意的局部镜头后，点击 **“Capture Camera”**，系统直接输出当前 Scene 的镜头配置：

```json
{
  "zoom": 1.75,
  "x": -14,
  "y": 8,
  "duration": 1.2
}
```

---

### 4.4 标定浮层 UI 与一键复制 JSON

标定层右下角提供轻量级控制台：
```html
<div class="focusflow-hud-panel">
  <div class="hud-header">🎯 FocusFlow 标定助手 (Debug Active)</div>
  <div class="hud-coords">坐标: <span id="_hud_val">X: 0, Y: 0</span></div>
  <div class="hud-actions">
    <button id="_btn_copy_box">📋 复制当前选框 JSON</button>
    <button id="_btn_copy_camera">📷 复制当前镜头 JSON</button>
  </div>
</div>
```

---

## 5. MVP 核心代码骨架参考 (Reference Code)

### 5.1 `index.html` 极简运行骨架
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FocusFlow Showcase</title>
  <link rel="stylesheet" href="focusflow-player.css">
</head>
<body>
  <div id="app"></div>

  <script src="focusflow-player.js"></script>
  <script>
    fetch('config.json')
      .then(res => res.json())
      .then(dsl => {
        new FocusFlowPlayer({
          container: '#app',
          dsl: dsl,
          debug: false // 快捷键 Ctrl+Shift+D 随时唤起标定模式
        });
      });
  </script>
</body>
</html>
```

---

## 6. MVP 研发任务分解与层级跟踪清单 (Hierarchical Task Checklist)

本清单用于全面跟踪 Phase 1 (MVP) 的研发任务流与进度状态：

### 🎯 Stage 1: 项目基础架构与工程脚手架 (Scaffolding & Setup)
- [x] **1.1 项目基础环境与依赖配置**
  - [x] 1.1.1 初始化 Git 仓库，配置默认 `main` 分支与标准 `.gitignore`
  - [x] 1.1.2 初始化 pnpm 项目，配置 `package.json` 元数据与脚本 (`dev`, `build`, `preview`)
  - [x] 1.1.3 安装并验证极速开发服务器 `vite`
- [x] **1.2 目录骨架与类型声明**
  - [x] 1.2.1 创建 `src/core/`, `src/motion/`, `src/hud/`, `src/styles/` 目录
  - [x] 1.2.2 创建 `src/types/dsl.d.ts` 提供完整的 TypeScript 数据结构类型提示
- [x] **1.3 核心 CSS 动效与发光滤镜库**
  - [x] 1.3.1 编写 `src/styles/focusflow.css`（Stage 视口、毛玻璃 Callout、控制栏与进度条样式）
  - [x] 1.3.2 配置 SVG Drop-shadow 与 Neon Glow 滤镜矩阵

---

### 🚀 Stage 2: 消费端播放器核心与状态机 (Player Core & Lifecycle Engine)
- [x] **2.1 `FocusFlowPlayer` 基础类封装与 DOM 动态装配 (`src/core/player.js`)**
  - [x] 2.1.1 构造函数参数校验（`container`, `dsl`, `options`）与默认值填充
  - [x] 2.1.2 动态构建 3 层视觉叠加体系（`.stage > .image-wrap`、`<svg class="svg-overlay">`、`.callout-container`）
  - [x] 2.1.3 底图资源预加载与解码状态监听（`img.decode()` 骨架屏保护）
- [x] **2.2 GPU 镜头运动学与安全边界算法 (`src/core/camera.js`)**
  - [x] 2.2.1 实现 `applyCamera(cameraConfig, animate)` 硬件加速变换 (`scale` + `translate`)
  - [x] 2.2.2 实现安全视口边界钳位算法（$|T_x|, |T_y| \le \frac{Z-1}{2Z} \times 100\%$）
- [x] **2.3 场景状态机与双重 RAF 防抖调度 (`src/core/state-machine.js`)**
  - [x] 2.3.1 实现 `goToStep(index)`、`next()`、`prev()` 状态流转
  - [x] 2.3.2 实现双重 `requestAnimationFrame` 延迟激活机制，杜绝 CSS Transition 样式竞争与闪烁
  - [x] 2.3.3 实现自动轮播定时器、末尾智能归位与暂停/恢复逻辑 (`togglePlay`)
- [x] **2.4 全维交互控制系统 (`src/core/events.js`)**
  - [x] 2.4.1 键盘快捷键监听（`ArrowLeft/Right`, `Space`, `P`, `Home`, `End`, `Ctrl+Shift+D`）
  - [x] 2.4.2 底部控制栏动态生成（场景切换按钮、进度条动态同步、播放/暂停按钮）
  - [x] 2.4.3 窗口 `resize` 弹性视口自适应重算

---

### 📐 Stage 3: 矢量动效与拓扑几何子引擎 (Vector & Motion Sub-Engines)
- [x] **3.1 自动几何测长与选框生成器 (`src/motion/geometry.js`)**
  - [x] 3.1.1 实现圆角矩形闭合周长精准推导算法（$P = 2(w+h) - 1.7168 \cdot r_x$）
  - [x] 3.1.2 实现通用 SVG 图元动态挂载与 `getTotalLength()` 自动弧长获取
  - [x] 3.1.3 自动设置 `strokeDasharray` 与 `strokeDashoffset` 初始隐藏态
- [x] **3.2 拓扑流向与三次贝塞尔路由推导 (`src/motion/bezier-router.js`)**
  - [x] 3.2.1 实现 8 向标准吸附锚点坐标计算函数 `getAnchorCoord(cardRect, anchorName)`
  - [x] 3.2.2 实现起终点三次贝塞尔控制点自动推导算法（自动生成 `M x1 y1 C cp1x cp1y, cp2x cp2y, x2 y2`）
- [x] **3.3 动效管线与解说气泡编排器 (`src/motion/animator.js`)**
  - [x] 3.3.1 实现选框描边生长（Draw-in）与发光激活管线
  - [x] 3.3.2 实现持续流动跑马灯（Streaming Dash）与脉冲圆点呼吸动画
  - [x] 3.3.3 实现解说气泡阶梯延迟弹入调度算法（$T_{delay} = T_{base} + i \cdot \Delta t$）
  - [x] 3.3.4 实现气泡视口边缘碰撞检测与自适应水平翻转（防截断）

---

### 🎯 Stage 4: 内置开发者 HUD 标定工具层 (In-Player HUD Calibration Tooling)
- [x] **4.1 HUD 标定管理器与调试层挂载 (`src/hud/hud-manager.js`)**
  - [x] 4.1.1 `?debug=1` 与 `Ctrl+Shift+D` 调试模式无缝切换与 HUD UI 挂载
  - [x] 4.1.2 实现屏幕像素 ➔ Canvas 绝对逻辑像素的逆投影转换算法
  - [x] 4.1.3 实现实时鼠标十字准星（Crosshair）与浮动逻辑坐标指示器
- [x] **4.2 模式一：鼠标拖拽拉框与实时 JSON 生成 (`src/hud/box-picker.js`)**
  - [x] 4.2.1 监听 `mousedown / mousemove / mouseup`，实时绘制临时 SVG 虚线高亮选框
  - [x] 4.2.2 自动格式化标准 JSON DSL 片段并一键写入系统剪贴板
- [x] **4.3 模式二：单点点击像素边缘智能吸附 (`src/hud/edge-snapper.js`)**
  - [x] 4.3.1 离屏 Canvas 底图颜色像素数据采样（`offscreenCtx.getImageData`）
  - [x] 4.3.2 实现 4 向光线投射（Ray Casting）与色彩梯度跃变边界探测
  - [x] 4.3.3 自动拟合矩形包围盒并在画面实时高亮预览
- [x] **4.4 模式三：一键捕获当前镜头矩阵参数 (`src/hud/camera-capturer.js`)**
  - [x] 4.4.1 提取当前视口平移与缩放矩阵参数
  - [x] 4.4.2 一键复制 `camera: { zoom, x, y, duration }` 配置到剪贴板

---

### 💡 Stage 5: 官方示例、验收测试与文档交付 (Examples & Acceptance)
- [x] **5.1 构建官方实战示例 `examples/luxehms/`**
  - [x] 5.1.1 将 `01-system_architecture_dark.png` 提取为完整的标准 `config.json`
  - [x] 5.1.2 编写 `examples/luxehms/index.html`，验证数据驱动运行
  - [x] 5.1.3 与 POC `arch-explorer.html` 进行像素级与动效对比测试，确保 100% 复刻并超越
- [x] **5.2 构建极简双模块快速验证示例 `examples/simple-demo/`**
- [x] **5.3 全量 6 大验收指标自动化与人工核验**
- [x] **5.4 编写源码使用说明与根目录 `README.md` 更新**

---

### 🖼️ Stage 6: 动态覆盖图层与局部下钻动效 (Dynamic Image Overlays & Deep-Dive)
- [x] **6.1 类型与契约扩展 (`src/types/dsl.d.ts`)**
  - [x] 6.1.1 定义 `ElementImage` 接口（`id`, `url`, `x`, `y`, `width`, `height`, `style`）
  - [x] 6.1.2 扩展 `FocusFlowDSL.elements.images` 与 `SceneStep.activeElements.images`
- [x] **6.2 覆盖图层 DOM 装配与资产解析 (`src/core/player.js`)**
  - [x] 6.2.1 在底图上方、SVG 矢量下方插入 `.focusflow-overlay-images` 容器
  - [x] 6.2.2 循环实例化 `<img>` 覆盖图元，挂载绝对定位、圆角及悬浮投影
  - [x] 6.2.3 自动解析相对 `basePath` 资源路径
- [x] **6.3 覆盖图生命周期与动效编排 (`src/motion/animator.js` & `src/styles/focusflow.css`)**
  - [x] 6.3.1 实现 `activate` 时的平滑淡入（Fade-In）与弹性缩放弹入（Zoom-In Spring）
  - [x] 6.3.2 实现场景切换/离开时的自动平滑淡出（Fade-Out）与图层隐藏
- [x] **6.4 实战示例与测试验收 (`examples/overlay-demo/` 或演进示例)**
  - [x] 6.4.1 在 `examples/` 中构建 5 场景完整闭环演示项目：
    - **Scene 1 (全景开场)**：LuxeHMS 全局架构拓扑总览
    - **Scene 2 (数据层聚焦)**：运镜聚焦右侧，对 Redis 7 (High-Speed Cache) 与 PostgreSQL 区域进行高亮描边引导
    - **Scene 3 (业务下钻与图片叠加)**：动态加载引入 `@examples/02_tape_chart_timeline_mockup.png`（带动效平滑弹入/展开覆盖在指定区域）
    - **Scene 4 (图片淡出与鉴权聚焦)**：自动平滑淡出并移除该图片，镜头平移至左侧并在 CASL role-based permissions 区域进行高亮引导
    - **Scene 5 (全景归位)**：运镜平滑回到最初的 LuxeHMS 架构拓扑图完整总览
  - [x] 6.4.2 验证前后场景切换时图片的优雅进场（Zoom-Fade）与退场（Fade-Out），无样式竞争、无残影与内存泄漏
  - [x] 6.4.3 首页导航入口同步集成该新演示项目，支持一键切换预览

---

### 🎛️ Stage 7: 控制栏精细化定制与等宽场景指示器 (Customizable Controls & Scene Counter)
- [x] **7.1 控制栏 DSL 声明式配置契约 (`src/types/dsl.d.ts`)**
  - [x] 7.1.1 定义 `meta.controls` 接口（`autoplay`, `interval`, `showPlayBtn`, `showCounter`, `showProgress`, `showHUDButton`）
- [x] **7.2 等宽场景页码计数器 (`src/core/player.js` & `src/styles/focusflow.css`)**
  - [x] 7.2.1 渲染 `.ff-scene-counter`（`01 / 05` 格式），采用 `JetBrains Mono` / `SF Mono` 等宽字体与防抖排版
  - [x] 7.2.2 色彩分层设计（高亮青蓝当前页、微透白斜杠、暗灰总页数）
- [x] **7.3 多场景 Tab 自适应横向滚动与自动居中 (`src/core/player.js`)**
  - [x] 7.3.1 Tab 容器配置 `overflow-x: auto` 与隐藏式滚动条，支持水平弹性滑动
  - [x] 7.3.2 实现场景激活时 `tabBtn.scrollIntoView({ inline: 'center', behavior: 'smooth' })` 自动平滑居中

---

### ⚡ Stage 8: 智能边缘吸附升级与粗拉框智能像素贴合 (Sobel Snapper & Auto-Refine)
- [x] **8.1 局部 Sobel 空间一阶梯度积分与 1D 能量投影 (`src/hud/edge-snapper.js`)**
  - [x] 8.1.1 在 ROI 局部窗口内应用 $3\times 3$ Sobel 离散微分卷积计算 $G_x$ 与 $G_y$
  - [x] 8.1.2 沿正交轴进行 1D 边缘能量投影积分（$Profile_X, Profile_Y$）与高斯平滑
  - [x] 8.1.3 双向显著性脉冲峰值扫描，信噪比 SNR 提升 50 倍，完美免疫内部文字干扰
- [x] **8.2 粗拉框 + 智能像素贴合机制 (Auto-Refine / Smart Snap on Drag · `src/hud/box-picker.js`)**
  - [x] 8.2.1 创作者随手粗略拉框，松手瞬间在 $\pm 24\text{px}$ 窄带微带内执行 Sobel 梯度微调
  - [x] 8.2.2 选框以 $<0.5\text{ms}$ 极速自动微调咬合至物理外边框，彻底杜绝漏水与共线误判
- [x] **8.3 强制纯手动直通控制与 HUD 切换开关 (`src/hud/hud-manager.js` & `src/hud/box-picker.js`)**
  - [x] 8.3.1 按住 `⌘ / Option`（macOS）或 `Ctrl / Alt`（Windows）同时拖拽，强制直通纯手动原始坐标
  - [x] 8.3.2 HUD 标定面板新增 `[✓] ✨ 智能像素贴合 (Auto-Refine)` 全局复选开关

---

### 📦 Stage 9: 新项目极速脚手架与自动化离线打包器 (Project Scaffolding & Standalone Bundler)
- [x] **9.1 新项目自动化脚手架 CLI (`scripts/create-project.js`)**
  - [x] 9.1.1 一键执行 `pnpm create:project <name> [image]`
  - [x] 9.1.2 纯 JS 二进制流自动读取底图分辨率并填入 `meta.viewport`，生成开箱即用的 `config.json` 与 `index.html`
- [x] **9.2 零依赖独立单文件 HTML 打包器 (`scripts/build-standalone.js`)**
  - [x] 9.2.1 自动读取所有底图与画中画图片，全量转为 Base64 Data URI 内联
  - [x] 9.2.2 全量内联 CSS 与 IIFE JS 引擎，双向生成至 `dist/` 与 `examples/`，双击离线秒开

---

## 7. MVP 研发测试与验收标准 (Acceptance Criteria)

| 验收项 | 验收指标与测试标准 | 预期结果 | 实际状态 |
| :--- | :--- | :--- | :--- |
| **1. 纯数据解耦** | 修改 `config.json` 替换图片、图形、线条与文字气泡 | 页面完全由 JSON 驱动重绘，无需修改任何 JS/CSS 源码 | ✅ 已通过 |
| **2. 自动几何测长** | 在 DSL 中只需声明矩形宽高与连线锚点 | 引擎自动推算 `stroke-dasharray`，描边动画平滑无断裂 | ✅ 已通过 |
| **3. 粗拉框智能贴合** | 随手粗略拉框，松手瞬间触发 $\pm 24\text{px}$ 窄带 Sobel 精修 | 选框自动咬合物理边框，剪贴板获得标准 JSON 片段 | ✅ 已通过 |
| **4. 纯手动直通拉框** | 按住 `⌘/Option` 或在 HUD 取消勾选智能贴合后拖拽 | 100% 精确保留原始拉框像素，算法 0 改动 | ✅ 已通过 |
| **5. Sobel 单点吸附** | 标定模式下 Option/Alt + 单击卡片空白处 | 50ms 内基于 1D 梯度能量峰值锁定 4 条物理边界 | ✅ 已通过 |
| **6. 镜头与动效流畅度** | 场景切换 (Scene 1 ➔ 2 ➔ 3 ➔ 4 ➔ 5) | 主流设备保持 60fps，GPU 硬件加速无掉帧，无样式竞争闪烁 | ✅ 已通过 |
| **7. 交互功能完整性** | 键盘（方向键/空格/Home/End）、自动轮播（播放/暂停）、进度条、等宽计数器 | 各项控制响应即时，状态机时钟准确，循环播放无内存泄漏 | ✅ 已通过 |
| **8. 动态覆盖图生命周期** | 在场景中声明 `activeElements.images`，后续场景移除 | 声明时平滑弹入/展开；后续未声明时自动平滑淡出并卸载 | ✅ 已通过 |
| **9. 独立离线单文件导出** | 运行 `node scripts/build-standalone.js examples/luxehms` | 生成完整单文件 `.html`，全内联 Base64，双击秒开无报错 | ✅ 已通过 |
| **10. 脚手架一键生成** | 运行 `node scripts/create-project.js my-test ./image.png` | 自动探测分辨率，生成完整工程结构与初始 `config.json` | ✅ 已通过 |

---

## 8. 客户端形态定位考量与全栈服务端 (SaaS) 平滑演进全景

### 8.1 当前 MVP 客户端与本地优先 (Local-First) 的定位考量

目前的 FocusFlow MVP 阶段在架构上是一个标准的 **“纯客户端 / 本地优先（Client-side & Local-First Engine & Toolkit）”**。在 Phase 1 中，所有的工作流（底图解析、坐标逆投影、Sobel 梯度吸附、JSON 编排、单文件打包）均运行在**本地开发环境（Localhost + 浏览器运行时 + 本地 Node.js CLI）**中。

```
               【Phase 1: 本地优先与客户端工作流全景】

 ┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────┐
 │ 创作者本地机器  │ ──>  │ 本地浏览器 + HUD 标定   │ ──>  │ 本地生成独立单文件  │
 │ (底图 + DSL)    │      │ (60fps GPU 播放/标定)   │      │ (.html 离线双击秒开)│
 └─────────────────┘      └─────────────────────────┘      └─────────────────────┘
```

#### 为什么 MVP 优先做纯客户端？
1. **核心渲染与动效内核先行**：确保 60fps 硬件加速运镜、SVG 动态路由测长、画中画覆盖层、毛玻璃气泡在浏览器端达到顶级质感，且体积极小（~35KB JS，零外部运行时依赖）；
2. **轻量无负担与离线可用**：用户无需注册账号、无需配置远程数据库和后端服务，即可在本地秒级制作，并产出能随时离线演示的独立 `.html` 文件；
3. **极速验证产品价值**：以最低的研发开销验证创作者制作效率与受众互动体验。

---

### 8.2 服务端 (SaaS) 演进的 4 大核心能力模块

要将 FocusFlow 从“本地客户端工具”升级为“企业级在线云平台/SaaS”，服务端需要补齐以下 **4 大核心能力模块**：

```
                       【Phase 2/3 服务端系统架构全景】

               ┌──────────────────────────────────────────────┐
               │    FocusFlow Cloud (Web 在线平台 / SaaS)     │
               └──────────────────────┬───────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
【1. 服务端项目管理】         【2. 服务端一键打包下载】     【3. 视频云渲染导出】
 • REST / GraphQL API         • POST /api/export/html       • Puppeteer / Remotion
 • 资产云存储 (S3 / OSS)      • 服务端调用 packager         • 4K 60fps MP4 渲染
 • 数据库存储 DSL JSON        • 浏览器直接下载 .html        • 高清动态 GIF 生成
                                      │
                                      ▼
                           【4. 云端免部署在线分享】
                            • 公开只读短链 (focusflow.io/s/xxx)
                            • 知识库/Notion/飞书 <iframe> 嵌入
```

#### 模块 1：服务端项目管理与资产托管 (Project Management & Cloud Storage)
* **RESTful / GraphQL API**：提供 `POST /api/projects`、`POST /api/projects/:id/assets` 等端点；
* **用户体验**：用户在 Web 控制台点击“新建项目” ➔ 拖拽上传底图 ➔ 服务端自动存储至 S3/OSS 并在数据库记录 Viewport 宽高，自动初始化标准 DSL；
* **团队协同**：支持多用户权限体系（Owner / Editor / Viewer）与版本历史回滚（Version History）。

#### 模块 2：服务端无状态编译与 HTML 单文件下载 API (Headless HTML Exporter)
* **机理**：将现有的 `scripts/build-standalone.js` 封装为无状态的 Node.js 服务端编译器函数；
* **API 示例**：
  ```javascript
  // 服务端 Controller: 一键下载独立 HTML 单文件
  app.get('/api/projects/:id/export/html', async (req, res) => {
    const { htmlBuffer, filename } = await standaloneCompiler.compile(projectId);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.type('html').send(htmlBuffer);
  });
  ```
* **用户体验**：创作者在网页端编辑完成后，点击右上角 **“导出 ➔ 下载单文件 HTML”**，浏览器直接弹出文件下载对话框。

#### 模块 3：服务端 4K 视频 / GIF 渲染管线 (Server-side Video Rendering Pipeline)
* **机理**：
  * **基于 Remotion / Puppeteer 无头浏览器**：在服务端启动 Headless Chrome，挂载 `FocusFlowPlayer`；
  * **精准帧步进（Deterministic Frame Ticking）**：通过时钟精准控制播放器时间轴，逐帧截取高清 Canvas/WebGL 画面；
  * **FFmpeg 编码推流**：将截帧序列经由 `ffmpeg` 合成 H.264 4K 60fps MP4 视频或高清 GIF；
* **用户体验**：创作者点击 **“导出 ➔ 导出 4K 视频”**，服务端后台异步转码，生成后推送通知并提供下载链接。

#### 模块 4：云端免部署只读分享短链与知识库嵌入 (Cloud Hosting & Embeds)
* **只读演示短链**：每个项目生成唯一 Slug（如 `https://focusflow.io/s/luxehms-arch`），受众在任意设备打开链接即可全屏沉浸式观看；
* **知识库嵌入**：提供 `<iframe src="...">` 嵌入代码，支持无缝嵌入到 Notion、飞书文档、语雀、Docusaurus 等企业知识库中。

---

### 8.3 当前 MVP 架构资产在服务端的 100% 平滑复用机制

由于 MVP 阶段严格执行了 **“纯数据解耦（DSL JSON 驱动）”** 与 **“模块化 ES 架构”**：

1. **核心播放器 [`src/index.js`](file:///Users/xt/WebstormProjects/focusflow/src/index.js)**：可 100% 零重构作为在线 Web Studio 预览画布与云端短链展示的渲染核心；
2. **打包脚本 [`scripts/build-standalone.js`](file:///Users/xt/WebstormProjects/focusflow/scripts/build-standalone.js)**：只需封装一层 Express/NestJS 路由，即可直接作为服务端 HTML 导出 API；
3. **脚手架脚本 [`scripts/create-project.js`](file:///Users/xt/WebstormProjects/focusflow/scripts/create-project.js)**：其二进制读图与 DSL 生成逻辑，可直接作为服务端创建项目的底层核心 Service。
