# AI 提词音频自适应、离线演播发音与音画同步技术文档

## 一、方案落地与核心设计准则

FocusFlow Studio Stage 5.6 引入了智能 AI 提词、母带音频轨管理与音视频精准同步能力。在系统架构与用户交互层面，严格确立并落地了两大核心视听准则：

### 1. 严格保持音频自然人声语速，长则扩延、短则留白
- **绝不人为变速/拉伸音频**：无论云端高保真 AI 合成（OpenAI / 硅基流动）还是离线原生 Web Speech，音频朗读一律保持自然的 1.0x 标准人声语速（或用户在弹层中自定义的倍速）。强制变速会导致人声语调怪异、发音拖沓失真，破坏演讲质感。
- **场景时长自适应语音时长（长扩延、短留白）**：
  - **当台词较长（朗读时长 > 场景原本设定时长）**：自动将该分幕时长拉伸至 `语音时长 + 500ms 舒适呼吸停顿`，保证台词完整念完后再平滑进行镜头移动或分幕切换，绝不被硬切断；
  - **当台词较短（朗读时长 < 场景原本设定时长）**：语音保持正常语速念完，场景**保留原本设定的时长不变，剩余时间作为“视觉留白”**。这给观众留出充分的注意力去观察和消化架构图拓扑与流转高亮，杜绝暴力压短场景时长。
- **自适应时长计算规则**：
  $$\text{duration} = \max(\text{原本分幕时长}, \text{朗读时长} + 500\text{ms}, \text{镜头过渡时长} + 500\text{ms})$$
- **文案优化与歧义消除**：
  - 中文：`🎙️ 试听 TTS (自适应分幕时长)`，Tooltip：`以自然语速试听台词；若台词超出时长将自动延展分幕，台词较短则保留视觉留白`；
  - 英文：`🎙️ Preview TTS & Adapt Scene Duration`，Tooltip：`Preview script at natural speed; extends scene if speech is longer, preserves blank space if shorter`。

### 2. 彻底打通“离线原生语音”演播联动与批量提词自适应
- **底层机制说明**：
  浏览器原生 `Web Speech API`（操作系统内置的播音员如 Mac“婷婷”、Edge“晓晓”）直接输出到硬件声卡扬声器，受浏览器沙箱多媒体规范限制，无法直接被导出为独立本地 WAV/MP3 音频文件或二进制波形。
- **演播播放（Play / Space）逐幕发声联动**：
  在主界面挂载播放器分幕切幕事件 `sceneChange`。当处于“离线原生语音”模式且处于演播状态时，自动触发浏览器原生语音朗读当前分幕台词；暂停时立即中断取消。用户点击时间轴播放即可听到真实的真人演播！
- **时间轴批量 AI 提词自适应全分幕**：
  点击时间轴 `[🤖 AI 提词]` 时，离线模式下遍历所有分幕执行智能自适应计算，将各分幕最新时长（含留白与延展）一次性同步持久化到工程 DSL 与时间轴卡片。
- **高保真独立母带音轨（云端模式）**：
  若用户需要生成独立母带音频文件（WAV/MP3）与高保真波形轨，可无缝切换至云端模式（OpenAI / 硅基流动等，输入 Key），批量合成高保真真人音频并导出母带文件。

---

## 二、代码修改清单

1. [`apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts`](../apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts)
   - 重构 `adaptSceneDurationToAudio(scene, audioDurationMs, defaultInterval)`，落地“长扩短留白”的自适应计算；
   - 更新 `synthesizeSceneVoiceover` 和 `synthesizeAllScenesVoiceover` 支持传入工程默认分幕间隔。
2. [`apps/studio/src/services/audio/tts/WebSpeechTTSProvider.ts`](../apps/studio/src/services/audio/tts/WebSpeechTTSProvider.ts)
   - **解决中英文离线发音被拉长、复古电音怪声问题**：
     - **全量拉黑复古与玩具音色**（`VINTAGE_NOVELTY_VOICE_REGEX`）：彻底封杀 macOS/Windows 自 1984 年以来的 20+ 个怪异音色（`Albert`, `Fred`, `Eddy`, `Flo`, `Grandma`, `Grandpa`, `Bad News`, `Zarvox` 等）；
     - **英文旗舰母带白名单**（`ENGLISH_BROADCAST_VOICE_REGEX`）：纯英文台词优先且强制调用 **`Samantha`**（macOS 官方现代纯正美音）或 **`Alex`**（带呼吸感的自然男声），Windows 选用 **`Jenny` / `Guy`**；
     - **中文旗舰母带白名单**（`CHINESE_BROADCAST_VOICE_REGEX`）：中文台词优先且强制调用 **`Tingting (婷婷)`**，Windows 选用 **`Xiaoxiao (晓晓)`**；
     - **双向语言嗅探与防跨语言混用**：自动嗅探台词文本语言，防止中文发音人拼读英文导致拖腔，亦防止英文发音人拼读中文导致报错；
     - `speakWebSpeech(text, speed, lang, voiceId)` 全面打通 `voiceId` 绑定与过滤。
