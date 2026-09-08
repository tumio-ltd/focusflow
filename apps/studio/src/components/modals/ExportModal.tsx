import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  FileCode2, 
  Archive, 
  Video, 
  Download, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Laptop,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui';
import { downloadStandaloneHtml } from '@/services/standalonePackager';
import { exportProjectZip } from '@/services/zipExporter';
import { getStoredTTSConfig } from '@/services/audio';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dsl: FocusFlowDSL;
  onStartRecording?: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  dsl,
  onStartRecording,
}: ExportModalProps) {
  const { t } = useTranslation('export');
  const [activeTab, setActiveTab] = useState<'html' | 'zip' | 'video'>('html');
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportHtml = async () => {
    setIsExporting(true);
    try {
      await downloadStandaloneHtml(dsl);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('HTML Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await exportProjectZip(dsl);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('ZIP Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      data-testid="export-modal"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-card-foreground transition-colors duration-200">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('exportCenter')}</h2>
              <p className="text-[11px] text-muted-foreground">{t('exportSubtitle')}</p>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 选项卡导航 */}
        <div className="px-6 pt-4 flex gap-2 border-b border-border bg-muted/40">
          <button
            onClick={() => setActiveTab('html')}
            data-testid="tab-html"
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'html'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>{t('tabHtml')}</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            data-testid="tab-zip"
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'zip'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{t('tabZip')}</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            data-testid="tab-video"
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'video'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{t('tabVideo')}</span>
          </button>
        </div>

        {/* 选项卡内容 */}
        <div className="p-6 space-y-4 text-xs">
          {activeTab === 'html' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">{t('htmlDescTitle')}</h3>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">
                      {t('htmlDescText')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-primary" />
                    <span>{t('crossPlatform')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>{t('fps60')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="cyan"
                  data-testid="export-html-btn"
                  onClick={handleExportHtml}
                  disabled={isExporting}
                  className="gap-2"
                >
                  {isSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  <span>{isSuccess ? t('successExport') : isExporting ? t('packaging') : t('downloadHtml')}</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">{t('zipDescTitle')}</h3>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">
                      {t('zipDescText')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="cyan"
                  data-testid="export-zip-btn"
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="gap-2"
                >
                  {isSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  <span>{isSuccess ? t('successArchive') : isExporting ? t('compressing') : t('downloadZip')}</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-xs">{t('videoDescTitle', '本地 60FPS WebM 高清录制')}</h3>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">
                      {t('videoDescText', '直接通过浏览器端 MediaRecorder API 将画布连贯运镜与流光动效录制为高清 WebM 格式视频，无水印且无需任何服务端。')}
                    </p>
                    <div className="mt-2.5 p-2 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary leading-relaxed">
                      {t('videoTip', '💡 提示：点击后系统将唤起浏览器原生“共享标签页”授权，选择当前 FocusFlow 标签页即可自动开启全屏演播并一键下载 60FPS 视频。')}
                    </div>

                    {/* 音频合流状态与提示卡片 */}
                    {(() => {
                      const mainTrack = dsl.audio?.tracks?.[0];
                      const ttsConfig = getStoredTTSConfig();
                      const hasRealMasterAudio = Boolean(
                        mainTrack?.url &&
                        !mainTrack.isOfflineTTS &&
                        mainTrack.type !== 'offline-tts' &&
                        (!mainTrack.id?.startsWith('track-ai-') || ttsConfig.mode === 'cloud')
                      );

                      if (hasRealMasterAudio) {
                        return (
                          <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{t('audioTrackDetected', '🎵 已检测到实体母带音轨，录制时将自动为您音画同步合流导出！')}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2 leading-relaxed">
                          <VolumeX className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-amber-800 dark:text-amber-300">{t('offlineTtsNoticeTitle', '⚠️ 音频录制与内录提示')}</div>
                            <div className="text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                              {t('offlineTtsNoticeDesc')}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="cyan"
                  data-testid="start-video-recording-btn"
                  onClick={() => {
                    onClose();
                    onStartRecording?.();
                  }}
                  className="gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>{t('startRecording')}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
