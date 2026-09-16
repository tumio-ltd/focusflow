/**
 * Google Gemini Multimodal Vision LLM Adapter
 * Directly calls Google Gemini generateContent API with inlineData image payload
 */

import {
  type IVisionLLMProvider,
  type VisionLLMRequest,
  type VisionLLMResponse,
} from './IVisionLLMProvider';
import {
  buildVisionDirectorSystemPrompt,
  buildVisionUserPrompt,
} from '../visionPromptTemplates';
import { sanitizeVisionLLMOutput } from '../dslSanitizer';

export interface GeminiVisionOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class GeminiVisionAdapter implements IVisionLLMProvider {
  readonly providerId = 'gemini' as const;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;

  constructor(options: GeminiVisionOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
    this.model = options.model || 'gemini-3.8-flash';
  }

  async analyzeArchitectureDiagram(req: VisionLLMRequest): Promise<VisionLLMResponse> {
    if (!this.apiKey) {
      throw new Error('Google Gemini API Key is required for Vision LLM Director');
    }

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const endpoint = cleanBaseUrl.includes('/models/')
      ? `${cleanBaseUrl}:generateContent?key=${encodeURIComponent(this.apiKey)}`
      : `${cleanBaseUrl}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const systemPrompt = buildVisionDirectorSystemPrompt({
      viewportWidth: req.imageMeta.width,
      viewportHeight: req.imageMeta.height,
      language: req.language,
    });
    const userPrompt = buildVisionUserPrompt(req.language);

    // Extract raw base64 data and mime type from data URL
    let mimeType = 'image/jpeg';
    let base64Data = req.imageMeta.base64DataUrl;
    const match = req.imageMeta.base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const bodyPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nTask:\n${userPrompt}`,
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: req.temperature ?? 0.2,
        maxOutputTokens: req.maxTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || err.message || `Gemini Vision request failed: HTTP ${response.status}`;

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw new Error(`Gemini API Key 无效或未开启多模态权限（${response.status}）：${msg}`);
      }
      if (response.status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(`Gemini API 额度耗尽或调用超频（429 Quota Exceeded）：${msg}`);
      }
      if (response.status === 503 || msg.includes('high demand') || msg.includes('temporarily unavailable')) {
        throw new Error(`Gemini 云端服务当前高负载（503 High Demand）：${msg}`);
      }
      throw new Error(`Gemini 视觉解析失败（${response.status}）：${msg}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;

    if (!rawText) {
      const finishReason = candidate?.finishReason;
      throw new Error(`Gemini returned empty text (finishReason: ${finishReason || 'UNKNOWN'})`);
    }

    const sanitizedResult = sanitizeVisionLLMOutput(
      rawText,
      req.imageMeta.width,
      req.imageMeta.height,
      req.language
    );

    return {
      result: sanitizedResult,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
      rawText,
    };
  }
}
