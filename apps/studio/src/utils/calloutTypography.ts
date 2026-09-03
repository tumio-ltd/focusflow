/**
 * FocusFlow Callout 智能字号与尺寸自适应推导引擎
 * 根据关联架构节点尺寸与底图基准分辨率，在初始化时推荐最佳视觉协调的字号与宽度
 */

export interface AdaptiveCalloutStyleParams {
  viewportWidth: number;
  viewportHeight: number;
  targetBox?: {
    width: number;
    height: number;
  } | null;
}

export interface CalloutAdaptiveStyle {
  fontSize: number;
  titleFontSize: number;
  maxWidth: number;
}

/**
 * 混合自适应字号推导算法：
 * 1. 优先度 1：如果绑定了具体架构节点 (targetBox)，按照框元高度几何比例推导；
 * 2. 优先度 2：无绑定时，按照底图原生基准视口分辨率与 1920 基准进行阻尼缩放；
 */
export function calculateAdaptiveCalloutStyle(params: AdaptiveCalloutStyleParams): CalloutAdaptiveStyle {
  const { viewportWidth, viewportHeight, targetBox } = params;

  // 1. 优先度 1：若关联了目标框元 (Target Box)
  if (targetBox && targetBox.height > 0) {
    // 架构节点高度通常是字号的 3~4.5 倍
    const fontSize = Math.max(10, Math.min(24, Math.round(targetBox.height * 0.20)));
    const titleFontSize = Math.max(9, Math.min(20, Math.round(fontSize * 0.92)));
    const maxWidth = Math.max(240, Math.min(600, Math.round(Math.max(targetBox.width * 1.15, 300))));

    return {
      fontSize,
      titleFontSize,
      maxWidth,
    };
  }

  // 2. 优先度 2：无关联框元（自由浮动），根据底图基准分辨率 (以 1920 为基准) 动态缩放
  const maxDim = Math.max(viewportWidth || 1920, viewportHeight || 1080);
  const scaleRatio = Math.max(0.6, Math.min(3.0, maxDim / 1920));
  // 采用平方根阻尼，防止超高清分辨率下字号过大爆炸
  const dampedRatio = Math.sqrt(scaleRatio);

  const fontSize = Math.max(11, Math.min(26, Math.round(12 * dampedRatio)));
  const titleFontSize = Math.max(10, Math.min(22, Math.round(11 * dampedRatio)));
  const maxWidth = Math.max(260, Math.min(720, Math.round(320 * Math.pow(scaleRatio, 0.75))));

  return {
    fontSize,
    titleFontSize,
    maxWidth,
  };
}
