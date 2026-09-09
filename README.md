<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./apps/studio/public/logos/logo-horizontal-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./apps/studio/public/logos/logo-horizontal-light.svg">
  <img alt="FocusFlow Logo" src="./apps/studio/public/logos/logo-horizontal-light.svg" width="340">
</picture>

<p align="center">
  <strong>Turn complex architecture diagrams into 60fps cinematic interactive stories.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> •
  <a href="./README.zh-CN.md">简体中文</a>
</p>

[![License](https://img.shields.io/badge/License-MIT%20%7C%20AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0+-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-Online-success?logo=github)](https://tumio-ltd.github.io/focusflow/)

<br />

<a href="https://tumio-ltd.github.io/focusflow/">
  <img src="https://img.shields.io/badge/🚀_Try_Live_Demo_Online-No_Installation_Required-0284c7?style=for-the-badge&logoColor=white" alt="Try Live Demo Online" height="42" />
</a>

<br /><br />
</div>

---

## 💡 Why FocusFlow?

When presenting distributed systems, microservices, or complex AI pipelines, static architecture diagrams have fundamental flaws:

* **Cognitive Overload**: A static 4K diagram dumps hundreds of nodes at once. Audiences lose context within 30 seconds.
* **Slides & Screen Recordings Fall Short**: Slide decks crop out surrounding connections; recorded videos cannot be paused for interactive inspection or zooming into node details.
* **Production Friction**: High-end motion graphics typically require Adobe After Effects or complex video production tools.

**FocusFlow bridges this gap.** It lets you direct your architecture diagram like a movie camera:
- Smoothly pans, zooms, and rotates across nodes at **60fps GPU acceleration**.
- Lights up dynamic **cubic Bezier curves** between dependencies.
- Generates **AI voiceover with synchronized waveforms**.
- Compiles into a **100% offline single-file HTML** that runs in any browser with zero network or runtime dependencies.

### 📊 Comparison Matrix

| Capability | FocusFlow | Traditional Slides (PPT / Keynote) | Static Diagramming (Draw.io / Excalidraw) | Screen Recording (Loom / OBS) |
| :--- | :---: | :---: | :---: | :---: |
| **Cinematic Camera Pathing** | **Native 60fps Kinematics** | Discrete manual transitions | ❌ None | Fixed perspective video |
| **Interactive Node Exploration** | **Full (Pan / Zoom while playing)** | ❌ Static slides | Manual canvas pan | ❌ Flat pixels |
| **Zero-Friction Alignment** | **Sobel Edge Smart Snapping** | Manual snapping | Manual alignment | ❌ None |
| **Dynamic Flow Curves** | **Real-time Bezier glow routing** | ❌ None | Static arrows | Pre-rendered pixels |
| **Distribution Format** | **Self-contained Single-file HTML** | Proprietary `.pptx` / `.key` | Image / XML export | Heavy `.mp4` / `.webm` video |
| **Offline Execution** | **100% Offline (Zero backend)** | Depends on app | Requires web app | Local video player |

---

## ✨ Key Features

### 🎥 1. 60fps GPU Cinematic Kinematics
Continuous affine transforms (`scale`, `translate3d`, `rotate`) driven by viewport kinematics. Seamlessly transition from global overview to microscopic component details without aliasing or frame drops.

### 🧲 2. Sobel Edge Smart Snapping
Equipped with a native computer-vision algorithm: drag a bounding box near any node or diagram card, and FocusFlow automatically snaps bounding boxes to the exact pixel borders in $< 1\text{ms}$.

### ⚡ 3. Dynamic Bezier Flow Routing
Intelligent relative anchor calculation (`right ➔ left`, `bottom ➔ top`) connecting nodes with animated glowing pulses, customizable pulse colors, and directional indicators.

### 🎙️ 4. AI Voiceover & Audio-Motion Sync
Built-in offline Web Speech API synthesizer and cloud LLM voiceover connector. Features visual audio waveform tracks, subtitle markers, and auto-computed camera dwell times.

### 🏝️ 5. Dynamic Island & Zen Mode
A sleek floating HUD pill at the bottom provides chapter progress, time remaining, playback controls, and element density counters. Supports auto-hiding **Zen Mode** for clean presentation recording.

### 📦 6. Single-File Offline Compiler
Compile your entire project—background 4K image, overlays, audio narration, motion scripts, and player engine—into a single self-contained `.html` file ($< 5\text{MB}$) that opens anywhere with double-click.

---

## 🚀 Quick Start

### 1. Try Online Live Demo
No installation needed. Open directly in your browser:  
👉 **[https://tumio-ltd.github.io/focusflow/](https://tumio-ltd.github.io/focusflow/)**

### 2. Local Development (Turborepo)

```bash
# Clone the repository
git clone https://github.com/tumio-ltd/focusflow.git
cd focusflow

# Install dependencies (requires pnpm 9+)
pnpm install

# Start local workbench (FocusFlow Studio)
pnpm dev:studio
# 👉 Open http://localhost:5174 in your browser

# Build all packages
pnpm build
```

---

## 🏗️ Monorepo Architecture

```text
focusflow/
├── apps/
│   └── studio/               # Visual Web Workbench (React 19, Tailwind CSS v4, Lucide)
├── packages/
│   ├── player/               # High-performance 60fps runtime engine (~35KB, Zero UI deps)
│   ├── dsl/                  # Shared TypeScript DSL specifications & JSON schema
│   ├── config-typescript/    # Shared TypeScript compiler options
│   ├── config-oxlint/        # High-speed Oxlint quality rules
│   └── config-tailwind/      # Semantic dark/light design tokens
├── examples/
│   ├── luxehms/              # 4K Microservices Architecture Showcase
│   ├── sales-fee/            # 5K Panoramic Sales Network & Commission Topology
│   ├── overlay-demo/         # Picture-in-picture dynamic drilldown showcase
│   └── simple-demo/          # Minimal 2-node smoke test
├── docs/                     # Technical whitepapers & algorithm specifications
└── scripts/                  # Standalone compiler & project generator
```

---

## 📦 Packages

| Package | Version | License | Description |
| :--- | :--- | :--- | :--- |
| **`@focusflow/player`** | `v1.0.0` | **MIT** | Lightweight (~35KB) 60fps canvas presentation runtime engine |
| **`@focusflow/dsl`** | `v1.0.0` | **MIT** | FocusFlow typed DSL schema, geometry types & validator |
| **`@focusflow/studio`** | `v1.0.0` | **AGPL-3.0** | Interactive visual timeline authoring workbench |

---

## 📖 Documentation & Technical Whitepapers

Detailed architectural and algorithmic specifications are available in the [`docs/`](docs/) directory:

* 📘 [**Studio Usage Guide**](docs/USAGE_GUIDE.md): Step-by-step tutorial on creating and exporting projects.
* 📐 [**Sobel Edge Snapper Algorithm**](docs/EDGE_SNAPPER_ALGORITHM.md): Mathematics of convolutional gradient bounding box extraction.
* 🎵 [**Audio Sync & Export Matrix**](docs/AUDIO_PLAYBACK_AND_EXPORT_MATRIX.md): Dual-engine audio synchronization and recording architecture.
* 📹 [**60fps WebM Recording Architecture**](docs/LOCAL_60FPS_WEBM_RECORDING_PLAN.md): In-browser zero-jitter video encoding pipeline.
* 🛠️ [**PNPM Scripts Reference**](docs/PNPM_SCRIPTS.md): Monorepo task orchestration reference.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [Issues page](https://github.com/tumio-ltd/focusflow/issues).

---

## 📄 License

FocusFlow is licensed under a dual-licensing model:
* **Core Engine & DSL** (`packages/player`, `packages/dsl`, `tooling/*`, `examples/*`): **[MIT License](LICENSE)**.
* **Studio Visual Workbench** (`apps/studio`): **[GNU Affero General Public License v3.0 (AGPL-3.0)](apps/studio/LICENSE)**.

Copyright &copy; 2026 **Tumio Soft Technology Co., Ltd.**
