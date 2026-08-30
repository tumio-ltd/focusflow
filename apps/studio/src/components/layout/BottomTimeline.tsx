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
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
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
      className="h-20 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center gap-4 select-none z-20 shrink-0"
    >
      {/* 1. 左侧播放控制组 */}
      <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 shrink-0">
        <Tooltip content={t('prevScene')} shortcut="←">
          <Button
            size="icon"
            variant="ghost"
            onClick={onPrev}
            disabled={activeSceneIndex === 0}
            className="h-7 w-7 text-slate-400 hover:text-white"
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
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <span className="text-xs font-mono text-slate-400 px-1">
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
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all shrink-0 min-w-[180px] ${
                isDragging ? 'opacity-40 scale-95 border-dashed border-cyan-400' : ''
              } ${
                isOver ? 'ring-2 ring-cyan-400 scale-105' : ''
              } ${
                isActive
                  ? 'border-cyan-500/80 bg-cyan-950/30 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/30 font-medium'
                  : 'border-slate-800/80 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              {/* 场景微缩标志指示 */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center border text-[11px] font-mono shrink-0 transition ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700'
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
                      className="bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveTitle(idx);
                      }}
                      className="p-0.5 text-cyan-400 hover:text-cyan-300"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span
                    onDoubleClick={(e) => handleStartEditing(idx, scene.title, e)}
                    className="truncate text-xs font-medium hover:text-cyan-300"
                    title="双击就地修改标题"
                  >
                    {scene.title}
                  </span>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
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
                  className="p-1 text-slate-400 hover:text-cyan-300 transition"
                  title="重命名场景"
                >
                  <Edit3 className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateScene?.(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-cyan-300 transition"
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
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="删除场景"
                  >
                    <Trash2 className="w-3 h-3" />
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
          className="border-dashed border-slate-700 hover:border-cyan-500/80 text-slate-400 hover:text-cyan-300 gap-1.5 h-11 px-3.5 rounded-xl shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('addScene')}</span>
        </Button>
      </div>

      {/* 4. 右侧故事板总时长 */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0 pl-2 border-l border-slate-800">
        <Film className="w-3.5 h-3.5 text-cyan-400" />
        <span>{t('totalDuration')}: {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s</span>
      </div>
    </footer>
  );
}
