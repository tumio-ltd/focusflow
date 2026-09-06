/**
 * Waveform Peak Envelope Worker
 * Extracts min-max peaks off the main thread to guarantee smooth 60fps UI
 */

export interface WaveformWorkerInput {
  channelData: Float32Array;
  numBuckets: number;
}

export interface WaveformWorkerOutput {
  peaks: Float32Array; // [min0, max0, min1, max1, ...]
}

self.onmessage = (e: MessageEvent<WaveformWorkerInput>) => {
  const { channelData, numBuckets } = e.data;
  if (!channelData || numBuckets <= 0) {
    self.postMessage({ peaks: new Float32Array(0) });
    return;
  }

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

  // Transfer ArrayBuffer back to main thread
  (self as any).postMessage({ peaks }, [peaks.buffer]);
};
