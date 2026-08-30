# FocusFlow Studio · Stage 3 详细技术开发设计文档
## 可视化取景与 4 大图元标定编辑工具 (Visual Tools & Framing)

---

## 1. 架构目标与交互全景 (Objectives & Visual Interaction Architecture)

Stage 3 核心使命是构筑 **FocusFlow Studio 模式 A（离线自治模式）** 的“可视化核心生产力工具链”：
1. **镜头取景器与视口视角捕获 (Camera Viewport Frame & Framing Engine)**：
   - 在画布上以发光辅助边框实时渲染当前场景的摄像机可视安全取景范围（Frustum Safe Frame）；
   - 支持手势拖拽取景框、边缘八向缩放手柄，并提供“一键捕获当前画布视角”算法，自动反解输出 `{ zoom, x, y, duration }` 摄像机参数。
2. **智能选框可视化绘制与 Sobel 边缘像素级吸附 (Smart Box Tool & Sobel Edge Snapping)**：
   - 拖拽矩形选框时，实时调用离屏 Canvas 进行 $3\times 3$ Sobel 梯度卷积与 $\pm 24\text{px}$ 窄带一维能量投影；
   - 鼠标松手瞬间，自动像素级贴合吸附到底图卡片物理边缘；
   - 按住 `⌥ Option` 支持纯手动自由绘制，并提供即时描边、圆角与发光配置。
3. **8 向锚点可视化捕捉与三次贝塞尔流光连线 (Bezier Route Tool & 8-Anchor Snapping)**：
   - 悬停选框自动高亮呈现 8 向锚点（`top`, `bottom`, `left`, `right`, `top-left`, `top-right`, `bottom-left`, `bottom-right`）；
   - 从源锚点拖拽至目标锚点，自动实时计算三次贝塞尔曲线控制点（$C_1, C_2$）曲率与方向向量；
   - 支持动态流速（`flowSpeed`）、流动方向与发光流光模式（`stream` / `dashed` / `solid`）。
4. **脉冲定位圆点与解说气泡/徽章 (Pulse Dot & Callout Badges)**：
   - 单击快速在画布物理坐标系放置带扩散波纹动画的脉冲定位圆点（Pulse Dot）；
   - 气泡解说卡片（Callout）支持智能吸附挂载至目标 Box 或独立绝对定位，提供实时 Markdown 编辑与 5 种预置主题色（`blue`, `green`, `amber`, `rose`, `cyan`）。
5. **交互式图元选择与双向数据流 (Canvas Drawing Layer & State Flow)**：
   - 在无限画布几何变换层之上构筑独立的交互绘制图层（`CanvasOverlay`），与 Zustand `useEditorStore`、`useProjectStore` 实现 60fps 毫秒级双向响应。

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       FocusFlow Studio · Stage 3 工具架构                       │
└────────────────────────────────────────────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 1. 镜头取景器 (Camera)   │  │ 2. 智能选框 (Box)       │  │ 3. 贝塞尔连线 (Path)    │
│ - 安全取景框可视化      │  │ - 交互式拖拽矩形      │  │ - 8 向锚点动态捕获      │
│ - 视角一键捕获算法      │  │ - Sobel 边缘自动贴合  │  │ - 三次贝塞尔控制点计算   │
│ - 运镜时长与缓动配置    │  │ - ⌥ 手动绘制自由模式  │  │ - 动态流光流速配置       │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
           │                            │                            │
           ├────────────────────────────┼────────────────────────────┘
           ▼                            ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│ 4. 脉冲圆点 (Dot)       │  │ 5. 解说气泡 (Callout)   │
│ - 坐标一键单击放置      │  │ - 挂载至选框 / 自由定位 │
│ - 扩散涟漪动效配置      │  │ - Markdown 富文本编辑   │
│ - 序号与发光配色        │  │ - 5 套科技发光主题色    │
└─────────────────────────┘  └─────────────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │   CanvasOverlay 交互标定绘制层     │
                      │   Zustand 响应式数据流与双向绑定   │
                      └───────────────────────────────────┘
