// packages/dsl/src/validator.ts
import { z } from 'zod';
import type { FocusFlowDSL } from './schema.js';

/**
 * Viewport 标称画幅运行时校验器
 */
export const zDslViewport = z.object({
  width: z.number().positive('width 必须为大于 0 的数字'),
  height: z.number().positive('height 必须为大于 0 的数字'),
  aspectRatio: z.string().optional(),
});
export const zDSLViewport = zDslViewport;

/**
 * 视觉主题运行时校验器
 */
export const zDslTheme = z
  .object({
    mode: z.enum(['dark', 'light', 'auto']).optional(),
    bg: z.string().optional(),
    accent: z.string().optional(),
    warn: z.string().optional(),
    green: z.string().optional(),
    amber: z.string().optional(),
  })
  .catchall(z.string().optional())
  .optional();
export const zDSLTheme = zDslTheme;

/**
 * 播放控制器配置运行时校验器
 */
export const zDslControls = z
  .object({
    showControls: z.boolean().optional(),
    autoplay: z.boolean().optional(),
    interval: z.number().positive().optional(),
    showPlayBtn: z.boolean().optional(),
    showCounter: z.boolean().optional(),
    showProgress: z.boolean().optional(),
    showHUDButton: z.boolean().optional(),
  })
  .optional();
export const zDSLControls = zDslControls;

/**
 * 全局元数据运行时校验器
 */
export const zDslMeta = z.object({
  title: z.string().min(1, 'title 不能为空').max(256),
  viewport: zDslViewport,
  theme: zDslTheme,
  controls: zDslControls,
});
export const zDSLMeta = zDslMeta;

/**
 * 底图资产运行时校验器
 */
export const zDslAsset = z.object({
  url: z.string().min(1, 'asset.url 不能为空'),
  name: z.string().optional(),
  hash: z.string().optional(),
  urlI18n: z.record(z.string(), z.string()).optional(),
});
export const zDSLAsset = zDslAsset;

/**
 * 几何高亮选框节点样式校验器
 */
export const zDslNodeStyle = z
  .object({
    stroke: z.string().optional(),
    strokeWidth: z.number().nonnegative().optional(),
    glow: z.boolean().optional(),
    fill: z.string().optional(),
    dashLength: z.number().nonnegative().optional(),
  })
  .optional();

/**
 * 几何高亮选框节点运行时校验器 (DslNode / ElementBox)
 */
export const zDslNode = z.object({
  id: z.string().min(1, 'id 不能为空').max(64),
  type: z.enum(['rect', 'circle', 'polygon']),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative('width 必须为非负数'),
  height: z.number().nonnegative('height 必须为非负数'),
  rx: z.number().optional(),
  ry: z.number().optional(),
  style: zDslNodeStyle,
});
export const zElementBox = zDslNode;
export const zDslBox = zDslNode;

/**
 * 矢量流向飞线连接器样式校验器
 */
export const zDslConnectorStyle = z
  .object({
    stroke: z.string().optional(),
    strokeWidth: z.number().nonnegative().optional(),
    mode: z.enum(['draw', 'stream', 'pulse']).optional(),
    speed: z.number().optional(),
    flowSpeed: z.number().optional(),
    glow: z.boolean().optional(),
  })
  .optional();

/**
 * 矢量流向飞线连接器运行时校验器 (DslConnector / ElementPath)
 */
export const zDslConnector = z.object({
  id: z.string().min(1, 'id 不能为空').max(64),
  from: z.string().optional(),
  to: z.string().optional(),
  d: z.string().optional(),
  style: zDslConnectorStyle,
});
export const zElementPath = zDslConnector;
export const zDslPath = zDslConnector;

/**
 * 脉冲指示标定点运行时校验器 (DslDot / ElementDot)
 */
export const zDslDot = z.object({
  id: z.string().min(1).max(64),
  cx: z.number(),
  cy: z.number(),
  r: z.number().positive().optional(),
  style: z
    .object({
      fill: z.string().optional(),
      glow: z.boolean().optional(),
      pulse: z.boolean().optional(),
    })
    .optional(),
});
export const zElementDot = zDslDot;

/**
 * 画布局部悬浮贴片/覆盖图运行时校验器 (DslImage / ElementImage)
 */
