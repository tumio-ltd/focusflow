# @focusflow/dsl Changelog

## 1.0.2

### Patch Changes

- - **auto-tour**: implement dual-mode AI Auto-Tour generation engine with Option A (offline heuristic Sobel clustering, <200ms) and Option B (multi-provider Vision LLM Copilot)
  - **auto-tour**: support OpenAI, Gemini, SiliconFlow, and Custom OpenAI-compatible vision adapters with client-side image compression and self-healing DSL sanitizer
  - **auto-tour**: introduce unified AI Provider Vault (`aiProviderVault.ts`) for cross-module credential sharing (TTS & Vision) and safe purging
  - **templates**: set official 4K vector `microservicesTemplate` as initial default project, reducing cold-start asset size by 99% (33KB) with 5-scene cinematic camera movements
  - **inspector**: eliminate redundant base resolution card from calibration assistant to save 40px vertical space, with enhanced top-right sticky badge and bilingual tooltips
  - **model-catalog**: bind model catalog to single source of truth (`modelCatalog.generated.json`), displaying max 5 mainstream models sorted chronologically newest-first
  - **e2e**: comprehensive automated Playwright test suites covering heuristic tour, vision pipeline, AI vault, and state machine rollback

## 1.0.0 (2026-09-09)

### Features

- Initial release of FocusFlow Domain Specific Language specification and TypeScript type declarations
- Define standard schema for Viewport, Camera, Scenes, Visual Elements (Box, Path, Dot, Callout, Image), and Audio Tracks
- Support jobs schema for cloud rendering queues and batch export
