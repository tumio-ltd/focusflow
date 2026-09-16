import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  X,
  Loader2,
  Zap,
  Bot,
  AlertTriangle,
  Clock,
  Coins,
  Layers,
  FileSearch,
  MessageSquareQuote,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionLLMSettingsModal } from '@/components/modals/VisionLLMSettingsModal';
import { getEffectiveVisionCredentials } from '@/services/autoTour/visionLLMConfigStore';

export interface AutoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateHeuristicTour: () => Promise<void>;
}

export function AutoTourModal({ isOpen, onClose, onGenerateHeuristicTour }: AutoTourModalProps) {
  const { t, i18n } = useTranslation('common');
  const dsl = useProjectStore((s) => s.dsl);
  const applyVisionAutoTour = useProjectStore((s) => s.applyVisionAutoTour);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<'heuristic' | 'vision' | null>(null);
  const [pendingMode, setPendingMode] = useState<'heuristic' | 'vision'>('heuristic');
  const [visionStepText, setVisionStepText] = useState<string>('');
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [isVisionSettingsOpen, setIsVisionSettingsOpen] = useState(false);
  const [visionCreds, setVisionCreds] = useState(getEffectiveVisionCredentials());

  useEffect(() => {
    if (isOpen) {
      setVisionCreds(getEffectiveVisionCredentials());
      setShowConfirmOverwrite(false);
      setIsGenerating(false);
      setGeneratingMode(null);
      setVisionStepText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasExistingWork =
    (dsl.elements.boxes && dsl.elements.boxes.length > 0) || (dsl.scenes && dsl.scenes.length > 1);

  const handleStartHeuristic = async () => {
    try {
      setIsGenerating(true);
      setGeneratingMode('heuristic');
      await onGenerateHeuristicTour();
      setShowConfirmOverwrite(false);
      onClose();
    } catch (err) {
      console.error('Failed to generate heuristic auto tour:', err);
    } finally {
      setIsGenerating(false);
      setGeneratingMode(null);
    }
  };

  const handleStartVision = async () => {
    try {
      setIsGenerating(true);
      setGeneratingMode('vision');
      const locale = i18n.language?.startsWith('en') ? 'en' : 'zh';
      await applyVisionAutoTour({
        locale,
        onProgressStep: (step) => setVisionStepText(step),
      });
      toast.success(
        t('autoTourVisionSuccess', '✨ 视觉大模型成功生成 4 幕电影级演播导览与高精度图元！')
      );
      setShowConfirmOverwrite(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to generate vision auto tour:', err);
      const msg = err?.message || String(err);
      toast.error(`${t('autoTourVisionError', '视觉大模型生成失败')}`, {
        id: 'focusflow-vision-tour-error',
        duration: 12000,
        description: (
          <div className="flex flex-col gap-1.5 mt-1 text-xs">
            <p className="break-words font-mono text-[11px] leading-relaxed text-foreground/90 max-h-24 overflow-y-auto custom-scrollbar bg-muted/40 p-1.5 rounded border border-border/50">
              {msg}
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(msg);
                  toast.success(t('errorCopiedToast', '已复制错误信息到剪贴板'));
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium border border-border/80 transition-colors cursor-pointer active:scale-95 shadow-xs"
                data-testid="copy-error-btn"
              >
                <Copy className="w-3 h-3 text-primary" />
                <span>{t('copyErrorBtn', '复制错误信息')}</span>
              </button>
            </div>
          </div>
        ),
        action: {
          label: t('fallbackToHeuristicBtn', '⚡ 切换为本地启发式生成 (方案 A)'),
          onClick: () => {
            handleStartHeuristic();
          },
        },
        cancel: {
          label: t('copyErrorBtnShort', '📋 复制错误'),
          onClick: () => {
            navigator.clipboard.writeText(msg);
            toast.success(t('errorCopiedToast', '已复制错误信息到剪贴板'));
          },
        },
      });
    } finally {
      setIsGenerating(false);
      setGeneratingMode(null);
      setVisionStepText('');
    }
  };

  const handleTrigger = (mode: 'heuristic' | 'vision') => {
    if (hasExistingWork && !showConfirmOverwrite) {
      setPendingMode(mode);
      setShowConfirmOverwrite(true);
      return;
    }
    if (mode === 'heuristic') {
      handleStartHeuristic();
    } else {
      handleStartVision();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 ease-spring">
      <div
        data-testid="auto-tour-modal"
        className="relative w-full max-w-2xl bg-card border border-white/[0.08] rounded-2xl shadow-elevation-modal overflow-hidden flex flex-col text-card-foreground transition-all duration-200 animate-in fade-in zoom-in-95 ease-spring"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 shadow-keycap">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t('autoTourModalTitle', '✨ AI 辅助工程初始化 (Auto-Tour Director)')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('autoTourModalSubtitle', '从底图一键生成多幕电影级运镜与分镜头编排')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* 覆盖警告提示卡片 (若工程已有图元) */}
        {showConfirmOverwrite && (
          <div
            data-testid="auto-tour-overwrite-warning"
            className="mx-6 mt-4 p-3 rounded-xl bg-[var(--ff-ai-bg)] border border-[var(--ff-ai-border)] text-[var(--ff-ai-text)] text-xs flex items-start gap-2.5 animate-in fade-in duration-150 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-[var(--ff-ai-text)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold text-[var(--ff-ai-text)]">
                {t(
                  'autoTourConfirmOverwrite',
                  '当前工程已有设计内容，生成 AI 导览将重置分镜头与图元，是否继续？（您也可以随时通过 Cmd+Z 撤销）'
                )}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid="confirm-overwrite-btn"
                  onClick={() => (pendingMode === 'vision' ? handleStartVision() : handleStartHeuristic())}
                  disabled={isGenerating}
                  className="h-7 text-xs px-2.5"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    t('confirmOverwriteBtn', '确认覆盖生成')
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConfirmOverwrite(false)}
                  className="h-7 text-xs px-2.5"
                >
                  {t('cancel', '取消')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 核心双模态卡片列表 */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 模式 1：纯前端离线启发式导览 (推荐) */}
          <div
            data-testid="mode-heuristic-card"
            className="p-4 rounded-xl border border-cyan-500/40 dark:border-cyan-500/40 bg-cyan-500/[0.06] dark:bg-cyan-950/20 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t('autoTourMode1Title', '⚡ 模式 1：纯前端离线启发式导览 (推荐 · 立即生成)')}
                </h4>
              </div>
              <Badge variant="cyan" className="text-[11px] font-mono">
                {t('offlineAutonomousRecommended', '离线自治 · 推荐')}
              </Badge>
            </div>

            {/* 特性要点 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{t('autoTourMode1Time', '耗时：< 200ms 毫秒级瞬时生成')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t('autoTourMode1Cost', '费用：$0 免费、纯本地计算')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>{t('autoTourMode1Output', '产出：4 幕镜头 + 3~4 集群')}</span>
              </div>
            </div>

            {/* 局限性与短板 (Cons) 透明说明 */}
            <div
              data-testid="mode1-cons-notice"
              className="p-3 rounded-lg bg-[var(--ff-ai-bg)] border border-[var(--ff-ai-border)] text-[var(--ff-ai-text)] text-xs leading-relaxed space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-1.5 font-semibold text-[var(--ff-ai-text)]">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--ff-ai-text)] shrink-0" />
                <span>{t('consNoticeLabel', '局限性与短板 (Cons)：')}</span>
              </div>
              <p className="text-[11px] text-[var(--ff-ai-text)] opacity-95 leading-normal pl-5">
                {t(
                  'autoTourMode1Cons',
                  '纯几何算法无语义理解；台词为结构化占位模板，生成后需微调文本。'
                )}
              </p>
            </div>

            {/* 操作触发按钮 */}
            <div className="flex justify-end pt-1">
              <Button
                variant="cyan"
                size="sm"
                data-testid="generate-heuristic-tour-btn"
                disabled={isGenerating}
                onClick={() => handleTrigger('heuristic')}
                className="gap-1.5 text-xs font-medium px-4 shadow-sm"
              >
                {isGenerating && generatingMode === 'heuristic' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('generatingTourLoading', '正在计算构图重心并组装 4 幕...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('autoTourMode1Action', '立即启发式生成')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 模式 2：多模态视觉大模型智能导演 */}
          <div
            data-testid="mode-vision-llm-card"
            className="p-4 rounded-xl border border-purple-500/30 dark:border-purple-500/30 bg-purple-500/[0.04] dark:bg-purple-950/20 space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t('autoTourMode2Title', '🤖 模式 2：多模态视觉大模型智能导演 (Vision LLM Copilot)')}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsVisionSettingsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setIsVisionSettingsOpen(true);
                  }}
                  className="h-7 text-xs px-2.5 gap-1.5 border border-purple-500/30 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-md inline-flex items-center cursor-pointer transition-colors"
                  data-testid="open-vision-settings-btn"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('configBtn', '配置模型与 Key')}</span>
                </span>
              </div>
            </div>

            {/* 凭据就绪状态栏 */}
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-background/60 border border-border/60">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    visionCreds.isKeyReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="text-muted-foreground">
                  {visionCreds.isKeyReady ? (
                    <span className="text-foreground font-medium">
                      {t('statusReadyPrefix', '已就绪')} (
                      {visionCreds.isInherited
                        ? t('statusInherited', '已复用')
                        : t('statusDedicated', '独立')}{' '}
                      {visionCreds.provider} · {visionCreds.model})
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {t('statusMissingKey', '未配置 API Key (点击右侧配置)')}
                    </span>
                  )}
                </span>
              </div>
              {visionCreds.isKeyReady && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  Ready
                </span>
              )}
            </div>

            {/* 特性要点 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{t('autoTourMode2Ocr', '深度 OCR：识别图中具体服务名称（如 Nginx、Kafka、Redis）')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{t('autoTourMode2Script', '智能剧本：自动撰写技术布道级播音解说台词')}</span>
              </div>
            </div>

            {/* 端侧智能省流与隐私守护卡片 */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                {t('tokenSaverTitle', 'FocusFlow 端侧智能省流与隐私守护')}
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed pl-5 list-disc">
                <li>{t('tokenSaverBenefitCost', '极速降本 90%+：原图本地离屏 Canvas 毫秒级压缩（1536px, JPEG 0.85），外发体积从 ~30MB 压减至 ~300KB (压缩比 98.5%)，单次分析仅耗约 $0.003 ~ $0.005。')}</li>
                <li>{t('tokenSaverBenefitSpeed', '毫秒级预处理：纯本地内存运行，处理仅需 <30ms，消除大图网络上传卡顿。')}</li>
                <li>{t('tokenSaverBenefitPrivacy', '隐私安全合规：超限高清原图绝不离机，仅外发提取语义所需的轻量视觉特征。')}</li>
                <li>{t('tokenSaverBenefitLocalKey', '凭据本地沙箱：API Key 仅存于当前浏览器 LocalStorage，直连官方端点，绝不上云泄露，支持随时一键物理抹除。')}</li>
              </ul>
            </div>

            {/* 局限性与短板 (Cons) 透明说明 */}
            <div
              data-testid="mode2-cons-notice"
              className="p-3 rounded-lg bg-muted/60 dark:bg-border/40 border border-border text-foreground/80 dark:text-muted-foreground text-xs leading-relaxed space-y-1"
            >
              <div className="flex items-center gap-1.5 font-semibold text-foreground/90">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{t('consNoticeLabel', '局限性与短板 (Cons)：')}</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground dark:text-muted-foreground/90 space-y-0.5 pl-5">
                <li>{t('autoTourMode2Cons1', '需自备 OpenAI / Claude / Gemini 多模态 API Key')}</li>
                <li>{t('autoTourMode2Cons2', '需外发图片进行云端推理，耗时约 2 ~ 4 秒')}</li>
                <li>{t('autoTourMode2Cons3', '涉密内部架构图需注意企业数据合规安全')}</li>
              </ul>
            </div>

            {/* 操作触发按钮：未配置 Key 时展示禁用态并引导配置；就绪后激活生成 */}
            <div className="flex justify-end pt-1">
              {!visionCreds.isKeyReady ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="gap-1.5 text-xs font-medium px-4 opacity-60 cursor-not-allowed"
                  data-testid="mode2-action-btn"
                >
                  <span>{t('autoTourMode2ActionNoKey', '未配置 API Key (请先配置)')}</span>
                </Button>
              ) : (
                <Button
                  variant="ai"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => handleTrigger('vision')}
                  className="gap-1.5 text-xs font-medium px-4 shadow-sm"
                  data-testid="generate-vision-tour-btn"
                >
                  {isGenerating && generatingMode === 'vision' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{visionStepText || t('autoTourVisionGenerating', 'AI 导演正在解析拓扑并编排演播场景...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('autoTourMode2Submit', '一键视觉大模型生成')}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* 嵌套弹窗：视觉大模型设置 */}
          <VisionLLMSettingsModal
            isOpen={isVisionSettingsOpen}
            onClose={() => {
              setIsVisionSettingsOpen(false);
              setVisionCreds(getEffectiveVisionCredentials());
            }}
            onSaved={() => {
              setVisionCreds(getEffectiveVisionCredentials());
            }}
          />
        </div>

        {/* 底部关闭栏 */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/40 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {t('close', '关闭')}
          </Button>
        </div>
      </div>
    </div>
  );
}
