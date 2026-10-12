import React, { useState, useEffect } from 'react';
import { X, Sparkles, Globe } from 'lucide-react';
import axios from 'axios';
import { PlanCard, PlanCardItem } from './PlanCard';
import {
  PricingRegionChangedModal,
  PricingRegionChangedData,
} from './PricingRegionChangedModal';
import { RegionalPriceMatrixModal } from './RegionalPriceMatrixModal';
import { OpsRegionSimulatorBar } from '../admin/OpsRegionSimulatorBar';

interface SubscriptionModalProps {
  isOpen: boolean;
  workspaceId: string;
  currentTier?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  workspaceId,
  currentTier = 'FREE',
  onClose,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<PlanCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [simulatedRegion, setSimulatedRegion] = useState<string | null>(null);
  const [pricingConflict, setPricingConflict] = useState<{
    data: PricingRegionChangedData;
    pendingPlan: PlanCardItem;
  } | null>(null);

  const fetchPlans = (regionOverride?: string | null) => {
    setIsLoading(true);
    const params: any = { workspaceId };
    if (regionOverride) {
      params.simulatedRegion = regionOverride;
    }
    axios
      .get('/api/plans', {
        params,
        headers: { 'X-App-Id': 'focusflow' },
      })
      .then((res) => {
        setPlans(res.data);
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchPlans(simulatedRegion);
  }, [isOpen, workspaceId, simulatedRegion]);

  if (!isOpen) return null;

  const filteredPlans = plans.filter(
    (p) => p.tier === 'FREE' || p.billingCycle === selectedCycle,
  );

  const handleSubscribe = async (plan: PlanCardItem, acknowledgedRegion?: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        '/api/orders',
        {
          workspaceId,
          planCode: plan.code,
          acknowledgedRegion,
        },
        {
          headers: { 'X-App-Id': 'focusflow' },
        },
      );

      const order = res.data;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.error === 'PRICING_REGION_CHANGED') {
        const errorData = err.response.data.data;
        setPricingConflict({
          data: {
            previousRegion: errorData.previousRegion,
            newRegion: errorData.newRegion,
            newCurrency: errorData.newCurrency,
            newPriceCents: errorData.newPriceCents,
            billingCycle: plan.billingCycle,
          },
          pendingPlan: plan,
        });
      } else {
        console.error('Order creation error:', err);
        alert(err.response?.data?.message || '下单失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegionChange = (newRegion: string) => {
    if (!pricingConflict) return;
    const plan = pricingConflict.pendingPlan;
    setPricingConflict(null);
    handleSubscribe(plan, newRegion);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>解锁全功能创意潜能</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">选择适合您的商业套餐</h2>
            <p className="text-xs text-zinc-400 mt-2">
              获得最高 4K 超高清导出、海量 AI 算力额度与专属商业去水印特权
            </p>

            {/* Cycle Switcher & Matrix Button */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedCycle('MONTHLY')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedCycle === 'MONTHLY'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  按月订阅
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle('YEARLY')}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedCycle === 'YEARLY'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  按年订阅
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMatrixModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all shadow-sm"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>全地区大盘对比</span>
              </button>
            </div>
          </div>

          {/* Simulation Active Indicator Bar */}
          {plans.length > 0 && plans[0].isSimulated && (
            <div className="mb-6 -mt-2">
              <OpsRegionSimulatorBar
                currentRegion={simulatedRegion || plans[0].simulatedRegion || 'US'}
                simulationExpiresAt={plans[0].simulationExpiresAt}
                onRegionChange={(newRegion) => {
                  if (newRegion === 'ALL') {
                    setShowMatrixModal(true);
                  } else {
                    setSimulatedRegion(newRegion);
                  }
                }}
                onExitSimulation={() => setSimulatedRegion(null)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.tier === currentTier}
                isLoading={isLoading}
                isSimulated={plans[0]?.isSimulated}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>
      </div>

      <PricingRegionChangedModal
        isOpen={!!pricingConflict}
        data={pricingConflict?.data || null}
        onConfirm={handleConfirmRegionChange}
        onCancel={() => setPricingConflict(null)}
      />

      <RegionalPriceMatrixModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
        plans={plans}
      />
    </>
  );
};
