/**
 * Vision Adapter Factory
 * Instantiates the appropriate IVisionLLMProvider based on active credentials
 */

import { type AIProviderId } from '@/services/ai/aiProviderVault';
import {
  getEffectiveVisionCredentials,
  type EffectiveVisionCredentials,
} from '../visionLLMConfigStore';
import { type IVisionLLMProvider } from './IVisionLLMProvider';
import { GeminiVisionAdapter } from './GeminiVisionAdapter';
import { OpenAIVisionAdapter } from './OpenAIVisionAdapter';
import { SiliconFlowVisionAdapter } from './SiliconFlowVisionAdapter';
import { CustomVisionAdapter } from './CustomVisionAdapter';

export function createVisionAdapter(
  override?: Partial<EffectiveVisionCredentials>
): IVisionLLMProvider {
  const creds = { ...getEffectiveVisionCredentials(), ...override };

  switch (creds.provider) {
    case 'gemini':
      return new GeminiVisionAdapter({
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: creds.model,
      });
    case 'openai':
      return new OpenAIVisionAdapter({
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: creds.model,
      });
    case 'siliconflow':
      return new SiliconFlowVisionAdapter({
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: creds.model,
      });
    case 'custom':
    default:
      return new CustomVisionAdapter({
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: creds.model,
      });
  }
}
