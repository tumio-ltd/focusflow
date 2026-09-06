/**
 * Voice Activity Detection (VAD) & Silence Interval Analyzer
 * Detects natural pauses and speech intervals using 20ms sliding RMS windows
 * Provides magnetic snap calculations (±50ms) for timeline scene cutting lines
 */

export interface SilenceBand {
  startMs: number;
  endMs: number;
  centerMs: number;
}

export interface SnapResult {
  snapped: boolean;
  targetMs: number;
  deltaMs: number;
  silenceBand?: SilenceBand;
}

/**
 * Detect silence intervals across an AudioBuffer
 * @param audioBuffer The decoded AudioBuffer
 * @param thresholdDbfs Silence threshold in dBFS (default: -42dB)
 * @param minDurationMs Minimum silence duration to qualify as a cut point (default: 120ms)
 */
export function analyzeVadSilences(
  audioBuffer: AudioBuffer,
  thresholdDbfs = -42,
  minDurationMs = 120
): SilenceBand[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSamples = Math.max(1, Math.floor(sampleRate * 0.02)); // 20ms window
  const totalSamples = channelData.length;
  const numWindows = Math.floor(totalSamples / windowSamples);

  const silences: SilenceBand[] = [];
  let inSilence = false;
  let silenceStartWindow = 0;

  for (let w = 0; w < numWindows; w++) {
    const startSample = w * windowSamples;
    const endSample = startSample + windowSamples;
    
    // Compute RMS
    let sumSq = 0;
    for (let i = startSample; i < endSample; i++) {
      const sample = channelData[i];
      sumSq += sample * sample;
    }
    const rms = Math.sqrt(sumSq / windowSamples);
    // Convert to dBFS
    const dbfs = 20 * Math.log10(rms + 1e-9);

    const isSilentWindow = dbfs < thresholdDbfs;

    if (isSilentWindow) {
      if (!inSilence) {
        inSilence = true;
        silenceStartWindow = w;
      }
    } else {
      if (inSilence) {
        inSilence = false;
        const silenceEndWindow = w;
        const durationMs = (silenceEndWindow - silenceStartWindow) * 20;
        if (durationMs >= minDurationMs) {
          const startMs = silenceStartWindow * 20;
          const endMs = silenceEndWindow * 20;
          silences.push({
            startMs,
            endMs,
            centerMs: Math.round((startMs + endMs) / 2),
          });
        }
      }
    }
  }

  // Check boundary if audio ends in silence
  if (inSilence) {
    const durationMs = (numWindows - silenceStartWindow) * 20;
    if (durationMs >= minDurationMs) {
      const startMs = silenceStartWindow * 20;
      const endMs = numWindows * 20;
      silences.push({
        startMs,
        endMs,
        centerMs: Math.round((startMs + endMs) / 2),
      });
    }
  }

  return silences;
}

/**
 * Snap a given timestamp to the nearest silence pause center within tolerance
 * @param timeMs Candidate timestamp in milliseconds
 * @param silences Detected silence bands
 * @param toleranceMs Snap threshold (default: ±50ms)
 */
export function snapTimeToSilence(
  timeMs: number,
  silences: SilenceBand[],
  toleranceMs = 50
): SnapResult {
  if (!silences || silences.length === 0) {
    return { snapped: false, targetMs: timeMs, deltaMs: 0 };
  }

  let closestBand: SilenceBand | null = null;
  let minDiff = Infinity;

  for (const band of silences) {
    const diff = Math.abs(timeMs - band.centerMs);
    if (diff <= toleranceMs && diff < minDiff) {
      minDiff = diff;
      closestBand = band;
    }
  }

  if (closestBand) {
    return {
      snapped: true,
      targetMs: closestBand.centerMs,
      deltaMs: closestBand.centerMs - timeMs,
      silenceBand: closestBand,
    };
  }

  return { snapped: false, targetMs: timeMs, deltaMs: 0 };
}
