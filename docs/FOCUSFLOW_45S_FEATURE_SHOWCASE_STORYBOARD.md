# FocusFlow 官方功能宣传导播脚本与分镜手册 (自然节奏完整版)
## FocusFlow Official Feature Showcase Storyboard & Voiceover Guide

> **版本 (Version)**: 1.2.0  
> **更新日期 (Date)**: 2026-09-18  
> **归档路径 (Path)**: `docs/FOCUSFLOW_45S_FEATURE_SHOWCASE_STORYBOARD.md`  
> **时长策略**: 解除固定 45 秒严格限制，升级为**约 56 秒的自然呼吸感与充沛留白节奏（Natural Pacing Master）**，确保每个镜头推轨与核心痛点均能深讲讲透。  
> **尾幕升级**: 场景五终章正上方 Callout 正式呈现**项目官方网站链接与 GitHub 开源仓库地址**。  
> **适用底图 (Visual Canvas)**: 
> - 中文版：`apps/studio/public/focusflow_workflow_light.png` (3840 × 2160 @ 4K Master)
> - 英文版：`apps/studio/public/focusflow_workflow_light_en.png` (3840 × 2160 @ 4K Master)
> **总时长 (Total Duration)**: 56.0 秒（56,000 毫秒）  
> **视频规格 (Master Spec)**: 1080P 60FPS Full HD MP4 / Standalone Living HTML  

---

