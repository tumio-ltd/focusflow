<p align="right"><strong>English</strong> • <a href="./32_FOCUSFLOW_45S_FEATURE_SHOWCASE_STORYBOARD.zh-CN.md">简体中文</a></p>

# FocusFlow Official Feature Showcase Storyboard & Voiceover Guide (Natural Pacing Master)

> **Version**: 1.2.0  
> **Date**: 2026-09-18  
> **Archive Path**: `docs/32_FOCUSFLOW_45S_FEATURE_SHOWCASE_STORYBOARD.md`  
> **Pacing Strategy**: Relaxed fixed 45-second constraint, upgraded to **~56 seconds of natural breathing room and narrative whitespace (Natural Pacing Master)**, ensuring every camera flight and core architectural concept can be articulated thoroughly.  
> **Ending Callout**: Scene 5 finale showcases **Official Live Website URL & GitHub Open-Source Repository**.  
> **Visual Canvas**:
> - Chinese: `apps/studio/public/focusflow_workflow_light.png` (3840 × 2160 @ 4K Master)
> - English: `apps/studio/public/focusflow_workflow_light_en.png` (3840 × 2160 @ 4K Master)  
> **Total Duration**: 56.0 Seconds (56,000 ms)  
> **Master Spec**: 1080P 60FPS Full HD MP4 / Standalone Living HTML  

---

