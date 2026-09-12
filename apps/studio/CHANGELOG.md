# @focusflow/studio Changelog

## 1.0.1 (2026-09-12)

### Features

- **export**: support client-side native MP4 (H.264 / AVC1) video export using browser hardware encoder
- **export**: intelligent MIME format negotiation between MP4 and WebM with local preference persistence
- **export**: standard macroblock normalization pipeline (16:9, 9:16, 16:10, 4:3) completely eliminating SPS slice corruption and fluorescent green line
- **export**: source viewport projection pipeline to discard container padding and eliminate windowboxing black borders (1:1 full-bleed output)
- **ui**: responsive format selector and target resolution badge in ExportModal
- **e2e**: automated test coverage for MP4/WebM dual-format decisions and aspect-ratio resolution target hints (TC581)

## 1.0.0 (2026-09-09)

### Features

- 100% offline standalone visual creation workbench with Dark / Light / System semantic theme tokens
- Bilingual (Chinese / English) i18n support with compile-time type-safe keys
- Interactive 5-column layout: TopBar, ToolBox, InfiniteCanvas, RightInspector, BottomTimeline
- Canvas Frustum camera calibration and 3x3 Sobel edge-snapping algorithm
- 5 Visual annotation primitives: Highlight Box, Cubic Bezier Path, Pulse Dot, Callout Bubble, Dynamic Image
- IndexedDB local persistence with 500ms debounce auto-save and multi-project manager
- 6 Ready-to-use industry architecture template presets
- Multi-scene timeline sequencing, inline renaming, duplication, and undo/redo history stack
- Standalone single-file HTML compiler, ZIP archiver, and local 60fps WebM recording
- Audio waveform track, Web Worker peak extraction, and speech-driven duration adaptation
- Audience presentation mode with zero recording watermark