3. [`apps/studio/src/components/layout/BottomTimeline.tsx`](../apps/studio/src/components/layout/BottomTimeline.tsx)
   - 解构 `updateSceneDuration`；
   - 在 `handleBatchAIVoiceover` 中批量将计算后的 `updatedScenes` 时长同步更新到 `useProjectStore`。
4. [`apps/studio/src/App.tsx`](../apps/studio/src/App.tsx)
   - 监听播放器 `sceneChange` 事件，在离线演播切幕时自动调用 `speakWebSpeech(text, cfg.speed, undefined, cfg.voice)`；
   - 暂停时（`!isPlaying`）自动调用 `window.speechSynthesis.cancel()` 停止发声；
   - 更新 `onSynthesizeSceneTTS` 单幕试听自适应传参与发音人配置绑定。
5. [`apps/studio/src/components/layout/RightInspector.tsx`](../apps/studio/src/components/layout/RightInspector.tsx)
   - 为单幕 TTS 试听按钮追加详细解释的 `title` Tooltip。
6. [`apps/studio/src/locales/zh/inspector.ts`](../apps/studio/src/locales/zh/inspector.ts) & [`apps/studio/src/locales/en/inspector.ts`](../apps/studio/src/locales/en/inspector.ts)
   - 国际化文案更新为精准的“试听 TTS (自适应分幕时长)” / “Preview TTS & Adapt Scene Duration”。
7. [`apps/studio/e2e/stage5-audio-sync.spec.ts`](../apps/studio/e2e/stage5-audio-sync.spec.ts)
   - 增加对“短台词长场景保留留白不缩短”的断言测试；
### 3. 试听随时打断控制与“先试听、满意再应用”解耦闭环
- **试听随时停止/重听**：
  - 在试听发音过程中，控制条提供实时的 `[⏹️ 停止]` 按钮；
  - 无论是离线原生发音（调用 `window.speechSynthesis.cancel()` 毫秒级打断）还是云端音频（HTML5 `Audio.pause()` 并重置指针），创作者均可随时打断长语音，告别“一旦点击试听就必须忍受长篇大论念完”的痛点；
  - 停止后可点击 `[▶️ 试听]` 随时重新播放。
- **状态解耦与“创作者自主确认”机制**：
  - 点击试听时**不再擅自篡改工程分幕时长**，仅合成音频、计算自适应时长并缓存到预览态（`TTSPreviewInfo`）；
  - 试听卡片直观显示：`试听就绪 / 建议分幕: X.Xs`；
  - 创作者试听满意后，点击高亮的 `[✓ 应用]` 按钮：
    - 真正将自适应时长提交并持久化到当前分幕；
    - 云端合成的音频数据立即落盘至项目时间轴母带音轨；
    - 停止试听并关闭预览卡片；
  - 若创作者觉得不满意或需要修改台词，点击 `[✕]` 取消或修改输入框台词，当前分幕时长保持原样，原工程结构零破坏。
- **场景切换与演播冲突守护**：
  - 当创作者切换到其他分幕或开启演播时，当前正在播放的试听音频自动静音中断并重置状态，杜绝不同音频跨幕混音干扰。

---

## 二、代码修改清单

1. [`apps/studio/src/services/audio/tts/WebSpeechTTSProvider.ts`](../apps/studio/src/services/audio/tts/WebSpeechTTSProvider.ts)
   - 解决中英文离线发音拉长问题，过滤复古怪异音色，母带播音员置顶与智能语种嗅探；
   - 增加 `onEnded` 播放完成回调通知，并导出 `stopWebSpeech()` 供全局即时打断使用。
2. [`apps/studio/src/components/layout/RightInspector.tsx`](../apps/studio/src/components/layout/RightInspector.tsx)
   - 扩展 `TTSPreviewInfo` 接口与试听控制回调属性（`ttsPreview`, `onStopPreviewTTS`, `onPlayPreviewTTS`, `onApplySceneTTS`, `onDismissSceneTTS`）；
   - 在分幕台词输入框下方实现轻量试听控制卡片：
     - `[▶️ 试听 / ⏹️ 停止]` 实时切换控制；
     - `建议分幕 X.Xs` 状态与时长标签；
     - `[✓ 应用]` 高亮应用按钮；
     - `[✕]` 放弃/取消按钮。
