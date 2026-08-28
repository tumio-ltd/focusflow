# FocusFlow - 开发者使用与镜头标定实战指南
## Practical Developer Guide & Camera Tuning Manual

> **适用对象**：架构师、技术写作者、前端工程师、技术方案演示者  
> **文档版本**：v1.0.0

---

## 目录 (Table of Contents)
- [1. 快速上手与项目运行](#1-快速上手与项目运行)
- [2. 新项目制作标准化工作流 (3 步流)](#2-新项目制作标准化工作流-3-步流)
- [3. FocusFlow 完整动效体系全景与效果说明 (6 大动效)](#3-focusflow-完整动效体系全景与效果说明-6-大动效)
  - [3.1 动效细节与视觉表现](#31-动效细节与视觉表现)
  - [3.2 在 config.json 中如何声明与区分这 6 种动效](#32-在-configjson-中如何声明与区分这-6-种动效)
- [4. 镜头运镜参数详解与两种调整方法 (核心)](#4-镜头运镜参数详解与两种调整方法-核心)
  - [4.1 镜头参数 (Camera) 物理意义与坐标系](#41-镜头参数-camera-物理意义与坐标系)
  - [4.2 调整方法 A：HUD 可视化实时调镜 (推荐 · 所见即所得)](#42-调整方法-a-hud-可视化实时调镜-推荐--所见即所得)
  - [4.3 调整方法 B：直接修改 JSON 配置文件 (精准数值控制)](#43-调整方法-b-直接修改-json-配置文件-精准数值控制)
  - [4.4 镜头取景最佳实践与经验参考值](#44-镜头取景最佳实践与经验参考值)
- [5. 高亮选框、流光连线与端点脉冲标定指南](#5-高亮选框流光连线与端点脉冲标定指南)
  - [5.1 鼠标拖拽拉框 (Drag-to-Box)](#51-鼠标拖拽拉框-drag-to-box)
  - [5.2 Alt+单击智能边缘吸附 (Pixel Snap)](#52-alt单击智能边缘吸附-pixel-snap)
  - [5.3 拓扑流光连线配置 (paths) 与 8 向锚点推导](#53-拓扑流光连线配置-paths-与-8-向锚点推导)
  - [5.4 接口端点脉冲光斑配置 (dots)](#54-接口端点脉冲光斑配置-dots)
  - [5.5 paths（流线）与 dots（端点）的协同关系与运动机理](#55-paths流线与-dots端点的协同关系与运动机理)
  - [5.6 标定助手双坐标系统与一键复制气泡 (Pixel & Percent)](#56-标定助手双坐标系统与一键复制气泡-pixel--percent)
- [6. 毛玻璃气泡阶梯弹入动效定制指南 (Callouts)](#6-毛玻璃气泡阶梯弹入动效定制指南-callouts)
  - [6.1 调整弹入时序与出场节奏 (JS 调度器)](#61-调整弹入时序与出场节奏-js-调度器)
  - [6.2 调整物理弹跳手感、滑入方向与毛玻璃质感 (CSS 样式)](#62-调整物理弹跳手感滑入方向与毛玻璃质感-css-样式)
  - [6.3 调整气泡内容、位置、色彩主题与先后顺序 (JSON DSL)](#63-调整气泡内容位置色彩主题与先后顺序-json-dsl)
  - [6.4 为什么 Callout 定义中没有 width 和 height (内容自适应设计哲学)](#64-为什么-callout-定义中没有-width-和-height-内容自适应设计哲学)
  - [6.5 标题框徽章配色规范与自定义扩展 (theme)](#65-标题框徽章配色规范与自定义扩展-theme)
- [7. 快捷键一览与常见问题 (FAQ)](#7-快捷键一览与常见问题-faq)

---

## 1. 快速上手与项目运行

### 1.1 启动本地开发服务器
在项目根目录下打开终端执行：

```bash
# 安装依赖 (首次使用)
pnpm install

# 启动本地开发与预览服务器
pnpm dev
```

* 默认访问地址：`http://localhost:5173/`
* 页面顶部提供 **LuxeHMS 拓扑图 (4K实战)** 和 **极简 2 节点示例** 的一键切换导航。

---

## 2. 新项目制作标准化工作流 (3 步流)

如果你想为团队的一张新架构图制作交互式演示，只需以下 3 步：

```
+-----------------------------------------------------------------------------------+
|                        FocusFlow 新架构图制作 3 步工作流                            |
|                                                                                   |
|  [ Step 1: 放置底图 ]  --->  [ Step 2: 编写 config.json ]  --->  [ Step 3: 初始化播放器 ]|
|  (PNG / SVG / 4K 大图)       (用 HUD 标定选框与镜头)              (页面即可丝滑展示)     |
+-----------------------------------------------------------------------------------+
```

### Step 1：放置图片资源
将你的架构图复制到目标示例目录（如 `examples/my-project/my_architecture.png`）。

### Step 2：创建配置文件 `config.json`
```json
{
  "$schema": "https://focusflow.io/schema/v1.json",
  "meta": {
    "title": "My Service Architecture",
    "viewport": { "width": 5120, "height": 2880 }
  },
  "asset": {
    "url": "./my_architecture.png"
  },
  "elements": { "boxes": [], "paths": [] },
  "scenes": [
    {
      "id": "scene-0",
      "title": "全局总览",
      "camera": { "zoom": 1.0, "x": 0, "y": 0 },
      "activeElements": { "boxes": [], "paths": [], "callouts": [] }
    }
  ]
}
```

### Step 3：在 HTML 中初始化播放器
```html
<div id="app"></div>
<script type="module">
  import { FocusFlowPlayer } from '../../src/index.js';

  fetch('./config.json')
    .then(res => res.json())
    .then(dsl => {
      new FocusFlowPlayer({
        container: '#app',
        dsl: dsl,
        basePath: './'
      });
    });
</script>
```

---

## 3. FocusFlow 完整动效体系全景与效果说明 (6 大动效)

在 FocusFlow 运行时，场景的视觉表达并非静态或简单的翻页，而是由 **6 大维度的复合动效体系** 协同驱动：

```
                       FocusFlow 6 大动效体系
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. 🎥 GPU 电影级运镜系统 (Camera Kinematics)                             │
│    • 全景 ➔ 局部 ➔ 跨区平移 ➔ 全景归位 (scale + translate 3D 硬件加速)    │
├─────────────────────────────────────────────────────────────────────────┤
│ 2. 🔲 卡片边框描边生长与发光 (Box Draw-In & Neon Glow)                   │
│    • 自动圆角矩形周长测算、0 缝隙闭合生长、SVG Neon 光晕激活              │
├─────────────────────────────────────────────────────────────────────────┤
│ 3. ⚡ 拓扑数据流向跑马灯 (Streaming Dashed Bézier)                      │
│    • 单次生长线 (draw) 与 持续流动流光虚线 (stream 跑马灯)               │
├─────────────────────────────────────────────────────────────────────────┤
│ 4. 🔴 接口端点脉冲呼吸粒子 (Pulse Anchor Dots)                           │
│    • 连线出入端口的微型圆点呼吸放大、透明度渐变与微发光                    │
├─────────────────────────────────────────────────────────────────────────┤
│ 5. 💬 毛玻璃气泡阶梯式弹入 (Staggered Callout Arrivals)                 │
│    • 阶梯延迟编排 (T = T0 + i·Δt)、Spring 弹性缩放、边缘防截断自适应翻转 │
├─────────────────────────────────────────────────────────────────────────┤
│ 6. 📊 顶栏进度流光与状态流转 (Progress Track & Lifecycle)                │
│    • 场景切换进度条平滑生长、Tab 胶囊按钮状态平滑吸附                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 动效细节与视觉表现

| 动效类型 | 视觉表现与体验 | 技术原理与触发机制 | 配置位置 |
| :--- | :--- | :--- | :--- |
| **1. 电影级运镜 (Camera)** | 画面平滑推近、跨区横移、缩放拉远，无跳变感 | 基于 CSS 3D Transform (`scale` + `translate`)，搭配 `cubic-bezier(0.4, 0, 0.2, 1)` 电影级缓动曲线 | `scenes[i].camera` |
| **2. 边框描边生长 (Box Draw-In)** | 矩形框从起始点顺时针绘制生长闭合，并带有霓虹辉光 | 引擎公式 $P = 2(w+h) - 1.7168 \cdot r_x$ 精准算得周长，驱动 `stroke-dashoffset` 从 $P \to 0$ | `elements.boxes` + `activeElements.boxes` |
| **3. 拓扑流向跑马灯 (Stream Line)** | 虚线连线持续向前流动推进，呈现出数据流转动感 | 三次贝塞尔控制点自动推导 + CSS `@keyframes` 无限循环偏移 `stroke-dashoffset` | `elements.paths` (`mode: 'stream'`) |
| **4. 端口脉冲呼吸点 (Pulse Dots)** | 连线出入端点的小圆点周期性微呼吸放大并伴随光晕 | `transform: scale()` 呼吸循环配合 `drop-shadow` 辉光 | `elements.dots` + `activeElements.dots` |
| **5. 毛玻璃气泡阶梯弹入 (Callouts)** | 解说卡片带毛玻璃背景，按时序依次弹跳滑入 (0.45s ➔ 0.70s ➔ 0.95s) | Double-RAF 状态隔离 + 阶梯延时公式 $T = T_{base} + i \cdot \Delta t$，自带视口防遮挡翻转 | `scenes[i].activeElements.callouts` |
| **6. 顶栏进度与控制器过渡** | 顶部进度条平滑生长，底部 Tab 按钮高亮平移过渡 | 宽度百分比 Transition 与 Active Class 状态机流转 | 播放器底层状态机自动驱动 |

---

### 3.2 在 `config.json` 中如何声明与区分这 6 种动效

`config.json` 采用高度解耦的结构设计，分为 **【全局图元池 (`elements`)】** 和 **【场景驱动列表 (`scenes`)】** 两大部分：

#### 1. 字段区分对照速查表

| 动效类型 | 在 `config.json` 中的关键区分字段 | 所属作用域 | 核心特征标识 |
| :--- | :--- | :--- | :--- |
| **1. 🎥 电影级运镜** | `"camera": { "zoom", "x", "y", "duration" }` | `scenes[i]` | 声明该场景的目标缩放倍率和平移坐标 |
| **2. 🔲 卡片边框描边生长** | `elements.boxes` + `scenes[i].activeElements.boxes` | 图元池 + 场景 | 包含 `x, y, width, height, rx` 几何参数，在场景中引用 ID 即激活生长 |
| **3. ⚡ 拓扑数据流向跑马灯** | `elements.paths` (`"mode": "stream"`) + `activeElements.paths` | 图元池 + 场景 | 包含 `from / to` 锚点，带有 **`"mode": "stream"`**（持续流动）或 `"draw"`（单次绘制） |
| **4. 🔴 接口端点脉冲呼吸点** | `elements.dots` + `scenes[i].activeElements.dots` | 图元池 + 场景 | 包含 `cx, cy, r` 圆心坐标，在场景中引用 ID 即激活脉冲微动 |
| **5. 💬 毛玻璃气泡阶梯弹入** | `scenes[i].activeElements.callouts` | 场景内部 | 数组内包含 `position: { left, top }`、`theme`、`title`、`desc` |
| **6. 📊 顶栏进度与底栏切换** | `scenes: [ { "id", "title" }, ... ]` | 全局场景列表 | **隐式自动驱动**：由 `scenes` 数组长度和 `title` 自动计算分段与生成按钮 |

---

#### 2. 带完整标注的 `config.json` 结构剖析

```json
{
  "meta": { "viewport": { "width": 5120, "height": 2880 } },
  "asset": { "url": "./system_architecture.png" },

  // ==========================================
  // 【全局图元池】：预先声明可动元素
  // ==========================================
  "elements": {
    // 🔲 动效 2：矩形高亮框
    "boxes": [
      {
        "id": "box-postgres",
        "type": "rect",
        "x": 3636, "y": 628, "width": 1297, "height": 332, "rx": 18,
        "style": { "stroke": "#34d399", "glow": true }
      }
    ],

    // ⚡ 动效 3：流动连线 (通过 mode: "stream" 标识持续跑马灯)
    "paths": [
      {
        "id": "line-folio-pg",
        "from": "box-folio.right",      // 自动计算起点锚点
        "to": "box-postgres.left-top",  // 自动计算终点锚点
        "style": {
          "stroke": "#38bdf8",
          "mode": "stream"              // 关键字段：持续跑马灯流动
        }
      }
    ],

    // 🔴 动效 4：接口端点脉冲呼吸点
    "dots": [
      {
        "id": "dot-folio-out",
        "cx": 2547, "cy": 1100, "r": 10,
        "style": { "fill": "#38bdf8", "glow": true }
      }
    ]
  },

  // ==========================================
  // 【场景驱动列表】：时序编排与动效激活
  // ==========================================
  "scenes": [
    {
      "id": "scene-1",
      // 📊 动效 6：场景标题，自动生成底部第 2 个 Tab 按钮
      "title": "数据持久化与夜审引擎",

      // 🎥 动效 1：电影级运镜目标矩阵
      "camera": {
        "zoom": 1.42,
        "x": -11,
        "y": 6,
        "duration": 1.2
      },

      "activeElements": {
        // 🔲 激活动效 2：当前场景要顺时针生长发光的框
        "boxes": ["box-postgres"],

        // ⚡ 激活动效 3：当前场景要启动跑马灯流动的连线
        "paths": ["line-folio-pg"],

        // 🔴 激活动效 4：当前场景要开启呼吸脉冲的点
        "dots": ["dot-folio-out"],

        // 💬 动效 5：当前场景要按时序阶梯弹出的毛玻璃气泡
        "callouts": [
          {
            "id": "co-folio",
            "position": { "left": "33%", "top": "33%" },
            "theme": "blue",
            "title": "Folio & Cashier",
            "desc": "Double-entry ledger · Shift balance"
          }
        ]
      }
    }
  ]
}
```

---

#### 3. 核心配置口诀
1. **运镜看 `camera`**（控制画面的缩放倍率与平移取景）；
2. **气泡看 `callouts`**（直接写在场景里，按数组顺序依次弹入）；
3. **选框、流线、光点看 `activeElements` 里的引用 ID**（在 `elements` 里定义形状，在场景里点名激活）！

---

## 4. 镜头运镜参数详解与两种调整方法 (核心)

### 4.1 镜头参数 (Camera) 物理意义与坐标系

在 `config.json` 的每个场景中，`camera` 对象控制着当切换到该步骤时，镜头推拉（Zoom）和视口居中平移（Pan）的最终状态：

```json
"camera": {
  "zoom": 1.42,
  "x": -11.0,
  "y": 6.0,
  "duration": 1.2
}
```

* **`zoom`（缩放倍率，数值型）**：
  * `1.0`：完整呈现原始底图（全景视角）；
  * `1.3 ~ 1.5`：中等局部聚焦（推荐，文字清晰、周围模块隐约可见，视野舒适）；
  * `1.8 ~ 2.2`：高倍特写聚焦（适用于特别密集的局部组件或徽章）。
* **`x`（水平偏移百分比，数值型，-50 ~ +50）**：
  * **负数（如 `-11`）**：将画面整体向左拉，用于**聚焦右侧区域**；
  * **正数（如 `+23`）**：将画面整体向右拉，用于**聚焦左侧区域**；
  * `0`：水平绝对居中。
* **`y`（垂直偏移百分比，数值型，-50 ~ +50）**：
  * **负数（如 `-8`）**：将画面整体向上拉，用于**聚焦底部区域**；
  * **正数（如 `+6`）**：将画面整体向下拉，用于**聚焦顶部区域**；
  * `0`：垂直绝对居中。
* **`duration`（过渡动画时长，单位：秒）**：
  * 默认 `1.2` 秒，配合内置的平滑三次贝塞尔缓动曲线 `cubic-bezier(0.4, 0.0, 0.2, 1.0)`。

---

### 4.2 调整方法 A：HUD 可视化实时调镜 (推荐 · 所见即所得)

无需手动猜测数值，可以在浏览器中边看边调：

1. **唤起标定工具**：直接点击底部控制栏右侧的 **“🎯 标定助手”** 按钮，或按下键盘快捷键 **`Ctrl + Shift + D`**（Mac 上为 `Cmd + Shift + D`）；
2. **滚轮缩放 (Zoom)**：滑动鼠标滚轮，实时无级微调镜头的放大倍率（页面会自动弹出提示，如 `🔍 缩放: 1.42x`）；
3. **Shift+拖拽平移 (Pan)**：按住键盘 `Shift` 键并在画面上按住鼠标左键拖动，将需要展示的模块拖动到舞台视觉中心；
4. **一键捕获配置**：调整到最完美的视角后，点击右下角 HUD 面板中的 **“📷 捕获镜头”** 按钮；
5. **粘贴保存**：系统已将捕获好的 JSON（如 `{"zoom": 1.42, "x": -11, "y": 6, "duration": 1.2}`）**写入剪贴板**，直接粘贴覆盖到 `config.json` 对应场景的 `camera` 字段即可！

---

### 4.3 调整方法 B：直接修改 JSON 配置文件 (精准数值控制)

打开对应的 `config.json` 文件（如 `examples/luxehms/config.json`）：
1. 找到对应的场景 ID（例如 `scene-1`）；
2. 修改 `camera` 中的数值：
   * 如果觉得**“太大了、局促”**：把 `zoom: 1.75` 改小到 `zoom: 1.42`；
   * 如果觉得**“偏左了”**：适当减小 `x` 的正数值或增加负数值；
   * 如果觉得**“偏上了”**：适当减小 `y` 的正数值；
3. 保存文件后，Vite 开发服务器会**自动热更新页面**，无需手动刷新即可立即看到最新运镜效果。

---

### 4.4 镜头取景最佳实践与经验参考值

| 场景类型 | 推荐 Zoom | 推荐 X 偏移 | 推荐 Y 偏移 | 适用视觉目标 |
| :--- | :--- | :--- | :--- | :--- |
| **全局总览 / 归位** | `1.0` | `0` | `0` | 展示系统整体架构与所有分层边界 |
| **中右侧集群聚焦** | `1.35 ~ 1.45` | `-10 ~ -15` | `+4 ~ +8` | 如 Data & Persistence + Cron 调度 |
| **中左侧基础库聚焦** | `1.40 ~ 1.55` | `+18 ~ +24` | `+8 ~ +12` | 如 Auth & RBAC + Core Libraries |
| **单卡片内部徽章特写** | `1.80 ~ 2.20` | 按卡片中心反向计算 | 按卡片中心反向计算 | 如微服务内部某个具体模块细节 |

---

## 5. 高亮选框、流光连线与端点脉冲标定指南

在标定助手激活状态下（`Ctrl + Shift + D`），可以秒级提取卡片与连线配置：

### 5.1 鼠标拖拽拉框 (Drag-to-Box)
1. 鼠标在目标卡片上按住左键拖拽出一个矩形框；
2. 松开鼠标，画面自动生成发光虚线预览；
3. 点击右下角 **“📋 复制选框 JSON”**，剪贴板即可得到：
   ```json
   {
     "id": "box-gateway",
     "type": "rect",
     "x": 1664,
     "y": 628,
     "width": 883,
     "height": 200,
     "rx": 16
   }
   ```
4. 将其加入 `elements.boxes` 数组即可。

### 5.2 Alt+单击智能边缘吸附 (Pixel Snap)
1. 按住键盘 **`Alt`** 键（Mac 为 `Option` 键）；
2. 鼠标在卡片内部任意空白处**单点一下**；
3. 底层离屏 Canvas 会自动向 4 个方向投射光线，根据色差跃变自动吸附出卡片的精准边界并高亮框选，直接点击复制即可。

### 5.3 拓扑流光连线配置 (paths) 与 8 向锚点推导

在 FocusFlow 中配置跨模块连线时，**无需手工计算复杂的贝塞尔曲线坐标**，只需声明起点与终点锚点，引擎将自动推导出最优控制点：

```json
{
  "id": "line-folio-pg",        // 1. 唯一标识符 (推荐命名: 起点-终点)
  "from": "box-folio.right",     // 2. 起点: [boxId].[anchorName]
  "to": "box-postgres.left-top", // 3. 终点: [boxId].[anchorName]
  "d": "M 2547 1100 C...",      // 4. (可选) 手动指定的 SVG 路径，若无则引擎自动生成
  "style": {
    "stroke": "#38bdf8",         // 5. 线条颜色
    "strokeWidth": 5,            // 6. 线条粗细 (像素)
    "mode": "stream"             // 7. 动画模式: "stream" (跑马灯流动) 或 "draw" (单次生长)
  }
}
```

* **8 向标准吸附锚点列表**：
  * `left` / `left-center`（左侧中点）、`right` / `right-center`（右侧中点）；
  * `top` / `top-center`（顶部中点）、`bottom` / `bottom-center`（底部中点）；
  * `left-top`（左侧偏上 1/4 处）、`left-bottom`（左侧偏下 3/4 处）；
  * `right-top`（右侧偏上 1/4 处）、`right-bottom`（右侧偏下 3/4 处）。
* **两种连线动画模式深度对比与选型 (`mode: "stream"` vs `mode: "draw"`)**：

  FocusFlow 对连线提供了两种截然不同的动效模式，分别对应软件架构中的两类核心关系：

  | 对比维度 | `mode = "draw"` (单次顺滑生长绘制) | `mode = "stream"` (持续流动跑马灯) |
  | :--- | :--- | :--- |
  | **动画执行机制** | **仅在切入当前场景时生长绘制 1 次 (One-Shot)** | **持续不断向前奔涌流动 (无限循环)** |
  | **完成后的状态** | 绘制完成后**静止保留为一条清晰的实线连线**，绝不循环重画闪烁 | 虚线光斑持续位移滚动，动感强烈 |
  | **生命周期重置** | 当切换离开再切回该场景时，自动重新触发一次顺滑生长 | 场景激活期间始终保持匀速流光 |
  | **适用业务场景** | **静态拓扑依赖、分层引用、架构继承关系** | **实时数据流、MQ 消息队列、RPC 调用、网络流量** |
  | **典型示例** | Gateway 依赖 Auth 鉴权中间件、Service 依赖 Core 基础库 | Folio 收银交易实时落盘至 PostgreSQL、夜审守护进程数据同步 |

  > **💡 为什么 `"draw"` 模式不做循环重画？**  
  > 静态依赖关系只需在镜头推入该区域时“优雅地向观众交代一次其连接关系”即可。若不断循环擦除重画，会造成画面极度闪烁，分散观众对解说气泡的阅读注意力。

---

### 5.4 接口端点脉冲光斑配置 (dots)

`dots`（端点粒子）用于标识数据连线两端出入端口的微型物理接口，映射为带呼吸脉冲的 SVG `<circle>`：

```json
{
  "id": "dot-folio-out",     // 1. 唯一标识符 (推荐带语义: 模块名-出入方向)
  "cx": 2547,                // 2. 圆心 X 绝对坐标 (Center X，对应 5120x2880 画布)
  "cy": 1100,                // 3. 圆心 Y 绝对坐标 (Center Y)
  "r": 10,                   // 4. 圆点半径 (Radius，默认 10px 对应直径 20px)
  "style": {
    "fill": "#38bdf8",       // 5. 填充颜色 (与连线主题呼应)
    "glow": true             // 6. 是否启用 SVG 霓虹辉光滤镜 (Glow Filter)
  }
}
```

* **字段含义速查表**：
  | 字段名 | 类型 | 作用与几何含义 |
  | :--- | :--- | :--- |
  | **`id`** | `string` | 图元唯一标识符，在场景通过 `scenes[i].activeElements.dots: ["dot-folio-out"]` 点名激活。 |
  | **`cx` / `cy`** | `number` | 圆心绝对像素坐标。通常精确对齐卡片的锚点边界（例如 `box.x + box.width`）。 |
  | **`r`** | `number` | 圆点半径，默认 `10`（精致不抢戏的接口大小）。 |
  | **`style.fill`** | `string` | 主题色（如 `#38bdf8` 蓝色或 `#fbbf24` 黄色）。 |
  | **`style.glow`** | `boolean` | 为 `true` 时自动附加 `filter="url(#ff-glow)"` 高斯发光光晕。 |
* **动态呼吸机理**：当场景激活时，引擎赋予 `.active` 类，触发 `@keyframes ffDotPulse`（以 1.8s 为周期在 `scale(0.85)` 到 `scale(1.25)` 之间呼吸缩放并伴随 `drop-shadow` 阴影波动）。

---

### 5.5 paths（流线）与 dots（端点）的协同关系与运动机理

很多开发者容易混淆 `dot` 的呼吸与光点的位移轨迹，二者的协同分工如下：

```
 [ dot (原地指示灯) ] ─── 沿着 path 轨迹流动的流光粒子 ───➔ [ dot (原地指示灯) ]
 (cx:2547, cy:1100)       (由 path 的三次贝塞尔曲线决定)     (cx:3636, cy:760)
```

1. **`dot` 不需要单独配置运动轨迹**：它只固定在 `(cx, cy)` 点位，负责在接口处进行**原地呼吸与明暗脉冲**（如同物理插座上的状态指示灯）；
2. **沿着路线移动的轨迹由 `paths` 承载**：你在画面上看到的“光斑从 A 模块飞向 B 模块”，是 `paths`（`mode: "stream"`）沿着贝塞尔曲线通过 CSS 关键帧位移驱动的；
3. **几何精准对齐**：
   * `dot-folio-out` 的 `(cx, cy)` 刚好对齐 `box-folio.right`；
   * `line-folio-pg` 的起点刚好从 `dot-folio-out` 出发，终点刚好射入 `dot-pg-in-folio`，三者组合构成完整的“端点插座 + 数据流管线”工业级视觉效果。

---

### 5.6 标定助手双坐标系统与一键复制气泡 (Pixel & Percent)

为了解决“选框需要绝对像素（5120×2880）而气泡需要百分比定位（%）”的换算困扰，HUD 标定助手内置了**双坐标实时换算**与**气泡 JSON 一键提取**功能：

1. **双坐标实时指示**：鼠标在画布上移动时，HUD 悬浮面板同时显示：
   * `📐 像素: X: 1664px, Y: 950px`（对应 SVG 几何空间）
   * `📍 百分比: L: 32.5%, T: 33.0%`（对应 DOM Callout 浮层空间）
2. **一键复制气泡 JSON**：
   * 鼠标移动到你想放置解说卡片的位置，点击右下角 **“💬 复制气泡”** 按钮；
   * 系统自动将包含当前百分比点位的标准 Callout DSL 复制到剪贴板，直接粘贴进 `config.json`：
     ```json
     {
       "id": "co-7821",
       "position": { "left": "32.5%", "top": "33.0%" },
       "theme": "blue",
       "title": "模块标题 (Title)",
       "desc": "在此输入解说文本或功能特性..."
     }
     ```

---

## 6. 毛玻璃气泡阶梯弹入动效定制指南 (Callouts)

解说气泡的弹入效果可以从 **出场节奏 (JS)**、**物理弹跳手感与视觉质感 (CSS)** 以及 **内容与顺序 (JSON DSL)** 三个层面灵活定制：

### 6.1 调整弹入时序与出场节奏 (JS 调度器)
* **源码位置**：[`src/motion/animator.js`](file:///Users/xt/WebstormProjects/focusflow/src/motion/animator.js)
* **核心公式**：
  ```javascript
  // 阶梯延迟公式: T_delay = 基础延迟 (T_base) + 序号 * 递增间隔 (Δt)
  const delay = 0.45 + index * 0.25;
  ```
* **常见节奏调整**：
  * **快速连弹（紧凑节奏）**：改为 `const delay = 0.2 + index * 0.12;`（0.2s 启动，每个间隔 0.12s 快速连弹）；
  * **沉稳登场（镜头停稳后再弹）**：改为 `const delay = 1.0 + index * 0.35;`（1.0s 运镜结束后逐个展开）。

### 6.2 调整物理弹跳手感、滑入方向与毛玻璃质感 (CSS 样式)
* **源码位置**：[`src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/src/styles/focusflow.css)

```css
.ff-callout {
  /* 1. 初始隐藏态 (可修改出现方向与缩放比例) */
  opacity: 0;
  transform: translateY(12px) scale(0.96); /* 默认: 从下方 12px 处微缩放弹入 */
  
  /* 2. 动画时长与缓动曲线 (Spring 弹性手感) */
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  /* 3. 毛玻璃背景与视觉质感 */
  background: rgba(13, 20, 36, 0.88);     /* 深色半透明底色 */
  backdrop-filter: blur(12px);            /* 毛玻璃模糊半径 (建议 8px ~ 20px) */
  border: 1px solid rgba(255, 255, 255, 0.12); /* 边框高光 */
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6),
              0 0 15px rgba(56, 189, 248, 0.1); /* 投影与边缘外发光 */
}

/* 4. 激活呈现态 */
.ff-callout.active {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

* **变体 A：更强烈的 Q 弹果冻感 (Bouncy Spring)**：
  ```css
  /* 产生轻微回弹超调效果 */
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
  ```
* **变体 B：从左侧横向滑入 (Slide from Left)**：
  ```css
  .ff-callout {
    opacity: 0;
    transform: translateX(-24px) scale(0.95);
  }
  .ff-callout.active {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  ```
* **变体 C：通透高亮轻拟态 (Frosted Glass 增强)**：
  ```css
  .ff-callout {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
  ```

### 6.3 调整气泡内容、位置、色彩主题与先后顺序 (JSON DSL)
在 `config.json` 中直接编辑 `callouts` 数组：
```json
{
  "callouts": [
    {
      "id": "co-folio",
      "position": { "left": "33%", "top": "33%" },  // 📍 气泡在画布上的百分比位置
      "theme": "blue",                              // 🎨 主题色徽章: "blue" | "pink" | "green" | "amber"
      "title": "Folio & Cashier",                   // 🏷️ 顶部高亮徽章标题
      "desc": "Double-entry ledger · Shift balance"  // 📝 正文说明文本
    }
  ]
}
```
* **出场先后顺序**：气泡弹入的先后顺序严格按照 `callouts` 数组中的前后顺序（第 1 个 ➔ 第 2 个 ➔ 第 3 个）。调换数组中的元素顺序即可改变出场顺序。

---

### 6.4 为什么 Callout 定义中没有 width 和 height（内容自适应设计哲学）

在 DSL 中**坚决不写死 `width` 和 `height`**，是现代前端与图形学排版中深思熟虑的设计原则（**内容流自适应 / Intrinsic Sizing**）：

```
+-----------------------------------------------------------------------------------+
|                        为什么 Callout 采用“内容驱动自适应”？                        |
+-----------------------------------------+-----------------------------------------+
| ❌ 如果写死固定 width / height           | ✅ 当前方案：CSS 内容流自适应 (Intrinsic)   |
+-----------------------------------------+-----------------------------------------+
| • 文字多时：内容溢出、被截断（文字被遮挡）  | • 高度完全由文字字数自然撑开，严丝合缝  |
| • 文字少时：留出大片难看的空白色块 (死区)   | • 无论是一句话还是多行，永远紧凑精致    |
| • 国际化换语言（中/英）时必然版面崩溃     | • 配合 max-width: 320px 保证不遮挡底图  |
| • 高分辨率与不同缩放设备下文字换行错位    | • 浏览器排版引擎自动负责最佳断行与留白  |
+-----------------------------------------+-----------------------------------------+
```

#### 底层保护机制：
1. **宽度上限保护**：CSS 设置了 `max-width: 320px`，超过上限自动优雅折行，绝不会无限拉伸遮挡架构图；
2. **高度流式计算**：`height: auto` 搭配 `padding: 10px 16px`，卡片高度由标题与描述文字字数自然撑开；
3. **创作者心智解脱**：创作者只需指定**“锚定在哪个位置（left / top）”**和**“要表达什么内容（title / desc）”**，复杂的排版自适应工作全部由渲染器自动完成。

---

### 6.5 标题框徽章配色规范与自定义扩展 (theme)

气泡顶部的标题框（Badge 徽章）配色是通过 **JSON DSL 中的 `theme` 字段 ➔ CSS 预设调色板** 进行映射驱动的：

```json
{
  "id": "co-folio",
  "position": { "left": "33%", "top": "24%" },
  "theme": "blue",         // 🎨 声明标题配色: "blue" | "green" | "amber" | "pink"
  "title": "Folio & Cashier",
  "desc": "Double-entry ledger · Shift balance"
}
```

#### 1. 内置 4 大预设调色板（暗色模式工业设计规范）
源码位于 [`src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/src/styles/focusflow.css#L223-L239)，遵循 **“20% 半透底色 + 100% 高亮文字 + 40% 同色半透描边”** 的设计范式：

| `theme` 名称 | 视觉意向与适用模块 | CSS 底层配色规则 |
| :--- | :--- | :--- |
| **`"blue"`** (天青蓝) | 核心业务、基础架构、金融账务 | `background: rgba(56, 189, 248, 0.2);`<br/>`color: #38bdf8;`<br/>`border: 1px solid rgba(56, 189, 248, 0.4);` |
| **`"green"`** (翡翠绿) | 数据库、持久化集群、健康服务 | `background: rgba(52, 211, 153, 0.2);`<br/>`color: #34d399;`<br/>`border: 1px solid rgba(52, 211, 153, 0.4);` |
| **`"amber"`** (琥珀黄) | 定时任务、夜审守护进程、缓存集群 | `background: rgba(251, 191, 36, 0.2);`<br/>`color: #fbbf24;`<br/>`border: 1px solid rgba(251, 191, 36, 0.4);` |
| **`"pink"`** (霓虹粉) | 鉴权中心、CASL 权限、安全拦截 | `background: rgba(244, 114, 182, 0.2);`<br/>`color: #f472b6;`<br/>`border: 1px solid rgba(244, 114, 182, 0.4);` |

#### 2. 如何扩展新的自定义配色？（如紫色 Purple / 红色 Red）
只需在 [`src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/src/styles/focusflow.css) 中追加对应的 CSS 类即可：

```css
/* 自定义紫色 (如: 外部三方服务 / AI 模块) */
.ff-badge.purple {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.4);
}

/* 自定义红色 (如: 告警 / 容灾降级) */
.ff-badge.red {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
}
```
保存后，在 `config.json` 中直接写 `"theme": "purple"` 或 `"theme": "red"` 即可直接生效！

---

## 7. 快捷键一览与常见问题 (FAQ)

### 7.1 全局快捷键速查表

| 按键 | 功能 | 说明 |
| :--- | :--- | :--- |
| **`→` / `Space`** | 下一个场景 | 平滑运镜过渡到下个步骤 |
| **`←`** | 上一个场景 | 返回上一步骤 |
| **`P`** | 自动轮播切换 | 开始 / 暂停定时自动循环播放 |
| **`Home`** | 跳转到首页 | 瞬间或平滑回到第 1 个总览场景 |
| **`End`** | 跳转到末页 | 快速进入最后总结场景 |
| **`Ctrl + Shift + D`** | 唤起/关闭标定助手 | 开发者取坐标、调镜头、抓取选框调试工具 |
| **`ESC`** | 关闭标定助手 | 退出调试状态，回到纯净演示模式 |

---

### 7.2 常见问题排查 (FAQ)

#### Q1：更换底图后，图片显示破损或无法加载？
* **排查**：确认 `config.json` 中的 `"asset": { "url": "./xxx.png" }` 路径与文件名正确无误。
* **原因**：如果在跨目录调用时，请确保给 `FocusFlowPlayer` 传入了正确的 `basePath` 参数（如 `basePath: './examples/luxehms/'`）。

#### Q2：为什么我在浏览器里点击 Alt+单击 无法吸附边缘？
* **排查**：若图片来自外部第三方域名（如 `https://external.com/img.png`），浏览器 Canvas 会因同源安全策略（CORS）禁止读取像素数据。
* **解决**：建议将图片保存在本地项目目录中，以本地相对路径加载。

#### Q3：如何生成 100% 独立的离线单文件 HTML（双击即开，零依赖）？
* **一键打包命令**：
  ```bash
  # 默认打包 examples/overlay-demo
  pnpm build:standalone

  # 或指定任意示例目录与输出路径
  node scripts/build-standalone.js examples/overlay-demo dist/overlay-demo-standalone.html
  node scripts/build-standalone.js examples/luxehms dist/luxehms-standalone.html
  ```
* **打包机理**：打包脚本会自动将 **CSS 样式表**、**JS 核心播放器引擎**、**JSON DSL 配置** 以及 **所有图片资源（自动转 Base64 内联）** 压入单个 `.html` 文件中。
* **运行方式**：生成的单文件大小约几 MB，**无需 Node 环境、无需本地 Web 服务器、无需联网**，直接双击或通过邮件/U 盘发给任何人即可在 Chrome/Safari/Edge/Firefox 中秒级播放！
