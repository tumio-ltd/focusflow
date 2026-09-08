import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Music, Mic, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import type { AudioTrackRole } from '@focusflow/dsl';

interface AudioConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: AudioTrackRole) => void;
  sceneScriptCount: number;
  fileName?: string;
}

export const AudioConflictModal: React.FC<AudioConflictModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sceneScriptCount,
  fileName,
}) => {
  const { t } = useTranslation('audio');
  const [selectedMode, setSelectedMode] = useState<AudioTrackRole>('music');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                {t('conflictModalTitle', '检测到分幕提词与导入音频冲突')}
              </h3>
              {fileName && (
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  {fileName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {t('conflictModalSubtitle', {
              count: sceneScriptCount,
              defaultValue: `当前工程已有 ${sceneScriptCount} 个分幕包含解说提词。请选择该音频文件的用途：`
            })}
          </p>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* Option A: BGM (Recommended) */}
            <div
              onClick={() => setSelectedMode('music')}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                selectedMode === 'music'
                  ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                selectedMode === 'music'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Music size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-100">
                    {t('conflictOptionBgmTitle', '作为背景音乐 (BGM)')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {t('conflictOptionBgmBadge', '推荐 · 伴奏模式')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('conflictOptionBgmDesc', '音频音量自动调至 20%，演播时分幕提词将作为前景人声同步朗读。')}
                </p>
              </div>
              {selectedMode === 'music' && (
                <div className="text-emerald-400 shrink-0 self-center">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>

            {/* Option B: Voiceover */}
            <div
              onClick={() => setSelectedMode('voiceover')}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                selectedMode === 'voiceover'
                  ? 'bg-indigo-950/30 border-indigo-500/80 shadow-lg shadow-indigo-950/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                selectedMode === 'voiceover'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Mic size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-100">
                    {t('conflictOptionVoiceoverTitle', '作为主旁白母带 (Voiceover)')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    {t('conflictOptionVoiceoverBadge', '替代解说')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('conflictOptionVoiceoverDesc', '将该音频作为演播核心配音。演播时将自动静音分幕提词，完全由该音频主导。')}
                </p>
              </div>
              {selectedMode === 'voiceover' && (
                <div className="text-indigo-400 shrink-0 self-center">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            {t('conflictCancelBtn', '取消导入')}
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(selectedMode)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5"
          >
            {t('conflictApplyBtn', '确认应用')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
