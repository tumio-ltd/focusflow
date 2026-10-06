// 1. 跨项目共享中台队列契约
export const PLATFORM_ORDER_TIMEOUT_QUEUE = 'platform-order-timeout';
export const PLATFORM_PAYMENT_FULFILL_QUEUE = 'platform-payment-fulfill';
export const PLATFORM_NOTIFICATIONS_QUEUE = 'platform-notifications';
export const PLATFORM_AI_TASKS_QUEUE = 'platform-ai-tasks';

// 2. FocusFlow 专属渲染算力队列契约
export const FOCUSFLOW_RENDER_QUEUE = 'focusflow-video-render';
export const FOCUSFLOW_RENDER_QUEUE_DLQ = 'focusflow-video-render-dlq';
export const RENDER_QUEUE_4K = FOCUSFLOW_RENDER_QUEUE;
export const RENDER_QUEUE_4K_DLQ = FOCUSFLOW_RENDER_QUEUE_DLQ;

/**
 * BullMQ 4K 视频渲染任务默认调度选项 (指数退避、有界保留)
 */
export const DEFAULT_RENDER_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // 5s -> 10s -> 20s
  },
  removeOnComplete: {
    count: 500,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: {
    count: 1000,
    age: 7 * 24 * 3600, // 7 days (DLQ auditing)
  },
};

/**
 * 4K 视频渲染任务负载契约 (BullMQ Job Payload)
 */
export interface RenderVideoJobPayload {
  jobId: string;
  projectId: string;
  workspaceId?: string;
  appCode?: string;
  dslSnapshot: any; // 提交转码时刻的完整 FocusFlow DSL 快照
  resolution: '4K' | '2K' | '1080P';
  fps: 30 | 60;
  outputFormat: 'mp4' | 'gif';
  requestedBy: string;
  createdAt: string;
  quotaLeaseKey?: string;
}

/**
 * 视频转码进度与完成事件
 */
export interface RenderJobProgressEvent {
  jobId: string;
  currentFrame: number;
  totalFrames: number;
  progressPercent: number;
  status: 'queued' | 'rendering_frames' | 'encoding_ffmpeg' | 'uploading_s3' | 'completed' | 'failed';
  etaSeconds?: number;
  downloadUrl?: string;
  error?: string;
}

/**
 * 渲染死信队列 (DLQ) 负载契约
 */
export interface RenderDeadLetterPayload {
  originalJobId: string;
  payload: RenderVideoJobPayload;
  failedReason: string;
  failedAt: string;
  attemptsMade: number;
  stackTrace?: string;
}
