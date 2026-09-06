import React, { useState, useRef, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { AudioWaveformTrack } from '../timeline/AudioWaveformTrack';
import { VoiceoverPreflightModal } from '../timeline/VoiceoverPreflightModal';
import { decodeAudioFile } from '@/services/audio/audioDecoder';
import { synthesizeAllScenesVoiceover } from '@/services/audio/tts/aiTtsSynthesizer';
import type { AudioTrackConfig } from '@focusflow/dsl';

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
}: BottomTimelineProps) {
  const { t } = useTranslation('timeline');
  const { dsl, setAudioTrack } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isVoiceoverModalOpen, setIsVoiceoverModalOpen] = useState(false);
  const [isWaveformExpanded, setIsWaveformExpanded] = useState(Boolean(dsl.audio?.tracks?.length));
  const [isSynthesizingTTS, setIsSynthesizingTTS] = useState(false);

  // Sync isWaveformExpanded when audio track is updated
  useEffect(() => {
    if (dsl.audio?.tracks?.length) {
      setIsWaveformExpanded(true);
    }
  }, [dsl.audio?.tracks?.length]);

  const handleImportAudioClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const info = await decodeAudioFile(file);
      const url = URL.createObjectURL(file);
      const newTrack: AudioTrackConfig = {
        id: `track-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        durationMs: info.durationMs,
        volume: 1.0,
        muted: false,
      };
      setAudioTrack(newTrack);
      setIsWaveformExpanded(true);
    } catch (err) {
      console.error('Failed to import audio file:', err);
    }
    e.target.value = '';
  };

  const handleBatchAIVoiceover = async () => {
    try {
      setIsSynthesizingTTS(true);
      const res = await synthesizeAllScenesVoiceover(dsl.scenes);
      setAudioTrack(res.track);
      setIsWaveformExpanded(true);
    } catch (err) {
      console.error('Failed to synthesize batch voiceover:', err);
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
        <AudioWaveformTrack height={68} />
      )}

      {/* 1. 主场景时间轴卡片栏 */}
      <div className="h-20 px-4 flex items-center gap-4">
        {/* 左侧播放控制组 */}
        <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border shrink-0">
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
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
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
            {String(activeSceneIndex + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
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
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors duration-150 shrink-0 min-w-[180px] ${
                  isDragging ? 'opacity-40 scale-95 border-dashed border-primary' : ''
                } ${
                  isOver ? 'ring-2 ring-primary scale-105' : ''
                } ${
                  isActive
                    ? 'border-primary bg-primary/10 text-foreground shadow-md ring-1 ring-primary/30 font-medium'
                    : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'
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
          <Tooltip content="同屏演播麦克风录音 (实时 VU 与分幕打点)">
            <Button
              size="sm"
              variant="outline"
              data-testid="voiceover-record-btn"
              onClick={() => setIsVoiceoverModalOpen(true)}
              className="gap-1 text-xs h-7 text-primary border-primary/40 hover:bg-primary/10"
            >
              <Mic className="w-3 h-3" />
              <span>录音</span>
            </Button>
          </Tooltip>

          {/* 导入外部干声音频 */}
          <Tooltip content="导入成套干声音频文件 (MP3 / WAV / M4A / AAC)">
            <Button
              size="sm"
              variant="outline"
              data-testid="import-audio-btn"
              onClick={handleImportAudioClick}
              className="gap-1 text-xs h-7"
            >
              <Upload className="w-3 h-3" />
              <span>导入音频</span>
            </Button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioFileChange}
          />

          {/* AI 提词合流 */}
          <Tooltip content="AI 分幕提词语音合成与自适应拉伸时长">
            <Button
              size="sm"
              variant="outline"
              data-testid="ai-tts-batch-btn"
              onClick={handleBatchAIVoiceover}
              disabled={isSynthesizingTTS}
              className="gap-1 text-xs h-7 text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Sparkles className={`w-3 h-3 ${isSynthesizingTTS ? 'animate-spin' : ''}`} />
              <span>{isSynthesizingTTS ? '合成中...' : 'AI 提词'}</span>
            </Button>
          </Tooltip>

          {/* 展开/收起波形轨切换按钮 */}
          <Tooltip content={isWaveformExpanded ? '收起波形轨' : '展开波形轨'}>
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Film className="w-3.5 h-3.5 text-primary" />
            <span>{t('totalDuration')}: {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* 麦克风演播录音准备弹层 */}
      <VoiceoverPreflightModal
        isOpen={isVoiceoverModalOpen}
        onClose={() => setIsVoiceoverModalOpen(false)}
      />
    </footer>
  );
}

export const BottomTimeline = React.memo(BottomTimelineComponent);
