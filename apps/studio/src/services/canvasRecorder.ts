/**
 * FocusFlow 纯前端客户端高清视频录制服务
 * 基于浏览器原生 getDisplayMedia 标签页捕获与 MediaRecorder VP9 硬件加速实现 60FPS WebM 本地无损导出
 */

export type VideoExportFormat = 'mp4' | 'webm' | 'auto';

export interface VideoFormatCapabilities {
  mp4: boolean;
  webm: boolean;
  supportedFormats: ('mp4' | 'webm')[];
  recommendedFormat: 'mp4' | 'webm';
}

export interface VideoResolution {
  width: number;
  height: number;
}

/**
 * 根据工程取景框 aspectRatio 映射标准宏块整除的高清视频录制分辨率
 */
export function resolveStandardVideoResolution(aspectRatio?: string): VideoResolution {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '16:10':
      return { width: 1920, height: 1200 };
    case '4:3':
      return { width: 1440, height: 1080 };
    case '16:9':
    default:
      return { width: 1920, height: 1080 };
  }
}

export interface TabRecordingOptions {
  fps?: number;
  audio?: boolean;
  format?: VideoExportFormat;
  aspectRatio?: string;
  onTick?: (elapsedSeconds: number) => void;
  onStreamEnded?: () => void;
  externalAudioStream?: MediaStream;
}

export interface RecordingSession {
  stop: () => Promise<Blob>;
  cancel: () => void;
  getStream: () => MediaStream;
  format: 'mp4' | 'webm';
}

/**
 * 检查当前浏览器原生硬件编码能力支持
 */
export function checkVideoFormatSupport(): VideoFormatCapabilities {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return { mp4: false, webm: false, supportedFormats: [], recommendedFormat: 'webm' };
  }
  const mp4 =
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ||
    MediaRecorder.isTypeSupported('video/mp4');
  const webm =
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
    MediaRecorder.isTypeSupported('video/webm');
  const supported: ('mp4' | 'webm')[] = [];
  if (mp4) supported.push('mp4');
  if (webm) supported.push('webm');
  return {
    mp4,
    webm,
    supportedFormats: supported,
    recommendedFormat: mp4 ? 'mp4' : 'webm',
  };
}

/**
 * 检查浏览器是否原生支持直接录制为 MP4 格式 (H.264 / AVC1)
 */
export function isNativeMp4Supported(): boolean {
  return checkVideoFormatSupport().mp4;
}

/**
 * 智能协商并决策最佳 MediaRecorder MIME 类型
 */
