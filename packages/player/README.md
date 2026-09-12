# @focusflow/player

> English | [中文](./README.zh-CN.md)

**FocusFlow Player Engine** is a high-performance, 0-dependency interactive presentation player designed for cloud architecture storytelling, system design walkthroughs, and technical deep-dives.

Driven by standard declarative JSON DSL (`@focusflow/dsl`), the player orchestrates 60fps cinematic camera kinematics, SVG neon flowpaths, vector bounding highlights, and contextual callout cards across all modern desktop and mobile browsers.

---

## 🌟 Key Capabilities

- **Zero Runtime Dependencies**: Pure vanilla JavaScript runtime; zero bundler or framework baggage.
- **Dual Distribution**:
  - **ES Module** (`@focusflow/player`): Seamless integration into React, Vue, Svelte, or Next.js applications.
  - **Standalone IIFE** (`dist/focusflow.iife.js`): Single-file self-contained embedding for offline standalone HTML deliveries.
- **60fps GPU Camera Kinematics**: Hardware-accelerated CSS 3D matrix pan-and-zoom with cubic-bezier smoothing.
- **Staggered Vector Pipeline**: Perimeter-based `stroke-dashoffset` path-drawing, neon glowing filters, and dynamic flow speeds.
- **Unified Playback Island**: Native, responsive control bar with full, minimal, and zen immersive HUD modes.

---

## 📦 Installation

```bash
npm install @focusflow/player
# or with pnpm
pnpm add @focusflow/player
```

---

## 🚀 Quick Start

### 1. Modern Web Application (ESM)

```javascript
import { FocusFlowPlayer } from '@focusflow/player';
import '@focusflow/player/styles.css';

const container = document.getElementById('player-container');
const dsl = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: 'High-Availability Microservices Topology',
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
      title: '01 Gateway Ingress',
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

### 2. Standalone HTML Embedding (IIFE)

```html
<link rel="stylesheet" href="./node_modules/@focusflow/player/styles.css" />
<div id="player-container" style="width: 100vw; height: 100vh;"></div>

<script src="./node_modules/@focusflow/player/dist/focusflow.iife.js"></script>
<script>
  const player = new FocusFlow.FocusFlowPlayer({
    container: document.getElementById('player-container'),
    dsl: /* your DSL JSON */,
    autoplay: true,
  });
</script>
```

---

## 📐 Architecture: 3-Layer Visual Stack

FocusFlow Player mounts a strictly calibrated 3-layer DOM stack inside a locked 16:9 / target-ratio viewport container:

```
.focusflow-viewport (Aspect Ratio Clamped)
 └── .focusflow-wrap (Camera Matrix: scale() translate())
      ├── Layer 0: .focusflow-img           (Base Blueprint Graphic)
      ├── Layer 0.5: .focusflow-overlay-img (Dynamic Deep-dive Overlays)
      ├── Layer 1: .focusflow-svg           (SVG Vector Motion & Boxes)
      └── Layer 2: .focusflow-callout-layer (Floating Typography Cards)
```

---

## 🛡️ Viewport Authority & Cross-Browser Hardening

### 1. Single Source of Truth Principle (DSL Viewport Law)
All spatial coordinates (`x, y, width, height`) for highlight boxes, paths, and camera targets are defined strictly relative to the nominal canvas size declared in `dsl.meta.viewport` (e.g., $3840 \times 2160$).

* **Explicit Viewport Immutability**: If `meta.viewport.width` and `height` are explicitly specified in the DSL, the player strictly locks `svgEl.viewBox` and internal coordinate calculators to this authoritative size.
* **Fallback Self-Healing (`calibrateSelf`)**: Only when the DSL completely lacks explicit dimensions (legacy/uncalibrated configs) will the engine attempt to probe `img.naturalWidth / naturalHeight` as a fallback.

### 2. Safari (WebKit) Base64 SVG Hardening
In Safari (WebKit), rasterizing embedded `data:image/svg+xml;base64` graphics inside an `<img>` tag can trigger asynchronous layout fallback where `img.naturalWidth` erroneously reports host viewport dimensions (e.g. 2600px) instead of the 4K blueprint dimensions.

To prevent coordinate distortion in Safari:
1. **Explicit Viewport Guard**: `calibrateSelf()` is strictly disabled when the DSL provides an explicit viewport, preventing WebKit from overwriting the SVG `viewBox` and stretching `<rect>` elements horizontally by 1.47x.
2. **Clean SVG Primitives**: 3D CSS transforms (`translate3d(0, 0, 0)`) are excluded from SVG child primitives (`.ff-box`, `.ff-path`), preventing WebKit compositing layer origin matrix discrepancies.
3. **Compositing Layer Isolation**: `.focusflow-svg` is configured with `isolation: isolate` and `overflow: hidden` to ensure reliable sub-pixel rasterization across high-DPI Retina screens.

---

## 🎮 Player API Reference

### Methods
- `player.play()`: Start playback.
- `player.pause()`: Pause playback.
- `player.togglePlay()`: Toggle play/pause state.
- `player.next()`: Advance to next scene step.
- `player.prev()`: Return to previous scene step.
- `player.goToStep(index, animate = true)`: Jump to a specific scene index.
- `player.setHudMode('full' | 'minimal' | 'zen')`: Switch playback island HUD display mode.
- `player.destroy()`: Tear down event listeners, ResizeObservers, and release media resources.

### Events
```javascript
player.on('sceneChange', ({ sceneIndex, scene, duration }) => {
  console.log(`Current Scene: ${scene.title}`);
});

player.on('playStateChange', (isPlaying) => {
  console.log(`Playback state: ${isPlaying ? 'playing' : 'paused'}`);
});

player.on('ended', () => {
  console.log('Presentation finished.');
});
```

---

## 📄 License

MIT © [Tumio Soft Technology Co., Ltd.](https://github.com/tumio-ltd) & FocusFlow Contributors