## Table of Contents
1. [Directing Philosophy & Natural Pacing Upgrade](#1-directing-philosophy--natural-pacing-upgrade)
2. [5-Scene Shot-by-Shot Master Table](#2-5-scene-shot-by-shot-master-table)
3. [Bilingual Voiceover Scripts & Pacing Cues](#3-bilingual-voiceover-scripts--pacing-cues)
4. [Scene 5 Finale Callout & Link Specifications](#4-scene-5-finale-callout--link-specifications)
5. [Audio & Sound Design Emotional Curve](#5-audio--sound-design-emotional-curve)
6. [FocusFlow DSL Mapping & Studio Runtime Parameters](#6-focusflow-dsl-mapping--studio-runtime-parameters)

---

## 1. Directing Philosophy & Natural Pacing Upgrade

- **Why remove the rigid 45-second cap?**  
  A strict 45-second limit across 5 scenes meant only 8~9 seconds per scene, forcing hurried speech and rushed camera transitions. Upgrading to **56-second natural breathing rhythm**:
  - **Pains & Paradigm Shift (First 2 Scenes: 16s total)**: Grants viewers sufficient cognitive time to grasp the contrast between legacy slides/whiteboards/recordings and the living canvas breakthrough.
  - **Living Canvas Interactive Exploration (Scene 4: 13s)**: Provides adequate time for simulated cursor hover and real-time parameter inspection, making live Q&A tangibly credible.
  - **Grand Finale (Scene 5: 15s)**: Epic zoom-out provides cinematic breathing space, letting the **official domain and GitHub badge** freeze clearly before the audience.

---

## 2. 5-Scene Shot-by-Shot Master Table

| Scene ID | Timecode | Duration | Camera Kinematics | Visual Actions | Core Theme |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **Scene 1** | `00:00 - 00:07.5` | 7.5s | **Left Pain Points Framing**<br>`zoom: 2.05, x: -25.8, y: -24.8`<br>`duration: 1.4s, cubic-bezier` | Precisely frames top-left red warning panel **The Broken Past**. Three cards (Slide Deck Fragmentation, Static Whiteboard Cognitive Overload, Screen Recording Dead Pixels) render crisply. | **The Broken Past Dilemma** |
| **Scene 2** | `00:07.5 - 00:16.0` | 8.5s | **Smooth Pan Right**<br>`zoom: 1.85, x: 20.0, y: -24.8`<br>`duration: 1.8s, smooth-ease` | Tracks smoothly like a dolly cart to blue panel **The Living Future**. Four paradigm pillars (60fps, Frustum Framing, Interactive Pause, <5MB Offline) glow and activate. | **The Living Canvas Paradigm** |
| **Scene 3** | `00:16.0 - 00:28.0` | 12.0s | **Dive & Push-in ➔ First 2 Cards**<br>`zoom: 1.95, x: -18.0, y: 15.0`<br>`duration: 1.8s` | Dives down to focus on Card 01 and Card 02.<br>**Card 01**: 16:9 dynamic frustum frames core payment cluster;<br>**Card 02**: Bezier flight path glows, demonstrating stepless macro-to-micro trajectory. | **Camera Framing & Spatial Continuity** |
| **Scene 4** | `00:28.0 - 00:41.0` | 13.0s | **Pan & Close-up ➔ Inspector Deep-dive**<br>`zoom: 2.10, x: 9.4, y: 15.0`<br>`duration: 1.6s` | Locks onto Card 03. Orange `❚❚ Pause Playback Anytime` pulses; cursor hovers over `srv_payment_core`, expanding live gRPC protocol and downstream dependency panels. | **Living Canvas & Real-time Inspection** |
| **Scene 5** | `00:41.0 - 00:56.0` | 15.0s | **Pan Delivery ➔ Grand Zoom Out**<br>`t=41s`: `zoom: 2.0, x: 25.0, y: 15.0`<br>`t=47s`: Rapid zoom-out to `zoom: 1.0, x: 0, y: 0` | **Card 04**: 1080P MP4 video and <5MB HTML badges illuminate. Camera then zooms out swiftly, revealing full 3840×2160 canvas; **Official website and GitHub links unfurl prominently at top center**. | **Dual Delivery, Links & Grand Finale** |

---

## 3. Bilingual Voiceover Scripts & Pacing Cues

> 💡 Slashes (`/`) indicate natural breathing pauses for the narrator (~0.3~0.5s pause). Pacing is authoritative, composed, and steady.

### 🇨🇳 Chinese Voiceover (Technical Authority, 360 characters)

```text
【Scene 1 · 痛点特写 | 00:00 - 00:07.5 (7.5s)】
面对百万行复杂架构，/ 传统 PPT 翻页切片造成上下文割裂，/ 静态白板信息过载无从聚焦，/ 录屏更是一堆无法打断的死像素。/ 
传统技术汇报方式，/ 正在严重阻碍高效决策。

【Scene 2 · 范式跃迁 | 00:07.5 - 00:16.0 (8.5s)】
FocusFlow 全景活画布演播引擎，/ 打破切片割裂与死像素束缚。/ 
以 60 帧连续空间运镜、/ 毫秒级随时打断探索与零 SaaS 依赖交付，/ 开启全新的技术演播新范式！

【Scene 3 · 视锥取景与运镜 | 00:16.0 - 00:28.0 (12.0s)】
在演播中，/ 电影级视锥取景框自动框选目标，/ 智能计算 16:9 最佳安全视野；/ 
伴随 60 帧物理动力学推轨，/ 从全局系统边界平滑推进至微服务深处，/ 空间拓扑全局在胸、/ 细节一览无余。

【Scene 4 · 活画布交互答疑 | 00:28.0 - 00:41.0 (13.0s)】
面对评委与高管的突发质询，/ 随时按下空格键暂停演播。/ 
活画布全域任由自由拖拽探索，/ 鼠标悬停即刻下钻探查节点实时参数与拓扑链路，/ 现场答疑从容自如、/ 说服力倍增！

【Scene 5 · 双模交付、链接与终章 | 00:41.0 - 00:56.0 (15.0s)】
交付真正零壁垒：/ 既可一键导出 1080P 60帧高清宣传片，/ 又能打包为小于 5MB 的离线单网页，/ 金融与政企涉密机房即插即开。/ 
FocusFlow —— / 让百万行复杂架构，/ 鲜活演播！/ 
欢迎访问 focusflow.tumio.site，/ 前往 GitHub 开源社区探索体验！
```

---

### 🌐 English Voiceover (Silicon Valley Tech Lead Tone, 146 words)

```text
【Scene 1 · Legacy Dilemma | 00:00 - 00:07.5 (7.5s)】
When presenting complex architectures, / traditional slide decks break mental models, / static canvases overwhelm your audience, / and pre-recorded videos are unclickable dead pixels. / 
Legacy presentations are failing engineering teams.

【Scene 2 · Paradigm Shift | 00:07.5 - 00:16.0 (8.5s)】
FocusFlow introduces the Living Canvas paradigm — / breaking free from slides and dead pixels. / 
Combining 60fps continuous flight, / millisecond-level interactive inspection, / and zero SaaS lock-in to eliminate presentation friction for good.

【Scene 3 · Framing & Continuity | 00:16.0 - 00:28.0 (12.0s)】
The intelligent camera frustum locks onto target subsystems / within an optimal 16:9 safe boundary. / 
Physics-based continuous flight travels seamlessly / from macro architecture boundaries into microservice depths / with zero page breaks.

【Scene 4 · Living Inspection | 00:28.0 - 00:41.0 (13.0s)】
When stakeholders interrupt with unexpected questions, / tap Spacebar to freeze playback instantly. / 
Explore the live canvas with full DOM-level inspection, / drilling down into live parameters and dependencies / with absolute confidence.

【Scene 5 · Dual Delivery, Links & Finale | 00:41.0 - 00:56.0 (15.0s)】
Zero SaaS delivery barriers: / export broadcast-quality 1080P 60fps video, / or pack everything into a standalone HTML file under 5 megabytes / for air-gapped security. / 
FocusFlow: / bringing complex systems to life. / 
Explore live at focusflow.tumio.site, / and Star us on GitHub!
```

---

## 4. Scene 5 Finale Callout & Link Specifications

During Scene 5 grand zoom-out, the top-center position dynamically activates the **Official Main Callout (`co-finale-cta`)**:

- **Component ID**: `co-finale-cta`
- **Theme Color**: `blue` / `pink`
- **Physical Anchor**: `left: 1080px, top: 160px` (Width: 1080px)
- **Chinese Content**:
  - **Title**: `FocusFlow Studio · 活画布演播引擎`
  - **Subtitle**: `🌐 官方在线体验: focusflow.tumio.site  •  ⭐ GitHub 开源仓库: github.com/tumio-ltd/focusflow`
- **English Content**:
  - **Title**: `FocusFlow Studio · The Living Canvas Engine`
  - **Subtitle**: `🌐 Live Website: focusflow.tumio.site  •  ⭐ GitHub Repo: github.com/tumio-ltd/focusflow`

---

## 5. Audio & Sound Design Emotional Curve

```
00:00           00:07.5         00:16.0                 00:28.0                 00:41.0         00:56.0
  │               │               │                       │                       │               │
  ▼               ▼               ▼                       ▼                       ▼               ▼
[ Muted Hum ] ─► [ Synth Rise ] ─► [ Flowing Beats ] ───► [ Spacebar Click & Pop ] ─► [ Epic Drone ] ─► [ Reverb Fade ]
  (Muffled Lows)  (Bright Upturn)  (Tech Momentum)        (Mechanical Key & Pop)  (Dual Delivery) (Reverb Logo Fade)
```

- **00:00.000 (Scene 1)**: Subdued electrical hum and subtle paper flipping, accentuating legacy frustration.
- **00:07.200 (Scene 2 Transition)**: Crisp **Future Synth Sweep**, camera pans right, activating glowing blue Living Future panel.
- **00:15.800 (Scene 3 Dive)**: Aerodynamic **Camera Whoosh** + subtle **Focus Shutter** click.
- **00:27.800 (Scene 4 Freeze)**: Authentic **Mechanical Spacebar Tap** + **Bubble Pop** as inspector unfolds.
- **00:40.800 (Scene 5 Delivery)**: Harmonious **Digital Chime**, followed immediately by **Cinema Zoom Out Whoosh**, reaching full harmonic resolution before a sharp, clean cut at 56.0s.

---

## 6. FocusFlow DSL Mapping & Studio Runtime Parameters

- **Template File**: `apps/studio/src/templates/tpl-focusflow-workflow.ts`
- **Scene Breakdown**:
  1. `scene-1-broken-past`: `duration: 7500ms`, `zoom: 2.05, x: -25.8, y: -24.8`
  2. `scene-2-living-future`: `duration: 8500ms`, `zoom: 1.85, x: 20.0, y: -24.8`
  3. `scene-3-frustum-and-continuity`: `duration: 12000ms`, `zoom: 1.95, x: -18.0, y: 15.0`
  4. `scene-4-living-interactive`: `duration: 13000ms`, `zoom: 2.10, x: 9.4, y: 15.0`
  5. `scene-5-dual-delivery-finale`: `duration: 15000ms`, `zoom: 1.0, x: 0, y: 0`
- **Total Duration**: 56,000 ms (56.0 seconds).
