/**
 * 4K 视频渲染任务负载契约 (BullMQ Job Payload)
 */
export interface RenderVideoJobPayload {
  jobId: string;
  projectId: string;
  dslSnapshot: any; // 提交转码时刻的完整 FocusFlow DSL 快照
  resolution: '4K' | '2K' | '1080P';
  fps: 30 | 60;
  outputFormat: 'mp4' | 'gif';
  requestedBy: string;
  createdAt: string;
}

/**
 * 视频转码进度与完成事件
 */
export interface RenderJobProgressEvent {
  jobId: string;
  currentFrame: number;
  totalFrames: number;
  progressPercent: number;
  status: 'queued' | 'rendering_frames' | 'encoding_ffmpeg' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}
