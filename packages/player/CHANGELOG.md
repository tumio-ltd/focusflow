# @focusflow/player Changelog

## 1.0.1 (2026-09-12)

### Bug Fixes & Cross-Browser Hardening

- **Safari (WebKit) Viewport Immutability Guard (Safari 视口不可篡改守卫)**:
  - Fixed a critical coordinate distortion and horizontal stretch bug in Safari (WebKit) where asynchronous `img.naturalWidth` fallback on embedded Base64 SVGs triggered `calibrateSelf()` and erroneously overwrote `svg.viewBox`, causing severe rightward drift (~500px+) and 1.47x width stretching on `<rect class="ff-box">` primitives.
  - Enforced the DSL viewport specification (`meta.viewport.width/height`) as the **Single Source of Truth**; `calibrateSelf()` now strictly skips mutating `viewBox` when an explicit viewport is declared.
- **Clean SVG Primitives (清理 SVG 图元硬件加速变换)**:
  - Removed redundant `-webkit-transform: translate3d(0, 0, 0)` from `.ff-box` in `focusflow.css`, allowing SVG elements to render strictly within the native SVG vector pipeline and preventing WebKit composite layer origin matrix discrepancies.
- **WebKit Compositing Isolation (图层合成隔离)**:
  - Hardened `.focusflow-svg` with `isolation: isolate` and clean `#ff-glow` Gaussian blur filter nodes to eliminate WebKit render-tree boundary jitter.

## 1.0.0 (2026-09-09)

### Features

- Initial release of FocusFlow lightweight embedding player (ES Module & IIFE standalone distribution)
- 60fps hardware-accelerated camera transitions with Matrix3D perspective interpolation
- Staggered SVG vector animation pipeline with neon glow filters and cubic Bezier flowing marquee
- Built-in standalone playback controls island and responsive screen-fit calibration
- Zero external runtime dependencies, full offline execution support
