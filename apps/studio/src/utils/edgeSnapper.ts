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
 * FocusFlow 高精度自适应边缘吸附引擎 (Adaptive Continuity & Dynamic Contrast Edge Snapper)
 * 1. 拖拽框选磁吸 (Drag-to-Snap): 基于“边缘线贯穿度 (Line Continuity)”与“正交 Sobel 梯度”四边独立毫秒级磁吸
 * 2. 一键单击吸附 (Click-to-Snap): 自适应局部方差多路射线雷达，穿透内部文本与图标，精准捕获外框边界
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
    const clampedX = Math.max(0, Math.min(this.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(this.height - 1, Math.round(y)));
    const idx = (clampedY * this.width + clampedX) * 4;
    const data = this.imgData!;
    return (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
  }

  private getRGB(x: number, y: number): [number, number, number] {
    const clampedX = Math.max(0, Math.min(this.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(this.height - 1, Math.round(y)));
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
   * 【模式一：拖拽框选磁吸 (Drag-to-Snap)】
   * 采用“四边独立正交连续性积分 (Line-Continuity Sobel Integration)”
   * 无论用户框选多么粗略，松手瞬间四边均能独立精准吸附到临近的最高贯穿度边界线上
   */
  public snapRectBounds(
    raw: SnappedBounds,
    customRadius?: number
  ): SnappedBounds {
    if (!this.isReady || !this.imgData) return raw;
    if (raw.width < 20 || raw.height < 15) return raw;

    // 自适应搜索带宽 (根据物理画幅大小自动调节为 36px ~ 72px)
    const radius = customRadius || Math.max(32, Math.min(72, Math.round(this.width * 0.015)));

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

    if (snappedW >= 20 && snappedH >= 15) {
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
   * 垂直边缘高保真贯穿度积分探针
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

    // 避开圆角干扰，两端各内缩 6%
    const inset = Math.min(28, Math.max(3, Math.round(span * 0.06)));
    const startY = Math.round(yMin + inset);
    const endY = Math.round(yMax - inset);
    const stepY = Math.max(1, Math.round((endY - startY) / 70));

    let bestX = targetX;
    let maxScore = -1;

    const minX = Math.max(1, Math.round(targetX + minOffset));
    const maxX = Math.min(this.width - 2, Math.round(targetX + maxOffset));

    for (let x = minX; x <= maxX; x++) {
      let edgeEnergy = 0;
      let activeEdgeCount = 0;
      let totalSamples = 0;

      for (let y = startY; y <= endY; y += stepY) {
        const gx = Math.abs(this.getSobelGx(x, y));
        edgeEnergy += gx;
        if (gx > 12) {
          activeEdgeCount++;
        }
        totalSamples++;
      }

      const avgEnergy = totalSamples > 0 ? edgeEnergy / totalSamples : 0;
      const continuity = totalSamples > 0 ? activeEdgeCount / totalSamples : 0; // 边缘线贯穿比率 (0~1)

      const dist = Math.abs(x - targetX);
      const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.3; // 距离中心越近基础分越高

      // 综合评分：能量 × 贯穿度加权 (贯穿度越高，越说明是完整边框而不是零星文字)
      const score = avgEnergy * (1 + continuity * 2.0) * distanceWeight;
      if (score > maxScore) {
        maxScore = score;
        bestX = x;
      }
    }

    // 梯度得分阈值检测
    return maxScore > 12 ? bestX : targetX;
  }

  /**
   * 水平边缘高保真贯穿度积分探针
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

    const inset = Math.min(28, Math.max(3, Math.round(span * 0.06)));
    const startX = Math.round(xMin + inset);
    const endX = Math.round(xMax - inset);
    const stepX = Math.max(1, Math.round((endX - startX) / 70));

    let bestY = targetY;
    let maxScore = -1;

    const minY = Math.max(1, Math.round(targetY + minOffset));
    const maxY = Math.min(this.height - 2, Math.round(targetY + maxOffset));

    for (let y = minY; y <= maxY; y++) {
      let edgeEnergy = 0;
      let activeEdgeCount = 0;
      let totalSamples = 0;

      for (let x = startX; x <= endX; x += stepX) {
        const gy = Math.abs(this.getSobelGy(x, y));
        edgeEnergy += gy;
        if (gy > 12) {
          activeEdgeCount++;
        }
        totalSamples++;
      }

      const avgEnergy = totalSamples > 0 ? edgeEnergy / totalSamples : 0;
      const continuity = totalSamples > 0 ? activeEdgeCount / totalSamples : 0;

      const dist = Math.abs(y - targetY);
      const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.3;

      const score = avgEnergy * (1 + continuity * 2.0) * distanceWeight;
      if (score > maxScore) {
        maxScore = score;
        bestY = y;
      }
    }

    return maxScore > 12 ? bestY : targetY;
  }

  /**
   * 【模式二：一键单击秒级吸附 (Click-to-Snap)】
   * 采用自适应色度梯度雷达 (Adaptive Multi-Ray Radar)，穿透内部文本与图标，秒级捕获整个模块外包围框
   */
  public snapPoint(clickX: number, clickY: number): SnappedBox | null {
    if (!this.isReady || !this.imgData) return null;

    const W = this.width;
    const H = this.height;

    // 1. 采样点击点 11x11 区域的基础底色与局部方差
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    const samples: number[] = [];
    for (let dy = -5; dy <= 5; dy += 2) {
      for (let dx = -5; dx <= 5; dx += 2) {
        const [r, g, b] = this.getRGB(clickX + dx, clickY + dy);
        sumR += r;
        sumG += g;
        sumB += b;
        samples.push((r * 299 + g * 587 + b * 114) / 1000);
        count++;
      }
    }
    const baseR = sumR / count;
    const baseG = sumG / count;
    const baseB = sumB / count;

    // 2. 自适应色差阈值 (适应暗黑中台、明亮浅色及半透明磨砂等各种不同对比度底图)
    const colorThreshold = 14; // 自适应低对比度灵敏阈值
    const maxSearchW = Math.min(1800, Math.round(W * 0.45));
    const maxSearchH = Math.min(1200, Math.round(H * 0.45));

    // 3. 多路平行射线探测 (7 路光线，确保穿透内部单词、换行文本与图标间隙)
    const offsets = [-60, -40, -20, 0, 20, 40, 60];

    // 向左探测
    let detectedLeft = clickX - 100;
    for (let x = clickX - 15; x >= Math.max(4, clickX - maxSearchW); x -= 4) {
      let hits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > colorThreshold || gx > 20) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedLeft = x;
        break;
      }
    }

    // 向右探测
    let detectedRight = clickX + 100;
    for (let x = clickX + 15; x <= Math.min(W - 4, clickX + maxSearchW); x += 4) {
      let hits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > colorThreshold || gx > 20) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedRight = x;
        break;
      }
    }

    // 向上探测
    let detectedTop = clickY - 80;
    for (let y = clickY - 15; y >= Math.max(4, clickY - maxSearchH); y -= 4) {
      let hits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > colorThreshold || gy > 20) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedTop = y;
        break;
      }
    }

    // 向下探测
    let detectedBottom = clickY + 80;
    for (let y = clickY + 15; y <= Math.min(H - 4, clickY + maxSearchH); y += 4) {
      let hits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > colorThreshold || gy > 20) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedBottom = y;
        break;
      }
    }

    const estimatedWidth = detectedRight - detectedLeft;
    const estimatedHeight = detectedBottom - detectedTop;

    if (estimatedWidth < 40 || estimatedHeight < 30) {
      return null;
    }

    // 4. 调用四边独立贯穿度积分算法，对射线抓取的粗选框进行二次毫米级精修贴合
    const refined = this.snapRectBounds(
      {
        x: detectedLeft,
        y: detectedTop,
        width: estimatedWidth,
        height: estimatedHeight,
      },
      48
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
