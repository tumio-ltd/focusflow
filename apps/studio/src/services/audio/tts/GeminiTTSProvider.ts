/**
 * BYOK (Bring Your Own Key) Google Gemini TTS Provider
 * Directly calls Google Gemini generateContent API with AUDIO response modality
 */

import type { ITTSProvider, TTSVoiceOption, TTSResult } from './ttsProvider';

export interface GeminiTTSOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  name?: string;
  customVoices?: TTSVoiceOption[];
}

export const GEMINI_DEFAULT_VOICES: TTSVoiceOption[] = [
  { id: 'Puck', name: 'Puck (活力自然男声)', lang: 'multilingual' },
  { id: 'Charon', name: 'Charon (沉稳厚重男声)', lang: 'multilingual' },
  { id: 'Kore', name: 'Kore (知性温婉女声)', lang: 'multilingual' },
  { id: 'Fenrir', name: 'Fenrir (清爽磁性男声)', lang: 'multilingual' },
  { id: 'Aoede', name: 'Aoede (典雅叙事女声)', lang: 'multilingual' },
];

/**
 * Encapsulate raw PCM bytes in standard 44-byte WAV container if Gemini returns raw PCM
 */
function wrapPcmWithWavHeader(pcmBytes: Uint8Array, sampleRate = 24000, numChannels = 1): Blob {
  const evenLen = pcmBytes.length - (pcmBytes.length % 2);
  const dataSize = evenLen;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16-bit

  // data chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(
    pcmBytes.length === evenLen ? pcmBytes : pcmBytes.subarray(0, evenLen)
  );
  return new Blob([buffer], { type: 'audio/wav' });
}

export class GeminiTTSProvider implements ITTSProvider {
  readonly name: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private customVoices?: TTSVoiceOption[];

  constructor(options: string | GeminiTTSOptions, model?: string) {
    if (typeof options === 'string') {
      this.apiKey = options;
      this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
      this.model = model || 'gemini-3.1-flash-tts-preview';
      this.name = 'Google Gemini TTS (BYOK)';
    } else {
      this.apiKey = options.apiKey;
      this.baseUrl = (options.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
      this.model = options.model || 'gemini-3.1-flash-tts-preview';
      this.name = options.name || 'Google Gemini TTS (BYOK)';
      this.customVoices = options.customVoices;
    }
  }

  async getVoices(): Promise<TTSVoiceOption[]> {
    if (this.customVoices && this.customVoices.length > 0) {
      return this.customVoices;
    }
    return GEMINI_DEFAULT_VOICES;
  }

  async synthesize(text: string, voiceId = 'Puck', _speed = 1.0): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is required for BYOK mode');
    }

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const endpoint = cleanBaseUrl.includes('/models/')
      ? `${cleanBaseUrl}:generateContent?key=${encodeURIComponent(this.apiKey)}`
      : `${cleanBaseUrl}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || err.message || `Gemini TTS synthesis failed: HTTP ${response.status}`;
      if (response.status === 503 || msg.includes('high demand') || msg.includes('temporarily unavailable')) {
        throw new Error(`Gemini 服务当前负载过高（503 High Demand）：${msg}`);
      }
      if (response.status === 429 || msg.includes('quota') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(`Gemini API 额度不足或请求超频（429 Quota Exceeded）：${msg}`);
      }
      if (response.status === 400 || response.status === 401 || msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
        throw new Error(`Gemini API 密钥无效或未开启权限（${response.status}）：${msg}`);
      }
      throw new Error(`Gemini 语音生成失败（HTTP ${response.status}）：${msg}`);
    }

    const result = await response.json();
    const candidate = result?.candidates?.[0];
    const inlineData = candidate?.content?.parts?.[0]?.inlineData;

    if (!inlineData || !inlineData.data) {
      const textPart = candidate?.content?.parts?.find((p: any) => Boolean(p.text))?.text;
      if (textPart) {
        throw new Error(
          `所选模型「${this.model}」不支持语音合成 (TTS)，仅返回了文本内容。请在配音设置中选用专门支持音频的模型（如 gemini-2.0-flash 或 gemini-2.5-flash-preview-tts）。`
        );
      }
      const finishReason = candidate?.finishReason;
      const blockReason = result?.promptFeedback?.blockReason;
      throw new Error(
        `Gemini 未返回有效音频数据（${blockReason || finishReason || '请检查模型是否支持音频模态输出'}）`
      );
    }

    const base64Data = inlineData.data;
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const mimeType = inlineData.mimeType || '';

    // Check if audio already has a valid RIFF WAV header (starts with RIFF....WAVE)
    const hasRiffHeader =
      len >= 12 &&
      bytes[0] === 0x52 && // 'R'
      bytes[1] === 0x49 && // 'I'
      bytes[2] === 0x46 && // 'F'
      bytes[3] === 0x46 && // 'F'
      bytes[8] === 0x57 && // 'W'
      bytes[9] === 0x41 && // 'A'
      bytes[10] === 0x56 && // 'V'
      bytes[11] === 0x45; // 'E'

    const isMp3 =
      (len >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // 'ID3'
      (len >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);

    const isOgg =
      len >= 4 &&
      bytes[0] === 0x4f && // 'O'
      bytes[1] === 0x67 && // 'g'
      bytes[2] === 0x67 && // 'g'
      bytes[3] === 0x53; // 'S'

    let effectiveSampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      effectiveSampleRate = parseInt(rateMatch[1], 10);
    }

    let audioBlob: Blob;
    let durationMs = 2000;

    if (hasRiffHeader) {
      audioBlob = new Blob([bytes], { type: 'audio/wav' });
    } else if (isMp3) {
      audioBlob = new Blob([bytes], { type: 'audio/mp3' });
    } else if (isOgg) {
      audioBlob = new Blob([bytes], { type: 'audio/ogg' });
    } else {
      // It is raw PCM! Gemini returns raw 24kHz 16-bit mono PCM (often labeled as audio/x-wav, audio/wav, or audio/pcm)
      // We MUST wrap it with standard RIFF WAV header for browser <audio> and AudioContext to decode/play it cleanly!
      audioBlob = wrapPcmWithWavHeader(bytes, effectiveSampleRate, 1);
      durationMs = Math.round((bytes.length / (effectiveSampleRate * 2)) * 1000);
    }

    // Measure exact physical audio duration via AudioContext if container was already provided
    if (hasRiffHeader || isMp3 || isOgg) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        try {
          const arrayBuffer = await audioBlob.slice(0).arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          durationMs = Math.round(decoded.duration * 1000);
        } finally {
          ctx.close().catch(() => {});
        }
      } catch {
        durationMs = Math.max(1000, Math.round((text.length / 4) * 1000));
      }
    }

    return {
      audioBlob,
      durationMs,
    };
  }
}
