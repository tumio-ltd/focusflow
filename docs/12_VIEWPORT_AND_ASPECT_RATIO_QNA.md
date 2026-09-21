<p align="right">
  <strong>English</strong> • <a href="./12_VIEWPORT_AND_ASPECT_RATIO_QNA.zh-CN.md">简体中文</a>
</p>

# FocusFlow Coordinates Pipeline, SVG viewBox, and Aspect Ratio Technical Q&A
## Deep-Dive Reference on Multi-Stage Viewport Mapping, Safari WebKit Rendering Nuances, and Cross-Platform WYSIWYG Parity

| Metadata | Description |
| :--- | :--- |
| **Specification Version** | `1.2.0` |
| **Last Updated** | `2026-09-12` |
| **Associated Documents** | [`design/02_ELEMENTS_DESIGN_AND_ARCHITECTURE.md`](../design/02_ELEMENTS_DESIGN_AND_ARCHITECTURE.md), [`design/14_STAGE_MATCH_WYSIWYG_ENGINEERING_SPEC.md`](../design/14_STAGE_MATCH_WYSIWYG_ENGINEERING_SPEC.md) |
| **Target Audience** | Graphics Engineers, Browser Engine Specialists, Frontend Architects |

---

## 📑 Table of Contents

- [Q1: Is SVG viewBox="0 0 3840 2160" the native canvas resolution? Derived from base image?](#q1-is-svg-viewbox0-0-3840-2160-the-native-canvas-resolution-derived-from-base-image)
- [Q2: What does "3840x2160" signify in the Level 2 viewport container?](#q2-what-does-3840x2160-signify-in-the-level-2-viewport-container)
- [Q3: What does the 16:9 aspect ratio dictate across authoring and playback?](#q3-what-does-the-169-aspect-ratio-dictate-across-authoring-and-playback)
- [Q4: Is aspectRatio the camera frustum ratio? Does it bound what audiences see from scene 1?](#q4-is-aspectratio-the-camera-frustum-ratio-does-it-bound-what-audiences-see-from-scene-1)
- [Q5: How does coordinate projection map from absolute diagram space to camera space?](#q5-how-does-coordinate-projection-map-from-absolute-diagram-space-to-camera-space)
- [Q6: How does the runtime coordinates pipeline compare to Phase 1 MVP origins?](#q6-how-does-the-runtime-coordinates-pipeline-compare-to-phase-1-mvp-origins)
- [Q7: Why interpolate transforms from camera center rather than top-left origin?](#q7-why-interpolate-transforms-from-camera-center-rather-than-top-left-origin)
- [Q8: Can element bounding box positions diverge between authoring and HTML export?](#q8-can-element-bounding-box-positions-diverge-between-authoring-and-html-export)
- [Q9: How is project config.json embedded inside exported standalone HTML?](#q9-how-is-project-configjson-embedded-inside-exported-standalone-html)
- [Q10: Structural differences between repository templates and cloned user projects](#q10-structural-differences-between-repository-templates-and-cloned-user-projects)
- [Q11: The architectural distinction between static templates and active projects](#q11-the-architectural-distinction-between-static-templates-and-active-projects)
- [Q12: Why did exported HTML render perfectly in Chrome but drift horizontally in Safari?](#q12-why-did-exported-html-render-perfectly-in-chrome-but-drift-horizontally-in-safari)
- [Q13: Deep dive into WebKit SVG intrinsic dimension computation anomalies](#q13-deep-dive-into-webkit-svg-intrinsic-dimension-computation-anomalies)
- [Q14: Purpose, triggers, and execution lifecycle of calibrateSelf()](#q14-purpose-triggers-and-execution-lifecycle-of-calibrateself)
- [Q15: Does WebKit preserve raster image dimensions reliably compared to SVG assets?](#q15-does-webkit-preserve-raster-image-dimensions-reliably-compared-to-svg-assets)
- [Q16: Why trusting DSL viewport definitions over Safari heuristics is optimal](#q16-why-trusting-dsl-viewport-definitions-over-safari-heuristics-is-optimal)
- [Q17: End-to-end verification and cross-browser regression testing of the fix](#q17-end-to-end-verification-and-cross-browser-regression-testing-of-the-fix)
- [Master Pipeline Summary Matrix](#master-pipeline-summary-matrix)

---

## Q1: Is SVG viewBox="0 0 3840 2160" the native canvas resolution? Derived from base image?

**Yes, absolutely.**

1. `viewBox="0 0 3840 2160"` establishes the **world-space physical coordinate resolution**:
   - Origin $(0, 0)$ with width $3840\text{px}$ and height $2160\text{px}$ defines a lossless vector coordinate system;
   - All bounding boxes, Bezier paths, and pulse dots defined in DSL (e.g. `x: 400, y: 240, width: 600, height: 180`) map 1:1 onto this metric space;
   - Regardless of whether the outer display is an 8K television or a mobile device, geometric relationships inside the viewBox stay locked.

2. It is parsed directly from the base image's physical raster pixels (`naturalWidth` $\times$ `naturalHeight`):
   - During image import in Studio (`imageDecoder.ts`), images are decoded asynchronously and their natural dimensions are serialized into `dsl.meta.viewport`;
   - During Player initialization (`packages/player/src/core/player.js`), the runtime constructs `<svg viewBox="0 0 ${width} ${height}">` matching this baseline.

---

## Q2: What does "3840x2160" signify in the Level 2 viewport container?

It denotes the **native resolution of the base asset and master canvas ($W_{base} \times H_{base}$)**.

Because audience displays vary wildly (1080p 16:9, 2K 16:9, 21:9 ultrawide, 16:10 Retina laptops, vertical mobile viewports):
- **Level 2 Container (`.focusflow-viewport`)** calculates an aspect-ratio-locked window $(fitW, fitH, offsetX, offsetY)$ that fits the host screen without distortion;
- On a $3440 \times 1440$ ultrawide display, the 16:9 container calculates $fitW = 2560, fitH = 1440$, applying $440\text{px}$ pillarboxing on both sides to prevent horizontal spillover.

---

## Q3: What does the 16:9 aspect ratio dictate across authoring and playback?

`aspectRatio: '16:9'` is the **Single Source of Truth (SSOT)** for target presentation framing:
1. **Design Time**: Studio displays the green `CameraFrustumFrame` constrained to 16:9. Layout and annotation typography are designed specifically to optimize framing inside this boundary;
2. **Playback Time**: `updateStageLayout()` reads `aspectRatio` and enforces an exact 16:9 presentation envelope, ensuring identical composition between presenter and audience.

---

## Q4: Is aspectRatio the camera frustum ratio? Does it bound what audiences see from scene 1?

**Yes.** From the very first second of playback:
- The audience never observes unconstrained raw images. Everything is viewed through the cinematic frustum;
- When `zoom: 1.0` and `x: 0, y: 0`, the frustum encapsulates the full canvas (or maximum aspect-fitted area);
- When `zoom: 2.5`, the camera focuses into a high-detail close-up of a specific microservice cluster, while letterbox margins maintain a cinematic border.

---

## Q5: How does coordinate projection map from absolute diagram space to camera space?

FocusFlow converts world coordinates $(x_w, y_w)$ into presentation stage coordinates $(x_s, y_s)$ via inverse camera matrix transformations:

$$\begin{bmatrix} x_s \\ y_s \\ 1 \end{bmatrix} = \mathbf{T}_{\text{center}} \cdot \mathbf{S}(zoom) \cdot \mathbf{T}(-cameraX, -cameraY) \cdot \begin{bmatrix} x_w \\ y_w \\ 1 \end{bmatrix}$$

1. **Center Normalization**: Offsets world coordinates so the targeted region aligns with the optical center;
2. **Zoom Scaling**: Multiplies normalized offsets by camera zoom factor;
3. **Stage Repositioning**: Projects coordinates onto current viewport resolution ($fitW, fitH$).

---

## Q6: How does the runtime coordinates pipeline compare to Phase 1 MVP origins?

- **Phase 1 MVP**: Bounded transforms directly onto the image element using basic CSS transforms, lacking aspect-ratio letterboxing. Ultrawide monitors leaked adjacent nodes;
- **Phase 2 Architecture**: Introduced the 3-tier viewport pipeline:
  - Tier 1: SVG viewBox coordinate space;
  - Tier 2: Aspect-ratio locked presentation envelope (`.focusflow-viewport`);
  - Tier 3: GPU-composited stage with subpixel bilinear interpolation.

---

## Q7: Why interpolate transforms from camera center rather than top-left origin?

Centering camera pivots at $(50\%, 50\%)$ of the frustum guarantees:
1. Symmetrical zoom behavior: scaling in or out keeps the focus target stationary at the viewport center;
2. Mathematical parity with physical optical lenses, eliminating eccentric rotational torque when interpolating rotation or perspective angles.

---

## Q8: Can element bounding box positions diverge between authoring and HTML export?

**Under nominal conditions, no.**
Both authoring canvas and exported standalone HTML instantiate `@focusflow/player` using the identical mathematical engine.

*Historical Exception*: In early builds, WebKit (Safari) miscalculated SVG dimensions when images had asynchronous decoding latencies, causing an offset bug detailed in Q12.

---

## Q9: How is project config.json embedded inside exported standalone HTML?

`standalonePackager.ts` serializes the DSL structure into a JavaScript object literal inlined within a `<script>` tag:

```html
<script>
  window.__FOCUSFLOW_DSL__ = {
    meta: { ... },
    scenes: [ ... ],
    elements: { ... }
  };
</script>
```

Upon DOMContentLoaded, `new FocusFlowPlayer({ container: document.body, dsl: window.__FOCUSFLOW_DSL__ })` initializes instantly with 0 external network requests.

---

## Q10: Structural differences between repository templates and cloned user projects

- **Static Template** (`packages/dsl/src/templates/*.ts`): Reference baseline definitions containing normalized relative coordinates and demo scripts;
- **Cloned Project** (IndexedDB): A self-contained entity with its own unique UUIDs, user-modified timestamps, customized voiceover audio blobs, and mutable stage definitions.

---

## Q11: The architectural distinction between static templates and active projects

Templates are read-only blueprints. Active projects in IndexedDB are mutable documents equipped with 50-step undo/redo histories and local draft persistence.

---

## Q12: Why did exported HTML render perfectly in Chrome but drift horizontally in Safari?

On Safari desktop and iOS WebKit:
- Blink (Chrome) correctly derives `naturalWidth` for SVG images from their XML `viewBox` attribute immediately;
- WebKit (Safari) frequently evaluated `img.naturalWidth = 0` or assigned temporary fallback widths before XML parsing concluded;
- This triggered an errant dynamic recalibration routine, resetting the SVG viewBox to arbitrary fallback dimensions and stretching bounding boxes horizontally across the canvas.

---

## Q13: Deep dive into WebKit SVG intrinsic dimension computation anomalies

When an SVG data URI is mounted in an `<img>` tag without explicit CSS pixel widths:
1. WebKit postpones intrinsic dimension evaluation until the first visual layout pass;
2. If JavaScript reads `img.naturalWidth` before that layout pass completes, WebKit returns default fallback values ($300\text{px}$ or container width);
3. An aggressive calibration listener reacted to this transient zero state, corrupting the coordinate scale.

---

## Q14: Purpose, triggers, and execution lifecycle of calibrateSelf()

`calibrateSelf()` was originally designed to rescue scenarios where creators uploaded images with incorrect manual metadata. It compared `imgEl.naturalWidth` with `dsl.meta.viewport.width` upon `image.onload` and resized viewBox attributes dynamically.

---

## Q15: Does WebKit preserve raster image dimensions reliably compared to SVG assets?

**Yes.** Bitmaps (PNG, JPG, WebP) possess binary header chunks (IHDR in PNG, SOF0 in JPEG) that WebKit parses synchronously upon chunk receipt. SVG text markup requires DOM XML tree instantiation, creating the race condition observed in Q13.

---

## Q16: Why trusting DSL viewport definitions over Safari heuristics is optimal

The DSL metadata (`dsl.meta.viewport`) was authored in Studio when the image was ingested. It represents the verified ground truth of the canvas resolution.
Discarding client-side heuristic overrides in favor of **strict DSL adherence** eliminates WebKit's asynchronous initialization flaws permanently.

---

## Q17: End-to-end verification and cross-browser regression testing of the fix

1. **Fix Implementation**: In `player.js`, calibrateSelf only runs if `dsl.meta.viewport` is entirely absent, treating authored metadata as immutable;
2. **Automated Validation**: Verified via Playwright headless Chromium and WebKit test runners;
3. **Hardware Regression**: Tested across Safari 17/18 on macOS Sequoia and iOS Mobile Safari. Bounding boxes and Bezier lines exhibited 100% pixel-perfect alignment.

---

## Master Pipeline Summary Matrix

| Viewport Tier | Mathematical Coordinate Space | Responsible Component | Target Resolution / Envelope |
| :--- | :--- | :--- | :--- |
| **Tier 1: World Space** | Continuous 2D Vector Plane | SVG `<svg viewBox="0 0 W H">` | Native Asset Resolution (e.g. $3840 \times 2160$) |
| **Tier 2: Aspect Envelope** | Aspect-Ratio Hard-Locked Box | `.focusflow-viewport` | 16:9 Scaled Projection ($(fitW, fitH)$) |
| **Tier 3: Camera Frustum** | Inverse Affine Transformation Matrix | `FocusFlowPlayer` Camera Engine | Dynamic Scene Zoom & Pan Center |
| **Tier 4: Host Screen** | Screen Pixel Matrix | Browser Window / Display Hardware | Hardware Retina Matrix ($1920\text{px} \sim 5120\text{px}$) |
