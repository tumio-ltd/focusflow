// apps/studio/src/components/billing/PricingRegionChangedModal.tsx
import React from 'react';
import { AlertTriangle, ArrowRight, Globe, ShieldAlert } from 'lucide-react';
import { formatRegionalPrice } from './currency-formatter';

export interface PricingRegionChangedData {
  previousRegion: string;
  newRegion: string;
  newCurrency: string;
  newPriceCents: number;
  billingCycle?: string;
}

interface PricingRegionChangedModalProps {
  isOpen: boolean;
  data: PricingRegionChangedData | null;
  onConfirm: (acknowledgedRegion: string) => void;
  onCancel: () => void;
}

const REGION_NAMES: Record<string, string> = {
  CN: '中国大陆 (CN)',
  US: '北美 / 美国 (US)',
  EU: '欧洲经济区 (EU)',
  JP: '日本国 (JP)',
  GLOBAL: '全球通用区 (GLOBAL)',
};

export const PricingRegionChangedModal: React.FC<PricingRegionChangedModalProps> = ({
  isOpen,
  data,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !data) return null;

  const formattedPrice = formatRegionalPrice(data.newPriceCents, data.newCurrency);
  const prevRegionName = REGION_NAMES[data.previousRegion] || data.previousRegion;
  const newRegionName = REGION_NAMES[data.newRegion] || data.newRegion;
  const cycleLabel = data.billingCycle === 'YEARLY' ? '年' : '月';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 shadow-2xl p-6 text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">计费区域已变更</h3>
            <p className="text-xs text-zinc-400">网络环境或访问节点发生切换</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>原报价区域</span>
            <span className="font-mono text-zinc-300">{prevRegionName}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-amber-500/80 font-medium py-1">
            <Globe className="h-3.5 w-3.5" />
            <span>网络节点已切换</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>最新识别区域</span>
            <span className="font-mono font-medium text-amber-400">{newRegionName}</span>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
            <span className="text-xs text-zinc-400">最新套餐订阅价</span>
            <div className="text-right">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                {formattedPrice}
              </span>
              <span className="text-xs text-zinc-400">/{cycleLabel}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          检测到您的访问网络环境已切换至【{newRegionName}】，根据合规及反套利定价政策，价格已按当地货币及税率重新计算。是否确认按此价格继续订阅？
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            暂不订阅
          </button>
          <button
            type="button"
            onClick={() => onConfirm(data.newRegion)}
            className="px-4 py-2 text-xs font-medium text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg font-semibold shadow-sm transition-all"
          >
            确认并按新价格继续
          </button>
        </div>
      </div>
    </div>
  );
};
