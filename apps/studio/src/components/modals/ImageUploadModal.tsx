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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        data-testid="image-upload-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">{t('modalTitle')}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 选项切换 */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('file'); setError(null); }}
            className={`py-2.5 px-4 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'file'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t('fileTabTitle')}</span>
          </button>
          <button
            onClick={() => { setActiveTab('url'); setError(null); }}
            className={`py-2.5 px-4 text-xs font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'url'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{t('urlTabTitle')}</span>
          </button>
        </div>

        {/* 主体交互内容区 */}
        <div className="p-6 space-y-4">
          {activeTab === 'file' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
                  : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <UploadCloud className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-200">{t('dragDropTitle')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('dragDropSubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('urlPlaceholder')}
                  className="flex-1 text-xs"
                />
                <Button size="sm" variant="cyan" onClick={handleUrlProcess} disabled={!urlInput.trim() || loading}>
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '解析'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                可直接输入 AWS S3、OSS 或公开云存储中的高分辨率架构图链接
              </p>
            </div>
          )}

          {/* 加载中状态 */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-cyan-400 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('parsing')}</span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 解析成功预览卡片 */}
          {parsedMeta && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center gap-4 animate-in fade-in duration-200">
              <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                <img src={parsedMeta.url} alt="preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-100 truncate">{parsedMeta.fileName}</span>
                  <Badge variant="cyan">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('importSuccess')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                  <span>{parsedMeta.width} × {parsedMeta.height} px</span>
                  {parsedMeta.fileSize > 0 && <span>• {formatBytes(parsedMeta.fileSize)}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="cyan"
            size="sm"
            disabled={!parsedMeta}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('confirmImport')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
