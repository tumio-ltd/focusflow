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

  useEffect(() => {
    if (onTransformChange && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      onTransformChange(transform, { width: rect.width, height: rect.height });
    }
  }, [transform, onTransformChange]);

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. 以指定屏幕点为中心进行平滑缩放 (Zoom-to-Cursor 矩阵算法)
  const zoomTo = useCallback(
    (newScale: number, cursorScreenX?: number, cursorScreenY?: number) => {
      setTransform((prev) => {
        const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
        if (clampedScale === prev.scale) return prev;

        const container = containerRef.current;
        if (!container) return { ...prev, scale: clampedScale };

        const rect = container.getBoundingClientRect();
        // 默认取容器中心点
        const Px = cursorScreenX !== undefined ? cursorScreenX - rect.left : rect.width / 2;
        const Py = cursorScreenY !== undefined ? cursorScreenY - rect.top : rect.height / 2;

        // Zoom-to-Cursor 实时几何补偿公式:
        // Tx2 = Px - (Px - Tx1) * (S2 / S1)
        // Ty2 = Py - (Py - Ty1) * (S2 / S1)
        const ratio = clampedScale / prev.scale;
        const nextX = Px - (Px - prev.x) * ratio;
        const nextY = Py - (Py - prev.y) * ratio;

        return {
          x: nextX,
          y: nextY,
          scale: clampedScale,
        };
      });
    },
    [minScale, maxScale]
  );

  // 2. 平移画布
  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  // 3. 视口自适应居中算法 (Fit-to-Screen / Shift + 1)
  const fitToScreen = useCallback(
    (customPadding?: number | unknown) => {
      const padding = typeof customPadding === 'number' ? customPadding : 48;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
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

      setTransform({
        x: isNaN(nextX) ? 0 : nextX,
        y: isNaN(nextY) ? 0 : nextY,
        scale: targetScale,
      });
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
    if (!container) {
      setTransform((prev) => ({ ...prev, scale: 1.0 }));
      return;
    }
    const rect = container.getBoundingClientRect();
    setTransform({
      x: (rect.width - contentWidth) / 2,
      y: (rect.height - contentHeight) / 2,
      scale: 1.0,
    });
  }, [contentWidth, contentHeight]);

  // 5. 监听滚轮事件 (Wheel)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // 判断操作意图：
      // 1. 如果有水平方向分量且未按修饰键 (如触控板双指横向滑动) ➔ 视口平移
      // 2. 纯纵向滚轮 (鼠标滚轮上下滚动) 或 按住 Ctrl/Cmd/Alt ➔ 以鼠标光标为中心自适应平滑缩放
      const isPinchOrModifier = e.ctrlKey || e.metaKey || e.altKey;
      const isHorizontalTrackpadPan = Math.abs(e.deltaX) > 0 && !isPinchOrModifier;

      if (isHorizontalTrackpadPan) {
        panBy(-e.deltaX, -e.deltaY);
      } else {
        // 鼠标滚轮灵敏度自适应：行模式 (deltaMode === 1) 与像素模式
        const sensitivity = e.deltaMode === 1 ? 0.05 : 0.0025;
        const zoomFactor = Math.exp(-e.deltaY * sensitivity);

        setTransform((prev) => {
          const targetScale = prev.scale * zoomFactor;
          const clampedScale = Math.min(Math.max(targetScale, minScale), maxScale);
          if (clampedScale === prev.scale) return prev;

          const rect = container.getBoundingClientRect();
          const Px = e.clientX - rect.left;
          const Py = e.clientY - rect.top;
          const ratio = clampedScale / prev.scale;

          return {
            x: Px - (Px - prev.x) * ratio,
            y: Py - (Py - prev.y) * ratio,
            scale: clampedScale,
          };
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
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
    isPanning,
    isSpacePressed,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
