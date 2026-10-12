/**
 * FocusFlow Motion Animator & Staggered Pipeline
 * Coordinates stroke-dashoffset transitions, streaming dashed paths, and staggered callout arrivals
 */

export class MotionAnimator {
  constructor(elementsMap, calloutsMap) {
    this.elementsMap = elementsMap; // Map<id, { data, dom, type, perimeter?, length? }>
    this.calloutsMap = calloutsMap; // Map<id, { data, dom }>
  }

  /**
   * Resets all visual elements to their hidden/un-drawn initial state
   */
  resetAll() {
    // 1. Reset SVG Elements
    this.elementsMap.forEach((meta) => {
      const el = meta.dom;
      el.style.transition = 'none';
      el.classList.remove('active', 'ff-stream', 'ff-path-pulse');

      if (meta.type === 'box') {
        el.style.strokeDashoffset = `${meta.perimeter}`;
        el.style.opacity = '0';
      } else if (meta.type === 'path') {
        el.style.strokeDashoffset = `${meta.length}`;
        el.style.opacity = '0';
      } else if (meta.type === 'dot') {
        el.style.opacity = '0';
      } else if (meta.type === 'image') {
        el.style.opacity = '0';
        el.classList.remove('active');
      }
    });

    // 2. Reset Callouts
    this.calloutsMap.forEach((meta) => {
      const el = meta.dom;
      el.style.transition = 'none';
      el.classList.remove('active');
      el.style.opacity = '0';
    });
  }

  /**
   * Activates elements for the current scene step
   * @param {Object} activeElements - { boxes?: string[], paths?: string[], dots?: string[], images?: string[], callouts?: Object[] }
   * @param {Object} [options] - Optional transition parameters { cameraDuration?: number, animate?: boolean }
   */
  activate(activeElements = {}, options = {}) {
    const { boxes = [], paths = [], dots = [], images = [], callouts = [] } = activeElements;
    const { cameraDuration = 1.2, animate = true } = options;

    // 1. Animate Active Boxes
    boxes.forEach((boxId, index) => {
      const meta = this.elementsMap.get(boxId);
      if (meta && meta.dom) {
        const el = meta.dom;
        const delay = 0.15 + index * 0.1;
        el.style.transition = `stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, opacity 0.4s ease ${delay}s`;
        el.classList.add('active');
        el.style.strokeDashoffset = '0';
        el.style.opacity = '0.95';
      }
    });

    // 2. Animate Active Paths
    paths.forEach((pathId, index) => {
      const meta = this.elementsMap.get(pathId);
      if (meta && meta.dom) {
        const el = meta.dom;
        const delay = 0.35 + index * 0.15;
        const mode = meta.data.style?.mode || 'draw';

        if (mode === 'stream') {
          // Flowing Dashed Stream
          el.style.strokeDasharray = '';
          el.style.strokeDashoffset = '';
          el.style.transition = `opacity 0.4s ease ${delay}s`;
          el.style.opacity = '0.95';
          if (meta.data.style?.flowSpeed) {
            el.style.animationDuration = `${(1.5 / meta.data.style.flowSpeed).toFixed(2)}s`;
          }
          el.classList.remove('ff-path-pulse');
          el.classList.add('active', 'ff-stream');
        } else if (mode === 'pulse') {
          // Glowing Pulse (Solid line with neon breathing opacity)
          el.style.strokeDasharray = 'none';
          el.style.strokeDashoffset = '0';
          el.style.transition = `opacity 0.4s ease ${delay}s`;
          el.style.opacity = '0.95';
          el.classList.remove('ff-stream');
          el.classList.add('active', 'ff-path-pulse');
        } else {
          // One-shot Draw-in (Solid line drawn sequentially from start to end)
          el.classList.remove('ff-stream', 'ff-path-pulse');
          el.style.strokeDasharray = `${meta.length}`;
          el.style.strokeDashoffset = `${meta.length}`;
          void el.getBoundingClientRect(); // trigger reflow
          el.style.transition = `stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, opacity 0.4s ease ${delay}s`;
          el.classList.add('active');
          el.style.strokeDashoffset = '0';
          el.style.opacity = '0.95';
        }
      }
    });

    // 3. Animate Active Dots
    dots.forEach((dotId) => {
      const meta = this.elementsMap.get(dotId);
      if (meta && meta.dom) {
        const el = meta.dom;
        el.style.transition = 'opacity 0.6s ease 0.6s';
        if (meta.data.style?.pulse === false) {
          el.style.animation = 'none';
        } else {
          el.style.animation = '';
        }
        el.classList.add('active');
        el.style.opacity = '1';
      }
    });

    // 4. Animate Active Dynamic Images
    images.forEach((imgId, index) => {
      const meta = this.elementsMap.get(imgId);
      if (meta && meta.dom) {
        const el = meta.dom;
        const delay = 0.25 + index * 0.15;
        const targetOpacity = meta.data.style?.opacity ?? 1.0;
        el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`;
        el.classList.add('active');
        el.style.opacity = `${targetOpacity}`;
      }
    });

    // 5. Staggered Callouts Arrival (Camera-First Orchestration)
    // When camera is moving/transitioning, delay callouts until camera settles (T_base = cameraDuration)
    // If no camera duration (e.g. 0s or instantaneous jump), use an immediate crisp delay (0.15s)
    const baseCalloutDelay = cameraDuration > 0 ? cameraDuration : 0.15;

    callouts.forEach((calloutData, index) => {
      const calloutId = typeof calloutData === 'string' ? calloutData : calloutData?.id;
      const meta = this.calloutsMap.get(calloutId);
      if (meta && meta.dom) {
        const el = meta.dom;
        const delay = Number((baseCalloutDelay + index * 0.2).toFixed(3)); // Stagger formula: T_delay = T_camera + i * Delta_T

        // Check if position is near right edge (left > 70%) and adjust origin
        const rawLeft = meta.data?.position?.left || (typeof calloutData === 'object' ? calloutData?.position?.left : '50%');
        const leftPercent = String(rawLeft).endsWith('%') ? parseFloat(rawLeft) : 50;
        if (leftPercent > 70) {
          el.style.transformOrigin = 'right center';
        } else {
          el.style.transformOrigin = 'left center';
        }

        // Crisp 0.4s fade-in & slide-up once camera motion has fully stabilized
        el.style.transition = `opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`;
        el.classList.add('active');
        el.style.opacity = '1';
      }
    });
  }
}
