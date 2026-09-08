export default {
  // Waveform Track
  audioTrack: 'Audio Track',
  mainVoiceoverTrack: 'Main Voiceover',
  pausePreview: 'Pause',
  playPreview: 'Play Preview',
  playPreviewTitle: 'Play audio preview',
  downloadAudio: 'Download Audio',
  downloadAudioTitle: 'Download audio file locally',
  trackInvalid: 'Track Invalid',
  clearInvalidTrack: 'Clear Invalid Track',
  zoomInWaveform: 'Zoom in waveform',
  zoomOutWaveform: 'Zoom out waveform',
  removeTrack: 'Remove Track',
  decodingWaveform: 'Decoding waveform offscreen...',

  // Voiceover Recorder Modal
  recorderModalTitle: 'Live Voiceover Studio Recorder',
  preparingNarration: 'Preparing for live narration...',
  recordingStatus: 'Recording in progress: {{seconds}}s',
  markersCount: 'Scene Markers:',
  punchMarkerBtn: 'Punch Transition Marker (Shortcut: M)',
  inputDeviceLabel: 'Input Audio Device',
  defaultMic: 'Default Microphone',
  micLabel: 'Microphone',
  echoCancel: 'Echo Cancellation (AEC)',
  noiseSuppress: 'Noise Suppression (ANS)',
  stereoVuLabel: 'Stereo VU Meter:',
  cancelRecord: 'Cancel',
  finishRecordBtn: 'Finish Recording & Align Timeline',
  startRecordBtn: '3-2-1 Start Live Recording',
  recordedVoiceoverName: 'Live Voiceover Recording',

  // AI Voiceover Settings Modal
  settingsTitle: 'AI Voiceover & TTS Settings',
  dualModeBadge: 'Dual Modes',
  settingsSubtitle: 'Choose keyless offline browser voices, or configure cloud broadcast-grade master AI audio',
  modeOfflineTitle: 'Offline Native Speech',
  modeOfflineBadge: 'No Key / Zero Setup',
  modeOfflineDesc: 'Native OS voices read aloud with zero buzzing drones',
  modeCloudTitle: 'Cloud HD AI Voice',
  modeCloudBadge: 'BYOK (Bring Your Own Key)',
  modeCloudDesc: 'OpenAI / SiliconFlow / Broadcast-grade Master Audio',

  offlineEnabledTitle: 'Offline Native Speech Mode Enabled',
  offlineBullet1Title: 'Natural Voice Narration',
  offlineBullet1Desc: 'Native operating system voices (e.g. Mac Ting-Ting/Samantha, Windows/Edge Xiaoxiao/Jenny, Safari default) read your scene lines aloud during preview.',
  offlineBullet2Title: 'Eliminated Electronic Drone',
  offlineBullet2Desc: 'Smooth, clean master audio alignment completely eliminates the previous annoying 320Hz sine-wave electronic buzz.',
  offlineBullet3Title: '100% Offline & Free',
  offlineBullet3Desc: 'No API Key required, zero network quota consumed, perfect for quick local rehearsals and offline presentations.',

  speechSpeed: 'Speech Speed',
  speedSlow: '0.5x Slow',
  speedNormal: '1.0x Normal',
  speedFast: '2.0x Fast',

  presetLabel: 'Provider Preset',
  presetOpenAI: 'Official OpenAI (api.openai.com)',
  presetSiliconFlow: 'SiliconFlow (api.siliconflow.cn · High Speed)',
  presetCustom: 'Custom Compatible Endpoint (OneAPI / LocalAI / Relay)',

  apiEndpointLabel: 'API Endpoint / Base URL',
  resetDefault: 'Reset Default',
  apiKeyLabel: 'API Key',
  getKeyLink: 'Get Key →',
  apiKeyStorageNotice: 'Your key is securely saved only in your local browser localStorage and communicates directly with the provider endpoint.',

  modelLabel: 'Model',
  voiceLabel: 'Voice',

  previewSectionTitle: 'Single Sentence Preview',
  previewGenerating: 'Generating...',
  testVoiceBtn: 'Test Voice',
  previewSampleText: 'Welcome to FocusFlow, the next-generation architecture evolution visualization system.',
  previewSuccessOffline: 'Preview spoken aloud via browser native speech engine',
  previewSuccessCloud: 'Synthesized successfully! Audio duration {{duration}}s',
  previewErrorNoKey: 'Please enter an API Key before testing cloud synthesis',
  previewErrorRequest: 'Request failed. Please check Base URL, API Key, or network connection',

  footerPersistedNote: 'Settings persisted in local browser storage',
  closeBtn: 'Cancel',
  saveConfigBtn: 'Save Settings',
  saveAndBatchBtn: 'Save & Synthesize All Scenes',
  batchSynthesizingBtn: 'Synthesizing...',

  // Audio Conflict Modal
  conflictModalTitle: 'Audio Conflict Detected',
  conflictModalSubtitle: 'Current project has {{count}} scene(s) with voiceover scripts. Please choose how to use this audio:',
  conflictOptionBgmTitle: 'As Background Music (BGM)',
  conflictOptionBgmBadge: 'Recommended · BGM Mode',
  conflictOptionBgmDesc: 'Audio volume is set to 20%. Scene voiceovers will be spoken aloud as foreground voice.',
  conflictOptionVoiceoverTitle: 'As Master Voiceover',
  conflictOptionVoiceoverBadge: 'Replace Voiceover',
  conflictOptionVoiceoverDesc: 'Use this audio as the primary narration track. Scene TTS will be silenced and driven by this audio.',
  conflictCancelBtn: 'Cancel Import',
  conflictApplyBtn: 'Apply Choice',

  // Overwrite confirm
  confirmOverwriteCustomAudio: 'A custom audio track is already loaded. Generating AI voiceover will replace it. Continue?',

  // Mode Badges in Timeline
  bgmBadge: 'Background BGM',
  voiceoverBadge: 'Master Voiceover',
  switchToVoiceover: 'Click to switch to Master Voiceover (100% vol)',
  switchToBgm: 'Click to switch to Background BGM (20% vol)',

  // Recording WYSIWYG Warning
  offlineBgmRecordWarning: 'Notice: Offline native speech cannot be captured into recorded videos due to browser sandbox limits. The exported video will contain BGM only without speech. To record voiceover, please use Cloud TTS or microphone recording. Continue recording?',
} as const;
