import type { ElementBox } from '@focusflow/dsl';

export type AnchorPosition = 
  | 'left' 
  | 'right' 
  | 'top' 
  | 'bottom' 
  | 'left-top' 
  | 'left-bottom' 
  | 'right-top' 
  | 'right-bottom';

export interface ResolvedAnchor {
  x: number;
  y: number;
  normal: { dx: number; dy: number };
  boxId: string;
  anchorName: AnchorPosition;
}

/**
 * 计算单个选框的 8 向锚点绝对物理坐标与法向量
 */
export function getBoxAnchors(box: ElementBox): ResolvedAnchor[] {
  const x = Number(box.x);
  const y = Number(box.y);
  const w = Number(box.width);
  const h = Number(box.height);

  return [
    { x: x + w, y: y + h / 2, normal: { dx: 1, dy: 0 }, boxId: box.id, anchorName: 'right' },
    { x: x, y: y + h / 2, normal: { dx: -1, dy: 0 }, boxId: box.id, anchorName: 'left' },
    { x: x + w / 2, y: y, normal: { dx: 0, dy: -1 }, boxId: box.id, anchorName: 'top' },
    { x: x + w / 2, y: y + h, normal: { dx: 0, dy: 1 }, boxId: box.id, anchorName: 'bottom' },
    { x: x, y: y + h / 4, normal: { dx: -1, dy: 0 }, boxId: box.id, anchorName: 'left-top' },
    { x: x, y: y + (3 * h) / 4, normal: { dx: -1, dy: 0 }, boxId: box.id, anchorName: 'left-bottom' },
    { x: x + w, y: y + h / 4, normal: { dx: 1, dy: 0 }, boxId: box.id, anchorName: 'right-top' },
    { x: x + w, y: y + (3 * h) / 4, normal: { dx: 1, dy: 0 }, boxId: box.id, anchorName: 'right-bottom' },
  ];
}

/**
 * 依据锚点字符串 (如 "box-nginx.right") 解析绝对坐标
 */
export function resolveBoxAnchor(boxes: ElementBox[], anchorSpec: string): ResolvedAnchor | null {
  if (!anchorSpec) return null;
  const parts = anchorSpec.split('.');
  const boxId = parts[0];
  const anchorName = (parts[1] || 'right') as AnchorPosition;

  const box = boxes.find((b) => b.id === boxId);
  if (!box) return null;

  const anchors = getBoxAnchors(box);
  return anchors.find((a) => a.anchorName === anchorName) || anchors[0] || null;
}

/**
 * 在所有选框中寻找距离鼠标点最近的吸附锚点
 */
export function findClosestAnchor(
  point: { x: number; y: number },
  boxes: ElementBox[],
  maxDistance = 36
): ResolvedAnchor | null {
  let closest: ResolvedAnchor | null = null;
  let minDistance = maxDistance;

  for (const box of boxes) {
    const anchors = getBoxAnchors(box);
    for (const anchor of anchors) {
      const dist = Math.hypot(anchor.x - point.x, anchor.y - point.y);
      if (dist < minDistance) {
        minDistance = dist;
        closest = anchor;
      }
    }
  }

  return closest;
}

/**
 * 动态计算平滑三次贝塞尔曲线 SVG Path d 描述符
 */
export function computeCubicBezierPath(
  from: { x: number; y: number; normal?: { dx: number; dy: number } },
  to: { x: number; y: number; normal?: { dx: number; dy: number } },
  tension = 0.55
): string {
  const normFrom = from.normal || { dx: 1, dy: 0 };
  const normTo = to.normal || { dx: -1, dy: 0 };

  const dist = Math.max(Math.hypot(to.x - from.x, to.y - from.y) * tension, 40);

  const cp1x = from.x + normFrom.dx * dist;
  const cp1y = from.y + normFrom.dy * dist;
  const cp2x = to.x + normTo.dx * dist;
  const cp2y = to.y + normTo.dy * dist;

  return `M ${Math.round(from.x)} ${Math.round(from.y)} C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${Math.round(to.x)} ${Math.round(to.y)}`;
}
