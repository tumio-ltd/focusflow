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
  Play,
  Laptop,
  SlidersHorizontal,
  Code2
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
  onOpenTemplates?: () => void;
  onOpenProjects?: () => void;
  onOpenImport?: () => void;
  onOpenAudience?: () => void;
  onOpenDslEditor?: () => void;
  showPlayerControls?: boolean;
  onTogglePlayerControls?: () => void;
  isSaved?: boolean;
}

function TopBarComponent({
  title,
  onTitleChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onOpenTemplates,
  onOpenProjects,
  onOpenImport,
  onOpenAudience,
  onOpenDslEditor,
  showPlayerControls = false,
  onTogglePlayerControls,
  isSaved = true,
}: TopBarProps) {
  const { t, i18n } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const defaultTitle = title || t('defaultProjectTitle');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(defaultTitle);

  React.useEffect(() => {
    if (title) {
      setCurrentTitle(title);
    }
  }, [title]);

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
    <header className="h-14 border-b border-border bg-panel px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* 1. 左侧：Logo + 项目标题编辑 + 模式 Badge */}
      <div className="flex items-center gap-3 min-w-0 max-w-[42%] shrink">
        <div className="flex items-center gap-2 font-bold tracking-wide text-primary shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent-hover bg-clip-text text-transparent hidden sm:inline">
            {t('appName')}
          </span>
        </div>

        <Badge variant="cyan" className="shrink-0">{t('modeOffline')}</Badge>

        <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

        {/* 项目标题内联编辑 */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-background border border-primary rounded px-2 py-0.5 text-xs text-foreground focus:outline-none w-36 sm:w-48"
            />
            <Button size="sm" variant="ghost" onClick={handleTitleSubmit} className="h-6 w-6 p-0 shrink-0">
              <Check className="w-3.5 h-3.5 text-primary" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted cursor-pointer transition min-w-0 max-w-[130px] sm:max-w-[180px] md:max-w-[240px] lg:max-w-[300px]"
            title={t('editTitleTip')}
          >
            <span className="text-xs font-medium text-foreground truncate">{currentTitle}</span>
            <Edit3 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition shrink-0" />
          </div>
        )}

        <span className="text-[11px] text-muted-foreground font-mono shrink-0 hidden md:inline">
          {isSaved ? `• ${t('saved')}` : `• ${t('dirty')}`}
        </span>
      </div>

      {/* 2. 中间：撤销 / 重做 */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border shrink-0">
        <Tooltip content={t('undo')} shortcut="⌘Z" position="bottom">
          <Button
            size="icon"
            variant="ghost"
            data-testid="undo-btn"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content={t('redo')} shortcut="⇧⌘Z" position="bottom">
          <Button
            size="icon"
            variant="ghost"
            data-testid="redo-btn"
            disabled={!canRedo}
            onClick={onRedo}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>
      </div>

      {/* 3. 右侧：语言 + 主题 + 保存 + 一键导出 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 多语言切换 */}
        <Tooltip content={t('switchLang')} position="bottom">
          <Button
            size="sm"
            variant="outline"
            data-testid="locale-picker"
            onClick={toggleLanguage}
            className="h-8 text-xs gap-1.5 font-mono text-foreground px-2 sm:px-2.5"
          >
            <Languages className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{currentLang.toUpperCase()}</span>
          </Button>
        </Tooltip>

        {/* 科技暗黑 / 极简明亮 / 跟随系统 三态循环切换 */}
        <Tooltip content={theme === 'light' ? t('themeLight') : theme === 'system' ? t('themeSystem') : t('themeDark')} position="bottom">
          <Button
            size="icon"
            variant="outline"
            data-testid="theme-toggle"
            onClick={cycleTheme}
            className="h-8 w-8 text-foreground hover:text-primary"
          >
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : theme === 'system' ? (
              <Laptop className="w-3.5 h-3.5 text-sky-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-primary" />
            )}
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* 模板中心 */}
        <Tooltip content={t('templatesTip')} position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="open-templates-btn"
            onClick={onOpenTemplates}
            className="gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10 px-2 sm:px-2.5"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
            <span className="hidden xl:inline">{t('templatesCenter')}</span>
          </Button>
        </Tooltip>

        {/* 我的项目 */}
        <Tooltip content={t('projectsTip')} position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="open-projects-btn"
            onClick={onOpenProjects}
            className="gap-1.5 h-8 border-border text-foreground hover:bg-muted px-2 sm:px-2.5"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden xl:inline">{t('projectsList')}</span>
          </Button>
        </Tooltip>

        {/* 导入底图 */}
        <Tooltip content={t('importAssetTip')} position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="open-import-btn"
            onClick={onOpenImport}
            className="gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10 px-2 sm:px-2.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t('importAsset')}</span>
          </Button>
        </Tooltip>

        {/* 受众全屏演播 */}
        <Tooltip content={t('presentTip')} shortcut="F5" position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="audience-btn"
            onClick={onOpenAudience}
            className="gap-1.5 h-8 border-primary/40 text-primary hover:bg-primary/10 px-2.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('present')}</span>
          </Button>
        </Tooltip>

        {/* 底图独立播放控制栏显隐切换 */}
        <Tooltip content={showPlayerControls ? t('hidePlayerControls') : t('showPlayerControls')} position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="toggle-player-controls-btn"
            onClick={onTogglePlayerControls}
            className={`gap-1.5 h-8 px-2 sm:px-2.5 ${
              showPlayerControls
                ? 'bg-primary/20 text-primary border-primary font-medium'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">{t('playerControls')}</span>
          </Button>
        </Tooltip>

        {/* 实时 DSL JSON 代码编辑器 */}
        <Tooltip content="实时查看与编辑 DSL JSON" position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="dsl-editor-btn"
            onClick={onOpenDslEditor}
            className="gap-1.5 h-8 px-2 sm:px-2.5 border-border text-foreground hover:text-primary hover:border-primary/50"
          >
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-xs font-semibold">DSL</span>
          </Button>
        </Tooltip>

        {/* 保存草稿 */}
        <Tooltip content={t('saveDraftTip')} shortcut="⌘S" position="bottom" align="end">
          <Button size="sm" variant="secondary" onClick={onSave} className="gap-1.5 h-8 px-2 sm:px-2.5">
            <Save className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden xl:inline">{t('saveDraft')}</span>
          </Button>
        </Tooltip>

        {/* 导出中心 */}
        <Tooltip content={t('exportHtmlTip')} shortcut="⌘E" position="bottom" align="end">
          <Button 
            size="sm" 
            variant="primary" 
            data-testid="export-btn"
            onClick={onExport} 
            className="gap-1.5 h-8 px-3"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportHtml')}</span>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}

export const TopBar = React.memo(TopBarComponent);
