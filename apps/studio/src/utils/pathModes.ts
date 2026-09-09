import { Waves, PenTool, Activity } from 'lucide-react';

export type PathFlowModeId = 'stream' | 'draw' | 'pulse';

export interface PathFlowModeConfig {
  id: PathFlowModeId;
  shortLabel: string;
  label: string;
  icon: typeof Waves;
  desc: string;
}

/**
 * 连线动画流动模式单一真理源配置 (Single Source of Truth)
 * 严格保证画布悬浮工具栏 (PathTransformOverlay) 与右侧检查器 (RightInspector) 的模式顺序、图标与文案完全一致
 */
export const PATH_FLOW_MODES: PathFlowModeConfig[] = [
  {
    id: 'stream',
    shortLabel: '流光',
    label: '🌊 流光粒子',
    icon: Waves,
    desc: '能量粒子沿虚线高速流动 (Stream)',
  },
  {
    id: 'draw',
    shortLabel: '绘制',
    label: '✍️ 生长绘制',
    icon: PenTool,
    desc: '沿路径延时生长画入 (Draw)',
  },
  {
    id: 'pulse',
    shortLabel: '律动',
    label: '💓 呼吸律动',
    icon: Activity,
    desc: '整条连线呼吸发光 (Pulse)',
  },
];