3. [`apps/studio/src/App.tsx`](../apps/studio/src/App.tsx)
   - 维护 `ttsPreview` 状态与 `previewAudioRef`；
   - 实现 `stopCurrentTtsPreview` 与 `playCurrentTtsPreview`，支持离线 Web Speech 与云端 HTML5 Audio 统一启停；
   - 分离“试听”与“应用”：试听时仅计算建议时长并播放，点击应用时才调用 `updateSceneDuration` 并将音频落盘至 `setAudioTrack`；
   - 监听分幕切换与演播播放状态，切幕或演播时自动打断试听音频并清理预览态。
4. [`apps/studio/src/locales/zh/inspector.ts`](../apps/studio/src/locales/zh/inspector.ts) & [`apps/studio/src/locales/en/inspector.ts`](../apps/studio/src/locales/en/inspector.ts)
   - 补充 `stopPreviewTTS`、`playPreviewTTS`、`ttsPlaying`、`ttsReady`、`suggestedDuration`、`applyTTS`、`applyTTSTip`、`dismissTTS` 等完整多语言支持。
5. [`apps/studio/e2e/stage5-audio-sync.spec.ts`](../apps/studio/e2e/stage5-audio-sync.spec.ts)
   - 改造 `verifyVoiceoverScriptAndTtsAdaptation` 和 `verifyEnglishVoiceoverScriptAndTtsAdaptation`，验证试听控制卡片出现、中途打断停止播放、点击应用后时长才生效并落盘的全流程。

### 4. 音频轨试听 (Audio Track Play Preview) 与演播播放发声深度打通
- **问题病灶定位**：
  1. **离线合成的 WAV 是纯静音占位符**：浏览器 `speechSynthesis` 直通系统扬声器，无法提取波形音频流。直接传给 `<audio src={track.url}>` 会导致 100% 纯静音播放。
  2. **播放器底层硬件通道抢占**：`FocusFlowPlayer` 初始化 `this.audioEl = new Audio(track.url)` 播放静音文件时，抢占了多媒体通道并可能抑制原生 `speechSynthesis`。
  3. **切幕时状态机闭包掐灭语音**：在 `App.tsx` 中，`useEffect([activeSceneIndex])` 无条件调用了 `stopCurrentTtsPreview()`（内含 `speechSynthesis.cancel()`），导致演播自动切幕的瞬间刚启动的新分幕语音被立即掐断！
- **修复方案与双模式发声架构**：
  1. **DSL 与音轨打标**：为 `AudioTrackConfig` 补充 `isOfflineTTS?: boolean` 与 `type: 'offline-tts'`，批量合流与单幕应用时准确识别离线语音。
  2. **底层播放器无静音占用**：在 `FocusFlowPlayer` 的 `initAudio` 中检测离线音轨跳过 `<audio>` 初始化，彻底释放扬声器通道。
  3. **演播切幕稳定发声**：
     - 使用 `useEditorStore.getState().isPlaying` 解决 React 闭包滞后；
     - 限制 `activeSceneIndex` 监听器：**仅在 `!isPlaying`（静态编辑时）才重置试听**，彻底杜绝演播切幕误杀语音；
     - 监听播放器的 `playStateChange` 与 `ended`，在停止演播时整洁终止发音。
  4. **音频轨卡片试听与波形针刺发声**：
     - `AudioWaveformTrack` 中的 `toggleAudioPreview` 针对离线音轨，根据当前光标位置定位对应分幕文本，触发 `speakWebSpeech` 朗读并驱动播放头平滑前进；分幕播完自动流转下一幕，点击暂停整洁终止；
     - 波形轨点击/针刺拖拽（`playScrubGrain`）自动朗读光标所落分幕文本。

---

## 三、验证结果

- **自动化构建与类型校验**：
  `pnpm --filter @focusflow/dsl build`、`pnpm --filter @focusflow/player build`、`pnpm --filter @focusflow/studio build` 均全部成功通过，0 编译错误。
- **Playwright E2E 全量套件测试**：
  运行 `e2e/stage5-audio-sync.spec.ts`：
  ```bash
  10 passed (35.6s)
  ✓ TC561: 验证时间轴波形轨展开与收起切换
  ✓ TC562: 验证麦克风演播录音准备模态框与 VU 电平监视
  ✓ TC563: 验证分幕驻留时长修改与时间轴双向联动
  ✓ TC564: 验证分幕旁白台词输入、实时试听控制打断与应用确认生效（含视觉留白检验）
  ✓ TC565: 验证时间轴 AI 提词批量全分幕合流生成音轨与波形
  ✓ TC566: 验证波形轨激光红线播放头点击、拖拽与分幕双向联动
  ✓ TC567: 验证 AI 语音合成设置模态框、主流预设切换与持久化
  ✓ TC568: 验证英文语言环境下音频相关界面文本全部国际化
  ✓ TC569: 验证纯英文旁白台词智能语种嗅探、试听控制与自适应时长
  ✓ TC570: 验证 Audio Track 试听与演播播放下已应用 TTS 音频的发声与交互联动
  ```

