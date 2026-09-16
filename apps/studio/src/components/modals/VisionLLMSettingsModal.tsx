import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Sparkles,
  KeyRound,
  Globe2,
  Check,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Link2,
  Cpu,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  type AIProviderId,
  getProviderCredentials,
  purgeAllCredentials,
  PROVIDER_DEFAULT_BASE_URLS,
} from '@/services/ai/aiProviderVault';
import {
  getStoredVisionConfig,
  saveStoredVisionConfig,
  VISION_PRESETS,
  type VisionLLMStoredConfig,
} from '@/services/autoTour/visionLLMConfigStore';
import { testAIProviderConnection } from '@/services/ai/aiConnectivityTester';

interface VisionLLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const VisionLLMSettingsModal: React.FC<VisionLLMSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { t, i18n } = useTranslation('common');
  const isEn = i18n.language?.startsWith('en');
  const [config, setConfig] = useState<VisionLLMStoredConfig>(getStoredVisionConfig());
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Sync state when modal opens or provider changes
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredVisionConfig();
      setConfig(stored);
      setTestStatus({ type: 'idle', message: '' });
      setShowPurgeConfirm(false);

      if (stored.inheritKeyFromVault) {
        const vaultCreds = getProviderCredentials(stored.provider);
        setApiKey(vaultCreds.apiKey);
        setBaseUrl(vaultCreds.baseUrl || PROVIDER_DEFAULT_BASE_URLS[stored.provider]);
      } else {
        setApiKey(stored.customApiKey || '');
        setBaseUrl(stored.customBaseUrl || PROVIDER_DEFAULT_BASE_URLS[stored.provider]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreset = VISION_PRESETS[config.provider] || VISION_PRESETS.gemini;

  const handleProviderChange = (provider: AIProviderId) => {
    const presetDef = VISION_PRESETS[provider];
    let nextApiKey = '';
    let nextBaseUrl = presetDef.defaultModel ? PROVIDER_DEFAULT_BASE_URLS[provider] : '';

    if (config.inheritKeyFromVault) {
      const vaultCreds = getProviderCredentials(provider);
      nextApiKey = vaultCreds.apiKey;
      nextBaseUrl = vaultCreds.baseUrl || PROVIDER_DEFAULT_BASE_URLS[provider];
    } else {
      nextApiKey = config.customApiKey || '';
      nextBaseUrl = config.customBaseUrl || PROVIDER_DEFAULT_BASE_URLS[provider];
    }

    const updated: VisionLLMStoredConfig = {
      ...config,
      provider,
      model: presetDef.defaultModel,
      isCustomModel: false,
    };

    setConfig(updated);
    setApiKey(nextApiKey);
    setBaseUrl(nextBaseUrl);
    setTestStatus({ type: 'idle', message: '' });
  };

  const handleInheritToggle = (inherit: boolean) => {
    const updated: VisionLLMStoredConfig = {
      ...config,
      inheritKeyFromVault: inherit,
    };
    setConfig(updated);

    if (inherit) {
      const vaultCreds = getProviderCredentials(config.provider);
      setApiKey(vaultCreds.apiKey);
      setBaseUrl(vaultCreds.baseUrl || PROVIDER_DEFAULT_BASE_URLS[config.provider]);
    } else {
      setApiKey(config.customApiKey || '');
      setBaseUrl(config.customBaseUrl || PROVIDER_DEFAULT_BASE_URLS[config.provider]);
    }
    setTestStatus({ type: 'idle', message: '' });
  };

  const handleResetBaseUrl = () => {
    const defaultUrl = PROVIDER_DEFAULT_BASE_URLS[config.provider] || 'https://api.openai.com/v1';
    setBaseUrl(defaultUrl);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus({
        type: 'error',
        message: t('connectionFailed', { error: 'API Key cannot be empty' }),
      });
      return;
    }

    setIsTesting(true);
    setTestStatus({ type: 'idle', message: '' });

    try {
      const res = await testAIProviderConnection({
        provider: config.provider,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim() || PROVIDER_DEFAULT_BASE_URLS[config.provider],
        model: config.model,
      });

      if (res.ok) {
        setTestStatus({
          type: 'success',
          message: t('connectionSuccess', { latency: res.latencyMs }),
        });
      } else {
        setTestStatus({
          type: 'error',
          message: t('connectionFailed', { error: res.error || 'Unknown error' }),
        });
      }
    } catch (e: any) {
      setTestStatus({
        type: 'error',
        message: t('connectionFailed', { error: e?.message || String(e) }),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveStoredVisionConfig({
      ...config,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
    });
    if (onSaved) onSaved();
    onClose();
  };

  const handlePurge = () => {
    purgeAllCredentials();
    setApiKey('');
    setBaseUrl(PROVIDER_DEFAULT_BASE_URLS[config.provider]);
    setShowPurgeConfirm(false);
    setTestStatus({ type: 'idle', message: '' });
  };

  const providerKeys: AIProviderId[] = ['gemini', 'openai', 'siliconflow', 'custom'];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        data-testid="vision-llm-settings-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {t('visionSettingsTitle')}
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Mode 2 Copilot
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">{t('visionSettingsSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Provider Selector Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              {t('providerLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {providerKeys.map((p) => {
                const isSelected = config.provider === p;
                const preset = VISION_PRESETS[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary shadow-sm font-semibold'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                    data-testid={`vision-provider-${p}`}
                  >
                    <span className="truncate w-full text-center">
                      {p === 'gemini'
                        ? 'Google Gemini'
                        : p === 'openai'
                        ? 'OpenAI'
                        : p === 'siliconflow'
                        ? 'SiliconFlow'
                        : 'Custom / Proxy'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials Sharing Mode Switcher */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-medium text-foreground">
                  {t('inheritKeyToggle')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {config.inheritKeyFromVault
                    ? t('inheritedKeyNotice')
                    : t('customKeyToggle')}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.inheritKeyFromVault}
                onChange={(e) => handleInheritToggle(e.target.checked)}
                className="sr-only peer"
                data-testid="vision-inherit-key-toggle"
              />
              <div className="w-9 h-5 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                {t('apiKeyLabel')}
                {config.inheritKeyFromVault && apiKey.trim() && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Shared Vault
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                {currentPreset.apiKeyDashboardUrl && (
                  <a
                    href={currentPreset.apiKeyDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-0.5"
                  >
                    {t('apiKeyDashboardLabel')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus({ type: 'idle', message: '' });
                }}
                placeholder={t('apiKeyPlaceholder')}
                className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                data-testid="vision-api-key-input"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Base URL Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                {t('baseUrlLabel')}
              </label>
              <button
                type="button"
                onClick={handleResetBaseUrl}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t('resetBaseUrl')}
              </button>
            </div>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setTestStatus({ type: 'idle', message: '' });
              }}
              placeholder={PROVIDER_DEFAULT_BASE_URLS[config.provider]}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
              data-testid="vision-base-url-input"
            />
          </div>

          {/* Vision Model Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                {t('modelLabel')}
              </label>
              <div className="flex items-center gap-2">
                {currentPreset.officialDocUrl && (
                  <a
                    href={currentPreset.officialDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                  >
                    {t('officialDocLabel')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, isCustomModel: !config.isCustomModel })
                  }
                  className="text-[11px] text-primary hover:underline"
                >
                  {config.isCustomModel ? t('selectPresetModel', '选择预设模型') : t('customModelToggle')}
                </button>
              </div>
            </div>

            {config.isCustomModel ? (
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value.trim() })}
                placeholder={t('customModelPlaceholder')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                data-testid="vision-custom-model-input"
              />
            ) : (
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                data-testid="vision-model-select"
              >
                {currentPreset.models.map((m) => {
                  const desc = isEn ? (m.descriptionEn || m.description || m.id) : (m.description || m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.label} {m.tag ? `[${m.tag}]` : ''} - {desc}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Connectivity Test Bar */}
          <div className="pt-1 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="text-xs shrink-0 flex items-center gap-1.5"
              data-testid="vision-test-connection-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {isTesting ? t('testingConnection') : t('testConnectionBtn')}
            </Button>

            {testStatus.type === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{testStatus.message}</span>
              </div>
            )}

            {testStatus.type === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium truncate">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{testStatus.message}</span>
              </div>
            )}
          </div>

          {/* Zero-Leakage & Local Security Box */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              {t('securityPromiseTitle', 'FocusFlow 端侧零信任凭据安全承诺')}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('zeroLeakageNotice')}
            </p>

            {/* Purge Button */}
            <div className="pt-1 flex items-center justify-between">
              {showPurgeConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-destructive font-medium">
                    {t('purgeKeysConfirm')}
                  </span>
                  <button
                    type="button"
                    onClick={handlePurge}
                    className="px-2 py-1 rounded bg-destructive text-destructive-foreground text-[11px] font-semibold hover:bg-destructive/90"
                  >
                    {t('confirmPurge', '确认抹除')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPurgeConfirm(false)}
                    className="px-2 py-1 rounded bg-muted text-muted-foreground text-[11px] hover:text-foreground"
                  >
                    {t('cancel', '取消')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(true)}
                  className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {t('purgeKeysBtn')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {t('cancel')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            className="text-xs font-semibold"
            data-testid="vision-save-btn"
          >
            {t('saveAndApply')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
