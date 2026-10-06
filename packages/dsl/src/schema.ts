/**
 * FocusFlow Standard JSON DSL (Domain Specific Language) Type Definitions
 * Single Source of Truth (SSOT) AST specification adhering to spec 11-dsl-schema.md
 */

/**
 * 标称视口画幅配置 (Viewport)
 * 物理底图固有尺寸驱动的最高真理源 (SSOT)
 */
export interface DslViewport {
  /** 底图决定的绝对设计物理宽度 (px) */
  width: number;
  /** 底图决定的绝对设计物理高度 (px) */
  height: number;
  /** 标称画幅比锁定 */
  aspectRatio?: '16:9' | '16:10' | '4:3' | '9:16' | string;
}
export type DSLViewport = DslViewport;

/**
 * 视觉主题配置
 */
export interface DslTheme {
  mode?: 'dark' | 'light' | 'auto';
  bg?: string;
  accent?: string;
  warn?: string;
  green?: string;
  amber?: string;
  [key: string]: string | undefined;
}
export type DSLTheme = DslTheme;

/**
 * 播放控制器显示与行为配置
 */
export interface DslControls {
  showControls?: boolean; // 是否展示独立播放器悬浮控制栏 (默认 true)
  autoplay?: boolean; // 页面加载后是否默认自动循环播放 (默认 false)
  interval?: number; // 自动轮播每屏停留时长 (毫秒，默认 3800ms)
  showPlayBtn?: boolean; // 是否展示播放/暂停按钮 (默认 true)
  showCounter?: boolean; // 是否展示场景序号指示器如 01/05 (默认 true)
  showProgress?: boolean; // 是否展示顶部进度条 (默认 true)
  showHUDButton?: boolean; // 是否在控制栏展示标定助手按钮 (默认 true)
}
export type DSLControls = DslControls;

/**
 * 项目与视口全局元数据配置
 */
export interface DslMeta {
  title: string;
  viewport: DslViewport;
  theme?: DslTheme;
  controls?: DslControls;
}
export type DSLMeta = DslMeta;

/**
 * 项目底图资产定义
 */
export interface DslAsset {
  /** 底图资源 URI (支持 Presigned S3/R2 URL、相对路径或 Base64 Data URI) */
  url: string;
  /** 底图原始文件名称 (可选) */
  name?: string;
  /** 资源唯一指纹哈希 (可选，SHA-256) */
  hash?: string;
  /** 多语言底图映射 */
  urlI18n?: {
    zh?: string;
    en?: string;
    [lang: string]: string | undefined;
  };
}
export type DSLAsset = DslAsset;

/**
 * 几何高亮选框节点样式配置
 */
export interface DslNodeStyle {
  stroke?: string; // 边框描边颜色，支持 HEX / RGB / CSS 变量
  strokeWidth?: number; // 描边宽度 (px，默认 2)
  glow?: boolean; // 是否启用外发光霓虹特效
  fill?: string; // 内部遮罩或半透明填充色
  dashLength?: number; // 虚线描边步长 (0 或空为实线)
}

/**
 * 几何高亮选框节点 (DslNode / ElementBox)
 * 支持矩形、圆形、多边形
 */
export interface DslNode {
  id: string; // 唯一图元标识，如 "box-auth-service"
  type: 'rect' | 'circle' | 'polygon';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number; // X 轴圆角半径
  ry?: number; // Y 轴圆角半径
  style?: DslNodeStyle;
}
export type ElementBox = DslNode;
export type DslBox = DslNode;

/**
 * 矢量流向飞线连接器样式配置
 */
export interface DslConnectorStyle {
  stroke?: string;
  strokeWidth?: number;
  mode?: 'draw' | 'stream' | 'pulse'; // 动画模式: 线条绘制 / 粒子流光 / 整体脉冲
  speed?: number; // 粒子流光动画速度
  flowSpeed?: number;
  glow?: boolean;
}

/**
 * 矢量流向飞线连接器 (DslConnector / ElementPath)
 * 贝塞尔曲线或锚点连接
 */
