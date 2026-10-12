// apps/studio/src/components/billing/RegionalPriceMatrixModal.tsx
import React from 'react';
import { X, Globe, Shield, CreditCard } from 'lucide-react';
import { formatRegionalPrice } from './currency-formatter';
import { PlanCardItem } from './PlanCard';

interface RegionalPriceMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlanCardItem[];
}

const REGIONS = [
  { code: 'CN', name: '中国大陆', currency: 'CNY', symbol: '¥', gateways: '微信支付, 支付宝, 对公转账' },
  { code: 'US', name: '美国 / 加拿大', currency: 'USD', symbol: '$', gateways: 'Stripe (Credit Cards, Apple Pay)' },
  { code: 'EU', name: '欧洲区 (EU)', currency: 'EUR', symbol: '€', gateways: 'Stripe (Credit Cards, iDEAL, SEPA)' },
  { code: 'JP', name: '日本区 (JP)', currency: 'JPY', symbol: '¥', gateways: 'Stripe (Credit Cards, Konbini)' },
  { code: 'GLOBAL', name: '全球其他地区 (兜底)', currency: 'USD', symbol: '$', gateways: 'Stripe (International Cards)' },
];

export const RegionalPriceMatrixModal: React.FC<RegionalPriceMatrixModalProps> = ({
  isOpen,
  onClose,
  plans,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                全球定价与区域支付渠道全景大盘
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-300">
                  Matrix Mode
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                支持管理人员、财务核算与售前顾问并排对比各法币标价与支持的清算通道
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto flex-1 my-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                <th className="py-3 px-4 font-semibold text-zinc-300">套餐规格</th>
                <th className="py-3 px-4 font-semibold text-zinc-300">计费周期</th>
                {REGIONS.map((r) => (
                  <th key={r.code} className="py-3 px-4 font-semibold text-zinc-200">
                    <div>{r.name}</div>
                    <div className="font-mono text-[10px] text-zinc-400 font-normal">
                      {r.code} ({r.currency})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-medium text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{plan.name}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                        {plan.tier}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-sans">
                    {plan.billingCycle === 'YEARLY'
                      ? '年付 (Annual)'
                      : plan.billingCycle === 'MONTHLY'
                      ? '月付 (Monthly)'
                      : '一次性'}
                  </td>
                  {REGIONS.map((r) => {
                    if (plan.tier === 'FREE') {
                      return (
                        <td key={r.code} className="py-3.5 px-4 text-emerald-400 font-semibold">
                          免费
                        </td>
                      );
                    }

                    const matrix = (plan.currencyPricesJson as Record<string, any>) || {};
                    const priceEntry = matrix[r.code] || matrix[r.currency];
                    const priceCents =
                      priceEntry?.priceCents ?? (r.code === 'CN' ? plan.priceCents : null);

                    if (priceCents == null) {
                      return (
                        <td key={r.code} className="py-3.5 px-4 text-zinc-600">
                          -
                        </td>
                      );
                    }

                    return (
                      <td key={r.code} className="py-3.5 px-4">
                        <div className="text-white font-semibold">
                          {formatRegionalPrice(priceCents, r.currency)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-sans mt-0.5">
                          {priceEntry?.taxIncluded ?? true ? '含税' : '未税'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Gateway Info */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>
              <strong>清算合规提醒：</strong>中国大陆严格限用微信支付与支付宝，欧美日等海外地区统一由 Stripe 结算收单。
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-1.5 text-xs font-medium transition-colors"
          >
            关闭大盘
          </button>
        </div>
      </div>
    </div>
  );
};