```

---

## 2. 镜头取景器与安全视口框架 (Camera Viewport Frame & Framing Engine)

### 2.1 摄像机参数与视口几何反解算法 (Camera Mathematics)

当前场景摄像机参数包含：`{ zoom: number, x: number, y: number, duration: number }`。
在画布上，安全可视取景框（Frustum Frame）代表当前镜头聚焦在底图上的矩形范围：
- 底图物理分辨率：$W_{\text{natural}} \times H_{\text{natural}}$；
- 镜头视口实际宽高：
  $$W_{\text{frame}} = \frac{W_{\text{natural}}}{\text{zoom}}, \quad H_{\text{frame}} = \frac{H_{\text{natural}}}{\text{zoom}}$$
- 镜头中心物理坐标：
  $$X_{\text{center}} = \frac{W_{\text{natural}}}{2} \cdot \left(1 + \frac{x}{100}\right), \quad Y_{\text{center}} = \frac{H_{\text{natural}}}{2} \cdot \left(1 + \frac{y}{100}\right)$$
- 取景框左上角物理坐标：
  $$X_{\text{frame}} = X_{\text{center}} - \frac{W_{\text{frame}}}{2}, \quad Y_{\text{frame}} = Y_{\text{center}} - \frac{H_{\text{frame}}}{2}$$

### 2.2 “一键捕获当前画布视角”算法 (Capture Current Viewport)

当用户在 InfiniteCanvas 中通过滚轮和拖拽将画布调整到满意的视觉位置后，点击“捕获当前视角”：
根据 InfiniteCanvas 的 `transform: { scale, x, y }` 与容器尺寸，自动反推计算当前场景的摄像机 `{ zoom, x, y }`：
$$\text{zoom} = \frac{\text{scale}}{\text{scale}_{\text{base}}}$$
$$x = \left(\frac{X_{\text{viewportCenter}} - W_{\text{natural}} / 2}{W_{\text{natural}} / 2}\right) \times 100$$
$$y = \left(\frac{Y_{\text{viewportCenter}} - H_{\text{natural}} / 2}{H_{\text{natural}} / 2}\right) \times 100$$

---

## 3. 智能选框工具与 Sobel 边缘自动吸附算法 (Smart Box Tool & Sobel Snapping)

### 3.1 离屏像素梯度分析与能量投影 (Sobel Spatial Integration)

将底图渲染至离屏 Canvas，获取 `Uint8ClampedArray` 像素数据：
1. **$3\times 3$ Sobel 水平与垂直卷积核**：
   $$G_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix}, \quad G_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix}$$
2. **像素梯度幅值**：
   $$G(x,y) = \sqrt{G_x^2 + G_y^2}$$
3. **$\pm 24\text{px}$ 窄带一维能量投影优化**：
   在用户拖拽释放的初始框候选边缘附近 $\pm 24\text{px}$ 窗口内，分别沿 X 轴和 Y 轴进行积分投影，搜索能量极大值点（Peak Gradient Position），实现边缘自动收敛吸附：

```typescript
export interface SnappedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function snapRectWithSobel(
  rawRect: SnappedRect,
  pixelData: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  searchRadius = 24
): SnappedRect {
  // 1. 窄带 X 方向能量极大值计算 (Left & Right 边缘吸附)
  // 2. 窄带 Y 方向能量极大值计算 (Top & Bottom 边缘吸附)
  // 3. 返回像素级贴合的精准矩形
}
```

---

## 4. 8 向锚点捕捉与三次贝塞尔流光连线引擎 (Bezier Route Tool & 8-Anchor Snapping)

### 4.1 8 向锚点坐标计算 (Anchor Topology)

对于任意矩形选框 $B = \{x, y, w, h\}$，其 8 向锚点定义为：
- `top`: $(x + w/2, y)$
- `bottom`: $(x + w/2, y + h)$
- `left`: $(x, y + h/2)$
- `right`: $(x + w, y + h/2)$
- `top-left`: $(x, y)$
- `top-right`: $(x + w, y)$
- `bottom-left`: $(x, y + h)$
- `bottom-right`: $(x + w, y + h)$

### 4.2 三次贝塞尔曲线控制点动态生成算法 (Cubic Bezier Control Points)

当连线源锚点为 $P_1(x_1, y_1)$，目标锚点为 $P_2(x_2, y_2)$ 时：
根据源锚点法向量 $\vec{N_1}$ 与目标锚点法向量 $\vec{N_2}$，自动计算控制点 $C_1, C_2$：
$$C_1 = P_1 + \vec{N_1} \cdot D \cdot 0.5$$
$$C_2 = P_2 + \vec{N_2} \cdot D \cdot 0.5$$
其中 $D = \max(|x_2 - x_1|, |y_2 - y_1|, 80)$ 为距离权重系数。生成的 SVG 路径表达式为：
$$d = \text{"M } x_1, y_1 \text{ C } cx_1, cy_1 \text{ } cx_2, cy_2 \text{ } x_2, y_2\text{"}$$

---

## 5. 脉冲定位圆点与解说气泡 (Pulse Dot & Callout Badges)

### 5.1 脉冲定位圆点 (Pulse Dot)
- **参数结构**：`{ id, x, y, style: { color, radius, pulse: boolean } }`；
- **交互**：在 `ToolType = 'dot'` 模式下，鼠标点击底图任意位置，立即生成脉冲圆点，并自动关联激活至当前场景。

### 5.2 解说气泡 (Callout Card)
- **参数结构**：
  ```typescript
  export interface CalloutItem {
    id: string;
    targetBoxId?: string;
    position: { left: string; top: string };
    theme: 'blue' | 'green' | 'amber' | 'rose' | 'cyan';
    title: string;
    desc: string;
  }
  ```
- **交互**：支持直接拖拽调整位置；在 Inspector 面板中可实时修改标题、描述与主题发光色。

---

## 6. 交互标定层与状态流转设计 (CanvasOverlay & State Topology)

在 `apps/studio/src/components/canvas/` 中新建 `CanvasOverlay.tsx`，作为 InfiniteCanvas 的顶层可交互图层：

```
┌─────────────────────────────────────────────────────────────┐
│                       InfiniteCanvas                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Transform Content Layer                               │  │
│  │  ┌─────────────────────────┐ ┌──────────────────────┐ │  │
│  │  │ FocusFlowPlayer 底层视图 │ │ CanvasOverlay 交互层 │ │  │
│  │  │ (渲染静态底图与图元)    │ │ (捕捉鼠标、选框、连线)│ │  │
│  │  └─────────────────────────┘ └──────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Playwright E2E 自动化测试设计 (Testing Strategy)

