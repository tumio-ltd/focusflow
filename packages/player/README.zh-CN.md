# @focusflow/player

> [English](./README.md) | 中文

**FocusFlow Player Engine** 是一个面向云原生架构演讲、系统设计推演与技术深度拆解的高性能、零依赖交互式演播内核。

播放器以标准声明式 JSON DSL（`@focusflow/dsl`）为唯一定义驱动，在所有现代桌面与移动端浏览器中实现 60FPS 电影级摄像机运镜推演、SVG 霓虹流动路径、矢量框选高亮与上下文气泡卡片编排。

---

## 🌟 核心特性

- **零运行时依赖（0-Dependency）**：纯原生 Vanilla JavaScript 实现，无任何前端框架与打包工具捆绑负担。
- **双模态产物分发**：
  - **ES Module**（`@focusflow/player`）：无缝集成至 React、Vue、Svelte 或 Next.js 现代化前端应用中。
  - **Standalone IIFE**（`dist/focusflow.iife.js`）：单文件独立脱机嵌入，支持离线自包含 HTML 交付。
- **60FPS GPU 摄像机动力学**：基于硬件加速 CSS 3D 矩阵插值，具备平滑的三次方贝塞尔缓动与多比例视口安全约束。
- **分步交错矢量动效管线**：基于周长闭环的 `stroke-dashoffset` 路径生长、霓虹发光滤镜与动态流速流向。
- **原生全功能控制浮岛（PlaybackIsland）**：内置完整态（Full）、微缩态（Minimal）与沉浸禅道态（Zen）三态自适应 HUD 控制栏。

---

## 📦 安装

```bash
npm install @focusflow/player
# 或使用 pnpm
pnpm add @focusflow/player
```

---

## 🚀 快速上手

### 1. 现代化 Web 应用集成 (ESM)

```javascript
import { FocusFlowPlayer } from '@focusflow/player';
import '@focusflow/player/styles.css';

const container = document.getElementById('player-container');
const dsl = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '高可用微服务演进拓扑',
    viewport: { width: 3840, height: 2160, aspectRatio: '16:9' },
  },
  asset: { url: '/path/to/architecture.svg' },
  elements: {
    boxes: [
      { id: 'box-gw', x: 400, y: 600, width: 600, height: 380, rx: 16 }
    ],
    paths: [
      { id: 'path-1', from: 'box-gw.right', to: 'box-order.left' }
    ]
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 网关集群接入',
      camera: { zoom: 1.2, x: 0, y: 0 },
      activeElements: { boxes: ['box-gw'], paths: ['path-1'] }
    }
  ]
};

const player = new FocusFlowPlayer({
  container,
  dsl,
  autoplay: false,
  showControls: true
});
```

### 2. 脱机单文件独立 HTML 嵌入 (IIFE)

```html
<link rel="stylesheet" href="./node_modules/@focusflow/player/styles.css" />
<div id="player-container" style="width: 100vw; height: 100vh;"></div>

<script src="./node_modules/@focusflow/player/dist/focusflow.iife.js"></script>
<script>
  const player = new FocusFlow.FocusFlowPlayer({
    container: document.getElementById('player-container'),
    dsl: /* 您的 DSL JSON 配置 */,
    autoplay: true,
  });
</script>
```

---

## 📐 架构体系：三层视觉视口栈

FocusFlow Player 在硬锁 16:9 目标画幅的视口容器中挂载严格校准的三层 DOM 视觉栈：

```
.focusflow-viewport (硬锁目标成片画幅比)
 └── .focusflow-wrap (摄像机矩阵变换: scale() translate())
      ├── Layer 0: .focusflow-img           (底层架构蓝图底图)
      ├── Layer 0.5: .focusflow-overlay-img (动态放大与深度探索插图)
      ├── Layer 1: .focusflow-svg           (SVG 矢量路径与框选层)
      └── Layer 2: .focusflow-callout-layer (富文本排版浮动气泡卡片)
```

---

## 🛡️ 视口权威与跨浏览器加固机制

### 1. 唯一真理源法则（DSL Viewport Single Source of Truth）
所有高亮选框、飞线路径和运镜焦点的绝对几何坐标（`x, y, width, height`），均严格基于 `dsl.meta.viewport` 中声明的标称画幅（如 $3840 \times 2160$）进行测绘。

* **显式视口不可篡改（Explicit Viewport Immutability）**：只要 DSL 中明确声明了 `meta.viewport.width` 与 `height`，播放器将绝对锁定 `svgEl.viewBox` 和内部测量引擎，禁止任何外部环境改写。
* **兜底自愈机制（`calibrateSelf`）**：仅当 DSL 完全缺失尺寸配置（未标定的历史工程）时，内核才会尝试读取 `img.naturalWidth / naturalHeight` 作为最后的兜底推测。

### 2. Safari (WebKit) 内嵌 Base64 SVG 深度兼容加固
在 Safari (WebKit) 浏览器中，当通过 `<img>` 标签加载内联 `data:image/svg+xml;base64` 矢量底图时，WebKit 的异步光栅化管线极易触发默认尺寸回退，将 `img.naturalWidth` 误报为当前屏幕 CSS 视口宽度（如 2600px 左右）。

为杜绝 Safari 平台上的坐标畸变，内核实施了三重深度加固：
1. **显式视口守卫（Explicit Viewport Guard）**：只要 DSL 显式声明了分辨率，彻底屏蔽 `calibrateSelf()` 的重写行为，阻断 `viewBox` 被篡改导致的横向 $1.47\times$ 放大与右移漂移。
2. **纯净 SVG 几何图元（Clean SVG Primitives）**：从 `.ff-box` 与 `.ff-path` 样式中移除了冗余的 `-webkit-transform: translate3d(0, 0, 0)`，使矢量图元严格由原生 SVG 几何管线绘制，消除 WebKit 在复合图层原点计算上的偏差。
3. **复合图层合成隔离（Compositing Isolation）**：给 `.focusflow-svg` 注入 `isolation: isolate` 与 `overflow: hidden`，保障高分 Retina 屏上的亚像素抗锯齿与滤镜稳定性。

---

## 🎮 播放器 API 指南

### 核心方法
- `player.play()`：开始播放。
- `player.pause()`：暂停播放。
- `player.togglePlay()`：切换播放/暂停状态。
- `player.next()`：推进至下一幕场景。
- `player.prev()`：回退至上一幕场景。
- `player.goToStep(index, animate = true)`：精准跳转到指定场景分幕。
- `player.setHudMode('full' | 'minimal' | 'zen')`：切换控制浮岛 HUD 展现模式。
- `player.destroy()`：卸载全局监听、注销 ResizeObserver 并释放媒体资源。

### 事件订阅
```javascript
player.on('sceneChange', ({ sceneIndex, scene, duration }) => {
  console.log(`当前场景: ${scene.title}`);
});

player.on('playStateChange', (isPlaying) => {
  console.log(`播放状态: ${isPlaying ? '播放中' : '已暂停'}`);
});

player.on('ended', () => {
  console.log('演播推演已圆满结束');
});
```

---

## 📄 开源协议

MIT © [Tumio Soft Technology Co., Ltd. (途铭软件科技)](https://github.com/tumio-ltd) 与 FocusFlow 贡献者
