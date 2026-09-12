# Changelog

All notable changes to FocusFlow will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.0.1 (2026-09-12)

### Features

- **export**: support client-side native MP4 (H.264 / AVC1) video export using browser hardware encoder
- **export**: intelligent MIME format negotiation between MP4 and WebM with local preference persistence
- **export**: standard macroblock normalization pipeline (16:9, 9:16, 16:10, 4:3) completely eliminating SPS slice corruption and fluorescent green line
- **export**: source viewport projection pipeline to discard container padding and eliminate windowboxing black borders (1:1 full-bleed output)
- **studio**: responsive format selector and target resolution badge in ExportModal
- **e2e**: automated test coverage for MP4/WebM dual-format decisions and aspect-ratio resolution target hints (TC581)

## 1.0.0 (2026-09-09)

### Features

- **studio**: deliver 100% offline standalone creation workbench with Dark / Light / System themes and bilingual (`zh` / `en`) i18n
- **studio**: interactive 5-column responsive workbench (`TopBar`, `ToolBox`, `InfiniteCanvas`, `RightInspector`, `BottomTimeline`)
- **canvas**: smooth zoom-to-cursor infinite viewport with $3\times 3$ Sobel pixel-edge detection and magnetic snapping
- **elements**: support 5 core visual primitives (Highlight Box, Cubic Bezier Line, Pulse Dot, Callout Bubble, Dynamic Image)
- **timeline**: multi-scene sequencing, thumbnail cards, layer visibility matrix, and undo/redo time-travel history stack
- **packaging**: pure frontend single-file standalone HTML compiler (inlining IIFE runtime, DSL, and Base64 assets) and ZIP archiving
- **audio**: audio waveform timeline track with multi-threaded Web Worker peak extraction, red playhead scrubbing, and speech synthesis duration stretching
- **headless-cli**: Playwright CDP virtual-clock deterministic headless video rendering CLI (`scripts/render-video.mjs`) with NDJSON stream protocol and agent self-healing suggestions
- **licensing**: dual-license model with MIT for core player/dsl and AGPL-3.0 for studio workbench
