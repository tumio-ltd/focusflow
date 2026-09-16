/**
 * Custom / OpenAI-Compatible Vision Adapter
 * Supports custom proxies, OneAPI, LocalAI, OpenRouter, and enterprise gateways
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

export interface CustomVisionOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class CustomVisionAdapter implements IVisionLLMProvider {
  readonly providerId = 'custom' as const;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;

  constructor(options: CustomVisionOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.model = options.model || 'gpt-4o';
  }

  async analyzeArchitectureDiagram(req: VisionLLMRequest): Promise<VisionLLMResponse> {
    if (!this.apiKey) {
      throw new Error('API Key is required for Custom Vision Gateway');
    }

    const endpoint = this.baseUrl.endsWith('/chat/completions')
      ? this.baseUrl
      : `${this.baseUrl}/chat/completions`;

    const systemPrompt = buildVisionDirectorSystemPrompt({
      viewportWidth: req.imageMeta.width,
      viewportHeight: req.imageMeta.height,
      language: req.language,
    });
    const userPrompt = buildVisionUserPrompt(req.language);

    const bodyPayload: Record<string, any> = {
      model: this.model,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 4096,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: req.imageMeta.base64DataUrl,
              },
            },
          ],
        },
      ],
    };

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || err.message || `Custom Vision request failed: HTTP ${response.status}`;
      throw new Error(`自定义网关视觉解析失败（${response.status}）：${msg}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('Custom Gateway returned empty completion content');
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
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
      rawText,
    };
  }
}
