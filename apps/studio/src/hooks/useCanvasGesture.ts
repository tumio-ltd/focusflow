import { useState, useCallback, useEffect, useRef } from 'react';

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface UseCanvasGestureOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  contentWidth?: number;
  contentHeight?: number;
  onTransformChange?: (transform: CanvasTransform, containerRect: { width: number; height: number }) => void;
}

export function useCanvasGesture({
  minScale = 0.1,
  maxScale = 5.0,
  initialScale = 1.0,
  contentWidth = 1920,
  contentHeight = 1080,
  onTransformChange,
}: UseCanvasGestureOptions = {}) {
  const [transform, setTransform] = useState<CanvasTransform>({
    x: 0,
    y: 0,
    scale: initialScale,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // 铁律 8 落地：本地同步变换基准 Ref，杜绝同一 rAF 帧内多个高频事件基于过期 React State 运算
  const currentTransformRef = useRef<CanvasTransform>({
    x: 0,
    y: 0,
    scale: initialScale,
  });

  // 铁律 8 落地：视口容器尺寸缓存化，彻底杜绝高频 wheel 中的 getBoundingClientRect 强制同步回流
  const cachedRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  // 铁律 8 落地：rAF 帧级聚合调度器，保证单帧最多执行 1 次 React 状态分发
  const wheelRafIdRef = useRef<number | null>(null);

  // 铁律 9 落地：极小缩放比 (< 0.25) 逆向投影杠杆阻尼与微颤滤波追踪器
  const activeFocalPointRef = useRef<{ x: number; y: number; lastTime: number } | null>(null);
  const lastWheelTimeRef = useRef<number>(0);

  // 保持 currentTransformRef 与 state 始终双向对齐
  useEffect(() => {
    currentTransformRef.current = transform;
  }, [transform]);

  // 容器尺寸观察器：挂载与 Resize 时安全更新 Rect 缓存
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRect = () => {
      const r = container.getBoundingClientRect();
      cachedRectRef.current = {
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      };
    };

    updateRect();

    const ro = new ResizeObserver(() => {
      updateRect();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (wheelRafIdRef.current !== null) {
        cancelAnimationFrame(wheelRafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (onTransformChange && containerRef.current) {
      const rect = cachedRectRef.current || containerRef.current.getBoundingClientRect();
      onTransformChange(transform, { width: rect.width, height: rect.height });
    }
  }, [transform, onTransformChange]);

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. 以指定屏幕点为中心进行平滑缩放 (Zoom-to-Cursor 矩阵算法)
  const zoomTo = useCallback(
    (newScale: number, cursorScreenX?: number, cursorScreenY?: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = cachedRectRef.current || container.getBoundingClientRect();
      const Px = cursorScreenX !== undefined ? cursorScreenX - rect.left : rect.width / 2;
      const Py = cursorScreenY !== undefined ? cursorScreenY - rect.top : rect.height / 2;

      const prev = currentTransformRef.current;
      const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
      if (clampedScale === prev.scale) return;

      const ratio = clampedScale / prev.scale;
      const nextTransform: CanvasTransform = {
        x: Px - (Px - prev.x) * ratio,
        y: Py - (Py - prev.y) * ratio,
        scale: clampedScale,
      };

      currentTransformRef.current = nextTransform;
      setTransform(nextTransform);
    },
    [minScale, maxScale]
  );

  // 2. 平移画布 (硬件物理像素对齐，杜绝浮点亚像素在物理液晶栅格移动时的插值呼吸微颤)
  const panBy = useCallback((dx: number, dy: number) => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rawX = currentTransformRef.current.x + dx;
    const rawY = currentTransformRef.current.y + dy;
    const nextTransform: CanvasTransform = {
      ...currentTransformRef.current,
      x: Math.round(rawX * dpr) / dpr,
      y: Math.round(rawY * dpr) / dpr,
    };
    currentTransformRef.current = nextTransform;

    if (wheelRafIdRef.current === null) {
      wheelRafIdRef.current = requestAnimationFrame(() => {
        wheelRafIdRef.current = null;
        setTransform(currentTransformRef.current);
      });
    }
  }, []);

  // 3. 视口自适应居中算法 (Fit-to-Screen / Shift + 1)
  const fitToScreen = useCallback(
    (customPadding?: number | unknown) => {
      const padding = typeof customPadding === 'number' ? customPadding : 48;
      const container = containerRef.current;
      if (!container) return;

      const rect = cachedRectRef.current || container.getBoundingClientRect();
      const availableW = Math.max(rect.width - padding * 2, 100);
      const availableH = Math.max(rect.height - padding * 2, 100);

      const safeContentW = contentWidth || 1920;
      const safeContentH = contentHeight || 1080;
      const scaleX = availableW / safeContentW;
      const scaleY = availableH / safeContentH;
      const rawScale = Math.min(scaleX, scaleY);
      const targetScale = isNaN(rawScale) ? 1.0 : Math.min(Math.max(rawScale, minScale), maxScale);

      const nextX = (rect.width - safeContentW * targetScale) / 2;
      const nextY = (rect.height - safeContentH * targetScale) / 2;

      const nextTransform: CanvasTransform = {
        x: isNaN(nextX) ? 0 : nextX,
        y: isNaN(nextY) ? 0 : nextY,
        scale: targetScale,
      };

      currentTransformRef.current = nextTransform;
      setTransform(nextTransform);
    },
    [contentWidth, contentHeight, minScale, maxScale]
  );

  // 初始化挂载与底图尺寸变更时，自动执行视口自适应居中对齐
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 50);
    return () => clearTimeout(timer);
  }, [fitToScreen]);

  // 4. 1:1 原始物理分辨率对齐 (Shift + 0)
  const resetZoom100 = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = cachedRectRef.current || container.getBoundingClientRect();
    const nextTransform: CanvasTransform = {
      x: (rect.width - contentWidth) / 2,
      y: (rect.height - contentHeight) / 2,
      scale: 1.0,
    };
    currentTransformRef.current = nextTransform;
    setTransform(nextTransform);
  }, [contentWidth, contentHeight]);

  // 4.1 摄像机视口协同运镜定位 (Fly-to-Camera 协同算法)
  const flyToCamera = useCallback(
    (camera: { zoom: number; x: number; y: number }) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = cachedRectRef.current || container.getBoundingClientRect();
      const natW = contentWidth || 1920;
      const natH = contentHeight || 1080;
      if (rect.width <= 0 || rect.height <= 0 || natW <= 0 || natH <= 0) return;

      const baseScale = Math.min(rect.width / natW, rect.height / natH);
      const zoom = Math.max(camera.zoom || 1.0, 1.0);
      const targetScale = Math.min(Math.max(baseScale * zoom, minScale), maxScale);

      const centerX = (natW / 2) + ((camera.x || 0) / 100) * natW;
      const centerY = (natH / 2) + ((camera.y || 0) / 100) * natH;

      const targetX = rect.width / 2 - centerX * targetScale;
      const targetY = rect.height / 2 - centerY * targetScale;

      const nextTransform: CanvasTransform = {
        x: targetX,
        y: targetY,
        scale: targetScale,
      };
      currentTransformRef.current = nextTransform;
      setTransform(nextTransform);
    },
    [contentWidth, contentHeight, minScale, maxScale]
  );

  // 5. 监听滚轮事件 (Wheel)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = performance.now();
      const isPinchOrModifier = e.ctrlKey || e.metaKey || e.altKey;
      const isHorizontalTrackpadPan = Math.abs(e.deltaX) > 0 && !isPinchOrModifier;

      if (isHorizontalTrackpadPan) {
        panBy(-e.deltaX, -e.deltaY);
        return;
      }

      // 铁律 8 落地：优先读取缓存 Rect，当缓存缺失或手势停滞超 250ms 时安全校验刷新一次
      if (!cachedRectRef.current || now - lastWheelTimeRef.current > 250) {
        const r = container.getBoundingClientRect();
        cachedRectRef.current = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        };
      }
      const rect = cachedRectRef.current;

      // 鼠标滚轮灵敏度自适应：行模式 (deltaMode === 1) 与像素模式
      const sensitivity = e.deltaMode === 1 ? 0.05 : 0.0025;
      const zoomFactor = Math.exp(-e.deltaY * sensitivity);

      // 从本地即时同步基准读取当前矩阵（杜绝同一帧内后续事件基于过时 React State 产生折叠）
      const prev = currentTransformRef.current;
      const targetScale = prev.scale * zoomFactor;
      const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale);
      if (clampedScale === prev.scale) return;

      // 铁律 9 落地：极小缩放比 (< 0.25) 逆向投影杠杆阻尼与微颤滤波
      const rawPx = e.clientX - rect.left;
      const rawPy = e.clientY - rect.top;

      let Px = rawPx;
      let Py = rawPy;

      const isOngoingGesture = activeFocalPointRef.current && (now - activeFocalPointRef.current.lastTime < 160);
      if (isOngoingGesture && activeFocalPointRef.current) {
        const lastFP = activeFocalPointRef.current;
        const dx = rawPx - lastFP.x;
        const dy = rawPy - lastFP.y;
        const distSq = dx * dx + dy * dy;

        // 在小比例下 (scale < 0.25)，分母 1/scale 达到 4~10 倍杠杆
        // 人类手指在触控板表面生理微颤 (≤ 2.5px)，强制锁定原锚点，杜绝 10 倍放大抽动
        const deadband = clampedScale < 0.25 ? 6.25 : 1.0;
        if (distSq < deadband) {
          Px = lastFP.x;
          Py = lastFP.y;
        } else {
          // 超出死区时施加低通滤波平滑追踪光标
          const alpha = clampedScale < 0.25 ? 0.35 : 0.75;
          Px = lastFP.x + dx * alpha;
          Py = lastFP.y + dy * alpha;
          activeFocalPointRef.current = { x: Px, y: Py, lastTime: now };
        }
      } else {
        activeFocalPointRef.current = { x: Px, y: Py, lastTime: now };
      }
      lastWheelTimeRef.current = now;

      // 实时计算下一帧目标矩阵
      const ratio = clampedScale / prev.scale;
      const nextTransform: CanvasTransform = {
        x: Px - (Px - prev.x) * ratio,
        y: Py - (Py - prev.y) * ratio,
        scale: clampedScale,
      };

      // 立即更新本地同步基准
      currentTransformRef.current = nextTransform;

      // 铁律 8 落地：rAF 帧级单次聚合调度，杜绝 120Hz 硬件事件塞爆 React State 队列
      if (wheelRafIdRef.current === null) {
        wheelRafIdRef.current = requestAnimationFrame(() => {
          wheelRafIdRef.current = null;
          setTransform(currentTransformRef.current);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelRafIdRef.current !== null) {
        cancelAnimationFrame(wheelRafIdRef.current);
        wheelRafIdRef.current = null;
      }
    };
  }, [minScale, maxScale, panBy]);

  // 6. 监听空格键按压 (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
      if (e.shiftKey && e.code === 'Digit1') {
        e.preventDefault();
        fitToScreen();
      }
      if (e.shiftKey && e.code === 'Digit0') {
        e.preventDefault();
        resetZoom100();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fitToScreen, resetZoom100]);

  // 7. 鼠标拖拽平移事件 (Pointer Events)
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // 中键按下 (button === 1) 或 空格键按住时左键按下 (button === 0)
      if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
        e.preventDefault();
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    },
    [isSpacePressed]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      panBy(dx, dy);
    },
    [isPanning, panBy]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      }
    },
    [isPanning]
  );

  return {
    containerRef,
    transform,
    setTransform,
    zoomTo,
    panBy,
    fitToScreen,
    resetZoom100,
    flyToCamera,
    isPanning,
    isSpacePressed,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
