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
  Image as ImageIcon,
  Target,
  Sparkles,
  Check,
  Copy,
  Scan,
  Move,
  RotateCcw,
  Zap,
  Gauge,
  Film,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Input, Slider, Button } from '@/components/ui';
import { coordinateBus } from '@/utils/coordinateBus';
import { useEditorStore, useProjectStore } from '@/stores';

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
    <div className="space-y-1 font-mono text-[11px]">
      <div className="flex items-center justify-between bg-muted/40 px-2 py-0.5 rounded border border-border/40">
        <span className="text-muted-foreground text-[10px]">📐 物理像素:</span>
        <span ref={pixelRef} className="text-primary font-semibold text-[10px]">
          X: -- , Y: --
        </span>
      </div>
      <div className="flex items-center justify-between bg-muted/40 px-2 py-0.5 rounded border border-border/40">
        <span className="text-muted-foreground text-[10px]">📍 相对百分比:</span>
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
  const dsl = useProjectStore((s) => s.dsl);

  // 当在画布或列表中选中任何图元时，自动平滑切入【图元属性】Tab
  useEffect(() => {
    if (selectedElementId) {
      setActiveTab('elements');
    }
  }, [selectedElementId]);

  const selectedBox = dsl.elements?.boxes?.find((b) => b.id === selectedElementId);
  const selectedPath = dsl.elements?.paths?.find((p) => p.id === selectedElementId);
  const selectedDot = dsl.elements?.dots?.find((d) => d.id === selectedElementId);

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

  const copyCoordinatesJson = () => {
    const coords = coordinateBus.get();
    if (!coords) return;
    const json = JSON.stringify(
      {
        pixel: { x: Math.round(coords.x), y: Math.round(coords.y) },
        percent: {
          left: Number(((coords.x / viewport.width) * 100).toFixed(2)),
          top: Number(((coords.y / viewport.height) * 100).toFixed(2)),
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(json);
    setHasCopiedCoords(true);
    setTimeout(() => setHasCopiedCoords(false), 2000);
  };

  return (
    <aside
      data-testid="right-inspector"
      className="w-80 h-full border-l border-border bg-panel flex flex-col select-none z-20 shrink-0 text-foreground transition-colors duration-200"
    >
      {/* 1. 顶部 Header 与实时 HUD */}
      <div className="p-3 border-b border-border space-y-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">属性检查器 (Inspector)</span>
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
          <span>🎬 场景运镜</span>
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
          <span>🎨 图元属性</span>
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
                  <span className="text-xs font-bold text-foreground">{t('cameraControls')}</span>
                </div>
                {isCameraOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>

              {isCameraOpen && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  {/* 分幕标题 */}
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium">{t('sceneTitle')}</label>
                    <Input
                      value={sceneTitle}
                      onChange={(e) => onSceneTitleChange?.(e.target.value)}
                      placeholder={t('sceneTitlePlaceholder')}
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
                    <span>{t('captureCurrentView')}</span>
                  </Button>

                  {/* 运镜缩放倍率 */}
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

                  {/* 一键居中复位 */}
                  <div className="pt-1 flex items-center justify-between border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">重置镜头焦点为全景居中</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onCameraReset}
                      className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('resetCenter')}</span>
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
                  <span className="text-xs font-bold text-primary">{t('calibrationTitle')}</span>
                </div>
                {isCalibrationOpen ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>

              {isCalibrationOpen && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                  {/* 底图原生分辨率只读展示 */}
                  <div className="flex items-center justify-between bg-muted/60 p-2 rounded-lg border border-border text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Scan className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('baseImageRes')}</span>
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
                        <span>{t('smartSnap')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t('smartSnapDesc')}</p>
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
                        <span>{t('laserCrosshair')}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t('laserCrosshairDesc')}</p>
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

                  {/* 一键复制当前坐标 JSON */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={copyCoordinatesJson}
                    className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground h-8 border border-border"
                  >
                    {hasCopiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedCoords ? t('copiedJson') : t('copyCoordsJson')}</span>
                  </Button>
                </div>
              )}
            </div>
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
                    <span>方框属性 (Box Settings)</span>
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
                  label="描边粗细"
                  valueDisplay={`${selectedBox.style?.strokeWidth || 6} px`}
                  min="1"
                  max="14"
                  step="1"
                  value={selectedBox.style?.strokeWidth || 6}
                  onChange={(e) => updateElementStyle(selectedBox.id, { strokeWidth: parseFloat(e.target.value) })}
                />

                {/* 边框圆角 Slider */}
                <Slider
                  label="边框圆角"
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
                    <span>霓虹外发光滤镜</span>
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
                    <span>连线高级参数 (Path Settings)</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedPath.id}
                  </span>
                </div>

                {/* 动画流动模式选择 */}
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                    <span>动画流动模式</span>
                    <span className="font-mono text-primary uppercase text-[10px]">
                      {selectedPath.style?.mode || 'draw'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-background p-1 rounded-lg border border-border">
                    {[
                      { id: 'stream', label: '🌊 流光粒子', desc: '能量粒子沿虚线高速流动' },
                      { id: 'draw', label: '✍️ 生长绘制', desc: '沿路径延时生长画入' },
                      { id: 'pulse', label: '💓 呼吸律动', desc: '整条连线呼吸发光' },
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
                  label="线条粗细"
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
                    label="流光速度倍率"
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
                    <span>霓虹外发光滤镜</span>
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
                    <div className="truncate">起点: <span className="text-foreground">{selectedPath.from || '自由贝塞尔'}</span></div>
                    <div className="truncate">终点: <span className="text-foreground">{selectedPath.to || '自由贝塞尔'}</span></div>
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
                    <span>脉冲圆点属性 (Dot Settings)</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px]">
                    {selectedDot.id}
                  </span>
                </div>

                {/* 圆心坐标调节 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-muted-foreground text-[10px] font-medium flex items-center justify-between">
                      <span>CX (X 坐标)</span>
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
                      <span>CY (Y 坐标)</span>
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
                  label="圆点半径 (Radius)"
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
                    <span>0.85x~1.25x 呼吸脉冲</span>
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
                    <span>霓虹外发光滤镜</span>
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

            {/* Case D: 未选中任何图元时的提示 */}
            {!selectedBox && !selectedPath && !selectedDot && (
              <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center space-y-1">
                <Info className="w-4 h-4 text-muted-foreground mx-auto" />
                <p className="text-xs font-medium text-foreground">未选中图元</p>
                <p className="text-[10px] text-muted-foreground">在下方列表或画布上单击图元即可进行属性微调</p>
              </div>
            )}

            {/* 2.2 调色板 (Palette) */}
            <div className="space-y-2 bg-muted/20 border border-border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  <span>视觉主题色调 (Palette)</span>
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
                  title="自定义 HEX 颜色"
                >
                  <input
                    type="color"
                    value={activeDrawingColor}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setActiveDrawingColor(newColor);
                      if (selectedElementId) {
                        updateElementStyle(selectedElementId, { stroke: newColor, fill: newColor });
                      }
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>

            {/* 2.3 图元层级列表 (Layer Hierarchy List) */}
            <div className="space-y-3 bg-muted/20 border border-border rounded-xl p-3">
              <div
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                className="flex items-center justify-between font-semibold text-foreground cursor-pointer hover:text-primary transition"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">{t('layerList')}</span>
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
                      placeholder={t('searchElement')}
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
                      <span>{t('inheritPrevious')}</span>
                    </Button>
                  )}

                  {/* 图元项目列表 */}
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {filteredElements.length === 0 ? (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        {t('noElements')}
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
                                title={el.active ? t('activeInScene') : t('hiddenInScene')}
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
                                title={t('deleteElement')}
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
          </div>
        )}
      </div>
    </aside>
  );
}

export const RightInspector = React.memo(RightInspectorComponent);
