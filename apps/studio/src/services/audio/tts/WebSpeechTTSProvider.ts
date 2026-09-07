/**
 * Offline Web Speech & Audio Synthesizer Provider
 * 100% offline, zero-token cost, runs in any modern browser
 */

import type { ITTSProvider, TTSVoiceOption, TTSResult } from './ttsProvider';
import { createMockAudioBlob } from '../audioDecoder';

// Complete blacklist of vintage 1984 robotic, novelty, and toy voices across macOS and Windows
export const VINTAGE_NOVELTY_VOICE_REGEX =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|eddy|flo|fred|good news|grandma|grandpa|hysterical|jester|junior|kathy|organ|pipe organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox)\b/i;

// Preferred natural broadcast voices for English:
// Samantha (macOS flagship natural female), Alex (macOS flagship natural male), Jenny, Guy, Aria, Google US/UK English
export const ENGLISH_BROADCAST_VOICE_REGEX =
  /\b(samantha|alex|jenny|guy|aria|google\s*(us|uk)?\s*english|natural|premium)\b/i;

// Preferred natural broadcast voices for Chinese (Mandarin):
// Ting-Ting / Tingting (macOS official Mandarin female), Xiaoxiao (Edge flagship), Yunxi, Yunjian, Google 普通话
export const CHINESE_BROADCAST_VOICE_REGEX =
  /(ting[- ]?ting|xiaoxiao|yunxi|yunjian|google\s*普通话|natural|premium)/i;

export class WebSpeechTTSProvider implements ITTSProvider {
  readonly name = 'Browser Local (Web Speech)';

