/**
 * BYOK (Bring Your Own Key) OpenAI TTS Provider
 * Directly calls official OpenAI Audio Speech API using the user's private key
 */

import type { ITTSProvider, TTSVoiceOption, TTSResult } from './ttsProvider';

export class UserKeyOpenAITTSProvider implements ITTSProvider {
  readonly name = 'OpenAI TTS (BYOK)';

  constructor(
    private apiKey: string,
    private model: 'tts-1' | 'tts-1-hd' = 'tts-1'
  ) {}

  async getVoices(): Promise<TTSVoiceOption[]> {
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
      throw new Error('OpenAI API Key is required for BYOK mode');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
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
