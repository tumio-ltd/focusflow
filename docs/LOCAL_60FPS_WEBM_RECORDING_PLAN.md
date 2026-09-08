# FocusFlow 本地 60FPS WebM 高清视频录制技术方案与实施规划

> **文档版本**: 1.0.0  
> **更新时间**: 2026-09-07  
> **归档路径**: `docs/LOCAL_60FPS_WEBM_RECORDING_PLAN.md`  
> **所属模块**: `@focusflow/studio` (Stage 5 导出中心 & 受众全屏演播)  
> **运行环境**: Chromium (Chrome / Edge 107+), WebKit (Safari), 现代桌面浏览器

---

## 目录
1. [方案背景与设计目标](#1-方案背景与设计目标)
2. [用户关键交互与隐私说明](#2-用户关键交互与隐私说明)
3. [核心技术选型与合流机制](#3-核心技术选型与合流机制)
4. [系统架构与时序拓扑](#4-系统架构与时序拓扑)
5. [详细设计与模块改动](#5-详细设计与模块改动)
   - [5.1 核心录制服务层 (Core Video Recording Service)](#51-核心录制服务层-core-video-recording-service)
   - [5.2 受众全屏演播呈现层 (Audience & Recording HUD)](#52-受众全屏演播呈现层-audience--recording-hud)
   - [5.3 工作区调度与导出中心 (Studio Orchestration & Export)](#53-工作区调度与导出中心-studio-orchestration--export)
   - [5.4 国际化与双语词典扩展 (i18n)](#54-国际化与双语词典扩展-i18n)
6. [开发任务细分 Checklist](#6-开发任务细分-checklist)
   - [Phase 1: 底层捕获与录制服务改造 (canvasRecorder.ts)](#phase-1-底层捕获与录制服务改造-canvasrecorderts)
   - [Phase 2: 受众全屏演播模态框升级 (AudienceModal.tsx)](#phase-2-受众全屏演播模态框升级-audiencemodaltsx)
   - [Phase 3: 导出中心与应用主入口装配 (ExportModal.tsx & App.tsx)](#phase-3-导出中心与应用主入口装配-exportmodaltsx--apptsx)
   - [Phase 4: 国际化双语词条扩充 (zh/export.ts & en/export.ts)](#phase-4-国际化双语词条扩充-zhexportts--enexportts)
   - [Phase 5: 自动化回归测试与 Mock 构建 (TC574)](#phase-5-自动化回归测试与-mock-构建-tc574)
   - [Phase 6: 全量类型检查、编译与真机验证](#phase-6-全量类型检查编译与真机验证)
7. [验证计划与测试矩阵](#7-验证计划与测试矩阵)
8. [后续待解决问题与优化方向 (Roadmap & Backlog)](#8-后续待解决问题与优化方向-roadmap--backlog)
   - [8.0 优先级评估矩阵与分阶段实施路线图 (Priority Matrix & Roadmap)](#80-优先级评估矩阵与分阶段实施路线图-priority-matrix--roadmap)
   - [8.1 [P0 阻断] CPU 异常高占用与长时间满载泄漏专项治理](#81-p0-阻断-cpu-异常高占用与长时间满载泄漏专项治理)
   - [8.2 [P1 紧急] 分幕 AI 提词与外部上传音频的冲突治理与优先级调度](#82-p1-紧急-分幕-ai-提词与外部上传音频的冲突治理与优先级调度)
   - [8.3 [P1 速赢] 导出中心英文语言环境下的中文残留清理与彻底国际化](#83-p1-速赢-导出中心英文语言环境下的中文残留清理与彻底国际化)
   - [8.4 [P2 重要] 录制时 HUD 进度显示与“无痕出片”隔离方案 (Document PiP / Region Capture)](#84-p2-重要-录制时-hud-进度显示与无痕出片隔离方案-document-pip--region-capture)
   - [8.5 [P2 中期] 播放控制栏全场景三态统一规范 (Studio / Audience / Standalone HTML / Video)](#85-p2-中期-播放控制栏全场景三态统一规范-studio--audience--standalone-html--video)
   - [8.6 [P3 远期] 浏览器离线 TTS 音频录制与实体音频演进 (WASM 纯前端离线模型)](#86-p3-远期-浏览器离线-tts-音频录制与实体音频演进-wasm-纯前端离线模型)

---

## 1. 方案背景与设计目标

FocusFlow 的演播不仅支持在浏览器内实时交互查看，还承载着**高管汇报、对外技术分享与视频内容制作（B站/YouTube/技术博客）**的核心需求。
目前单文件 `.html` 与工程 `.zip` 归档已实现 100% 离线自治，但视频导出功能此前仅处于“UI 占位 + 骨架函数”阶段。

本方案旨在打通基于浏览器原生 `navigator.mediaDevices.getDisplayMedia` 标签页捕获与 `MediaRecorder` 硬件加速 VP9 编码器，实现：
- **纯客户端、0 后端依赖、100% 本地隐私安全**；
- **60FPS 硬件加速运镜、平滑流光动效与旁白台词音画无损合流**；
- **从点击【启动全自动录制】到【自动播放 ➔ 自动收尾 ➔ 本地下载 .webm】全流程无人值守一键出片**。

---

## 2. 用户关键交互与隐私说明

> [!IMPORTANT]
> **屏幕共享交互与隐私提示**：
> 1. **原生授权引导**：调用 `navigator.mediaDevices.getDisplayMedia` 时，浏览器将弹出系统原生的“选择要共享的标签页”弹窗。我们通过配置参数 `{ preferCurrentTab: true, selfBrowserSurface: 'include' }` 引导现代 Chromium 浏览器自动优先聚焦当前 FocusFlow 标签页，用户仅需点击一次“共享”确认即可。
> 2. **纯净演示环境**：录制启动瞬间，系统自动唤起 **受众全屏演示模式（AudienceModal）**：彻底隐藏所有编辑器面板、工具栏、时间轴与侧边属性栏，仅呈现纯粹的架构图视口与连贯运镜。
> 3. **轻量录制 HUD**：右上方提供半透明轻量 HUD（带红色呼吸灯 `🔴 REC 00:05 / 00:18`、分幕指示器与 `[提前结束并下载]` 快捷按钮）；底部控制浮岛在录制态默认自动隐去，确保画面零遮挡。
> 4. **自动定格与下载**：当演播到达最后一幕且驻留时长结束时，系统自动发送停止录制指令，将视频分片封装为标准 `Blob` 并自动唤起本地下载（`${工程标题}-60fps.webm`），随后无缝退出演播模式回到编辑区。

---

## 3. 核心技术选型与合流机制

- **画面采集**：采用 `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser', frameRate: { ideal: 60, max: 60 } }, audio: true, preferCurrentTab: true, selfBrowserSurface: 'include' } as any)` 捕获标签页画面。
- **音频合流**：优先通过 `getDisplayMedia` 捕获标签页音频轨；若工程配置了已生成的 TTS 合成音频或背景音轨，自动将音频与视频轨道合并输入 `MediaRecorder`，实现无延迟音画同步。
- **编码器与比特率**：首选 `video/webm;codecs=vp9`（高质量、8,000,000 bps 比特率），若当前浏览器不支持 VP9，则优雅回退至 `video/webm`。
- **防中断与异常兜底**：
  - 监听流中的 `videoTrack.onended` 事件（若用户点击浏览器原生悬浮条的“停止共享”，触发安全收尾并保存已录制内容，杜绝内存泄漏或数据丢失）；
  - 录制期间支持 `ESC` 或点击 `提前结束` 立即终止并导出。

---

## 4. 系统架构与时序拓扑

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户
    participant ExportModal as 导出中心 (ExportModal)
    participant App as 应用主调度 (App.tsx)
    participant Recorder as 录制引擎 (canvasRecorder.ts)
    participant Audience as 受众演播 (AudienceModal)
    participant Player as 播放内核 (FocusFlowPlayer)

    User->>ExportModal: 打开导出中心 ➔ 点击【启动全自动录制】
    ExportModal->>App: 触发 onStartRecording()
    App->>Recorder: startTabRecording({ fps: 60, audio: true })
    Recorder->>User: 唤起浏览器原生 getDisplayMedia 授权框
    User-->>Recorder: 确认共享当前标签页
    Recorder-->>App: 返回 RecordingSession (含 MediaRecorder & Stream)
    App->>ExportModal: 关闭导出弹窗
    App->>Audience: 唤起 AudienceModal (isRecording: true, initialSceneIndex: 0)
    Audience->>Player: 启动全自动播放 (play)
    Note over Audience,Player: 底部浮岛隐藏，右上角显示 🔴 REC 呼吸灯与录制秒数
    Player->>Audience: 触发 onSceneChange / TTS 联动发声
    Player->>Audience: 演播全部分幕播放完毕 (ended)
    Audience->>App: 触发 onFinishRecording()
    App->>Recorder: session.stop()
    Recorder-->>App: 返回完整 WebM Blob
    App->>Recorder: downloadVideoBlob(blob, 'project-60fps.webm')
    App->>Audience: 退出全屏演播，恢复工作区
    App->>User: 弹出提示：🎉 60FPS WebM 高清视频已导出！
```

---

## 5. 详细设计与模块改动

### 5.1 核心录制服务层 (Core Video Recording Service)

#### [MODIFY] [canvasRecorder.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts)
- 将原有空的 `startDomRecording` 重构升级为 `startTabRecording(options?: TabRecordingOptions): Promise<RecordingSession>`：
  - 内部调用 `getDisplayMedia` 取得当前标签页视轨与音轨；
  - 实例化 `MediaRecorder`，采集 `video/webm;codecs=vp9` 数据分片；
  - 启动秒级计时器，通过 `onTick(elapsedSeconds)` 驱动外部 HUD 更新；
  - 提供 `session.stop()`：关闭所有流音视频轨道，封装并返回完整 `Blob`；
  - 提供 `session.cancel()`：释放媒体流并丢弃未完成数据；
  - 保留并增强 `downloadVideoBlob(blob, filename)` 下载辅助函数。

---

### 5.2 受众全屏演播呈现层 (Audience & Recording HUD)

#### [MODIFY] [AudienceModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/AudienceModal.tsx)
- Props 接口扩展：
  ```typescript
  export interface AudienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    dsl: FocusFlowDSL;
    initialSceneIndex?: number;
    isRecording?: boolean;
    recordingElapsed?: number;
    onFinishRecording?: () => void;
  }
  ```
- 渲染逻辑适配：
  - 当 `isRecording === true` 时：
    - 底部悬浮控制条自动隐藏；
    - 右上方注入半透明极简录制条：包含红色呼吸圆点、`REC` 标记、录制计时器（`MM:SS`）与 `完成录制并保存` 按钮；
    - 播放内核监听 `ended` 事件后，自动触发 `onFinishRecording?.()`。

---

### 5.3 工作区调度与导出中心 (Studio Orchestration & Export)

#### [MODIFY] [ExportModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/ExportModal.tsx)
- 将【客户端视频录制】Tab 内的【启动全自动录制】按钮与 `onStartRecording` 事件绑定；
- 增加用户友好提示说明（即将弹出浏览器标签页共享授权）。

#### [MODIFY] [App.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx)
- 维护录制生命周期状态：
  ```typescript
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingSessionRef = useRef<RecordingSession | null>(null);
  ```
- 实现 `handleStartVideoRecording`：
  1. 调用 `startTabRecording` 唤起权限；
  2. 若用户取消，温和提示并不抛出未捕获异常；
  3. 若授权成功，关闭 `ExportModal`，打开 `AudienceModal` 并置 `isRecordingVideo = true`；
  4. 演播结束后在 `handleFinishVideoRecording` 中调用 `session.stop()`，触发 `downloadVideoBlob`，重置状态。

---

### 5.4 国际化与双语词典扩展 (i18n)

#### [MODIFY] [zh/export.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/locales/zh/export.ts) & [en/export.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/locales/en/export.ts)
- 补充中英文词条：
  - `recordingInProgress`: '正在录制 60FPS 演播...' / 'Recording 60FPS Presentation...'
  - `finishAndSave`: '完成并保存视频' / 'Finish & Save Video'
  - `recordPermDenied`: '未授予标签页屏幕录制权限' / 'Screen capture permission was not granted'
  - `recordSuccess`: '🎉 60FPS WebM 高清视频已生成并开始下载！' / '🎉 60FPS WebM video generated and download started!'

---

## 6. 开发任务细分 Checklist

### Phase 1: 底层捕获与录制服务改造 (canvasRecorder.ts)
- [x] 1.1 定义 `TabRecordingOptions`（含 `fps`, `audio`, `onTick`, `onStreamEnded`）与 `RecordingSession` 接口
- [x] 1.2 重构 `startTabRecording`：封装 `navigator.mediaDevices.getDisplayMedia` 标签页捕获参数
- [x] 1.3 配置 `MediaRecorder` 硬件加速参数（优先 `video/webm;codecs=vp9` 8Mbps，回退 `video/webm`）
- [x] 1.4 实现流异常熔断保护（监听 `videoTrack.onended` 自动收尾，防止用户外部取消导致挂起）
- [x] 1.5 完善分片收集机制与 `session.stop()` Promise 封装
- [x] 1.6 增强 `downloadVideoBlob` 命名规则（去除特殊字符，拼接 `${title}-60fps.webm`）

### Phase 2: 受众全屏演播模态框升级 (AudienceModal.tsx)
- [x] 2.1 扩展 `AudienceModalProps`（新增 `isRecording`, `recordingElapsed`, `onFinishRecording`）
- [x] 2.2 录制模式视觉控制：录制进行时自动隐藏底部悬浮控制条
- [x] 2.3 设计并嵌入右上角极简 HUD（红点呼吸灯、格式化时间戳 `00:00`、完成保存按钮）
- [x] 2.4 挂载 Player `ended` 事件监听器：最后一幕播放完成时自动触发 `onFinishRecording`
- [x] 2.5 键盘 `ESC` 与退出按钮防撕裂保护：退出时安全调用 `onFinishRecording` 保全已有录制切片

### Phase 3: 导出中心与应用主入口装配 (ExportModal.tsx & App.tsx)
- [x] 3.1 检查并绑定 `ExportModal.tsx` 中【启动全自动录制】按钮触发 `onStartRecording`
- [x] 3.2 在 `App.tsx` 中声明 `isRecordingVideo`、`recordingElapsed` 与 `recordingSessionRef`
- [x] 3.3 实现 `handleStartVideoRecording`：异步请求录制、关闭导出弹窗、打开受众演播
- [x] 3.4 实现 `handleFinishVideoRecording`：调用 `session.stop()`、触发本地下载、退出全屏恢复编辑区
- [x] 3.5 完善异常捕获与友好 Toast/Alert 反馈

### Phase 4: 国际化双语词条扩充 (zh/export.ts & en/export.ts)
- [x] 4.1 在 `apps/studio/src/locales/zh/export.ts` 中添加录制 HUD、授权与下载成功词条
- [x] 4.2 在 `apps/studio/src/locales/en/export.ts` 中添加对应英文国际化翻译
- [x] 4.3 校验全站多语言热重载与无缺失键警告

### Phase 5: 自动化回归测试与 Mock 构建 (TC574)
- [x] 5.1 在 `apps/studio/e2e/` 中为 `stage5-audio-sync.spec.ts` 新增独立测试函数 `verifyLocalWebmVideoRecording`
- [x] 5.2 在 Playwright 环境中提供合成 `getDisplayMedia` 模拟流或利用浏览器端录制触发机制
- [x] 5.3 编写测试用例 `TC574: 验证导出中心唤起本地 60FPS WebM 高清录制与演播自动合流`
- [x] 5.4 遵循全局规则：将 E2E 测试逻辑抽取为独立 `async` 函数并由 `it()` / `test()` 调用

### Phase 6: 全量类型检查、编译与真机验证
- [x] 6.1 运行 TypeScript 严格类型检查 (`pnpm --filter @focusflow/studio build`)，确保 0 错误
- [x] 6.2 运行 Playwright 自动化回归套件验证全流程通行
- [x] 6.3 编写完成后的技术落地总结与更新记录

---

## 7. 验证计划与测试矩阵

### 自动化测试 (Automated Tests)
- **命令**: `pnpm --filter @focusflow/studio exec playwright test -g "TC574"`
- **验证项**:
  1. 导出中心 Tab 点击与启动录制按钮状态；
  2. 进入演播模态框后录制 HUD 正常挂载与呼吸灯激活；
  3. 演播自动推进且底部操作岛不出现；
  4. 录制结束时成功生成 Blob 并触发下载管道。

### 手动实机体验与画质验证 (Manual Verification)
1. 在 Chrome/Edge 浏览器打开 `http://localhost:5174/`；
2. 点击顶栏【导出】➔ 选择【客户端视频录制】➔ 点击【启动全自动录制】；
3. 系统弹出标签页共享提示，选择当前 FocusFlow Studio 标签页并点击“共享”；
4. 观察全屏演示模式自动从第 1 幕播放至最后一幕，右上角录制计时器均匀递增；
5. 自动下载生成的 `.webm` 视频文件，使用 VLC / QuickTime 打开，确认：
   - 画面帧率稳定 60FPS，无水印、无侧边栏干扰；
   - 运镜缩放平滑、流光连线清晰；
   - 语音旁白音频同步合入。

---

## 8. 后续待解决问题与优化方向 (Roadmap & Backlog)

### 8.0 优先级评估矩阵与分阶段实施路线图 (Priority Matrix & Roadmap)

结合 **“重要性（严重程度/对核心功能的影响）”** 与 **“开发难度（投入产出比 ROI）”**，后续待办问题严格按如下优先级降序推进：

| 优先级 | 序号 | 待解决问题与优化项 | 重要性 | 难度 | 阶段建议 | 核心理由 / 预期收益 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0 (阻断)** | **8.1** | **CPU 异常高占用与长时间满载泄漏专项治理** | 🔴 阻断级 | 🟡 中等 | **第一阶段 (立即执行)** | **系统稳定性底座**。300%~400% 多核满载且不回落属于典型的内核资源泄漏（未关闭的 AudioContext 与未彻底终止的 MediaStream），不解决将拖垮浏览器并导致后续所有功能卡死。 |
| **P1 (紧急)** | **8.2** | **分幕 AI 提词与外部上传音频的冲突治理** | 🔴 严重逻辑Bug | 🟢 较低 | **第一阶段 (立即执行)** | **解决“所听非所录”的严重体验硬伤**。消除录制时的双重刺耳杂音，建立音频互斥主导规则，投入少、见效快。 |
| **P1 (速赢)** | **8.3** | **导出中心英文环境下的中文残留清理与彻底国际化** | 🟡 体验缺陷 | 🟢 极低 | **第一阶段 (立即执行)** | **低垂果实 (Quick Win)**。纯前端文本与 i18n 词条补全，耗时短，能快速彻底消除英文界面夹杂中文的违和感。 |
| **P2 (重要)** | **8.4** | **录制时 HUD 进度显示与“无痕出片”隔离方案** | 🟡 体验升级 | 🟡 中等 | **第二阶段** | **录制可控感提升**。通过创新的 **Document Picture-in-Picture（文档画中画）** 独立系统浮窗，实现“屏幕可见进度 + 录制视频 100% 绝对纯净”。 |
| **P2 (中期)** | **8.5** | **播放控制栏全场景三态统一规范** | 🟡 设计系统规范 | 🟠 中高 | **第二阶段** | **视觉与交互规范统一**。涉及 `@focusflow/player` 下沉通用组件与多端适配，适合在系统稳定后作为专项设计重构推进。 |
| **P3 (远期)** | **8.6** | **离线 TTS 实体音频生成（WASM 离线模型）** | ⚪ 演进增强 | 🔴 较高 | **第三阶段 (中远期)** | **当前提示已闭环**。黄色提示横幅已清晰告知沙箱限制并引导云端 TTS/麦克风；纯离线引入 WebAssembly ONNX 模型体积大、研发周期长，适合中远期演进。 |

---

### 8.1 [P0 阻断] CPU 异常高占用与长时间满载泄漏专项治理 (CPU High Load & Resource Leakage)

- **严重故障现象与实机观测数据**：
  - **日常编辑常态高载**：Studio 在浏览器中静止运行时，CPU 使用率长期维持在 > 100%（单核完全跑满）。
    - *实机命令行监控取证 (`ps -Ao pid,pcpu,comm`)*：检测到当前系统中的渲染进程 `Google Chrome Helper (Renderer)`（如 PID 3900）CPU 占用率长期高达 **106.1%**，且已累计吞噬超过 **54 分钟** 的 CPU 核心计算时间（`54:47.89`），在静止编辑时风扇持续高速运转；
  - **关键操作峰值飙升**：在生成 TTS 语音合成或进行视频录制编织时，CPU 瞬间飙升至 **300% ~ 400%**（3~4 个 CPU 核心完全满载，机身瞬间发烫）；
  - **操作收尾严重泄漏**：录制完成或停止演播后，CPU 占用率**长时间停留在高位无法回落**，必须彻底关闭该浏览器标签页或杀死浏览器进程，CPU 占用才会清零释放。

---

#### 4 大核心根因深度解剖（精确到文件与代码行号）

1. **根因 1：录制混音 `AudioContext` 实例游离泄漏与媒体轨未硬切断**
   - **涉及文件与行号**：
     - [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx#L440-L457)
     - [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx#L412-L433)
     - [`apps/studio/src/services/canvasRecorder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts#L94-L120)
   - **机制解剖**：
     - 在 `App.tsx` 的 `handleStartVideoRecording`（L445-L453）中，为了将时间轴中的工程音轨混入录制视频，执行了 `const ctx = new AudioCtx();` 并创建了 `createMediaStreamDestination()` 节点；
     - **致命疏漏**：这个新创建的 `ctx` 没有保存在任何 `ref` 或生命周期管理器中！在 `handleFinishVideoRecording`（L412-L433）结束录制时，**从未调用 `ctx.close()`**；
     - 根据 Web Audio 规范，每个未关闭的 `AudioContext` 在底层都会在 macOS CoreAudio / Windows WASAPI 音频服务中永久持有独立的硬件驱动回调线程（Hardware Audio Pull Thread）。一旦创建，该底层系统线程便以 44.1kHz/48kHz 不断拉取音频缓冲区，永远无法被 V8 GC 回收，导致录制即使结束，音频线程依然在底层死循环运转，造成高基线 CPU 锁定；
     - 同时，`canvasRecorder.ts` 在部分意外退出或外部中断路径下，`displayStream.getTracks()` 未能强制执行 `track.stop()` 并清空引用，导致 Chromium 的操作系统级屏幕捕获管道（Screen Capture Service）仍在后台持续抽取桌面图像。

2. **根因 2：TTS 合成与音频解码上下文失控常驻与无空闲休眠机制**
   - **涉及文件与行号**：
     - [`apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts#L95-L97)
     - [`apps/studio/src/services/audio/tts/UserKeyOpenAITTSProvider.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/UserKeyOpenAITTSProvider.ts#L86-L92)
     - [`apps/studio/src/services/audio/audioDecoder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/audioDecoder.ts#L6-L17)
   - **机制解剖**：
     - 在 `aiTtsSynthesizer.ts`（L96）中，每次执行多幕批量合成都会无条件 `new AudioCtx()`。虽然在函数末尾有 `ctx.close()`，但该函数**缺乏 `try...finally` 安全边界**。一旦循环内 TTS 接口网络失败、分幕解析抛错或解码异常退出，`ctx.close()` 将被完全跳过，造成音频线程永久游离泄漏；
     - 在 `UserKeyOpenAITTSProvider.ts`（L86-L92）中，`ctx.close()` 位于 `try` 块内，若 `ctx.decodeAudioData(arrayBuffer)` 失败跳入 `catch`，`ctx` 同样永远不会被关闭；
     - 在 `audioDecoder.ts`（L6-L17）中，导出的全局单例 `globalAudioCtx` 在首次调用 `getAudioContext()` 时初始化，并无脑执行 `globalAudioCtx.resume()`。**全局没有任何空闲休眠看门狗（Idle Suspend Watchdog）**。一旦用户导入过音频或进行过波形解析，该上下文永久处于 `'running'` 状态，持续占用系统声卡调度资源。

3. **根因 3：高分屏 Retina (3K/4K) 未加分辨率上限约束与 VP9 纯 CPU 软件编码过载**
   - **涉及文件与行号**：
     - [`apps/studio/src/services/canvasRecorder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts#L40-L50)
     - [`apps/studio/src/services/canvasRecorder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts#L68-L86)
   - **机制解剖**：
     - 在 `canvasRecorder.ts`（L40-L49）调用 `navigator.mediaDevices.getDisplayMedia` 时，仅指定了 `frameRate: { ideal: fps, max: fps }`，**完全未约束最大宽高（`width` / `height`）**；
     - 在现代高分屏设备（例如 MacBook Pro 14/16寸 Retina 屏幕，物理分辨率高达 `3024 x 1964` 或 `2880 x 1800`）上全屏录制时，浏览器以全量物理分辨率捕获超高像素流；
     - 在 L73-L86 中，配置了 `video/webm;codecs=vp9,opus` 且码率达到 `8000000` (8Mbps)。Chromium 的底层 WebM 编码器对 3K/4K 60FPS 的 VP9 往往无法获得全硬件编码加速，降级为 multi-threaded 纯 CPU 软件编码（libvpx）。3024x1964 @ 60FPS 极短时间内即可把 4~8 个 CPU 核心瞬间压榨至 **300%~400%** 满载，引发风扇狂转与系统掉帧。

4. **根因 4：画布静态编辑态无限 CSS 关键帧动画与复合滤镜触发重绘风暴 (Repaint & Rasterize Storm)**
   - **涉及文件与行号**：
     - [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css#L165-L174)
     - [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css#L177-L191)
     - [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css#L201-L210)
   - **机制解剖**：
     - 流光动效路径 `.ff-stream` 挂载了 `@keyframes ffStreamMotion 1.5s linear infinite`；
     - 呼吸锚点 `.ff-dot.active` 挂载了 `@keyframes ffDotPulse 1.8s ease-in-out infinite alternate`，并在关键帧中叠加了 `filter: drop-shadow(0 0 8px currentColor)`；
     - 在 Chromium / Blink 渲染内核中，**带有动态 drop-shadow 复合滤镜的 SVG 元素无法被 GPU 合成器（Compositor）进行静态纹理缓存**。Chromium 的光栅化工作线程池（实测参数 `--num-raster-threads=4`）必须以每秒 60 次的频率重新对整张 SVG 画布执行重绘（Repaint）与光栅化（Rasterize）；
     - 这就是为什么即使创作者在 Studio 中停下鼠标完全不进行任何操作，Renderer 渲染进程的 CPU 也永久稳定在 **> 100%** 的本质物理根因！

---

#### 5 步详细落地治理方案与实施 Checklist

- [ ] **步骤 1：录制混音上下文生命周期绑定与全链路硬终止 (Hard Teardown Protocol)**
  - 在 [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 中新增专用上下文引用 `mixingAudioCtxRef = useRef<AudioContext | null>(null)`；
  - 在 `handleStartVideoRecording` 创建混流上下文时存入该 ref；
  - 在 `handleFinishVideoRecording` 中通过 `finally` 块强制执行硬终止与彻底置空：
    ```typescript
    if (mixingAudioCtxRef.current && mixingAudioCtxRef.current.state !== 'closed') {
      try {
        await mixingAudioCtxRef.current.close();
      } catch (e) {
        console.warn('[FocusFlow] 释放录制混音上下文异常:', e);
      } finally {
        mixingAudioCtxRef.current = null;
      }
    }
    ```
  - 在 [`apps/studio/src/services/canvasRecorder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts) 的 `stopTracks` 中，确保对 `displayStream.getTracks()` 进行无死角遍历：切断 `track.stop()`、置 `track.enabled = false` 并清空 `track.onended = null`，斩断操作系统级捕获管道。

- [ ] **步骤 2：Web Audio 上下文单例池化、即用即关与空闲休眠看门狗 (Idle Suspend Watchdog)**
  - 在 [`apps/studio/src/services/audio/audioDecoder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/audioDecoder.ts) 中增加空闲自动挂起定时器：
    ```typescript
    let idleSuspendTimer: ReturnType<typeof setTimeout> | null = null;
    export function scheduleAudioCtxIdleSuspend(idleDelayMs = 2500) {
      if (idleSuspendTimer) clearTimeout(idleSuspendTimer);
      idleSuspendTimer = setTimeout(() => {
        if (globalAudioCtx && globalAudioCtx.state === 'running') {
          globalAudioCtx.suspend().catch(() => {});
        }
      }, idleDelayMs);
    }
    ```
  - 每次解码完成后自动调用 `scheduleAudioCtxIdleSuspend()`，无音频播放 2.5 秒后自动释放 CoreAudio/WASAPI 系统声卡线程，恢复 0% 音频底噪 CPU；
  - 在 [`aiTtsSynthesizer.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts) 与 [`UserKeyOpenAITTSProvider.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/UserKeyOpenAITTSProvider.ts) 中，将所有临时 `AudioContext` 的创建与释放严格包裹在 `try ... finally { await ctx.close(); }` 中，杜绝任何异常路径泄漏。

- [ ] **步骤 3：录制捕获分辨率上限钳制与动态编码降级防过载 (Resolution Clamping & Codec Fallback)**
  - 在 [`apps/studio/src/services/canvasRecorder.ts`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/canvasRecorder.ts) 的 `getDisplayMedia` 中为视轨施加最大分辨率封顶约束（1080P 封顶）：
    ```typescript
    video: {
      displaySurface: 'browser',
      width: { max: 1920 },
      height: { max: 1080 },
      frameRate: { ideal: fps, max: fps },
    }
    ```
  - 防止 Retina 屏将 3K/4K 超大位图塞入编码器。对于超高分屏，降采样至 1080p 既能保证 60FPS 极佳清晰度，又能直接节省 **65% 以上** 的 CPU 编码算力；
  - 智能码率动态调优：在 1080p 下将码率设定在适宜的 5Mbps~6Mbps，避免多核纯软解满载（从 400% 降至 60%~100% 舒适区间）。

- [ ] **步骤 4：Studio 静态编辑态流光动效按需冻结与 GPU 硬件加速分层 (Idle Animation Pausing)**
  - 在 [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css) 中定义编辑态空闲挂起规则：
    ```css
    /* 当画布处于静态非播放编辑态时，挂起无限循环流光与呼吸脉冲 */
    .ff-canvas-idle .ff-stream,
    .ff-canvas-idle .ff-path-pulse,
    .ff-canvas-idle .ff-dot.active {
      animation-play-state: paused !important;
    }
    ```
  - 在 [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 主画布容器中，依据当前是否处于全屏演示或播放态（`isPlaying` / `isAudienceModalOpen`），动态赋予 `.ff-canvas-idle` 类名；
  - 为带有滤镜的节点添加 `will-change: transform; transform: translateZ(0);` 强制提升为独立 GPU 合成图层，彻底消除 Blink Raster Threads 的高频无用重绘，将日常静止 CPU 从 **106% 直接暴降至 < 5%**！

- [ ] **步骤 5：组件卸载与页面生命周期全局异常兜底钩子 (Unmount & Window Teardown Safe Guard)**
  - 在 [`apps/studio/src/App.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 挂载全局 `beforeunload` 与 `useEffect` 清理钩子：
    ```typescript
    useEffect(() => {
      const handleBeforeUnload = () => {
        if (recordingSessionRef.current) {
          try { recordingSessionRef.current.stop(); } catch {}
        }
        if (mixingAudioCtxRef.current) {
          try { mixingAudioCtxRef.current.close(); } catch {}
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        handleBeforeUnload();
      };
    }, []);
    ```
  - 确保即使用户强行刷新、误关页面或发生非受控崩溃，底层捕获流与音频上下文也能在微秒级时间内触发操作系统硬释放。

- [ ] **步骤 6：基于本地实测工具进行量化验证闭环 (Verification Benchmark Protocol)**
  - 工具脚本：[`apps/studio/scripts/measure-cpu.mjs`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/scripts/measure-cpu.mjs)；
  - 详细使用指南：[`apps/studio/scripts/README.md`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/scripts/README.md)；
  - 运行命令：`pnpm --filter @focusflow/studio test:cpu` 或 `node apps/studio/scripts/measure-cpu.mjs [秒数]`；
  - 判定标准：
    - 静态编辑态：从治理前 `106%~118%` 降至治理后 `< 5%~8%`；
    - 60FPS 录制态：从治理前 `300%~400%` 控制在治理后 `60%~100%`；
    - 录制收尾后：瞬间完全回落至 `< 5%`，彻底消除常驻泄漏。

---

### 8.2 [P1 紧急] 分幕 AI 提词与外部上传音频的冲突治理与优先级调度 (Audio Conflict & Mutual Exclusivity)
- **故障现象还原**：
  - 当工程中已有分幕台词并启用了 TTS 时，用户又在时间轴中上传了外部音频文件（如背景音乐 BGM 或真人完整配音）；
  - **录制过程中**：演播模式既触发了分幕 TTS（通过 `speechSynthesis` 发声），又通过 `<audio>` 播放了上传的音频，导致**耳机/扬声器中同时听到两路声音混叠刺耳**；
  - **视频导出后播放**：由于离线 TTS 无法被录制，而上传的音频走实体音轨被捕获，导致**最终导出的视频中只有上传的音频声，没有 TTS 旁白**。
- **根本原因剖析**：
  - 状态层与演播生命周期中缺乏**“音频模式优先级与互斥策略（Audio Source Priority & Mutual Exclusivity）”**；
  - `dsl.audio.tracks` 与分幕层级的 `scene.voiceoverScript` 并存时，没有明确哪一个是主声源，导致播放内核同时调度了两套互不感知的发声链路。
- **重构治理与任务 Checklist**：
  - [ ] **时间轴音频来源互斥选择模式**：
    - 明确区分音频工作模式：
      - **模式 A：分幕 AI 旁白模式（Per-Scene AI Voiceover）**：以各分幕的台词提词为核心，自动拉伸分幕驻留时长，驱动分幕 TTS 发声；
      - **模式 B：全局音频轨模式（Global Master Audio Track）**：以上传的音频文件或麦克风录制音频为主导，时间轴对齐音轨波形；
  - [ ] **上传外部音频时的防冲突守卫交互**：
    - 当用户在已有分幕台词的工程中上传外部音频时，弹出友好决策选择框：
      - *选项 1（作为伴奏 BGM）*：外部音频自动降为低音量背景音乐（例如 volume: 0.15），并允许 AI 旁白作为前景人声；
      - *选项 2（替代旁白母带）*：将上传的音频作为唯一主音轨，**自动静音/抑制分幕 TTS 实时触发**；
  - [ ] **AudienceModal 与 FocusFlowPlayer 播放调度严格防重叠**：
    - 在 `AudienceModal.tsx` 的 `playSceneTTS` 中增加守卫：
      ```typescript
      // 若当前存在已上传的全局主音频轨且非纯伴奏模式，严格禁止分幕 TTS 并行发声
      if (mainTrack?.url && !mainTrack.isBackgroundBGM) {
        return;
      }
      ```
    - 确保录制监听与最终导出视频在听觉体验上保持 100% 的“所听即所录（WYSIWYG）”。

---

### 8.3 [P1 速赢] 导出中心英文语言环境下的中文残留清理与彻底国际化 (Export Center English i18n Cleanup)
- **问题排查**：
  用户在英文语言环境下打开【导出演播工程 (Export Center)】弹窗时，发现部分辅助文本、提示信息仍显示为中文（存在硬编码或缺少对应的 `t()` 包装）。
- **待排查与治理范围**：
  - [ ] 顶部副标题：`纯前端编译输出 · 0 依赖 · 100% 本地离线隐私保护`；
  - [ ] HTML 导出卡片特性标签：`跨平台双击即看` / `60FPS 硬件加速运镜`；
  - [ ] 工程 ZIP 导出卡片内部说明与元数据提示；
  - [ ] 录制视频 Tab 内的提示文案、授权提醒、状态横幅以及导出中状态（`打包编译中...`、`已成功导出！`）；
  - [ ] 全量扫描 `apps/studio/src/components/modals/ExportModal.tsx`，确保所有可见文本 100% 使用 `t('key')`，并在 `zh/export.ts` 与 `en/export.ts` 中完成严格的一对一双语补齐。

---

### 8.4 [P2 重要] 录制时 HUD 进度显示与“无痕出片”隔离方案 (Document PiP / Region Capture)
- **核心诉求**：
  用户在录制视频时，希望能看到实时的录制时长进度（`REC 00:08`）与【提前完成并保存】按钮，以便掌控节奏和随时安全退出；**但该 HUD 绝对不能被录制到最终导出的视频画面里**。
- **技术可行性评估与创新方案**：
  由于 `navigator.mediaDevices.getDisplayMedia` 捕获的是当前标签页的**最终光栅化画面（Composited Surface）**，任何直接渲染在当前标签页 DOM 树内的常规 HTML 节点都必然会被录进视频中。
- **落地实施路线**：
  - [ ] **方案 A：文档画中画独立浮窗（Document Picture-in-Picture API，最佳方案 ⭐）**：
    - Chrome 111+ 提供了原生的 `window.documentPictureInPicture.requestWindow({ width, height })`；
    - 启动录制时，系统自动在桌面弹出一个轻量无边框的画中画独立微型控制窗口（显示 `🔴 REC 00:08` 和 `[完成保存]` 按钮）；
    - **由于画中画窗口是独立的 OS 顶层窗口，物理上脱离当前标签页**，`getDisplayMedia` 捕获当前标签页时，录制视频中 **100% 绝对纯净无任何 HUD**，而用户的屏幕上始终悬浮着可操作的控制浮窗；
    - 若用户点击浮窗内的 `[完成保存]` 或关闭浮窗，主标签页立即安全收尾并触发下载；
  - [ ] **方案 B：区域裁剪捕获（Region Capture API）**：
    - 利用 Chrome 104+ 的 `CropTarget.fromElement(viewportElement)`；
    - 仅将捕获视口绑定至内层的纯画布容器，将 HUD 放在画布外层侧边，通过硬件级裁剪保证外层 HUD 不被录入；
  - [ ] **方案 C：鼠标移出即隐匿（Hover-Revealed HUD）**：
    - 在不支持 Document PiP 的浏览器中提供降级方案：录制时不移动鼠标时 HUD 保持 100% 完全透明（`opacity: 0`），仅当用户将鼠标移至屏幕边缘时微弱显现。

---

### 8.5 [P2 中期] 播放控制栏全场景三态统一规范 (Studio / Audience / Standalone HTML / Video)
- **问题与现状**：
  目前工程中存在四种播放控制形态，在 UI 风格、交互逻辑与操作细节上存在割裂：
  1. **Studio 设计页面播放控制栏**：嵌于底部时间轴（`BottomTimeline`），带有播放/暂停、播放头微调数值与时间线标尺；
  2. **演播模式控制栏 (AudienceModal)**：全屏模式下的半透明磨砂控制浮岛（上下一幕、播放/暂停、图元计数，左下角为分幕胶囊）；
  3. **独立单文件 HTML 页面 (Standalone HTML)**：内嵌在自治 HTML 文件中的播放控件；
  4. **导出视频与预览控制栏**：不同播放器或全屏预览下的 controls 样式。
- **统一规划与改进 Checklist**：
  - [ ] **视觉设计语言统一 (Design System Alignment)**：
    - 统一采用 Linear/Raycast 质感的深色玻璃微拟物风格（`bg-slate-900/85 backdrop-blur-md border-slate-800/80`）；
    - 统一按钮尺寸（36px/32px）、交互高光与圆角规范（`rounded-2xl` 与 `rounded-full`）；
    - 统一分幕指示器风格：左下角胶囊 `01 / 05  分幕标题` 成为全场景标准组件；
  - [ ] **核心交互与全局快捷键统一**：
    - 空格键（`Space`）：播放 / 暂停；
    - 方向键（`ArrowLeft` / `ArrowRight`）与翻页键（`PageUp` / `PageDown`）：上一幕 / 下一幕；
    - `F` 键：全屏切换；
    - `ESC` 键：安全退出演播并保存；
  - [ ] **封装通用组件 `@focusflow/player/ui/PlaybackFloatingIsland`**：将演播控制浮岛从组件层下沉为可复用组件，供 AudienceModal、Standalone Packager 和开发预览统一引入。

---

### 8.6 [P3 远期] 浏览器离线 TTS 音频录制与实体音频演进 (WASM 纯前端离线模型)
- **问题与现状确认**：
  - 本地离线 TTS（Web Speech API）通过操作系统底层守护进程（macOS `speechsynthesisd`）直接驱动硬件扬声器，不流经网页 DOM 内部的 Web Audio 音频图；
  - 浏览器 `navigator.mediaDevices.getDisplayMedia` 捕获标签页音频时，仅能截获 DOM 内 `<audio>`、`<video>` 和 `AudioContext` 节点发出的声音，导致单纯使用离线 TTS 时导出的 WebM 视频静音；
  - 导出中心现已落地**状态智能感知**与黄色警示横幅：当未检测到实体母带音轨时，明确提示用户“离线 TTS 属于系统沙箱发声，无法直接录屏捕获”，引导用户配置云端 TTS 或麦克风录音。
- **进一步优化与演进方案**：
  - [ ] **分幕旁白时长自动推导与无声占位增强**：若用户坚持使用纯离线模式录制视频，在导出界面提供“分幕字幕烧录 / 弹幕旁白”选项，或通过离线纯前端 WebAssembly 轻量语音合成库（如 ONNX 运行时的 Piper/Sherpa-ONNX）直接生成真实的 PCM/WAV AudioBuffer，实现 100% 离线自治且有声导出；
  - [ ] **离线发声状态微提示**：在时间轴波形轨增加提示标签，明确标记当前音轨是“离线系统播音（录屏静音）”还是“实体母带音频（可录音画合流）”。



