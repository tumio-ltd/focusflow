import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { 
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
  Code2,
  Sparkles,
  Share2,
  Crown,
  ChevronDown,
  Gauge,
  CreditCard,
  Box,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { Button, Badge, Tooltip, BrandLogo } from '@/components/ui';
import { isModeBEnabled } from '@/utils/featureFlags';

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
  onOpenAutoTour?: () => void;
  onOpenAudience?: () => void;
  onOpenShare?: () => void;
  onOpenDslEditor?: () => void;
  onOpenSubscription?: () => void;
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
  onOpenAutoTour,
  onOpenAudience,
  onOpenShare,
  onOpenDslEditor,
  onOpenSubscription,
  showPlayerControls = false,
  onTogglePlayerControls,
  isSaved = true,
}: TopBarProps) {
  const { t, i18n } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

  const [isAssetsDropdownOpen, setIsAssetsDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isProDropdownOpen, setIsProDropdownOpen] = useState(false);

  const assetsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const proRef = useRef<HTMLDivElement>(null);

  const modeB = isModeBEnabled();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assetsRef.current && !assetsRef.current.contains(e.target as Node)) {
        setIsAssetsDropdownOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
      if (proRef.current && !proRef.current.contains(e.target as Node)) {
        setIsProDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focusflow_locale', nextLang);
    }
  };

  const defaultTitle = title || t('defaultProjectTitle');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(defaultTitle);

  useEffect(() => {
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

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="h-14 border-b border-border bg-panel/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between select-none z-30 shrink-0 transition-colors duration-200">
      {/* 1. 左侧区域：Logo + 模式状态 + 项目标题编辑 */}
      <div className="flex items-center gap-2.5 min-w-0 max-w-[42%] shrink">
        <BrandLogo size="md" className="shrink-0" />

        <Badge variant={modeB ? 'cyan' : 'slate'} className="shrink-0 text-[10px] px-1.5 py-0.5">
          {modeB ? 'Cloud Ready' : t('modeOffline')}
        </Badge>

        <div className="h-4 w-px bg-border/40 mx-0.5 shrink-0" />

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
              className="bg-background border border-primary/50 rounded-lg px-2 py-0.5 text-xs font-medium text-foreground focus:outline-none w-32 sm:w-44"
            />
            <Button size="icon" variant="ghost" onClick={handleTitleSubmit} className="h-6 w-6 shrink-0">
              <Check className="w-3.5 h-3.5 text-primary" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            data-testid="project-title-btn"
            className="group flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-muted/60 cursor-pointer transition min-w-0 max-w-[120px] sm:max-w-[160px] md:max-w-[220px]"
            title={t('editTitleTip')}
          >
            <span data-testid="project-title-text" className="text-xs font-medium text-foreground truncate">{currentTitle}</span>
            <Edit3 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition shrink-0" />
          </div>
        )}

        <span className="text-[11px] text-muted-foreground font-mono shrink-0 hidden lg:inline">
          {isSaved ? `• ${t('saved')}` : `• ${t('dirty')}`}
        </span>
      </div>

      {/* 2. 中间区域：历史动作 (撤销/重做) */}
      <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg shrink-0">
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
        <Tooltip content={t('redo')} shortcut="⌘⇧Z" position="bottom">
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

      {/* 3. 右侧功能区：逻辑归组（资产工程组 + 开发者工具组 + 商业特权 + 核心演播导出） */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* 3.1 资产与工程聚合下拉组 (Assets & Project Drawer) */}
        <div className="relative" ref={assetsRef}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAssetsDropdownOpen(!isAssetsDropdownOpen)}
            className="h-8 gap-1.5 px-2.5 text-xs text-foreground hover:bg-muted font-medium"
          >
            <Box className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden md:inline">工程资产</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
          </Button>

          {isAssetsDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-card border border-border shadow-elevation-modal py-1.5 z-50 text-xs animate-in fade-in duration-100 whitespace-nowrap">
              <button
                onClick={() => {
                  setIsAssetsDropdownOpen(false);
                  onOpenProjects?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                <span>我的项目列表</span>
              </button>
              <button
                onClick={() => {
                  setIsAssetsDropdownOpen(false);
                  onOpenTemplates?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                <span>官方精选模板</span>
              </button>
              <button
                onClick={() => {
                  setIsAssetsDropdownOpen(false);
                  onOpenImport?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                <span>更换底图资产</span>
              </button>
            </div>
          )}
        </div>

        {/* 3.2 高级工具与控制显隐组 (Tools & Controls) */}
        <div className="relative" ref={toolsRef}>
          <Tooltip content="开发者与调试工具" position="bottom">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className="h-8 w-8 p-0 text-foreground hover:bg-muted"
            >
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </Tooltip>

          {isToolsDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-card border border-border shadow-elevation-modal py-1.5 z-50 text-xs animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setIsToolsDropdownOpen(false);
                  onOpenDslEditor?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>实时 DSL 代码编辑器</span>
              </button>
              <button
                onClick={() => {
                  setIsToolsDropdownOpen(false);
                  onTogglePlayerControls?.();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                  <span>独立播放控制浮条</span>
                </div>
                {showPlayerControls && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* 3.3 AI 导览 (Auto-Tour) - 保持突出高亮 */}
        <Tooltip content={t('autoTourTip', 'AI 辅助工程初始化 (Auto-Tour)')} position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="open-auto-tour-btn"
            onClick={onOpenAutoTour}
            className="gap-1.5 h-8 border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-400 px-2 sm:px-2.5 font-medium shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">{t('autoTourBtn', 'AI 导览')}</span>
          </Button>
        </Tooltip>

        {/* 3.4 💎 Pro 商业特权与用量中心聚合入口 (Mode B Managed) */}
        <div className="relative" ref={proRef}>
          <Button
            size="sm"
            variant="outline"
            disabled={!modeB}
            onClick={() => {
              if (modeB) {
                setIsProDropdownOpen(!isProDropdownOpen);
              }
            }}
            title={!modeB ? '云端商业与算力中心仅在云端服务模式下可用' : 'FocusFlow 商业特权与算力中心'}
            className={`gap-1.5 h-8 px-2.5 font-medium shadow-sm transition-all ${
              !modeB
                ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                : 'border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">💎 Pro</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>

          {isProDropdownOpen && modeB && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-card border border-border shadow-elevation-modal py-1.5 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-3 py-1.5 border-b border-border/60 text-[10px] text-muted-foreground font-mono">
                FOCUSFLOW COMMERCIAL
              </div>
              <button
                onClick={() => {
                  setIsProDropdownOpen(false);
                  navigateTo('/pricing');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold">升级 Pro / 定价</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </button>
              <button
                onClick={() => {
                  setIsProDropdownOpen(false);
                  navigateTo('/billing');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-primary" />
                  <span>算力与用量水表</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">4K/TTS</span>
              </button>
              <button
                onClick={() => {
                  setIsProDropdownOpen(false);
                  onOpenSubscription?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted/70 transition-colors text-left cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>极速收银台弹窗</span>
              </button>
            </div>
          )}
        </div>

        {/* 3.5 云端分享 (Mode B Managed) */}
        <Tooltip
          content={!modeB ? '云端只读短链与嵌入仅在 Mode B 模式下生效' : '生成只读分享短链与知识库嵌入代码'}
          position="bottom"
          align="end"
        >
          <Button 
            size="sm" 
            variant="outline" 
            data-testid="share-btn"
            disabled={!modeB}
            onClick={modeB ? onOpenShare : undefined} 
            className={`gap-1.5 h-8 px-2 sm:px-2.5 font-medium shadow-sm ${
              !modeB
                ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                : 'border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-400'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">分享</span>
          </Button>
        </Tooltip>

        {/* 分割线 */}
        <div className="h-4 w-px bg-border/40 mx-0.5 shrink-0" />

        {/* 3.6 受众全屏演播 */}
        <Tooltip content={t('presentTip')} shortcut="F5" position="bottom" align="end">
          <Button
            size="sm"
            variant="outline"
            data-testid="audience-btn"
            onClick={onOpenAudience}
            className="gap-1.5 h-8 border-primary/30 text-primary hover:bg-primary/10 px-2 sm:px-2.5 font-medium"
          >
            <Play className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>{t('present')}</span>
          </Button>
        </Tooltip>

        {/* 3.7 保存草稿 */}
        <Tooltip content={t('saveDraftTip')} shortcut="⌘S" position="bottom" align="end">
          <Button size="sm" variant="secondary" onClick={onSave} className="gap-1.5 h-8 px-2 sm:px-2.5">
            <Save className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden 2xl:inline">{t('saveDraft')}</span>
          </Button>
        </Tooltip>

        {/* 3.8 核心导出中心 (暖珊瑚橙 CTA) */}
        <Tooltip content={t('exportHtmlTip')} shortcut="⌘E" position="bottom" align="end">
          <Button 
            size="sm" 
            variant="cta" 
            data-testid="export-btn"
            onClick={onExport} 
            className="gap-1.5 h-8 px-3 font-semibold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportHtml')}</span>
          </Button>
        </Tooltip>

        {/* 分割线 */}
        <div className="h-4 w-px bg-border/40 mx-0.5 shrink-0" />

        {/* 3.9 系统辅助配置 (语言 + 主题) */}
        <Tooltip content={t('switchLang')} position="bottom">
          <Button
            size="icon"
            variant="ghost"
            data-testid="locale-picker"
            onClick={toggleLanguage}
            className="h-8 w-8 text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            <Languages className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>

        <Tooltip content={theme === 'light' ? t('themeLight') : theme === 'system' ? t('themeSystem') : t('themeDark')} position="bottom">
          <Button
            size="icon"
            variant="ghost"
            data-testid="theme-toggle"
            onClick={cycleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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

      </div>
    </header>
  );
}

export const TopBar = React.memo(TopBarComponent);
