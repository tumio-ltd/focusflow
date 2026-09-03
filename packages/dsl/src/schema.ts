/**
 * FocusFlow Standard JSON DSL (Domain Specific Language) Type Definitions
 * Phase 1 (MVP) & Phase 2 (Studio) Specification
 */

export interface FocusFlowDSL {
  $schema?: string;
  meta: {
    title: string;
    viewport: { width: number; height: number };
    theme?: {
      mode?: 'dark' | 'light' | 'auto';
      bg?: string;
      accent?: string;
      warn?: string;
      green?: string;
      amber?: string;
      [key: string]: string | undefined;
    };
    controls?: {
      showControls?: boolean; // 是否展示独立播放器悬浮控制栏 (默认 true)
      autoplay?: boolean;      // 页面加载后是否默认自动循环播放 (默认 false)
      interval?: number;      // 自动轮播每屏停留时长 (毫秒，默认 3800ms)
      showPlayBtn?: boolean;  // 是否展示播放/暂停按钮 (默认 true)
      showCounter?: boolean;  // 是否展示场景序号指示器如 01/05 (默认 true)
      showProgress?: boolean; // 是否展示顶部进度条 (默认 true)
      showHUDButton?: boolean;// 是否在控制栏展示标定助手按钮 (默认 true)
    };
  };
  asset: {
    url: string; // 图像相对路径、绝对路径或 Base64
  };
  elements: {
    boxes: ElementBox[];
    paths: ElementPath[];
    dots?: ElementDot[];
    images?: ElementImage[];
  };
  scenes: SceneStep[];
}

export interface ElementBox {
  id: string;
  type: 'rect' | 'circle' | 'polygon';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    glow?: boolean;
    fill?: string;
    dashLength?: number;
  };
}

export interface ElementPath {
  id: string;
  from?: string; // 格式: "boxId.anchorName", 例如 "box-folio.right"
  to?: string;   // 格式: "boxId.anchorName", 例如 "box-postgres.left-top"
  d?: string;    // 手动指定的 SVG 路径 (若省略则由引擎自动推导三次贝塞尔)
  style?: {
    stroke?: string;
    strokeWidth?: number;
    mode?: 'draw' | 'stream' | 'pulse'; // 动画模式
    speed?: number;
    flowSpeed?: number;
    glow?: boolean;
  };
}

export interface ElementDot {
  id: string;
  cx: number;
  cy: number;
  r?: number;
  style?: {
    fill?: string;
    glow?: boolean;
    pulse?: boolean;
  };
}

export interface ElementImage {
  id: string;
  url: string;        // 覆盖图片相对路径、绝对路径或 Base64
  x: number;          // 在画布绝对逻辑坐标系下的 X
  y: number;          // 在画布绝对逻辑坐标系下的 Y
  width: number;      // 宽度
  height: number;     // 高度
  style?: {
    borderRadius?: number; // 圆角大小 (像素)
    boxShadow?: boolean | string;   // 是否启用悬浮立体投影或自定义投影
    animation?: 'fade' | 'zoom-fade' | 'slide-up'; // 出现动效
    border?: string;      // 发光边框
    opacity?: number;     // 目标不透明度 (默认 1.0)
  };
}

export interface CalloutItem {
  id: string;
  targetBoxId?: string;
  position: { left: string; top: string };
  theme?: 'blue' | 'pink' | 'green' | 'amber' | string;
  title: string;
  desc: string;
  titleI18n?: Record<string, string>; // 双语国际化: { zh: "鉴权中心", en: "Auth Center" }
  descI18n?: Record<string, string>;
  style?: {
    fontSize?: number;        // 正文字体大小 (px，默认 12)
    titleFontSize?: number;   // 标题徽章字体大小 (px，默认 11)
    maxWidth?: number;        // 气泡最大宽度 (px，默认 320)
  };
}

export interface SceneStep {
  id: string;
  title: string;
  titleI18n?: Record<string, string>;
  camera: {
    zoom: number;       // 缩放倍率 (1.0 ~ 3.0)
    x: number;          // 水平偏移百分比 (-50 ~ 50)
    y: number;          // 垂直偏移百分比 (-50 ~ 50)
    duration?: number;  // 运镜过渡时长 (秒，默认 1.2s)
  };
  activeElements: {
    boxes?: string[];
    paths?: string[];
    dots?: string[];
    images?: string[];  // 当前场景激活的覆盖图片 ID 列表
    callouts?: CalloutItem[];
  };
}

export interface PlayerOptions {
  container: string | HTMLElement;
  dsl: FocusFlowDSL;
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
  onSceneChange?: (sceneIndex: number, scene: SceneStep) => void;
}
