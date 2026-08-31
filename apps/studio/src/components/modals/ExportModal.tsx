import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui';
import { downloadStandaloneHtml } from '@/services/standalonePackager';
import { exportProjectZip } from '@/services/zipExporter';

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
        <div className="px-6 py-4.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">导出演播工程 (Export Center)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">纯前端编译输出 · 0 依赖 · 100% 本地离线隐私保护</p>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-4.5 h-4.5" />
          </Button>
        </div>

        {/* 选项卡导航 */}
        <div className="px-6 pt-4 flex gap-2 border-b border-border/60 bg-muted/20">
          <button
            onClick={() => setActiveTab('html')}
            data-testid="tab-html"
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'html'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>独立单文件 HTML</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            data-testid="tab-zip"
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'zip'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>工程 ZIP 归档包</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            data-testid="tab-video"
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${
              activeTab === 'video'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>客户端视频录制</span>
          </button>
        </div>

        {/* 选项卡内容 */}
        <div className="p-6 space-y-4.5 text-sm">
          {activeTab === 'html' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border/40 rounded-xl p-4.5 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">0 依赖单个 HTML 文件 (Single File Artifact)</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                      将底图、样式表与 FocusFlow 播放引擎全部内联为单一 <code className="text-primary font-mono">.html</code> 文件。双击即可在任意无网设备上流畅运行，适合团队内网邮件分发与高管汇报。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-primary" />
                    <span>跨平台双击即看</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>60FPS 硬件加速运镜</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  取消
                </Button>
                <Button
                  variant="cyan"
                  size="sm"
                  data-testid="export-html-btn"
                  onClick={handleExportHtml}
                  disabled={isExporting}
                  className="gap-2 font-medium"
                >
                  {isSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  <span>{isSuccess ? '已成功导出！' : isExporting ? '打包编译中...' : '立即下载 .html 文件'}</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'zip' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border rounded-xl p-4.5 space-y-3">
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">标准工程 ZIP 归档 (Full Project Bundle)</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                      包含标准 <code className="text-primary font-mono">config.json</code> DSL 语法树、<code className="text-primary font-mono">assets/</code> 原始高清素材与独立 <code className="text-primary font-mono">index.html</code>，便于二次开发与集成。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  取消
                </Button>
                <Button
                  variant="cyan"
                  size="sm"
                  data-testid="export-zip-btn"
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="gap-2 font-medium"
                >
                  {isSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  <span>{isSuccess ? '已成功归档！' : isExporting ? 'ZIP 压缩中...' : '立即下载 .zip 压缩包'}</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="bg-muted/30 border border-border rounded-xl p-4.5 space-y-3">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">本地 60FPS WebM 高清录制</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                      直接通过浏览器端 MediaRecorder API 将画布连贯运镜与流光动效录制为高清 WebM 格式视频，无水印且无需任何服务端。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  取消
                </Button>
                <Button
                  variant="cyan"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onStartRecording?.();
                  }}
                  className="gap-2 font-medium"
                >
                  <Video className="w-4 h-4" />
                  <span>启动全自动录制</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
