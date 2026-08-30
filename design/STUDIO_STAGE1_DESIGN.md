# FocusFlow Studio - Stage 1 研发设计规格说明书
## Stage 1 Technical Design: Foundation, Workbench Layout, Themes & Type-Safe i18n

> **文档版本**：`v1.0.0`  
> **制定日期**：`2026-08-30`  
> **文档状态**：🚀 **Phase 2 Stage 1 详细设计 · 正式生效**  
> **关联技术专刊**：
> - 🎨 [STUDIO_SPEC.md (Studio 架构与双模式运行体系)](file:///Users/xt/WebstormProjects/focusflow/design/STUDIO_SPEC.md)
> - 🏗️ [MONOREPO_SPEC.md (Monorepo 架构与包解耦规范)](file:///Users/xt/WebstormProjects/focusflow/design/MONOREPO_SPEC.md)
> - 📄 [PRODUCT_DESIGN.md (主产品方案与 PRD)](file:///Users/xt/WebstormProjects/focusflow/design/PRODUCT_DESIGN.md)
> 
> **适用对象**：前端核心开发、交互设计师、全栈工程师  
> **研发范围**：`apps/studio` 基础工程骨架、Dark/Light 双主题系统、TypeScript 强类型 i18n 国际化、五栏响应式工作台布局与 `InfiniteCanvas` 交互式无限画布视口引擎。

---

## 目录 (Table of Contents)

- [1. Stage 1 总体目标与交付成果综述](#1-stage-1-总体目标与交付成果综述)
- [2. `apps/studio` 前端架构与目录结构设计](#2-appsstudio-前端架构与目录结构设计)
- [3. 模块一：五栏响应式工作台布局与设计系统 (Workbench Layout)](#3-模块一五栏响应式工作台布局与设计系统-workbench-layout)
- [4. 模块二：Dark / Light 科技双主题系统与 CSS 语义 Token](#4-模块二dark--light-科技双主题系统与-css-语义-token)
- [5. 模块三：TypeScript 编译期强类型 i18n 国际化体系](#5-模块三typescript-编译期强类型-i18n-国际化体系)
- [6. 模块四：InfiniteCanvas 交互式无限画布视口引擎 (核心算法)](#6-模块四infinitecanvas-交互式无限画布视口引擎-核心算法)
- [7. 模块五：Zustand 响应式状态切片架构设计](#7-模块五zustand-响应式状态切片架构设计)
- [8. 验收标准、测试用例与 Playwright E2E 验证规范](#8-验收标准测试用例与-playwright-e2e-验证规范)
- [9. Stage 1 研发任务分解与执行跟踪清单 (Task Breakdown Checklist / WBS)](#9-stage-1-研发任务分解与执行跟踪清单-task-breakdown-checklist--wbs)

---

## 1. Stage 1 总体目标与交付成果综述

Stage 1 是 FocusFlow Studio 可视化创作端的**基石工程**。本阶段不涉及复杂的云端数据库与 4K 视频集群，而是专注于打造一个**极致流畅（60fps）、高颜值暗黑科技风、全离线可用、具备顶级手势交互体验的工业级 Web 创作工作台**。

```
                     【Stage 1 核心架构与四大交付支柱】

 ┌────────────────────────────────────────────────────────────────────────┐
 │ 🎨 1. 五栏响应式工业级工作台布局 (Workbench Layout)                   │
 │    • TopBar 顶部全局控制台 (撤销重做、保存状态、主题/语言、导出)       │
 │    • LeftToolbox 左侧 5 大浮动标定工具箱 (Select, Box, Path, Callout)  │
 │    • CenterCanvas 居中无限画布交互视口 (支持手势缩放、平移抓手)        │
 │    • RightInspector 右侧折叠式属性检查器 (场景镜头、图层矩阵)          │
 │    • BottomTimeline 底部场景时间轴切片条 (缩略图、时长拖拽、播放控制)  │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 🌙 2. Dark / Light 科技语义双主题 (Design Tokens)                      │
 │    • 深度暗黑科技风 (Cyber Slate 950) 与 晶透白明亮风 (Minimalist 50)   │
 │    • next-themes 无闪烁持久化与 CSS 3D 毛玻璃发光滤镜 Token 矩阵       │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 🌐 3. TS 编译期 100% 强类型 i18n 国际化体系 (react-i18next)            │
 │    • Short Code 短码规范 (zh / en) 模块化命名空间词条                  │
 │    • i18n.d.ts 声明合并，实现 TS 编译期 Key 自动补全与防错             │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 🔍 4. InfiniteCanvas 交互式无限画布视口引擎 (Pan & Zoom-to-Cursor)    │
 │    • 以鼠标光标为中心的几何缩放 (Zoom-to-Cursor) 矩阵算法               │
 │    • Space+Drag 抓手平移与 Shift+1 视口自适应居中算法                  │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. `apps/studio` 前端架构与目录结构设计

为了保证工程的高内聚与可维护性，`apps/studio` 严格遵循现代 React 19 模块化规范：

```
apps/studio/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx                         # 应用挂载入口
    ├── App.tsx                          # 工作台主视口
    ├── i18n.ts                          # i18next 初始化配置
    ├── i18n.d.ts                        # 强类型 TS 词条补全声明
    │
    ├── assets/                          # 静态图标与模板样例图
    │
    ├── components/                      # UI 组件层
    │   ├── canvas/                      # 画布核心组件
    │   │   ├── InfiniteCanvas.tsx       # 无限缩放平移画布容器
    │   │   ├── ViewportRuler.tsx        # 像素刻度标尺 (可选)
    │   │   └── CanvasOverlay.tsx        # 取景框与标定图元交互层
    │   ├── layout/                      # 五栏布局组件
    │   │   ├── TopBar.tsx               # 顶部控制栏
    │   │   ├── LeftToolbox.tsx          # 左侧标定工具栏
    │   │   ├── RightInspector.tsx       # 右侧属性检查面板
    │   │   ├── BottomTimeline.tsx       # 底部时间轴编排条
    │   │   └── WorkbenchLayout.tsx      # 五栏栅格弹性布局容器
    │   └── ui/                          # 通用原子 UI 组件 (shadcn 风格)
    │       ├── Button.tsx
    │       ├── Slider.tsx
    │       ├── Input.tsx
    │       ├── Dropdown.tsx
    │       └── Tooltip.tsx
    │
    ├── hooks/                           # 自定义手势与事件 Hooks
    │   ├── useCanvasGesture.ts          # 鼠标滚轮缩放与平移手势
    │   ├── useShortcuts.ts              # 全局键盘快捷键监听
    │   └── useHistory.ts                # 撤销重做快捷调用
    │
    ├── locales/                         # 国际化多语言词条
    │   ├── zh/                          # 简体中文 (Short code: zh)
    │   │   ├── common.json
    │   │   ├── toolbar.json
    │   │   ├── inspector.json
    │   │   └── timeline.json
    │   └── en/                          # 英文 (Short code: en)
    │       ├── common.json
    │       ├── toolbar.json
    │       ├── inspector.json
    │       └── timeline.json
    │
    ├── stores/                          # Zustand 状态管理切片
    │   ├── useEditorStore.ts            # 画布缩放平移、当前激活工具、选区状态
    │   ├── useProjectStore.ts           # FocusFlow DSL 核心数据树与 CRUD
    │   └── useHistoryStore.ts           # Undo/Redo 历史快照栈
    │
    └── styles/
        ├── index.css                    # Tailwind 指令与全局重置
        └── tokens.css                   # CSS 语义化颜色变量与科技发光效果
```

---

## 3. 模块一：五栏响应式工作台布局与设计系统 (Workbench Layout)

### 3.1 视口弹性五栏栅格架构
工作台占满整个浏览器视口（`100vw * 100vh`），采用 `flex` + `grid` 组合的固定外壳与自适应内芯设计：

```
+----------------------------------------------------------------------------------------------------+
| 1. TopBar (H: 52px) [Logo | Project Title | Undo/Redo | Theme | Lang | Save Status | Export HTML]  |
+---------+------------------------------------------------------------------------------+------------+
| 2. Left | 3. CenterCanvas (Infinite Viewport with Gesture Pan/Zoom)                    | 4. Right   |
| Toolbox |                                                                              | Inspector  |
| (W:56px)|    ┌────────────────────────────────────────────────────────────────────┐    | (W: 300px) |
|         |    │ 主架构底图 (Layer 0)                                               │    |            |
| [Select]|    │                                                                    │    | [Camera]   |
| [Box]   |    │   ┌──────────────┐          ┌三次贝塞尔流光────────┐            │    | Zoom: 1.5x |
| [Path]  |    │   │微服务网关选框│ ~~~~~~~~>│订单微服务集群选框    │            │    | Dur: 1.2s  |
| [Dot]   |    │   └──────────────┘          └──────────────────────┘            │    | [Elements] |
| [Text]  |    │                                                                    │    | 5 Boxes    |
|         |    └────────────────────────────────────────────────────────────────────┘    | 3 Paths    |
+---------+------------------------------------------------------------------------------+------------+
| 5. BottomTimeline (H: 88px) [Play/Pause | Scene 01 (1.2s) | Scene 02 (2.0s) | Scene 03 | + Add Scene]|
+----------------------------------------------------------------------------------------------------+
```

### 3.2 各布局容器详细交互规范
1. **TopBar (顶部控制栏)**：
   * 左侧：`FocusFlow Studio` 品牌 Logo、项目名称双击内联编辑、当前版本快照状态（已保存/有变更）；
   * 中间：快捷工具（撤销 `Cmd+Z`、重做 `Cmd+Shift+Z`、重置视口 `Shift+1`）；
   * 右侧：暗黑/明亮主题切换、中/英多语言切换、一键全屏预览、**“一键导出离线 HTML”** 强调色主按钮。
2. **LeftToolbox (左侧标定工具箱)**：
   * 包含 5 个核心交互工具切换（支持数字键 `1~5` 快捷键）：
     * `1` 抓手与选择工具 (`Select / Pan`)；
     * `2` 智能高亮选框 (`Box Tool`，激活 Sobel 自动吸附)；
     * `3` 贝塞尔流光连线 (`Path Tool`，激活 8 向锚点吸附)；
     * `4` 脉冲圆点 (`Dot Tool`)；
     * `5` 解说气泡与徽章 (`Callout Tool`)。
3. **RightInspector (右侧属性检查器)**：
   * 折叠手风琴面板，根据左侧选中元素动态切换：
     * **选中画布空白处**：展示当前场景的镜头参数（`Zoom` 缩放滑块、`X/Y` 运镜偏移、`Duration` 过渡时长）；
     * **选中选框图元**：展示边框颜色、发光辉光（Glow 开关）、虚线流动（Dash）、圆角半径（rx/ry）；
     * **选中连线图元**：展示起点/终点锚点绑定、流光模式（`draw` / `stream` / `pulse`）、流动速度。
4. **BottomTimeline (底部场景时间轴)**：
   * 水平横向虚拟滚动列表，展示当前 DSL 中的所有场景切片卡片；
   * 卡片展示场景序号（`01`、`02`）、场景标题、运镜缩放预览微缩图、过渡停留时长（可直接拖拽调整）；
   * 支持通过拖拽调整场景先后顺序，支持 `+ 添加新场景` 与 `复制场景`。

---

## 4. 模块二：Dark / Light 科技双主题系统与 CSS 语义 Token

### 4.1 设计美学哲学
* **Dark 科技暗黑主题（默认）**：以极深邃的宇宙黑（`#06090e`）与石板蓝（`#0b0f19`）为底，搭配电光青（`#38bdf8` 霓虹发光）、琥珀橙（`#fbbf24`）与翡翠绿（`#34d399`），呈现沉浸式电影工业级视觉质感；
* **Light 极简明亮主题**：以纯净高白（`#ffffff`）与极浅灰（`#f8fafc`）为底，搭配高对比度海蓝（`#0284c7`），专为明亮会议室投影与白色 PPT 场景优化。

### 4.2 `src/styles/tokens.css` 核心设计变量表

```css
@layer base {
  :root {
    /* --- Light 极简明亮语义 Token --- */
    --ff-bg-app: #f8fafc;
    --ff-bg-panel: #ffffff;
    --ff-bg-canvas: #e2e8f0;
    --ff-border: #e2e8f0;
    --ff-border-subtle: #f1f5f9;
    --ff-text-primary: #0f172a;
    --ff-text-secondary: #64748b;
    --ff-text-muted: #94a3b8;
    
    --ff-accent: #0284c7;
    --ff-accent-hover: #0369a1;
    --ff-accent-glow: rgba(2, 132, 199, 0.25);
    
    --ff-glow-cyan: 0 0 16px rgba(2, 132, 199, 0.4);
    --ff-glass-bg: rgba(255, 255, 255, 0.85);
    --ff-glass-border: rgba(226, 232, 240, 0.8);
  }

  .dark {
    /* --- Dark 深度科技暗黑语义 Token --- */
    --ff-bg-app: #06090e;
    --ff-bg-panel: #0b0f19;
    --ff-bg-canvas: #04060a;
    --ff-border: #1e293b;
    --ff-border-subtle: #131b2e;
    --ff-text-primary: #f8fafc;
    --ff-text-secondary: #94a3b8;
    --ff-text-muted: #64748b;
    
    --ff-accent: #38bdf8;
    --ff-accent-hover: #7dd3fc;
    --ff-accent-glow: rgba(56, 189, 248, 0.35);
    
    --ff-glow-cyan: 0 0 20px rgba(56, 189, 248, 0.5), 0 0 40px rgba(56, 189, 248, 0.2);
    --ff-glass-bg: rgba(11, 15, 25, 0.75);
    --ff-glass-border: rgba(30, 41, 59, 0.8);
  }
}
```

### 4.3 `next-themes` 零闪烁无缝挂载
通过在根节点包装 `ThemeProvider`，支持 `dark` / `light` / `system` 自动同步操作系统偏好，并在 `<html class="dark">` 上无缝注入，杜绝页面刷新白屏闪烁。

---

## 5. 模块三：TypeScript 编译期强类型 i18n 国际化体系

### 5.1 语言代码与架构规范
严格遵循 `MONOREPO_SPEC.md` 第 4.9 节规范，前端采用 **Short Code（短码模式）**：
* 中文：`zh`
* 英文：`en`

### 5.2 词条命名空间拆分方案
词条按工作台业务模块垂直拆分，避免单一大型 JSON 维护混乱：
```
src/locales/
├── zh/
│   ├── common.json        # 按钮、确认框、全局提示
│   ├── toolbar.json       # 左侧 5 大工具提示与快捷键说明
│   ├── inspector.json     # 属性检查器字段与滑块说明
│   └── timeline.json      # 时间轴控制与场景操作
└── en/
    ├── common.json
    ├── toolbar.json
    ├── inspector.json
    └── timeline.json
```

### 5.3 强类型 TS 声明合并 (`src/i18n.d.ts`)
通过 TypeScript 的 Declaration Merging，在开发代码中调用 `t('toolbar.boxTool')` 时，IDE 将获得 **100% 自动联想提示**，若输入不存在的 Key 则在编译期报错：

```typescript
import 'i18next';
import type common from './locales/zh/common.json';
import type toolbar from './locales/zh/toolbar.json';
import type inspector from './locales/zh/inspector.json';
import type timeline from './locales/zh/timeline.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      toolbar: typeof toolbar;
      inspector: typeof inspector;
      timeline: typeof timeline;
    };
  }
}
```

---

## 6. 模块四：InfiniteCanvas 交互式无限画布视口引擎 (核心算法)

`InfiniteCanvas` 是整个 Studio 视觉创作的核心容器。它不仅负责呈现底图和 `@focusflow/player`，还承载了设计软件（如 Figma）标准的视口缩放与平移手势。

```
                  【屏幕物理视口与画布逻辑坐标系映射模型】

 ┌─────────────────────────────────────────────────────────────┐
 │ 浏览器物理视口 (Screen Viewport: W_screen * H_screen)        │
 │                                                             │
 │            鼠标指针 P_screen (x, y)                         │
 │                   │                                         │
 │                   ▼                                         │
 │         ┌───────────────────────────────┐                   │
 │         │ 逻辑画布 (Canvas Content)     │                   │
 │         │   Pan: (translateX, translateY)│                  │
 │         │   Scale: zoom                 │                   │
 │         │                               │                   │
 │         │       对应 P_canvas           │                   │
 │         │       (px, py)                │                   │
 │         └───────────────────────────────┘                   │
 └─────────────────────────────────────────────────────────────┘
```

### 6.1 以光标为中心的平滑缩放算法 (Zoom-to-Cursor Algorithm)

#### 1. 核心挑战
普通缩放以视口原点 `(0,0)` 为基准，缩放时画面会整体向右下方跑偏，导致用户视线丢失。Figma / Miro 级别的交互必须实现：**鼠标指针下方的图像像素在缩放过程中保持在屏幕原位绝对不动**。

#### 2. 数学推导公式
设缩放前画布平移为 $(T_{x1}, T_{y1})$，缩放倍率为 $S_1$；  
鼠标在屏幕视口中的绝对坐标为 $(P_{x}, P_{y})$；  
鼠标对应的画布内部逻辑坐标为 $(C_x, C_y)$，根据正向投影方程：
$$P_x = T_{x1} + C_x \cdot S_1 \implies C_x = \frac{P_x - T_{x1}}{S_1}$$
$$P_y = T_{y1} + C_y \cdot S_1 \implies C_y = \frac{P_y - T_{y1}}{S_1}$$

当用户滚动滚轮，目标缩放倍率变为 $S_2 = S_1 \cdot \Delta_{\text{scale}}$（限制在 $0.1 \le S_2 \le 5.0$ 范围内）：  
为了使鼠标指向的逻辑点 $(C_x, C_y)$ 在新倍率 $S_2$ 下仍精确落在屏幕坐标 $(P_x, P_y)$ 处，新的平移量 $(T_{x2}, T_{y2})$ 必须满足：
$$P_x = T_{x2} + C_x \cdot S_2 \implies T_{x2} = P_x - C_x \cdot S_2 = P_x - \left(\frac{P_x - T_{x1}}{S_1}\right) \cdot S_2$$
$$T_{y2} = P_y - C_y \cdot S_2 = P_y - \left(\frac{P_y - T_{y1}}{S_1}\right) \cdot S_2$$

化简后得到 **Zoom-to-Cursor 实时补偿公式**：
$$\begin{cases} T_{x2} = P_x - (P_x - T_{x1}) \cdot \dfrac{S_2}{S_1} \\[8pt] T_{y2} = P_y - (P_y - T_{y1}) \cdot \dfrac{S_2}{S_1} \end{cases}$$

### 6.2 快捷交互与自适应居中算法 (Fit-to-Screen)
* **自适应居中（快捷键 `Shift + 1`）**：
  设视口尺寸为 $(W_v, H_v)$，底图自然物理尺寸为 $(W_i, H_i)$，边距留白为 $\text{padding} = 48\text{px}$：
  $$S_{\text{fit}} = \min\left( \frac{W_v - 2 \cdot \text{padding}}{W_i}, \frac{H_v - 2 \cdot \text{padding}}{H_i} \right)$$
  $$T_{x} = \frac{W_v - W_i \cdot S_{\text{fit}}}{2}, \quad T_{y} = \frac{H_v - H_i \cdot S_{\text{fit}}}{2}$$
* **1:1 像素复原（快捷键 `Shift + 0`）**：
  直接设定 $S = 1.0$，并将图像几何中心对齐至屏幕视口几何中心。

---

## 7. 模块五：Zustand 响应式状态切片架构设计

为了保证高频画布渲染与属性编辑的极速响应，状态被精确切分为 3 大 Store：

```
                              【Zustand 状态分层拓扑】

  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
  │ 1. useEditorStore       │      │ 2. useProjectStore      │      │ 3. useHistoryStore      │
  ├─────────────────────────┤      ├─────────────────────────┤      ├─────────────────────────┤
  │ • zoom: number          │      │ • dsl: FocusFlowDSL     │      │ • past: FocusFlowDSL[]  │
  │ • pan: {x, y}           │      │ • activeSceneIndex: int │      │ • future: FocusFlowDSL[]│
  │ • activeTool: ToolType  │      │ • isDirty: boolean      │      │ • undo()                │
  │ • selectedId: string    │      │ • updateSceneCamera()   │      │ • redo()                │
  │ • isPlaying: boolean    │      │ • updateElement()       │      │ • snapshot()            │
  └─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

---

## 8. 验收标准、测试用例与 Playwright E2E 验证规范

### 8.1 研发质量验收卡点 (Quality Gates)
1. **Oxlint 质检**：`pnpm lint` 必须 0 警告、0 错误，耗时 $<30\text{ms}$；
2. **TypeScript 复合类型**：`pnpm typecheck` 必须 100% 编译通过，无隐式 `any`；
3. **Turborepo 拓扑构建**：`pnpm build` 顺利产出 `dist/`，产物体积 gzip 后 $<100\text{KB}$；
4. **i18n 覆盖率**：中英双语词条 Key 1:1 对齐，绝无缺少字段或硬编码文本。

### 8.2 Playwright E2E 自动化测试用例结构规范
根据项目全局规则，**所有 E2E 测试逻辑必须提取为独立的异步 Helper 函数**：

```typescript
// apps/studio/e2e/workbench.spec.ts
import { test, expect, Page } from '@playwright/test';

// 1. 业务逻辑独立异步 Helper 函数
async function verifyWorkbenchLayoutMounted(page: Page) {
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('aside[data-testid="toolbox"]')).toBeVisible();
  await expect(page.locator('main[data-testid="canvas-viewport"]')).toBeVisible();
  await expect(page.locator('aside[data-testid="inspector"]')).toBeVisible();
  await expect(page.locator('footer[data-testid="timeline"]')).toBeVisible();
}

async function toggleThemeAndVerify(page: Page) {
  const themeBtn = page.locator('button[data-testid="theme-toggle"]');
  await themeBtn.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await themeBtn.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
}

async function toggleLanguageAndVerify(page: Page) {
  const langBtn = page.locator('button[data-testid="locale-picker"]');
  await langBtn.click();
  await page.locator('text=English').click();
  await expect(page.locator('text=Export Standalone HTML')).toBeVisible();
}

// 2. it() 简洁入口调用
test.describe('FocusFlow Studio Stage 1 E2E Suite', () => {
  test('should render 5-panel layout with dual themes and i18n switching', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await verifyWorkbenchLayoutMounted(page);
    await toggleThemeAndVerify(page);
    await toggleLanguageAndVerify(page);
  });
});
```

---

## 9. Stage 1 研发任务分解与执行跟踪清单 (Task Breakdown Checklist / WBS)

- [x] **Task 1.1: 基础设施与原子 UI 组件库搭建 (Scaffolding & UI Primitives)**
  - [x] 1.1.1 在 `apps/studio` 封装原子 UI 组件库（`Button.tsx`, `Slider.tsx`, `Input.tsx`, `Badge.tsx`, `Tooltip.tsx`）
  - [x] 1.1.2 编写 `clsx` + `tailwind-merge` 样式合并工具（`src/utils/cn.ts`）
  - [x] 1.1.3 配置 `lucide-react` 常用科技图标映射与统一尺寸/样式封装
- [x] **Task 1.2: 五栏响应式工作台布局搭建 (Workbench Layout Skeleton)**
  - [x] 1.2.1 编写 `TopBar.tsx`：Logo、项目标题双击内联编辑、撤销/重做快捷按键、保存状态提示
  - [x] 1.2.2 编写 `LeftToolbox.tsx`：5 大浮动标定工具按键（Select, Box, Path, Dot, Callout）与激活态/悬停态样式
  - [x] 1.2.3 编写 `RightInspector.tsx`：手风琴式场景镜头属性与图层配置折叠面板
  - [x] 1.2.4 编写 `BottomTimeline.tsx`：横向场景切片卡片列表、时长指示器、微缩图与播放控制栏
  - [x] 1.2.5 编写 `WorkbenchLayout.tsx`：组合五栏栅格，实现 `100vw * 100vh` 沉浸式弹性视口
- [x] **Task 1.3: Dark / Light 科技双主题系统与 Token 落地 (Dual Themes & Tokens)**
  - [x] 1.3.1 编写 `src/styles/tokens.css`，定义完整的 Dark/Light 语义化 CSS 变量、霓虹辉光 (Neon Glow) 与毛玻璃 (Glassmorphism)
  - [x] 1.3.2 集成 `next-themes` 并在 `TopBar.tsx` 实现 `Light / Dark / System` 三态切换
  - [x] 1.3.3 验证主题切换时各面板与画布背景无白屏闪烁且本地 LocalStorage 状态持久化
- [ ] **Task 1.4: TypeScript 强类型 i18n 国际化体系落地 (Type-Safe i18next)**
  - [ ] 1.4.1 创建 `src/locales/zh/` 与 `src/locales/en/` 词条文件（`common.json`, `toolbar.json`, `inspector.json`, `timeline.json`）
  - [ ] 1.4.2 编写 `src/i18n.ts` 初始化 `i18next` 与 `react-i18next`
  - [ ] 1.4.3 编写 `src/i18n.d.ts` 声明合并，实现 TS 编译期 100% 强类型智能联想与类型约束
  - [ ] 1.4.4 在 `TopBar.tsx` 集成 `zh / en` 一键语言切换开关，全面替换工作台硬编码中英文字符串
- [ ] **Task 1.5: InfiniteCanvas 无限缩放平移视口引擎实现 (Infinite Viewport Engine)**
  - [ ] 1.5.1 编写 `useCanvasGesture.ts` 手势 Hook：实现以光标为中心平滑缩放（Zoom-to-Cursor 数学矩阵算法）
  - [ ] 1.5.2 实现 `Space + Drag` 抓手平移与中键平移手势
  - [ ] 1.5.3 实现 `Shift + 1` 视口自适应居中（Fit-to-Screen）与 `Shift + 0` 1:1 像素复原快捷键
  - [ ] 1.5.4 编写 `InfiniteCanvas.tsx`，将 `@focusflow/player` 内核挂载于视口变换层中
- [ ] **Task 1.6: Zustand 状态切片与响应式绑定 (State Architecture)**
  - [ ] 1.6.1 编写 `useEditorStore.ts`：管理视口缩放平移、当前激活工具、选中元素 ID 与播放状态
  - [ ] 1.6.2 编写 `useProjectStore.ts`：管理 FocusFlow DSL 数据树、场景切换与元素更新
  - [ ] 1.6.3 将五栏组件与 Zustand 状态双向绑定
- [ ] **Task 1.7: 质量门禁与 Playwright E2E 自动化测试 (Testing & Verification)**
  - [ ] 1.7.1 运行 `pnpm lint`（Oxlint <30ms 极速质检 0 警告 0 错误）
  - [ ] 1.7.2 运行 `pnpm typecheck`（TypeScript 复合类型 100% 编译通过）
  - [ ] 1.7.3 编写 Playwright E2E 测试套件（逻辑提取为独立 async 函数），覆盖五栏挂载、双主题切换、中英文切换与手势缩放

