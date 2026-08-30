import React from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Film,
  Layers
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
  isPlaying = false,
  onTogglePlay,
  onNext,
  onPrev,
}: BottomTimelineProps) {
  return (
    <footer
      data-testid="timeline"
      className="h-20 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center gap-4 select-none z-20 shrink-0"
    >
      {/* 1. 左侧播放控制组 */}
      <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 shrink-0">
        <Tooltip content="上一幕" shortcut="←">
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

        <Tooltip content={isPlaying ? '暂停' : '连续播放'} shortcut="Space">
          <Button
            size="icon"
            variant="cyan"
            onClick={onTogglePlay}
            className="h-8 w-8 rounded-lg"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </Button>
        </Tooltip>

        <Tooltip content="下一幕" shortcut="→">
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

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(idx)}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all shrink-0 min-w-[170px] ${
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
              <div className="flex flex-col gap-0.5 truncate flex-1">
                <span className="truncate text-xs font-medium">{scene.title}</span>
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

              {/* 悬停复制操作 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateScene?.(idx);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-300 transition"
                title="复制当前场景"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* 3. 添加新场景按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddScene}
          className="border-dashed border-slate-700 hover:border-cyan-500/80 text-slate-400 hover:text-cyan-300 gap-1.5 h-11 px-3.5 rounded-xl shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加新场景</span>
        </Button>
      </div>

      {/* 4. 右侧故事板总时长 */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0 pl-2 border-l border-slate-800">
        <Film className="w-3.5 h-3.5 text-cyan-400" />
        <span>总时长: {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s</span>
      </div>
    </footer>
  );
}
