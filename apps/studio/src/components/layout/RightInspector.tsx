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
  Crosshair
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
  elements = [
    { id: 'box-1', type: 'box', name: '微服务网关选框', active: true },
    { id: 'callout-1', type: 'callout', name: 'API 网关解说气泡', active: true },
    { id: 'path-1', type: 'path', name: '网关 ➔ 认证中心贝塞尔连线', active: false },
  ],
  onToggleElement,
  onDeleteElement,
}: RightInspectorProps) {
  const { t } = useTranslation('inspector');
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);

  return (
    <aside
      data-testid="inspector"
      className="w-72 border-l border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col select-none z-20 shrink-0 overflow-y-auto"
    >
      {/* 顶部标题 */}
      <div className="h-11 px-4 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('inspectorTitle')}</span>
        </div>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* 1. 场景镜头配置折叠面板 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsCameraOpen(!isCameraOpen)}
            className="flex items-center justify-between font-semibold text-slate-300 cursor-pointer hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('sceneCamera')}</span>
            </div>
            {isCameraOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {isCameraOpen && (
            <div className="space-y-3 pl-1 pt-1 animate-in fade-in duration-100">
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">{t('sceneTitle')}</label>
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
                className="w-full gap-2 text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 font-medium py-1.5 h-auto"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
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

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{t('cameraEasing')}</span>
                </span>
                <span className="font-mono text-cyan-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                  Cubic-Bezier(0.4, 0, 0.2, 1)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* 2. 当前场景图元图层列表 */}
        <div className="space-y-3">
          <div
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="flex items-center justify-between font-semibold text-slate-300 cursor-pointer hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('sceneElements')} ({elements.length})</span>
            </div>
            {isLayersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>

          {isLayersOpen && (
            <div className="space-y-1.5 pt-1 animate-in fade-in duration-100">
              {elements.map((el) => (
                <div
                  key={el.id}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-[11px] transition ${
                    el.active
                      ? 'bg-slate-800/70 border-slate-700/80 text-slate-200'
                      : 'bg-slate-900/30 border-slate-800/50 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <button
                      onClick={() => onToggleElement?.(el.id)}
                      className="text-slate-400 hover:text-cyan-300 transition"
                      title={el.active ? t('hideElementTip') : t('showElementTip')}
                    >
                      {el.active ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span className="truncate">{el.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDeleteElement?.(el.id)}
                      className="h-6 w-6 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-800/80" />

        {/* 3. 视觉主题色调预设 */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
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
