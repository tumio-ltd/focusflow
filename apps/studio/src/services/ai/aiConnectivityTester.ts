/**
 * Lightweight AI Provider Connectivity & Ping Tester
 * Tests API credentials with 0 or minimal tokens (<5 tokens) within 1-2 seconds.
 * Provides granular latency reporting and human-readable diagnostic error messages.
 */

import { type AIProviderId } from '@/services/ai/aiProviderVault';

export interface ConnectivityTestResult {
  ok: boolean;
  latencyMs: number;
  message?: string;
  error?: string;
}

export interface ConnectivityTestOptions {
  provider: AIProviderId;
  apiKey: string;
  baseUrl: string;
  model?: string;
}

export async function testAIProviderConnection(
  options: ConnectivityTestOptions
): Promise<ConnectivityTestResult> {
  const { provider, apiKey, baseUrl, model } = options;

  if (!apiKey || !apiKey.trim()) {
    return {
      ok: false,
      latencyMs: 0,
      error: 'API Key is empty / 未配置 API Key',
    };
  }

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;

    if (provider === 'gemini') {
      // Gemini native REST model check: 0 tokens, ultra-fast
      const endpoint = `${cleanBase}/models?key=${encodeURIComponent(apiKey.trim())}`;
      res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } else {
      // OpenAI / SiliconFlow / Custom OpenAI-compatible: GET /models (0 tokens)
      const endpoint = cleanBase.endsWith('/models') ? cleanBase : `${cleanBase}/models`;
      res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      // If /models returns 404 or 405 on some strict proxies, fall back to lightweight completion check
      if (res.status === 404 || res.status === 405) {
        const chatEndpoint = cleanBase.endsWith('/chat/completions')
          ? cleanBase
          : `${cleanBase}/chat/completions`;
        res = await fetch(chatEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
          signal: controller.signal,
        });
      }
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      return {
        ok: true,
        latencyMs,
        message: `Connected successfully (${latencyMs}ms)`,
      };
    }

    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson?.error?.message) {
        errorDetail = errorJson.error.message;
      } else if (errorJson?.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // Body is not JSON
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        latencyMs,
        error: `401 Unauthorized: Invalid API Key or insufficient permissions (${errorDetail})`,
      };
    }

    if (res.status === 429) {
      return {
        ok: false,
        latencyMs,
        error: `429 Too Many Requests: Rate limit or quota exceeded (${errorDetail})`,
      };
    }

    return {
      ok: false,
      latencyMs,
      error: `Connection failed: ${errorDetail}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    if (err.name === 'AbortError') {
      return {
        ok: false,
        latencyMs,
        error: 'Connection timed out (>10s). Check your BaseURL or network proxy.',
      };
    }

    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return {
        ok: false,
        latencyMs,
        error: 'Network / CORS Error: Unable to reach the API endpoint. Check BaseURL or browser network proxy.',
      };
    }

    return {
      ok: false,
      latencyMs,
      error: `Network error: ${msg}`,
    };
  }
}
