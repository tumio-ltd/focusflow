/**
 * BYOK (Bring Your Own Key) OpenAI TTS Provider
 * Directly calls official OpenAI Audio Speech API using the user's private key
 */

import type { ITTSProvider, TTSVoiceOption, TTSResult } from './ttsProvider';

export interface UserKeyOpenAITTSOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  name?: string;
  customVoices?: TTSVoiceOption[];
}

export class UserKeyOpenAITTSProvider implements ITTSProvider {
  readonly name: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private customVoices?: TTSVoiceOption[];

  constructor(options: string | UserKeyOpenAITTSOptions, model?: string) {
    if (typeof options === 'string') {
      this.apiKey = options;
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = model || 'tts-1';
      this.name = 'OpenAI TTS (BYOK)';
    } else {
      this.apiKey = options.apiKey;
      this.baseUrl = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      this.model = options.model || 'tts-1';
      this.name = options.name || 'Cloud TTS (BYOK)';
      this.customVoices = options.customVoices;
    }
  }

  async getVoices(): Promise<TTSVoiceOption[]> {
    if (this.customVoices && this.customVoices.length > 0) {
      return this.customVoices;
    }
    return [
      { id: 'alloy', name: 'Alloy (自然通用)', lang: 'multilingual' },
      { id: 'echo', name: 'Echo (沉稳男声)', lang: 'multilingual' },
      { id: 'fable', name: 'Fable (叙事解说)', lang: 'multilingual' },
      { id: 'onyx', name: 'Onyx (磁性男声)', lang: 'multilingual' },
      { id: 'nova', name: 'Nova (知性女声)', lang: 'multilingual' },
      { id: 'shimmer', name: 'Shimmer (明快女声)', lang: 'multilingual' },
    ];
  }

  async synthesize(text: string, voiceId = 'alloy', speed = 1.0): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('TTS API Key is required for BYOK mode');
    }

    const endpoint = this.baseUrl.endsWith('/audio/speech')
      ? this.baseUrl
      : `${this.baseUrl}/audio/speech`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        voice: voiceId,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI TTS synthesis failed: HTTP ${response.status}`);
    }

    const audioBlob = await response.blob();

    // Measure exact physical audio duration via AudioContext
    let durationMs = 2000;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const arrayBuffer = await audioBlob.slice(0).arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      durationMs = Math.round(decoded.duration * 1000);
      ctx.close().catch(() => {});
    } catch {
      // Estimate fallback
      durationMs = Math.max(1000, Math.round((text.length / 4) * 1000));
    }

    return {
      audioBlob,
      durationMs,
    };
  }
}
