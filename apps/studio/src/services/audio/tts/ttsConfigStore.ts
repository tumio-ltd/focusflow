/**
 * TTS Configuration Store and Presets
 * Supports Offline Web Speech, Official OpenAI, SiliconFlow, and custom OpenAI-compatible endpoints.
 * Automatically persists settings in localStorage.
 */

export type TTSMode = 'offline' | 'cloud';

export type TTSPresetKey = 'openai' | 'siliconflow' | 'gemini' | 'custom';

export interface TTSVoiceItem {
  id: string;
  name: string;
  lang: string;
  description?: string;
}

export interface TTSPresetDefinition {
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  voices: TTSVoiceItem[];
  helpUrl?: string;
}

export interface TTSStoredConfig {
  mode: TTSMode;
  preset: TTSPresetKey;
  baseUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  speed: number;
}

export const TTS_PRESETS: Record<TTSPresetKey, TTSPresetDefinition> = {
  openai: {
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'tts-1',
    models: ['tts-1', 'tts-1-hd'],
    voices: [
      { id: 'alloy', name: 'Alloy (自然通用)', lang: 'multilingual' },
      { id: 'echo', name: 'Echo (沉稳男声)', lang: 'multilingual' },
      { id: 'fable', name: 'Fable (叙事解说)', lang: 'multilingual' },
      { id: 'onyx', name: 'Onyx (磁性男声)', lang: 'multilingual' },
      { id: 'nova', name: 'Nova (知性女声)', lang: 'multilingual' },
      { id: 'shimmer', name: 'Shimmer (明快女声)', lang: 'multilingual' },
    ],
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  siliconflow: {
    name: '硅基流动 (SiliconFlow)',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'FunAudioLLM/CosyVoice2-0.5B',
    models: [
      'FunAudioLLM/CosyVoice2-0.5B',
      'fishaudio/fish-speech-1.5',
      'FunAudioLLM/SenseVoiceSmall',
    ],
    voices: [
      { id: 'alex', name: 'Alex (沉稳解说)', lang: 'zh/en' },
      { id: 'benjamin', name: 'Benjamin (质感男声)', lang: 'zh/en' },
      { id: 'claire', name: 'Claire (知性女声)', lang: 'zh/en' },
      { id: 'david', name: 'David (标准男声)', lang: 'zh/en' },
    ],
    helpUrl: 'https://cloud.siliconflow.cn/account/ak',
  },
  gemini: {
    name: 'Google Gemini (官方)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    models: [
      'gemini-2.0-flash',
      'gemini-2.5-flash-preview-tts',
      'gemini-2.5-pro-preview-tts',
      'gemini-2.0-flash-exp',
    ],
    voices: [
      { id: 'Puck', name: 'Puck (活力自然男声)', lang: 'multilingual' },
      { id: 'Charon', name: 'Charon (沉稳厚重男声)', lang: 'multilingual' },
      { id: 'Kore', name: 'Kore (知性温婉女声)', lang: 'multilingual' },
      { id: 'Fenrir', name: 'Fenrir (清爽磁性男声)', lang: 'multilingual' },
      { id: 'Aoede', name: 'Aoede (典雅叙事女声)', lang: 'multilingual' },
    ],
    helpUrl: 'https://aistudio.google.com/app/apikey',
  },
  custom: {
    name: '自定义兼容接口 (OneAPI / LocalAI / 私有中转)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'tts-1',
    models: ['tts-1', 'tts-1-hd'],
    voices: [
      { id: 'alloy', name: 'Alloy', lang: 'multilingual' },
      { id: 'echo', name: 'Echo', lang: 'multilingual' },
      { id: 'fable', name: 'Fable', lang: 'multilingual' },
      { id: 'onyx', name: 'Onyx', lang: 'multilingual' },
      { id: 'nova', name: 'Nova', lang: 'multilingual' },
      { id: 'shimmer', name: 'Shimmer', lang: 'multilingual' },
    ],
  },
};

const STORAGE_KEY = 'focusflow_tts_settings';

export const DEFAULT_TTS_CONFIG: TTSStoredConfig = {
  mode: 'offline',
  preset: 'openai',
  baseUrl: TTS_PRESETS.openai.baseUrl,
  apiKey: '',
  model: TTS_PRESETS.openai.defaultModel,
  voice: 'alloy',
  speed: 1.0,
};

export function getStoredTTSConfig(): TTSStoredConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_TTS_CONFIG };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TTS_CONFIG };
    const parsed = JSON.parse(raw);
    const config: TTSStoredConfig = {
      ...DEFAULT_TTS_CONFIG,
      ...parsed,
    };

    // 自动清洗与自愈：若保存的模型属于不具备音频合成能力的通用文本 Flash/Lite 模型，自动迁移至有效音频模型
    if (config.preset === 'gemini') {
      const geminiDef = TTS_PRESETS.gemini;
      const isKnownTTS = geminiDef.models.includes(config.model);
      if (!isKnownTTS && (config.model.includes('flash-lite') || (!config.model.includes('tts') && !config.model.includes('2.0-flash')))) {
        config.model = geminiDef.defaultModel;
      }
    }

    return config;
  } catch (e) {
    console.warn('Failed to read TTS config from localStorage:', e);
    return { ...DEFAULT_TTS_CONFIG };
  }
}

export function saveStoredTTSConfig(config: Partial<TTSStoredConfig>): TTSStoredConfig {
  const current = getStoredTTSConfig();
  const next: TTSStoredConfig = {
    ...current,
    ...config,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save TTS config to localStorage:', e);
    }
  }

  return next;
}
