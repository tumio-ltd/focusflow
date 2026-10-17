import React from 'react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Languages, ArrowLeft } from 'lucide-react';
import { Button, BrandLogo } from '@/components/ui';

export interface LandingTopBarProps {
  onBackToWorkbench?: () => void;
  activeNav?: 'pricing' | 'features' | 'billing' | 'docs';
}

export const LandingTopBar: React.FC<LandingTopBarProps> = ({
  onBackToWorkbench,
  activeNav = 'pricing',
}) => {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(['pricing', 'common']);
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const toggleLanguage = () => {
    const nextLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focusflow_locale', nextLang);
    }
  };

  const handleBack = () => {
    if (onBackToWorkbench) {
      onBackToWorkbench();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-colors duration-150">
      <div className="max-w-[1240px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <BrandLogo size="md" />
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
                FocusFlow
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Studio Edition
              </span>
            </div>
          </button>

          {/* Quick Back to Editor Button */}
          <button
            onClick={handleBack}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('pricing:backToWorkbench')}</span>
          </button>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/pricing');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className={`text-xs font-semibold tracking-wide transition-colors ${
              activeNav === 'pricing'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('pricing:navPricing')}
          </a>
          <a
            href="/billing"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/billing');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className={`text-xs font-semibold tracking-wide transition-colors ${
              activeNav === 'billing'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('pricing:navBilling')}
          </a>
          <a
            href="#matrix"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('pricing:navMatrix')}
          </a>
          <a
            href="#faq"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('pricing:navFaq')}
          </a>
        </nav>

        {/* Right: Actions, Theme Toggle, Language */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleLanguage}
            title={currentLang === 'zh' ? 'Switch to English' : '切换到中文'}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Languages className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={cycleTheme}
            title={`主题: ${theme || 'system'}`}
            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          <Button
            variant="cta"
            onClick={handleBack}
            className="hidden sm:inline-flex h-9 px-4 text-xs font-semibold"
          >
            {t('pricing:enterWorkbench')}
          </Button>
        </div>
      </div>
    </header>
  );
};