  async getVoices(): Promise<TTSVoiceOption[]> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return [
        { id: 'zh-local', name: '标准中文旁白 (离线 - 婷婷/晓晓)', lang: 'zh-CN' },
        { id: 'en-local', name: 'Standard English (Offline - Samantha/Alex)', lang: 'en-US' },
      ];
    }

    const mapAndFilterVoices = (rawVoices: SpeechSynthesisVoice[]) => {
      // 过滤掉怪异、拉长发音、复古机器人的玩具音色 (如 Albert, Eddy, Fred, Grandma, Zarvox 等)
      const cleanVoices = rawVoices.filter((v) => !VINTAGE_NOVELTY_VOICE_REGEX.test(v.name));
      const targetList = cleanVoices.length > 0 ? cleanVoices : rawVoices;

      // 优先将现代母带播音员 (Samantha, Alex, Tingting, Xiaoxiao 等) 置顶
      const sorted = [...targetList].sort((a, b) => {
        const aIsBroadcast = ENGLISH_BROADCAST_VOICE_REGEX.test(a.name) || CHINESE_BROADCAST_VOICE_REGEX.test(a.name);
        const bIsBroadcast = ENGLISH_BROADCAST_VOICE_REGEX.test(b.name) || CHINESE_BROADCAST_VOICE_REGEX.test(b.name);
        if (aIsBroadcast && !bIsBroadcast) return -1;
        if (!aIsBroadcast && bIsBroadcast) return 1;
        return 0;
      });

      return sorted.map((v) => ({
        id: v.voiceURI || v.name,
        name: `${v.name} (${v.lang})`,
        lang: v.lang,
      }));
    };

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(mapAndFilterVoices(voices));
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(mapAndFilterVoices(voices));
      };

      // Fallback timeout if voiceschanged doesn't fire
      setTimeout(() => {
        resolve([
          { id: 'zh-local', name: '标准中文旁白 (离线 - 婷婷/晓晓)', lang: 'zh-CN' },
          { id: 'en-local', name: 'Standard English (Offline - Samantha/Alex)', lang: 'en-US' },
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
    // Chinese characters: ~4.0 chars per second at 1.0x speed
    // English words: ~2.8 words per second at 1.0x speed
    const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    let estimatedSeconds: number;
    if (isChinese) {
      const charCount = trimmed.replace(/\s+/g, '').length;
      estimatedSeconds = Math.max(1.2, (charCount / 4.0) / speed);
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

// Retain active utterances in memory to protect against Chromium / WebKit premature GC collection
const activeUtterances = new Set<SpeechSynthesisUtterance>();
let pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Trigger real browser speech synthesis (Web Speech API)
 * Automatically sniffs text language (English vs Chinese) and routes to flagship natural voices (Samantha / Tingting)
 */
export function speakWebSpeech(
  text: string,
  speed = 1.0,
  lang?: string,
  voiceId?: string,
  onEnded?: () => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnded?.();
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    onEnded?.();
    return;
  }

  // Clear any queued pending speak timer
  if (pendingSpeakTimer) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }

  // If previous speech was playing, cancel it cleanly
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // Ignore
    }
  }

  // Only resume if explicitly paused (calling resume when unpaused causes Chromium state corruption)
  if (window.speechSynthesis.paused) {
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      // Ignore
    }
  }

  // Allow Chromium IPC 25ms to acknowledge cancellation before dispatching new utterance
  // This completely eliminates the notorious Chrome silent-drop bug when cancel() and speak() are in the same frame
  pendingSpeakTimer = setTimeout(() => {
    pendingSpeakTimer = null;
    try {
      const utterance = new SpeechSynthesisUtterance(trimmed);
      activeUtterances.add(utterance);

      const handleDone = () => {
        activeUtterances.delete(utterance);
        onEnded?.();
      };

      utterance.onend = handleDone;
      utterance.onerror = (e) => {
        // If canceled by another deliberate action, ignore; otherwise log
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('[FocusFlow TTS] Speech synthesis notice:', e.error);
        }
        handleDone();
      };

      // Default speaking rate: Ensure crisp, natural pacing (1.0x baseline)
      utterance.rate = Math.max(0.5, Math.min(2.0, speed));

      const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
      const detectedLang = isChinese ? 'zh-CN' : 'en-US';
      utterance.lang = lang || detectedLang;

      // Try to find matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        let targetVoice: SpeechSynthesisVoice | undefined;

        // Helper to check if a voice is safe (NOT Siri and NOT vintage toy voices)
        const isSafeVoice = (v: SpeechSynthesisVoice) => {
          const nameLower = v.name.toLowerCase();
          // macOS Siri voices cannot be spoken by Chrome/Edge and fail silently
          if (nameLower.includes('siri')) return false;
          if (VINTAGE_NOVELTY_VOICE_REGEX.test(v.name)) return false;
          return true;
        };

        // 1. If voiceId is specified, check exact match
        if (voiceId) {
          const candidate = voices.find((v) => (v.voiceURI === voiceId || v.name === voiceId) && isSafeVoice(v));
          if (candidate) {
            const isVoiceZh = candidate.lang.toLowerCase().startsWith('zh');
            if ((isChinese && isVoiceZh) || (!isChinese && !isVoiceZh)) {
              targetVoice = candidate;
            }
          }
        }

        // 2. If no valid targetVoice, select appropriate flagship broadcast voice
        if (!targetVoice) {
          const safeVoices = voices.filter(isSafeVoice);
          if (isChinese) {
            // Filter Chinese voices (prioritizing Mandarin zh-CN)
            const zhVoices = safeVoices.filter(
              (v) => v.lang.toLowerCase().startsWith('zh') || /[\u4e00-\u9fa5]/.test(v.name)
            );

            // 2.1 Flagship Mandarin broadcast whitelist (Ting-Ting, Xiaoxiao, Google 普通话, Yunxi)
            targetVoice = zhVoices.find((v) => CHINESE_BROADCAST_VOICE_REGEX.test(v.name));

            // 2.2 Standard zh-CN Mandarin voice
            if (!targetVoice) {
              targetVoice = zhVoices.find((v) => {
                const l = v.lang.toLowerCase();
                return l === 'zh-cn' || l === 'zh_cn';
              });
            }

            // 2.3 Any safe Chinese voice fallback
            if (!targetVoice && zhVoices.length > 0) {
              targetVoice = zhVoices[0];
            }
          } else {
            // English voices
            const enVoices = safeVoices.filter((v) => v.lang.toLowerCase().startsWith('en'));

            // 2.1 Flagship English broadcast whitelist (Samantha, Alex, Jenny, Google US English)
            targetVoice = enVoices.find((v) => ENGLISH_BROADCAST_VOICE_REGEX.test(v.name));

            // 2.2 Standard en-US voice
            if (!targetVoice) {
              targetVoice = enVoices.find((v) => {
                const l = v.lang.toLowerCase();
                return l === 'en-us' || l === 'en_us';
              });
            }

            // 2.3 Any safe English voice fallback
            if (!targetVoice && enVoices.length > 0) {
              targetVoice = enVoices[0];
            }
          }
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[FocusFlow TTS] Speech synthesis dispatch error:', err);
      onEnded?.();
    }
  }, 25);
}

/**
 * Immediately stop any browser speech synthesis playback
 */
export function stopWebSpeech(): void {
  if (pendingSpeakTimer) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    activeUtterances.clear();
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      // Ignore
    }
  }
}
