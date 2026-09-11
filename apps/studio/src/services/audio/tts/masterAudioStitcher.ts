import type { SceneStep, AudioTrackConfig, AudioMarker } from "@focusflow/dsl";

export interface SceneTimeOffset {
  sceneIndex: number;
  startMs: number;
  durationMs: number;
  endMs: number;
}

// In-memory cache for decoded AudioBuffers to make reactive re-stitching instantaneous (<1ms)
const decodedAudioBufferCache = new Map<string, AudioBuffer>();

// In-memory cache for raw audio Blobs keyed by sceneId to ensure session persistence and avoid dead blob: URL fetches
const sceneRawBlobCache = new Map<string, Blob>();

export function setSceneAudioBlob(sceneId: string, blob: Blob): void {
  sceneRawBlobCache.set(sceneId, blob);
}

export function getSceneAudioBlob(sceneId: string): Blob | undefined {
  return sceneRawBlobCache.get(sceneId);
}

export function removeSceneAudioBlob(sceneId: string): void {
  sceneRawBlobCache.delete(sceneId);
}

export function clearAllSceneAudioBlobs(): void {
  sceneRawBlobCache.clear();
}

export function clearAudioDecodeCache(url?: string): void {
  if (url) {
    decodedAudioBufferCache.delete(url);
  } else {
    decodedAudioBufferCache.clear();
  }
}

/**
 * Calculate absolute start, duration, and end offsets in milliseconds for all scenes
 */
export function calculateSceneTimeOffsets(scenes: SceneStep[], defaultInterval = 3800): SceneTimeOffset[] {
  let accum = 0;
  return scenes.map((s, idx) => {
    const durMs = typeof s.duration === "number" && s.duration > 0
      ? (s.duration > 100 ? s.duration : s.duration * 1000)
      : defaultInterval;
    const startMs = accum;
    accum += durMs;
    return {
      sceneIndex: idx,
      startMs,
      durationMs: durMs,
      endMs: accum,
    };
  });
}

export interface StitchOptions {
  sampleRate?: number;
  defaultInterval?: number;
  trackName?: string;
}

/**
 * Convert AudioBuffer to standard 44-byte WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");

  // fmt Subchunk
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);

  // data Subchunk
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Fast linear interpolation resampler for aligning speech sample rates (e.g. 24kHz to 44.1kHz)
 */
function resampleAndCopy(
  srcChannel: Float32Array,
  srcRate: number,
  destChannel: Float32Array,
  destStartSample: number,
  destRate: number,
  maxAllowedSamples?: number
) {
  const ratio = srcRate / destRate;
  const numDestSamples = Math.floor(srcChannel.length / ratio);
  const maxWrite = Math.min(
    numDestSamples,
    maxAllowedSamples !== undefined ? maxAllowedSamples : Infinity,
    destChannel.length - destStartSample
  );

  for (let i = 0; i < maxWrite; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(i0 + 1, srcChannel.length - 1);
    const frac = srcIndex - i0;
    destChannel[destStartSample + i] = srcChannel[i0] * (1 - frac) + srcChannel[i1] * frac;
  }
}

/**
 * Compose master audio track from scene steps with independent voiceoverAudio metadata
 * Stitching audio buffers into precise timeline slots according to scene offsets,
 * leaving unvoiced scenes as pure silence.
 */
export async function composeMasterAudioFromScenes(
  scenes: SceneStep[],
  options: StitchOptions = {}
): Promise<{ masterTrack: AudioTrackConfig | null; totalDurationMs: number }> {
  const defaultInterval = options.defaultInterval || 3800;
  const targetSampleRate = options.sampleRate || 44100;

  const hasAnyAudio = scenes.some((s) => Boolean(s.voiceoverAudio?.url));
  const sceneOffsets = calculateSceneTimeOffsets(scenes, defaultInterval);
  const totalDurationMs = sceneOffsets.length > 0 ? sceneOffsets[sceneOffsets.length - 1].endMs : defaultInterval;

  const markers: AudioMarker[] = sceneOffsets.map((so) => ({
    id: `marker-scene-${so.sceneIndex}`,
    timeMs: so.startMs,
    label: scenes[so.sceneIndex]?.title || `Scene ${so.sceneIndex + 1}`,
    sceneIndex: so.sceneIndex,
  }));

  if (!hasAnyAudio) {
    return { masterTrack: null, totalDurationMs };
  }

  const AudioCtx = typeof window !== "undefined"
    ? (window.AudioContext || (window as any).webkitAudioContext)
    : null;
  if (!AudioCtx) {
    return { masterTrack: null, totalDurationMs };
  }

  const ctx = new AudioCtx();

  try {
    const totalSamples = Math.ceil((totalDurationMs / 1000) * targetSampleRate);
    const masterBuffer = ctx.createBuffer(1, Math.max(1, totalSamples), targetSampleRate);
    const masterChannel = masterBuffer.getChannelData(0);

    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const audioUrl = s.voiceoverAudio?.url;
      if (!audioUrl) continue;

      try {
        let decoded: AudioBuffer;
        if (decodedAudioBufferCache.has(audioUrl)) {
          decoded = decodedAudioBufferCache.get(audioUrl)!;
        } else {
          let arrayBuffer: ArrayBuffer | null = null;
          const cachedBlob = getSceneAudioBlob(s.id);
          if (cachedBlob) {
            arrayBuffer = await cachedBlob.arrayBuffer();
          } else {
            try {
              const resp = await fetch(audioUrl);
              if (resp.ok) {
                const blob = await resp.blob();
                setSceneAudioBlob(s.id, blob);
                arrayBuffer = await blob.arrayBuffer();
              }
            } catch {
              // Ignore fetch network or expired session blob errors
            }
          }

          if (!arrayBuffer) {
            console.warn(`[MasterAudioStitcher] Audio resource for scene ${i} (${s.title}) is inaccessible or expired, skipping.`);
            continue;
          }

          decoded = await ctx.decodeAudioData(arrayBuffer);
          decodedAudioBufferCache.set(audioUrl, decoded);
        }

        const startSample = Math.floor((sceneOffsets[i].startMs / 1000) * targetSampleRate);
        const maxSceneSamples = Math.floor((sceneOffsets[i].durationMs / 1000) * targetSampleRate);
        const srcChannel = decoded.getChannelData(0);

        if (decoded.sampleRate === targetSampleRate) {
          const maxSamples = Math.min(srcChannel.length, maxSceneSamples, masterChannel.length - startSample);
          masterChannel.set(srcChannel.subarray(0, maxSamples), startSample);
        } else {
          resampleAndCopy(srcChannel, decoded.sampleRate, masterChannel, startSample, targetSampleRate, maxSceneSamples);
        }
      } catch (err) {
        console.warn(`[MasterAudioStitcher] Failed to decode audio for scene ${i} (${s.title}):`, err);
      }
    }

    const masterBlob = audioBufferToWavBlob(masterBuffer);
    const masterTrack: AudioTrackConfig = {
      id: `track-master-${Date.now()}`,
      name: options.trackName || "🎙️ 分幕多轨智能合流母带",
      url: URL.createObjectURL(masterBlob),
      durationMs: totalDurationMs,
      volume: 1.0,
      muted: false,
      isOfflineTTS: false,
      type: "voiceover",
      markers,
    };

    return { masterTrack, totalDurationMs };
  } finally {
    ctx.close().catch(() => {});
  }
}
