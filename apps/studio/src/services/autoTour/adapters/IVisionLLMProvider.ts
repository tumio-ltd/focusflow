/**
 * Vision LLM Provider Interface
 * 
 * Standard contract for multimodal LLM providers (Gemini, OpenAI, SiliconFlow, Custom)
 * that interpret software architecture diagrams and choreograph FocusFlow tours.
 */

import { type AIProviderId } from '@/services/ai/aiProviderVault';
import { type SanitizedVisionResult } from '../dslSanitizer';

export interface VisionLLMRequest {
  imageMeta: {
    base64DataUrl: string;
    width: number;
    height: number;
  };
  language: 'zh' | 'en';
  temperature?: number;
  maxTokens?: number;
}

export interface VisionLLMResponse {
  result: SanitizedVisionResult;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  rawText?: string;
}

export interface IVisionLLMProvider {
  readonly providerId: AIProviderId;
  readonly model: string;
  readonly baseUrl: string;

  /**
   * Send downsampled architecture diagram image to vision model
   * and receive sanitized FocusFlowDSL scenes and elements.
   */
  analyzeArchitectureDiagram(req: VisionLLMRequest): Promise<VisionLLMResponse>;
}
