export default {
  // Waveform Track
  audioTrack: '音频轨',
  mainVoiceoverTrack: '主解说声道',
  pausePreview: '暂停试听',
  playPreview: '播放试听',
  playPreviewTitle: '播放试听录音',
  downloadAudio: '下载音频',
  downloadAudioTitle: '下载音频文件到本地',
  trackInvalid: '音轨已失效',
  clearInvalidTrack: '清除失效音轨',
  zoomInWaveform: '放大波形视口',
  zoomOutWaveform: '缩小波形视口',
  removeTrack: '移除音轨',
  decodingWaveform: '波形正在离屏解码中...',

  // Voiceover Recorder Modal
  recorderModalTitle: '同屏演播麦克风录音器',
  preparingNarration: '准备开始演播讲解...',
  recordingStatus: '正在演播录音中: {{seconds}}s',
  markersCount: '分幕打点数量:',
  punchMarkerBtn: '打入分幕转场标记 (快捷键: M)',
  inputDeviceLabel: '输入音频设备',
  defaultMic: '系统默认麦克风',
  micLabel: '麦克风',
  echoCancel: '回声消除 (AEC)',
  noiseSuppress: '背景降噪 (ANS)',
  stereoVuLabel: '立体声 VU 电平监视:',
  cancelRecord: '取消',
  finishRecordBtn: '完成录制并校准时间轴',
  startRecordBtn: '3-2-1 开启同屏演播录音',
  recordedVoiceoverName: '演播麦克风解说录音',

  // AI Voiceover Settings Modal
  settingsTitle: 'AI 提词与语音合成配置',
  dualModeBadge: '双模式',
  settingsSubtitle: '可自由选用离线免 Key 浏览器原生发音，或配置云端广播级 AI 真人语音母带',
  modeOfflineTitle: '离线原生语音',
  modeOfflineBadge: '免 Key / 0 门槛',
  modeOfflineDesc: '系统原生播音员真实朗读，无蜂鸣电子音',
  modeCloudTitle: '云端高清 AI 语音',
  modeCloudBadge: 'BYOK 自备 Key',
  modeCloudDesc: 'OpenAI / 硅基流动 / 广播级真人母带',

  offlineEnabledTitle: '已启用离线原生语音合成模式',
  offlineBullet1Title: '真实语音朗读',
  offlineBullet1Desc: '演播试听时，直接由操作系统的本地播音员（如 Mac 婷婷、Windows/Edge 晓晓、Safari 默认）朗读真实台词。',
  offlineBullet2Title: '消除电子音',
  offlineBullet2Desc: '底层母带平滑对齐，彻底移除了此前单调刺耳的 320Hz 正弦波蜂鸣（“翁~”）。',
  offlineBullet3Title: '100% 离线与免费',
  offlineBullet3Desc: '无需任何 API Key，无网络请求消耗，适合快速本地彩排与离线演示。',

  speechSpeed: '发音语速',
  speedSlow: '0.5x 慢速',
  speedNormal: '1.0x 标准',
  speedFast: '2.0x 极速',

  presetLabel: '主流服务商预设 (Preset)',
  presetOpenAI: 'OpenAI 官方 (api.openai.com)',
  presetSiliconFlow: '硅基流动 SiliconFlow (api.siliconflow.cn · 国内极速)',
  presetCustom: '自定义兼容接口 (OneAPI / LocalAI / 私有中转)',

  apiEndpointLabel: 'API Endpoint / Base URL',
  resetDefault: '重置默认',
  apiKeyLabel: 'API Key',
  getKeyLink: '获取密钥 →',
  apiKeyStorageNotice: '密钥仅安全暂存在您的本地浏览器 localStorage 中，直接与服务商端点通信，绝不经过任何第三方服务器。',

  modelLabel: '模型 (Model)',
  voiceLabel: '音色 (Voice)',

  previewSectionTitle: '单句连通性试听 (Preview)',
  previewGenerating: '生成中...',
  testVoiceBtn: '测试发音',
  previewSampleText: '欢迎使用 FocusFlow，新一代架构演进动态可视化系统。',
  previewSuccessOffline: '已通过浏览器原生语音朗读试听',
  previewSuccessCloud: '试听合成成功！音频长度 {{duration}} 秒',
  previewErrorNoKey: '请先填写 API Key 才能进行云端试听',
  previewErrorRequest: '请求失败，请检查 Base URL、API Key 或网络连接',

  footerPersistedNote: '配置已持久化记忆在本地',
  closeBtn: '取消',
  saveConfigBtn: '保存配置',
  saveAndBatchBtn: '保存并一键全分幕合成',
  batchSynthesizingBtn: '合流中...',

  // Audio Conflict Modal
  conflictModalTitle: '检测到分幕提词与导入音频冲突',
  conflictModalSubtitle: '当前工程已有 {{count}} 个分幕包含解说提词。请选择该音频文件的用途：',
  conflictOptionBgmTitle: '作为背景音乐 (BGM)',
  conflictOptionBgmBadge: '推荐 · 伴奏模式',
  conflictOptionBgmDesc: '音频音量自动调至 20%，演播时分幕提词将作为前景人声同步朗读。',
  conflictOptionVoiceoverTitle: '作为主旁白母带 (Voiceover)',
  conflictOptionVoiceoverBadge: '替代解说',
  conflictOptionVoiceoverDesc: '将该音频作为演播核心配音。演播时将自动静音分幕提词，完全由该音频主导。',
  conflictCancelBtn: '取消导入',
  conflictApplyBtn: '确认应用',

  // Overwrite confirm
  confirmOverwriteCustomAudio: '工程中已有您上传的音频文件，生成 AI 旁白将替换该音频，是否继续？',

  // Mode Badges in Timeline
  bgmBadge: '背景伴奏',
  voiceoverBadge: '旁白主音轨',
  switchToVoiceover: '点击切换为主旁白 (100% 音量)',
  switchToBgm: '点击切换为背景伴奏 (20% 音量)',

  // Recording WYSIWYG Warning
  offlineBgmRecordWarning: '友情提醒：当前工程启用了【离线系统语音】，因浏览器沙箱限制，导出的视频中将只包含背景音乐，无法内录离线旁白。如需包含旁白出片，建议使用【云端 TTS】生成实体音频或使用麦克风录制。是否继续录制？',
} as const;
