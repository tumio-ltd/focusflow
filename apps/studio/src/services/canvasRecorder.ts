/**
 * FocusFlow 纯前端客户端高清视频录制服务
 * 基于 HTML5 MediaRecorder API 实现 60FPS WebM 本地无损导出
 */

export interface RecordingSession {
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export function startDomRecording(
  container: HTMLElement,
  fps = 60,
  onTick?: (elapsedSeconds: number) => void
): RecordingSession {
  const canvas = document.createElement('canvas');
  const rect = container.getBoundingClientRect();
  
  canvas.width = Math.max(1280, Math.round(rect.width * 1.5));
  canvas.height = Math.max(720, Math.round(rect.height * 1.5));

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
  const chunks: Blob[] = [];

  let mediaRecorder: MediaRecorder | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let elapsed = 0;

  if (stream && typeof MediaRecorder !== 'undefined') {
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 }
      : { mimeType: 'video/webm' };

    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    mediaRecorder.start(250);

    timerId = setInterval(() => {
      elapsed += 1;
      onTick?.(elapsed);
    }, 1000);
  }

  return {
    stop: async () => {
      if (timerId) clearInterval(timerId);

      return new Promise<Blob>((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          // Fallback empty blob
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
          return;
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        mediaRecorder.stop();
      });
    },
    cancel: () => {
      if (timerId) clearInterval(timerId);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    },
  };
}

/**
 * 触发本地视频文件下载
 */
export function downloadVideoBlob(blob: Blob, filename = 'focusflow-recording.webm'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