export interface DslConnector {
  id: string; // 如 "path-api-to-redis"
  /** 起点锚点，格式: "boxId.anchorName", 如 "box-folio.right" */
  from?: string;
  /** 终点锚点，格式: "boxId.anchorName", 如 "box-postgres.left-top" */
  to?: string;
  /** 手动指定的三次贝塞尔 SVG 路径 (若省略则由引擎基于锚点自动平滑推导) */
  d?: string;
  style?: DslConnectorStyle;
}
export type ElementPath = DslConnector;
export type DslPath = DslConnector;

/**
 * 脉冲指示标定点 (DslDot / ElementDot)
 */
export interface DslDot {
  id: string;
  cx: number;
  cy: number;
  r?: number; // 半径 (px，默认 6)
  style?: {
    fill?: string;
    glow?: boolean;
    pulse?: boolean; // 是否开启呼吸光晕动画
  };
}
export type ElementDot = DslDot;

/**
 * 画布局部悬浮贴片/覆盖图 (DslImage / ElementImage)
 */
export interface DslImage {
  id: string;
  url: string; // 覆盖图片相对路径、绝对路径或 Base64
  x: number; // 在画布绝对逻辑坐标系下的 X
  y: number; // 在画布绝对逻辑坐标系下的 Y
  width: number; // 宽度
  height: number; // 高度
  style?: {
    borderRadius?: number; // 圆角大小 (像素)
    boxShadow?: boolean | string; // 是否启用悬浮立体投影或自定义投影
    animation?: 'fade' | 'zoom-fade' | 'slide-up'; // 出现动效
    border?: string; // 发光边框
    opacity?: number; // 目标不透明度 (默认 1.0)
  };
}
export type ElementImage = DslImage;

/**
 * 架构解说悬浮气泡卡片标注 (DslAnnotation / CalloutItem)
 */
export interface DslAnnotation {
  id: string;
  targetBoxId?: string; // 关联图元 ID (可选，用于计算引导线)
  position: {
    left: string; // CSS 百分比或 px 定位，如 "34.5%"
    top: string;
  };
  theme?: 'blue' | 'pink' | 'green' | 'amber' | string;
  title: string;
  desc: string;
  titleI18n?: Record<string, string>; // 多语言标题映射: { zh: "鉴权中心", en: "Auth Center" }
  descI18n?: Record<string, string>;
  style?: {
    fontSize?: number; // 正文字体大小 (px，默认 12)
    titleFontSize?: number; // 标题徽章字体大小 (px，默认 11)
    maxWidth?: number; // 气泡最大宽度 (px，默认 320)
  };
}
export type CalloutItem = DslAnnotation;
export type DslCallout = DslAnnotation;

/**
 * 画布底层图元库
 */
export interface DslElements {
  boxes: DslNode[];
  paths: DslConnector[];
  dots?: DslDot[];
  images?: DslImage[];
}
export type DSLElements = DslElements;

/**
 * 分幕运镜摄像机构造
 */
export interface DslCamera {
  zoom: number; // 缩放倍率 (1.0 ~ 3.0)
  x: number; // 水平偏移百分比 (-50 ~ 50)
  y: number; // 垂直偏移百分比 (-50 ~ 50)
  duration?: number; // 运镜过渡时长 (秒，默认 1.2s)
}

/**
 * 分幕专属物理音频实体
 */
export interface SceneVoiceoverAudio {
  url: string; // 音频资源 (Blob URL / Data URI / 相对路径)
  durationMs: number; // 该分幕物理音频的实际时长 (毫秒)
  sampleRate?: number; // 采样率 (如 24000 或 44100)
  voiceId?: string; // 合成发音人标识 (如 Puck, Fenrir)
  model?: string; // 合成模型 (如 gemini-3.1-flash-tts-preview)
  adaptedDuration?: number; // 该分幕自适应推荐时长 (含呼吸留白)
}
export type DslVoiceoverAudio = SceneVoiceoverAudio;

/**
 * 动态多模态分幕步进序列单元 (DslScene / SceneStep)
 */
