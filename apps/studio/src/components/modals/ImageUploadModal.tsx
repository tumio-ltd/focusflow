import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UploadCloud, 
  Link2, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { parseImageFile, parseImageUrl, formatBytes, ImageMeta } from '@/utils/imageDecoder';

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (meta: ImageMeta) => void;
}

export function ImageUploadModal({ isOpen, onClose, onImport }: ImageUploadModalProps) {
  const { t } = useTranslation('upload');
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMeta, setParsedMeta] = useState<ImageMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      onImport(parsedMeta);
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
            onClick={onClose}
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
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '解析'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                可直接输入 AWS S3、OSS 或公开云存储中的高分辨率架构图链接
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
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/40">
          <Button variant="ghost" size="sm" onClick={onClose}>
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
