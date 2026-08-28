/**
 * FocusFlow Geometry Calculator
 * Computes exact perimeters, arc lengths, and bounding dimensions
 */

export class GeometryCalculator {
  constructor(svgElement, baseWidth = 5120, baseHeight = 2880) {
    this.svg = svgElement;
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
  }

  /**
   * Computes precise closed perimeter of a rounded rectangle
   * Formula: P = 2 * (w + h) - (8 - 2 * PI) * rx
   * @param {Object} box - { width: number, height: number, rx?: number }
   * @returns {number}
   */
  getBoxPerimeter(box) {
    const w = Number(box.width) || 0;
    const h = Number(box.height) || 0;
    const rx = Number(box.rx) || 0;

    if (rx <= 0) {
      return 2 * (w + h);
    }

    // (8 - 2 * Math.PI) ≈ 1.71681469
    const cornerAdjustment = (8 - 2 * Math.PI) * rx;
    const perimeter = 2 * (w + h) - cornerAdjustment;
    return Math.ceil(perimeter) + 20; // Add 20px padding to avoid sub-pixel seam
  }

  /**
   * Computes circle perimeter
   * @param {number} radius 
   * @returns {number}
   */
  getCirclePerimeter(radius) {
    return Math.ceil(2 * Math.PI * radius);
  }

  /**
   * Computes physical length of any SVG Path element
   * @param {SVGPathElement} pathEl 
   * @returns {number}
   */
  getPathLength(pathEl) {
    if (!pathEl || typeof pathEl.getTotalLength !== 'function') return 1000;
    try {
      return Math.ceil(pathEl.getTotalLength()) + 20;
    } catch {
      return 1000;
    }
  }
}