## 目录 (Table of Contents)
1. [导播设计哲学与自然节奏升级](#1-导播设计哲学与自然节奏升级)
2. [5幕式导演分镜总表 (5-Scene Shot-by-Shot Master Table)](#2-5幕式导演分镜总表-5-scene-shot-by-shot-master-table)
3. [中英双语配音文案与停顿标点 (Bilingual Voiceover Scripts)](#3-中英双语配音文案与停顿标点-bilingual-voiceover-scripts)
4. [场景五终章 Callout 与链接规范](#4-场景五终章-callout-与链接规范)
5. [音效与背景音乐情绪曲线 (Audio & Sound Design)](#5-音效与背景音乐情绪曲线-audio--sound-design)
6. [FocusFlow DSL 映射与 Studio 运行参数](#6-focusflow-dsl-映射与-studio-运行参数)

---

## 1. 导播设计哲学与自然节奏升级

- **为什么解除 45 秒硬性限制？**  
  固定 45 秒由于场景较多（5 幕），每幕平均只有 8~9 秒，配音语速偏快、镜头移动稍显仓促。升级为 **56 秒自然呼吸节奏** 后：
  - **痛点与新范式（前两幕共 16 秒）**：给观众充足的认知时间，看清传统 PPT、白板、录屏的对比缺陷与活画布破局点。
  - **活画布随时暂停探索（第四幕 13 秒）**：留出充足的“光标模拟悬停 + 实时面板展开”动效时间，让“现场答疑神器”的体验落到实处。
  - **终局收尾（第五幕 15 秒）**：镜头大拉远时具有史诗感与开阔感，让上方的**官网域名与 GitHub 仓库徽章**充分定格展现在听众眼前。

---

## 2. 5幕式导演分镜总表 (5-Scene Shot-by-Shot Master Table)

| 镜头编号 | 时间轴 (Timecode) | 时长 | 镜头景别与运镜 (Camera Kinematics) | 画面焦点与高亮动作 (Visual Actions) | 核心讲解主题 (Theme) |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **Scene 1** | `00:00 - 00:07.5` | 7.5s | **左侧痛点特写锁定**<br>`zoom: 2.05, x: -25.8, y: -24.8`<br>`duration: 1.4s, cubic-bezier` | 镜头开场精准框选左上角红调警示面板 **The Broken Past**。PPT 离散切片、静态白板信息过载、屏幕录屏死像素三条卡片清晰锐利呈现。 | **传统演示的三大困境**<br>(The Broken Past Dilemma) |
| **Scene 2** | `00:07.5 - 00:16.0` | 8.5s | **平滑向右大横移 (Pan Right)**<br>`zoom: 1.85, x: 20.0, y: -24.8`<br>`duration: 1.8s, smooth-ease` | 镜头如轨道车般丝滑右移，对准蓝调面板 **The Living Future**。4 大新范式指标（60fps、视锥聚焦、随时打断、<5MB 离线）发光激活。 | **FocusFlow 活画布新范式**<br>(The Living Canvas Paradigm) |
| **Scene 3** | `00:16.0 - 00:28.0` | 12.0s | **下潜俯冲 ➔ 前两联卡片**<br>`zoom: 1.95, x: -18.0, y: 15.0`<br>`duration: 1.8s` | 镜头下移聚焦 Card 01 与 Card 02。<br>**Card 01**：16:9 动态视锥取景框锁定核心支付集群；<br>**Card 02**：相机贝塞尔航道曲线发光流动，展示全景到局部无级推进。 | **视锥取景与空间连续**<br>(Camera Framing & Spatial Continuity) |
| **Scene 4** | `00:28.0 - 00:41.0` | 13.0s | **横移特写 ➔ 检查器深潜**<br>`zoom: 2.10, x: 9.4, y: 15.0`<br>`duration: 1.6s` | 镜头锁定 Card 03。橙色 `❚❚ 演播随时暂停` 呼吸闪烁；鼠标悬停探查 `srv_payment_core`，实时展开 gRPC 协议与下游链路面板。 | **活画布交互与从容答疑**<br>(Living Canvas & Real-time Inspection) |
| **Scene 5** | `00:41.0 - 00:56.0` | 15.0s | **右移交付 ➔ 史诗级大拉远**<br>`t=41s`: `zoom: 2.0, x: 25.0, y: 15.0`<br>`t=47s`: 快速拉远至 `zoom: 1.0, x: 0, y: 0` | **Card 04**：1080P MP4 视频与 <5MB 单文件 HTML 徽章高亮；随后镜头飞速拉远，3840×2160 全景底图完全展现；**正上方醒目展开官网与 GitHub 链接气泡**。 | **双模交付、官方地址与全景终章**<br>(Dual Delivery, Links & Grand Finale) |

---

## 3. 中英双语配音文案与停顿标点 (Bilingual Voiceover Scripts)

> 💡 标点符号与斜杠（`/`）标示解说员的自然呼吸节点（约停顿 0.3~0.5 秒），语速沉稳有力、娓娓道来。

### 🇨🇳 中文版解说词（严谨科技感·自然语速，全篇共 360 字）

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

### 🌐 英文版解说词（Silicon Valley Tech Lead 声线，共 146 词）

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

## 4. 场景五终章 Callout 与链接规范

在场景五终局收尾拉远时，正上方（中央靠顶位置）动态激活 **官方主呼出气泡（`co-finale-cta`）**：

- **组件 ID**：`co-finale-cta`
- **主题色**：`blue` / `pink`
- **物理锚点**：`left: 1080px, top: 160px`（宽度 1080px）
- **中文内容**：
  - **主标题**：`FocusFlow Studio · 活画布演播引擎`
  - **链接副标**：`🌐 官方在线体验: focusflow.tumio.site  •  ⭐ GitHub 开源仓库: github.com/tumio-ltd/focusflow`
- **英文内容**：
  - **主标题**：`FocusFlow Studio · The Living Canvas Engine`
  - **链接副标**：`🌐 Live Website: focusflow.tumio.site  •  ⭐ GitHub Repo: github.com/tumio-ltd/focusflow`

---

## 5. 音效与背景音乐情绪曲线 (Audio & Sound Design)

```
00:00           00:07.5         00:16.0                 00:28.0                 00:41.0         00:56.0
  │               │               │                       │                       │               │
  ▼               ▼               ▼                       ▼                       ▼               ▼
[ Muted Hum ] ─► [ Synth Rise ] ─► [ Flowing Beats ] ───► [ Spacebar Click & Pop ] ─► [ Epic Drone ] ─► [ Reverb Fade ]
 (沉闷低频·痛点)   (明亮上扬·新范式)   (科技节拍·运镜推进)       (空格敲击与卡片弹出·答疑)   (双模交付·大拉远)  (余音绕梁·Logo定格)
```

- **00:00.000 (Scene 1)**：低沉的电磁底噪与微弱纸张切片声，凸显传统工具的陈旧感。
- **00:07.200 (Scene 2 转场)**：清脆通透的 **Future Synth Sweep (合成器能量掠过音)**，镜头向右横移，大号蓝色新范式激活。
- **00:15.800 (Scene 3 下潜)**：空气动力学 **Camera Whoosh (平滑下潜推轨音)** + **Focus Shutter (快门锁定微声)**。
- **00:27.800 (Scene 4 暂停)**：逼真清脆的 **Mechanical Spacebar Tap (机械键盘空格声)** + **Bubble Pop (检查器气泡弹出音)**。
- **00:40.800 (Scene 5 交付)**：**Digital Chime (交付完成声)**，随后紧接 **Cinema Zoom Out Whoosh (宏大长拉远推拉音)**，旋律达到最宽广和弦，第 56 秒利落收尾。

---

## 6. FocusFlow DSL 映射与 Studio 运行参数

- **模板文件**：`apps/studio/src/templates/tpl-focusflow-workflow.ts`
- **分幕结构**：
  1. `scene-1-broken-past`: `duration: 7500ms`, `zoom: 2.05, x: -25.8, y: -24.8`
  2. `scene-2-living-future`: `duration: 8500ms`, `zoom: 1.85, x: 20.0, y: -24.8`
  3. `scene-3-frustum-and-continuity`: `duration: 12000ms`, `zoom: 1.95, x: -18.0, y: 15.0`
  4. `scene-4-living-interactive`: `duration: 13000ms`, `zoom: 2.10, x: 9.4, y: 15.0`
  5. `scene-5-dual-delivery-finale`: `duration: 15000ms`, `zoom: 1.0, x: 0, y: 0`
- **总计时长**：56,000 毫秒（56.0 秒）。
