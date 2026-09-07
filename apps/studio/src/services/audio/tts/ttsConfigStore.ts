/**
 * TTS Configuration Store and Presets
 * Supports Offline Web Speech, Official OpenAI, SiliconFlow, and custom OpenAI-compatible endpoints.
 * Automatically persists settings in localStorage.
 */

export type TTSMode = 'offline' | 'cloud';

export type TTSPresetKey = 'openai' | 'siliconflow' | 'custom';

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
    return {
      ...DEFAULT_TTS_CONFIG,
      ...parsed,
    };
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
