import React, { useState } from 'react';
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
  Check 
} from 'lucide-react';
import { Button, Tooltip } from '@/components/ui';

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

export function BottomTimeline({
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
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
      className="h-20 border-t border-border bg-panel/90 backdrop-blur-md px-4 flex items-center gap-4 select-none z-20 shrink-0 transition-colors duration-200"
    >
      {/* 1. 左侧播放控制组 */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border shrink-0">
        <Tooltip content={t('prevScene')} shortcut="←">
          <Button
            size="icon"
            variant="ghost"
            onClick={onPrev}
            disabled={activeSceneIndex === 0}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border mx-1" />

        <span className="text-xs font-mono text-muted-foreground px-1.5 font-semibold">
          {String(activeSceneIndex + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
        </span>
      </div>

      {/* 2. 中间场景切片横向滚动卡片列表 */}
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
              className={`group relative flex items-center gap-3 px-3.5 py-2 rounded-xl border cursor-pointer transition-all shrink-0 min-w-[200px] ${
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
                className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-mono shrink-0 transition ${
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
                      className="bg-background border border-primary rounded px-2 py-0.5 text-xs text-foreground focus:outline-none w-full font-medium"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveTitle(idx);
                      }}
                      className="p-0.5 text-primary hover:opacity-80"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={(e) => handleStartEditing(idx, scene.title, e)}
                    className="truncate text-xs font-medium text-foreground hover:text-primary"
                    title="双击就地修改标题"
                  >
                    {scene.title}
                  </span>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{scene.duration.toFixed(1)}s</span>
                  {scene.boxCount !== undefined && (
                    <span className="flex items-center gap-0.5">
                      <Layers className="w-3 h-3" />
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
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateScene?.(idx);
                  }}
                  className="p-1 text-muted-foreground hover:text-primary transition"
                  title={t('duplicateScene')}
                >
                  <Copy className="w-3.5 h-3.5" />
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
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 3. 添加新场景按钮 */}
        <Button
          variant="outline"
          size="sm"
          data-testid="add-scene-btn"
          onClick={onAddScene}
          className="border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary gap-1.5 h-12 px-3.5 rounded-xl shrink-0 text-xs font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addScene')}</span>
        </Button>
      </div>

      {/* 4. 右侧故事板总时长 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono shrink-0 pl-3 border-l border-border font-medium">
        <Film className="w-4 h-4 text-primary" />
        <span>{t('totalDuration')}: {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s</span>
      </div>
    </footer>
  );
}
