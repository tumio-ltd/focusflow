import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Terminal, 
  Cpu, 
  Users, 
  Layers, 
  Video, 
  Mic2,
  ExternalLink
} from 'lucide-react';
import { LandingTopBar } from '@/components/layout/LandingTopBar';
import { Button } from '@/components/ui';
import { SubscriptionModal } from '@/components/billing';
import { getActiveWorkspaceId } from '@/api/custom-instance';

export const PricingPage: React.FC = () => {
  const { t } = useTranslation('pricing');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | undefined>();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSelectPlan = (tier: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    if (tier === 'FREE') {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    setSelectedPlanCode(tier);
    setIsSubscriptionModalOpen(true);
  };

  const isYearly = billingCycle === 'YEARLY';

  const faqs = [
    {
      q: t('faqQ1'),
      a: t('faqA1'),
    },
    {
      q: t('faqQ2'),
      a: t('faqA2'),
    },
    {
      q: t('faqQ3'),
      a: t('faqA3'),
    },
    {
      q: t('faqQ4'),
      a: t('faqA4'),
    },
    {
      q: t('faqQ5'),
      a: t('faqA5'),
    },
  ];

  return (
    <div className="fixed inset-0 h-full w-full overflow-y-auto overflow-x-hidden bg-background text-foreground flex flex-col font-sans transition-colors duration-150 z-20">
      {/* 1. Shared Global Navigation Bar */}
      <LandingTopBar activeNav="pricing" />

      {/* 2. Hero Section */}
      <section className="pt-16 pb-12 lg:pt-20 lg:pb-16 px-6 max-w-[1200px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold tracking-wider uppercase">
            {t('pricingBadge')}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight mb-5">
          {t('pricingHeroTitle')}
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          {t('pricingHeroSubtitle')}
        </p>

        {/* Cadence Toggle (Monthly / Yearly) */}
        <div className="inline-flex items-center p-1.5 bg-muted/70 rounded-full border border-border shadow-inner">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              !isYearly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('monthlyBilling')}
          </button>
          <button
            onClick={() => setBillingCycle('YEARLY')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isYearly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{t('yearlyBilling')}</span>
            <span className="bg-primary/15 text-primary border border-primary/25 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              {t('savePercent')}
            </span>
          </button>
        </div>
      </section>

      {/* 3. Three-Tier Pricing Grid */}
      <section className="px-6 pb-20 max-w-[1240px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
          {/* Card 1: Free Community */}
          <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between hover:shadow-card transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('freeTierTag')}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">{t('freeTierTitle')}</h3>
                <p className="text-xs text-muted-foreground mt-2 min-h-[36px] leading-relaxed">
                  {t('freeTierDesc')}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">$</span>
                  <span className="text-5xl font-extrabold text-foreground tracking-tight">{t('freePrice')}</span>
                  <span className="text-xs text-muted-foreground ml-1">{t('freeCadence')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t('freeCardNote')}</p>
              </div>

              <div className="mb-8">
                <Button
                  variant="outline"
                  onClick={() => handleSelectPlan('FREE')}
                  className="w-full h-11 text-xs font-semibold"
                >
                  {t('freeCta')}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                  {t('freeSubnote')}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('freeIncludedTitle')}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('freeFeature1')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('freeFeature2')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('freeFeature3')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('freeFeature4')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground/50 line-through">
                  <span>{t('freeFeatureDisabled1')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground/50 line-through">
                  <span>{t('freeFeatureDisabled2')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pro Creator (Highlighted Tier) */}
          <div className="bg-card rounded-2xl border-2 border-primary shadow-glow-cyan p-8 flex flex-col justify-between relative lg:-translate-y-3 z-10 transition-all duration-200">
            {/* Top Recommended Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              <span>{t('proBadge')}</span>
            </div>

            <div>
              <div className="mb-6 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t('proTierTag')}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">{t('proTierTitle')}</h3>
                <p className="text-xs text-muted-foreground mt-2 min-h-[36px] leading-relaxed">
                  {t('proTierDesc')}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">$</span>
                  <span className="text-5xl font-extrabold text-foreground tracking-tight">
                    {isYearly ? t('proPriceYearly') : t('proPriceMonthly')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{t('proCadence')}</span>
                </div>
                <p className="text-[11px] text-primary font-medium mt-1">
                  {isYearly ? t('proSubtextYearly') : t('proSubtextMonthly')}
                </p>
              </div>

              {/* Action: Studio Coral Gradient CTA */}
              <div className="mb-8">
                <Button
                  variant="cta"
                  onClick={() => handleSelectPlan('PRO')}
                  className="w-full h-11 text-xs font-semibold gap-2 shadow-lg"
                >
                  <span>{t('proCta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                  {t('proCardNote')}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                  {t('proIncludedTitle')}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature1')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature2')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature3')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature4')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature5')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('proFeature6')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Enterprise */}
          <div className="bg-card rounded-2xl border border-border p-8 flex flex-col justify-between hover:shadow-card transition-all duration-200 hover:-translate-y-1">
            <div>
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('enterpriseTierTag')}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">{t('enterpriseTierTitle')}</h3>
                <p className="text-xs text-muted-foreground mt-2 min-h-[36px] leading-relaxed">
                  {t('enterpriseTierDesc')}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-border/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">$</span>
                  <span className="text-5xl font-extrabold text-foreground tracking-tight">
                    {isYearly ? t('enterprisePriceYearly') : t('enterprisePriceMonthly')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{t('enterpriseCadence')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t('enterpriseCardNote')}</p>
              </div>

              <div className="mb-8">
                <Button
                  variant="secondary"
                  onClick={() => handleSelectPlan('ENTERPRISE')}
                  className="w-full h-11 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                >
                  {t('enterpriseCta')}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                  {t('enterpriseSubnote')}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('enterpriseIncludedTitle')}
                </p>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature1')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature2')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature3')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature4')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature5')}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('enterpriseFeature6')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Social Proof Trust Bar */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-6">
            {t('socialProofTitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-primary" /> Vercel
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" /> Supabase
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" /> Figma
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Linear
            </span>
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <Video className="w-4 h-4 text-primary" /> Raycast
            </span>
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Feature Comparison Table */}
      <section id="matrix" className="py-20 px-6 max-w-[1240px] mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-3">
            {t('matrixTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            {t('matrixSubtitle')}
          </p>
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-4 font-bold text-foreground w-2/5">{t('matrixColCapabilities')}</th>
                  <th className="p-4 font-bold text-foreground text-center w-1/5">{t('matrixColFree')}</th>
                  <th className="p-4 font-bold text-primary text-center w-1/5 bg-primary/5 border-x border-border">
                    {t('matrixColPro')}
                  </th>
                  <th className="p-4 font-bold text-foreground text-center w-1/5">{t('matrixColEnterprise')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Category 1 */}
                <tr className="bg-muted/20">
                  <td colSpan={4} className="px-4 py-2.5 font-bold text-foreground text-[11px] uppercase tracking-wider">
                    {t('groupRender')}
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featRenderMinutes')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{t('valRenderFree')}</td>
                  <td className="px-4 py-3 text-center font-bold text-primary bg-primary/5 border-x border-border">
                    {t('valRenderPro')}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{t('valRenderEnterprise')}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featResolution')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{t('valResFree')}</td>
                  <td className="px-4 py-3 text-center text-foreground font-semibold bg-primary/5 border-x border-border">
                    {t('valResPro')}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground font-semibold">{t('valResEnterprise')}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featHardwareAccel')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center text-primary bg-primary/5 border-x border-border">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>

                {/* Category 2 */}
                <tr className="bg-muted/20">
                  <td colSpan={4} className="px-4 py-2.5 font-bold text-foreground text-[11px] uppercase tracking-wider">
                    {t('groupAi')}
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featAiChars')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{t('valAiCharsFree')}</td>
                  <td className="px-4 py-3 text-center font-bold text-primary bg-primary/5 border-x border-border">
                    {t('valAiCharsPro')}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{t('valAiCharsEnterprise')}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featVoiceCloning')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center text-foreground font-medium bg-primary/5 border-x border-border">
                    {t('valClonePro')}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground font-medium">{t('valCloneEnterprise')}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featLocalization')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{t('valLocaleFree')}</td>
                  <td className="px-4 py-3 text-center text-primary bg-primary/5 border-x border-border">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>

                {/* Category 3 */}
                <tr className="bg-muted/20">
                  <td colSpan={4} className="px-4 py-2.5 font-bold text-foreground text-[11px] uppercase tracking-wider">
                    {t('groupWorkflow')}
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featStandaloneExport')}</td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center bg-primary/5 border-x border-border">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featWatermarkRemoval')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center bg-primary/5 border-x border-border">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featAirGappedCli')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 bg-primary/5 border-x border-border font-bold">
                    –
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>

                {/* Category 4 */}
                <tr className="bg-muted/20">
                  <td colSpan={4} className="px-4 py-2.5 font-bold text-foreground text-[11px] uppercase tracking-wider">
                    {t('groupTeam')}
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featSeats')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{t('valSeatsFree')}</td>
                  <td className="px-4 py-3 text-center font-bold text-primary bg-primary/5 border-x border-border">
                    {t('valSeatsPro')}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{t('valSeatsEnterprise')}</td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featSso')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 bg-primary/5 border-x border-border font-bold">
                    –
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>
                <tr className="hover:bg-muted/10">
                  <td className="px-4 py-3 text-foreground font-medium">{t('featTaxInvoice')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40 font-bold">–</td>
                  <td className="px-4 py-3 text-center bg-primary/5 border-x border-border">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Check className="w-4 h-4 mx-auto text-primary" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (FAQ) Accordion */}
      <section id="faq" className="py-14 px-6 max-w-[900px] mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            {t('faqTitle')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('faqSubtitle')}
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-sm text-foreground focus:outline-none cursor-pointer group"
                >
                  <span className="group-hover:text-primary transition-colors">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="py-16 px-6 max-w-[1240px] mx-auto w-full">
        <div className="rounded-3xl bg-card border border-border p-10 lg:p-14 text-center relative overflow-hidden shadow-card">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {t('bottomCtaTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('bottomCtaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                variant="cta"
                onClick={() => handleSelectPlan('PRO')}
                className="w-full sm:w-auto h-11 px-8 text-xs font-semibold gap-2 shadow-md"
              >
                <span>{t('bottomCtaTryPro')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.history.pushState(null, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full sm:w-auto h-11 px-8 text-xs font-semibold"
              >
                {t('bottomCtaFree')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-border bg-muted/20 py-8 px-6 text-xs text-muted-foreground transition-colors duration-150">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">FocusFlow</span>
            <span>{t('copyright')}</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <a href="#faq" className="hover:text-foreground transition-colors">
              {t('terms')}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              {t('privacy')}
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              {t('security')}
            </a>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {t('clusterStatus')}
            </span>
          </div>
        </div>
      </footer>

      {/* Embedded Subscription Modal for Instant Checkout */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        workspaceId={getActiveWorkspaceId() || 'ws_default'}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={() => {
          setIsSubscriptionModalOpen(false);
          window.history.pushState(null, '', '/billing');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      />
    </div>
  );
};