export function resolveOptimalMimeType(
  preferredFormat: VideoExportFormat = 'auto',
  hasAudio = false
): { mimeType: string; format: 'mp4' | 'webm' } {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return { mimeType: 'video/webm', format: 'webm' };
  }

  const mp4Candidates = hasAudio
    ? [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1,opus',
        'video/mp4;codecs=avc1',
        'video/mp4',
      ]
    : ['video/mp4;codecs=avc1', 'video/mp4'];

  const webmCandidates = hasAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

  // 用户请求 mp4 或 auto（且支持 mp4）
  const tryMp4 = preferredFormat === 'mp4' || (preferredFormat === 'auto' && isNativeMp4Supported());

  if (tryMp4) {
    for (const candidate of mp4Candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, format: 'mp4' };
      }
    }
  }

  // 尝试 WebM
  for (const candidate of webmCandidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return { mimeType: candidate, format: 'webm' };
    }
  }

  // 若明确指定 MP4 但不支持，尝试最后的 MP4 回退或兜底
  if (preferredFormat === 'mp4') {
    for (const candidate of mp4Candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return { mimeType: candidate, format: 'mp4' };
      }
    }
  }

  return { mimeType: 'video/webm', format: 'webm' };
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
    format: preferredFormat = 'auto',
    aspectRatio = '16:9',
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

  // 3. 构建基于工程 aspectRatio 的标准分辨率归一化画布管道 (Normalizer Pipeline)
  // 彻底隔离 Chrome 顶部 48px 共享条挤压对视口宏块的破坏，确保 H.264 编码宏块 100% 饱满无绿线
  let recordStream = displayStream;
  let normalizerCleanup: (() => void) | null = null;

  try {
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      const targetRes = resolveStandardVideoResolution(aspectRatio);
      const normCanvas = document.createElement('canvas');
      normCanvas.width = targetRes.width;
      normCanvas.height = targetRes.height;
      const ctx = normCanvas.getContext('2d', { alpha: false });

      if (ctx && typeof normCanvas.captureStream === 'function') {
        const hiddenVideo = document.createElement('video');
        hiddenVideo.muted = true;
        hiddenVideo.playsInline = true;
        hiddenVideo.srcObject = displayStream;

        let isNormalizerActive = true;
        let animFrameId: number | null = null;

        hiddenVideo.play().catch(() => {});

        const renderNormalizerFrame = () => {
          if (!isNormalizerActive) return;

          const rawVideoTrack = displayStream.getVideoTracks()[0];
          const settings = rawVideoTrack?.getSettings?.();
          const vw = hiddenVideo.videoWidth || settings?.width || targetRes.width;
          const vh = hiddenVideo.videoHeight || settings?.height || targetRes.height;

          if (vw > 0 && vh > 0) {
            ctx.fillStyle = '#0a0d14';
            ctx.fillRect(0, 0, targetRes.width, targetRes.height);

            // 🎯 源头视口精准投影流水线 (Source Viewport Projection Pipeline)
            // 依据目标画幅比例 R，从输入标签页流中精准提取演播有效舞台区域
            // 彻底消除由于浏览器窗口非标准比例导致的上下/左右空白内衬，实现真正 1:1 饱满无黑边输出
            const targetAspect = targetRes.width / targetRes.height;
            const streamAspect = vw / vh;

            let sx = 0;
            let sy = 0;
            let sw = vw;
            let sh = vh;

            if (streamAspect >= targetAspect) {
              // 输入流相对目标画幅更宽（如在宽屏电脑录制 9:16 竖屏或 4:3 架构图）：精确切除左右多余留白
              sh = vh;
              sw = Math.round(vh * targetAspect);
              sx = Math.max(0, Math.round((vw - sw) / 2));
              sy = 0;
            } else {
              // 输入流相对目标画幅更窄/更高（如在常规 Mac 窗口录制 16:9 或 16:10 宽屏）：精确切除上下多余留白
              sw = vw;
              sh = Math.round(vw / targetAspect);
              sx = 0;
              sy = Math.max(0, Math.round((vh - sh) / 2));
            }

            // 安全钳位边界，防止取整溢出
            sw = Math.min(sw, vw - sx);
            sh = Math.min(sh, vh - sy);

            try {
              ctx.drawImage(hiddenVideo, sx, sy, sw, sh, 0, 0, targetRes.width, targetRes.height);
            } catch {}
          }

          if ('requestVideoFrameCallback' in hiddenVideo) {
            (hiddenVideo as any).requestVideoFrameCallback(renderNormalizerFrame);
          } else {
            animFrameId = requestAnimationFrame(renderNormalizerFrame);
          }
        };

        renderNormalizerFrame();

        const canvasStream = normCanvas.captureStream(fps);
        displayStream.getAudioTracks().forEach((track) => {
          try {
            canvasStream.addTrack(track);
          } catch {}
        });

        recordStream = canvasStream;

        normalizerCleanup = () => {
          isNormalizerActive = false;
          if (animFrameId) cancelAnimationFrame(animFrameId);
          try {
            hiddenVideo.pause();
            hiddenVideo.srcObject = null;
          } catch {}
          try {
            canvasStream.getTracks().forEach((t) => {
              t.stop();
              t.enabled = false;
            });
          } catch {}
        };
      }
    }
  } catch (normErr) {
    console.warn('[FocusFlow] 初始化归一化画布流失败，安全降级为直接显示流录制:', normErr);
    recordStream = displayStream;
  }

  const chunks: Blob[] = [];
  let mediaRecorder: MediaRecorder | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let elapsed = 0;
  let isStopped = false;

  // 4. 智能选择最高保真编码格式（原生 MP4 H.264 或 60FPS VP9 WebM）
  const hasAudio = recordStream.getAudioTracks().length > 0;
  const { mimeType, format: resolvedFormat } = resolveOptimalMimeType(preferredFormat, hasAudio);
  const videoBitsPerSecond = 6000000;

  if (typeof MediaRecorder !== 'undefined') {
    try {
      mediaRecorder = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond,
      });
    } catch (e) {
      console.warn(`[FocusFlow] 初始化 MediaRecorder(${mimeType}) 失败，回退默认参数:`, e);
      mediaRecorder = new MediaRecorder(recordStream);
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // 5. 监听视轨意外中断（例如用户点击了浏览器原生悬浮条的“停止共享”）
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
    normalizerCleanup?.();
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

  const finalMimeType =
    mediaRecorder?.mimeType || mimeType || (resolvedFormat === 'mp4' ? 'video/mp4' : 'video/webm');

  return {
    format: resolvedFormat,
    getStream: () => recordStream,
    stop: async () => {
      if (isStopped) {
        return new Blob(chunks, { type: finalMimeType });
      }
      isStopped = true;
      if (timerId) clearInterval(timerId);

      return new Promise<Blob>((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          stopTracks();
          resolve(new Blob(chunks, { type: finalMimeType }));
          return;
        }

        mediaRecorder.onstop = () => {
          stopTracks();
          const blob = new Blob(chunks, { type: finalMimeType });
          resolve(blob);
        };

        try {
          mediaRecorder.stop();
        } catch {
          stopTracks();
          resolve(new Blob(chunks, { type: finalMimeType }));
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
 * 触发本地视频文件下载，自动匹配 .mp4 或 .webm 扩展名
 */
export function downloadVideoBlob(blob: Blob, rawFilename = 'focusflow-recording'): void {
  const isMp4 = blob.type.includes('mp4');
  const ext = isMp4 ? '.mp4' : '.webm';

  // 移除非法字符，并剥离可能已存在的旧扩展名以防 .webm.mp4
  const cleanName = rawFilename
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\.(webm|mp4)$/i, '')
    .trim() || 'focusflow-recording';

  const filename = `${cleanName}${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
