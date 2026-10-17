import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  Sparkles, 
  Video, 
  Mic2, 
  Layers, 
  ExternalLink, 
  Plus, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { LandingTopBar } from '@/components/layout/LandingTopBar';
import { Button } from '@/components/ui';
import { SubscriptionModal } from '@/components/billing';
import { getActiveWorkspaceId } from '@/api/custom-instance';

export const BillingPage: React.FC = () => {
  const { t } = useTranslation('billing');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock quota snapshot matching Stage 12B specification
  const quota = {
    tier: 'PRO',
    billingCycle: 'YEARLY',
    renewalDate: '2027-10-15',
    renderMinutes: {
      used: 72,
      total: 300,
    },
    ttsCharacters: {
      used: 85000,
      total: 250000,
    },
    cloudProjects: {
      used: 4,
      total: 20,
    },
    storageGB: {
      used: 2.4,
      total: 10,
    },
  };

  const renderPercent = Math.round((quota.renderMinutes.used / quota.renderMinutes.total) * 100);
  const ttsPercent = Math.round((quota.ttsCharacters.used / quota.ttsCharacters.total) * 100);
  const projectPercent = Math.round((quota.cloudProjects.used / quota.cloudProjects.total) * 100);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="fixed inset-0 h-full w-full overflow-y-auto overflow-x-hidden bg-background text-foreground flex flex-col font-sans transition-colors duration-150 z-20">
      {/* 1. Global Navigation */}
      <LandingTopBar activeNav="billing" />

      {/* 2. Main Content */}
      <main className="max-w-[1240px] mx-auto px-6 py-10 flex-grow w-full space-y-8">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                {t('billingTitle')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                {t('workspaceLabel')}: {getActiveWorkspaceId() || 'ws_default'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {t('billingSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{t('refreshQuota')}</span>
            </Button>
            <Button
              variant="cta"
              size="sm"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="text-xs h-9 font-semibold"
            >
              {t('upgradePlan')}
            </Button>
          </div>
        </div>

        {/* 3. Current Subscription Card */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{t('activePlanTitle')}</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    {t('statusActive')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('renewalNotice', { date: quota.renewalDate })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('https://billing.stripe.com', '_blank');
                }}
                className="text-xs h-9 gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('manageStripeCards')}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{t('privilege4k')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{t('privilegeWatermark')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>{t('privilegeCollab')}</span>
            </div>
          </div>
        </section>

        {/* 4. Entitlements Gauges (Quota Water Meters) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {t('gaugesTitle')}
            </h3>
            <span className="text-xs text-muted-foreground">{t('resetNotice')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Meter 1: 4K Render Minutes */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Video className="w-4 h-4 text-primary" />
                  <span>{t('gaugeRenderTitle')}</span>
                </div>
                <span className="text-[11px] font-bold text-primary font-mono">
                  {renderPercent}%
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t('usedDuration')}</span>
                  <span className="font-bold text-foreground font-mono">
                    {t('durationUnit', { used: quota.renderMinutes.used, total: quota.renderMinutes.total })}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${renderPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t('renderRemainingTip', { remaining: quota.renderMinutes.total - quota.renderMinutes.used, scenes: 76 })}
              </p>
            </div>

            {/* Meter 2: AI Voiceover Characters */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Mic2 className="w-4 h-4 text-amber-500" />
                  <span>{t('gaugeAiTitle')}</span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {ttsPercent}%
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t('usedChars')}</span>
                  <span className="font-bold text-foreground font-mono">
                    {t('charsUnit', { used: quota.ttsCharacters.used.toLocaleString(), total: quota.ttsCharacters.total.toLocaleString() })}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${ttsPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t('ttsEngineTip')}
              </p>
            </div>

            {/* Meter 3: Cloud Projects */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>{t('gaugeProjectsTitle')}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {projectPercent}%
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t('usedProjects')}</span>
                  <span className="font-bold text-foreground font-mono">
                    {t('projectsUnit', { used: quota.cloudProjects.used, total: quota.cloudProjects.total })}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${projectPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t('projectsBackupTip')}
              </p>
            </div>

            {/* Meter 4: Storage */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>{t('gaugeStorageTitle')}</span>
                </div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                  24%
                </span>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{t('usedStorage')}</span>
                  <span className="font-bold text-foreground font-mono">
                    {t('storageUnit', { used: quota.storageGB.used, total: quota.storageGB.total })}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: '24%' }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {t('storageCdnTip')}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Add-on Packs Section */}
        <section className="bg-muted/30 border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('addonsTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('addonsSubtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{t('addonRenderTitle')}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t('addonRenderDesc')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-extrabold text-foreground">$15</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="text-xs h-8"
                >
                  {t('purchaseAddon')}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{t('addonTtsTitle')}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t('addonTtsDesc')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-extrabold text-foreground">$10</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="text-xs h-8"
                >
                  {t('purchaseAddon')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Orders and Invoices History */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t('ordersTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('ordersSubtitle')}
              </p>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                  <th className="p-3.5 font-semibold">{t('colOrderNo')}</th>
                  <th className="p-3.5 font-semibold">{t('colTime')}</th>
                  <th className="p-3.5 font-semibold">{t('colItem')}</th>
                  <th className="p-3.5 font-semibold">{t('colAmount')}</th>
                  <th className="p-3.5 font-semibold">{t('colStatus')}</th>
                  <th className="p-3.5 font-semibold text-right">{t('colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-muted/10">
                  <td className="p-3.5 font-mono text-foreground font-semibold">ord_focus_984128</td>
                  <td className="p-3.5 text-muted-foreground">2026-10-15 14:20</td>
                  <td className="p-3.5 text-foreground">{t('activePlanTitle')}</td>
                  <td className="p-3.5 font-mono text-foreground font-bold">$276.00 USD</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {t('statusPaid')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('downloadReceipt')}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        workspaceId={getActiveWorkspaceId() || 'ws_default'}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={() => {
          setIsSubscriptionModalOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
};
