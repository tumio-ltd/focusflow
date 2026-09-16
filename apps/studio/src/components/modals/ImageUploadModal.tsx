import React, { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UploadCloud, 
  Link2, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { parseImageFile, parseImageUrl, formatBytes, ImageMeta } from '@/utils/imageDecoder';

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (meta: ImageMeta, options?: { enableAutoTour?: boolean }) => void;
}

export function ImageUploadModal({ isOpen, onClose, onImport }: ImageUploadModalProps) {
  const { t } = useTranslation('upload');
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMeta, setParsedMeta] = useState<ImageMeta | null>(null);
  const [enableAutoTour, setEnableAutoTour] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setActiveTab('file');
    setIsDragging(false);
    setUrlInput('');
    setLoading(false);
    setError(null);
    setParsedMeta(null);
    setEnableAutoTour(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 每次打开弹窗均呈现崭新初始状态 (Clean Slate)，彻底杜绝上一次导入结果残留
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    setError(null);
    setLoading(true);
    setParsedMeta(null);
    try {
      const meta = await parseImageFile(file);
      setParsedMeta(meta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('invalidImage');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlProcess = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    setLoading(true);
    setParsedMeta(null);
    try {
      const meta = await parseImageUrl(urlInput.trim());
      setParsedMeta(meta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse image from URL';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    if (parsedMeta) {
      const meta = parsedMeta;
      const autoTour = enableAutoTour;
      resetState();
      onImport(meta, { enableAutoTour: autoTour });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150 ease-spring">
      <div 
        data-testid="image-upload-modal"
        className="relative w-full max-w-xl bg-card border border-white/[0.08] rounded-2xl shadow-elevation-modal overflow-hidden flex flex-col text-card-foreground transition-all duration-200 animate-in fade-in zoom-in-95 ease-spring"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-keycap">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{t('modalTitle')}</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab 选项切换 */}
        <div className="flex border-b border-border px-6 bg-muted/40">
          <button
            onClick={() => { setActiveTab('file'); setError(null); }}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'file'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{t('fileTabTitle')}</span>
          </button>
          <button
            onClick={() => { setActiveTab('url'); setError(null); }}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'url'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>{t('urlTabTitle')}</span>
          </button>
        </div>

        {/* 主体交互内容区 */}
        <div className="p-6 space-y-4.5">
          {activeTab === 'file' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-border hover:border-primary/60 bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <UploadCloud className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t('dragDropTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dragDropSubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  className="flex-1"
                />
                <Button size="sm" variant="cyan" onClick={handleUrlProcess} disabled={!urlInput.trim() || loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('parse', '解析')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('urlHelpTip', '可直接输入 AWS S3、OSS 或公开云存储中的高分辨率架构图链接')}
              </p>
            </div>
          )}

          {/* 加载中状态 */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-primary font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('parsing')}</span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 解析成功预览卡片 */}
          {parsedMeta && (
            <div className="p-4 rounded-xl bg-card border border-primary/40 flex items-center gap-4 animate-in fade-in duration-200 shadow-sm">
              <div className="w-16 h-12 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                <img src={parsedMeta.url} alt="preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{parsedMeta.fileName}</span>
                  <Badge variant="cyan">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {t('importSuccess')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                  <span>{parsedMeta.width} × {parsedMeta.height} px</span>
                  {parsedMeta.fileSize > 0 && <span>• {formatBytes(parsedMeta.fileSize)}</span>}
                </div>
              </div>
            </div>
          )}

          {/* AI 启发式自动导览勾选与透明短板提示卡片 */}
          {parsedMeta && (
            <div
              data-testid="auto-tour-option-card"
              onClick={() => setEnableAutoTour(!enableAutoTour)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                enableAutoTour
                  ? 'bg-cyan-500/[0.08] dark:bg-cyan-950/25 border-cyan-500/40 dark:border-cyan-500/50 shadow-sm'
                  : 'bg-muted/20 border-border/60 hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  data-testid="auto-tour-checkbox"
                  checked={enableAutoTour}
                  onChange={(e) => setEnableAutoTour(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4 rounded border-border text-cyan-500 focus:ring-cyan-500 accent-cyan-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-xs font-semibold text-foreground">
                      {t('autoTourCheckbox')}
                    </span>
                    <Badge variant="cyan" className="text-[10px] px-1.5 py-0 h-4">
                      {t('offlineAutonomous', '离线自治')}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    <span className="font-semibold text-cyan-700 dark:text-cyan-400">{t('algorithmPrincipleLabel')}</span>
                    {t('autoTourPrinciples')}
                  </p>
                </div>
              </div>

              {/* 局限性与短板 (Cons) 透明显性提示：采用与 AI 提词同源的高对比度无障碍配色 */}
              {enableAutoTour && (
                <div
                  data-testid="auto-tour-cons-notice"
                  className="p-2.5 rounded-lg bg-[var(--ff-ai-bg)] border border-[var(--ff-ai-border)] text-[var(--ff-ai-text)] text-[11px] leading-relaxed flex items-start gap-2 animate-in fade-in duration-150 shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-[var(--ff-ai-text)] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[var(--ff-ai-text)]">{t('consNoticeLabel')}</span>
                    <span className="ml-1 text-[var(--ff-ai-text)] opacity-95">{t('autoTourConsNotice')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/40">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="cyan"
            size="sm"
            disabled={!parsedMeta}
            onClick={handleConfirm}
            className="gap-1.5 font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('confirmImport')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
