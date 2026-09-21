<p align="right">
  <strong>English</strong> • <a href="./11_JITTER_ANALYSIS_AND_SOLUTIONS.zh-CN.md">简体中文</a>
</p>

# FocusFlow 4-Layer Anti-Jitter Architecture & Root Cause Engineering Analysis
## Subpixel Rasterization, State Decoupling, GPU Compositor Shimmering Suppression, and Deep Zoom (<24%) Stabilization

| Metadata | Description |
| :--- | :--- |
| **Specification Version** | `3.1.0` (Complete Pan-Zoom Stabilization Master Edition) |
| **Last Updated** | `2026-09-04` |
| **Module Scope** | `@focusflow/player`, `@focusflow/studio` (`CameraFrustumFrame`, `InfiniteCanvas`, `RightInspector`, `CanvasOverlay`, `useCanvasGesture`) |
| **Core Topics** | React State Leakage, Player Lifecycle Decoupling, 5K Ultra-Wide Canvases, Retina Displays, Subpixel Grids, GPU 0fps Freezing, Quantization Step Elimination (<24%), Screen-Space Viewport Outlines, World Anchor Invariants |

---

## 📑 Table of Contents

- [1. Architectural Overview & The 4-Layer Defense Model](#1-architectural-overview--the-4-layer-defense-model)
- [2. Layer 1: Application Data & State Flow (React State Decoupling)](#2-layer-1-application-data--state-flow-react-state-decoupling)
  - [2.1 High-Frequency Hover Stream: coordinateBus Pattern](#21-high-frequency-hover-stream-coordinatebus-pattern)
  - [2.2 Canvas Transform Matrix Decoupling: canvasTransformRef Pattern](#22-canvas-transform-matrix-decoupling-canvastransformref-pattern)
- [3. Layer 2: Player Lifecycle & Incremental Synchronization](#3-layer-2-player-lifecycle--incremental-synchronization)
  - [3.1 The Destruction Flaw of Naive Rebuilds](#31-the-destruction-flaw-of-naive-rebuilds)
  - [3.2 Singleton Pattern & Incremental Hot-Updates (updateDSL)](#32-singleton-pattern--incremental-hot-updates-updatedsl)
- [4. Layer 3: Visual Geometry & GPU Compositor Layer](#4-layer-3-visual-geometry--gpu-compositor-layer)
  - [4.1 Mathematical Characteristics of Macro Scenarios](#41-mathematical-characteristics-of-macro-scenarios)
  - [4.2 Subpixel Resonant Repaint Mechanics at 60fps](#42-subpixel-resonant-repaint-mechanics-at-60fps)
  - [4.3 Layer 3 Engineering Solutions](#43-layer-3-engineering-solutions)
- [5. Layer 4: Deep Zoom (<24%) Quantization & Dark High-Contrast Shimmering](#5-layer-4-deep-zoom-24-quantization--dark-high-contrast-shimmering)
  - [5.1 Symptoms & Root Causes](#51-symptoms--root-causes)
  - [5.2 Math.round Integer Truncation Amplification](#52-mathround-integer-truncation-amplification)
  - [5.3 Layer 4 Engineering Solutions](#53-layer-4-engineering-solutions)
- [6. Continuous Zoom Shimmering Case Studies & Mechanics](#6-continuous-zoom-shimmering-case-studies--mechanics)
  - [6.1 World Coordinate Anchor Invariant Formulation](#61-world-coordinate-anchor-invariant-formulation)
  - [6.2 Elimination of Degenerate In-Content Handles](#62-elimination-of-degenerate-in-content-handles)
  - [6.3 Screen-Space Viewport Outline Isolation](#63-screen-space-viewport-outline-isolation)
- [7. Benchmark Verification Matrix](#7-benchmark-verification-matrix)
- [8. Architectural Rules of Thumb](#8-architectural-rules-of-thumb)

---

## 1. Architectural Overview & The 4-Layer Defense Model

In FocusFlow, canvas "jitter" was never a singular defect. It was an aggregate of:
1. **React State Leaks** thrashing virtual DOM trees at 120Hz;
2. **Player Re-instantiation** tearing down underlying HTML5 `<img>` raster caches;
3. **Subpixel Grid Collisions** causing GPU antialiasing rasterizer thrashing at 60Hz;
4. **Coordinate Quantization Steps** when mathematical rounding errors are magnified by $\frac{1}{\text{scale}}$ at scales below 24%.

To enforce the standard of **"lightning response during interaction, 0fps dead stillness when idle, and buttery smoothness under deep zoom"**, the anti-jitter architecture was formalized into 4 defense layers:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     FocusFlow 4-Layer Anti-Jitter Architecture                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [Layer 1: React State & Data Flow]                                                    │
│   Pathology: Cursor hover coordinates and canvas transform matrices leaking into State │
│   Solution:  coordinateBus event-emitter + Ref memory caches; bypasses VDOM diffing    │
│                                           │                                            │
│                                           ▼                                            │
│  [Layer 2: Player Lifecycle & Sync]                                                    │
│   Pathology: Element mutations triggering full player destroy() and rebuild cycles     │
│   Solution:  Singleton player instance + incremental updateDSL() hot-updates           │
│                                           │                                            │
│                                           ▼                                            │
│  [Layer 3: GPU Compositor & Subpixel Geometry]                                         │
│   Pathology: 5K raster at 0.195 scale with 0.5px line collision + 60fps pulse repaints  │
│   Solution:  2px inset safe margin + 0fps static crosshair freeze + instant theme cut  │
│                                           │                                            │
│                                           ▼                                            │
│  [Layer 4: Deep Zoom (<24%) Quantization & Dark Mode Shimmering]                       │
│   Pathology: Math.round() creating 4~10px jump steps + dot matrix modulo cliff         │
│   Solution:  Floating-point subpixel GPU transforms (.toFixed(2)) + screen-space HUD   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1: Application Data & State Flow (React State Decoupling)

### 2.1 High-Frequency Hover Stream: `coordinateBus` Pattern
- **Pathology**: Moving a mouse across a 5K canvas triggers 60~120 `pointermove` events per second. Storing $\{x, y\}$ directly in React `useState` or Zustand forced all child components to re-render continuously, wasting CPU cycles and causing micro-stutters;
- **Solution (`coordinateBus.ts`)**: An off-state event bus publishes raw coordinates directly to DOM nodes:
  ```typescript
  // InfiniteCanvas emits without triggering React state updates:
  coordinateBus.emit({ x, y });
  ```
  The Inspector coordinates widget updates its `textContent` via DOM Ref directly, achieving **0 React re-renders and 0 VDOM diffs**.

### 2.2 Canvas Transform Matrix Decoupling: `canvasTransformRef` Pattern
- **Pathology**: Panning or pinching continuous floating-point matrices $\{scale, x, y\}$ caused top-level components to re-render on every frame;
- **Solution (`App.tsx`)**: The transform matrix is retained in a `canvasTransformRef` memory cache, applying transforms via GPU CSS properties (`translate3d + scale`). Business logic reads the ref on-demand when capturing viewports.

---

## 3. Layer 2: Player Lifecycle & Incremental Synchronization

### 3.1 The Destruction Flaw of Naive Rebuilds
Historically, modifying element properties in the Inspector changed the `dsl` reference, triggering `useEffect([dsl])` to call `player.destroy()` and `new FocusFlowPlayer(...)`. This unmounted the underlying image, cleared raster caches, and produced harsh white-screen flashing.

### 3.2 Singleton Pattern & Incremental Hot-Updates (`updateDSL`)
The player is now initialized once as a persistent singleton. All mutations are processed via fine-grained incremental APIs:
```javascript
// packages/player/src/core/player.js
updateDSL(newDSL) {
  this.dsl = newDSL;
  this.elementsMap = this.buildElementsMap(newDSL.elements || {});
  this.calloutsMap = this.buildCalloutsMap(newDSL.elements?.callouts || []);
  if (this.animator) {
    this.animator.elementsMap = this.elementsMap;
    this.animator.calloutsMap = this.calloutsMap;
  }
  this.clearElements();
  this.renderElements();
}
```
The underlying image maintains its GPU texture cache undisturbed, eliminating re-mounting flicker entirely.

---

## 4. Layer 3: Visual Geometry & GPU Compositor Layer

### 4.1 Mathematical Characteristics of Macro Scenarios
On 5K images (`5120 × 2880`), viewing the entire diagram in typical browser viewports forces the zoom down to **`scale = 0.1953125`**.
At full overview, the canvas height calculates to:
$$2880 \times 0.1953125 = 562.5\text{px}$$
The frame edge fell squarely onto a **`.5px` subpixel boundary**, and the 2px frame border measured only **0.39 physical pixels** on screen.

### 4.2 Subpixel Resonant Repaint Mechanics at 60fps
A pulsating crosshair (`animate-pulse`) in the center of the frame marked the entire 5K bounding box as dirty every frame. The GPU rasterizer continuously evaluated whether the 0.39px border was 0px or 1px, producing violent high-frequency visual twitching.

### 4.3 Layer 3 Engineering Solutions
1. **2px Inset Margin & Inset Shadows (`CameraFrustumFrame.tsx`)**: In full overview mode ($zoom \le 1.05$), the bounding box is inset by 2px, cleanly detaching it from container boundaries. Shadows are converted to `inset` shadows;
2. **0fps Static Crosshair Freeze**: Replaced animated crosshairs with a static SVG reticle. When the user stops interacting, repaint rates drop to **0 fps**;
3. **Instantaneous Theme Switching**: Removed `transition-colors duration-200` to prevent 12 frames of intermediate color interpolation shaking.

---

## 5. Layer 4: Deep Zoom (<24%) Quantization & Dark Mode Shimmering

### 5.1 Symptoms & Root Causes
When zooming out below 24% on dark-themed diagrams, intense jitter occurred.

### 5.2 `Math.round` Integer Truncation Amplification
`InfiniteCanvas.tsx` previously rounded transforms using `Math.round(transform.x)`.
Because screen movements are projected inversely into world space, rounding errors are magnified by $\frac{1}{\text{scale}}$:
$$\Delta_{\text{world}} = \frac{1}{\text{scale}}$$
- At $\text{scale} = 1.0$: $\Delta = 1\text{px}$;
- At $\text{scale} \le 0.24$: $\Delta \ge \frac{1}{0.24} \approx \mathbf{4.17 \sim 10\text{px}}$!
Every slight mouse tremor flipped coordinates across integer thresholds, jerking 5K images by 4 to 10 world pixels.

### 5.3 Layer 4 Engineering Solutions
1. **High-Precision Subpixel Transform**: Retained floating-point coordinates with `.toFixed(2)`, delegating subpixel blending to GPU bilinear interpolation;
2. **Safe Modulo for Background Dot Grids**: Enforced `((coord % size) + size) % size` to prevent negative coordinate snapping across zero axes;
3. **Inspector Layer List Pinning**: Pinned the element hierarchy list above palettes to prevent layout collapse.

---

## 6. Continuous Zoom Shimmering Case Studies & Mechanics

### 6.1 World Coordinate Anchor Invariant Formulation
During pinch or wheel gestures, deadband snapping introduced $C^0$ discontinuities. The target transform matrix must satisfy:
$$x = P_x - W_x \cdot s, \quad y = P_y - W_y \cdot s$$
locking the world coordinate anchor $W = (P_{x0} - x_0) / s_0$ continuously across every frame.

### 6.2 Elimination of Degenerate In-Content Handles
8px resize handles placed in 5K content space shrink to $8\text{px} \times 0.16 = 1.28\text{px}$ at 16% zoom. With a 1.5px stroke width, handles self-intersected and flickered. These were replaced with screen-space invariant vector geometry.

### 6.3 Screen-Space Viewport Outline Isolation
Canvas borders are rendered in screen space using real-time computed offsets (`left: transform.x, width: contentWidth * scale`) rather than inside content containers with `will-change: transform`, eliminating compositor rasterization collisions.

---

## 7. Benchmark Verification Matrix

| Verification Dimension | Trigger Condition | Pre-Remediation | Post-Remediation Result |
| :--- | :--- | :--- | :--- |
| **Continuous Zoom Stability** | Rapid pinch/wheel scaling | Corners and reticle vibrate | **Zero vibration, crisp static borders** |
| **Micro-Font Pan Stability** | Pan at 16% zoom | Text lines exhibit breathing shimmer | **Subpixel locked, rock-solid stability** |
| **Deep Zoom (<24%) Panning** | Pan at 10% zoom | 4~10px quantization jerks | **Smooth floating-point GPU interpolation** |
| **Dark High-Contrast Viewport** | Zoom on pitch-black background | Moire patterns and severe strobing | **Safe modulo math, zero moire flicker** |
| **Scene Initial Load** | Switch to Scene 1 (5K image) | Vibrate immediately at 60Hz | **0Hz stillness upon mount** |
| **System Window Switching** | Tab backgrounding and foregrounding | Intermittent throttling jumps | **Seamless transition, zero frame drops** |
| **Cursor Canvas Hover** | Fast mouse movements across 5K canvas | Inspector re-renders continuously | **0 re-renders, direct DOM updates** |
| **Element Live Editing** | Edit elements in RightInspector | White screen reload flicker | **Incremental hot-update, zero flicker** |

---

## 8. Architectural Rules of Thumb

1. **High-Frequency Events Never Enter React State**: Wheel and pointermove events exceeding 10Hz must use Refs or EventBus DOM updates;
2. **Core Engine Decoupling**: Graphics runtimes must expose `updateDSL()` incremental sync rather than being torn down and rebuilt in `useEffect`;
3. **0fps Idle Rule**: Macro viewports must freeze completely when user input ceases (no infinite pulse animations);
4. **No `Math.round` on Scaled Transforms**: Coordinate rounding errors explode by $\frac{1}{\text{scale}}$ under deep zoom; keep subpixel floats;
5. **Non-Scaling SVG Strokes for Viewports**: Use `vector-effect="non-scaling-stroke"` to lock screen-space pixel line widths across all zoom scales.