严格遵循全局规则（**测试用例逻辑全部提取为独立的异步 helper 函数，在 `it()` / `test()` 中调用**）：

```typescript
// apps/studio/e2e/stage3-visual-tools.spec.ts

async function verifyCameraViewportFrustumAndCapture(page: Page): Promise<void>;
async function verifySmartBoxDrawingAndSobelSnapping(page: Page): Promise<void>;
async function verifyBezierRoutePathCreation(page: Page): Promise<void>;
async function verifyPulseDotAndCalloutCreation(page: Page): Promise<void>;
async function verifyInspectorElementPropertyTwoWayBinding(page: Page): Promise<void>;

test.describe('FocusFlow Studio Stage 3 E2E Visual Tools Suite', () => {
  test('TC301: 验证镜头取景框可视化与一键捕获当前视角', async ({ page }) => {
    await verifyCameraViewportFrustumAndCapture(page);
  });

  test('TC302: 验证智能选框绘制与 Sobel 边缘像素级贴合', async ({ page }) => {
    await verifySmartBoxDrawingAndSobelSnapping(page);
  });

  test('TC303: 验证 8 向锚点捕捉与三次贝塞尔流光连线生成', async ({ page }) => {
    await verifyBezierRoutePathCreation(page);
  });

  test('TC304: 验证脉冲定位圆点与解说气泡创建与主题切换', async ({ page }) => {
    await verifyPulseDotAndCalloutCreation(page);
  });

  test('TC305: 验证属性检查器与图元属性双向数据同步', async ({ page }) => {
    await verifyInspectorElementPropertyTwoWayBinding(page);
  });
});
```