export const zDslImage = z.object({
  id: z.string().min(1).max(64),
  url: z.string().min(1, 'url 不能为空'),
  x: z.number(),
  y: z.number(),
  width: z.number().positive('width 必须为大于 0 的数字'),
  height: z.number().positive('height 必须为大于 0 的数字'),
  style: z
    .object({
      borderRadius: z.number().optional(),
      boxShadow: z.union([z.boolean(), z.string()]).optional(),
      animation: z.enum(['fade', 'zoom-fade', 'slide-up']).optional(),
      border: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});
export const zElementImage = zDslImage;

/**
 * 架构解说悬浮气泡卡片运行时校验器 (DslAnnotation / CalloutItem)
 */
export const zDslAnnotation = z.object({
  id: z.string().min(1).max(64),
  targetBoxId: z.string().optional(),
  position: z.object({
    left: z.string(),
    top: z.string(),
  }),
  theme: z.string().optional(),
  title: z.string(),
  desc: z.string(),
  titleI18n: z.record(z.string(), z.string()).optional(),
  descI18n: z.record(z.string(), z.string()).optional(),
  style: z
    .object({
      fontSize: z.number().optional(),
      titleFontSize: z.number().optional(),
      maxWidth: z.number().optional(),
    })
    .optional(),
});
export const zCalloutItem = zDslAnnotation;
export const zDslCallout = zDslAnnotation;

/**
 * 运镜摄像机配置运行时校验器
 */
export const zDslCamera = z.object({
  zoom: z.number().min(1.0, 'zoom 缩放倍率不能小于 1.0').max(3.0, 'zoom 缩放倍率不能大于 3.0'),
  x: z.number().min(-50, 'x 水平平移百分比不能小于 -50').max(50, 'x 水平平移百分比不能大于 50'),
  y: z.number().min(-50, 'y 垂直平移百分比不能小于 -50').max(50, 'y 垂直平移百分比不能大于 50'),
  duration: z.number().nonnegative().optional(),
});

/**
 * 分幕专属物理音频实体运行时校验器
 */
export const zSceneVoiceoverAudio = z
  .object({
    url: z.string().min(1, '音频 URL 不能为空'),
    durationMs: z.number().nonnegative('durationMs 必须为非负数'),
    sampleRate: z.number().positive().optional(),
    voiceId: z.string().optional(),
    model: z.string().optional(),
    adaptedDuration: z.number().nonnegative().optional(),
  })
  .optional();

/**
 * 动态分幕步进序列单元运行时校验器 (DslScene / SceneStep)
 */
export const zDslScene = z.object({
  id: z.string().min(1, 'id 不能为空').max(64),
  title: z.string().min(1, 'title 不能为空').max(128),
  titleI18n: z.record(z.string(), z.string()).optional(),
  duration: z.number().positive().optional(),
  voiceoverScript: z.string().max(2000).optional(),
  voiceoverScriptI18n: z.record(z.string(), z.string()).optional(),
  voiceoverAudio: zSceneVoiceoverAudio,
  camera: zDslCamera,
  activeElements: z.object({
    boxes: z.array(z.string()).optional(),
    paths: z.array(z.string()).optional(),
    dots: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    callouts: z.array(zDslAnnotation).optional(),
  }),
});
export const zSceneStep = zDslScene;

/**
 * 音频标记锚点运行时校验器
 */
export const zAudioMarker = z.object({
  id: z.string().min(1),
  timeMs: z.number().nonnegative(),
  label: z.string(),
  sceneIndex: z.number().nonnegative().optional(),
});

/**
 * 音轨实体配置运行时校验器
 */
export const zAudioTrackConfig = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  name: z.string().optional(),
  durationMs: z.number().nonnegative(),
  volume: z.number().min(0).max(1).optional(),
  muted: z.boolean().optional(),
  type: z.enum(['voiceover', 'music', 'sfx', 'offline-tts']).optional(),
  isOfflineTTS: z.boolean().optional(),
  isBackgroundBGM: z.boolean().optional(),
  markers: z.array(zAudioMarker).optional(),
  vadSilences: z
    .array(
      z.object({
        startMs: z.number().nonnegative(),
        endMs: z.number().nonnegative(),
        centerMs: z.number().nonnegative().optional(),
      })
    )
    .optional(),
});

/**
 * 混音器设置运行时校验器
 */
export const zAudioMixerSettings = z
  .object({
    masterVolume: z.number().min(0).max(1).optional(),
    enableDucking: z.boolean().optional(),
    duckingDb: z.number().optional(),
  })
  .optional();

/**
 * 多音轨与混音器运行时校验器
 */
export const zDslAudio = z
  .object({
    tracks: z.array(zAudioTrackConfig),
    mixer: zAudioMixerSettings,
  })
  .optional();
export const zDSLAudio = zDslAudio;

/**
 * FocusFlow 全量 DSL AST 运行时强校验器 (FocusFlowDslSchema)
 * 对应 WBS 6.4.2 与 11-dsl-schema.md § 3.1
 */
export const FocusFlowDslSchema = z.object({
  $schema: z.string().optional(),
  schemaVersion: z.string().optional(),
  meta: zDslMeta,
  asset: zDslAsset,
  elements: z.object({
    boxes: z.array(zDslNode),
    paths: z.array(zDslConnector),
    dots: z.array(zDslDot).optional(),
    images: z.array(zDslImage).optional(),
  }),
  scenes: z.array(zDslScene).min(1, 'scenes 分幕列表不能为空'),
  audio: zDslAudio,
});
export const zFocusFlowDSL = FocusFlowDslSchema;
export const zFocusFlowDslRoot = FocusFlowDslSchema;

/**
 * 校验诊断结果接口
 */
export interface DSLValidationResult {
  valid: boolean;
  data?: FocusFlowDSL;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

/**
 * 执行 FocusFlow DSL 运行时结构校验并输出格式化诊断报告
 */
export function validateDSL(input: unknown): DSLValidationResult {
  const result = FocusFlowDslSchema.safeParse(input);
  if (result.success) {
    return {
      valid: true,
      data: result.data as FocusFlowDSL,
      errors: [],
    };
  }

  const issues = result.error.issues || (result.error as any).errors || [];
  const errors: string[] = issues.map(
    (e: any) => `[${Array.isArray(e.path) ? e.path.join('.') : 'root'}]: ${e.message}`
  );

  const fieldErrors: Record<string, string[]> = {};
  for (const e of issues as any[]) {
    const path = Array.isArray(e.path) && e.path.length > 0 ? e.path.join('.') : 'root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(e.message);
  }

  return {
    valid: false,
    errors,
    fieldErrors,
  };
}
