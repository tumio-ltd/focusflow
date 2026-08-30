import React, { useState } from 'react';
import { 
  Sparkles, 
  Undo2, 
  Redo2, 
  Save, 
  Download, 
  Sun, 
  Moon, 
  Languages, 
  Check, 
  Edit3
} from 'lucide-react';
import { Button, Badge, Tooltip } from '@/components/ui';

export interface TopBarProps {
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  isDark?: boolean;
  onThemeToggle?: () => void;
  locale?: 'zh' | 'en';
  onLocaleChange?: (newLocale: 'zh' | 'en') => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  isSaved?: boolean;
}

export function TopBar({
  title = '未命名架构演示项目',
  onTitleChange,
  isDark = true,
  onThemeToggle,
  locale = 'zh',
  onLocaleChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onExport,
  isSaved = true,
}: TopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (currentTitle.trim() && onTitleChange) {
      onTitleChange(currentTitle.trim());
    }
  };

  return (
    <header className="h-13 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* 1. 左侧：Logo + 项目标题编辑 + 模式 Badge */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2 font-bold tracking-wide text-cyan-400">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-sky-200 bg-clip-text text-transparent">
            FocusFlow Studio
          </span>
        </div>

        <Badge variant="cyan">Mode A (Offline)</Badge>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* 项目标题内联编辑 */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-slate-800 border border-cyan-500/60 rounded px-2 py-0.5 text-xs text-slate-100 focus:outline-none"
            />
            <Button size="sm" variant="ghost" onClick={handleTitleSubmit} className="h-6 w-6 p-0">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/60 cursor-pointer transition"
            title="点击修改项目标题"
          >
            <span className="text-xs font-medium text-slate-200">{currentTitle}</span>
            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        )}

        <span className="text-[11px] text-slate-500 font-mono">
          {isSaved ? '• 已保存' : '• 有未保存变更'}
        </span>
      </div>

      {/* 2. 中间：撤销 / 重做 */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
        <Tooltip content="撤销" shortcut="⌘Z">
          <Button
            size="icon"
            variant="ghost"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-7 w-7 text-slate-400 hover:text-slate-100"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content="重做" shortcut="⇧⌘Z">
          <Button
            size="icon"
            variant="ghost"
            disabled={!canRedo}
            onClick={onRedo}
            className="h-7 w-7 text-slate-400 hover:text-slate-100"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>
      </div>

      {/* 3. 右侧：语言 + 主题 + 保存 + 一键导出 */}
      <div className="flex items-center gap-2">
        {/* 多语言切换 */}
        <Tooltip content={locale === 'zh' ? '切换为 English' : 'Switch to 中文'}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLocaleChange?.(locale === 'zh' ? 'en' : 'zh')}
            className="h-8 text-xs gap-1.5 font-mono"
          >
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <span>{locale.toUpperCase()}</span>
          </Button>
        </Tooltip>

        {/* 暗黑/明亮主题切换 */}
        <Tooltip content={isDark ? '切换至明亮主题' : '切换至暗黑主题'}>
          <Button
            size="icon"
            variant="outline"
            onClick={onThemeToggle}
            className="h-8 w-8 text-slate-300 hover:text-white"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* 保存草稿 */}
        <Button size="sm" variant="secondary" onClick={onSave} className="gap-1.5 h-8">
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span>保存草稿</span>
        </Button>

        {/* 一键导出 HTML */}
        <Button size="sm" variant="cyan" onClick={onExport} className="gap-1.5 h-8">
          <Download className="w-3.5 h-3.5" />
          <span>导出独立 HTML</span>
        </Button>
      </div>
    </header>
  );
}
