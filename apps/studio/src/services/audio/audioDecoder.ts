/**
 * Audio Decoder & Peak Envelope Service
 * Handles decoding audio files, offline channel extraction, and peak envelope computation
 */

let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export interface DecodedAudioInfo {
  audioBuffer: AudioBuffer;
  durationMs: number;
  sampleRate: number;
  numberOfChannels: number;
}

/**
 * Decode an audio File or Blob into an AudioBuffer using Web Audio API
 */
export async function decodeAudioFile(fileOrBlob: Blob): Promise<DecodedAudioInfo> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const ctx = getAudioContext();
  
  // decodeAudioData detaches the arrayBuffer in some browsers, so slice if needed
  const bufferCopy = arrayBuffer.slice(0);
  const audioBuffer = await ctx.decodeAudioData(bufferCopy);

  return {
    audioBuffer,
    durationMs: Math.round(audioBuffer.duration * 1000),
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
  };
}

/**
 * Synchronous peak extraction fallback
 */
export function extractPeaksSync(channelData: Float32Array, numBuckets: number): Float32Array {
  const totalSamples = channelData.length;
  const blockSize = totalSamples / numBuckets;
  const peaks = new Float32Array(numBuckets * 2);

  for (let i = 0; i < numBuckets; i++) {
    const start = Math.floor(i * blockSize);
    const end = Math.min(totalSamples, Math.floor((i + 1) * blockSize));
    let min = 1.0;
    let max = -1.0;

    for (let j = start; j < end; j++) {
      const val = channelData[j];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    if (min > max) {
      min = 0;
      max = 0;
    }

    peaks[i * 2] = min;
    peaks[i * 2 + 1] = max;
  }

  return peaks;
}

/**
 * Extract peak envelope from AudioBuffer
 * Tries Web Worker first for non-blocking UI, falls back to sync on error/headless
 */
export async function extractPeaks(audioBuffer: AudioBuffer, numBuckets = 800): Promise<Float32Array> {
  const channelData = audioBuffer.getChannelData(0);

  if (typeof Worker !== 'undefined') {
    try {
      return await new Promise<Float32Array>((resolve, reject) => {
        const worker = new Worker(
          new URL('./waveformWorker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e) => {
          resolve(e.data.peaks);
          worker.terminate();
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(err);
        };

        // Transfer a copy to the worker
        const copy = new Float32Array(channelData);
        worker.postMessage({ channelData: copy, numBuckets }, [copy.buffer]);
      });
    } catch {
      // Fallback to sync
      return extractPeaksSync(channelData, numBuckets);
    }
  }

  return extractPeaksSync(channelData, numBuckets);
}

/**
 * Convert Blob to Base64 Data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a synthetic WAV audio blob with sine wave
 * Used for testing and fallback synthesis
 */
export function createMockAudioBlob(durationSeconds = 3, frequency = 440, sampleRate = 44100): Blob {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV Header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate PCM Sine wave
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Envelope: quick fade in and fade out
    const env = Math.sin(Math.min(1, Math.max(0, (i / numSamples) * Math.PI)));
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5 * env;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
