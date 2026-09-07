import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [config, setConfig] = useState<TTSStoredConfig>(getStoredTTSConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testText, setTestText] = useState('欢迎使用 FocusFlow，新一代架构演进动态可视化系统。');
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
    }
  }, [isOpen]);

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
        speakWebSpeech(testText, config.speed);
        setTestStatus({ type: 'success', message: '已通过浏览器原生语音朗读试听' });
      } catch (err: any) {
        setTestStatus({ type: 'error', message: err?.message || '浏览器语音发音异常' });
      } finally {
        setIsTesting(false);
      }
      return;
    }

    // Cloud Mode test
    if (!config.apiKey.trim()) {
      setTestStatus({ type: 'error', message: '请先填写 API Key 才能进行云端试听' });
      setIsTesting(false);
      return;
    }

    try {
      const provider = new UserKeyOpenAITTSProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        customVoices: currentPresetDef.voices,
      });

      const res = await provider.synthesize(testText, config.voice, config.speed);
      const audioUrl = URL.createObjectURL(res.audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();

      setTestStatus({
        type: 'success',
        message: `试听合成成功！音频长度 ${(res.durationMs / 1000).toFixed(1)} 秒`,
      });
    } catch (err: any) {
      console.error('Test TTS failed:', err);
      setTestStatus({
        type: 'error',
        message: err?.message || '请求失败，请检查 Base URL、API Key 或网络连接',
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100"
        onClick={(e) => e.stopPropagation()}
        data-testid="ai-voiceover-settings-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wide flex items-center gap-2">
                AI 提词与语音合成配置
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  双模式
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                可自由选用离线免 Key 浏览器原生发音，或配置云端广播级 AI 真人语音母带
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-zinc-800/80 bg-zinc-950/40 flex gap-3">
          <button
            onClick={() => handleModeChange('offline')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 border ${
              config.mode === 'offline'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
            }`}
            data-testid="tts-mode-offline-btn"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                离线原生语音
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  免 Key / 0 门槛
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">系统原生播音员真实朗读，无蜂鸣电子音</div>
            </div>
          </button>

          <button
            onClick={() => handleModeChange('cloud')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 border ${
              config.mode === 'cloud'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
            }`}
            data-testid="tts-mode-cloud-btn"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                云端高清 AI 语音
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  BYOK 自备 Key
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">OpenAI / 硅基流动 / 广播级真人母带</div>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {config.mode === 'offline' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-2">
                <div className="font-medium text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  已启用离线原生语音合成模式
                </div>
                <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] leading-relaxed">
                  <li>
                    <strong>真实语音朗读</strong>：演播试听时，直接由操作系统的本地播音员（如 Mac 婷婷、Windows/Edge 晓晓、Safari 默认）朗读真实台词。
                  </li>
                  <li>
                    <strong>消除电子音</strong>：底层母带平滑对齐，彻底移除了此前单调刺耳的 320Hz 正弦波蜂鸣（“翁~”）。
                  </li>
                  <li>
                    <strong>100% 离线与免费</strong>：无需任何 API Key，无网络请求消耗，适合快速本地彩排与离线演示。
                  </li>
                </ul>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    发音语速
                  </span>
                  <span className="text-cyan-400 font-mono">{config.speed.toFixed(1)}x</span>
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
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>0.5x 慢速</span>
                  <span>1.0x 标准</span>
                  <span>2.0x 极速</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Presets Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  主流服务商预设 (Preset)
                </label>
                <select
                  value={config.preset}
                  onChange={(e) => handlePresetChange(e.target.value as TTSPresetKey)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                  data-testid="tts-preset-select"
                >
                  <option value="openai">OpenAI 官方 (api.openai.com)</option>
                  <option value="siliconflow">硅基流动 SiliconFlow (api.siliconflow.cn · 国内极速)</option>
                  <option value="custom">自定义兼容接口 (OneAPI / LocalAI / 私有中转)</option>
                </select>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
                    API Endpoint / Base URL
                  </label>
                  <button
                    onClick={handleResetBaseUrl}
                    className="text-[11px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    重置默认
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
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                  data-testid="tts-base-url-input"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    API Key
                  </label>
                  {currentPresetDef.helpUrl && (
                    <a
                      href={currentPresetDef.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      获取密钥 &rarr;
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 pr-9 focus:outline-none focus:border-cyan-500"
                    data-testid="tts-api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  🔒 密钥仅安全暂存在您的本地浏览器 localStorage 中，直接与服务商端点通信，绝不经过任何第三方服务器。
                </p>
              </div>

              {/* Model & Voice */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">模型 (Model)</label>
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                  <datalist id="tts-model-suggestions">
                    {currentPresetDef.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">音色 (Voice)</label>
                  <select
                    value={config.voice}
                    onChange={(e) => {
                      const voice = e.target.value;
                      const updated = { ...config, voice };
                      setConfig(updated);
                      saveStoredTTSConfig(updated);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    {currentPresetDef.voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    发音语速
                  </span>
                  <span className="text-cyan-400 font-mono">{config.speed.toFixed(1)}x</span>
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
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Test Listen Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                单句连通性试听 (Preview)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestTTS}
                disabled={isTesting}
                className="h-7 px-2.5 text-xs text-cyan-400 border-cyan-800/60 hover:bg-cyan-950/50"
                data-testid="tts-test-preview-btn"
              >
                {isTesting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3 h-3 fill-cyan-400" />
                    测试发音
                  </span>
                )}
              </Button>
            </div>
            <input
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
            {testStatus.type !== 'idle' && (
              <div
                className={`text-[11px] p-2 rounded flex items-center gap-1.5 ${
                  testStatus.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    : 'bg-red-950/40 text-red-300 border border-red-800/40'
                }`}
              >
                {testStatus.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            💾 配置已持久化记忆在本地
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-400 hover:text-white">
              取消
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveOnly}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              保存配置
            </Button>
            {onSynthesizeBatch && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndBatchSynthesize}
                disabled={isBatchLoading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950"
                data-testid="tts-save-and-batch-btn"
              >
                {isBatchLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    合流中...
                  </span>
                ) : (
                  '保存并一键全分幕合成'
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
