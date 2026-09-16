/**
 * OpenAI Multimodal Vision LLM Adapter
 * Directly calls official OpenAI Chat Completions API with image_url payload
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

export interface OpenAIVisionOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAIVisionAdapter implements IVisionLLMProvider {
  readonly providerId = 'openai' as const;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;

  constructor(options: OpenAIVisionOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.model = options.model || 'gpt-4o';
  }

  async analyzeArchitectureDiagram(req: VisionLLMRequest): Promise<VisionLLMResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is required for Vision LLM Director');
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

    const bodyPayload = {
      model: this.model,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
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
                detail: 'high',
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

    // If 400 Bad Request happens because response_format is not supported by custom proxy, retry once without it
    if (!response.ok && response.status === 400) {
      const errClone = await response.clone().json().catch(() => ({}));
      const errMsg = errClone?.error?.message || '';
      if (errMsg.includes('response_format') || errMsg.includes('json_object')) {
        const fallbackPayload = { ...bodyPayload };
        delete (fallbackPayload as any).response_format;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(fallbackPayload),
        });
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || err.message || `OpenAI Vision request failed: HTTP ${response.status}`;

      if (response.status === 401) {
        throw new Error(`OpenAI API Key 无效或未授权（401 Unauthorized）：${msg}`);
      }
      if (response.status === 429) {
        throw new Error(`OpenAI 接口调用超额或超频（429 Rate Limit / Quota Exceeded）：${msg}`);
      }
      if (response.status === 413) {
        throw new Error(`图像 Payload 过大被拦截（413 Payload Too Large）：${msg}`);
      }
      if (response.status >= 500) {
        throw new Error(`OpenAI 云端服务暂时不可用（${response.status}）：${msg}`);
      }
      throw new Error(`OpenAI 视觉解析失败（${response.status}）：${msg}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('OpenAI returned an empty completion content');
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
