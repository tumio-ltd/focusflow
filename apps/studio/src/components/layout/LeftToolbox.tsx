import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MousePointer, 
  Square, 
  GitCommit, 
  CircleDot, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Tooltip } from '@/components/ui';

export type ToolType = 'select' | 'box' | 'path' | 'dot' | 'callout';

export interface LeftToolboxProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export function LeftToolbox({ activeTool, onToolChange }: LeftToolboxProps) {
  const { t } = useTranslation('toolbar');

  const tools = [
    {
      id: 'select' as ToolType,
      label: t('select'),
      shortcut: '1 / V',
      icon: MousePointer,
    },
    {
      id: 'box' as ToolType,
      label: t('box'),
      shortcut: '2 / R',
      icon: Square,
      featured: true,
    },
    {
      id: 'path' as ToolType,
      label: t('path'),
      shortcut: '3 / L',
      icon: GitCommit,
    },
    {
      id: 'dot' as ToolType,
      label: t('dot'),
      shortcut: '4 / D',
      icon: CircleDot,
    },
    {
      id: 'callout' as ToolType,
      label: t('callout'),
      shortcut: '5 / T',
      icon: MessageSquare,
    },
  ];

  return (
    <aside 
      data-testid="toolbox" 
      className="w-14 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col items-center py-4 gap-3 select-none z-20 shrink-0"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <Tooltip key={tool.id} content={tool.label} shortcut={tool.shortcut} position="right">
            <button
              data-testid={`tool-${tool.id}`}
              onClick={() => onToolChange(tool.id)}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 active:bg-slate-800'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tool.featured && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
              )}
            </button>
          </Tooltip>
        );
      })}

      <div className="flex-1" />

      {/* 底部 AI 辅助标定图标 */}
      <Tooltip content={t('aiExtraction')} position="right">
        <div className="w-9 h-9 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-slate-600 hover:text-cyan-400 hover:border-cyan-800/60 transition cursor-help">
          <Sparkles className="w-4 h-4" />
        </div>
      </Tooltip>
    </aside>
  );
}
