/**
 * FocusFlow 高清无痕视频录制协调服务 (Clean Screen Recorder)
 * 编排浏览器原生 getDisplayMedia 捕获、MediaRecorder 硬件加速与 Document PiP 独立桌面浮窗控制
 * 确保捕获画面 100% 绝对纯净（零 DOM HUD 污染），同时为创作者提供桌面级画中画实时计时与完成控制
 */

import {
  startTabRecording,
  downloadVideoBlob,
  type TabRecordingOptions,
  type RecordingSession,
} from './canvasRecorder';
import {
  openRecordingPiP,
  isDocumentPiPSupported,
  type RecordingPiPInstance,
} from './RecordingPiPController';

export interface CleanScreenRecordingOptions extends TabRecordingOptions {
  totalDurationSeconds?: number;
  enablePiP?: boolean;
  onFinishRequest?: () => void;
  onCancelRequest?: () => void;
}

export interface CleanRecordingSession extends RecordingSession {
  pipInstance: RecordingPiPInstance | null;
}

export async function startCleanScreenRecording(
  options: CleanScreenRecordingOptions = {}
): Promise<CleanRecordingSession> {
  const {
    fps = 60,
    audio = true,
    totalDurationSeconds = 60,
    enablePiP = true,
    onTick,
    onStreamEnded,
    onFinishRequest,
    onCancelRequest,
    externalAudioStream,
  } = options;

  let pipInstance: RecordingPiPInstance | null = null;
  let rawSession: RecordingSession | null = null;

  // 1. 尝试初始化桌面画中画独立微型控制台 (Chrome 111+)
  if (enablePiP && isDocumentPiPSupported()) {
    try {
      pipInstance = await openRecordingPiP({
        totalDurationSeconds,
        fps,
        resolution: '1080p',
        onFinish: () => {
          if (onFinishRequest) {
            onFinishRequest();
          } else if (rawSession) {
            rawSession.stop();
          }
        },
        onCancel: () => {
          if (onCancelRequest) {
            onCancelRequest();
          } else if (rawSession) {
            rawSession.cancel();
          }
        },
      });
    } catch (e) {
      console.warn('[FocusFlow] 打开 Document PiP 控制台失败，降级为常规无浮窗模式:', e);
    }
  }

  // 2. 启动原生标签页屏幕捕获 (getDisplayMedia)
  try {
    rawSession = await startTabRecording({
      fps,
      audio,
      externalAudioStream,
      onTick: (elapsed) => {
        onTick?.(elapsed);
        pipInstance?.updateElapsed(elapsed);
      },
      onStreamEnded: () => {
        pipInstance?.close();
        onStreamEnded?.();
      },
    });
  } catch (err) {
    pipInstance?.close();
    throw err;
  }

  return {
    getStream: () => rawSession!.getStream(),
    stop: async () => {
      pipInstance?.close();
      return rawSession!.stop();
    },
    cancel: () => {
      pipInstance?.close();
      rawSession!.cancel();
    },
    pipInstance,
  };
}

// 重新导出底层工具函数与类型，供上层无缝引用
export {
  startTabRecording,
  downloadVideoBlob,
  openRecordingPiP,
  isDocumentPiPSupported,
  type TabRecordingOptions,
  type RecordingSession,
  type RecordingPiPInstance,
};
