import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';
import { copyToClipboard } from '@/utils/clipboard';

export interface CopyableIdBadgeProps {
  id: string;
  className?: string;
  labelPrefix?: string;
  maxTextWidth?: string;
}

export function CopyableIdBadge({
  id,
  className,
  labelPrefix,
  maxTextWidth = 'max-w-[110px]',
}: CopyableIdBadgeProps) {
  const { t } = useTranslation(['inspector', 'common']);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    const ok = await copyToClipboard(id);
    if (ok) {
      setCopied(true);
      toast.success(t('inspector:copiedIdToast', { id, defaultValue: `已复制图元 ID: ${id}` }));
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error(
        t('inspector:copyFailedToast', { id, defaultValue: `复制失败，请尝试手动选取: ${id}` })
      );
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy(e);
        }
      }}
      title={t('inspector:copyIdTip', { id, defaultValue: `点击复制完整 ID: ${id}` })}
      data-testid="copyable-id-badge"
      data-copied={copied ? 'true' : undefined}
      className={cn(
        'group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer select-text',
        copied
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
          : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/40 hover:border-border',
        className
      )}
    >
      <span className={cn('truncate select-text cursor-text', maxTextWidth)}>
        {labelPrefix ? `${labelPrefix}${id}` : id}
      </span>
      {copied ? (
        <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" data-testid="copy-check-icon" />
      ) : (
        <Copy
          className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity"
          data-testid="copy-icon"
        />
      )}
    </div>
  );
}
