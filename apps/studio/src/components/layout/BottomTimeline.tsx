import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Film,
  Layers,
  Edit3,
  Check,
  Mic,
  Upload,
  Sparkles,
  Activity,
  Settings,
} from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { useStorageStore } from '@/stores/useStorageStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { AudioWaveformTrack } from '../timeline/AudioWaveformTrack';
import { VoiceoverPreflightModal } from '../timeline/VoiceoverPreflightModal';
import { AIVoiceoverSettingsModal } from '../timeline/AIVoiceoverSettingsModal';
import { AudioConflictModal } from '../modals/AudioConflictModal';
import { decodeAudioFile } from '@/services/audio/audioDecoder';
import { synthesizeAllScenesVoiceover } from '@/services/audio/tts/aiTtsSynthesizer';
import { getStoredTTSConfig } from '@/services/audio/tts/ttsConfigStore';
import { showAudioErrorToast } from '@/services/audio';
import type { AudioTrackConfig, AudioTrackRole } from '@focusflow/dsl';

export interface SceneCardItem {
  id: string;
  title: string;
  duration: number;
  boxCount?: number;
  zoom?: number;
}

export interface BottomTimelineProps {
  scenes: SceneCardItem[];
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onAddScene?: () => void;
  onDuplicateScene?: (index: number) => void;
  onDeleteScene?: (index: number) => void;
  onReorderScenes?: (sourceIndex: number, targetIndex: number) => void;
  onUpdateSceneTitle?: (index: number, title: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek?: (timeMs: number) => void;
}

function BottomTimelineComponent({
  scenes = [
    { id: 'scene-0', title: '01 全局总览架构', duration: 1.2, boxCount: 1, zoom: 1.0 },
    { id: 'scene-1', title: '02 网关流量过滤与路由', duration: 1.5, boxCount: 2, zoom: 1.8 },
  ],
  activeSceneIndex = 0,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onReorderScenes,
  onUpdateSceneTitle,
  isPlaying = false,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
}: BottomTimelineProps) {
  const { t } = useTranslation(['timeline', 'audio']);
  const { dsl, setAudioTrack, batchSetScenes } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isVoiceoverModalOpen, setIsVoiceoverModalOpen] = useState(false);
  const [isWaveformExpanded, setIsWaveformExpanded] = useState(Boolean(dsl.audio?.tracks?.length));
  const [isSynthesizingTTS, setIsSynthesizingTTS] = useState(false);
  const [isAIVoiceoverSettingsOpen, setIsAIVoiceoverSettingsOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [pendingImportTrack, setPendingImportTrack] = useState<AudioTrackConfig | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');

  // Sync isWaveformExpanded when audio track is updated
  useEffect(() => {
    if (dsl.audio?.tracks?.length) {
      setIsWaveformExpanded(true);
    }
  }, [dsl.audio?.tracks?.length]);

  // Active scene start time in ms
  const activeSceneStartMs = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < activeSceneIndex && i < dsl.scenes.length; i++) {
      const s = dsl.scenes[i];
      sum += s.duration || dsl.meta.controls?.interval || 3800;
    }
    return sum;
  }, [activeSceneIndex, dsl.scenes, dsl.meta.controls?.interval]);

  // Dynamic live playhead for smooth real-time timeline red laser progress line
  const [livePlayheadMs, setLivePlayheadMs] = useState(activeSceneStartMs);

  useEffect(() => {
    setLivePlayheadMs(activeSceneStartMs);
  }, [activeSceneIndex, activeSceneStartMs]);

  useEffect(() => {
    if (!isPlaying) {
      setLivePlayheadMs(activeSceneStartMs);
      return;
    }

    let animId: number;
    const currentScene = dsl.scenes[activeSceneIndex];
    const sDurMs = currentScene?.duration || dsl.meta.controls?.interval || 3800;
    const startT = performance.now();

    const loop = () => {
      const elapsed = performance.now() - startT;
      const currentMs = activeSceneStartMs + Math.min(sDurMs, elapsed);
      setLivePlayheadMs(currentMs);
      if (elapsed < sDurMs) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, activeSceneIndex, activeSceneStartMs, dsl.scenes, dsl.meta.controls?.interval]);

  const handleTimelineSeek = useCallback(
    (timeMs: number) => {
      onSeek?.(timeMs);
      let accum = 0;
      for (let i = 0; i < dsl.scenes.length; i++) {
        const dur = dsl.scenes[i].duration || dsl.meta.controls?.interval || 3800;
        if (timeMs >= accum && (timeMs < accum + dur || i === dsl.scenes.length - 1)) {
          onSelectScene(i);
          break;
        }
        accum += dur;
      }
    },
    [dsl.scenes, dsl.meta.controls?.interval, onSeek, onSelectScene],
  );

  const handleImportAudioClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const info = await decodeAudioFile(file);
      const url = URL.createObjectURL(file);
      const baseTrack: AudioTrackConfig = {
        id: `track-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        durationMs: info.durationMs,
        volume: 1.0,
        muted: false,
        type: 'voiceover',
        isBackgroundBGM: false,
      };

      const scenesWithScript = dsl.scenes.filter((s) => !!s.voiceoverScript?.trim());
      if (scenesWithScript.length > 0) {
        setPendingImportTrack(baseTrack);
        setPendingFileName(file.name);
        setIsConflictModalOpen(true);
      } else {
        setAudioTrack(baseTrack);
        setIsWaveformExpanded(true);
      }
    } catch (err) {
      console.error('Failed to import audio file:', err);
    }
    e.target.value = '';
  };

  const handleConfirmConflictChoice = (mode: AudioTrackRole) => {
    if (!pendingImportTrack) return;
    const isBgm = mode === 'music';
    const finalTrack: AudioTrackConfig = {
      ...pendingImportTrack,
      type: mode,
      isBackgroundBGM: isBgm,
      volume: isBgm ? 0.2 : 1.0,
    };
    setAudioTrack(finalTrack);
    setIsWaveformExpanded(true);
    setIsConflictModalOpen(false);
    setPendingImportTrack(null);
  };

  const handleBatchAIVoiceover = async () => {
    const cfg = getStoredTTSConfig();
    if (cfg.mode === 'cloud' && !cfg.apiKey.trim()) {
      setIsAIVoiceoverSettingsOpen(true);
      return;
    }

    // 双向防覆盖拦截守卫：若当前工程中已存在用户自行上传的音频，二次确认
    const currentTrack = dsl.audio?.tracks?.[0];
    const isUserUploaded =
      currentTrack?.url &&
      !currentTrack.id.startsWith('track-ai-') &&
      !currentTrack.id.startsWith('tts-') &&
      !currentTrack.id.startsWith('track-voiceover-') &&
      !currentTrack.id.startsWith('track-offline-');
    if (isUserUploaded) {
      const confirmMsg = t(
        'audio:confirmOverwriteCustomAudio',
        '工程中已有您上传的音频文件，生成 AI 旁白将替换该音频，是否继续？',
      );
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      setIsSynthesizingTTS(true);
      const defaultInterval = dsl.meta.controls?.interval || 3800;
      const res = await synthesizeAllScenesVoiceover(
        dsl.scenes,
        undefined,
        undefined,
        cfg.speed,
        defaultInterval,
      );

      // 批量将自适应后的分幕时长与专属物理音频同步更新到工程中
      batchSetScenes(res.updatedScenes);

      setAudioTrack(res.track);
      setIsWaveformExpanded(true);

      const storageState = useStorageStore.getState();
      if (storageState.currentProjectId) {
        storageState
          .saveProject(storageState.currentProjectId, {
            ...dsl,
            scenes: res.updatedScenes,
            audio: {
              ...dsl.audio,
              tracks: [res.track],
            },
          })
          .catch((err) => console.warn('[Timeline] Failed to save batch voiceover:', err));
      }
    } catch (err: any) {
      console.error('Failed to synthesize batch voiceover:', err);
      const cfg = getStoredTTSConfig();
      showAudioErrorToast({
        title: t('audio:errorModalTitle', '批量配音合成失败'),
        message: err?.message || String(err),
        details: err?.stack || String(err),
        provider: cfg.preset,
        model: cfg.model,
        onOpenSettings: () => setIsAIVoiceoverSettingsOpen(true),
        onRetry: () => handleBatchAIVoiceover(),
      });
    } finally {
      setIsSynthesizingTTS(false);
    }
  };

  const handleStartEditing = (idx: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(idx);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = (idx: number) => {
    if (editingTitle.trim() && onUpdateSceneTitle) {
      onUpdateSceneTitle(idx, editingTitle.trim());
    }
    setEditingIndex(null);
  };

  const handleDragStart = (idx: number, e: React.DragEvent) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx && onReorderScenes) {
      onReorderScenes(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <footer
      data-testid="timeline"
      className="flex flex-col border-t border-border bg-panel select-none z-20 shrink-0"
    >
      {/* 0. 可展开/折叠音频波形轨道 */}
      {isWaveformExpanded && (
        <AudioWaveformTrack
          height={68}
          currentPlayheadMs={isPlaying ? livePlayheadMs : activeSceneStartMs}
          onSelectScene={onSelectScene}
          onSeek={handleTimelineSeek}
        />
      )}

      {/* 1. 主场景时间轴卡片栏 */}
      <div className="h-20 px-4 flex items-center gap-4">
        {/* 左侧播放控制组 */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-xl border border-border/40 shrink-0">
          <Tooltip content={t('prevScene')} shortcut="←">
            <Button
              size="icon"
              variant="ghost"
              onClick={onPrev}
              disabled={activeSceneIndex === 0}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content={isPlaying ? t('pause') : t('play')} shortcut="Space">
            <Button
              size="icon"
              variant="cyan"
              data-testid="timeline-play-btn"
              onClick={onTogglePlay}
              className="h-8 w-8 rounded-lg"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </Button>
          </Tooltip>

          <Tooltip content={t('nextScene')} shortcut="→">
            <Button
              size="icon"
              variant="ghost"
              onClick={onNext}
              disabled={activeSceneIndex === scenes.length - 1}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Tooltip>

          <div className="h-4 w-px bg-border mx-1" />

          <span className="text-xs font-mono text-muted-foreground px-1">
            {String(activeSceneIndex + 1).padStart(2, '0')} /{' '}
            {String(scenes.length).padStart(2, '0')}
          </span>
        </div>

        {/* 中间场景切片横向滚动卡片列表 */}
        <div className="flex items-center gap-2.5 overflow-x-auto flex-1 py-1 no-scrollbar">
          {scenes.map((scene, idx) => {
            const isActive = activeSceneIndex === idx;
            const isDragging = draggedIdx === idx;
            const isOver = dragOverIdx === idx;
            const isEditing = editingIndex === idx;

            return (
              <div
                key={scene.id}
                data-testid={`scene-card-${idx}`}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(idx, e)}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDrop={(e) => handleDrop(idx, e)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectScene(idx)}
                onDoubleClick={() => {
                  onSelectScene(idx);
                  useEditorStore.getState().triggerFocusCamera();
                }}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all duration-150 ease-spring shrink-0 min-w-[180px] ${
                  isDragging ? 'opacity-40 scale-95 border-dashed border-primary' : ''
                } ${isOver ? 'ring-2 ring-primary scale-105' : ''} ${
                  isActive
                    ? 'border-primary/50 bg-primary/15 text-foreground ring-1 ring-primary/40 font-medium shadow-keycap-hover'
                    : 'border-border/40 bg-card/60 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground shadow-keycap hover:shadow-keycap-hover'
                }`}
              >
                {/* 场景微缩标志指示 */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border text-[11px] font-mono shrink-0 transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* 标题与时长 */}
                <div className="flex flex-col gap-0.5 truncate flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(idx)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(idx)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background border border-primary rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none w-full"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveTitle(idx);
                        }}
                        className="p-0.5 text-primary hover:opacity-80"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      onDoubleClick={(e) => handleStartEditing(idx, scene.title, e)}
                      className="truncate text-xs font-medium hover:text-primary"
                      title="双击就地修改标题"
                    >
                      {scene.title}
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    <span>{scene.duration.toFixed(1)}s</span>
                    {scene.boxCount !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" />
                        {scene.boxCount}
                      </span>
                    )}
                    {scene.zoom !== undefined && <span>{scene.zoom.toFixed(1)}x</span>}
                  </div>
                </div>

                {/* 悬停快捷操作组 (改名 / 复制 / 删除) */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                  <button
                    onClick={(e) => handleStartEditing(idx, scene.title, e)}
                    className="p-1 text-muted-foreground hover:text-primary transition"
                    title="重命名场景"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene?.(idx);
                    }}
                    className="p-1 text-muted-foreground hover:text-primary transition"
                    title={t('duplicateScene')}
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene?.(idx);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition"
                      title="删除场景"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* 添加新场景按钮 */}
          <Button
            variant="outline"
            size="sm"
            data-testid="add-scene-btn"
            onClick={onAddScene}
            className="border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary gap-1.5 h-11 px-3.5 rounded-xl shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addScene')}</span>
          </Button>
        </div>

        {/* 右侧音频工具与故事板总时长 */}
        <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-border">
          {/* 同屏录音按钮 */}
          <Tooltip content={t('recordVoiceoverTip')}>
            <Button
              size="sm"
              variant="outline"
              data-testid="voiceover-record-btn"
              onClick={() => setIsVoiceoverModalOpen(true)}
              className="gap-1 text-xs h-7 text-primary border-primary/40 hover:bg-primary/10"
            >
              <Mic className="w-3 h-3" />
              <span>{t('recordVoiceover')}</span>
            </Button>
          </Tooltip>

          {/* 导入外部干声音频 */}
          <Tooltip content={t('importAudioTip')}>
            <Button
              size="sm"
              variant="outline"
              data-testid="import-audio-btn"
              onClick={handleImportAudioClick}
              className="gap-1 text-xs h-7"
            >
              <Upload className="w-3 h-3" />
              <span>{t('importAudio')}</span>
            </Button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioFileChange}
          />

          {/* AI 提词合流与配置 */}
          <div className="flex items-center">
            <Tooltip content={t('aiTeleprompterTip')}>
              <Button
                size="sm"
                variant="ai"
                data-testid="ai-tts-batch-btn"
                onClick={handleBatchAIVoiceover}
                disabled={isSynthesizingTTS}
                className="gap-1 text-xs h-7 rounded-r-none border-r-0"
              >
                <Sparkles className={`w-3 h-3 ${isSynthesizingTTS ? 'animate-spin' : ''}`} />
                <span>
                  {isSynthesizingTTS ? t('aiTeleprompterSynthesizing') : t('aiTeleprompter')}
                </span>
              </Button>
            </Tooltip>
            <Tooltip content={t('aiSettingsTip')}>
              <Button
                size="icon"
                variant="ai"
                data-testid="ai-tts-settings-btn"
                onClick={() => setIsAIVoiceoverSettingsOpen(true)}
                className="h-7 w-6 px-0 rounded-l-none"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </Tooltip>
          </div>

          {/* 展开/收起波形轨切换按钮 */}
          <Tooltip content={isWaveformExpanded ? t('collapseWaveformTip') : t('expandWaveformTip')}>
            <Button
              size="icon"
              variant="ghost"
              data-testid="toggle-waveform-btn"
              onClick={() => setIsWaveformExpanded((v) => !v)}
              className={`h-7 w-7 ${isWaveformExpanded ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            >
              <Activity className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* 总时长统计 */}
          <div
            className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono"
            title={t('totalDurationTip', '项目视频总时长 (Total Duration)')}
          >
            <Film className="w-3.5 h-3.5 text-primary" />
            <span>
              {t('totalDuration')}: {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* 麦克风演播录音准备弹层 */}
      <VoiceoverPreflightModal
        isOpen={isVoiceoverModalOpen}
        onClose={() => setIsVoiceoverModalOpen(false)}
      />

      {/* AI 语音合成与提词配置弹层 */}
      <AIVoiceoverSettingsModal
        isOpen={isAIVoiceoverSettingsOpen}
        onClose={() => setIsAIVoiceoverSettingsOpen(false)}
        onSynthesizeBatch={handleBatchAIVoiceover}
      />

      {/* 导入音频与分幕提词冲突决策弹层 */}
      <AudioConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          setPendingImportTrack(null);
        }}
        onConfirm={handleConfirmConflictChoice}
        sceneScriptCount={dsl.scenes.filter((s) => !!s.voiceoverScript?.trim()).length}
        fileName={pendingFileName}
      />
    </footer>
  );
}

export const BottomTimeline = React.memo(BottomTimelineComponent);
