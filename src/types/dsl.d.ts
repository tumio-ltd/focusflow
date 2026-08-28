/**
 * FocusFlow Standard JSON DSL (Domain Specific Language) Type Definitions
 * Phase 1 (MVP) Specification
 */

export interface FocusFlowDSL {
  $schema?: string;
  meta: {
    title: string;
    viewport: { width: number; height: number };
    theme?: {
      bg?: string;
      accent?: string;
      warn?: string;
      green?: string;
      amber?: string;
      [key: string]: string | undefined;
    };
  };
  asset: {
    url: string; // 图像相对路径、绝对路径或 Base64
  };
  elements: {
    boxes: ElementBox[];
    paths: ElementPath[];
    dots?: ElementDot[];
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

export interface CalloutItem {
  id: string;
  targetBoxId?: string;
  position: { left: string; top: string };
  theme?: 'blue' | 'pink' | 'green' | 'amber' | string;
  title: string;
  desc: string;
}

export interface SceneStep {
  id: string;
  title: string;
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
    callouts?: CalloutItem[];
  };
}

export interface PlayerOptions {
  container: string | HTMLElement;
  dsl: FocusFlowDSL;
  debug?: boolean;
  autoPlayInterval?: number;
  onSceneChange?: (sceneIndex: number, scene: SceneStep) => void;
}
