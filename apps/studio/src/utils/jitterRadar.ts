/**
 * FocusFlow Jitter Radar (抖动侦测雷达)
 * 实时监测并打印页面中任何 DOM 元素的亚像素几何位移、布局漂移 (CLS) 及滚动抖动
 */

export function initJitterRadar() {
  if (typeof window === 'undefined') return;

  console.log(
    '%c[FocusFlow] 🎯 全局抖动侦测雷达 (Jitter Radar) 已就绪！%c 任何微小位移或布局漂移都将在控制台实时预警。',
    'background: #0284c7; color: #fff; font-weight: bold; padding: 2px 6px; rounded: 4px;',
    'color: #38bdf8;'
  );

  // 1. W3C 标准 Layout Shift (CLS 漂移) 探测
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // 仅捕捉非用户点击触发的非预期自发漂移 (排除正常的模态框弹窗或折叠展开等用户主动点击操作)
        if (!entry.hadRecentInput && entry.value > 0.005) {
          const sources = (entry.sources || []).map((s: any) => ({
            tag: s.node?.nodeName,
            class: s.node?.className,
            from: s.previousRect,
            to: s.currentRect,
          }));
          console.warn(
            `%c[JITTER 捕获 - W3C 布局漂移] 偏移分值: ${entry.value.toFixed(4)}`,
            'color: #f43f5e; font-weight: bold;',
            sources
          );
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // 忽略不受支持的浏览器
  }

  // 2. 核心大区高频几何位置（BoundingClientRect）逐帧比对
  const trackedSelectors = [
    'header',
    '[data-testid="toolbox"]',
    '[data-testid="inspector"]',
    '[data-testid="timeline"]',
    '[data-testid="canvas-viewport"]',
    '[data-testid="infinite-canvas-container"]',
    '.origin-top-left',
    '[data-testid="camera-frustum-frame"]',
  ];

  const prevRects = new Map<string, { x: number; y: number; width: number; height: number }>();

  let isEnabled = true;
  const startTime = Date.now();

  function monitorGeometry() {
    if (isEnabled) {
      const isWarmingUp = Date.now() - startTime < 1500;
      for (const sel of trackedSelectors) {
        const el = document.querySelector(sel);
        if (!el) continue;

        const r = el.getBoundingClientRect();
        const prev = prevRects.get(sel);

        if (prev && !isWarmingUp) {
          const dx = +(r.x - prev.x).toFixed(2);
          const dy = +(r.y - prev.y).toFixed(2);
          const dw = +(r.width - prev.width).toFixed(2);
          const dh = +(r.height - prev.height).toFixed(2);

          // 灵敏度阈值：检测大于 0.2px 的物理位移
          if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2 || Math.abs(dw) > 0.2 || Math.abs(dh) > 0.2) {
            const parentTransform = (el.parentElement as HTMLElement)?.style?.transform || '';
            const inlineLeft = (el as HTMLElement)?.style?.left || '';
            const inlineTop = (el as HTMLElement)?.style?.top || '';
            const isParentShifting = Math.abs(dx) > 0 && Math.abs(dy) > 0 && parentTransform !== '';

            console.warn(
              `%c[JITTER 捕获 - 几何位移] %c${sel} 位移: dx=${dx}px, dy=${dy}px (当前: x=${r.x.toFixed(1)}, y=${r.y.toFixed(1)})`,
              'background: #e11d48; color: #fff; font-weight: bold; padding: 1px 4px; border-radius: 3px;',
              'color: #fda4af; font-weight: bold;',
              {
                位移数值: { dx: `${dx}px`, dy: `${dy}px`, dw: `${dw}px`, dh: `${dh}px` },
                根因诊断: isParentShifting 
                  ? `[画布矩阵在移动] 父级容器 transform = "${parentTransform}"` 
                  : `[元素自身内联样式在变动] inline: left=${inlineLeft}, top=${inlineTop}`,
                当前DOM坐标: { x: r.x, y: r.y, width: r.width, height: r.height },
                上一帧坐标: prev,
              }
            );
          }
        }

        prevRects.set(sel, { x: r.x, y: r.y, width: r.width, height: r.height });
      }
    }
    requestAnimationFrame(monitorGeometry);
  }

  requestAnimationFrame(monitorGeometry);

  // 3. 根视口意外滚动拦截与预警
  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        console.warn(
          `%c[JITTER 捕获 - 窗口滚动] %cWindow 发生了意外滚动！`,
          'background: #f59e0b; color: #000; font-weight: bold; padding: 1px 4px;',
          'color: #fbbf24;',
          { scrollX: window.scrollX, scrollY: window.scrollY }
        );
      }
    },
    { passive: true }
  );

  // 挂载到 window 方便用户在控制台手动控制
  (window as any).__toggleJitterRadar = () => {
    isEnabled = !isEnabled;
    console.log(`[FocusFlow] 抖动雷达状态已切换为: ${isEnabled ? '开启' : '关闭'}`);
  };
}
