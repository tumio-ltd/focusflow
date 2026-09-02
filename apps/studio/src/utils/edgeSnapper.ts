export interface SnappedBox {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

export interface SnappedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * FocusFlow 高性能双模智能边缘吸附引擎 (Sobel & Ray-Marching Color Boundary Fusion)
 * 1. 拖拽框选磁吸 (Drag-to-Snap): 四边独立一维正交积分极大值吸附
 * 2. 一键单击吸附 (Click-to-Snap): 区域色度泛洪探针 + 四边微调精确定位
 */
export class SobelEdgeSnapper {
  private imgData: Uint8ClampedArray | null = null;
  private width = 0;
  private height = 0;
  private isReady = false;

  /**
   * 绑定底图 HTMLImageElement 并将像素离屏光栅化到内存中
   */
  public setImageElement(img: HTMLImageElement | null, viewportWidth: number, viewportHeight: number) {
    if (!img) {
      this.imgData = null;
      this.isReady = false;
      return;
    }

    this.width = viewportWidth;
    this.height = viewportHeight;

    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    if (img.crossOrigin !== 'anonymous') {
      try {
        img.crossOrigin = 'anonymous';
      } catch {
        // ignore
      }
    }

    const cacheImageData = () => {
      try {
        ctx.drawImage(img, 0, 0, viewportWidth, viewportHeight);
        this.imgData = ctx.getImageData(0, 0, viewportWidth, viewportHeight).data;
        this.isReady = true;
      } catch {
        // 若直接 getImageData 触发浏览器 CORS Tainted Canvas 拦截，尝试通过 CORS Blob 异步光栅化
        if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('blob:')) {
          fetch(img.src, { mode: 'cors' })
            .then((res) => {
              if (!res.ok) throw new Error('Fetch failed');
              return res.blob();
            })
            .then((blob) => createImageBitmap(blob))
            .then((bitmap) => {
              ctx.drawImage(bitmap, 0, 0, viewportWidth, viewportHeight);
              this.imgData = ctx.getImageData(0, 0, viewportWidth, viewportHeight).data;
              this.isReady = true;
            })
            .catch(() => {
              // 远端资源未配置 Access-Control-Allow-Origin 时，优雅降级
              this.isReady = false;
            });
        } else {
          this.isReady = false;
        }
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      cacheImageData();
    } else {
      img.addEventListener('load', cacheImageData, { once: true });
    }
  }

  public isAvailable(): boolean {
    return this.isReady && this.imgData !== null;
  }

  private getGray(x: number, y: number): number {
    const clampedX = x < 0 ? 0 : x >= this.width ? this.width - 1 : x;
    const clampedY = y < 0 ? 0 : y >= this.height ? this.height - 1 : y;
    const idx = (clampedY * this.width + clampedX) * 4;
    const data = this.imgData!;
    return (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
  }

  private getRGB(x: number, y: number): [number, number, number] {
    const clampedX = x < 0 ? 0 : x >= this.width ? this.width - 1 : x;
    const clampedY = y < 0 ? 0 : y >= this.height ? this.height - 1 : y;
    const idx = (clampedY * this.width + clampedX) * 4;
    const data = this.imgData!;
    return [data[idx], data[idx + 1], data[idx + 2]];
  }

  private getSobelGx(x: number, y: number): number {
    return (
      (this.getGray(x + 1, y - 1) + 2 * this.getGray(x + 1, y) + this.getGray(x + 1, y + 1)) -
      (this.getGray(x - 1, y - 1) + 2 * this.getGray(x - 1, y) + this.getGray(x - 1, y + 1))
    );
  }

  private getSobelGy(x: number, y: number): number {
    return (
      (this.getGray(x - 1, y + 1) + 2 * this.getGray(x, y + 1) + this.getGray(x + 1, y + 1)) -
      (this.getGray(x - 1, y - 1) + 2 * this.getGray(x, y - 1) + this.getGray(x + 1, y - 1))
    );
  }

  /**
   * 【模式一】：拖拽选框松手瞬间，四边独立正交一维梯度积分极大值吸附
   * 彻底解决旧版“牵一发动全身导致放弃吸附”的问题
   */
  public snapRectBounds(
    raw: SnappedBounds,
    customRadius?: number
  ): SnappedBounds {
    if (!this.isReady || !this.imgData) return raw;
    if (raw.width < 25 || raw.height < 18) return raw;

    // 自适应分辨率搜索半径 (5K大图约 48px，标准1080P约 28px)
    const radius = customRadius || Math.max(24, Math.min(54, Math.round(this.width * 0.012)));

    let left = raw.x;
    let right = raw.x + raw.width;
    let top = raw.y;
    let bottom = raw.y + raw.height;

    // 1. 独立吸附左边线
    left = this.snapVerticalEdge(left, top, bottom, -radius, radius);

    // 2. 独立吸附右边线
    right = this.snapVerticalEdge(right, top, bottom, -radius, radius);

    // 3. 独立吸附顶边线
    top = this.snapHorizontalEdge(top, left, right, -radius, radius);

    // 4. 独立吸附底边线
    bottom = this.snapHorizontalEdge(bottom, left, right, -radius, radius);

    const snappedW = right - left;
    const snappedH = bottom - top;

    if (snappedW >= 25 && snappedH >= 18) {
      return {
        x: Math.round(left),
        y: Math.round(top),
        width: Math.round(snappedW),
        height: Math.round(snappedH),
      };
    }

    return raw;
  }

  /**
   * 单一垂直边缘梯度积分探针
   */
  private snapVerticalEdge(
    targetX: number,
    yMin: number,
    yMax: number,
    minOffset: number,
    maxOffset: number
  ): number {
    const span = yMax - yMin;
    if (span < 12) return targetX;

    // 避开圆角干扰，内缩 8%
    const inset = Math.min(24, Math.max(4, Math.round(span * 0.08)));
    const startY = Math.round(yMin + inset);
    const endY = Math.round(yMax - inset);
    const stepY = Math.max(1, Math.round((endY - startY) / 50));

    let bestX = targetX;
    let maxScore = -1;

    const minX = Math.max(1, Math.round(targetX + minOffset));
    const maxX = Math.min(this.width - 2, Math.round(targetX + maxOffset));

    for (let x = minX; x <= maxX; x++) {
      let edgeEnergy = 0;
      let sampleCount = 0;

      for (let y = startY; y <= endY; y += stepY) {
        edgeEnergy += Math.abs(this.getSobelGx(x, y));
        sampleCount++;
      }

      const avgEnergy = sampleCount > 0 ? edgeEnergy / sampleCount : 0;
      const dist = Math.abs(x - targetX);
      const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.35; // 距离中心越近权重越高

      const score = avgEnergy * distanceWeight;
      if (score > maxScore) {
        maxScore = score;
        bestX = x;
      }
    }

    // 平均梯度大于 10 表示存在有效边缘
    return maxScore > 10 ? bestX : targetX;
  }

  /**
   * 单一水平边缘梯度积分探针
   */
  private snapHorizontalEdge(
    targetY: number,
    xMin: number,
    xMax: number,
    minOffset: number,
    maxOffset: number
  ): number {
    const span = xMax - xMin;
    if (span < 12) return targetY;

    const inset = Math.min(24, Math.max(4, Math.round(span * 0.08)));
    const startX = Math.round(xMin + inset);
    const endX = Math.round(xMax - inset);
    const stepX = Math.max(1, Math.round((endX - startX) / 50));

    let bestY = targetY;
    let maxScore = -1;

    const minY = Math.max(1, Math.round(targetY + minOffset));
    const maxY = Math.min(this.height - 2, Math.round(targetY + maxOffset));

    for (let y = minY; y <= maxY; y++) {
      let edgeEnergy = 0;
      let sampleCount = 0;

      for (let x = startX; x <= endX; x += stepX) {
        edgeEnergy += Math.abs(this.getSobelGy(x, y));
        sampleCount++;
      }

      const avgEnergy = sampleCount > 0 ? edgeEnergy / sampleCount : 0;
      const dist = Math.abs(y - targetY);
      const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.35;

      const score = avgEnergy * distanceWeight;
      if (score > maxScore) {
        maxScore = score;
        bestY = y;
      }
    }

    return maxScore > 10 ? bestY : targetY;
  }

  /**
   * 【模式二】：一键单击秒级吸附 (Click-to-Snap)
   * 采用色度边界多向射线雷达探针 (Ray-Marching Contrast Radar)，穿透内部文字/图标，精准捕捉卡片外边框
   */
  public snapPoint(clickX: number, clickY: number): SnappedBox | null {
    if (!this.isReady || !this.imgData) return null;

    const W = this.width;
    const H = this.height;

    // 1. 采样点击点 9x9 邻域的中值代表底色，过滤偶然点中文字细笔画
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;
    for (let dy = -4; dy <= 4; dy += 2) {
      for (let dx = -4; dx <= 4; dx += 2) {
        const [r, g, b] = this.getRGB(clickX + dx, clickY + dy);
        sumR += r;
        sumG += g;
        sumB += b;
        count++;
      }
    }
    const baseR = sumR / count;
    const baseG = sumG / count;
    const baseB = sumB / count;

    // 最大搜索半径
    const maxRayX = Math.min(900, Math.round(W * 0.35));
    const maxRayY = Math.min(600, Math.round(H * 0.35));

    // 2. 向左/右/上/下发射多路光线 (Parallel Rays)，检测色差阶跃或边缘能量跃迁
    const offsets = [-20, -10, 0, 10, 20];

    // 向左扫描
    let detectedLeft = clickX - 60;
    for (let x = clickX - 12; x >= Math.max(4, clickX - maxRayX); x -= 3) {
      let edgeHits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > 32 || gx > 35) {
          edgeHits++;
        }
      }
      if (edgeHits >= 3) {
        detectedLeft = x;
        break;
      }
    }

    // 向右扫描
    let detectedRight = clickX + 60;
    for (let x = clickX + 12; x <= Math.min(W - 4, clickX + maxRayX); x += 3) {
      let edgeHits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > 32 || gx > 35) {
          edgeHits++;
        }
      }
      if (edgeHits >= 3) {
        detectedRight = x;
        break;
      }
    }

    // 向上扫描
    let detectedTop = clickY - 40;
    for (let y = clickY - 10; y >= Math.max(4, clickY - maxRayY); y -= 3) {
      let edgeHits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > 32 || gy > 35) {
          edgeHits++;
        }
      }
      if (edgeHits >= 3) {
        detectedTop = y;
        break;
      }
    }

    // 向下扫描
    let detectedBottom = clickY + 40;
    for (let y = clickY + 10; y <= Math.min(H - 4, clickY + maxRayY); y += 3) {
      let edgeHits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > 32 || gy > 35) {
          edgeHits++;
        }
      }
      if (edgeHits >= 3) {
        detectedBottom = y;
        break;
      }
    }

    const estimatedWidth = detectedRight - detectedLeft;
    const estimatedHeight = detectedBottom - detectedTop;

    if (estimatedWidth < 35 || estimatedHeight < 25) {
      return null;
    }

    // 3. 使用四边独立窄带吸附对射线捕获的粗略外框做二次像素级精准贴合
    const refined = this.snapRectBounds(
      {
        x: detectedLeft,
        y: detectedTop,
        width: estimatedWidth,
        height: estimatedHeight,
      },
      36
    );

    return {
      id: `box-${Date.now().toString().slice(-6)}`,
      type: 'rect',
      x: refined.x,
      y: refined.y,
      width: refined.width,
      height: refined.height,
      rx: 16,
    };
  }
}

export const globalEdgeSnapper = new SobelEdgeSnapper();
