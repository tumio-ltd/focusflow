/**
 * Unified AI Provider Credentials Vault
 * Manages shared API keys and base URLs across TTS and Vision LLM.
 * 
 * Zero-Trust & Local-Only Security Model:
 * 1. Stored exclusively in browser localStorage ('focusflow_ai_providers_vault').
 * 2. Never transmitted to any FocusFlow backend or external third-party server.
 * 3. All API calls are executed directly from browser to the official provider endpoint via HTTPS.
 * 4. Supports one-click purge to permanently erase credentials from the local device.
 */

export type AIProviderId = 'openai' | 'gemini' | 'siliconflow' | 'custom';

export interface AIProviderCredentials {
  apiKey: string;
  baseUrl: string;
  updatedAt: number;
}

export type AIProviderVault = Record<AIProviderId, AIProviderCredentials>;

export const VAULT_STORAGE_KEY = 'focusflow_ai_providers_vault';

export const PROVIDER_DEFAULT_BASE_URLS: Record<AIProviderId, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  siliconflow: 'https://api.siliconflow.cn/v1',
  custom: 'https://api.openai.com/v1',
};

const DEFAULT_VAULT: AIProviderVault = {
  openai: { apiKey: '', baseUrl: PROVIDER_DEFAULT_BASE_URLS.openai, updatedAt: 0 },
  gemini: { apiKey: '', baseUrl: PROVIDER_DEFAULT_BASE_URLS.gemini, updatedAt: 0 },
  siliconflow: { apiKey: '', baseUrl: PROVIDER_DEFAULT_BASE_URLS.siliconflow, updatedAt: 0 },
  custom: { apiKey: '', baseUrl: PROVIDER_DEFAULT_BASE_URLS.custom, updatedAt: 0 },
};

// Event emitter for cross-component reactivity within the same window
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in aiProviderVault listener:', e);
    }
  });
}

/**
 * Perform smooth migration from legacy TTS settings ('focusflow_tts_settings')
 * if vault is empty or missing key for that provider.
 */
function migrateFromLegacyTTSConfig(vault: AIProviderVault): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const rawTTS = localStorage.getItem('focusflow_tts_settings');
    if (!rawTTS) return false;

    const parsedTTS = JSON.parse(rawTTS);
    if (!parsedTTS || !parsedTTS.preset || !parsedTTS.apiKey) return false;

    const provider = parsedTTS.preset as AIProviderId;
    if (vault[provider] && !vault[provider].apiKey.trim()) {
      vault[provider] = {
        apiKey: parsedTTS.apiKey.trim(),
        baseUrl: parsedTTS.baseUrl || PROVIDER_DEFAULT_BASE_URLS[provider],
        updatedAt: Date.now(),
      };
      return true;
    }
  } catch (e) {
    console.warn('Failed to migrate legacy TTS config to AI vault:', e);
  }

  return false;
}

let memoryVault: AIProviderVault = {
  openai: { ...DEFAULT_VAULT.openai },
  gemini: { ...DEFAULT_VAULT.gemini },
  siliconflow: { ...DEFAULT_VAULT.siliconflow },
  custom: { ...DEFAULT_VAULT.custom },
};

/**
 * Retrieve all provider credentials from localStorage or memory store.
 */
export function getAllProviderCredentials(): AIProviderVault {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...memoryVault };
  }

  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    let vault: AIProviderVault = { ...DEFAULT_VAULT };

    if (raw) {
      const parsed = JSON.parse(raw);
      vault = {
        openai: { ...DEFAULT_VAULT.openai, ...(parsed.openai || {}) },
        gemini: { ...DEFAULT_VAULT.gemini, ...(parsed.gemini || {}) },
        siliconflow: { ...DEFAULT_VAULT.siliconflow, ...(parsed.siliconflow || {}) },
        custom: { ...DEFAULT_VAULT.custom, ...(parsed.custom || {}) },
      };
    }

    const migrated = migrateFromLegacyTTSConfig(vault);
    if (migrated || !raw) {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    }

    return vault;
  } catch (e) {
    console.warn('Failed to read AI provider vault from localStorage:', e);
    return { ...DEFAULT_VAULT };
  }
}

/**
 * Get credentials for a single provider.
 */
export function getProviderCredentials(provider: AIProviderId): AIProviderCredentials {
  const vault = getAllProviderCredentials();
  return vault[provider] || {
    apiKey: '',
    baseUrl: PROVIDER_DEFAULT_BASE_URLS[provider] || 'https://api.openai.com/v1',
    updatedAt: 0,
  };
}

/**
 * Save or update credentials for a specific provider.
 */
export function setProviderCredentials(
  provider: AIProviderId,
  creds: Partial<AIProviderCredentials>
): AIProviderCredentials {
  const vault = getAllProviderCredentials();
  const current = vault[provider] || {
    apiKey: '',
    baseUrl: PROVIDER_DEFAULT_BASE_URLS[provider],
    updatedAt: 0,
  };

  const updated: AIProviderCredentials = {
    apiKey: creds.apiKey !== undefined ? creds.apiKey.trim() : current.apiKey,
    baseUrl: creds.baseUrl !== undefined ? creds.baseUrl.trim() : current.baseUrl,
    updatedAt: Date.now(),
  };

  vault[provider] = updated;
  memoryVault[provider] = { ...updated };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    } catch (e) {
      console.warn('Failed to save AI provider vault to localStorage:', e);
    }
  }

  notifyListeners();
  return updated;
}

/**
 * One-click local purge: permanently erase all API keys and custom URLs from localStorage.
 */
export function purgeAllCredentials(): void {
  memoryVault = {
    openai: { ...DEFAULT_VAULT.openai },
    gemini: { ...DEFAULT_VAULT.gemini },
    siliconflow: { ...DEFAULT_VAULT.siliconflow },
    custom: { ...DEFAULT_VAULT.custom },
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to purge AI provider vault:', e);
    }
  }
  notifyListeners();
}

/**
 * Subscribe to vault credential updates across components.
 */
export function subscribeToVault(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
