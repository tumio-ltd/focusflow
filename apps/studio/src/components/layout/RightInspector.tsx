import React, { useState, useRef, useEffect } from 'react';
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
  MessageSquare,
  Target,
  Sparkles,
  Check,
  Copy,
  Scan,
  Move,
  RotateCcw
} from 'lucide-react';
import { Input, Slider, Button } from '@/components/ui';
import { coordinateBus } from '@/utils/coordinateBus';

function LiveCoordinatesHUD({ viewportWidth, viewportHeight }: { viewportWidth: number; viewportHeight: number }) {
  const pixelRef = useRef<HTMLSpanElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return coordinateBus.subscribe((coords) => {
      if (pixelRef.current) {
        if (!coords) {
          pixelRef.current.textContent = 'X: -- , Y: --';
        } else {
          pixelRef.current.textContent = `X: ${Math.round(coords.x)} , Y: ${Math.round(coords.y)}`;
        }
      }
      if (percentRef.current) {
        if (!coords || !viewportWidth || !viewportHeight) {
          percentRef.current.textContent = 'L: --% , T: --%';
        } else {
          const pctX = ((coords.x / viewportWidth) * 100).toFixed(1);
          const pctY = ((coords.y / viewportHeight) * 100).toFixed(1);
          percentRef.current.textContent = `L: ${pctX}% , T: ${pctY}%`;
        }
      }
    });
  }, [viewportWidth, viewportHeight]);

  return (
    <div className="space-y-1.5 font-mono text-[11px]">
      <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded border border-border/40">
        <span className="text-muted-foreground">📐 像素:</span>
        <span ref={pixelRef} className="text-primary font-semibold">
          X: -- , Y: --
        </span>
      </div>
      <div className="flex items-center justify-between bg-muted/40 px-2 py-1 rounded border border-border/40">
        <span className="text-muted-foreground">📍 相对:</span>
        <span ref={percentRef} className="text-emerald-400 font-semibold">
          L: --% , T: --%
        </span>
      </div>
    </div>
  );
}

export interface RightInspectorProps {
  sceneTitle?: string;
  onSceneTitleChange?: (title: string) => void;
  cameraZoom?: number;
  onCameraZoomChange?: (zoom: number) => void;
  cameraX?: number;
  onCameraXChange?: (x: number) => void;
  cameraY?: number;
  onCameraYChange?: (y: number) => void;
  onCameraReset?: () => void;
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
  viewport?: { width: number; height: number };
  isSmartSnapEnabled?: boolean;
  onToggleSmartSnap?: () => void;
  isCrosshairEnabled?: boolean;
  onToggleCrosshair?: () => void;
}

