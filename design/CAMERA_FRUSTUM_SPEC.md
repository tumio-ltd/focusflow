# FocusFlow 运镜摄像机 (Camera) 与取景框 (Frustum) 数学原理与交互设计规范
## FocusFlow Camera Kinematics, Frustum Projection & Viewport Capture Specification

> **文档版本**：`v1.0.0`  
> **制定日期**：`2026-09-02`  
> **文档状态**：🚀 **核心技术与数学规格说明书 · 已落地实现**  
> **关联技术规范**：
> - 📄 [MOTION_ENGINE_SPEC.md (动效数学与渲染规格)](file:///Users/xt/WebstormProjects/focusflow/design/MOTION_ENGINE_SPEC.md)
> - 🏗️ [STUDIO_SPEC.md (Phase 2 Studio 总体工程规范)](file:///Users/xt/WebstormProjects/focusflow/design/STUDIO_SPEC.md)
> - 📐 [MVP_SPEC.md (Phase 1 播放引擎规范)](file:///Users/xt/WebstormProjects/focusflow/design/MVP_SPEC.md)

---

## 目录 (Table of Contents)

- [1. 背景与双空间模型 (Dual Space Model)](#1-背景与双空间模型-dual-space-model)
  - [1.1 为什么需要运镜取景框](#11-为什么需要运镜取景框)
  - [1.2 编辑器工作台空间 vs 受众演播空间](#12-编辑器工作台空间-vs-受众演播空间)
- [2. 4 大核心数学理论与工程规则 (4 Theoretical Rules)](#2-4-大核心数学理论与工程规则-4-theoretical-rules)
  - [2.1 规则 1：纵横比保真锁定 (Aspect Ratio Lock)](#21-规则-1纵横比保真锁定-aspect-ratio-lock)
  - [2.2 规则 2：防穿帮镜头底限 (Zoom >= 1.0x)](#22-规则-2防穿帮镜头底限-zoom--10x)
  - [2.3 规则 3：防露白安全视口钳位 (Safe Bounds Clamping)](#23-规则-3防露白安全视口钳位-safe-bounds-clamping)
  - [2.4 规则 4：相对铺满映射与物理中心反解 (BaseScale & Center Projection)](#24-规则-4相对铺满映射与物理中心反解-basescale--center-projection)
- [3. 交互编排与微调工作流 (Interactive Manipulation Workflow)](#3-交互编排与微调工作流-interactive-manipulation-workflow)
  - [3.1 核心工作流范式](#31-核心工作流范式)
  - [3.2 模式一：一键捕获当前画布视角 (Capture Viewport)](#32-模式一一键捕获当前画布视角-capture-viewport)
  - [3.3 模式二：画布直接抓取平移 (Direct Canvas Drag-to-Move)](#33-模式二画布直接抓取平移-direct-canvas-drag-to-move)
  - [3.4 模式三：四角手柄等比例缩放 (Corner Resize Zoom)](#34-模式三四角手柄等比例缩放-corner-resize-zoom)
  - [3.5 模式四：属性检查器数值精确微调与一键居中复位](#35-模式四属性检查器数值精确微调与一键居中复位)
  - [3.6 模式五：键盘方向键像素级精调](#36-模式五键盘方向键像素级精调)
- [4. 核心代码架构与防回归机制 (Architecture & Quality Assurance)](#4-核心代码架构与防回归机制-architecture--quality-assurance)
  - [4.1 工作台底图与运镜渲染解耦 (disableCamera 机制)](#41-工作台底图与运镜渲染解耦-disablecamera-机制)
  - [4.2 生命周期与状态同步解耦](#42-生命周期与状态同步解耦)
  - [4.3 自动化测试与 E2E 验证矩阵](#43-自动化测试与-e2e-验证矩阵)

---

## 1. 背景与双空间模型 (Dual Space Model)

### 1.1 为什么需要运镜取景框
在传统的幻灯片或制图软件中，画面通常是静态或逐页切换的。FocusFlow 采用**单张高精超大架构底图（Infinite Blueprint）+ 镜头动态运镜（Camera Kinematics）**的全新表达范式。

为了让创作者在编排场景时能够直观预判最终观众看到的画幅，系统在画布上引入了**青色摄像机安全可视取景框（Camera Frustum Frame）**。

```
┌─────────────────────────────────────────────────────────────┐
│                 Infinite Canvas (全景大底图)                  │
│                                                             │
│       ┌──────────────────────────────────────┐              │
│       │ 📷 青色取景框 (Camera Frustum)        │              │
│       │  • 标记当前场景的聚焦区域            │              │
│       │  • 严格锁定底图原生比例              │              │
│       │  • 支持在画布上直接拖拽微调          │              │
│       └──────────────────────────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 编辑器工作台空间 vs 受众演播空间

系统严格区分了两个相互独立但又精准映射的坐标空间：

| 维度 | 编辑器工作台空间 (Studio Workspace) | 受众全屏演播空间 (Audience Space) |
| :--- | :--- | :--- |
| **容器形态** | 受左侧工具栏、右侧检查器、顶栏和时间轴挤压的自适应矩形 | 全屏沉浸式无边框容器（16:9 / 16:10 / 移动端等） |
| **底图呈现** | 底图处于 $1:1$ 绝对像素坐标系，不随运镜变形，保持图元绝对对齐 | 底图经 GPU CSS3 硬件矩阵变换 `scale(Z) translate(X%, Y%)` |
| **镜头体现** | 由 **青色取景框 (Frustum)** 叠加层直接勾勒可视范围 | 屏幕边缘即为镜头边界，观众视野被拉近至特写区域 |
| **操作方式** | 滚轮平移缩放画布、直接拖拽取景框、右侧滑块微调 | 键盘空格/方向键/遥控笔触发 60fps 平滑过渡 |

---

## 2. 4 大核心数学理论与工程规则 (4 Theoretical Rules)

「捕获当前画布视角」并不是简单的截取当前屏幕矩形，而是经过以下 **4 套核心数学与工程规则** 的转换与约束：

### 2.1 规则 1：纵横比保真锁定 (Aspect Ratio Lock)
* **原理**：工作台屏幕视口的宽高比是随窗口及侧边栏展开动态变化的（例如 $1096 \times 781 \approx 1.403$），但底图具有固定的物理宽高比（如 $1920 \times 1459 \approx 1.316$ 或 $16:9 \approx 1.778$）。
* **约束**：为了保证在任何受众屏幕全屏演播时架构图绝不发生拉伸失真，取景框必须严格锁定底图原生宽高比：
  $$\frac{W_{\text{frame}}}{H_{\text{frame}}} \equiv \frac{W_{\text{natural}}}{H_{\text{natural}}}$$
* **效果**：取景框在短边方向贴合视口，在长边方向向内收缩留出对称边距（Pillarbox / Letterbox）。

### 2.2 规则 2：防穿帮镜头底限 (Zoom >= 1.0x)
* **原理**：创作者在工作台编排时常会用滚轮将画布大幅缩小（如 40% ~ 60%）以俯瞰全局，此时屏幕边缘会露出画布外的深色背景网格。
* **约束**：在 FocusFlow 运镜规范中，`Zoom: 1.0x` 即为全图充满（Fit-to-Screen），**不允许 `Zoom < 1.0x`**（因为全屏演播时镜头拉得过远露出黑边在视觉上属于穿帮）：
  $$\text{zoom} = \max\left(\frac{\text{transform.scale}}{\text{baseScale}}, 1.0\right)$$
* **效果**：当在全局缩小视角下点击捕获时，倍率自动截断为 1.0x 全景，偏移量 $(x, y)$ 自动归零居中。

### 2.3 规则 3：防露白安全视口钳位 (Safe Bounds Clamping)
* **原理**：当镜头聚焦在底图某个角落时，如果平移偏移量过大，底图边缘会脱离播放器视口造成画面空洞。
* **数学推导**：当放大倍率为 $Z$ 时，单向最大允许偏移量为：
  $$|T_x| \le \frac{Z - 1}{2Z} \times 100\%, \quad |T_y| \le \frac{Z - 1}{2Z} \times 100\%$$
* **工程优化**：为兼顾极致的安全与创作者构图自由度，系统预留了 15% 的视觉缓冲余量：
  $$\text{safeLimit} = \frac{Z - 1}{2Z} \times 100\% \times 1.15$$
  $$x_{\text{clamped}} = \max(-\text{safeLimit}, \min(\text{safeLimit}, x))$$
  $$y_{\text{clamped}} = \max(-\text{safeLimit}, \min(\text{safeLimit}, y))$$

### 2.4 规则 4：相对铺满映射与物理中心反解 (BaseScale & Center Projection)
* **原理**：
  - 设计软件中的 100% 代表 1 物理像素 = 1 屏幕像素；
  - FocusFlow DSL 中的 `Zoom: 1.0x` 代表 **“底图自适应充满播放器视口 (Fit-to-Screen)”**。
* **自适应缩放基准 ($\text{baseScale}$)**：
  $$\text{baseScale} = \min\left(\frac{W_{\text{container}}}{W_{\text{natural}}}, \frac{H_{\text{container}}}{H_{\text{natural}}}\right)$$
* **工作台屏幕中心反解公式**：
  $$X_{\text{viewport}} = \frac{W_{\text{container}} / 2 - \text{transform.x}}{\text{transform.scale}}$$
  $$Y_{\text{viewport}} = \frac{H_{\text{container}} / 2 - \text{transform.y}}{\text{transform.scale}}$$
  $$x\% = \frac{X_{\text{viewport}} - W_{\text{natural}} / 2}{W_{\text{natural}}} \times 100\%$$
  $$y\% = \frac{Y_{\text{viewport}} - H_{\text{natural}} / 2}{H_{\text{natural}}} \times 100\%$$

---

## 3. 交互编排与微调工作流 (Interactive Manipulation Workflow)

### 3.1 核心工作流范式
为了兼顾**高效率**与**高精度**，FocusFlow Studio 确立了三段式运镜编排工作流：

$$\text{宏观一键粗捕获} \xrightarrow{\quad\quad} \text{画布直接拖拽/手柄缩放} \xrightarrow{\quad\quad} \text{检查器数值精调/方向键微控}$$

---

### 3.2 模式一：一键捕获当前画布视角 (Capture Viewport)
1. 创作者通过鼠标滚轮或按住空格拖拽画布，将目标节点（如“订单中心集群”）移动至视野中央；
2. 点击右侧属性面板中的 **「🎯 捕获当前画布视角」** 按钮；
3. 系统自动反解出最优的 `zoom`, `x`, `y` 参数，取景框瞬间锁定当前工作台视野。

---

### 3.3 模式二：画布直接抓取平移 (Direct Canvas Drag-to-Move)
* **触发机制**：在工具栏处于【选择工具（Select Tool）】状态下，将鼠标移入青色取景框区域；
* **光标反馈**：光标自动变为抓手手势 `cursor-grab`，悬停边缘激活发光增强效果；
* **拖拽执行**：按住鼠标左键直接拖动，取景框在底图上平滑移动：
  $$\Delta X_{\text{natural}} = \frac{\Delta x_{\text{client}}}{\text{scale}}, \quad \Delta Y_{\text{natural}} = \frac{\Delta y_{\text{client}}}{\text{scale}}$$
  $$x_{\text{new}} = x_{\text{start}} + \frac{\Delta X_{\text{natural}}}{W_{\text{natural}}} \times 100\%$$
* **边界保护**：拖动全过程受规则 3 安全边界钳位保护，无法拖出底图有效可视区；
* **实时联动**：拖动时右侧检查器的 `水平偏移 (X)` 与 `垂直偏移 (Y)` 滑块实时动态响应。

---

### 3.4 模式三：四角手柄等比例缩放 (Corner Resize Zoom)
* **手柄布局**：取景框四角（NW, NE, SW, SE）提供高亮交互小手柄；
* **对角拖拽**：按住手柄向内推为“镜头拉近（放大 Zoom）”，向外拉为“镜头拉远（缩小 Zoom）”；
* **比例锁定**：严格遵循规则 1 等比例缩放，并自动限制放大倍率在 `1.0x ~ 3.5x` 之间。

---

### 3.5 模式四：属性检查器数值精确微调与一键居中复位
* **水平偏移 (X)**：支持 `-50.0% ~ +50.0%` 双向滑块与数值输入，步长 `0.5%`；
* **垂直偏移 (Y)**：支持 `-50.0% ~ +50.0%` 双向滑块与数值输入，步长 `0.5%`；
* **运镜放大倍率 (Zoom)**：支持 `1.0x ~ 3.5x` 滑块调节；
* **一键居中复位**：点击「复位」按钮，一键将 $(x, y)$ 迅速归零 `(0.0%, 0.0%)`。

---

### 3.6 模式五：键盘方向键像素级精调
* 点击选中青色取景框（激活 Cyan 聚焦光环）；
* 使用键盘 **`↑` `↓` `←` `→`** 进行步长为 `0.5%` 的微米级对齐；
* 按住 **`Shift + 方向键`** 以 `2.0%` 步长快速步进；
* 按 **`Escape`** 键退出取景框聚焦状态。

---

## 4. 核心代码架构与防回归机制 (Architecture & Quality Assurance)

### 4.1 工作台底图与运镜渲染解耦 (disableCamera 机制)
在编辑器内部，`InfiniteCanvas` 已经在负责全工作台视口的平移和缩放。如果底层播放器内核也执行 `scale(zoom) translate(x%, y%)`，会导致双重矩阵变换叠加，使底图飞出视野或与上层标注图元发生错位。

因此在 [`packages/player/src/core/camera.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/core/camera.js) 与 [`FocusFlowPlayer`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/core/player.js) 中引入了 `disableCamera: true` 模式：
```javascript
export class CameraKinematics {
  constructor(wrapElement, baseWidth = 5120, baseHeight = 2880, options = {}) {
    this.wrap = wrapElement;
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.disabled = !!options?.disabled;
  }

  apply(camera, animate = true) {
    if (this.disabled) {
      this.wrap.style.transform = 'none';
      return; // Studio 编辑模式下底图保持 1:1 绝对空间，运镜完全由取景框呈现
    }
    // 演播模式下正常执行 GPU 加速 3D 矩阵变换
    ...
  }
}
```

### 4.2 生命周期与状态同步解耦
在 [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 中，底层播放器实例的生命周期仅受 `[dsl.asset?.url, currentProjectId]` 约束，避免因 DSL 属性更新触发播放器销毁重建并强制跳回第 1 幕（Scene 0）。通过细粒度的 `useEffect` 分别监听控制条显隐与场景切换。

### 4.3 自动化测试与 E2E 验证矩阵
所有运镜与取景框功能均通过 Playwright 端到端测试套件覆盖保护：
- [`TC301`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage3-visual-tools.spec.ts)：验证安全可视取景框正常挂载、手柄缩放、一键捕获与居中复位；
- [`TC306`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage3-visual-tools.spec.ts)：验证标定助手 Precision HUD 实时物理/百分比度量与准星联动；
- [`TC401~TC405`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/stage4-timeline-history.spec.ts)：验证跨场景切换时取景框坐标继承与独立保持。
