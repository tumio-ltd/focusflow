<p align="right">
  <strong>English</strong> • <a href="./01_USAGE_GUIDE.zh-CN.md">简体中文</a>
</p>

# 🎨 FocusFlow Studio · User Manual & Production Guide
## Master Walkthrough, Infinite Canvas Kinematics & Audio-Driven Storytelling

| Metadata | Description |
| :--- | :--- |
| **Specification Version** | `v2.0.0` (Studio Mode A - Pure Frontend Offline Autonomy) |
| **Last Updated** | `2026-08-31` |
| **Target Audience** | System Architects, Technical Evangelists, Product Managers, Engineering Leads |
| **System Positioning** | Next-Generation Zero-Dependency Architecture Dynamics & Kinematic Presentation Suite |
| **Historical Baseline** | Refer to legacy documentation in [`docs-internal/06_MVP_USAGE_GUIDE.md`](../docs-internal/06_MVP_USAGE_GUIDE.md) |

---

## 📑 Table of Contents

- [1. Quick Start & Five-Panel Workbench Overview](#1-quick-start--five-panel-workbench-overview)
  - [1.1 Local Quick Start](#11-local-quick-start)
  - [1.2 Five-Panel Responsive Workbench Architecture](#12-five-panel-responsive-workbench-architecture)
- [2. Asset Ingestion & Project Management (Step 1)](#2-asset-ingestion--project-management-step-1)
  - [2.1 Image Ingestion with Automatic EXIF Resolution Normalization](#21-image-ingestion-with-automatic-exif-resolution-normalization)
  - [2.2 Template Center: 6 Industry Architectures with 1-Click Clone](#22-template-center-6-industry-architectures-with-1-click-clone)
  - [2.3 IndexedDB 500ms Debounced Auto-Persistence](#23-indexeddb-500ms-debounced-auto-persistence)
- [3. Visual Framing & 4 Core Annotation Toolchains (Step 2)](#3-visual-framing--4-core-annotation-toolchains-step-2)
  - [3.1 InfiniteCanvas Pan/Zoom Anchored to Cursor Coordinates](#31-infinitecanvas-panzoom-anchored-to-cursor-coordinates)
  - [3.2 Camera Frustum Safety Framing & 1-Click Viewport Capture](#32-camera-frustum-safety-framing--1-click-viewport-capture)
  - [3.3 Bounding Box Snapping via Sobel Gradient Spatial Convolution](#33-bounding-box-snapping-via-sobel-gradient-spatial-convolution)
  - [3.4 8-Directional Normal Anchoring & Cubic Bezier Neon Flow](#34-8-directional-normal-anchoring--cubic-bezier-neon-flow)
  - [3.5 Interface Pulse Dots & Frosted Glass Callout Bubbles](#35-interface-pulse-dots--frosted-glass-callout-bubbles)
  - [3.6 RightInspector Real-Time Kinematic Synchronization](#36-rightinspector-real-time-kinematic-synchronization)
- [4. Multi-Scene Choreography, Layer Matrix & Time Travel (Step 3)](#4-multi-scene-choreography-layer-matrix--time-travel-step-3)
  - [4.1 Bottom Timeline Scene Cards Flow & Native HTML5 Drag Reordering](#41-bottom-timeline-scene-cards-flow--native-html5-drag-reordering)
  - [4.2 Inline Title Editing, Duplicate & Destruction](#42-inline-title-editing-duplicate--destruction)
  - [4.3 Layer Visibility Matrix & Cross-Scene Element Inheritance](#43-layer-visibility-matrix--cross-scene-element-inheritance)
  - [4.4 50-Step Immutable Time-Travel Undo/Redo (⌘Z / ⌘⇧Z)](#44-50-step-immutable-time-travel-undoredo-z--z)
- [5. Voiceover Narration, AI Scripting & Audio-Driven Adaptive Sync (Step 4)](#5-voiceover-narration-ai-scripting--audio-driven-adaptive-sync-step-4)
  - [5.1 The 3 Ingestion Audio Pipelines](#51-the-3-ingestion-audio-pipelines)
  - [5.2 Core Capabilities of AI Voiceover Scripting](#52-core-capabilities-of-ai-voiceover-scripting)
  - [5.3 Per-Scene Scripting & Single-Scene TTS Audition](#53-per-scene-scripting--single-scene-tts-audition)
  - [5.4 1-Click Batch Synthesis & Web Audio Master Track Stitching](#54-1-click-batch-synthesis--web-audio-master-track-stitching)
  - [5.5 Visual Waveform Track, Laser Playhead & Instant Stem Export](#55-visual-waveform-track-laser-playhead--instant-stem-export)
- [6. Export Center & Presentation Mode (Step 5)](#6-export-center--presentation-mode-step-5)
  - [6.1 Pure Frontend Standalone HTML Compiler (Zero-Dependency)](#61-pure-frontend-standalone-html-compiler-zero-dependency)
  - [6.2 Production ZIP Archive Distribution](#62-production-zip-archive-distribution)
  - [6.3 Lossless 60FPS Video Capture](#63-lossless-60fps-video-capture)
  - [6.4 100vw × 100vh Full-Screen Presentation Mode](#64-100vw--100vh-full-screen-presentation-mode)
- [7. Global Keyboard Shortcuts & FAQ](#7-global-keyboard-shortcuts--faq)
  - [7.1 Keyboard Shortcuts Reference](#71-keyboard-shortcuts-reference)
  - [7.2 Frequently Asked Questions (FAQ)](#72-frequently-asked-questions-faq)
- [Appendix: FocusFlow Physics Engine & Motion Design Principles](#appendix-focusflow-physics-engine--motion-design-principles)

---

## 1. Quick Start & Five-Panel Workbench Overview

### 1.1 Local Quick Start

Launch the Studio development server from the monorepo root:

```bash
pnpm dev:studio
```

Open your browser to: 👉 **`http://localhost:5174`**

---

### 1.2 Five-Panel Responsive Workbench Architecture

FocusFlow Studio is structured into five distinct, specialized functional sectors:

```
+---------------------------------------------------------------------------------------------------+
| TopBar: Logo · Inline Title · Undo/Redo · Lang · Theme · Templates · Projects · Import · Play · Export |
+------------------+-------------------------------------------------------------+--------------------+
| LeftToolbox      | CenterCanvas (InfiniteCanvas Viewport)                      | RightInspector     |
|                  |                                                             |                    |
| ✋ Pan / Hand    |  +-------------------------------------------------------+  | 📷 Camera Kinematics|
| 🔲 Bounding Box  |  | 📷 CameraFrustumFrame Safety Border                   |  |   - Title / Zoom   |
| 〰️ Bezier Path   |  |                                                       |  |   - Duration / Snap|
| 🔵 Pulse Dot     |  |   [ Box Element ] ──(Bezier Neon)──> [ Box Element ]  |  | 🗂️ Layer Visibility|
| 💬 Frosted Bubble|  |        🔵                                             |  |   - Filter / Search|
|                  |  |     💬 [Callout Bubble]                               |  |   - Inherit Prev   |
|                  |  +-------------------------------------------------------+  | 🎨 Neon Palettes   |
+------------------+-------------------------------------------------------------+--------------------+
| BottomTimeline: Play/Pause · Step Prev/Next · Scene Cards (Drag/Rename/Clone/Delete) · Total Duration |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Asset Ingestion & Project Management (Step 1)

### 2.1 Image Ingestion with Automatic EXIF Resolution Normalization
- Click **"Import Canvas"** on the TopBar or drag and drop any high-res architecture diagram (PNG / JPG / WebP);
- The internal `imageDecoder` parses raw physical dimensions in memory (supporting 4K, 5K, and 8K ultra-wide diagrams), normalizes EXIF orientations, and configures initial viewport bounds.

### 2.2 Template Center: 6 Industry Architectures with 1-Click Clone
If you do not have a diagram ready, select **"Templates"** to clone one of 6 battle-tested architectures:
1. **LuxeHMS Hotel PMS High-Concurrency Booking Architecture**: Gateways, room state engines, inventory lock guards, and payment flows;
2. **Microservices High-Availability E-Commerce Topology**: Gateway routing, order hubs, and distributed cache clusters;
3. **FinTech Financial Transaction Risk Management**: Real-time evaluation flows and automated clearing/settlement;
4. **CloudNative Multi-Cloud Disaster Recovery**: Multi-active traffic scheduling and cross-region synchronization;
5. **AI LLM Knowledge Base RAG Pipeline**: Vector embeddings, re-ranking nodes, and LLM generation chains;
6. **IoT Industrial High-Throughput Ingestion Gateway**: MQTT protocol parsing and time-series database clusters.

### 2.3 IndexedDB 500ms Debounced Auto-Persistence
- **Zero Backend Required**: All project state persists locally in browser **IndexedDB**;
- **Debounced Save**: Parameter mutations, element reordering, and scene modifications trigger a silent **500ms debounced commit**;
- **Project Manager**: Access **"My Projects"** in the TopBar to switch between projects instantly, clone duplicates, or search through existing diagrams.

---

## 3. Visual Framing & 4 Core Annotation Toolchains (Step 2)

### 3.1 InfiniteCanvas Pan/Zoom Anchored to Cursor Coordinates
- **Cursor-Centric Scaling**: Scrolling the mouse wheel scales geometrically anchored precisely to cursor coordinates ($0.1\text{x} \sim 5.0\text{x}$) without drift;
- **Infinite Panning**: Activate the **"Pan/Hand"** tool or hold <kbd>Space</kbd> / middle-click to traverse large diagrams smoothly.

### 3.2 Camera Frustum Safety Framing & 1-Click Viewport Capture
- When camera mode is active, the canvas displays the **`CameraFrustumFrame`** in neon borders, highlighting the exact boundary visible during audience presentations;
- **16:9 Letterbox Mask**: Exterior areas are dimmed (`rgba(0, 0, 0, 0.40)`) to eliminate visual clutter;
- **Dual Viewport Alignment**:
  - **Capture Viewport**: Adjust canvas zoom and position, then click **"📸 Capture Current View"** in RightInspector to populate camera properties (`zoom`, `x%`, `y%`);
  - **Stage Match**: Double-click any scene card's empty background on the timeline to fly the canvas camera directly into that scene's framing.

### 3.3 Bounding Box Snapping via Sobel Gradient Spatial Convolution
- **Manual Drag**: Select the **"Bounding Box"** tool and drag across a service card;
- **Sobel 3x3 Convolution Snapping**: Upon mouse release, the Sobel gradient analyzer searches within a $\pm 24\text{px}$ narrow band, snapping boundaries to the physical card edge with sub-pixel precision;
- **Bypass Snapping**: Hold <kbd>Alt / Option</kbd> while dragging to retain unadjusted manual drag bounds.

### 3.4 8-Directional Normal Anchoring & Cubic Bezier Neon Flow
- **Smart Magnetic Anchors**: Hovering near any card with the **"Bezier Path"** tool reveals 8 normal anchor points (N, S, E, W, NE, NW, SE, SW);
- **Smooth Trajectory**: Drag connecting lines between anchors to generate cubic Bezier splines;
- **Neon Pulse Flow**: Paths render animated SVG stroke-dash pulses and Gaussian glow filters, indicating message flows and directional sequence.

### 3.5 Interface Pulse Dots & Frosted Glass Callout Bubbles
- **Pulse Dots**: Click API endpoints, message topics, or database sockets to drop glowing interface beacons;
- **Frosted Glass Callouts**: Attach callout cards with badge headers and descriptive body copy (supports Cyan, Violet, Emerald, Amber, and Rose styling palettes);
- **HUD Anti-Scale Compensation**: Callouts belong to screen-space HUD layers. The system applies dynamic anti-scale compensation ($\text{antiScale} = \operatorname{clamp}(0.6, \frac{1}{\text{canvasScale}}, 4.0)$), ensuring text maintains a readable $12\sim 13\text{px}$ font size whether the canvas is zoomed in or out;
- **Smart Folding for Bird's-Eye View**: When zoomed out beyond `scale < 0.15`, unselected callouts collapse into compact pill badges, expanding back smoothly upon hover or zoom.

### 3.6 RightInspector Real-Time Kinematic Synchronization
- Adjust camera zoom levels, transition durations (default 1.2s), and easing curves;
- Manage layer visibility per scene to highlight or hide elements dynamically.

---

## 4. Multi-Scene Choreography, Layer Matrix & Time Travel (Step 3)

### 4.1 Bottom Timeline Scene Cards Flow & Native HTML5 Drag Reordering
- Cards on the timeline represent consecutive presentation scenes (`01 Gateway` $\rightarrow$ `02 Cache Layer` $\rightarrow$ `03 Persistence`);
- Drag cards horizontally to reorder presentation sequence;
- Cumulative presentation time is computed dynamically in the upper timeline corner.

> [!TIP]
> **Timeline Interaction Zones**:
> - **Double-click card title text**: Activates inline text editing to rename the scene;
> - **Double-click card body / empty space**: Triggers `flyToCamera` (Stage Match), animating the canvas to match that scene's camera framing with 100% pixel fidelity.

### 4.2 Inline Title Editing, Duplicate & Destruction
Hovering over any card reveals quick action icons to clone the scene (duplicating all camera settings and elements) or delete it.

### 4.3 Layer Visibility Matrix & Cross-Scene Element Inheritance
When authoring complex narratives, click **"⚡ Inherit Elements from Previous Scene"** in RightInspector to deep-copy active elements from the prior scene, accelerating sequential workflow.

### 4.4 50-Step Immutable Time-Travel Undo/Redo (⌘Z / ⌘⇧Z)
The studio maintains an immutable 50-step historical snapshot stack. Use standard shortcuts:
- <kbd>⌘Z</kbd> / <kbd>Ctrl+Z</kbd>: Undo previous action;
- <kbd>⌘⇧Z</kbd> / <kbd>Ctrl+Y</kbd>: Redo action.

---

## 5. Voiceover Narration, AI Scripting & Audio-Driven Adaptive Sync (Step 4)

In professional presentations, voice guides audience attention. FocusFlow implements **Audio-Driven Adaptive Kinematics**, eliminating manual keyframe stretching.

```
                  [FocusFlow 3-Way Audio Ingestion Pipelines]

   [ Pipeline 1: 🎙️ Microphone Recording ] ──> (VU Meter / Countdown / Stamping) ──┐
                                                                                  │
   [ Pipeline 2: 📁 External File Import ] ──> (MP3/WAV/WebM Offscreen Decode) ───┼──> [ Web Audio Engine ] ──> [ Waveform & Adaptive Stretch ]
                                                                                  │
   [ Pipeline 3: 🤖 AI Voiceover & TTS ] ────> (Per-Scene Scripts / Auto Pacing) ─┘
```

### 5.1 The 3 Ingestion Audio Pipelines
1. **🎙️ Studio Microphone Recording**: Select input hardware, monitor dynamic dBFS VU meters, and record synchronized narration with interactive timeline stamps;
2. **📁 External Audio File Import**: Ingest local `.mp3`, `.wav`, or `.m4a` files; worker threads parse waveforms and mount tracks in milliseconds;
3. **🤖 AI Voiceover & TTS**: Automated neural synthesis pipeline ideal for headless workflows and international presentations.

### 5.2 Core Capabilities of AI Voiceover Scripting
- **Per-Scene Scripting**: Enter explanatory narration scripts inside the RightInspector for each scene;
- **Adaptive Duration Stretching Formula**:
  $$\text{scene.duration} = \max(T_{\text{audio}} + 300\text{ms},\, \text{camera.duration} + 500\text{ms})$$
  Ensures that camera holds match narration lengths with natural breathing pauses;
- **Batch Master Stitching**: Click `[🤖 AI Voiceover]` on the timeline to synthesize all scene scripts concurrently and concatenate them into a continuous master WAV track via Web Audio API.

### 5.3 Per-Scene Scripting & Single-Scene TTS Audition
Input dialogue scripts into the RightInspector and click `[🎙️ Audition & Stretch]` to evaluate single-scene cadence without affecting other scenes (see [`23_SCENE_VOICEOVER_AND_AUDIO_TRACK_MODELS.zh-CN.md`](./23_SCENE_VOICEOVER_AND_AUDIO_TRACK_MODELS.zh-CN.md) for data model specifications).

### 5.4 1-Click Batch Synthesis & Web Audio Master Track Stitching
Clicking `[🤖 AI Voiceover]` triggers batch compilation, automatically rendering a stitched audio track with scene markers in 2~3 seconds.

### 5.5 Visual Waveform Track, Laser Playhead & Instant Stem Export
The expanded `AudioWaveformTrack` provides:
1. **Multi-Scale Zoom**: Inspect waveform transients from $1.0\text{x} \sim 10.0\text{x}$;
2. **Laser Playhead Scrubbing**: Drag the playhead to trigger instantaneous 2.5s audio slice previews;
3. **Master Stem Export**: Click `[📥 Download Audio]` to export the stitched `.wav` master file for external editing in Premiere or Final Cut Pro;
4. **Persistent State**: Audio blobs are snapshotted in IndexedDB, surviving page reloads intact.

---

## 6. Export Center & Presentation Mode (Step 5)

Access the multi-format export modal via the TopBar **"Export"** button:

### 6.1 Pure Frontend Standalone HTML Compiler (Zero-Dependency)
Click **"Download .html File"**. The packager inlines the project DSL, Base64 image rasters, and the `@focusflow/player` IIFE engine into a single file. Recipients can double-click to run smooth 60FPS presentations on any operating system without web servers or internet access.

### 6.2 Production ZIP Archive Distribution
Select the **"Project ZIP"** tab to export a standard bundle containing `config.json`, asset folders, and standalone viewer files.

### 6.3 Lossless 60FPS Video Capture
Under the **"Video Recording"** tab, click **"Start Recording"** to launch hardware-accelerated MediaRecorder video encoding, producing crisp MP4 (H.264) or WebM (VP9) video assets.

### 6.4 100vw × 100vh Full-Screen Presentation Mode
Click **"Present"** in the TopBar to launch the immersive audience view:
- <kbd>→</kbd> / <kbd>Space</kbd>: Advance to next scene;
- <kbd>←</kbd>: Step back to previous scene;
- <kbd>F</kbd>: Toggle browser full-screen;
- <kbd>ESC</kbd>: Exit presentation mode cleanly.

---

## 7. Global Keyboard Shortcuts & FAQ

### 7.1 Keyboard Shortcuts Reference

| Shortcut (Mac) | Shortcut (Windows/Linux) | Action | Scope |
| :--- | :--- | :--- | :--- |
| <kbd>⌘Z</kbd> | <kbd>Ctrl+Z</kbd> | **Undo** | Global |
| <kbd>⌘⇧Z</kbd> | <kbd>Ctrl+Y</kbd> / <kbd>Ctrl+Shift+Z</kbd> | **Redo** | Global |
| <kbd>→</kbd> / <kbd>Space</kbd> | <kbd>→</kbd> / <kbd>Space</kbd> | **Next Scene / Play** | Timeline & Presentation |
| <kbd>←</kbd> | <kbd>←</kbd> | **Previous Scene** | Timeline & Presentation |
| <kbd>F</kbd> | <kbd>F</kbd> | **Fullscreen Toggle** | Presentation Mode |
| <kbd>ESC</kbd> | <kbd>ESC</kbd> | **Exit Presentation / Close Modal** | Presentation Mode |
| <kbd>Alt / Option</kbd> + Drag | <kbd>Alt</kbd> + Drag | **Manual Drag (Bypass Sobel Snap)** | Bounding Box Tool |
| <kbd>Scroll Wheel</kbd> | <kbd>Scroll Wheel</kbd> | **Cursor-Centric Zoom** | Canvas |
| Double-click Card Body | Double-click Card Body | **Stage Match (flyToCamera)** | Timeline |
| Double-click Card Title | Double-click Card Title | **Inline Title Editing** | Timeline |

---

### 7.2 Frequently Asked Questions (FAQ)

#### Q1: Can standalone HTML exports function without an internet connection?
**A**: Yes, 100%. All images, fonts, styles, and runtime scripts are serialized into self-contained Base64 Data URIs inside a single `.html` document.

#### Q2: How can I embed a FocusFlow presentation in an external web application?
**A**: You can either embed the exported standalone HTML inside an `<iframe>`, or import `@focusflow/player` directly and instantiate `new FocusFlowPlayer({ container, dsl })`.

#### Q3: Does AI Voiceover require commercial API keys?
**A**: Not for basic usage. FocusFlow includes zero-cost offline Web Speech synthesis by default. Users may optionally configure private Google Gemini, OpenAI, or SiliconFlow keys for broadcast-quality neural voices.

---

## Appendix: FocusFlow Physics Engine & Motion Design Principles

FocusFlow runs on six hardware-accelerated motion systems:
1. **Cinema Camera Kinematics**: Standard cubic Bezier transitions `cubic-bezier(0.4, 0.0, 0.2, 1.0)` for smooth pan and zoom framing;
2. **Neon Glow Pulse**: SVG Gaussian filters (`#ff-glow`) with dynamic drop shadows;
3. **Stream Data Flow**: Cubic Bezier normal vectors paired with animated `stroke-dashoffset` pulses;
4. **Endpoint Pulse Rings**: Dual-layer concentric rings emitting radial ripples;
5. **Staggered Frosted Glass Callouts**: `backdrop-filter: blur(12px)` panels with 0.15s staggered entry curves;
6. **PiP Inset Drill-Down**: Microscopic code or UI zoom-fade overlays atop macro architecture diagrams.

---
*FocusFlow Architecture & Developer Relations Group · 2026.08*