function RightInspectorComponent({
  sceneTitle = '01 全局总览架构',
  onSceneTitleChange,
  cameraZoom = 1.0,
  onCameraZoomChange,
  cameraX = 0,
  onCameraXChange,
  cameraY = 0,
  onCameraYChange,
  onCameraReset,
  cameraDuration = 1.2,
  onCameraDurationChange,
  onCaptureCurrentCamera,
  canInherit = false,
  onInheritPreviousScene,
  elements = [],
  onToggleElement,
  onDeleteElement,
  viewport = { width: 1920, height: 1080 },
  isSmartSnapEnabled = true,
  onToggleSmartSnap,
  isCrosshairEnabled = false,
  onToggleCrosshair,
}: RightInspectorProps) {
  const { t } = useTranslation('inspector');
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopiedCoords, setHasCopiedCoords] = useState(false);

  const filteredElements = elements.filter((el) =>
    el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getElementIcon = (type: 'box' | 'path' | 'dot' | 'callout') => {
    switch (type) {
      case 'box':
        return <Square className="w-3 h-3 text-cyan-400" />;
      case 'path':
        return <GitCommit className="w-3 h-3 text-emerald-400" />;
      case 'dot':
        return <CircleDot className="w-3 h-3 text-purple-500" />;
      case 'callout':
        return <MessageSquare className="w-3 h-3 text-amber-500" />;
    }
  };

  const handleCopyCoordsJSON = () => {
    const coords = coordinateBus.get();
    const data = {
      x: coords ? Math.round(coords.x) : 0,
      y: coords ? Math.round(coords.y) : 0,
      percentX: coords && viewport.width ? Number(((coords.x / viewport.width) * 100).toFixed(2)) : 0,
      percentY: coords && viewport.height ? Number(((coords.y / viewport.height) * 100).toFixed(2)) : 0,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setHasCopiedCoords(true);
    setTimeout(() => setHasCopiedCoords(false), 2000);
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
                max="3.5"
                step="0.1"
                value={cameraZoom}
                onChange={(e) => onCameraZoomChange?.(parseFloat(e.target.value))}
              />

              {/* 水平与垂直运镜偏移精确数值调节 */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Slider
                  label={t('cameraX')}
                  valueDisplay={`${cameraX > 0 ? '+' : ''}${cameraX.toFixed(1)}%`}
                  min="-50.0"
                  max="50.0"
                  step="0.5"
                  value={cameraX}
                  onChange={(e) => onCameraXChange?.(parseFloat(e.target.value))}
                />
                <Slider
                  label={t('cameraY')}
                  valueDisplay={`${cameraY > 0 ? '+' : ''}${cameraY.toFixed(1)}%`}
                  min="-50.0"
                  max="50.0"
                  step="0.5"
                  value={cameraY}
                  onChange={(e) => onCameraYChange?.(parseFloat(e.target.value))}
                />
              </div>

              {/* 交互提示与一键居中复位 */}
              <div className="flex items-center justify-between pt-0.5 pb-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 text-[10px] text-cyan-400/80">
                  <Move className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate" title={t('dragCameraTip')}>{t('dragCameraTip')}</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid="reset-camera-center-btn"
                  onClick={onCameraReset}
                  className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1 shrink-0"
                  title={t('cameraReset')}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>复位</span>
                </Button>
              </div>

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
                    placeholder={t('filterElementsPlaceholder')}
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

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
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

        <div className="h-px bg-border" />

        {/* 4. 标定助手常驻控制面板 (Calibration Assistant HUD) */}
        <div className="space-y-3" data-testid="calibration-assistant-panel">
          <div
            onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
            className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
          >
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-primary font-bold">{t('calibrationTitle')}</span>
            </div>
            {isCalibrationOpen ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {isCalibrationOpen && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-100 bg-background/50 border border-primary/20 rounded-xl p-3 shadow-inner">
              {/* 底图原生分辨率 */}
              <div className="flex items-center justify-between text-[11px] pb-2 border-b border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Scan className="w-3 h-3 text-primary" />
                  <span>{t('baseResolution')}</span>
                </span>
                <span className="font-mono text-primary font-medium bg-primary/10 border border-primary/30 px-2 py-0.5 rounded text-[10px]">
                  {viewport.width} × {viewport.height}
                </span>
              </div>

              {/* 实时光标坐标读数 (隔离在独立微组件中，0 级重渲染穿透) */}
              <LiveCoordinatesHUD viewportWidth={viewport.width} viewportHeight={viewport.height} />

              {/* 智能贴合与十字准星开关 */}
              <div className="space-y-2 pt-1 border-t border-border/60">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-1.5 text-[11px] text-foreground group-hover:text-primary transition" title={t('smartSnapDesc')}>
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>{t('smartSnap')}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isSmartSnapEnabled}
                    onChange={onToggleSmartSnap}
                    className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-1.5 text-[11px] text-foreground group-hover:text-primary transition" title={t('crosshairDesc')}>
                    <Crosshair className="w-3 h-3 text-primary" />
                    <span>{t('crosshairGuide')}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isCrosshairEnabled}
                    onChange={onToggleCrosshair}
                    className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                  />
                </label>
              </div>

              {/* 快捷复制坐标 JSON */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCoordsJSON}
                className="w-full gap-1.5 text-[11px] h-7 border-border hover:border-primary text-foreground hover:text-primary font-medium"
              >
                {hasCopiedCoords ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{t('copiedCoords')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{t('copyCoords')}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export const RightInspector = React.memo(RightInspectorComponent);
