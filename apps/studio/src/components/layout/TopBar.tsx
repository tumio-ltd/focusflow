import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
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
  Edit3,
  UploadCloud,
  FolderGit2,
  LayoutTemplate,
  Play
} from 'lucide-react';
import { Button, Badge, Tooltip } from '@/components/ui';

export interface TopBarProps {
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onOpenImport?: () => void;
  onOpenProjects?: () => void;
  onOpenTemplates?: () => void;
  onOpenAudience?: () => void;
  isSaved?: boolean;
}

export function TopBar({
  title,
  onTitleChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onOpenImport,
  onOpenProjects,
  onOpenTemplates,
  onOpenAudience,
  isSaved = true,
}: TopBarProps) {
  const { t, i18n } = useTranslation('common');
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

  const defaultTitle = title || t('defaultProjectTitle');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(defaultTitle);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (currentTitle.trim() && onTitleChange) {
      onTitleChange(currentTitle.trim());
    }
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focusflow_locale', nextLang);
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
            {t('appName')}
          </span>
        </div>

        <Badge variant="cyan">{t('modeOffline')}</Badge>

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
            title={t('editTitleTip')}
          >
            <span className="text-xs font-medium text-slate-200">{currentTitle}</span>
            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        )}

        <span className="text-[11px] text-slate-500 font-mono">
          {isSaved ? `• ${t('saved')}` : `• ${t('dirty')}`}
        </span>
      </div>

      {/* 2. 中间：撤销 / 重做 */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
        <Tooltip content={t('undo')} shortcut="⌘Z">
          <Button
            size="icon"
            variant="ghost"
            data-testid="undo-btn"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-7 w-7 text-slate-400 hover:text-slate-100"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content={t('redo')} shortcut="⇧⌘Z">
          <Button
            size="icon"
            variant="ghost"
            data-testid="redo-btn"
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
        <Tooltip content={t('switchLang')}>
          <Button
            size="sm"
            variant="outline"
            data-testid="locale-picker"
            onClick={toggleLanguage}
            className="h-8 text-xs gap-1.5 font-mono"
          >
            <Languages className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentLang.toUpperCase()}</span>
          </Button>
        </Tooltip>

        {/* 暗黑/明亮主题切换 */}
        <Tooltip content={t('switchTheme')}>
          <Button
            size="icon"
            variant="outline"
            data-testid="theme-toggle"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-8 w-8 text-slate-300 hover:text-white"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* 模板中心 */}
        <Button
          size="sm"
          variant="outline"
          data-testid="open-templates-btn"
          onClick={onOpenTemplates}
          className="gap-1.5 h-8 border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-950/40"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('templatesCenter')}</span>
        </Button>

        {/* 我的项目 */}
        <Button
          size="sm"
          variant="outline"
          data-testid="open-projects-btn"
          onClick={onOpenProjects}
          className="gap-1.5 h-8 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('projectsList')}</span>
        </Button>

        {/* 导入底图 */}
        <Button
          size="sm"
          variant="outline"
          data-testid="open-import-btn"
          onClick={onOpenImport}
          className="gap-1.5 h-8 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{t('importAsset')}</span>
        </Button>

        {/* 受众全屏演播 */}
        <Button
          size="sm"
          variant="outline"
          data-testid="audience-btn"
          onClick={onOpenAudience}
          className="gap-1.5 h-8 border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/40"
          title="受众全屏演播试播"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>演播</span>
        </Button>

        {/* 保存草稿 */}
        <Button size="sm" variant="secondary" onClick={onSave} className="gap-1.5 h-8">
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span>{t('saveDraft')}</span>
        </Button>

        {/* 导出中心 */}
        <Button 
          size="sm" 
          variant="cyan" 
          data-testid="export-btn"
          onClick={onExport} 
          className="gap-1.5 h-8"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('exportHtml')}</span>
        </Button>
      </div>
    </header>
  );
}
