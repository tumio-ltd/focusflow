import React from 'react';
import { Check, Sparkles, Zap, ShieldCheck, Lock } from 'lucide-react';
import { formatRegionalPrice } from './currency-formatter';

export interface PlanCardItem {
  id: string;
  code: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  billingCycle: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  effectivePriceCents: number;
  effectiveCurrency: string;
  effectiveGateways?: string[];
  taxIncluded?: boolean;
  taxPolicy?: string;
  taxRate?: number;
  pricingRegion?: string;
  decisionRule?: string;
  isSimulated?: boolean;
  simulatedRegion?: string;
  simulationExpiresAt?: string;
  featuresJson?: Record<string, any>;
  quotaMaxProjects?: number;
  quotaRenderMins?: number;
  quotaTtsChars?: number;
  quotaStorageBytes?: string;
  currencyPricesJson?: Record<string, any>;
  priceCents?: number;
}

interface PlanCardProps {
  plan: PlanCardItem;
  isCurrent?: boolean;
  isLoading?: boolean;
  isSimulated?: boolean;
  onSubscribe: (plan: PlanCardItem) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrent = false,
  isLoading = false,
  isSimulated = false,
  onSubscribe,
}) => {
  const isFree = plan.tier === 'FREE';
  const isEnterprise = plan.tier === 'ENTERPRISE';
  const isPro = plan.tier === 'PRO';

  const formattedPrice = isFree
    ? '免费'
    : formatRegionalPrice(plan.effectivePriceCents, plan.effectiveCurrency);

  const cycleSuffix =
    plan.billingCycle === 'YEARLY' ? '/年' : plan.billingCycle === 'MONTHLY' ? '/月' : '';

  const effects = (plan.featuresJson?.effects as any[]) || [];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
        isPro
          ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-950/20 to-zinc-950 shadow-xl shadow-indigo-500/10'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-indigo-300 backdrop-blur-md">
          推荐方案
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{plan.name}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isFree ? '个人探索与轻量制作' : isPro ? '专为高阶创作者设计' : '企业专属私有算力与合规'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300">
          {isFree ? (
            <Sparkles className="h-4 w-4" />
          ) : isPro ? (
            <Zap className="h-4 w-4 text-indigo-400" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {formattedPrice}
          </span>
          {!isFree && <span className="text-xs font-medium text-zinc-400">{cycleSuffix}</span>}
        </div>
        {!isFree && (
          <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
            <span>
              {plan.taxPolicy === 'INCLUSIVE'
                ? '已含增值税/消费税'
                : plan.taxPolicy === 'EXCLUSIVE'
                ? '未含当地适用销售税'
                : '免税'}
            </span>
            {plan.pricingRegion && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] text-zinc-400">
                {plan.pricingRegion} 区域
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2.5 mb-6 text-xs text-zinc-300">
        <div className="font-medium text-zinc-400 mb-2">包含权益与配额：</div>
        {plan.quotaMaxProjects && plan.quotaMaxProjects > 0 && (
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>最多 {plan.quotaMaxProjects} 个云端协作项目</span>
          </div>
        )}
        {plan.quotaRenderMins && plan.quotaRenderMins > 0 && (
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>每月赠送 {plan.quotaRenderMins} 分钟 4K 极速渲染</span>
          </div>
        )}
        {plan.quotaTtsChars && plan.quotaTtsChars > 0 && (
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>赠送 {(plan.quotaTtsChars / 1000).toFixed(0)}k 字符超拟真 AI 语音</span>
          </div>
        )}
        {effects.map((eff, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              {eff.featureKey === 'PRO_WATERMARK_REMOVAL'
                ? '支持移除 FocusFlow 官方水印'
                : eff.quotaType || '专属高级功能'}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isCurrent || isLoading || isSimulated || plan.isSimulated}
        onClick={() => onSubscribe(plan)}
        className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all ${
          isSimulated || plan.isSimulated
            ? 'cursor-not-allowed border border-amber-500/30 bg-amber-500/10 text-amber-400'
            : isCurrent
            ? 'cursor-default border border-zinc-700 bg-zinc-800 text-zinc-400'
            : isPro
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98]'
            : 'bg-zinc-100 hover:bg-white text-zinc-950 active:scale-[0.98]'
        }`}
      >
        {isSimulated || plan.isSimulated ? (
          <>
            <Lock className="h-3.5 w-3.5" />
            <span>模拟模式禁止真实扣款</span>
          </>
        ) : isCurrent ? (
          '当前使用中'
        ) : isFree ? (
          '免费使用'
        ) : (
          '立即升级'
        )}
      </button>
    </div>
  );
};
