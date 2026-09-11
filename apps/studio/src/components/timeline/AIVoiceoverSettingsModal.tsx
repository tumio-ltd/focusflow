import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Volume2,
  Sparkles,
  KeyRound,
  Globe2,
  Sliders,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
  getStoredTTSConfig,
  saveStoredTTSConfig,
  TTS_PRESETS,
  type TTSMode,
  type TTSPresetKey,
  type TTSStoredConfig,
} from '@/services/audio/tts/ttsConfigStore';
import { UserKeyOpenAITTSProvider } from '@/services/audio/tts/UserKeyOpenAITTSProvider';
import { GeminiTTSProvider } from '@/services/audio/tts/GeminiTTSProvider';
import { speakWebSpeech } from '@/services/audio/tts/WebSpeechTTSProvider';

interface AIVoiceoverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynthesizeBatch?: () => Promise<void>;
}

export const AIVoiceoverSettingsModal: React.FC<AIVoiceoverSettingsModalProps> = ({
  isOpen,
  onClose,
  onSynthesizeBatch,
}) => {
  const { t, i18n } = useTranslation('audio');
  const [config, setConfig] = useState<TTSStoredConfig>(getStoredTTSConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testText, setTestText] = useState(t('previewSampleText'));
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredTTSConfig());
      setTestStatus({ type: 'idle', message: '' });
      setTestText(t('previewSampleText'));
    }
  }, [isOpen, t]);

  if (!isOpen) return null;

  const currentPresetDef = TTS_PRESETS[config.preset] || TTS_PRESETS.openai;

  const handleModeChange = (mode: TTSMode) => {
    const updated = { ...config, mode };
    setConfig(updated);
    saveStoredTTSConfig(updated);
    setTestStatus({ type: 'idle', message: '' });
  };

  const handlePresetChange = (preset: TTSPresetKey) => {
    const presetDef = TTS_PRESETS[preset];
    const updated: TTSStoredConfig = {
      ...config,
      preset,
      baseUrl: presetDef.baseUrl,
      model: presetDef.defaultModel,
      voice: presetDef.voices[0]?.id || 'alloy',
    };
    setConfig(updated);
    saveStoredTTSConfig(updated);
    setTestStatus({ type: 'idle', message: '' });
  };

  const handleResetBaseUrl = () => {
    const updated = { ...config, baseUrl: currentPresetDef.baseUrl };
    setConfig(updated);
    saveStoredTTSConfig(updated);
  };

  const handleTestTTS = async () => {
    setTestStatus({ type: 'idle', message: '' });
    setIsTesting(true);

    if (config.mode === 'offline') {
      try {
        speakWebSpeech(testText, config.speed, undefined, config.voice);
        setTestStatus({ type: 'success', message: t('previewSuccessOffline') });
      } catch (err: any) {
        setTestStatus({ type: 'error', message: err?.message || t('previewErrorRequest') });
      } finally {
        setIsTesting(false);
      }
      return;
    }

    // Cloud Mode test
    if (!config.apiKey.trim()) {
      setTestStatus({ type: 'error', message: t('previewErrorNoKey') });
      setIsTesting(false);
      return;
    }

    try {
      const provider = config.preset === 'gemini'
        ? new GeminiTTSProvider({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
            customVoices: currentPresetDef.voices,
          })
        : new UserKeyOpenAITTSProvider({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
            customVoices: currentPresetDef.voices,
          });

      const res = await provider.synthesize(testText, config.voice, config.speed);
      const audioUrl = URL.createObjectURL(res.audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      try {
        await audio.play();
      } catch {
        // Ignore autoplay or audio device errors in headless environment
      }

      setTestStatus({
        type: 'success',
        message: t('previewSuccessCloud', { duration: (res.durationMs / 1000).toFixed(1) }),
      });
    } catch (err: any) {
      console.error('Test TTS failed:', err);
      setTestStatus({
        type: 'error',
        message: err?.message || t('previewErrorRequest'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveOnly = () => {
    saveStoredTTSConfig(config);
    onClose();
  };

  const handleSaveAndBatchSynthesize = async () => {
    saveStoredTTSConfig(config);
    if (onSynthesizeBatch) {
      try {
        setIsBatchLoading(true);
        await onSynthesizeBatch();
        onClose();
      } catch (err) {
        console.error('Batch synthesis failed:', err);
      } finally {
        setIsBatchLoading(false);
      }
    } else {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-card-foreground transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="ai-voiceover-settings-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide flex items-center gap-2 text-foreground">
                {t('settingsTitle')}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {t('dualModeBadge')}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('settingsSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-3 border-b border-border bg-muted/30 flex gap-3">
          <button
            onClick={() => handleModeChange('offline')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2.5 border ${
              config.mode === 'offline'
                ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                : 'bg-background border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
            data-testid="tts-mode-offline-btn"
          >
            <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                {t('modeOfflineTitle')}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t('modeOfflineBadge')}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{t('modeOfflineDesc')}</div>
            </div>
          </button>

          <button
            onClick={() => handleModeChange('cloud')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2.5 border ${
              config.mode === 'cloud'
                ? 'bg-primary/10 border-primary text-foreground shadow-sm'
                : 'bg-background border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
            data-testid="tts-mode-cloud-btn"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                {t('modeCloudTitle')}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {t('modeCloudBadge')}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{t('modeCloudDesc')}</div>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {config.mode === 'offline' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {t('offlineEnabledTitle')}
                </div>
                <ul className="list-disc list-inside space-y-1 text-foreground/80 text-[11px] leading-relaxed">
                  <li>
                    <strong>{t('offlineBullet1Title')}</strong>：{t('offlineBullet1Desc')}
                  </li>
                  <li>
                    <strong>{t('offlineBullet2Title')}</strong>：{t('offlineBullet2Desc')}
                  </li>
                  <li>
                    <strong>{t('offlineBullet3Title')}</strong>：{t('offlineBullet3Desc')}
                  </li>
                </ul>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('speechSpeed')}
                  </span>
                  <span className="text-primary font-mono font-semibold">{config.speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={config.speed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    const updated = { ...config, speed };
                    setConfig(updated);
                    saveStoredTTSConfig(updated);
                  }}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{t('speedSlow')}</span>
                  <span>{t('speedNormal')}</span>
                  <span>{t('speedFast')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Presets Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">
                  {t('presetLabel')}
                </label>
                <select
                  value={config.preset}
                  onChange={(e) => handlePresetChange(e.target.value as TTSPresetKey)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  data-testid="tts-preset-select"
                >
                  <option value="openai">{t('presetOpenAI')}</option>
                  <option value="siliconflow">{t('presetSiliconFlow')}</option>
                  <option value="gemini">{t('presetGemini')}</option>
                  <option value="custom">{t('presetCustom')}</option>
                </select>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('apiEndpointLabel')}
                  </label>
                  <button
                    onClick={handleResetBaseUrl}
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('resetDefault')}
                  </button>
                </div>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => {
                    const baseUrl = e.target.value;
                    const updated = { ...config, baseUrl };
                    setConfig(updated);
                    saveStoredTTSConfig(updated);
                  }}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  data-testid="tts-base-url-input"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('apiKeyLabel')}
                  </label>
                  {currentPresetDef.helpUrl && (
                    <a
                      href={currentPresetDef.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline"
                    >
                      {t('getKeyLink')}
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => {
                      const apiKey = e.target.value;
                      const updated = { ...config, apiKey };
                      setConfig(updated);
                      saveStoredTTSConfig(updated);
                    }}
                    placeholder="sk-..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground pr-9 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                    data-testid="tts-api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  🔒 {t('apiKeyStorageNotice')}
                </p>
              </div>

              {/* Model & Voice */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">{t('modelLabel')}</label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => {
                      const model = e.target.value;
                      const updated = { ...config, model };
                      setConfig(updated);
                      saveStoredTTSConfig(updated);
                    }}
                    list="tts-model-suggestions"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  />
                  <datalist id="tts-model-suggestions">
                    {currentPresetDef.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">{t('voiceLabel')}</label>
                  <select
                    value={config.voice}
                    onChange={(e) => {
                      const voice = e.target.value;
                      const updated = { ...config, voice };
                      setConfig(updated);
                      saveStoredTTSConfig(updated);
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  >
                    {currentPresetDef.voices.map((v) => {
                      const voiceLabel = i18n.language === 'en' ? ({
                        alloy: 'Alloy (Neutral & Versatile)',
                        echo: 'Echo (Calm Male)',
                        fable: 'Fable (Narrative Storyteller)',
                        onyx: 'Onyx (Deep Baritone)',
                        nova: 'Nova (Professional Female)',
                        shimmer: 'Shimmer (Bright & Expressive)',
                        alex: 'Alex (Warm Narrator)',
                        benjamin: 'Benjamin (Rich Male)',
                        claire: 'Claire (Intelligent Female)',
                        david: 'David (Standard Male)',
                        puck: 'Puck (Energetic Male)',
                        charon: 'Charon (Deep & Resonant Male)',
                        kore: 'Kore (Warm & Clear Female)',
                        fenrir: 'Fenrir (Crisp & Magnetic Male)',
                        aoede: 'Aoede (Narrative & Elegant Female)',
                      }[v.id.toLowerCase()] || v.name) : v.name;
                      return (
                        <option key={v.id} value={v.id}>
                          {voiceLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('speechSpeed')}
                  </span>
                  <span className="text-primary font-mono font-semibold">{config.speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={config.speed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    const updated = { ...config, speed };
                    setConfig(updated);
                    saveStoredTTSConfig(updated);
                  }}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{t('speedSlow')}</span>
                  <span>{t('speedNormal')}</span>
                  <span>{t('speedFast')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Listen Box */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-primary" />
                {t('previewSectionTitle')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTTS}
                disabled={isTesting}
                className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                data-testid="tts-test-preview-btn"
              >
                {isTesting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    {t('previewGenerating')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-primary" />
                    {t('testVoiceBtn')}
                  </span>
                )}
              </Button>
            </div>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            {testStatus.type !== 'idle' && (
              <div
                className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                  testStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {testStatus.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-destructive" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            💾 {t('footerPersistedNote')}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('closeBtn')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOnly}
            >
              {t('saveConfigBtn')}
            </Button>
            {onSynthesizeBatch && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndBatchSynthesize}
                disabled={isBatchLoading}
                className="shadow-sm"
                data-testid="tts-save-and-batch-btn"
              >
                {isBatchLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    {t('batchSynthesizingBtn')}
                  </span>
                ) : (
                  t('saveAndBatchBtn')
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
