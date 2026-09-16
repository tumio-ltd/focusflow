/**
 * SiliconFlow Multimodal Vision Adapter
 * Calls SiliconFlow OpenAI-compatible API for Qwen2.5-VL and open-source models
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

export interface SiliconFlowVisionOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class SiliconFlowVisionAdapter implements IVisionLLMProvider {
  readonly providerId = 'siliconflow' as const;
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;

  constructor(options: SiliconFlowVisionOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://api.siliconflow.cn/v1').replace(/\/+$/, '');
    this.model = options.model || 'Qwen/Qwen2.5-VL-72B-Instruct';
  }

  async analyzeArchitectureDiagram(req: VisionLLMRequest): Promise<VisionLLMResponse> {
    if (!this.apiKey) {
      throw new Error('SiliconFlow API Key is required for Vision LLM Director');
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
      const msg = err.error?.message || err.message || `SiliconFlow Vision request failed: HTTP ${response.status}`;

      if (response.status === 401) {
        throw new Error(`SiliconFlow API Key 无效或未授权（401 Unauthorized）：${msg}`);
      }
      if (response.status === 429) {
        throw new Error(`SiliconFlow 接口调用超额或超频（429 Rate Limit）：${msg}`);
      }
      if (response.status >= 500) {
        throw new Error(`SiliconFlow 云端服务不可用（${response.status}）：${msg}`);
      }
      throw new Error(`SiliconFlow 视觉解析失败（${response.status}）：${msg}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('SiliconFlow returned empty completion content');
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
