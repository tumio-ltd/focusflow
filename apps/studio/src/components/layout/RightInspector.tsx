import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sliders, 
  Camera, 
  Layers, 
  Eye, 
  EyeOff, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Palette,
  Clock,
  Crosshair,
  CopyCheck,
  Search,
  Square,
  GitCommit,
  CircleDot,
  MessageSquare
} from 'lucide-react';
import { Input, Slider, Button } from '@/components/ui';

export interface RightInspectorProps {
  sceneTitle?: string;
  onSceneTitleChange?: (title: string) => void;
  cameraZoom?: number;
  onCameraZoomChange?: (zoom: number) => void;
  cameraDuration?: number;
  onCameraDurationChange?: (duration: number) => void;
  onCaptureCurrentCamera?: () => void;
  canInherit?: boolean;
  onInheritPreviousScene?: () => void;
  elements?: {
    id: string;
    type: 'box' | 'path' | 'dot' | 'callout';
    name: string;
    active: boolean;
  }[];
  onToggleElement?: (id: string) => void;
  onDeleteElement?: (id: string) => void;
}

export function RightInspector({
  sceneTitle = '01 全局总览架构',
  onSceneTitleChange,
  cameraZoom = 1.0,
  onCameraZoomChange,
  cameraDuration = 1.2,
  onCameraDurationChange,
  onCaptureCurrentCamera,
  canInherit = false,
  onInheritPreviousScene,
  elements = [],
  onToggleElement,
  onDeleteElement,
}: RightInspectorProps) {
  const { t } = useTranslation('inspector');
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredElements = elements.filter((el) =>
    el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getElementIcon = (type: 'box' | 'path' | 'dot' | 'callout') => {
    switch (type) {
      case 'box':
        return <Square className="w-3.5 h-3.5 text-primary" />;
      case 'path':
        return <GitCommit className="w-3.5 h-3.5 text-accent" />;
      case 'dot':
        return <CircleDot className="w-3.5 h-3.5 text-purple-500" />;
      case 'callout':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <aside
      data-testid="inspector"
      className="w-80 border-l border-border bg-panel/80 backdrop-blur-md flex flex-col select-none z-20 shrink-0 overflow-y-auto transition-colors duration-200"
    >
      {/* 顶部标题 */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between text-sm font-semibold text-foreground tracking-wide">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span>{t('inspectorTitle')}</span>
        </div>
      </div>

      <div className="p-4 space-y-5 text-sm">
        {/* 1. 场景镜头配置折叠面板 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsCameraOpen(!isCameraOpen)}
            className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <span>{t('sceneCamera')}</span>
            </div>
            {isCameraOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>

          {isCameraOpen && (
            <div className="space-y-3.5 pl-1 pt-1 animate-in fade-in duration-100">
              <div>
                <label className="text-muted-foreground block mb-1 text-xs font-medium">{t('sceneTitle')}</label>
                <Input
                  value={sceneTitle}
                  onChange={(e) => onSceneTitleChange?.(e.target.value)}
                  placeholder={t('sceneTitlePlaceholder')}
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                data-testid="capture-camera-btn"
                onClick={onCaptureCurrentCamera}
                className="w-full gap-2 text-xs bg-primary/15 text-primary hover:bg-primary/25 font-medium py-2 h-auto rounded-lg border border-transparent shadow-keycap-cyan hover:shadow-keycap-cyan-hover hover:-translate-y-[0.5px] active:translate-y-[0.5px] transition-all duration-150 ease-spring"
              >
                <Crosshair className="w-4 h-4 text-primary" />
                <span>{t('captureCurrentView')}</span>
              </Button>

              <Slider
                label={t('cameraZoom')}
                valueDisplay={`${cameraZoom.toFixed(1)}x`}
                min="1.0"
                max="3.0"
                step="0.1"
                value={cameraZoom}
                onChange={(e) => onCameraZoomChange?.(parseFloat(e.target.value))}
              />

              <Slider
                label={t('cameraDuration')}
                valueDisplay={`${cameraDuration.toFixed(1)}s`}
                min="0.5"
                max="4.0"
                step="0.1"
                value={cameraDuration}
                onChange={(e) => onCameraDurationChange?.(parseFloat(e.target.value))}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{t('cameraEasing')}</span>
                </span>
                <span className="font-mono text-primary bg-muted/60 px-2 py-0.5 rounded-md font-semibold text-xs border border-transparent shadow-keycap">
                  Cubic-Bezier(0.4, 0, 0.2, 1)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border/40" />

        {/* 2. 当前场景图元图层列表 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>{t('sceneElements')} ({elements.length})</span>
            </div>
            {isLayersOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>

          {isLayersOpen && (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-100">
              {/* 搜索与一键继承栏 */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="过滤图元..."
                    className="w-full bg-background/50 border border-border/30 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                  />
                </div>

                {canInherit && (
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="inherit-scene-btn"
                    onClick={onInheritPreviousScene}
                    className="gap-1 text-xs h-8 px-2.5"
                    title="从上一幕继承图元激活状态"
                  >
                    <CopyCheck className="w-3.5 h-3.5" />
                    <span>继承</span>
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5 no-scrollbar">
                {filteredElements.map((el) => (
                  <div
                    key={el.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition border border-transparent ${
                      el.active
                        ? 'bg-muted/60 text-foreground font-medium shadow-none'
                        : 'bg-background/40 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <button
                        onClick={() => onToggleElement?.(el.id)}
                        className="text-muted-foreground hover:text-primary transition shrink-0"
                        title={el.active ? t('hideElementTip') : t('showElementTip')}
                      >
                        {el.active ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <span className="shrink-0">{getElementIcon(el.type)}</span>
                      <span className="truncate">{el.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteElement?.(el.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border/60" />

        {/* 3. 视觉主题色调预设 */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>{t('palette')}</span>
          </span>
          <div className="flex items-center gap-2.5 pt-1">
            {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'].map((c) => (
              <div
                key={c}
                style={{ backgroundColor: c }}
                className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition shadow-md border border-white/20"
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