---

## 8. Stage 3 任务分解与执行清单 (WBS Checklist)

- [x] **Task 3.1: 镜头取景器与视口视角捕获 (Camera Viewport Frame & Framing Engine)**
  - [x] 3.1.1 编写 `src/utils/cameraMath.ts`：实现摄像机参数与安全取景框物理坐标互转、视口中心反解算法
  - [x] 3.1.2 编写 `src/components/canvas/CameraFrustumFrame.tsx`：在画布上呈现发光安全取景框与调整手柄
  - [x] 3.1.3 在 `RightInspector.tsx` 新增“捕获当前画布视角”快捷操作按键
- [x] **Task 3.2: 智能选框工具与 Sobel 边缘自动吸附 (Smart Box Tool & Sobel Snapping Engine)**
  - [x] 3.2.1 编写 `src/utils/edgeSnapper.ts`：实现离屏 $3\times 3$ Sobel 梯度卷积与 $\pm 24\text{px}$ 窄带能量极大值投影
  - [x] 3.2.2 编写 `src/components/canvas/BoxDrawingOverlay.tsx`：实现鼠标拖拽选框、实时吸附与 `⌥ Option` 手动模式
  - [x] 3.2.3 选框生成后自动注入 `useProjectStore` 并关联至当前激活场景
- [x] **Task 3.3: 8 向锚点捕捉与三次贝塞尔流光连线 (Bezier Route Tool & 8-Anchor Snapping)**
  - [x] 3.3.1 编写 `src/utils/bezierMath.ts`：计算 8 向锚点绝对坐标与平滑三次贝塞尔控制点曲线
  - [x] 3.3.2 编写 `src/components/canvas/PathDrawingOverlay.tsx`：实现锚点吸附高亮、流光连线拖拽生成与方向向量计算
  - [x] 3.3.3 支持在 `RightInspector.tsx` 配置连线流速、描边粗细与流光动画
- [x] **Task 3.4: 脉冲定位圆点与解说气泡组件 (Pulse Dot & Callout Badges)**
  - [x] 3.4.1 编写 `src/components/canvas/DotDrawingOverlay.tsx`：单击放置脉冲圆点与涟漪动效
  - [x] 3.4.2 编写 `src/components/canvas/CalloutOverlay.tsx`：支持拖拽定位、选框挂载、Markdown 编辑与 5 套科技发光主题色
  - [x] 3.4.3 整合 `src/components/canvas/CanvasOverlay.tsx` 统一管理 4 大标定工具状态机
- [ ] **Task 3.5: 质量门禁与 Playwright E2E 自动化测试 (Quality Gates & Verification)**
  - [ ] 3.5.1 编写 `e2e/stage3-visual-tools.spec.ts`（独立异步 helper 函数规范）
  - [ ] 3.5.2 运行 `pnpm lint`（Oxlint 极速静态检查 0 警告 0 错误）
  - [ ] 3.5.3 运行 `pnpm typecheck`（TypeScript 复合类型 100% 编译通过）
  - [ ] 3.5.4 运行 `pnpm build`（Turborepo 全局拓扑构建验证通过）

---
*FocusFlow Studio Architecture Working Group · 2026.08*
