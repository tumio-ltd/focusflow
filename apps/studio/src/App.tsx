import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FocusFlowPlayer } from '@focusflow/player';
import type { ElementBox, ElementPath, ElementDot, ElementImage, CalloutItem, SceneVoiceoverAudio } from '@focusflow/dsl';
import { 
  WorkbenchLayout, 
  TopBar, 
  LeftToolbox, 
  RightInspector, 
  BottomTimeline 
} from '@/components/layout';
import { 
  InfiniteCanvas, 
  CanvasOverlay
} from '@/components/canvas';
import { 
  ImageUploadModal, 
  ProjectManagerModal, 
  TemplatesModal,
  AudienceModal,
  ExportModal,
  DslEditorModal,
} from '@/components/modals';
import { Toaster, toast } from '@/components/ui';
import { AIVoiceoverSettingsModal } from '@/components/timeline/AIVoiceoverSettingsModal';
import { useEditorStore, useProjectStore, useStorageStore } from '@/stores';
import { type ImageMeta, parseImageUrl } from '@/utils/imageDecoder';
import type { ArchitectureTemplate } from '@/templates';
import { captureCanvasToCamera } from '@/utils/cameraMath';
import { globalEdgeSnapper } from '@/utils/edgeSnapper';
import { useStudioKeyboard } from '@/hooks/useStudioKeyboard';
import { 
  synthesizeSceneVoiceover, 
  speakWebSpeech, 
  stopWebSpeech, 
  getStoredTTSConfig, 
  composeMasterAudioFromScenes, 
  setSceneAudioBlob,
  showAudioErrorToast
} from '@/services/audio';
import { startCleanScreenRecording, downloadVideoBlob, type RecordingSession } from '@/services/screenRecorder';
import type { TTSPreviewInfo } from '@/components/layout/RightInspector';
import '@focusflow/player/styles.css';

