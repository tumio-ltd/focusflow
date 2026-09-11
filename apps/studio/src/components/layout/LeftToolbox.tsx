import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MousePointer, 
  Square, 
  GitCommit, 
  CircleDot, 
  MessageSquare,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { Tooltip } from '@/components/ui';

export type ToolType = 'select' | 'box' | 'path' | 'dot' | 'callout' | 'image';

export interface LeftToolboxProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

function LeftToolboxComponent({ activeTool, onToolChange }: LeftToolboxProps) {
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
    {
      id: 'image' as ToolType,
      label: t('image', '插图'),
      shortcut: '6 / I',
      icon: ImageIcon,
    },
  ];

  return (
    <aside 
      data-testid="toolbox" 
      className="w-14 border-r border-border bg-panel/80 backdrop-blur-md flex flex-col items-center py-3 gap-2 select-none z-20 shrink-0 transition-colors duration-200"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <Tooltip key={tool.id} content={tool.label} shortcut={tool.shortcut} position="right">
            <button
              data-testid={`tool-${tool.id}`}
              onClick={() => onToolChange(tool.id)}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ease-spring ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-keycap-cyan ring-1 ring-primary/40 font-semibold active:scale-95'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted active:scale-95'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          </Tooltip>
        );
      })}

      <div className="flex-1" />

      {/* 底部 AI 辅助标定图标 */}
      <Tooltip content={t('aiExtraction')} position="right">
        <div className="w-10 h-10 rounded-xl bg-muted/20 border border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all duration-150 ease-spring cursor-help active:scale-95">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
      </Tooltip>
    </aside>
  );
}

export const LeftToolbox = React.memo(LeftToolboxComponent);
