/**
 * FocusFlow Bézier Router & Topology Anchor System
 * Automatically resolves 8-way anchor coordinates and computes smooth Cubic Bézier control points
 */

export class BezierRouter {
  constructor(elementsMap) {
    this.elementsMap = elementsMap; // Map<id, { data, dom, type }>
  }

  /**
   * Resolves anchor specification string (e.g. "box-folio.right" or "box-postgres.left-top")
   * @param {string} anchorStr 
   * @returns {{ x: number, y: number, normal: { dx: number, dy: number } } | null}
   */
  resolveAnchor(anchorStr) {
    if (!anchorStr) return null;
    const parts = anchorStr.split('.');
    const boxId = parts[0];
    const anchorName = parts[1] || 'right';

    const boxMeta = this.elementsMap.get(boxId);
    if (!boxMeta || !boxMeta.data) {
      console.warn(`[FocusFlow] BezierRouter: Box "${boxId}" not found.`);
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
   * @param {string} fromStr 
   * @param {string} toStr 
   * @param {number} tension - Default 0.55
   * @returns {string} SVG Path d descriptor
   */
  route(fromStr, toStr, tension = 0.55) {
    const from = this.resolveAnchor(fromStr);
    const to = this.resolveAnchor(toStr);

    if (!from || !to) {
      return 'M 0 0';
    }

    const dx = Math.abs(to.x - from.x) * tension;
    const dy = Math.abs(to.y - from.y) * tension;

    let cp1x = from.x + from.normal.dx * dx;
    let cp1y = from.y + from.normal.dy * dy;
    let cp2x = to.x + to.normal.dx * dx;
    let cp2y = to.y + to.normal.dy * dy;

    // Handle horizontal alignment
    if (from.normal.dx !== 0 && to.normal.dx !== 0) {
      cp1y = from.y;
      cp2y = to.y;
    }

    return `M ${Math.round(from.x)} ${Math.round(from.y)} C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${Math.round(to.x)} ${Math.round(to.y)}`;
  }
}