export default function App() {
  const { t } = useTranslation(['audio', 'common']);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDslModalOpen, setIsDslModalOpen] = useState(false);
  const [isAIVoiceoverSettingsOpen, setIsAIVoiceoverSettingsOpen] = useState(false);
  const [isSingleTtsLoading, setIsSingleTtsLoading] = useState(false);
  const [ttsPreview, setTtsPreview] = useState<TTSPreviewInfo | null>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingSessionRef = useRef<RecordingSession | null>(null);
  const mixingAudioCtxRef = useRef<AudioContext | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousMasterUrlRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 视口变换与容器尺寸跟踪 (使用 useRef 隔离高频手势平移，避免触发根组件与侧边栏 Re-render)
  const canvasTransformRef = useRef({ scale: 1, x: 0, y: 0 });
  const containerRectRef = useRef({ width: 1920, height: 1080 });

  // Zustand Store Hooks (使用原子 Selector 独立订阅，禁止订阅高频 cursorCoords 状态)
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const activeSceneIndex = useEditorStore((s) => s.activeSceneIndex);
  const setActiveSceneIndex = useEditorStore((s) => s.setActiveSceneIndex);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const isSmartSnapEnabled = useEditorStore((s) => s.isSmartSnapEnabled);
  const toggleSmartSnap = useEditorStore((s) => s.toggleSmartSnap);
  const isCrosshairEnabled = useEditorStore((s) => s.isCrosshairEnabled);
  const toggleCrosshair = useEditorStore((s) => s.toggleCrosshair);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);

  const {
    dsl,
    isDirty,
    past,
    future,
    undo,
    redo,
    setDSL,
    ingestNewAsset,
    updateMetaTitle,
    updateSceneCamera,
    updateSceneTitle,
    updateSceneDuration,
    updateSceneVoiceoverScript,
    addScene,
    duplicateScene,
    deleteScene,
    reorderScenes,
    addBox,
    addPath,
    addDot,
    addCallout,
    addImage,
    toggleElementInScene,
    inheritPreviousSceneElements,
    deleteElement,
    calibrateViewport,
    toggleShowPlayerControls,
    setAudioTrack,
    removeAudioTrack,
    updateSceneVoiceoverAudio,
    markSaved,
  } = useProjectStore();

  const {
    currentProjectId,
    loadProjects,
    openProject,
    createProject,
    saveProject,
  } = useStorageStore();

  const activeScene = dsl.scenes[activeSceneIndex] || dsl.scenes[0];

  // 1. 初始化时从 IndexedDB 载入最近工程
  useEffect(() => {
    loadProjects().then(async () => {
      const storageState = useStorageStore.getState();
      if (storageState.currentProjectId) {
        const record = await openProject(storageState.currentProjectId);
        if (record?.dsl) {
          setDSL(record.dsl);
        }
      } else if (storageState.projectList.length === 0) {
        // 创建初始示范工程
        const currentDSL = useProjectStore.getState().dsl;
        const initialId = await createProject(currentDSL.meta.title, currentDSL);
        console.log('Initialized first local project:', initialId);
      }
    });
  }, [loadProjects, openProject, createProject, setDSL]);

  // 2. 500ms 防抖自动存盘至 IndexedDB
  useEffect(() => {
    if (!isDirty || !currentProjectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveProject(currentProjectId, dsl);
      markSaved();
      console.log('Auto-saved project to IndexedDB at', new Date().toLocaleTimeString());
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dsl, isDirty, currentProjectId, saveProject, markSaved]);

  // 2.1 监听分幕时序拓扑变化，自动响应式重合流母带 (分幕增删、时长调整、顺序重排、台词语音变更)
  const audioTopologyKey = useMemo(() => {
    return dsl.scenes.map((s) => `${s.id}:${s.duration || 3800}:${s.voiceoverAudio?.url || ''}`).join('|');
  }, [dsl.scenes]);

  const lastProcessedKeyRef = useRef<string>(audioTopologyKey);

  useEffect(() => {
    if (audioTopologyKey === lastProcessedKeyRef.current) {
      return;
    }

    const hasAnyAudio = dsl.scenes.some((s) => Boolean(s.voiceoverAudio?.url));
    if (!hasAnyAudio) {
      const currentTrack = dsl.audio?.tracks?.[0];
      if (currentTrack?.name?.includes('智能合流母带')) {
        if (previousMasterUrlRef.current && previousMasterUrlRef.current.startsWith('blob:')) {
          try { URL.revokeObjectURL(previousMasterUrlRef.current); } catch {}
          previousMasterUrlRef.current = null;
        }
        removeAudioTrack(currentTrack.id);
      }
      lastProcessedKeyRef.current = audioTopologyKey;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const defaultInterval = dsl.meta.controls?.interval || 3800;
        const { masterTrack } = await composeMasterAudioFromScenes(dsl.scenes, {
          defaultInterval,
          trackName: `🎙️ 全局分幕智能合流母带`,
        });

        if (masterTrack) {
          if (previousMasterUrlRef.current && previousMasterUrlRef.current.startsWith('blob:')) {
            try { URL.revokeObjectURL(previousMasterUrlRef.current); } catch {}
          }
          previousMasterUrlRef.current = masterTrack.url;
          setAudioTrack(masterTrack);
        }
        lastProcessedKeyRef.current = audioTopologyKey;
      } catch (err) {
        console.warn('[App] Failed to auto-sync stitched master audio track:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [audioTopologyKey, dsl.scenes, dsl.meta.controls?.interval, setAudioTrack, removeAudioTrack, dsl.audio?.tracks]);

  // 3. Initialize FocusFlow Player
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const initialIdx = useEditorStore.getState().activeSceneIndex || 0;
      const player = new FocusFlowPlayer({
        container: containerRef.current,
        dsl,
        initialSceneIndex: initialIdx,
        debug: false,
        disableCamera: true, // 编辑工作台内底图保持 1:1 绝对空间，运镜由 InfiniteCanvas 与 Frustum 取景框协同展现
        enableKeyboard: false, // 禁用内部全局按键监听，由 Studio 统一调度快捷键与抓手平移
        showControls: !!dsl.meta.controls?.showControls,
        onSceneChange: (index: number) => {
          setActiveSceneIndex(index);
        },
      });

      playerRef.current = player;
      // 预先缓存底图像素到 Sobel 空间分析器，并在底图载入时自动校准画布物理 Viewport (消除黑边与比例失真)
      if (player.imgEl) {
        const handleImageReady = () => {
          const natW = player.imgEl?.naturalWidth || 0;
          const natH = player.imgEl?.naturalHeight || 0;
          if (natW > 0 && natH > 0) {
            const currentViewport = useProjectStore.getState().dsl.meta.viewport;
            if (currentViewport.width !== natW || currentViewport.height !== natH) {
              console.log(
                `[FocusFlow] Auto-calibrating canvas viewport to image natural size: ${natW}×${natH} (was ${currentViewport.width}×${currentViewport.height})`
              );
              calibrateViewport({ width: natW, height: natH });
            }
            globalEdgeSnapper.setImageElement(player.imgEl!, natW, natH);
          }
        };

        if (player.imgEl.complete && player.imgEl.naturalWidth > 0) {
          handleImageReady();
        } else {
          player.imgEl.addEventListener('load', handleImageReady, { once: true });
        }
      }

      return () => {
        player.destroy();
        playerRef.current = null;
      };
    } catch (err) {
      console.warn('Player init warning:', err);
    }
  }, [dsl.asset?.url, setActiveSceneIndex, calibrateViewport]);

  // 3.1 同步播放器独立控制栏显隐
  useEffect(() => {
    playerRef.current?.setShowControls(!!dsl.meta.controls?.showControls);
  }, [dsl.meta.controls?.showControls]);

  // 3.2 同步当前场景切换 (非自动演播状态下同步底图图元)
  useEffect(() => {
    if (!isPlaying) {
      playerRef.current?.goToStep(activeSceneIndex, false);
    }
  }, [activeSceneIndex, isPlaying]);

  // 3.3 当工程图元或场景激活配置变动时，实时同步刷新画布上的图元呈现
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.updateDSL(dsl);
    }
  }, [dsl.elements, dsl.scenes, dsl.audio]);

  // 3.4 演播播放联动：当处于离线原生语音模式且自动演播切幕时，自动调用系统原生播音朗读
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleSceneChange = (e: any) => {
      const newIdx = typeof e === 'number' ? e : e?.sceneIndex ?? 0;
      setActiveSceneIndex(newIdx);

      const currentlyPlaying = useEditorStore.getState().isPlaying;
      const isPlayerActive = Boolean(player.stateMachine?.isPlaying);
      const cfg = getStoredTTSConfig();
      const mainTrack = dsl.audio?.tracks?.[0];

      // 若工程中无任何音轨、或音轨处于静音/0音量状态，绝对不发声（删除音轨后彻底静音）
      // 严格静音保护：只有在播放器确实处于自动演播状态、且音轨有效非静音时，才允许自动发声
      if (!currentlyPlaying || !isPlayerActive || !mainTrack || mainTrack.muted || (mainTrack.volume ?? 1) <= 0) {
        return;
      }

      const isOfflineVoice = Boolean(
        mainTrack.isOfflineTTS ||
        mainTrack.type === 'offline-tts'
      );
      const isBgmWithVoiceover = Boolean(
        mainTrack.type === 'music' || mainTrack.isBackgroundBGM
      );

      if (isOfflineVoice || isBgmWithVoiceover) {
        const scene = dsl.scenes[newIdx];
        const text = scene?.voiceoverScript?.trim() || (isOfflineVoice ? scene?.title : '');
        if (text) {
          speakWebSpeech(text, cfg.speed, undefined, cfg.voice);
        }
      }
    };

    const handlePlayStateChange = (playing: boolean) => {
      useEditorStore.getState().setIsPlaying(playing);
      if (!playing) {
        stopWebSpeech();
      }
    };

    const handleEnded = () => {
      useEditorStore.getState().setIsPlaying(false);
      stopWebSpeech();
    };

    player.on?.('sceneChange', handleSceneChange);
    player.on?.('playStateChange', handlePlayStateChange);
    player.on?.('ended', handleEnded);

    return () => {
      player.off?.('sceneChange', handleSceneChange);
      player.off?.('playStateChange', handlePlayStateChange);
      player.off?.('ended', handleEnded);
    };
  }, [dsl.scenes, dsl.audio, setActiveSceneIndex]);

  // Helper to stop any ongoing TTS preview playback
  const stopCurrentTtsPreview = useCallback(() => {
    stopWebSpeech();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setTtsPreview((prev) => (prev && prev.isPlaying ? { ...prev, isPlaying: false } : prev));
  }, []);

  // Helper to play preview audio
  const playCurrentTtsPreview = useCallback((preview: TTSPreviewInfo, text: string) => {
    stopCurrentTtsPreview();
    const cfg = getStoredTTSConfig();
    setTtsPreview({ ...preview, isPlaying: true });

    if (preview.audioBlob) {
      const url = URL.createObjectURL(preview.audioBlob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setTtsPreview((prev) => (prev ? { ...prev, isPlaying: false } : null));
      };

      audio.onerror = (e) => {
        console.error('TTS audio preview error:', audio.error, e);
        URL.revokeObjectURL(url);
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setTtsPreview((prev) => (prev ? { ...prev, isPlaying: false } : null));
      };

      audio.play().catch((err) => {
        console.error('TTS audio.play() rejected:', err);
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
        }
        setTtsPreview((prev) => (prev ? { ...prev, isPlaying: false } : null));
      });
    } else {
      speakWebSpeech(text, cfg.speed, undefined, cfg.voice, () => {
        setTtsPreview((prev) => (prev ? { ...prev, isPlaying: false } : null));
      });
    }
  }, [stopCurrentTtsPreview]);

  // 当非播放状态下切换分幕时，中断检查器单幕试听并重置试听卡片，确保彻底静音
  useEffect(() => {
    if (!isPlaying) {
      stopCurrentTtsPreview();
      setTtsPreview(null);
      stopWebSpeech();
    }
  }, [activeSceneIndex, isPlaying, stopCurrentTtsPreview]);

  // 当停止播放演播时，立即中断离线语音朗读
  useEffect(() => {
    if (!isPlaying) {
      stopWebSpeech();
    }
  }, [isPlaying]);

  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    if (playerRef.current) {
      playerRef.current.goTo(index);
    }
  };

  const handleSeek = (timeMs: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timeMs);
    }
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    const nextPlaying = !isPlaying;
    stopCurrentTtsPreview();
    setTtsPreview(null);
    setIsPlaying(nextPlaying);
    playerRef.current.togglePlay();

    if (nextPlaying) {
      const cfg = getStoredTTSConfig();
      const mainTrack = dsl.audio?.tracks?.[0];

      // 若工程中无任何音轨、或音轨处于静音/0音量状态，绝对不发声（删除音轨后彻底静音）
      if (mainTrack && !mainTrack.muted && (mainTrack.volume ?? 1) > 0) {
        const isOfflineVoice = Boolean(
          mainTrack.isOfflineTTS ||
          mainTrack.type === 'offline-tts'
        );
        const isBgmWithVoiceover = Boolean(
          mainTrack.type === 'music' || mainTrack.isBackgroundBGM
        );

        if (isOfflineVoice || isBgmWithVoiceover) {
          const scene = dsl.scenes[activeSceneIndex] || dsl.scenes[0];
          const text = scene?.voiceoverScript?.trim() || (isOfflineVoice ? scene?.title : '');
          if (text) {
            speakWebSpeech(text, cfg.speed, undefined, cfg.voice);
          }
        }
      }
    } else {
      stopWebSpeech();
    }
  };

  const handleNext = () => {
    if (activeSceneIndex < dsl.scenes.length - 1) {
      handleSelectScene(activeSceneIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeSceneIndex > 0) {
      handleSelectScene(activeSceneIndex - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (currentProjectId) {
      await saveProject(currentProjectId, dsl);
      markSaved();
      toast.success(t('projectSaved', '🎉 工程已实时存入本地 IndexedDB！'));
    }
  };

  const handleAssetImported = async (meta: ImageMeta) => {
    ingestNewAsset(meta);
    setActiveSceneIndex(0);

    // 立即新建并保存工程
    const newProjectId = await createProject(meta.fileName, useProjectStore.getState().dsl, meta.blob);
    console.log('Created project for imported asset:', newProjectId);
  };

  const handleOpenProjectById = async (id: string) => {
    const record = await openProject(id);
    if (record?.dsl) {
      setDSL(record.dsl);
      setActiveSceneIndex(0);
    }
  };

  const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
    setDSL(tpl.dsl);
    setActiveSceneIndex(0);

    // 自动嗅探模板底图真实尺寸校准 Viewport
    if (tpl.dsl.asset?.url) {
      try {
        const meta = await parseImageUrl(tpl.dsl.asset.url, tpl.title);
        if (meta.width > 0 && meta.height > 0) {
          calibrateViewport({ width: meta.width, height: meta.height });
        }
      } catch (e) {
        console.warn('Template image parse error:', e);
      }
    }

    // 创建对应的新工程
    const newProjectId = await createProject(tpl.title, useProjectStore.getState().dsl);
    console.log('Created project from template:', newProjectId);
  };

  const handleFinishVideoRecording = useCallback(async () => {
    const session = recordingSessionRef.current;
    recordingSessionRef.current = null;
    setIsRecordingVideo(false);
    setIsAudienceModalOpen(false);

    try {
      if (session) {
        const blob = await session.stop();
        if (blob && blob.size > 0) {
          downloadVideoBlob(blob, `${dsl.meta?.title || 'focusflow'}-60fps`);
        }
      }
    } catch (err) {
      console.error('[FocusFlow] 结束录制失败:', err);
    } finally {
      // 彻底硬终止录制混音上下文，释放 macOS CoreAudio / WASAPI 底层系统音频硬件线程
      if (mixingAudioCtxRef.current && mixingAudioCtxRef.current.state !== 'closed') {
        try {
          await mixingAudioCtxRef.current.close();
        } catch (e) {
          console.warn('[FocusFlow] 释放录制混音上下文异常:', e);
        } finally {
          mixingAudioCtxRef.current = null;
        }
      }
    }
  }, [dsl.meta?.title]);

  const handleStartVideoRecording = useCallback(async (format: 'mp4' | 'webm' = 'mp4') => {
    try {
      // 0. 所见即所得前检：若当前音轨为伴奏且使用离线系统语音，提示出片无旁白
      const cfg = getStoredTTSConfig();
      const mainTrack = dsl.audio?.tracks?.[0];
      const isBgm = mainTrack?.type === 'music' || !!mainTrack?.isBackgroundBGM;
      const hasSceneScript = dsl.scenes?.some((s) => !!s.voiceoverScript?.trim());
      if (isBgm && cfg.mode === 'offline' && hasSceneScript) {
        const warningMsg = t(
          'audio:offlineBgmRecordWarning',
          '友情提醒：当前工程启用了【离线系统语音】，因浏览器沙箱限制，导出的视频中将只包含背景音乐，无法内录离线旁白。如需包含旁白出片，建议使用【云端 TTS】生成实体音频或使用麦克风录制。是否继续录制？'
        );
        if (!window.confirm(warningMsg)) {
          return;
        }
      }

      // 1. 若工程内包含已合成/录制的音轨，提取其实体音频流混入视频录制
      let externalStream: MediaStream | undefined = undefined;
      if (mainTrack?.url) {
        try {
          const audioEl = new Audio();
          audioEl.src = mainTrack.url;
          audioEl.crossOrigin = 'anonymous';
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            // 若存在未释放的旧混音上下文，先行安全终止
            if (mixingAudioCtxRef.current && mixingAudioCtxRef.current.state !== 'closed') {
              mixingAudioCtxRef.current.close().catch(() => {});
            }
            const ctx = new AudioCtx();
            mixingAudioCtxRef.current = ctx;
            const source = ctx.createMediaElementSource(audioEl);
            const destination = ctx.createMediaStreamDestination();
            source.connect(destination);
            source.connect(ctx.destination);
            externalStream = destination.stream;
          }
        } catch (e) {
          console.warn('[FocusFlow] 提取工程音轨流失败:', e);
        }
      }

      const defaultInterval = (dsl.meta.controls?.interval || 3800) / 1000;
      const totalDurationSeconds = (dsl.scenes || []).reduce((sum, s) => {
        const dur = typeof s.duration === 'number' && s.duration > 0
          ? (s.duration > 100 ? s.duration / 1000 : s.duration)
          : defaultInterval;
        return sum + dur;
      }, 0);

      // 预先让全屏演播舞台就绪（第 1 幕），确保浏览器标签页分享缩略图中清晰呈现演示画面
      setActiveSceneIndex(0);
      setIsAudienceModalOpen(true);
      setIsRecordingVideo(false); // 保持静态就绪，绝不提前起播

      const session = await startCleanScreenRecording({
        fps: 60,
        audio: true,
        format,
        aspectRatio: dsl.meta?.viewport?.aspectRatio || '16:9',
        totalDurationSeconds,
        externalAudioStream: externalStream,
        onTick: (elapsed) => {
          setRecordingElapsed(elapsed);
        },
        onStreamEnded: () => {
          handleFinishVideoRecording();
        },
        onFinishRequest: () => {
          handleFinishVideoRecording();
        },
        onCancelRequest: () => {
          setIsRecordingVideo(false);
          setIsAudienceModalOpen(false);
        },
      });

      // 仅在用户授权通过、录制流正式就绪后，才正式激活录制并启动起播
      recordingSessionRef.current = session;
      setRecordingElapsed(0);
      setIsRecordingVideo(true);
    } catch (err: any) {
      setIsRecordingVideo(false);
      setIsAudienceModalOpen(false);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied') || err?.message?.includes('denied')) {
        console.log('[FocusFlow] 用户取消了屏幕录制授权');
        return;
      }
      console.error('[FocusFlow] 启动录制异常:', err);
      alert('无法启动屏幕录制: ' + (err?.message || '未知错误'));
    }
  }, [dsl.audio?.tracks, dsl.scenes, handleFinishVideoRecording, setActiveSceneIndex, t]);

  // 全局异常与窗口卸载兜底安全清理：确保在异常退出、误关窗口或崩溃前微秒级硬释放录制管道与音频上下文
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (recordingSessionRef.current) {
        try {
          recordingSessionRef.current.cancel();
        } catch {}
      }
      if (mixingAudioCtxRef.current && mixingAudioCtxRef.current.state !== 'closed') {
        try {
          mixingAudioCtxRef.current.close();
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  useStudioKeyboard({
    onExport: () => setIsExportModalOpen(true),
    onSave: handleSaveDraft,
    onPresent: () => setIsAudienceModalOpen(true),
    onOpenTemplates: () => setIsTemplatesModalOpen(true),
    onOpenProjects: () => setIsProjectsModalOpen(true),
    onOpenImport: () => setIsUploadModalOpen(true),
  });

  const handleCanvasTransformChange = useCallback(
    (transform: { scale: number; x: number; y: number }, rect: { width: number; height: number }) => {
      canvasTransformRef.current = transform;
      containerRectRef.current = rect;
      if (useEditorStore.getState().canvasScale !== transform.scale) {
        useEditorStore.getState().setCanvasScale(transform.scale);
      }
    },
    []
  );

  // 一键捕获当前视口为当前场景摄像机参数
  const handleCaptureCurrentCamera = useCallback(() => {
    const newCamera = captureCanvasToCamera(
      canvasTransformRef.current,
      containerRectRef.current,
      dsl.meta.viewport.width,
      dsl.meta.viewport.height,
      activeScene?.camera.duration || 1.2
    );
    updateSceneCamera(activeSceneIndex, newCamera);
  }, [dsl.meta.viewport.width, dsl.meta.viewport.height, activeScene?.camera.duration, updateSceneCamera, activeSceneIndex]);

  // 新建场景智能继承当前视口 (Smart Viewport Inheritance)
  const handleAddScene = useCallback(() => {
    const currentCamera = captureCanvasToCamera(
      canvasTransformRef.current,
      containerRectRef.current,
      dsl.meta.viewport.width,
      dsl.meta.viewport.height,
      1.2
    );
    addScene(currentCamera);
    setActiveSceneIndex(dsl.scenes.length);
  }, [dsl.meta.viewport.width, dsl.meta.viewport.height, dsl.scenes.length, addScene, setActiveSceneIndex]);

  const handleBoxCreated = (box: ElementBox) => {
    addBox(box, activeSceneIndex);
    setSelectedElementId(box.id);
  };

  const handlePathCreated = (path: ElementPath) => {
    addPath(path, activeSceneIndex);
    setSelectedElementId(path.id);
  };

  const handleDotCreated = (dot: ElementDot) => {
    addDot(dot, activeSceneIndex);
    setSelectedElementId(dot.id);
  };

  const handleCalloutCreated = (callout: CalloutItem) => {
    addCallout(callout, activeSceneIndex);
    setSelectedElementId(callout.id);
  };

  const handleImageCreated = (image: ElementImage) => {
    addImage(image, activeSceneIndex);
    setSelectedElementId(image.id);
  };

  // 提取当前场景图元信息用于 Inspector 展示 (通过 useMemo 保持引用稳定，阻断侧边栏重绘)
  const inspectorElements = useMemo(() => {
    const allCalloutsMap = new Map<string, CalloutItem>();
    dsl.scenes.forEach((s) => {
      (s.activeElements.callouts || []).forEach((c) => {
        if (!allCalloutsMap.has(c.id)) {
          allCalloutsMap.set(c.id, c);
        }
      });
    });

    return [
      ...(dsl.elements.boxes || []).map((b) => ({
        id: b.id,
        type: 'box' as const,
        name: b.id,
        active: activeScene?.activeElements.boxes?.includes(b.id) || false,
      })),
      ...(dsl.elements.paths || []).map((p) => ({
        id: p.id,
        type: 'path' as const,
        name: p.id,
        active: activeScene?.activeElements.paths?.includes(p.id) || false,
      })),
      ...(dsl.elements.dots || []).map((d) => ({
        id: d.id,
        type: 'dot' as const,
        name: d.id,
        active: activeScene?.activeElements.dots?.includes(d.id) || false,
      })),
      ...(dsl.elements.images || []).map((img) => ({
        id: img.id,
        type: 'image' as const,
        name: img.id,
        active: activeScene?.activeElements.images?.includes(img.id) || false,
      })),
      ...Array.from(allCalloutsMap.values()).map((c) => ({
        id: c.id,
        type: 'callout' as const,
        name: c.title && c.title !== c.id ? `${c.id} (${c.title})` : c.id,
        active: activeScene?.activeElements.callouts?.some((sc) => sc.id === c.id) || false,
      })),
    ];
  }, [dsl.elements, dsl.scenes, activeScene?.activeElements]);

  // 时间轴场景列表记忆化
  const timelineScenes = useMemo(
    () =>
      dsl.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        duration: typeof s.duration === 'number' && s.duration > 0
          ? s.duration / 1000
          : (dsl.meta.controls?.interval ? dsl.meta.controls.interval / 1000 : (s.camera.duration || 1.2)),
        zoom: s.camera.zoom,
        boxCount: s.activeElements.boxes?.length || 0,
      })),
    [dsl.scenes, dsl.meta.controls?.interval]
  );

  return (
    <>
      <WorkbenchLayout
        topBar={
          <TopBar
            title={dsl.meta.title}
            onTitleChange={updateMetaTitle}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onUndo={undo}
            onRedo={redo}
            isSaved={!isDirty}
            showPlayerControls={!!dsl.meta.controls?.showControls}
            onTogglePlayerControls={toggleShowPlayerControls}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            onOpenProjects={() => setIsProjectsModalOpen(true)}
            onOpenImport={() => setIsUploadModalOpen(true)}
            onOpenAudience={() => setIsAudienceModalOpen(true)}
            onOpenDslEditor={() => setIsDslModalOpen(true)}
            onSave={handleSaveDraft}
            onExport={() => setIsExportModalOpen(true)}
          />
        }
        leftToolbox={
          <LeftToolbox
            activeTool={activeTool}
            onToolChange={setActiveTool}
          />
        }
        centerCanvas={
          <InfiniteCanvas
            contentWidth={dsl.meta.viewport.width}
            contentHeight={dsl.meta.viewport.height}
            camera={activeScene?.camera}
            isPlaying={isPlaying}
            onTransformChange={handleCanvasTransformChange}
          >
            <div className="w-full h-full relative">
              {/* [特性 2] 底层 FocusFlow 播放器挂载容器 - 真实加载工程底图 (非播放态挂起流光动效防 CPU 占用) */}
              <div
                ref={containerRef}
                className={clsx(
                  'w-full h-full absolute inset-0 pointer-events-none',
                  !isPlaying && !isAudienceModalOpen && 'ff-canvas-idle'
                )}
              />

              {/* [特性 6] 四大标定标注工具全量图层 (选框 / 连线 / 圆点 / 气泡 / 取景框 / 激光准星) */}
              <CanvasOverlay
                contentWidth={dsl.meta.viewport.width}
                contentHeight={dsl.meta.viewport.height}
                activeTool={activeTool}
                camera={{
                  zoom: activeScene?.camera.zoom || 1.0,
                  x: activeScene?.camera.x || 0,
                  y: activeScene?.camera.y || 0,
                  duration: activeScene?.camera.duration,
                }}
                boxes={dsl.elements.boxes || []}
                isPlaying={isPlaying}
                onCameraChange={(cam) => updateSceneCamera(activeSceneIndex, cam)}
                onBoxCreated={handleBoxCreated}
                onPathCreated={handlePathCreated}
                onDotCreated={handleDotCreated}
                onCalloutCreated={handleCalloutCreated}
                onImageCreated={handleImageCreated}
              />
            </div>
          </InfiniteCanvas>
        }
        bottomTimeline={
          <BottomTimeline
            scenes={timelineScenes}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={handleSelectScene}
            onAddScene={handleAddScene}
            onDuplicateScene={duplicateScene}
            onDeleteScene={(idx) => {
              deleteScene(idx);
              if (activeSceneIndex >= dsl.scenes.length - 1) {
                setActiveSceneIndex(Math.max(0, dsl.scenes.length - 2));
              }
            }}
            onReorderScenes={(source, target) => {
              reorderScenes(source, target);
              setActiveSceneIndex(target);
            }}
            onUpdateSceneTitle={(idx, title) => updateSceneTitle(idx, title)}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleSeek}
          />
        }
        rightInspector={
          <RightInspector
            sceneTitle={activeScene?.title}
            onSceneTitleChange={(title) => updateSceneTitle(activeSceneIndex, title)}
            sceneDuration={activeScene?.duration || dsl.meta.controls?.interval || 3800}
            onSceneDurationChange={(duration) => updateSceneDuration(activeSceneIndex, duration)}
            sceneVoiceoverScript={activeScene?.voiceoverScript || ''}
            onSceneVoiceoverScriptChange={(script) => {
              updateSceneVoiceoverScript(activeSceneIndex, script);
              if (ttsPreview) {
                stopCurrentTtsPreview();
                setTtsPreview(null);
              }
            }}
            onSynthesizeSceneTTS={async () => {
              if (!activeScene) return;
              try {
                setIsSingleTtsLoading(true);
                stopCurrentTtsPreview();
                const cfg = getStoredTTSConfig();
                const text = activeScene.voiceoverScript?.trim() || activeScene.title;
                const defaultInterval = dsl.meta.controls?.interval || 3800;
                const res = await synthesizeSceneVoiceover(activeScene, undefined, undefined, cfg.speed, defaultInterval);

                const previewInfo: TTSPreviewInfo = {
                  sceneIndex: activeSceneIndex,
                  isPlaying: true,
                  adaptedDuration: res.adaptedDuration,
                  audioDurationMs: res.durationMs,
                  audioBlob: res.audioBlob,
                };
                playCurrentTtsPreview(previewInfo, text);
              } catch (e: any) {
                console.error('Failed to preview single scene voiceover:', e);
                const cfg = getStoredTTSConfig();
                showAudioErrorToast({
                  title: t('audio:errorModalTitle', '语音合成遇到问题'),
                  message: e?.message || String(e),
                  details: e?.stack || String(e),
                  provider: cfg.preset,
                  model: cfg.model,
                  onOpenSettings: () => setIsAIVoiceoverSettingsOpen(true),
                  onRetry: () => {
                    const btn = document.querySelector('[data-testid="synthesize-scene-tts-btn"]') as HTMLButtonElement | null;
                    if (btn) btn.click();
                  },
                });
              } finally {
                setIsSingleTtsLoading(false);
              }
            }}
            onOpenVoiceoverSettings={() => setIsAIVoiceoverSettingsOpen(true)}
            isSingleTtsLoading={isSingleTtsLoading}
            ttsPreview={ttsPreview}
            onStopPreviewTTS={stopCurrentTtsPreview}
            onPlayPreviewTTS={() => {
              if (!ttsPreview || !activeScene) return;
              const text = activeScene.voiceoverScript?.trim() || activeScene.title;
              playCurrentTtsPreview(ttsPreview, text);
            }}
            onApplySceneTTS={async () => {
              if (!ttsPreview || !activeScene) return;
              const cfg = getStoredTTSConfig();
              const isOffline = cfg.mode === 'offline';
              const audioUrl = ttsPreview.audioBlob ? URL.createObjectURL(ttsPreview.audioBlob) : '';

              if (ttsPreview.audioBlob) {
                setSceneAudioBlob(activeScene.id, ttsPreview.audioBlob);
              }

              const voiceoverAudio: SceneVoiceoverAudio | undefined = audioUrl ? {
                url: audioUrl,
                durationMs: ttsPreview.audioDurationMs,
                voiceId: cfg.voice,
                model: isOffline ? 'web-speech' : cfg.model,
                adaptedDuration: ttsPreview.adaptedDuration,
              } : undefined;

              const updatedScenes = dsl.scenes.map((s, idx) => {
                if (idx === activeSceneIndex) {
                  return {
                    ...s,
                    duration: ttsPreview.adaptedDuration,
                    voiceoverAudio,
                  };
                }
                return s;
              });

              updateSceneVoiceoverAudio(activeSceneIndex, voiceoverAudio, ttsPreview.adaptedDuration);

              // 立即执行增量合流，实现实时无缝生效与零延迟渲染
              let nextMasterTrack: any = null;
              try {
                const defaultInterval = dsl.meta.controls?.interval || 3800;
                const { masterTrack } = await composeMasterAudioFromScenes(updatedScenes, {
                  defaultInterval,
                  trackName: `🎙️ 全局分幕智能合流母带`,
                });

                if (masterTrack) {
                  nextMasterTrack = masterTrack;
                  if (previousMasterUrlRef.current && previousMasterUrlRef.current.startsWith('blob:')) {
                    try { URL.revokeObjectURL(previousMasterUrlRef.current); } catch {}
                  }
                  previousMasterUrlRef.current = masterTrack.url;
                  setAudioTrack(masterTrack);
                }
                lastProcessedKeyRef.current = updatedScenes
                  .map((s) => `${s.id}:${s.duration || 3800}:${s.voiceoverAudio?.url || ''}`)
                  .join('|');
              } catch (err) {
                console.warn('[App] Failed to compose master audio track on apply:', err);
              }

              // 🌟 立即持久化存盘到 IndexedDB，彻底避免用户立即刷新导致时差丢失
              if (currentProjectId) {
                saveProject(currentProjectId, {
                  ...dsl,
                  scenes: updatedScenes,
                  audio: nextMasterTrack ? { ...dsl.audio, tracks: [nextMasterTrack] } : dsl.audio,
                }).catch((err) => console.warn('[App] Failed to immediately save on apply:', err));
              }

              stopCurrentTtsPreview();
              setTtsPreview(null);
            }}
            onDismissSceneTTS={() => {
              stopCurrentTtsPreview();
              setTtsPreview(null);
            }}
            cameraZoom={activeScene?.camera.zoom}
            onCameraZoomChange={(zoom) => updateSceneCamera(activeSceneIndex, { zoom })}
            cameraX={activeScene?.camera.x ?? 0}
            onCameraXChange={(x) => updateSceneCamera(activeSceneIndex, { x })}
            cameraY={activeScene?.camera.y ?? 0}
            onCameraYChange={(y) => updateSceneCamera(activeSceneIndex, { y })}
            onCameraReset={() => updateSceneCamera(activeSceneIndex, { x: 0, y: 0 })}
            cameraDuration={activeScene?.camera.duration || 1.2}
            onCameraDurationChange={(duration) => updateSceneCamera(activeSceneIndex, { duration })}
            onCaptureCurrentCamera={handleCaptureCurrentCamera}
            canInherit={activeSceneIndex > 0}
            onInheritPreviousScene={() => inheritPreviousSceneElements(activeSceneIndex)}
            elements={inspectorElements}
            onToggleElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              const isPath = dsl.elements.paths?.some((p) => p.id === id);
              const isDot = dsl.elements.dots?.some((d) => d.id === id);
              const isImage = dsl.elements.images?.some((i) => i.id === id);
              const isCallout = dsl.scenes.some((s) => s.activeElements.callouts?.some((c) => c.id === id));
              const type = isBox ? 'boxes' : isPath ? 'paths' : isDot ? 'dots' : isImage ? 'images' : isCallout ? 'callouts' : 'boxes';
              toggleElementInScene(activeSceneIndex, type, id);
            }}
            onDeleteElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              const isPath = dsl.elements.paths?.some((p) => p.id === id);
              const isDot = dsl.elements.dots?.some((d) => d.id === id);
              const isImage = dsl.elements.images?.some((i) => i.id === id);
              const isCallout = dsl.scenes.some((s) => s.activeElements.callouts?.some((c) => c.id === id));
              const type = isBox ? 'boxes' : isPath ? 'paths' : isDot ? 'dots' : isImage ? 'images' : isCallout ? 'callouts' : 'boxes';
              deleteElement(type, id);
            }}
            viewport={dsl.meta.viewport}
            isSmartSnapEnabled={isSmartSnapEnabled}
            onToggleSmartSnap={toggleSmartSnap}
            isCrosshairEnabled={isCrosshairEnabled}
            onToggleCrosshair={toggleCrosshair}
          />
        }
      />

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImport={handleAssetImported}
      />

      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        onSelectProject={handleOpenProjectById}
        onNewProject={() => setIsUploadModalOpen(true)}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <AudienceModal
        isOpen={isAudienceModalOpen}
        onClose={() => {
          if (isRecordingVideo) {
            handleFinishVideoRecording();
          } else {
            setIsAudienceModalOpen(false);
          }
        }}
        dsl={dsl}
        initialSceneIndex={isRecordingVideo ? 0 : activeSceneIndex}
        isRecording={isRecordingVideo}
        recordingElapsed={recordingElapsed}
        onFinishRecording={handleFinishVideoRecording}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dsl={dsl}
        onStartRecording={handleStartVideoRecording}
      />

      <DslEditorModal
        isOpen={isDslModalOpen}
        onClose={() => setIsDslModalOpen(false)}
        dsl={dsl}
        onApplyDSL={setDSL}
      />

      <Toaster />

      <AIVoiceoverSettingsModal
        isOpen={isAIVoiceoverSettingsOpen}
        onClose={() => setIsAIVoiceoverSettingsOpen(false)}
      />
    </>
  );
}
