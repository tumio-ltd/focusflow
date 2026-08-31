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
        return <Square className="w-3 h-3 text-primary" />;
      case 'path':
        return <GitCommit className="w-3 h-3 text-accent" />;
      case 'dot':
        return <CircleDot className="w-3 h-3 text-purple-500" />;
      case 'callout':
        return <MessageSquare className="w-3 h-3 text-amber-500" />;
    }
  };

  return (
    <aside
      data-testid="inspector"
      className="w-72 border-l border-border bg-panel/80 backdrop-blur-md flex flex-col select-none z-20 shrink-0 overflow-y-auto transition-colors duration-200"
    >
      {/* 顶部标题 */}
      <div className="h-11 px-4 border-b border-border flex items-center justify-between text-xs font-semibold text-foreground uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>{t('inspectorTitle')}</span>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* 1. 场景镜头配置折叠面板 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsCameraOpen(!isCameraOpen)}
            className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>{t('sceneCamera')}</span>
            </div>
            {isCameraOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {isCameraOpen && (
            <div className="space-y-3 pl-1 pt-1 animate-in fade-in duration-100">
              <div>
                <label className="text-muted-foreground block mb-1 text-[11px] font-medium">{t('sceneTitle')}</label>
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
                className="w-full gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10 font-medium py-1.5 h-auto"
              >
                <Crosshair className="w-3.5 h-3.5 text-primary" />
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

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{t('cameraEasing')}</span>
                </span>
                <span className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded border border-border">
                  Cubic-Bezier(0.4, 0, 0.2, 1)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* 2. 当前场景图元图层列表 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{t('sceneElements')} ({elements.length})</span>
            </div>
            {isLayersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {isLayersOpen && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-100">
              {/* 搜索与一键继承栏 */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 text-muted-foreground absolute left-2 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="过滤图元..."
                    className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {canInherit && (
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="inherit-scene-btn"
                    onClick={onInheritPreviousScene}
                    className="gap-1 text-[11px] h-7 px-2 border-border hover:border-primary text-foreground hover:text-primary"
                    title="从上一幕继承图元激活状态"
                  >
                    <CopyCheck className="w-3 h-3" />
                    <span>继承</span>
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 no-scrollbar">
                {filteredElements.map((el) => (
                  <div
                    key={el.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition ${
                      el.active
                        ? 'bg-muted/80 border-border text-foreground shadow-sm'
                        : 'bg-background/40 border-border/50 text-muted-foreground opacity-60'
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
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* 3. 视觉主题色调预设 */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>{t('palette')}</span>
          </span>
          <div className="flex items-center gap-2 pt-1">
            {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7'].map((c) => (
              <div
                key={c}
                style={{ backgroundColor: c }}
                className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition shadow-md border border-white/20"
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
