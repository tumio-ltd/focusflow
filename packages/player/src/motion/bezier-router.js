/**
 * FocusFlow Bézier Router & Topology Anchor System
 * Automatically resolves 8-way anchor coordinates and computes smooth Cubic Bézier control points
 */

export class BezierRouter {
  constructor(elementsMap, options = {}) {
    this.elementsMap = elementsMap; // Map<id, { data, dom, type }>
    this.debug = !!options.debug;
  }

  /**
   * Resolves anchor specification string (e.g. "box-folio.right" or "box-postgres.left-top")
   * @param {string} anchorStr 
   * @param {string} defaultAnchorName - Fallback anchor if not explicitly specified (default: 'right')
   * @returns {{ x: number, y: number, normal: { dx: number, dy: number } } | null}
   */
  resolveAnchor(anchorStr, defaultAnchorName = 'right') {
    if (!anchorStr) return null;
    const parts = anchorStr.split('.');
    const boxId = parts[0];
    const anchorName = parts[1] || defaultAnchorName;

    const boxMeta = this.elementsMap.get(boxId);
    if (!boxMeta || !boxMeta.data) {
      if (this.debug) {
        console.warn(`[FocusFlow] BezierRouter: Box "${boxId}" not found.`);
      }
      return null;
    }

    const box = boxMeta.data;
    const x = Number(box.x);
    const y = Number(box.y);
    const w = Number(box.width);
    const h = Number(box.height);

    switch (anchorName) {
      case 'left':
      case 'left-center':
        return { x: x, y: y + h / 2, normal: { dx: -1, dy: 0 } };
      case 'right':
      case 'right-center':
        return { x: x + w, y: y + h / 2, normal: { dx: 1, dy: 0 } };
      case 'top':
      case 'top-center':
        return { x: x + w / 2, y: y, normal: { dx: 0, dy: -1 } };
      case 'bottom':
      case 'bottom-center':
        return { x: x + w / 2, y: y + h, normal: { dx: 0, dy: 1 } };
      case 'left-top':
        return { x: x, y: y + h / 4, normal: { dx: -1, dy: 0 } };
      case 'left-bottom':
        return { x: x, y: y + (3 * h) / 4, normal: { dx: -1, dy: 0 } };
      case 'right-top':
        return { x: x + w, y: y + h / 4, normal: { dx: 1, dy: 0 } };
      case 'right-bottom':
        return { x: x + w, y: y + (3 * h) / 4, normal: { dx: 1, dy: 0 } };
      default:
        return { x: x + w, y: y + h / 2, normal: { dx: 1, dy: 0 } };
    }
  }

  /**
   * Automatically computes smooth Cubic Bézier path "d" between two anchors
   * If an anchor name is not explicitly specified (e.g. "boxA" instead of "boxA.right"),
   * the optimal anchor points (e.g. right -> left for horizontal flow, or bottom -> top for vertical)
   * are intelligently derived based on relative geometric positions.
   * @param {string} fromStr 
   * @param {string} toStr 
   * @param {number} tension - Default 0.55
   * @returns {string} SVG Path d descriptor
   */
  route(fromStr, toStr, tension = 0.55) {
    if (!fromStr || !toStr) return 'M 0 0';

    const fromParts = fromStr.split('.');
    const toParts = toStr.split('.');
    const fromBoxId = fromParts[0];
    const toBoxId = toParts[0];

    let defaultFromAnchor = 'right';
    let defaultToAnchor = 'left';

    // 智能推导相对空间位置：水平主导默认 right ➔ left，垂直主导默认 bottom ➔ top
    const boxAMeta = this.elementsMap.get(fromBoxId);
    const boxBMeta = this.elementsMap.get(toBoxId);

    if (boxAMeta?.data && boxBMeta?.data) {
      const boxA = boxAMeta.data;
      const boxB = boxBMeta.data;
      const centerAx = Number(boxA.x) + Number(boxA.width) / 2;
      const centerAy = Number(boxA.y) + Number(boxA.height) / 2;
      const centerBx = Number(boxB.x) + Number(boxB.width) / 2;
      const centerBy = Number(boxB.y) + Number(boxB.height) / 2;

      const dx = centerBx - centerAx;
      const dy = centerBy - centerAy;

      if (Math.abs(dx) >= Math.abs(dy)) {
        defaultFromAnchor = dx >= 0 ? 'right' : 'left';
        defaultToAnchor = dx >= 0 ? 'left' : 'right';
      } else {
        defaultFromAnchor = dy >= 0 ? 'bottom' : 'top';
        defaultToAnchor = dy >= 0 ? 'top' : 'bottom';
      }
    }

    const from = this.resolveAnchor(fromStr, defaultFromAnchor);
    const to = this.resolveAnchor(toStr, defaultToAnchor);

    if (!from || !to) {
      return 'M 0 0';
    }

    const dx = Math.abs(to.x - from.x) * tension;
    const dy = Math.abs(to.y - from.y) * tension;

    let cp1x = from.x + from.normal.dx * dx;
    let cp1y = from.y + from.normal.dy * dy;
    let cp2x = to.x + to.normal.dx * dx;
    let cp2y = to.y + to.normal.dy * dy;

    // Handle horizontal or vertical alignment
    if (from.normal.dx !== 0 && to.normal.dx !== 0) {
      cp1y = from.y;
      cp2y = to.y;
    } else if (from.normal.dy !== 0 && to.normal.dy !== 0) {
      cp1x = from.x;
      cp2x = to.x;
    }

    return `M ${Math.round(from.x)} ${Math.round(from.y)} C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${Math.round(to.x)} ${Math.round(to.y)}`;
  }
}
