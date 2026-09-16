/**
 * Vision LLM Configuration Store and Presets
 * Manages configuration for Mode 2 (Multimodal Vision LLM Auto-Director).
 * Decoupled from TTS models while sharing provider credentials via aiProviderVault.
 */

import {
  type AIProviderId,
  getProviderCredentials,
  setProviderCredentials,
  PROVIDER_DEFAULT_BASE_URLS,
} from '@/services/ai/aiProviderVault';
import modelCatalog from './modelCatalog.generated.json' with { type: 'json' };

export interface VisionModelItem {
  id: string;
  label: string;
  tag?: string;
  description?: string;
  descriptionEn?: string;
}

export interface VisionPresetDefinition {
  name: string;
  nameEn?: string;
  defaultModel: string;
  models: VisionModelItem[];
  officialDocUrl: string;
  apiKeyDashboardUrl: string;
}

export const VISION_PRESETS: Record<AIProviderId, VisionPresetDefinition> = {
  gemini: {
    name: 'Google Gemini (官方多模态)',
    nameEn: 'Google Gemini (Official Multimodal)',
    defaultModel: modelCatalog.providers.gemini?.defaultVisionModel || 'gemini-3.8-flash',
    models: ((modelCatalog.providers.gemini?.visionModels as VisionModelItem[]) || []).slice(0, 5),
    officialDocUrl: modelCatalog.providers.gemini?.officialDocUrl || 'https://ai.google.dev/gemini-api/docs/latest-model',
    apiKeyDashboardUrl: 'https://aistudio.google.com/app/apikey',
  },
  openai: {
    name: 'OpenAI 官方 (GPT-4o 旗舰视觉)',
    nameEn: 'OpenAI (GPT-4o Flagship Vision)',
    defaultModel: modelCatalog.providers.openai?.defaultVisionModel || 'gpt-4o',
    models: ((modelCatalog.providers.openai?.visionModels as VisionModelItem[]) || []).slice(0, 5),
    officialDocUrl: modelCatalog.providers.openai?.officialDocUrl || 'https://platform.openai.com/docs/models',
    apiKeyDashboardUrl: 'https://platform.openai.com/api-keys',
  },
  siliconflow: {
    name: '硅基流动 (SiliconFlow / Qwen2.5-VL)',
    nameEn: 'SiliconFlow (Qwen2.5-VL)',
    defaultModel: modelCatalog.providers.siliconflow?.defaultVisionModel || 'Qwen/Qwen2.5-VL-72B-Instruct',
    models: ((modelCatalog.providers.siliconflow?.visionModels as VisionModelItem[]) || []).slice(0, 5),
    officialDocUrl: modelCatalog.providers.siliconflow?.officialDocUrl || 'https://cloud.siliconflow.cn/models',
    apiKeyDashboardUrl: 'https://cloud.siliconflow.cn/account/ak',
  },
  custom: {
    name: '自定义兼容端点 (Claude / OneAPI / 私有网关)',
    nameEn: 'Custom / Proxy (Claude / OneAPI / Private Gateway)',
    defaultModel: modelCatalog.providers.custom?.defaultVisionModel || 'gpt-4o',
    models: ((modelCatalog.providers.custom?.visionModels as VisionModelItem[]) || []).slice(0, 5),
    officialDocUrl: modelCatalog.providers.custom?.officialDocUrl || 'https://docs.anthropic.com/en/docs/models-overview',
    apiKeyDashboardUrl: '',
  },
};

export interface VisionLLMStoredConfig {
  provider: AIProviderId;
  inheritKeyFromVault: boolean;
  customApiKey?: string;
  customBaseUrl?: string;
  model: string;
  isCustomModel?: boolean;
  temperature: number;
  maxTokens: number;
}

const STORAGE_KEY = 'focusflow_vision_llm_settings';

export const DEFAULT_VISION_CONFIG: VisionLLMStoredConfig = {
  provider: 'gemini',
  inheritKeyFromVault: true,
  model: VISION_PRESETS.gemini.defaultModel,
  isCustomModel: false,
  temperature: 0.2,
  maxTokens: 4096,
};

let memoryVisionConfig: VisionLLMStoredConfig = { ...DEFAULT_VISION_CONFIG };

/**
 * Retrieve saved Vision LLM configuration from localStorage or memory store.
 */
export function getStoredVisionConfig(): VisionLLMStoredConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...memoryVisionConfig };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISION_CONFIG };
    const parsed = JSON.parse(raw);
    const config: VisionLLMStoredConfig = {
      ...DEFAULT_VISION_CONFIG,
      ...parsed,
    };

    // Ensure model validity
    if (!config.isCustomModel) {
      const presetDef = VISION_PRESETS[config.provider] || VISION_PRESETS.gemini;
      const isKnown = presetDef.models.some((m) => m.id === config.model);
      if (!isKnown) {
        config.model = presetDef.defaultModel;
      }
    }

    return config;
  } catch (e) {
    console.warn('Failed to read Vision LLM config from localStorage:', e);
    return { ...DEFAULT_VISION_CONFIG };
  }
}

/**
 * Save Vision LLM configuration to localStorage or memory store.
 * If inheritKeyFromVault is true and apiKey or baseUrl was updated, syncs to aiProviderVault.
 */
export function saveStoredVisionConfig(
  config: Partial<VisionLLMStoredConfig> & { apiKey?: string; baseUrl?: string }
): VisionLLMStoredConfig {
  const current = getStoredVisionConfig();
  const next: VisionLLMStoredConfig = {
    ...current,
    ...config,
  };

  // If user updated apiKey or baseUrl
  if (config.apiKey !== undefined || config.baseUrl !== undefined) {
    if (next.inheritKeyFromVault) {
      setProviderCredentials(next.provider, {
        ...(config.apiKey !== undefined ? { apiKey: config.apiKey } : {}),
        ...(config.baseUrl !== undefined ? { baseUrl: config.baseUrl } : {}),
      });
      // Clear specific override if inheriting
      delete next.customApiKey;
      delete next.customBaseUrl;
    } else {
      if (config.apiKey !== undefined) next.customApiKey = config.apiKey.trim();
      if (config.baseUrl !== undefined) next.customBaseUrl = config.baseUrl.trim();
    }
  }

  memoryVisionConfig = { ...next };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save Vision LLM config to localStorage:', e);
    }
  }

  return next;
}

export interface EffectiveVisionCredentials {
  provider: AIProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  isInherited: boolean;
  isKeyReady: boolean;
}

/**
 * Resolves the effective API key, base URL, and model for runtime calls.
 */
export function getEffectiveVisionCredentials(): EffectiveVisionCredentials {
  const config = getStoredVisionConfig();
  const vaultCreds = getProviderCredentials(config.provider);

  let apiKey = '';
  let baseUrl = '';
  let isInherited = config.inheritKeyFromVault;

  if (config.inheritKeyFromVault) {
    apiKey = vaultCreds.apiKey;
    baseUrl = vaultCreds.baseUrl || PROVIDER_DEFAULT_BASE_URLS[config.provider];
  } else {
    apiKey = (config.customApiKey || '').trim();
    baseUrl = (config.customBaseUrl || '').trim() || PROVIDER_DEFAULT_BASE_URLS[config.provider];
  }

  return {
    provider: config.provider,
    apiKey,
    baseUrl,
    model: config.model,
    isInherited,
    isKeyReady: Boolean(apiKey && apiKey.trim().length > 0),
  };
}
