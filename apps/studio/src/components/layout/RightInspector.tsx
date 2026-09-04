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
  Crosshair,
  CopyCheck,
  Search,
  Square,
  GitCommit,
  CircleDot,
  MessageSquare,
  Image as ImageIcon,
  Target,
  Sparkles,
  Check,
  Copy,
  Scan,
  RotateCcw,
  Zap,
  Gauge,
  Film,
  Info,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { Input, Slider, Button } from '@/components/ui';
import { coordinateBus } from '@/utils/coordinateBus';
import { calculateAdaptiveCalloutStyle } from '@/utils/calloutTypography';
import { useEditorStore, useProjectStore } from '@/stores';

function LiveCoordinatesHUD({ viewportWidth, viewportHeight }: { viewportWidth: number; viewportHeight: number }) {
  const { t } = useTranslation('inspector');
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
    <div className="space-y-1 font-mono text-[11px]">
      <div className="flex items-center justify-between bg-muted/40 px-2 py-0.5 rounded border border-border/40">
        <span className="text-muted-foreground text-[10px]">{t('pixelCoord', '📐 物理像素')}:</span>
        <span ref={pixelRef} className="text-primary font-semibold text-[10px]">
          X: -- , Y: --
        </span>
      </div>
      <div className="flex items-center justify-between bg-muted/40 px-2 py-0.5 rounded border border-border/40">
        <span className="text-muted-foreground text-[10px]">{t('percentCoord', '📍 相对百分比')}:</span>
        <span ref={percentRef} className="text-emerald-400 font-semibold text-[10px]">
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
    type: 'box' | 'path' | 'dot' | 'callout' | 'image';
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
  isSmartSnapEnabled = false,
  onToggleSmartSnap,
  isCrosshairEnabled = false,
  onToggleCrosshair,
}: RightInspectorProps) {
  const { t } = useTranslation('inspector');
  const [activeTab, setActiveTab] = useState<'scene' | 'elements'>('scene');
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopiedCoords, setHasCopiedCoords] = useState(false);

  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElementId = useEditorStore((s) => s.setSelectedElementId);
  const activeDrawingColor = useEditorStore((s) => s.activeDrawingColor);
  const setActiveDrawingColor = useEditorStore((s) => s.setActiveDrawingColor);
  const updateElementStyle = useProjectStore((s) => s.updateElementStyle);
  const updateDotPosition = useProjectStore((s) => s.updateDotPosition);
  const updateCallout = useProjectStore((s) => s.updateCallout);
  const updateImage = useProjectStore((s) => s.updateImage);
  const dsl = useProjectStore((s) => s.dsl);

  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // 当在画布或列表中选中任何图元时，自动平滑切入【图元属性】Tab
  useEffect(() => {
    if (selectedElementId) {
      setActiveTab('elements');
    }
  }, [selectedElementId]);

  const allCallouts = React.useMemo(() => {
    const map = new Map<string, any>();
    dsl.scenes.forEach((s) => {
      (s.activeElements?.callouts || []).forEach((c) => {
        if (!map.has(c.id)) map.set(c.id, c);
      });
    });
    return Array.from(map.values());
  }, [dsl.scenes]);

  const selectedBox = dsl.elements?.boxes?.find((b) => b.id === selectedElementId);
  const selectedPath = dsl.elements?.paths?.find((p) => p.id === selectedElementId);
  const selectedDot = dsl.elements?.dots?.find((d) => d.id === selectedElementId);
  const selectedCallout = allCallouts.find((c) => c.id === selectedElementId);
  const selectedImage = dsl.elements?.images?.find((img) => img.id === selectedElementId);

  const filteredElements = elements.filter((el) =>
    el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getElementIcon = (type: 'box' | 'path' | 'dot' | 'callout' | 'image') => {
    switch (type) {
      case 'box':
        return <Square className="w-3 h-3 text-cyan-400" />;
      case 'path':
        return <GitCommit className="w-3 h-3 text-emerald-400" />;
      case 'dot':
        return <CircleDot className="w-3 h-3 text-amber-400" />;
      case 'callout':
        return <MessageSquare className="w-3 h-3 text-purple-400" />;
      case 'image':
        return <ImageIcon className="w-3 h-3 text-pink-400" />;
    }
  };

  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    return coordinateBus.subscribeCopy(() => {
      setHasCopiedCoords(true);
      setTimeout(() => setHasCopiedCoords(false), 1500);
    });
  }, []);

  const copyCoordinatesJson = () => {
    const success = coordinateBus.copyCoordinates(viewport.width, viewport.height);
    if (success) {
      setHasCopiedCoords(true);
      setTimeout(() => setHasCopiedCoords(false), 1500);
    }
  };

  // 渲染图层层级列表组件 (在【场景运镜】与【图元属性】双 Tab 中保持常驻可用)
  const renderLayerHierarchyList = () => (
    <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-3" data-testid="layer-hierarchy-panel">
      <div
        onClick={() => setIsLayersOpen(!isLayersOpen)}
        className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{t('layerList', '图层层级列表')}</span>
          <span className="text-[10px] text-muted-foreground font-mono font-normal">
            ({elements.length})
          </span>
        </div>
        {isLayersOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>

      {isLayersOpen && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
          {/* 图元搜索框 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('searchElement', '搜索图元名称或 ID...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs bg-background h-8"
            />
          </div>

          {/* 继承前幕全部图元按钮 */}
          {canInherit && (
            <Button
              size="sm"
              variant="outline"
              onClick={onInheritPreviousScene}
              className="w-full gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 h-7"
            >
              <CopyCheck className="w-3.5 h-3.5" />
              <span>{t('inheritPrevious', '从上一幕继承图元')}</span>
            </Button>
          )}

          {/* 图元项目列表 */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {filteredElements.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {t('noElements', '暂无图元')}
              </div>
            ) : (
              filteredElements.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 border-primary text-foreground font-semibold ring-1 ring-primary/40'
                        : 'bg-background/80 border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-2">
                      {getElementIcon(el.type)}
                      <span className="truncate">{el.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                      {/* 显隐切换按钮 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleElement?.(el.id);
                        }}
                        className={`p-1 rounded hover:bg-muted ${
                          el.active ? 'text-primary' : 'text-muted-foreground opacity-40'
                        }`}
                        title={el.active ? t('activeInScene', '在当前场景激活展示') : t('hiddenInScene', '在当前场景隐藏')}
                      >
                        {el.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 删除图元按钮 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement?.(el.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        title={t('deleteElement', '删除图元')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <aside
      data-testid="inspector"
      id="right-inspector"
      className="w-80 h-full border-l border-border bg-panel flex flex-col select-none z-20 shrink-0 text-foreground transition-colors duration-200"
    >
      {/* 1. 顶部 Header 与实时 HUD */}
      <div className="p-3 border-b border-border space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">{t('inspectorTitle', '属性检查器')}</span>
          </div>
          <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
            {viewport.width} × {viewport.height}
          </span>
        </div>

        {/* 实时坐标浮窗 */}
        <LiveCoordinatesHUD viewportWidth={viewport.width} viewportHeight={viewport.height} />
      </div>

      {/* 2. 核心双 Tab 导航条 */}
      <div className="px-3 pt-2.5 pb-2 border-b border-border flex gap-1.5 bg-muted/40 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('scene')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'scene'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>{t('tabScene', '🎬 场景运镜')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('elements')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
            activeTab === 'elements'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{t('tabElements', '🎨 图元属性')}</span>
          {selectedElementId && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1 right-1.5 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Tab 内容区 (滚动容器) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* =========================================================================
            TAB 1: 🎬 场景与运镜 (Scene & Camera & Calibration)
           ========================================================================= */}
        {activeTab === 'scene' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1.1 摄像机镜头与运镜控制卡片 */}
            <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-3">
              <div
                onClick={() => setIsCameraOpen(!isCameraOpen)}
                className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">{t('cameraControls', '场景运镜控制')}</span>
                </div>
                {isCameraOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>

              {isCameraOpen && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  {/* 分幕标题 */}
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium">{t('sceneTitle', '分幕标题')}</label>
                    <Input
                      value={sceneTitle}
                      onChange={(e) => onSceneTitleChange?.(e.target.value)}
                      placeholder={t('sceneTitlePlaceholder', '请输入分幕标题')}
                      className="text-xs bg-background h-8"
                    />
                  </div>

                  {/* 一键捕获当前视野为关键帧 */}
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="capture-camera-btn"
                    onClick={onCaptureCurrentCamera}
                    className="w-full gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10 font-medium py-1.5 h-auto"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-primary" />
                    <span>{t('captureCurrentView', '捕获当前画布视角')}</span>
                  </Button>

                  {/* 运镜缩放倍率 */}
                  <Slider
                    label={t('cameraZoom', '运镜放大倍率')}
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
                      label={t('cameraX', '水平偏移 (X)')}
                      valueDisplay={`${cameraX > 0 ? '+' : ''}${cameraX.toFixed(1)}%`}
                      min="-50.0"
                      max="50.0"
                      step="0.5"
                      value={cameraX}
                      onChange={(e) => onCameraXChange?.(parseFloat(e.target.value))}
                    />
                    <Slider
                      label={t('cameraY', '垂直偏移 (Y)')}
                      valueDisplay={`${cameraY > 0 ? '+' : ''}${cameraY.toFixed(1)}%`}
                      min="-50.0"
                      max="50.0"
                      step="0.5"
                      value={cameraY}
                      onChange={(e) => onCameraYChange?.(parseFloat(e.target.value))}
                    />
                  </div>

                  {/* 一键居中复位 */}
                  <div className="pt-1 flex items-center justify-between border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">{t('resetCenterTip', '重置镜头焦点为全景居中')}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid="reset-camera-center-btn"
                      onClick={onCameraReset}
                      className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('resetCenter', '镜头居中复位')}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 1.2 标定助手常驻控制面板 (Calibration Assistant HUD) */}
            <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-3" data-testid="calibration-assistant-panel">
              <div
                onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
                className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary">{t('calibrationTitle', '标定助手 (HUD)')}</span>
                </div>
                {isCalibrationOpen ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>

              {isCalibrationOpen && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  {/* 底图原生分辨率只读展示 */}
                  <div className="flex items-center justify-between bg-muted/60 p-2 rounded-lg border border-border text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('baseImageRes', '底图原生基准')}</span>
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {viewport.width} × {viewport.height}
                    </span>
                  </div>

                  {/* 智能边缘贴合开关 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{t('smartSnap', '智能边缘吸附')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t('smartSnapDesc', '框选时自动贴合图元边缘')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSmartSnapEnabled}
                        onChange={onToggleSmartSnap}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* 激光十字准星开关 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-primary" />
                        <span>{t('laserCrosshair', '十字激光准星')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t('laserCrosshairDesc', '在画布显示 X/Y 轴全屏辅助对齐线')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCrosshairEnabled}
                        onChange={onToggleCrosshair}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* 复制光标坐标 JSON 快捷键提示与一键复制卡片 */}
                  <div
                    onClick={copyCoordinatesJson}
                    className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer select-none ${
                      hasCopiedCoords
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-muted/40 hover:bg-muted/70 border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                    title={t('clickToCopyOrShortcut', '点击或按快捷键复制当前坐标 JSON')}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {hasCopiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                      <span>{hasCopiedCoords ? t('copiedJson', '坐标已复制') : t('copyCoordsTip', '复制光标坐标 JSON')}</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/80 rounded border border-border text-foreground font-semibold shadow-xs">
                      {isMac ? '⌥ C' : 'Alt+C'}
                    </kbd>
                  </div>
                </div>
              )}
            </div>

            {/* 1.3 图元层级列表 (Layer Hierarchy List - 场景维度常驻) */}
            {renderLayerHierarchyList()}
          </div>
        )}

        {/* =========================================================================
            TAB 2: 🎨 图元属性 (Polymorphic Element Cards & Layer Hierarchy)
           ========================================================================= */}
        {activeTab === 'elements' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 2.1 多态专属可视化控制卡片 */}
            {/* Case A: 选中 Box */}
            {selectedBox && (
              <div className="space-y-3 bg-muted/40 border border-primary/30 rounded-xl p-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                    <Square className="w-3.5 h-3.5 text-primary" />
                    <span>{t('boxSettings', '方框属性')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedBox.id}
                  </span>
                </div>

                {/* 尺寸与坐标读数 */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-background/80 p-2 rounded-lg border border-border text-muted-foreground">
                  <div>X: <span className="text-foreground font-semibold">{selectedBox.x}px</span></div>
                  <div>Y: <span className="text-foreground font-semibold">{selectedBox.y}px</span></div>
                  <div>W: <span className="text-foreground font-semibold">{selectedBox.width}px</span></div>
                  <div>H: <span className="text-foreground font-semibold">{selectedBox.height}px</span></div>
                </div>

                {/* 描边粗细 Slider */}
                <Slider
                  label={t('strokeWidth', '描边粗细')}
                  valueDisplay={`${selectedBox.style?.strokeWidth || 6} px`}
                  min="1"
                  max="14"
                  step="1"
                  value={selectedBox.style?.strokeWidth || 6}
                  onChange={(e) => updateElementStyle(selectedBox.id, { strokeWidth: parseFloat(e.target.value) })}
                />

                {/* 边框圆角 Slider */}
                <Slider
                  label={t('cornerRadius', '边框圆角')}
                  valueDisplay={`${selectedBox.rx !== undefined ? selectedBox.rx : 16} px`}
                  min="0"
                  max="32"
                  step="1"
                  value={selectedBox.rx !== undefined ? selectedBox.rx : 16}
                  onChange={(e) => updateElementStyle(selectedBox.id, { rx: parseFloat(e.target.value) })}
                />

                {/* 霓虹发光滤镜开关 */}
                <div className="pt-1 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{t('neonGlow', '霓虹外发光滤镜')}</span>
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBox.style?.glow !== false}
                      onChange={(e) => updateElementStyle(selectedBox.id, { glow: e.target.checked })}
                      className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Case B: 选中 Path */}
            {selectedPath && (
              <div className="space-y-3 bg-muted/40 border border-primary/30 rounded-xl p-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span>{t('pathSettings', '连线高级参数')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedPath.id}
                  </span>
                </div>

                {/* 动画流动模式选择 */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>{t('flowMode', '动画流动模式')}</span>
                    <span className="font-mono text-primary uppercase text-[10px]">
                      {selectedPath.style?.mode || 'draw'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-background p-1 rounded-lg border border-border">
                    {[
                      { id: 'stream', label: t('modeStream', '🌊 流光粒子'), desc: t('modeStreamDesc', '能量粒子沿虚线高速流动') },
                      { id: 'draw', label: t('modeDraw', '✍️ 生长绘制'), desc: t('modeDrawDesc', '沿路径延时生长画入') },
                      { id: 'pulse', label: t('modePulse', '💓 呼吸律动'), desc: t('modePulseDesc', '整条连线呼吸发光') },
                    ].map((m) => {
                      const isActive = (selectedPath.style?.mode || 'draw') === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updateElementStyle(selectedPath.id, { mode: m.id as any })}
                          className={`text-[10px] py-1 px-1 rounded font-medium transition cursor-pointer text-center truncate ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={m.desc}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 线条粗细调节 */}
                <Slider
                  label={t('strokeWidth', '描边粗细')}
                  valueDisplay={`${selectedPath.style?.strokeWidth || 5} px`}
                  min="1"
                  max="14"
                  step="1"
                  value={selectedPath.style?.strokeWidth || 5}
                  onChange={(e) => updateElementStyle(selectedPath.id, { strokeWidth: parseFloat(e.target.value) })}
                />

                {/* 流光速度调节 (仅在 stream 模式下显示) */}
                {selectedPath.style?.mode === 'stream' && (
                  <Slider
                    label={t('flowSpeed', '流光速度倍率')}
                    valueDisplay={`${(selectedPath.style?.flowSpeed || 1.8).toFixed(1)}x`}
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={selectedPath.style?.flowSpeed || 1.8}
                    onChange={(e) => updateElementStyle(selectedPath.id, { flowSpeed: parseFloat(e.target.value) })}
                  />
                )}

                {/* 霓虹光晕开关 */}
                <div className="pt-1 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{t('neonGlow', '霓虹外发光滤镜')}</span>
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPath.style?.glow !== false}
                      onChange={(e) => updateElementStyle(selectedPath.id, { glow: e.target.checked })}
                      className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>

                {/* 端点拓扑信息 */}
                {(selectedPath.from || selectedPath.to) && (
                  <div className="text-[9px] font-mono text-muted-foreground bg-background/80 p-1.5 rounded border border-border flex flex-col gap-0.5">
                    <div className="truncate">{t('startPoint', '起点')}: <span className="text-foreground">{selectedPath.from || t('freeBezier', '自由贝塞尔')}</span></div>
                    <div className="truncate">{t('endPoint', '终点')}: <span className="text-foreground">{selectedPath.to || t('freeBezier', '自由贝塞尔')}</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Case C: 选中 Dot */}
            {selectedDot && (
              <div className="space-y-3 bg-muted/40 border border-primary/30 rounded-xl p-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                    <CircleDot className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('dotSettings', '脉冲圆点属性')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedDot.id}
                  </span>
                </div>

                {/* 圆心坐标调节 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                      <span>{t('coordX', 'CX (X 坐标)')}</span>
                      <span className="font-mono text-amber-400 font-bold text-[10px]">px</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={viewport.width}
                      value={selectedDot.cx}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateDotPosition(selectedDot.id, { cx: val, cy: selectedDot.cy });
                      }}
                      className="text-xs bg-background h-7 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                      <span>{t('coordY', 'CY (Y 坐标)')}</span>
                      <span className="font-mono text-amber-400 font-bold text-[10px]">px</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={viewport.height}
                      value={selectedDot.cy}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateDotPosition(selectedDot.id, { cx: selectedDot.cx, cy: val });
                      }}
                      className="text-xs bg-background h-7 font-mono"
                    />
                  </div>
                </div>

                {/* 半径大小调节 */}
                <Slider
                  label={t('dotRadius', '圆点半径')}
                  valueDisplay={`${selectedDot.r !== undefined ? selectedDot.r : 8} px`}
                  min="4"
                  max="30"
                  step="1"
                  value={selectedDot.r !== undefined ? selectedDot.r : 8}
                  onChange={(e) => updateElementStyle(selectedDot.id, { r: parseFloat(e.target.value) })}
                />

                {/* 动态呼吸脉冲开关 */}
                <div className="pt-1 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-amber-400" />
                    <span>{t('dotPulse', '0.85x~1.25x 呼吸脉冲')}</span>
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDot.style?.pulse !== false}
                      onChange={(e) => updateElementStyle(selectedDot.id, { pulse: e.target.checked })}
                      className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>

                {/* 霓虹外发光开关 */}
                <div className="pt-1 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{t('neonGlow', '霓虹外发光滤镜')}</span>
                  </span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDot.style?.glow !== false}
                      onChange={(e) => updateElementStyle(selectedDot.id, { glow: e.target.checked })}
                      className="cursor-pointer accent-primary w-3.5 h-3.5 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Case D: 选中 Callout */}
            {selectedCallout && (
              <div className="space-y-3 bg-muted/40 border border-primary/30 rounded-xl p-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('calloutSettings', '解说气泡属性')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedCallout.id}
                  </span>
                </div>

                {/* 气泡标题 / 徽章文本 */}
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>{t('calloutTitle', '徽章标题')}</span>
                    <span className="font-mono text-sky-400 font-bold text-[10px] uppercase">{selectedCallout.theme || 'blue'}</span>
                  </label>
                  <Input
                    value={selectedCallout.title}
                    onChange={(e) => updateCallout(selectedCallout.id, { title: e.target.value })}
                    placeholder="请输入气泡标题..."
                    className="text-xs bg-background h-8 font-medium"
                  />
                </div>

                {/* 主题配色切换 */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] font-medium">
                    {t('calloutTheme', '视觉主题配色')}
                  </label>
                  <div className="grid grid-cols-5 gap-1 bg-background p-1 rounded-lg border border-border">
                    {[
                      { id: 'blue', label: '科技蓝', color: '#38bdf8' },
                      { id: 'green', label: '高可用', color: '#34d399' },
                      { id: 'amber', label: '预警黄', color: '#fbbf24' },
                      { id: 'pink', label: '品红', color: '#f472b6' },
                      { id: 'purple', label: '霓虹紫', color: '#a855f7' },
                    ].map((thm) => {
                      const isActive = (selectedCallout.theme || 'blue') === thm.id;
                      return (
                        <button
                          key={thm.id}
                          type="button"
                          onClick={() => updateCallout(selectedCallout.id, { theme: thm.id })}
                          className={`text-[9px] py-1 px-0.5 rounded font-medium transition cursor-pointer flex flex-col items-center gap-1 ${
                            isActive
                              ? 'bg-primary/20 text-primary border border-primary/40 font-bold shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: thm.color }} />
                          <span className="truncate">{thm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 正文解说描述 */}
                <div className="space-y-1">
                  <label className="text-muted-foreground text-[10px] font-medium">
                    {t('calloutDesc', '正文解说描述')}
                  </label>
                  <textarea
                    value={selectedCallout.desc}
                    onChange={(e) => updateCallout(selectedCallout.id, { desc: e.target.value })}
                    placeholder="输入架构原理解说、协议说明或高并发应对策略..."
                    rows={3}
                    className="w-full text-xs bg-background border border-border rounded-md p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>

                {/* 字体大小微调 (Font Size Controls) */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <Slider
                    label={t('calloutFontSize', '正文字体大小')}
                    valueDisplay={`${selectedCallout.style?.fontSize || 12} px`}
                    min="10"
                    max="36"
                    step="1"
                    value={selectedCallout.style?.fontSize || 12}
                    onChange={(e) =>
                      updateCallout(selectedCallout.id, {
                        style: { ...(selectedCallout.style || {}), fontSize: parseFloat(e.target.value) },
                      })
                    }
                  />
                  <Slider
                    label={t('calloutTitleFontSize', '标题徽章大小')}
                    valueDisplay={`${selectedCallout.style?.titleFontSize || 11} px`}
                    min="9"
                    max="32"
                    step="1"
                    value={selectedCallout.style?.titleFontSize || 11}
                    onChange={(e) =>
                      updateCallout(selectedCallout.id, {
                        style: { ...(selectedCallout.style || {}), titleFontSize: parseFloat(e.target.value) },
                      })
                    }
                  />
                </div>

                {/* 卡片最大宽度调节 */}
                <Slider
                  label={t('calloutMaxWidth', '气泡最大宽度')}
                  valueDisplay={`${selectedCallout.style?.maxWidth || 320} px`}
                  min="200"
                  max="800"
                  step="10"
                  value={selectedCallout.style?.maxWidth || 320}
                  onChange={(e) =>
                    updateCallout(selectedCallout.id, {
                      style: { ...(selectedCallout.style || {}), maxWidth: parseFloat(e.target.value) },
                    })
                  }
                />

                {/* 坐标精确微调 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                      <span>{t('calloutPosX', '左偏移 (Left)')}</span>
                      <span className="font-mono text-sky-400 font-bold text-[10px]">px</span>
                    </label>
                    <Input
                      type="number"
                      value={parseInt(selectedCallout.position.left) || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateCallout(selectedCallout.id, {
                          position: { ...selectedCallout.position, left: `${val}px` },
                        });
                      }}
                      className="text-xs bg-background h-7 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                      <span>{t('calloutPosY', '上偏移 (Top)')}</span>
                      <span className="font-mono text-sky-400 font-bold text-[10px]">px</span>
                    </label>
                    <Input
                      type="number"
                      value={parseInt(selectedCallout.position.top) || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateCallout(selectedCallout.id, {
                          position: { ...selectedCallout.position, top: `${val}px` },
                        });
                      }}
                      className="text-xs bg-background h-7 font-mono"
                    />
                  </div>
                </div>

                {/* 关联目标框元 (Target Box Binding) */}
                <div className="space-y-1.5 pt-1 border-t border-border/50">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>{t('calloutTargetBox', '关联目标框元')}</span>
                    {selectedCallout.targetBoxId && (
                      <span className="font-mono text-emerald-400 text-[10px]">已绑定</span>
                    )}
                  </label>
                  <select
                    value={selectedCallout.targetBoxId || ''}
                    onChange={(e) => {
                      const boxId = e.target.value || undefined;
                      updateCallout(selectedCallout.id, { targetBoxId: boxId });
                    }}
                    className="w-full text-xs bg-background border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">{t('calloutNoTarget', '无绑定 (自由浮动)')}</option>
                    {(dsl.elements?.boxes || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        📦 {b.id} ({b.width}×{b.height} @ {b.x},{b.y})
                      </option>
                    ))}
                  </select>

                  {/* 快捷对齐按钮 */}
                  {selectedCallout.targetBoxId && (() => {
                    const tBox = (dsl.elements?.boxes || []).find((b) => b.id === selectedCallout.targetBoxId);
                    if (!tBox) return null;
                    return (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              updateCallout(selectedCallout.id, {
                                position: {
                                  left: `${Math.round(tBox.x + 20)}px`,
                                  top: `${Math.round(Math.max(20, tBox.y - 80))}px`,
                                },
                              });
                            }}
                            className="flex-1 text-[9px] bg-secondary/80 hover:bg-secondary text-secondary-foreground py-1 px-2 rounded border border-border transition cursor-pointer"
                          >
                            ⬆️ {t('calloutAlignAbove', '对齐至框元上方')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateCallout(selectedCallout.id, {
                                position: {
                                  left: `${Math.round(tBox.x + tBox.width + 20)}px`,
                                  top: `${Math.round(tBox.y + 10)}px`,
                                },
                              });
                            }}
                            className="flex-1 text-[9px] bg-secondary/80 hover:bg-secondary text-secondary-foreground py-1 px-2 rounded border border-border transition cursor-pointer"
                          >
                            ➡️ {t('calloutAlignRight', '对齐至框元右侧')}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const adaptive = calculateAdaptiveCalloutStyle({
                              viewportWidth: dsl.meta.viewport.width,
                              viewportHeight: dsl.meta.viewport.height,
                              targetBox: tBox,
                            });
                            updateCallout(selectedCallout.id, { style: adaptive });
                          }}
                          className="w-full text-[9px] bg-primary/10 hover:bg-primary/20 text-primary py-1 px-2 rounded border border-primary/30 transition cursor-pointer flex items-center justify-center gap-1 font-medium"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{t('calloutAutoAdaptStyle', '一键匹配目标框元尺寸与字号')}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Case E: 选中 Image */}
            {selectedImage && (
              <div className="space-y-3 bg-muted/40 border border-pink-500/30 rounded-xl p-3 shadow-md animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-pink-400 text-xs font-bold">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>{t('imageSettings', '动态插图属性')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                      {selectedImage.id}
                    </span>
                    {onDeleteElement && (
                      <button
                        type="button"
                        onClick={() => onDeleteElement(selectedImage.id)}
                        className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded transition cursor-pointer"
                        title={t('deleteElement', '删除图元')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 缩略图预览与快速更换 */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>{t('imagePreview', '图片预览')}</span>
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{t('uploadNewImage', '本地上传')}</span>
                    </button>
                  </label>

                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (loadEvt) => {
                        const res = loadEvt.target?.result as string;
                        if (res) {
                          const img = new Image();
                          img.onload = () => {
                            updateImage(selectedImage.id, {
                              url: res,
                              width: img.naturalWidth > 0 ? img.naturalWidth : selectedImage.width,
                              height: img.naturalHeight > 0 ? img.naturalHeight : selectedImage.height,
                            });
                          };
                          img.src = res;
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />

                  <div className="relative rounded-lg overflow-hidden border border-border bg-background/80 flex items-center justify-center p-2 min-h-[90px] max-h-[140px]">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.id}
                      className="max-h-28 object-contain rounded"
                      style={{
                        borderRadius: `${selectedImage.style?.borderRadius || 0}px`,
                      }}
                    />
                  </div>

                  {/* URL 输入框 */}
                  <div className="space-y-1 pt-1">
                    <label className="text-muted-foreground text-[10px] font-medium">
                      {t('imageUrl', '图片地址 URL')}
                    </label>
                    <Input
                      value={selectedImage.url}
                      onChange={(e) => updateImage(selectedImage.id, { url: e.target.value })}
                      placeholder={t('imageUrlPlaceholder', '输入图片 URL (http:// 或 /asset.png)...')}
                      className="text-xs bg-background h-7 font-mono truncate"
                    />
                  </div>
                </div>

                {/* 几何坐标与尺寸微调 */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px] font-medium">
                      {t('imageDimensions', '尺寸与几何位置')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAspectLocked(!isAspectLocked)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                          isAspectLocked
                            ? 'bg-pink-500/20 text-pink-400 border-pink-500/40 font-medium'
                            : 'text-muted-foreground border-border hover:bg-muted'
                        }`}
                        title={t('lockAspectRatio', '锁定等比缩放')}
                      >
                        {isAspectLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                        <span>{isAspectLocked ? '等比锁定' : '自由比例'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const testImg = new Image();
                          testImg.onload = () => {
                            if (testImg.naturalWidth > 0 && testImg.naturalHeight > 0) {
                              updateImage(selectedImage.id, {
                                width: testImg.naturalWidth,
                                height: testImg.naturalHeight,
                              });
                            }
                          };
                          testImg.src = selectedImage.url;
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer flex items-center gap-1"
                        title={t('resetNaturalSize', '恢复原始物理尺寸')}
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>原尺寸</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                        <span>X 坐标</span>
                        <span className="font-mono text-pink-400 font-bold text-[10px]">px</span>
                      </label>
                      <Input
                        type="number"
                        value={selectedImage.x}
                        onChange={(e) => updateImage(selectedImage.id, { x: parseInt(e.target.value) || 0 })}
                        className="text-xs bg-background h-7 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                        <span>Y 坐标</span>
                        <span className="font-mono text-pink-400 font-bold text-[10px]">px</span>
                      </label>
                      <Input
                        type="number"
                        value={selectedImage.y}
                        onChange={(e) => updateImage(selectedImage.id, { y: parseInt(e.target.value) || 0 })}
                        className="text-xs bg-background h-7 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                        <span>宽度 (W)</span>
                        <span className="font-mono text-pink-400 font-bold text-[10px]">px</span>
                      </label>
                      <Input
                        type="number"
                        min={20}
                        value={selectedImage.width}
                        onChange={(e) => {
                          const newW = Math.max(20, parseInt(e.target.value) || 20);
                          if (isAspectLocked && selectedImage.width > 0) {
                            const ratio = selectedImage.height / selectedImage.width;
                            updateImage(selectedImage.id, { width: newW, height: Math.round(newW * ratio) });
                          } else {
                            updateImage(selectedImage.id, { width: newW });
                          }
                        }}
                        className="text-xs bg-background h-7 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                        <span>高度 (H)</span>
                        <span className="font-mono text-pink-400 font-bold text-[10px]">px</span>
                      </label>
                      <Input
                        type="number"
                        min={20}
                        value={selectedImage.height}
                        onChange={(e) => {
                          const newH = Math.max(20, parseInt(e.target.value) || 20);
                          if (isAspectLocked && selectedImage.height > 0) {
                            const ratio = selectedImage.width / selectedImage.height;
                            updateImage(selectedImage.id, { height: newH, width: Math.round(newH * ratio) });
                          } else {
                            updateImage(selectedImage.id, { height: newH });
                          }
                        }}
                        className="text-xs bg-background h-7 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 样式属性调节 */}
                <div className="space-y-2 pt-1 border-t border-border/50">
                  {/* 圆角大小 Slider */}
                  <Slider
                    label={t('imageBorderRadius', '插图圆角')}
                    valueDisplay={`${selectedImage.style?.borderRadius ?? 16} px`}
                    min="0"
                    max="64"
                    step="1"
                    value={selectedImage.style?.borderRadius ?? 16}
                    onChange={(e) =>
                      updateImage(selectedImage.id, {
                        style: { ...(selectedImage.style || {}), borderRadius: parseFloat(e.target.value) },
                      })
                    }
                  />

                  {/* 不透明度 Slider */}
                  <Slider
                    label={t('imageOpacity', '不透明度')}
                    valueDisplay={`${Math.round((selectedImage.style?.opacity ?? 1.0) * 100)} %`}
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={selectedImage.style?.opacity ?? 1.0}
                    onChange={(e) =>
                      updateImage(selectedImage.id, {
                        style: { ...(selectedImage.style || {}), opacity: parseFloat(e.target.value) },
                      })
                    }
                  />

                  {/* 悬浮立体弥散投影开关 */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span>{t('imageBoxShadow', '立体悬浮弥散投影')}</span>
                    </span>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedImage.style?.boxShadow !== false}
                        onChange={(e) =>
                          updateImage(selectedImage.id, {
                            style: { ...(selectedImage.style || {}), boxShadow: e.target.checked },
                          })
                        }
                        className="cursor-pointer accent-pink-500 w-3.5 h-3.5 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* 进场动效选择 */}
                <div className="space-y-1.5 pt-1 border-t border-border/50">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>{t('imageAnimation', '进场展开动效')}</span>
                    <span className="font-mono text-pink-400 uppercase text-[10px]">
                      {selectedImage.style?.animation || 'zoom-fade'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-background p-1 rounded-lg border border-border">
                    {[
                      { id: 'zoom-fade', label: t('animZoomFade', '🔍 弹性缩放') },
                      { id: 'fade', label: t('animFade', '🌫️ 平滑淡入') },
                      { id: 'slide-up', label: t('animSlideUp', '⬆️ 向上滑入') },
                    ].map((anim) => {
                      const isActive = (selectedImage.style?.animation || 'zoom-fade') === anim.id;
                      return (
                        <button
                          key={anim.id}
                          type="button"
                          onClick={() =>
                            updateImage(selectedImage.id, {
                              style: { ...(selectedImage.style || {}), animation: anim.id as any },
                            })
                          }
                          className={`text-[9px] py-1.5 px-1 rounded font-medium transition cursor-pointer text-center ${
                            isActive
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 font-bold shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {anim.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2.2 调色板渲染函数 (Palette) */}
            {(() => {
              const renderPalette = () => (
                <div className="space-y-2 bg-muted/20 border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                      <span>{t('themePalette', '视觉主题色调')}</span>
                    </span>
                    {selectedElementId && (
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 truncate max-w-[100px]">
                        {selectedElementId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#ec4899', '#ffffff'].map((c) => {
                      const isCurrentActive = activeDrawingColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            setActiveDrawingColor(c);
                            if (selectedElementId) {
                              updateElementStyle(selectedElementId, { stroke: c, fill: c });
                              if (selectedImage) {
                                updateImage(selectedImage.id, { style: { border: `2px solid ${c}` } });
                              }
                              if (selectedCallout) {
                                let theme = 'blue';
                                if (c.includes('34d399')) theme = 'green';
                                else if (c.includes('fbbf24')) theme = 'amber';
                                else if (c.includes('f472b6') || c.includes('f43f5e') || c.includes('ec4899')) theme = 'pink';
                                else if (c.includes('a855f7')) theme = 'purple';
                                updateCallout(selectedCallout.id, { theme });
                              }
                            }
                          }}
                          className={`w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition shadow-md border border-white/20 ${
                            isCurrentActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                          }`}
                          title={`设为颜色 ${c}`}
                        />
                      );
                    })}

                    {/* 自定义拾色器 */}
                    <label
                      className="relative w-5 h-5 rounded-full overflow-hidden border border-white/30 cursor-pointer hover:scale-110 transition shadow-md flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"
                      title={t('customHex', '自定义 HEX 颜色')}
                    >
                      <input
                        type="color"
                        value={activeDrawingColor}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setActiveDrawingColor(newColor);
                          if (selectedElementId) {
                            updateElementStyle(selectedElementId, { stroke: newColor, fill: newColor });
                            if (selectedImage) {
                              updateImage(selectedImage.id, { style: { border: `2px solid ${newColor}` } });
                            }
                            if (selectedCallout) {
                              updateCallout(selectedCallout.id, { theme: newColor });
                            }
                          }
                        }}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>
              );

              return !selectedBox && !selectedPath && !selectedDot && !selectedCallout && !selectedImage ? (
                <>
                  <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-1">
                    <Info className="w-4 h-4 text-muted-foreground mx-auto" />
                    <p className="text-xs font-medium text-foreground">{t('noElementSelected', '未选中图元')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('noElementSelectedDesc', '在下方列表或画布上单击图元即可进行属性微调')}</p>
                  </div>
                  {/* 铁律 11 落地：图元层级列表绝对置顶于调色板之上，彻底杜绝折叠线遮挡 */}
                  {renderLayerHierarchyList()}
                  {renderPalette()}
                </>
              ) : (
                <>
                  {renderPalette()}
                  {renderLayerHierarchyList()}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </aside>
  );
}

export const RightInspector = React.memo(RightInspectorComponent);
