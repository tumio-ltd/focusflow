# FocusFlow 图元系统设计哲学与代码实现规范 (Elements Design & Architecture Guide)

> **适用对象**：核心开发人员、架构设计师与自动化 AI Agent。  
> **核心用途**：深入阐释 FocusFlow 各类图元（Box、Path、Dot、Callout、Image）在**设计心智（Mental Model）**、**空间坐标系（Space Coordinate Systems）**、**视觉感知落差（Perception Math）**与**工程代码实现（Code Implementation）**层面的全貌机制。

---

## 目录 (Table of Contents)

- [一、 核心底层设计：双重空间坐标系与视觉感知数学](#一-核心底层设计双重空间坐标系与视觉感知数学)
  - [1. 世界空间 (World Space) vs 屏幕视口空间 (Screen Space)](#1-世界空间-world-space-vs-屏幕视口空间-screen-space)
  - [2. 视觉落差之谜：设计态 vs 播放态的字号数学账](#2-视觉落差之谜设计态-vs-播放态的字号数学账)
- [二、 五大核心图元设计与代码实现全景剖析](#二-五大核心图元设计与代码实现全景剖析)
  - [1. 解说气泡 (Callout · 浮动讲解卡片)](#1-解说气泡-callout--浮动讲解卡片)
  - [2. 贝塞尔连线 (Path · 拓扑数据血脉)](#2-贝塞尔连线-path--拓扑数据血脉)
  - [3. 运动框元 (Box · 实体物理边界)](#3-运动框元-box--实体物理边界)
  - [4. 脉冲圆点 (Dot · 定位告警信标)](#4-脉冲圆点-dot--定位告警信标)
  - [5. 动态插图 (Image · 局部下钻贴图)](#5-动态插图-image--局部下钻贴图)
- [三、 摄像机运镜机制与几何约束数学 (Camera Kinematics)](#三-摄像机运镜机制与几何约束数学-camera-kinematics)
- [四、 全图元设计与代码对照矩阵 (Design-to-Code Matrix)](#四-全图元设计与代码对照矩阵-design-to-code-matrix)

---

## 一、 核心底层设计：双重空间坐标系与视觉感知数学

### 1. 世界空间 (World Space) vs 屏幕视口空间 (Screen Space)

FocusFlow 播放与编辑引擎严格解耦了两个截然不同的物理空间：

```
┌────────────────────────────────────────────────────────────────────────┐
│ 屏幕视口空间 (Screen Space)                                            │
│ • 恒定 1:1 屏幕物理像素 (不随镜头拉远/推进而缩放)                       │
│ • 包含：摄像机安全取景框 (Frustum Frame)、激光十字准星 (Laser Crosshair)│
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 世界空间 (World Space / Canvas Coordinate)                     │   │
│   │ • 牢牢扎根在底图表面 (随镜头飞行、旋转、Zoom 特写整体缩放)     │   │
│   │ • 包含：底图 (Asset)、框元 (Box)、连线 (Path)、气泡 (Callout) │   │
│   │                                                                │   │
│   │    [API Gateway 框元] ───────(流光连线)───────> [Order 框元]  │   │
│   │         │                                                      │   │
│   │         └─── (虚线引导) ───> 💬 [解说气泡广告牌]               │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

* **世界空间（World Space）**：
  * **所有商业图元（Box、Path、Dot、Callout、Image）全部属于世界空间**。
  * 它们相当于“插在底图大楼地表上的路标、管线与解说广告牌”。当摄像机推近（Zoom In）给微服务拍特写时，框元、连线与气泡卡片会随着地表**一同被放大**。
* **屏幕视口空间（Screen Space）**：
  * 仅包含设计工作台的**辅助标定控制系统**（如取景框边框、激光十字准星的 1px 细线、坐标读数徽章）。无论画布缩放到多小，这些辅助仪表的线条始终保持恒定的 1 像素物理显示。

---

### 2. 视觉落差之谜：设计态 vs 播放态的字号数学账

在制作演示项目时，很多创作者和 Agent 经常产生一个直觉困惑：  
> **“为什么气泡卡片在设计时觉得字特别小，一到播放或全屏时又觉得字变得特别大？”**

这并不是 Bug，而是**“镜头离物体的拍摄距离”发生了巨大变化**。

#### 形象比喻：100 米无人机高空俯瞰 vs 1 米贴脸特写
* **在【设计时】**：你坐在 **100 米高空的无人机**上俯瞰整座城市（要看清 1920 乃至 5120 的整张架构全景），大楼门口插着的解说广告牌在你的视网膜上自然缩成了一个米粒大小的点。
* **在【播放时】**：电影摄影师把摄像机直接推到了**大楼门口 1 米处拍特写**（`camera.zoom = 1.6`），广告牌上的文字瞬间铺满了半个镜头画面。

#### 严谨的数学算账（以 12px 默认正文为例）

| 阶段 | 镜头运镜与视口机制 | 电脑屏幕上实际物理渲染大小 | 肉眼感知 |
| :--- | :--- | :--- | :--- |
| **设计编辑态**<br>(工作台全局总览) | 为了将 1920（或 5K）底图整体塞进 Studio 中间的工作区，画布被全局缩小（例如缩小至 **40%**，`scale = 0.4`） | $12\text{px} \times 0.4 = \mathbf{4.8\text{px}}$ | 感觉像蚂蚁小字，难以看清，误以为字号设小了。 |
| **播放演播态**<br>(分镜特写大片) | 摄像机飞向该子系统，执行 **1.6 倍镜头特写**（`camera.zoom = 1.6`），画面铺满全屏窗口 | $12\text{px} \times 1.6 = \mathbf{19.2\text{px}}$ | 感觉字很大、极清晰醒目，视觉冲击力强。 |

$$\text{视觉感知相对落差} = \frac{19.2\text{px}}{4.8\text{px}} = \mathbf{4.0 \text{ 倍！}}$$

#### 创作者黄金避坑准则
1. **切忌在全局总览视图下盲目调大字号**：如果在缩小总览下看着舒服（比如改成 24px），在播放特写时文字会被放大至 $24 \times 1.6 = 38.4\text{px}$，气泡会巨大无比并遮挡核心架构图元。
2. **默认字号区间**：正文保持在 **`11px ~ 13px`**，标题徽章保持在 **`10px ~ 12px`** 即为演播特写的最佳视距。
3. **真实比例预览方法**：按右下角缩放控件复位到 **`1:1 (100%)`**，或按下空格键试播当前幕，摄像机到位停住那一帧即为最终观众视效。

---

## 二、 五大核心图元设计与代码实现全景剖析

### 1. 解说气泡 (Callout · 浮动讲解卡片)

#### (1) 设计哲学
解说气泡是 FocusFlow 演播大片的“解说员”。它不直接修改底图，而是依附在特定框元旁，负责在特写运镜停稳后，为观众呈现精炼的技术名词与核心实现原理。

#### (2) DSL 契约定义
```ts
interface CalloutItem {
  id: string;                     // 唯一标识，如 "callout-gw"
  targetBoxId?: string;           // 绑定的目标 Box ID (触发流光引导虚线)
  title: string;                  // 气泡卡片徽章标题 (如 "Spring Cloud Gateway")
  desc: string;                   // 核心技术解说正文
  theme?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'pink'; // 主题色代币
  position: { left: string; top: string }; // 绝对坐标 (如 "1850px", "220px" 或 "35%", "20%")
  style?: {
    fontSize?: number;            // 正文字号 (默认 12)
    titleFontSize?: number;       // 标题字号 (默认 11)
    maxWidth?: number;            // 最大卡片宽度 (默认 320)
  };
}
```

#### (3) 核心代码实现映射
* **编辑态交互 (`CalloutTransformOverlay.tsx`)**：
  * **未选中态**：渲染半透明气泡简报胶囊，支持鼠标悬停高亮与点击穿透选中；
  * **选中态**：呈现高亮呼吸光晕卡片，顶部展示快捷微型调色盘、目标框元绑定标签、删除与取消键；
  * **流光虚线 (`leader line`)**：通过 SVG `<line strokeDasharray="4 4" className="animate-pulse">` 从目标框元中心动态连向气泡卡片，配合圆环 ping 扩散动画；
  * **拖拽平移**：监听 `onPointerDown/Move/Up`，计算画布物理坐标并实时调用 `updateCallout(id, { position })`。
* **播放态渲染 (`packages/player/src/core/player.js` & `focusflow.css`)**：
  * DOM 挂载点：`#_ff_callouts`（世界空间层，位于底图与 SVG 连线上方）；
  * 进出场动效：`.ff-callout { opacity: 0; transform: translateY(12px) scale(0.96); transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1); }`；当前幕激活时附加 `.active` 实现平滑微浮动弹现。

---

### 2. 贝塞尔连线 (Path · 拓扑数据血脉)

#### (1) 设计哲学
连线是跨层架构交互的“动脉”。传统拓扑图线条死板生硬，FocusFlow 引入三次贝塞尔曲线与沿路径高速运动的粒子流光（Fluid Stream），直观展示高并发数据流向。

#### (2) 控制点正交分轴算法 (Orthogonal Projection Routing)
在连接两个框元时，控制点切线不能盲目采用欧氏距离（`Math.hypot`），否则在垂直跨度大而水平间距小时会产生向外凸起的畸形圆环。

FocusFlow 统一采用**正交分轴投影算法**（`packages/player/src/motion/bezier-router.js` 与 `apps/studio/src/utils/bezierMath.ts` 完全一致）：

$$\Delta x = |X_{to} - X_{from}| \times \text{tension}, \quad \Delta y = |Y_{to} - Y_{from}| \times \text{tension} \quad (\text{tension} = 0.55)$$

$$\begin{cases}
CP_{1x} = X_{from} + \text{normal}_{from.dx} \times \Delta x \\
CP_{1y} = Y_{from} + \text{normal}_{from.dy} \times \Delta y \\
CP_{2x} = X_{to} + \text{normal}_{to.dx} \times \Delta x \\
CP_{2y} = Y_{to} + \text{normal}_{to.dy} \times \Delta y
\end{cases}$$

当两端均为水平锚点（`dx !== 0`）时，强制垂直方向控制点对齐（`CP_{1y} = Y_{from}, CP_{2y} = Y_{to}`），从而生成优雅极致的水平平滑 S 型流光曲线。

#### (3) 8 向物理锚点标准
* **标准 4 极**：`.left`, `.right`, `.top`, `.bottom`（居中对齐）
* **对角 4 极**：`.left-top`, `.left-bottom`, `.right-top`, `.right-bottom`（上下 1/4 处对齐）

#### (4) 核心代码实现映射
* **编辑态交互 (`PathTransformOverlay.tsx`)**：
  * **32px 透明热区**：在曲线路径上覆盖宽透明 Stroke，使极细连线在画布上轻松一键点击选中；
  * **选中态视觉**：曲线叠加双层呼吸发光（霓虹 outer pulse + 白色 inner crisp）；
  * **端点手柄 (`Handles`)**：起点渲染为 Cyan 圆环，终点渲染为 Emerald 圆环；
  * **8 向磁吸重连**：拖拽端点手柄时，自动计算距离鼠标最近的 Box 锚点（距离 < 48px），触发磁吸环与标签提示，松手调用 `updatePathEndpoints` 完成拓扑重连；
  * **DOM 真实路径直读**：静止选中态直接读取 Player DOM 中的 `d` 属性，确保 100% 像素级贴合。
* **播放态渲染 (`player.js`)**：
  * SVG `<path class="ff-path">`，依据 `getTotalLength()` 计算周长；
  * 结合 CSS 关键帧实现 `strokeDashoffset` 连续流光或生长绘制。

---

### 3. 运动框元 (Box · 实体物理边界)

#### (1) 设计哲学
框元标记架构中的核心物理节点（如微服务容器、数据库实例、网关）。在运镜推进时，框元作为视觉主角，边框呈现呼吸流光与光晕投影。

#### (2) DSL 契约定义
```ts
interface ElementBox {
  id: string;                     // 唯一标识，如 "box-gateway"
  x: number; y: number;           // 左上角坐标 (基于底图绝对像素)
  width: number; height: number;  // 宽高尺寸 (基于底图绝对像素)
  rx?: number;                    // 圆角半径 (默认 16)
  style?: {
    stroke?: string;              // 边框描边色 (如 "#38bdf8")
    strokeWidth?: number;         // 描边粗细 (如 4)
    glow?: boolean;               // 是否开启外发光滤镜
    boxShadow?: boolean | string; // 呼吸阴影
  };
}
```

#### (3) 核心代码实现映射
* **编辑态交互 (`BoxTransformOverlay.tsx`)**：
  * 监听框元点击，选中后展示 8 个方位的拉伸控制手柄（N, S, W, E, NW, NE, SW, SE）；
  * 结合边缘吸附算法（Sobel Edge Snapper），拖拽缩放时自动磁吸底图线条；
  * 悬浮微型工具栏支持一键切换主题色、查看像素尺寸与删除。
* **播放态渲染 (`player.js`)**：
  * SVG `<rect class="ff-box" filter="url(#ff-glow)">`；
  * 自动依据 `geometry.getBoxPerimeter(box)` 初始化边框周长动画。

---

### 4. 脉冲圆点 (Dot · 定位告警信标)

#### (1) 设计哲学
用于标记地图中的精确地理坐标、服务器节点宕机告警位置或拓扑交汇核心。呈现多圈声纳脉冲扩散（Sonar Ping）动效。

#### (2) DSL 契约定义
```ts
interface ElementDot {
  id: string;                     // 如 "dot-auth-alert"
  cx: number; cy: number;         // 圆心原生像素坐标
  r?: number;                     // 基础半径 (默认 10)
  style?: {
    fill?: string;                // 填充色
    pulse?: boolean;              // 是否开启扩散脉冲波
  };
}
```

#### (3) 核心代码实现映射
* **编辑态交互 (`DotTransformOverlay.tsx`)**：
  * 画布圆心手柄拖拽平移，支持实时更新 `cx, cy`；
  * 悬浮调色盘与半径快捷滑竿。
* **播放态渲染 (`player.js`)**：
  * SVG `<circle class="ff-dot">`，结合 CSS `@keyframes ff-dot-ping` 实现层叠扩散。

---

### 5. 动态插图 (Image · 局部下钻贴图)

#### (1) 设计哲学
当架构讲解进入特定子系统时，往往需要下钻展示更深度的子流程（如订单状态机迁移图、数据库表 E-R 局部图、微服务监控仪表盘截图）。动态插图用于在场景分镜中覆盖呈现局部高清图。

#### (2) DSL 契约定义
```ts
interface ElementImage {
  id: string;                     // 如 "img-order-state-machine"
  url: string;                    // 插图资源路径或公网 URL
  x: number; y: number;           // 左上角坐标
  width: number; height: number;  // 尺寸
  style?: {
    borderRadius?: number;
    border?: string;
    boxShadow?: boolean | string;
    animation?: 'zoom-fade' | 'slide-up'; // 进场动效
  };
}
```

#### (3) 核心代码实现映射
* **编辑态交互 (`ImageTransformOverlay.tsx`)**：
  * 类似 Box 的 8 向缩放手柄与整体平移控制；
  * 支持锁定宽高比（Aspect Ratio Locking）。
* **播放态渲染 (`player.js`)**：
  * 挂载在 `#_ff_overlay_images` 层，支持 GPU 硬件加速混合渲染。

---

## 三、 摄像机运镜机制与几何约束数学 (Camera Kinematics)

摄像机系统是编排时间轴的“导演之眼”。

### 1. 百分比坐标换算数学
FocusFlow 摄像机 `camera.x` 与 `camera.y` 严禁直接使用绝对像素，必须是**相对于底图中心点的百分比偏移量（$-50 \sim +50$）**。

#### 推导公式
设底图物理基准宽高为 $(W, H)$，目标高亮框元的几何中心点为：
$$X_{mid} = X_{box} + \frac{W_{box}}{2}, \quad Y_{mid} = Y_{box} + \frac{H_{box}}{2}$$

则聚焦到该框元的摄像机镜头坐标公式为：
$$\text{camera.x} = \frac{X_{mid} - W / 2}{W} \times 100$$
$$\text{camera.y} = \frac{Y_{mid} - H / 2}{H} \times 100$$

### 2. 镜头安全边界夹紧 (Frustum Safety Clamping)
为了防止镜头缩放特写（如 `zoom = 2.0`）时摄像机移动过远导致画面边缘露出黑底，`CameraKinematics.clampCamera` 施加了严格的物理几何夹紧约束：
$$|T_x|, |T_y| \le \frac{Z - 1}{2Z} \times 100\% \times 1.15$$

---

## 四、 全图元设计与代码对照矩阵 (Design-to-Code Matrix)

| 图元类型 | 空间类别 | DSL 声明位置 | Studio 编辑控制层 | Player 渲染 DOM 节点 | 核心动画 / 交互特性 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **框元 (Box)** | World | `elements.boxes` | `BoxTransformOverlay.tsx` | SVG `<rect class="ff-box">` | 8 向缩放、边缘吸附、发光呼吸描边 |
| **连线 (Path)**| World | `elements.paths` | `PathTransformOverlay.tsx` | SVG `<path class="ff-path">` | 32px 透明点击热区、8 向锚点磁吸重连、三次贝塞尔流光粒子 |
| **圆点 (Dot)** | World | `elements.dots` | `DotTransformOverlay.tsx` | SVG `<circle class="ff-dot">` | 中心点拖拽、多层声纳扩散 Ping |
| **气泡 (Callout)**| World | `scenes[i].callouts` | `CalloutTransformOverlay.tsx`| HTML `<div class="ff-callout">`| 目标框元流光虚线引导、自适应字号、微弹动进场 |
| **插图 (Image)**| World | `elements.images` | `ImageTransformOverlay.tsx`| HTML `<img class="ff-overlay-img">`| 局部下钻展开、渐变缩放入场、宽高比锁定 |
| **取景框 (Frustum)**| Screen | `scenes[i].camera` | `CameraFrustumFrame.tsx` | SVG `<rect data-testid="frustum">` | 恒定 1px 屏幕绝对细线、安全视口拖拽平移与视角捕获 |
| **十字准星 (HUD)** | Screen | `meta.viewport` | `LaserCrosshairOverlay.tsx` | DOM Overlay | 实时物理像素与百分比坐标浮动读数、⌥C 秒级复制 |

---

> **结语**：FocusFlow 的核心技术壁垒，在于将复杂的电影级运镜动画转化为数学严谨、完全声明式的 JSON DSL 契约。理解了“世界空间与屏幕空间”、“镜头特写倍率对物理字号的倍增效应”以及“正交投影贝塞尔连线”，便能在设计和代码实现中游刃有余。
