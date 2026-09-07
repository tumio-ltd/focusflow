/**
 * Offline Web Speech & Audio Synthesizer Provider
 * 100% offline, zero-token cost, runs in any modern browser
 */

import type { ITTSProvider, TTSVoiceOption, TTSResult } from './ttsProvider';
import { createMockAudioBlob } from '../audioDecoder';

export class WebSpeechTTSProvider implements ITTSProvider {
  readonly name = 'Browser Local (Web Speech)';

  async getVoices(): Promise<TTSVoiceOption[]> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [
        { id: 'zh-local', name: '标准中文旁白 (离线)', lang: 'zh-CN' },
        { id: 'en-local', name: 'Standard English (Offline)', lang: 'en-US' },
      ];
    }

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v) => ({
            id: v.voiceURI || v.name,
            name: `${v.name} (${v.lang})`,
            lang: v.lang,
          }))
        );
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(
          voices.map((v) => ({
            id: v.voiceURI || v.name,
            name: `${v.name} (${v.lang})`,
            lang: v.lang,
          }))
        );
      };

      // Fallback timeout if voiceschanged doesn't fire
      setTimeout(() => {
        resolve([
          { id: 'zh-local', name: '标准中文旁白 (离线)', lang: 'zh-CN' },
          { id: 'en-local', name: 'Standard English (Offline)', lang: 'en-US' },
        ]);
      }, 500);
    });
  }

  async synthesize(text: string, _voiceId?: string, speed = 1.0): Promise<TTSResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        audioBlob: createMockAudioBlob(0.5, 440),
        durationMs: 500,
      };
    }

    // Estimate speaking rate:
    // Chinese characters: ~3.8 chars per second at 1.0x speed
    // English words: ~2.8 words per second at 1.0x speed
    const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    let estimatedSeconds: number;
    if (isChinese) {
      const charCount = trimmed.replace(/\s+/g, '').length;
      estimatedSeconds = Math.max(1.2, (charCount / 3.8) / speed);
    } else {
      const words = trimmed.split(/\s+/).filter(Boolean).length;
      estimatedSeconds = Math.max(1.2, (words / 2.8) / speed);
    }

    // Add natural pause buffer (250ms)
    const durationMs = Math.round((estimatedSeconds + 0.25) * 1000);

    // Generate clean silent WAV audio for accurate duration & waveform timeline alignment
    // (Eliminates harsh 320Hz drone; real voice is played via browser speechSynthesis)
    const audioBlob = createMockAudioBlob(estimatedSeconds + 0.25, 0, 44100, 0);

    return {
      audioBlob,
      durationMs,
    };
  }
}

/**
 * Trigger real browser speech synthesis (Web Speech API)
 * Plays audible spoken words using system voices (e.g. Ting-Ting on Mac, Xiaoxiao on Edge)
 */
export function speakWebSpeech(text: string, speed = 1.0, lang?: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  // Cancel ongoing speech to avoid overlapping
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.rate = Math.max(0.5, Math.min(2.0, speed));

  const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
  utterance.lang = lang || (isChinese ? 'zh-CN' : 'en-US');

  // Try to find matching voice
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    const targetVoice = voices.find((v) => v.lang.startsWith(utterance.lang) || v.lang === utterance.lang);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}