export interface DslScene {
  id: string; // 分幕 ID，如 "scene-01-gateway"
  title: string;
  titleI18n?: Record<string, string>;
  duration?: number; // 场景驻留停留时长 (毫秒，缺省使用 meta.controls.interval)
  voiceoverScript?: string; // AI 提词台词 / 分幕旁白脚本
  voiceoverScriptI18n?: Record<string, string>; // 多语言配音脚本
  voiceoverAudio?: SceneVoiceoverAudio; // 专属物理音频实体
  camera: DslCamera;
  activeElements: {
    boxes?: string[]; // 激活的高亮选框 ID 列表
    paths?: string[]; // 激活的动画流光飞线 ID 列表
    dots?: string[]; // 激活的指示点 ID 列表
    images?: string[]; // 激活展示的悬浮贴图 ID 列表
    callouts?: DslAnnotation[]; // 随该场景弹出的悬浮解释卡片列表
  };
}
export type SceneStep = DslScene;

/**
 * 音频标记锚点
 */
export interface AudioMarker {
  id: string;
  timeMs: number;
  label: string;
  sceneIndex?: number;
}
export type DslAudioMarker = AudioMarker;

export type AudioTrackRole = 'voiceover' | 'music' | 'sfx' | 'offline-tts';
export type DslAudioTrackRole = AudioTrackRole;

/**
 * 音轨实体配置
 */
export interface AudioTrackConfig {
  id: string;
  url: string; // 本地 blob URL、相对路径、HTTP(S) 或 Base64 Data URI
  name?: string;
  durationMs: number;
  volume?: number; // 0.0 ~ 1.0 (默认 1.0)
  muted?: boolean;
  type?: AudioTrackRole;
  isOfflineTTS?: boolean;
  isBackgroundBGM?: boolean; // 便捷布尔标识，指示该音轨是否作为低音量背景音乐
  markers?: AudioMarker[];
  vadSilences?: Array<{ startMs: number; endMs: number; centerMs?: number }>; // VAD 智能停顿带
}
export type DslAudioTrack = AudioTrackConfig;

/**
 * 多轨混音器设置
 */
export interface AudioMixerSettings {
  masterVolume?: number; // 0.0 ~ 1.0 (默认 1.0)
  enableDucking?: boolean; // 语音避让/闪避
  duckingDb?: number; // 衰减分贝，默认 -12dB
}
export type DslAudioMixer = AudioMixerSettings;

/**
 * 完整多音轨与混音器
 */
export interface DslAudio {
  tracks: AudioTrackConfig[];
  mixer?: AudioMixerSettings;
}
export type DSLAudio = DslAudio;

/**
 * FocusFlow 标准抽象语法树根节点 (FocusFlowDslRoot / FocusFlowDSL)
 * Single Source of Truth (SSOT)
 */
export interface FocusFlowDslRoot {
  $schema?: string;
  /** 语法树契约版本，格式为语义化 SemVer，如 "1.0.0" */
  schemaVersion?: string;
  /** 项目与视口全局元数据配置 */
  meta: DslMeta;
  /** 项目底图资产定义 */
  asset: DslAsset;
  /** 画布底层图元库 */
  elements: DslElements;
  /** 动态多模态分幕编排序列 */
  scenes: DslScene[];
  /** 可选多音轨配置与智能混音器 */
  audio?: DslAudio;
}
export type FocusFlowDSL = FocusFlowDslRoot;

/**
 * 播放器配置选项
 */
export interface PlayerOptions {
  container: string | HTMLElement;
  dsl: FocusFlowDSL;
  initialSceneIndex?: number;
  debug?: boolean;
  basePath?: string;
  autoplay?: boolean;
  autoPlayInterval?: number;
  enableKeyboard?: boolean;
  disableCamera?: boolean;
  showControls?: boolean;
  showPlayBtn?: boolean;
  showCounter?: boolean;
  showProgress?: boolean;
  showHUDButton?: boolean;
  audioSync?: boolean; // 是否启用音频主时钟锁相环同步
  lang?: 'zh' | 'en' | string; // 播放器默认显示语言 (zh / en)
  onSceneChange?: (sceneIndex: number, scene: SceneStep) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
}
