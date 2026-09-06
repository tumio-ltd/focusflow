/**
 * Unified TTS Provider Architecture (Open-Core Strategy)
 * Defines standard contract for client-side TTS providers
 */

export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
}

export interface TTSResult {
  audioBlob: Blob;
  durationMs: number;
}

export interface ITTSProvider {
  readonly name: string;
  getVoices(): Promise<TTSVoiceOption[]>;
  synthesize(text: string, voiceId?: string, speed?: number): Promise<TTSResult>;
}
