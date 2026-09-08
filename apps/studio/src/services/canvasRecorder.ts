/**
 * FocusFlow 纯前端客户端高清视频录制服务
 * 基于浏览器原生 getDisplayMedia 标签页捕获与 MediaRecorder VP9 硬件加速实现 60FPS WebM 本地无损导出
 */

export interface TabRecordingOptions {
  fps?: number;
  audio?: boolean;
  onTick?: (elapsedSeconds: number) => void;
  onStreamEnded?: () => void;
  externalAudioStream?: MediaStream;
}

export interface RecordingSession {
  stop: () => Promise<Blob>;
  cancel: () => void;
  getStream: () => MediaStream;
}

/**
 * 请求浏览器原生标签页屏幕共享授权并开启 60FPS WebM 录制会话
 */
export async function startTabRecording(
  options: TabRecordingOptions = {}
): Promise<RecordingSession> {
  const {
    fps = 60,
    audio = true,
    onTick,
    onStreamEnded,
    externalAudioStream,
  } = options;

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('当前浏览器不支持屏幕捕获 API (getDisplayMedia)');
  }

  // 1. 唤起浏览器原生屏幕/标签页捕获授权（引导优先捕获当前标签页）
  // 施加 1080p 上限约束，彻底防止 Retina 3K/4K 导致 VP9 纯 CPU 软件编码器 400% 满载
  const displayStream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'browser',
      width: { max: 1920 },
      height: { max: 1080 },
      frameRate: { ideal: fps, max: fps },
    },
    audio: audio ? true : false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    systemAudio: 'include',
    surfaceSwitching: 'include',
  } as any);

  // 2. 混合外部音频流（如工程内的合成音轨或背景音乐）
  if (externalAudioStream) {
    externalAudioStream.getAudioTracks().forEach((track) => {
      try {
        displayStream.addTrack(track);
      } catch (err) {
        console.warn('[FocusFlow] 混入外部音频轨失败:', err);
      }
    });
  }

  const chunks: Blob[] = [];
  let mediaRecorder: MediaRecorder | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let elapsed = 0;
  let isStopped = false;

  // 3. 智能选择最高保真编码格式（优先 VP9 6Mbps，回退普通 WebM）
  let mimeType = 'video/webm';
  const videoBitsPerSecond = 6000000;

  if (typeof MediaRecorder !== 'undefined') {
    const hasAudio = displayStream.getAudioTracks().length > 0;
    if (hasAudio && MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (hasAudio && MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    mediaRecorder = new MediaRecorder(displayStream, {
      mimeType,
      videoBitsPerSecond,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // 4. 监听视轨意外中断（例如用户点击了浏览器原生悬浮条的“停止共享”）
    const videoTrack = displayStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        if (!isStopped) {
          console.log('[FocusFlow] 用户触发浏览器原生停止共享，安全收尾录制');
          onStreamEnded?.();
        }
      };
    }

    mediaRecorder.start(250); // 每 250ms 采集一次切片，防内存剧烈抖动

    timerId = setInterval(() => {
      elapsed += 1;
      onTick?.(elapsed);
    }, 1000);
  }

  const stopTracks = () => {
    try {
      displayStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
        track.onended = null;
      });
    } catch {}
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {}
    }
  };

  return {
    getStream: () => displayStream,
    stop: async () => {
      if (isStopped) {
        return new Blob(chunks, { type: 'video/webm' });
      }
      isStopped = true;
      if (timerId) clearInterval(timerId);

      return new Promise<Blob>((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          stopTracks();
          resolve(new Blob(chunks, { type: 'video/webm' }));
          return;
        }

        mediaRecorder.onstop = () => {
          stopTracks();
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        try {
          mediaRecorder.stop();
        } catch {
          stopTracks();
          resolve(new Blob(chunks, { type: 'video/webm' }));
        }
      });
    },
    cancel: () => {
      isStopped = true;
      if (timerId) clearInterval(timerId);
      stopTracks();
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch {}
      }
      chunks.length = 0;
    },
  };
}

/**
 * 兼容性别名
 */
export const startDomRecording = (
  _container: HTMLElement,
  fps = 60,
  onTick?: (elapsedSeconds: number) => void,
  audioStream?: MediaStream
) => startTabRecording({ fps, onTick, externalAudioStream: audioStream });

/**
 * 触发本地视频文件下载
 */
export function downloadVideoBlob(blob: Blob, rawFilename = 'focusflow-recording'): void {
  const safeName = rawFilename
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim() || 'focusflow-recording';

  const filename = safeName.endsWith('.webm') ? safeName : `${safeName}.webm`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
