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
  const activeFocalPointRef = useRef<{ worldX: number; worldY: number; lastTime: number } | null>(null);
  const lastWheelTimeRef = useRef<number>(0);

  // 变换手势活跃状态追踪器（用于动态挂载 will-change: transform 硬件加速与 CSS contain）
  const [isGesturing, setIsGesturing] = useState(false);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markGestureActive = useCallback(() => {
    setIsGesturing(true);
    if (gestureTimerRef.current) {
      clearTimeout(gestureTimerRef.current);
    }
    gestureTimerRef.current = setTimeout(() => {
      setIsGesturing(false);
      gestureTimerRef.current = null;
    }, 200);
  }, []);

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
      if (gestureTimerRef.current !== null) {
        clearTimeout(gestureTimerRef.current);
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

      markGestureActive();

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
    [minScale, maxScale, markGestureActive]
  );

  // 2. 平移画布 (硬件物理像素对齐，杜绝浮点亚像素在物理液晶栅格移动时的插值呼吸微颤)
  const panBy = useCallback((dx: number, dy: number) => {
    markGestureActive();

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
  }, [markGestureActive]);

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
      const dt = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      // 1. 硬件输入特征分类
      // Mac 触控板 Pinch 双指捏合缩放必带 e.ctrlKey === true (Chrome/Safari 规范)
      const isPinch = e.ctrlKey;
      const isShift = e.shiftKey && !isPinch;

      // 2. 意图分流 A：触控板双指水平平移 (具备明确水平滑动分量 deltaX !== 0 且无修饰键)
      const isHorizontalTrackpadPan = Math.abs(e.deltaX) > 0 && !isPinch && !e.metaKey && !e.altKey && !isShift;
      if (isHorizontalTrackpadPan) {
        panBy(-e.deltaX, -e.deltaY);
        return;
      }

      // 3. 意图分流 B：Shift + 滚轮水平平移 (针对鼠标滚轮用户)
      if (isShift) {
        const delta = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
        panBy(-delta, 0);
        return;
      }

      // 4. 意图分流 C：鼠标滚轮滚动 (deltaX === 0) 或 Mac Pinch 捏合 -> 统一以光标为中心执行平滑缩放 (Zoom In / Zoom Out)
      // 用户核心交互习惯铁律：普通鼠标上下滚动必须为放大缩小（滚轮向上放大，滚轮向下缩小），平移由中键/空格拖拽承载
      markGestureActive();

      // 优先读取缓存 Rect，手势停滞超 250ms 时安全校验刷新一次
      if (!cachedRectRef.current || dt > 250) {
        const r = container.getBoundingClientRect();
        cachedRectRef.current = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
        };
      }
      const rect = cachedRectRef.current;

      // 尺度自适应缩放补偿方程：在超大底图全景小尺度 (< 0.8) 下动态提升变焦动力
      const prev = currentTransformRef.current;
      const scaleBoost = prev.scale < 0.8
        ? 1 + 1.5 * Math.max(0, (0.8 - prev.scale) / 0.8)
        : 1.0;

      // 设备类型基础步长校准：Pinch (触控板双指捏合) 取 0.009，传统滚轮行模式取 0.04，像素模式取 0.0025
      const baseSensitivity = isPinch ? 0.009 : (e.deltaMode === 1 ? 0.04 : 0.0025);
      const sensitivity = baseSensitivity * scaleBoost;
      const zoomFactor = Math.exp(-e.deltaY * sensitivity);
      // 限制单次事件变焦倍率，防止离散阶跃突变
      const clampedZoomFactor = Math.min(Math.max(zoomFactor, 0.35), 2.5);

      const targetScale = prev.scale * clampedZoomFactor;
      const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale);
      if (clampedScale === prev.scale) return;

      const rawPx = e.clientX - rect.left;
      const rawPy = e.clientY - rect.top;

      // 连续手势世界坐标锁定方程：缩放手势期间保持锚定世界坐标系点连续，杜绝死区阈值跳跃抖动
      const isOngoingGesture = activeFocalPointRef.current && (now - activeFocalPointRef.current.lastTime < 180);
      let worldX: number;
      let worldY: number;

      if (isOngoingGesture && activeFocalPointRef.current) {
        worldX = activeFocalPointRef.current.worldX;
        worldY = activeFocalPointRef.current.worldY;
        activeFocalPointRef.current.lastTime = now;
      } else {
        worldX = (rawPx - prev.x) / prev.scale;
        worldY = (rawPy - prev.y) / prev.scale;
        activeFocalPointRef.current = { worldX, worldY, lastTime: now };
      }

      // 实时计算下一帧目标矩阵 (严格连续，0 累积截断阶跃)
      const nextTransform: CanvasTransform = {
        x: rawPx - worldX * clampedScale,
        y: rawPy - worldY * clampedScale,
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
  }, [minScale, maxScale, panBy, markGestureActive]);

  // 6. 监听空格键按压 (Space) 与键盘缩放快捷键
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
      if ((e.metaKey || e.ctrlKey) && (e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        const prev = currentTransformRef.current;
        const scaleBoost = prev.scale < 0.8 ? 1 + 1.5 * Math.max(0, (0.8 - prev.scale) / 0.8) : 1.0;
        zoomTo(prev.scale * (1 + 0.25 * scaleBoost));
      }
      if ((e.metaKey || e.ctrlKey) && (e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        const prev = currentTransformRef.current;
        const scaleBoost = prev.scale < 0.8 ? 1 + 1.5 * Math.max(0, (0.8 - prev.scale) / 0.8) : 1.0;
        zoomTo(prev.scale / (1 + 0.25 * scaleBoost));
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
  }, [fitToScreen, resetZoom100, zoomTo]);

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
    isTransforming: isPanning || isGesturing,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
