export interface SnappedBoxLevel {
  level: number; // 0: 叶子卡片, 1: 父级容器
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  label?: string;
}

export interface SnappedBox {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  levels?: SnappedBoxLevel[];
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
  private pMask: Uint8Array | null = null;
  private pQueue: Int32Array | null = null;
  private pTemp: Uint8Array | null = null;

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

  /**
   * 直接注入光栅化像素缓冲 (用于单元测试、WebWorker 或离屏预处理)
   */
  public setImageData(data: Uint8ClampedArray, width: number, height: number): void {
    this.imgData = data;
    this.width = width;
    this.height = height;
    this.isReady = true;
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
    customRadius?: number,
    interiorRGB?: [number, number, number]
  ): SnappedBounds {
    if (!this.isReady || !this.imgData) return raw;
    if (raw.width < 20 || raw.height < 15) return raw;

    // 自适应搜索带宽 (根据物理画幅大小自动调节为 36px ~ 72px)
    const radius = customRadius || Math.max(32, Math.min(72, Math.round(this.width * 0.015)));

    let left = raw.x;
    let right = raw.x + raw.width;
    let top = raw.y;
    let bottom = raw.y + raw.height;

    // 1. 独立吸附左边线 (指明 'left' 朝向，启用由内向外首峰锁定、多宽度盒式顶帽峰度与阴影尾部阻尼)
    left = this.snapVerticalEdge(left, top, bottom, -radius, radius, 'left', interiorRGB);

    // 2. 独立吸附右边线 (指明 'right' 朝向)
    right = this.snapVerticalEdge(right, top, bottom, -radius, radius, 'right', interiorRGB);

    // 3. 独立吸附顶边线 (指明 'top' 朝向)
    top = this.snapHorizontalEdge(top, left, right, -radius, radius, 'top', interiorRGB);

    // 4. 独立吸附底边线 (指明 'bottom' 朝向)
    bottom = this.snapHorizontalEdge(bottom, left, right, -radius, radius, 'bottom', interiorRGB);

    const snappedW = right - left;
    const snappedH = bottom - top;

    // 矩形包围盒几何一致性校验 (Bounding Box Consistency Guard)
    // 1. 尺寸畸变检查：精修后的尺寸不能比原始粗拉框缩水超过 45% 或膨胀超过 60%
    if (
      snappedW < raw.width * 0.55 ||
      snappedW > raw.width * 1.6 ||
      snappedH < raw.height * 0.55 ||
      snappedH > raw.height * 1.6
    ) {
      return raw;
    }

    // 2. 宽高比一致性：宽高比形变率不超过 45%
    const rawAR = raw.width / raw.height;
    const snappedAR = snappedW / snappedH;
    if (Math.abs(snappedAR - rawAR) / rawAR > 0.45) {
      return raw;
    }

    // 3. 几何中心漂移检查：中心位移不得超过对角线长度的 25%
    const rawCenterX = raw.x + raw.width / 2;
    const rawCenterY = raw.y + raw.height / 2;
    const snappedCenterX = left + snappedW / 2;
    const snappedCenterY = top + snappedH / 2;
    const centerDist = Math.hypot(snappedCenterX - rawCenterX, snappedCenterY - rawCenterY);
    const rawDiag = Math.hypot(raw.width, raw.height);
    if (centerDist > rawDiag * 0.25) {
      return raw;
    }

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
   * 框内安全网格优势底色采样器 (Interior Dominant Color Profiler)
   * 均匀采样 5x5 网格点，过滤高频文字与边缘噪点 (G >= 20)，欧氏色差聚类提取最大优势簇底色
   */
  public sampleInteriorDominantColor(
    bounds: SnappedBounds,
    insetRatio = 0.08
  ): [number, number, number] {
    if (!this.imgData || bounds.width < 12 || bounds.height < 12) {
      return [255, 255, 255];
    }

    const insetX = Math.min(32, Math.max(4, Math.round(bounds.width * insetRatio)));
    const insetY = Math.min(32, Math.max(4, Math.round(bounds.height * insetRatio)));
    const x0 = bounds.x + insetX;
    const x1 = bounds.x + bounds.width - insetX;
    const y0 = bounds.y + insetY;
    const y1 = bounds.y + bounds.height - insetY;

    const samples: Array<{ rgb: [number, number, number]; grad: number }> = [];
    if (x1 > x0 && y1 > y0) {
      const stepX = Math.max(1, Math.round((x1 - x0) / 4));
      const stepY = Math.max(1, Math.round((y1 - y0) / 4));
      for (let sy = y0; sy <= y1; sy += stepY) {
        for (let sx = x0; sx <= x1; sx += stepX) {
          const rgb = this.getRGB(sx, sy);
          const gx = this.getSobelGx(sx, sy);
          const gy = this.getSobelGy(sx, sy);
          const grad = Math.hypot(gx, gy);
          samples.push({ rgb, grad });
        }
      }
    }

    if (samples.length === 0) {
      return this.getRGB(
        Math.round(bounds.x + bounds.width / 2),
        Math.round(bounds.y + bounds.height / 2)
      );
    }

    // 优先采用平坦区域 (G < 20)
    const flatSamples = samples.filter((s) => s.grad < 20);
    const targetSamples = flatSamples.length >= 4 ? flatSamples : samples;

    let bestCluster: Array<[number, number, number]> = [];
    for (let i = 0; i < targetSamples.length; i++) {
      const cluster: Array<[number, number, number]> = [targetSamples[i].rgb];
      const [r1, g1, b1] = targetSamples[i].rgb;
      for (let j = 0; j < targetSamples.length; j++) {
        if (i === j) continue;
        const [r2, g2, b2] = targetSamples[j].rgb;
        const dist = Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
        if (dist <= 26) {
          cluster.push(targetSamples[j].rgb);
        }
      }
      if (cluster.length > bestCluster.length) {
        bestCluster = cluster;
      }
    }

    if (bestCluster.length > 0) {
      let sumR = 0, sumG = 0, sumB = 0;
      for (const rgb of bestCluster) {
        sumR += rgb[0];
        sumG += rgb[1];
        sumB += rgb[2];
      }
      return [
        Math.round(sumR / bestCluster.length),
        Math.round(sumG / bestCluster.length),
        Math.round(sumB / bestCluster.length),
      ];
    }

    return this.getRGB(
      Math.round(bounds.x + bounds.width / 2),
      Math.round(bounds.y + bounds.height / 2)
    );
  }

  /**
   * 【模式一增强：先验粗框自适应磁吸与智能圆角拟合 (Rubberband Drag-to-Snap)】
   * 阶段 1.8 通用化加固：
   * 1. 前置在原始粗框中心安全区采样卡片底色 interiorRGB，解决时序倒置；
   * 2. 四边寻峰时引入内部分割线/装饰色条 (Accent Bar) 剔除判据，杜绝误锁内缩；
   * 3. 联动自适应圆角与多层级 N 层冒泡提取。
   */
  public snapBoxBounds(
    raw: SnappedBounds,
    options?: { customRadius?: number; forceParent?: boolean }
  ): SnappedBox {
    if (!this.isReady || !this.imgData) {
      return {
        id: `box-${Date.now().toString().slice(-6)}`,
        type: 'rect',
        x: raw.x,
        y: raw.y,
        width: raw.width,
        height: raw.height,
        rx: 16,
      };
    }

    // 1. 自适应扩展寻峰带宽 (提供 ±24 ~ 48px 大容差)
    const minDim = Math.min(raw.width, raw.height);
    const radius = options?.customRadius || Math.min(64, Math.max(24, Math.round(minDim * 0.15)));

    // 2. 阶段 1.8 方案 E：前置在原始粗框中心安全区 (内缩 22%) 提取卡片优势底色
    const preInteriorRGB = this.sampleInteriorDominantColor(raw, 0.22);

    // 3. 四边独立贯穿度积分寻峰与几何一致性约束 (透传 preInteriorRGB 剔除内部分割线)
    const refined = this.snapRectBounds(raw, radius, preInteriorRGB);

    // 4. 在精修后的高精度矩形框内二次采样高纯度底色
    const [baseR, baseG, baseB] = this.sampleInteriorDominantColor(refined, 0.08);

    // 5. 阶段 1.8 方案 A：自适应圆角拟合 (尺度自适应双模态融合)
    const estimatedRx = this.estimateCornerRadius(refined, baseR, baseG, baseB);

    const leafBox: SnappedBox = {
      id: `box-${Date.now().toString().slice(-6)}`,
      type: 'rect',
      x: refined.x,
      y: refined.y,
      width: refined.width,
      height: refined.height,
      rx: estimatedRx,
    };

    // 6. 阶段 1.8 方案 B：多层级包含关系提取 (支持 N 层冒泡)
    const levels = this.buildHierarchyLevels(leafBox, baseR, baseG, baseB, 4);
    if (levels && levels.length >= 2) {
      leafBox.levels = levels;

      if (options?.forceParent) {
        const topLevel = levels[levels.length - 1];
        return {
          id: topLevel.id,
          type: 'rect',
          x: topLevel.x,
          y: topLevel.y,
          width: topLevel.width,
          height: topLevel.height,
          rx: topLevel.rx,
          levels,
        };
      }
    }

    return leafBox;
  }

  /**
   * 一维边缘连续性与虚线占空比评估 (1D Gap-Bridging Dilation & Duty-Cycle Gate)
   * 阶段 1.8 方案 C：支持标准虚线 (6 6) 与长间隙稀疏虚线 (4 12 / 1 5 Dotted)。
   * 当原始连续性 rawContinuity 处于 [0.14, 0.28) 且扩展架桥 (r=5) 连续性 >= 0.70 时，
   * 统计脉冲空气间隙集合的变异系数 CV_gap = σ_gap / μ_gap。
   * 若 CV_gap <= 0.40 (等距周期性分布，而非散落噪点)，则判定为合法虚线并给予能量补偿。
   */
  private evaluateEdgeContinuity(
    samples: number[],
    gradThreshold = 16,
    bridgeRadius = 2
  ): {
    rawContinuity: number;
    bridgedContinuity: number;
    isDashed: boolean;
    effectiveContinuity: number;
    effectiveEnergyMultiplier: number;
  } {
    const N = samples.length;
    if (N === 0) {
      return {
        rawContinuity: 0,
        bridgedContinuity: 0,
        isDashed: false,
        effectiveContinuity: 0,
        effectiveEnergyMultiplier: 1.0,
      };
    }

    let activeCount = 0;
    const active = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (samples[i] > gradThreshold) {
        active[i] = 1;
        activeCount++;
      }
    }
    const rawContinuity = activeCount / N;

    let bridgedActiveCount = 0;
    for (let i = 0; i < N; i++) {
      let hit = 0;
      const start = Math.max(0, i - bridgeRadius);
      const end = Math.min(N - 1, i + bridgeRadius);
      for (let j = start; j <= end; j++) {
        if (active[j] === 1) {
          hit = 1;
          break;
        }
      }
      if (hit === 1) {
        bridgedActiveCount++;
      }
    }
    const bridgedContinuity = bridgedActiveCount / N;

    // 针对稀疏长间隙虚线 (如 4 12 或圆点线，rawContinuity 处于 [0.12, 0.28))，计算扩展桥接 (r_ext = max(bridgeRadius + 2, 5))
    let extBridgedContinuity = bridgedContinuity;
    let isSparseDashed = false;
    if (rawContinuity >= 0.12 && rawContinuity < 0.28) {
      const extR = Math.max(bridgeRadius + 2, 5);
      let extCount = 0;
      for (let i = 0; i < N; i++) {
        let hit = 0;
        const start = Math.max(0, i - extR);
        const end = Math.min(N - 1, i + extR);
        for (let j = start; j <= end; j++) {
          if (active[j] === 1) {
            hit = 1;
            break;
          }
        }
        if (hit === 1) extCount++;
      }
      extBridgedContinuity = extCount / N;

      // 统计脉冲间隙长度集合的变异系数 CV_gap
      const gaps: number[] = [];
      let curGap = 0;
      let inGap = false;
      for (let i = 0; i < N; i++) {
        if (active[i] === 0) {
          if (inGap) {
            curGap++;
          }
        } else {
          if (inGap && curGap > 0) {
            gaps.push(curGap);
            curGap = 0;
          }
          inGap = true;
        }
      }

      if (gaps.length >= 2 && extBridgedContinuity >= 0.68) {
        let sumG = 0;
        for (const g of gaps) sumG += g;
        const meanG = sumG / gaps.length;
        let varG = 0;
        for (const g of gaps) varG += (g - meanG) ** 2;
        const stdG = Math.sqrt(varG / gaps.length);
        const cv = stdG / Math.max(1.0, meanG);
        if (cv <= 0.42) {
          isSparseDashed = true;
        }
      }
    }

    const isDashed = (rawContinuity >= 0.28 && bridgedContinuity >= 0.75) || isSparseDashed;
    const effectiveContinuity = isDashed
      ? Math.max(rawContinuity, (isSparseDashed ? extBridgedContinuity : bridgedContinuity) * 0.92)
      : rawContinuity;
    const effectiveEnergyMultiplier = isDashed ? (isSparseDashed ? 2.2 : 1.8) : 1.0;

    return {
      rawContinuity,
      bridgedContinuity,
      isDashed,
      effectiveContinuity,
      effectiveEnergyMultiplier,
    };
  }

  /**
   * 1D 局部架桥 Sobel 梯度探针 (沿垂直或水平法线方向进行各向异性最大值膨胀)
   * 消除虚线空气缝隙 (4~12px gap)，使射线雷达绝不从虚线缝隙中穿透泄漏
   */
  private getBridgedSobelGx(x: number, y: number, r = 6): number {
    const H = this.height;
    let maxG = 0;
    const y0 = Math.max(1, y - r);
    const y1 = Math.min(H - 2, y + r);
    for (let py = y0; py <= y1; py += 2) {
      const g = Math.max(
        Math.abs(this.getSobelGx(x - 1, py)),
        Math.abs(this.getSobelGx(x, py)),
        Math.abs(this.getSobelGx(x + 1, py))
      );
      if (g > maxG) maxG = g;
      if (maxG > 30) break;
    }
    return maxG;
  }

  private getBridgedSobelGy(x: number, y: number, r = 6): number {
    const W = this.width;
    let maxG = 0;
    const x0 = Math.max(1, x - r);
    const x1 = Math.min(W - 2, x + r);
    for (let px = x0; px <= x1; px += 2) {
      const g = Math.max(
        Math.abs(this.getSobelGy(px, y - 1)),
        Math.abs(this.getSobelGy(px, y)),
        Math.abs(this.getSobelGy(px, y + 1))
      );
      if (g > maxG) maxG = g;
      if (maxG > 30) break;
    }
    return maxG;
  }

  /**
   * 垂直边缘高保真贯穿度积分探针 (阶段 1.8 方案 D & E: 融合多宽度顶帽峰度 K*、内部分割线伪峰剔除与阴影拖尾阻尼)
   */
  private snapVerticalEdge(
    targetX: number,
    yMin: number,
    yMax: number,
    minOffset: number,
    maxOffset: number,
    side?: 'left' | 'right',
    interiorRGB?: [number, number, number]
  ): number {
    const span = yMax - yMin;
    if (span < 12) return targetX;

    // 避开圆角干扰，两端各内缩 6%
    const inset = Math.min(28, Math.max(3, Math.round(span * 0.06)));
    const startY = Math.round(yMin + inset);
    const endY = Math.round(yMax - inset);
    const stepY = Math.max(1, Math.round((endY - startY) / 70));

    const minX = Math.max(1, Math.round(targetX + minOffset));
    const maxX = Math.min(this.width - 2, Math.round(targetX + maxOffset));
    if (minX >= maxX) return targetX;

    const totalSteps = maxX - minX + 1;
    const avgEnergyArr = new Float32Array(totalSteps);
    const continuityArr = new Float32Array(totalSteps);
    const multiplierArr = new Float32Array(totalSteps);

    const bridgeRadius = Math.max(1, Math.min(4, Math.round(8 / stepY)));

    // 1. 第一步：沿 X 轴扫描窗口，采集每一列的平均梯度能级与 1D 连续性
    for (let x = minX; x <= maxX; x++) {
      const idx = x - minX;
      const samples: number[] = [];
      let edgeEnergy = 0;

      for (let y = startY; y <= endY; y += stepY) {
        const gx = Math.abs(this.getSobelGx(x, y));
        edgeEnergy += gx;
        samples.push(gx);
      }

      const totalSamples = samples.length;
      avgEnergyArr[idx] = totalSamples > 0 ? edgeEnergy / totalSamples : 0;
      const { effectiveContinuity, effectiveEnergyMultiplier } = this.evaluateEdgeContinuity(
        samples,
        14,
        bridgeRadius
      );
      continuityArr[idx] = effectiveContinuity;
      multiplierArr[idx] = effectiveEnergyMultiplier;
    }

    // 2. 第二步：计算多宽度盒式顶帽峰度比 (Multi-Width Box-Hat Kurtosis Ratio K*)
    // 阶段 1.8 方案 D: 自适应匹配 1px (w=1), 2~3px (w=2), 4~5px (w=3) 物理边框厚度
    const kurtosisArr = new Float32Array(totalSteps);
    for (let i = 0; i < totalSteps; i++) {
      let maxRatio = 0;
      for (const w of [1, 2, 3]) {
        let coreMax = avgEnergyArr[i];
        for (let k = -(w - 1); k <= w - 1; k++) {
          const ci = i + k;
          if (ci >= 0 && ci < totalSteps && avgEnergyArr[ci] > coreMax) {
            coreMax = avgEnergyArr[ci];
          }
        }
        let flankSum = 0;
        let flankCount = 0;
        for (const sideSign of [-1, 1]) {
          for (let d = w; d <= w + 2; d++) {
            const fi = i + sideSign * d;
            if (fi >= 0 && fi < totalSteps) {
              flankSum += avgEnergyArr[fi];
              flankCount++;
            }
          }
        }
        const flankMean = flankCount > 0 ? flankSum / flankCount : coreMax;
        const ratio = coreMax / Math.max(1.0, flankMean);
        if (ratio > maxRatio) maxRatio = ratio;
      }
      kurtosisArr[i] = maxRatio;
    }

    const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));

    // 内部分割线 / 装饰条判据 (双侧色差对称性检验)
    const isInternalDivider = (xCoord: number): boolean => {
      if (!interiorRGB) return false;
      const innerX = side === 'left' ? xCoord + 6 : xCoord - 6;
      const outerX = side === 'left' ? xCoord - 6 : xCoord + 6;
      if (innerX < 0 || innerX >= this.width || outerX < 0 || outerX >= this.width) return false;
      const centerY = Math.round((startY + endY) / 2);
      let innerMatch = 0;
      let outerMatch = 0;
      const checkYs = [
        Math.round(startY + (endY - startY) * 0.25),
        centerY,
        Math.round(startY + (endY - startY) * 0.75),
      ];
      for (const cy of checkYs) {
        const [ir, ig, ib] = this.getRGB(innerX, cy);
        const [or, og, ob] = this.getRGB(outerX, cy);
        const distIn = Math.sqrt(
          2 * (ir - interiorRGB[0]) ** 2 + 4 * (ig - interiorRGB[1]) ** 2 + 3 * (ib - interiorRGB[2]) ** 2
        );
        const distOut = Math.sqrt(
          2 * (or - interiorRGB[0]) ** 2 + 4 * (og - interiorRGB[1]) ** 2 + 3 * (ob - interiorRGB[2]) ** 2
        );
        if (distIn <= 18) innerMatch++;
        if (distOut <= 18) outerMatch++;
      }
      return innerMatch >= 2 && outerMatch >= 2;
    };

    // 3. 第三步：寻找是否存在物理硬边框 (Sharp Border Detection)
    let sharpBorderIdx = -1;
    if (side === 'left') {
      // 左边界：卡片内部在右侧 (x 较大侧)，外部在左侧 (x 较小侧)
      // 由内向外扫描：从右向左寻找第一个尖锐脉冲峰，并向外跨越至多 4px 边框厚度锁定最外层
      for (let i = totalSteps - 1; i >= 0; i--) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5) {
          const xCoord = minX + i;
          if (interiorRGB && maxDist > 14 && isInternalDivider(xCoord)) {
            continue;
          }
          sharpBorderIdx = i;
          for (let k = -4; k <= 0; k++) {
            const ni = i + k;
            if (ni >= 0 && kurtosisArr[ni] >= 1.75 && avgEnergyArr[ni] >= avgEnergyArr[sharpBorderIdx]) {
              sharpBorderIdx = ni;
            }
          }
          break;
        }
      }
    } else if (side === 'right') {
      // 右边界：卡片内部在左侧 (x 较小侧)，外部在右侧 (x 较大侧)
      // 由内向外扫描：从左向右寻找第一个尖锐脉冲峰，并向外跨越至多 4px 边框厚度锁定最外层
      for (let i = 0; i < totalSteps; i++) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5) {
          const xCoord = minX + i;
          if (interiorRGB && maxDist > 14 && isInternalDivider(xCoord)) {
            continue;
          }
          sharpBorderIdx = i;
          for (let k = 0; k <= 4; k++) {
            const ni = i + k;
            if (ni < totalSteps && kurtosisArr[ni] >= 1.75 && avgEnergyArr[ni] >= avgEnergyArr[sharpBorderIdx]) {
              sharpBorderIdx = ni;
            }
          }
          break;
        }
      }
    } else {
      let maxK = -1;
      for (let i = 0; i < totalSteps; i++) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5 && kurtosisArr[i] > maxK) {
          maxK = kurtosisArr[i];
          sharpBorderIdx = i;
        }
      }
    }

    // 4. 第四步：综合置信度评分与由内向外阴影尾部阻尼衰减
    let bestX = targetX;
    let maxScore = -1;

    for (let i = 0; i < totalSteps; i++) {
      const x = minX + i;
      const avgEnergy = avgEnergyArr[i];
      const effCont = continuityArr[i];
      const effMult = multiplierArr[i];
      const kurtosis = kurtosisArr[i];

      const dist = Math.abs(x - targetX);
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.3;

      let tailDamping = 1.0;
      let sharpBoost = 1.0;

      if (sharpBorderIdx !== -1) {
        if (i === sharpBorderIdx) {
          sharpBoost = 1.0 + Math.min(2.5, (kurtosis - 1.0) * 0.9);
        } else if (side === 'left') {
          if (i < sharpBorderIdx) {
            tailDamping = Math.exp(-(sharpBorderIdx - i) / 2.5);
          } else {
            tailDamping = Math.exp(-(i - sharpBorderIdx) / 5.0);
          }
        } else if (side === 'right') {
          if (i > sharpBorderIdx) {
            tailDamping = Math.exp(-(i - sharpBorderIdx) / 2.5);
          } else {
            tailDamping = Math.exp(-(sharpBorderIdx - i) / 5.0);
          }
        } else {
          tailDamping = Math.exp(-Math.abs(i - sharpBorderIdx) / 3.0);
        }
      } else {
        // 纯高斯软阴影 (Elevation Card) 场景：
        // 寻找高斯拐点（二阶差分凹凸性极值）
        if (i > 0 && i < totalSteps - 1) {
          const d2 = avgEnergyArr[i - 1] - 2 * avgEnergyArr[i] + avgEnergyArr[i + 1];
          if (d2 < -0.5) {
            sharpBoost = 1.0 + Math.min(1.5, Math.abs(d2) * 0.2);
          }
        }
      }

      let dividerPenalty = 1.0;
      if (interiorRGB && maxDist > 14 && isInternalDivider(x)) {
        dividerPenalty = 0.25;
      }

      const score = avgEnergy * effMult * (1 + effCont * 2.0) * distanceWeight * sharpBoost * tailDamping * dividerPenalty;
      if (score > maxScore) {
        maxScore = score;
        bestX = x;
      }
    }

    return (sharpBorderIdx !== -1 ? maxScore > 14 : maxScore > 4.5) ? bestX : targetX;
  }

  /**
   * 水平边缘高保真贯穿度积分探针 (阶段 1.8 方案 D & E: 融合多宽度顶帽峰度 K*、内部分割线伪峰剔除与阴影拖尾阻尼)
   */
  private snapHorizontalEdge(
    targetY: number,
    xMin: number,
    xMax: number,
    minOffset: number,
    maxOffset: number,
    side?: 'top' | 'bottom',
    interiorRGB?: [number, number, number]
  ): number {
    const span = xMax - xMin;
    if (span < 12) return targetY;

    const inset = Math.min(28, Math.max(3, Math.round(span * 0.06)));
    const startX = Math.round(xMin + inset);
    const endX = Math.round(xMax - inset);
    const stepX = Math.max(1, Math.round((endX - startX) / 70));

    const minY = Math.max(1, Math.round(targetY + minOffset));
    const maxY = Math.min(this.height - 2, Math.round(targetY + maxOffset));
    if (minY >= maxY) return targetY;

    const totalSteps = maxY - minY + 1;
    const avgEnergyArr = new Float32Array(totalSteps);
    const continuityArr = new Float32Array(totalSteps);
    const multiplierArr = new Float32Array(totalSteps);

    const bridgeRadius = Math.max(1, Math.min(4, Math.round(8 / stepX)));

    // 1. 第一步：沿 Y 轴扫描窗口，采集每一行的平均梯度能级与 1D 连续性
    for (let y = minY; y <= maxY; y++) {
      const idx = y - minY;
      const samples: number[] = [];
      let edgeEnergy = 0;

      for (let x = startX; x <= endX; x += stepX) {
        const gy = Math.abs(this.getSobelGy(x, y));
        edgeEnergy += gy;
        samples.push(gy);
      }

      const totalSamples = samples.length;
      avgEnergyArr[idx] = totalSamples > 0 ? edgeEnergy / totalSamples : 0;
      const { effectiveContinuity, effectiveEnergyMultiplier } = this.evaluateEdgeContinuity(
        samples,
        14,
        bridgeRadius
      );
      continuityArr[idx] = effectiveContinuity;
      multiplierArr[idx] = effectiveEnergyMultiplier;
    }

    // 2. 第二步：计算多宽度盒式顶帽峰度比 (Multi-Width Box-Hat Kurtosis Ratio K*)
    const kurtosisArr = new Float32Array(totalSteps);
    for (let i = 0; i < totalSteps; i++) {
      let maxRatio = 0;
      for (const w of [1, 2, 3]) {
        let coreMax = avgEnergyArr[i];
        for (let k = -(w - 1); k <= w - 1; k++) {
          const ci = i + k;
          if (ci >= 0 && ci < totalSteps && avgEnergyArr[ci] > coreMax) {
            coreMax = avgEnergyArr[ci];
          }
        }
        let flankSum = 0;
        let flankCount = 0;
        for (const sideSign of [-1, 1]) {
          for (let d = w; d <= w + 2; d++) {
            const fi = i + sideSign * d;
            if (fi >= 0 && fi < totalSteps) {
              flankSum += avgEnergyArr[fi];
              flankCount++;
            }
          }
        }
        const flankMean = flankCount > 0 ? flankSum / flankCount : coreMax;
        const ratio = coreMax / Math.max(1.0, flankMean);
        if (ratio > maxRatio) maxRatio = ratio;
      }
      kurtosisArr[i] = maxRatio;
    }

    const maxDist = Math.max(Math.abs(minOffset), Math.abs(maxOffset));

    // 内部分割线 / 装饰条判据 (双侧色差对称性检验)
    const isInternalDivider = (yCoord: number): boolean => {
      if (!interiorRGB) return false;
      const innerY = side === 'top' ? yCoord + 6 : yCoord - 6;
      const outerY = side === 'top' ? yCoord - 6 : yCoord + 6;
      if (innerY < 0 || innerY >= this.height || outerY < 0 || outerY >= this.height) return false;
      const centerX = Math.round((startX + endX) / 2);
      let innerMatch = 0;
      let outerMatch = 0;
      const checkXs = [
        Math.round(startX + (endX - startX) * 0.25),
        centerX,
        Math.round(startX + (endX - startX) * 0.75),
      ];
      for (const cx of checkXs) {
        const [ir, ig, ib] = this.getRGB(cx, innerY);
        const [or, og, ob] = this.getRGB(cx, outerY);
        const distIn = Math.sqrt(
          2 * (ir - interiorRGB[0]) ** 2 + 4 * (ig - interiorRGB[1]) ** 2 + 3 * (ib - interiorRGB[2]) ** 2
        );
        const distOut = Math.sqrt(
          2 * (or - interiorRGB[0]) ** 2 + 4 * (og - interiorRGB[1]) ** 2 + 3 * (ob - interiorRGB[2]) ** 2
        );
        if (distIn <= 18) innerMatch++;
        if (distOut <= 18) outerMatch++;
      }
      return innerMatch >= 2 && outerMatch >= 2;
    };

    // 3. 第三步：寻找是否存在物理硬边框 (Sharp Border Detection)
    let sharpBorderIdx = -1;
    if (side === 'top') {
      // 顶边界：卡片内部在下方 (y 较大侧)，外部在上方 (y 较小侧)
      // 由内向外扫描：从下至上寻找第一个尖锐脉冲峰，并向外跨越至多 4px 边框厚度锁定最外层
      for (let i = totalSteps - 1; i >= 0; i--) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5) {
          const yCoord = minY + i;
          if (interiorRGB && maxDist > 14 && isInternalDivider(yCoord)) {
            continue;
          }
          sharpBorderIdx = i;
          for (let k = -4; k <= 0; k++) {
            const ni = i + k;
            if (ni >= 0 && kurtosisArr[ni] >= 1.75 && avgEnergyArr[ni] >= avgEnergyArr[sharpBorderIdx]) {
              sharpBorderIdx = ni;
            }
          }
          break;
        }
      }
    } else if (side === 'bottom') {
      // 底边界：卡片内部在上方 (y 较小侧)，外部在下方 (y 较大侧)
      // 由内向外扫描：从上至下寻找第一个尖锐脉冲峰，并向外跨越至多 4px 边框厚度锁定最外层
      for (let i = 0; i < totalSteps; i++) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5) {
          const yCoord = minY + i;
          if (interiorRGB && maxDist > 14 && isInternalDivider(yCoord)) {
            continue;
          }
          sharpBorderIdx = i;
          for (let k = 0; k <= 4; k++) {
            const ni = i + k;
            if (ni < totalSteps && kurtosisArr[ni] >= 1.75 && avgEnergyArr[ni] >= avgEnergyArr[sharpBorderIdx]) {
              sharpBorderIdx = ni;
            }
          }
          break;
        }
      }
    } else {
      let maxK = -1;
      for (let i = 0; i < totalSteps; i++) {
        if (kurtosisArr[i] >= 1.75 && avgEnergyArr[i] >= 14 && continuityArr[i] >= 0.5 && kurtosisArr[i] > maxK) {
          maxK = kurtosisArr[i];
          sharpBorderIdx = i;
        }
      }
    }

    // 4. 第四步：综合置信度评分与由内向外阴影尾部阻尼衰减
    let bestY = targetY;
    let maxScore = -1;

    for (let i = 0; i < totalSteps; i++) {
      const y = minY + i;
      const avgEnergy = avgEnergyArr[i];
      const effCont = continuityArr[i];
      const effMult = multiplierArr[i];
      const kurtosis = kurtosisArr[i];

      const dist = Math.abs(y - targetY);
      const distanceWeight = 1 - (dist / (maxDist + 1)) * 0.3;

      let tailDamping = 1.0;
      let sharpBoost = 1.0;

      if (sharpBorderIdx !== -1) {
        if (i === sharpBorderIdx) {
          sharpBoost = 1.0 + Math.min(2.5, (kurtosis - 1.0) * 0.9);
        } else if (side === 'top') {
          if (i < sharpBorderIdx) {
            tailDamping = Math.exp(-(sharpBorderIdx - i) / 2.5);
          } else {
            tailDamping = Math.exp(-(i - sharpBorderIdx) / 5.0);
          }
        } else if (side === 'bottom') {
          if (i > sharpBorderIdx) {
            tailDamping = Math.exp(-(i - sharpBorderIdx) / 2.5);
          } else {
            tailDamping = Math.exp(-(sharpBorderIdx - i) / 5.0);
          }
        } else {
          tailDamping = Math.exp(-Math.abs(i - sharpBorderIdx) / 3.0);
        }
      } else {
        if (i > 0 && i < totalSteps - 1) {
          const d2 = avgEnergyArr[i - 1] - 2 * avgEnergyArr[i] + avgEnergyArr[i + 1];
          if (d2 < -0.5) {
            sharpBoost = 1.0 + Math.min(1.5, Math.abs(d2) * 0.2);
          }
        }
      }

      let dividerPenalty = 1.0;
      if (interiorRGB && maxDist > 14 && isInternalDivider(y)) {
        dividerPenalty = 0.25;
      }

      const score = avgEnergy * effMult * (1 + effCont * 2.0) * distanceWeight * sharpBoost * tailDamping * dividerPenalty;
      if (score > maxScore) {
        maxScore = score;
        bestY = y;
      }
    }

    return (sharpBorderIdx !== -1 ? maxScore > 14 : maxScore > 4.5) ? bestY : targetY;
  }

  /**
   * 【模式二：一键单击秒级吸附 (Click-to-Snap)】
   * 采用「阶段 1 纯前端形态学闭运算 (Morphological Closing)」作为主引擎，
   * 彻底在图像空间融化文字空洞，秒级咬合外边框；
   * 遭遇纯透明线框或虚线编组框时，自动进入「阶段 1.7 Task 3 梯度域闭合追踪器」；
   * 失败时平滑降级至「阶段 0 射线多雷达」兜底。
   */
  public snapPoint(
    clickX: number,
    clickY: number,
    options?: { forceParent?: boolean }
  ): SnappedBox | null {
    if (!this.isReady || !this.imgData) return null;

    // 1. 优先执行阶段 1：形态学闭运算引擎 (文字免疫 + 梯度防波堤 + 父子多层级提取)
    const morphBox = this.snapPointMorphological(clickX, clickY, options);
    if (morphBox) {
      return morphBox;
    }

    // 2. 阶段 1.7 Task 3：纯透明线框与虚线边框梯度域闭合雷达 (Wireframe & Dashed Border Seeker)
    const wireBox = this.snapPointWireframe(clickX, clickY, options);
    if (wireBox) {
      return wireBox;
    }

    // 3. 阶段 1.8 方案 D：十字正交长程投影微梯度高程模式 (Elevation Card Seeker)
    const elevationBox = this.snapPointElevation(clickX, clickY, options);
    if (elevationBox) {
      return elevationBox;
    }

    // 4. 降级兜底：阶段 0 启发式多路平行射线雷达
    return this.snapPointRaycast(clickX, clickY);
  }

  /**
   * 【阶段 1.8 方案 D：十字正交长程投影微梯度高程模式 (Elevation Card Seeker)】
   * 针对极浅弥散高斯阴影白底白卡 (alpha = 0.06 ~ 0.16) 的三级穿透降级引擎。
   * 沿 80px 正交条带求平均梯度投影，捕捉微弱阴影跃升拐点与边界。
   */
  private snapPointElevation(
    clickX: number,
    clickY: number,
    _options?: { forceParent?: boolean }
  ): SnappedBox | null {
    const W = this.width;
    const H = this.height;

    // 1. 核心平坦度守卫 (采样周边 16x16 区域的灰度标准差，若超过 3.5 说明非纯净同色核心)
    const grays: number[] = [];
    let sumGray = 0;
    for (let dy = -8; dy <= 8; dy += 2) {
      for (let dx = -8; dx <= 8; dx += 2) {
        const g = this.getGray(clickX + dx, clickY + dy);
        grays.push(g);
        sumGray += g;
      }
    }
    const meanGray = sumGray / grays.length;
    let varGray = 0;
    for (const g of grays) {
      varGray += (g - meanGray) ** 2;
    }
    const stdGray = Math.sqrt(varGray / grays.length);
    if (stdGray > 3.5) {
      return null;
    }

    // 2. 十字正交条带投影积分 (Orthogonal Strip Gradient Integration)
    // 水平条带: x 在 [max(4, clickX - 800), min(W - 5, clickX + 800)], y 在 [clickY - 40, clickY + 40]
    const xMinLimit = Math.max(4, clickX - 800);
    const xMaxLimit = Math.min(W - 5, clickX + 800);
    const yStripMin = Math.max(1, clickY - 40);
    const yStripMax = Math.min(H - 2, clickY + 40);

    const gxProj = new Float32Array(xMaxLimit - xMinLimit + 1);
    for (let x = xMinLimit; x <= xMaxLimit; x++) {
      let sumGx = 0;
      let count = 0;
      for (let y = yStripMin; y <= yStripMax; y += 2) {
        sumGx += Math.abs(this.getSobelGx(x, y));
        count++;
      }
      gxProj[x - xMinLimit] = count > 0 ? sumGx / count : 0;
    }

    // 垂直条带: y 在 [max(4, clickY - 600), min(H - 5, clickY + 600)], x 在 [clickX - 40, clickX + 40]
    const yMinLimit = Math.max(4, clickY - 600);
    const yMaxLimit = Math.min(H - 5, clickY + 600);
    const xStripMin = Math.max(1, clickX - 40);
    const xStripMax = Math.min(W - 2, clickX + 40);

    const gyProj = new Float32Array(yMaxLimit - yMinLimit + 1);
    for (let y = yMinLimit; y <= yMaxLimit; y++) {
      let sumGy = 0;
      let count = 0;
      for (let x = xStripMin; x <= xStripMax; x += 2) {
        sumGy += Math.abs(this.getSobelGy(x, y));
        count++;
      }
      gyProj[y - yMinLimit] = count > 0 ? sumGy / count : 0;
    }

    // 3. 由内向外寻找微梯度拐点 (寻峰与边界定位)
    // 向左寻找 xL
    let xL = -1;
    for (let x = clickX - 16; x >= xMinLimit + 4; x--) {
      const g = gxProj[x - xMinLimit];
      if (g >= 1.8) {
        let peakX = x;
        let maxG = g;
        for (let dx = -4; dx <= 2; dx++) {
          const curX = x + dx;
          if (curX >= xMinLimit && curX <= xMaxLimit) {
            const curG = gxProj[curX - xMinLimit];
            if (curG > maxG) {
              maxG = curG;
              peakX = curX;
            }
          }
        }
        xL = peakX;
        break;
      }
    }

    // 向右寻找 xR
    let xR = -1;
    for (let x = clickX + 16; x <= xMaxLimit - 4; x++) {
      const g = gxProj[x - xMinLimit];
      if (g >= 1.8) {
        let peakX = x;
        let maxG = g;
        for (let dx = -2; dx <= 4; dx++) {
          const curX = x + dx;
          if (curX >= xMinLimit && curX <= xMaxLimit) {
            const curG = gxProj[curX - xMinLimit];
            if (curG > maxG) {
              maxG = curG;
              peakX = curX;
            }
          }
        }
        xR = peakX;
        break;
      }
    }

    // 向上寻找 yT
    let yT = -1;
    for (let y = clickY - 16; y >= yMinLimit + 4; y--) {
      const g = gyProj[y - yMinLimit];
      if (g >= 1.8) {
        let peakY = y;
        let maxG = g;
        for (let dy = -4; dy <= 2; dy++) {
          const curY = y + dy;
          if (curY >= yMinLimit && curY <= yMaxLimit) {
            const curG = gyProj[curY - yMinLimit];
            if (curG > maxG) {
              maxG = curG;
              peakY = curY;
            }
          }
        }
        yT = peakY;
        break;
      }
    }

    // 向下寻找 yB
    let yB = -1;
    for (let y = clickY + 16; y <= yMaxLimit - 4; y++) {
      const g = gyProj[y - yMinLimit];
      if (g >= 1.8) {
        let peakY = y;
        let maxG = g;
        for (let dy = -2; dy <= 4; dy++) {
          const curY = y + dy;
          if (curY >= yMinLimit && curY <= yMaxLimit) {
            const curG = gyProj[curY - yMinLimit];
            if (curG > maxG) {
              maxG = curG;
              peakY = curY;
            }
          }
        }
        yB = peakY;
        break;
      }
    }

    if (xL === -1 || xR === -1 || yT === -1 || yB === -1) {
      return null;
    }

    const w = xR - xL;
    const h = yB - yT;
    if (w < 40 || h < 24 || w > W * 0.95 || h > H * 0.95) {
      return null;
    }

    const centerX = (xL + xR) / 2;
    const centerY = (yT + yB) / 2;
    if (Math.abs(centerX - clickX) / w > 0.48 || Math.abs(centerY - clickY) / h > 0.48) {
      return null;
    }

    // 4. 几何边框精修与圆角拟合
    const refined = this.snapRectBounds({ x: xL, y: yT, width: w, height: h }, 12);
    const rx = this.estimateCornerRadiusWireframe(refined);

    const leafBox: SnappedBox = {
      id: `box-${Date.now().toString().slice(-6)}`,
      type: 'rect',
      x: refined.x,
      y: refined.y,
      width: refined.width,
      height: refined.height,
      rx,
    };

    return leafBox;
  }

  /**
   * 阶段 1：纯前端形态学闭运算核心实现 (Morphological Closing & Dual-Criterion Flood-fill)
   * 1. 局部优势底色聚类 (Dominant Background Profiler)
   * 2. 自适应局部 ROI 窗口 (Adaptive Local ROI Window)
   * 3. 双准则泛洪 (Dual-Criterion Flood-fill: 颜色加权容差 + Sobel 梯度防波堤)
   * 4. 可分离 1D 形态学闭运算 (Separable 1D Dilation + Erosion: 融平文字空洞)
   * 5. 最小外接矩形提取 + 阶段 0 几何包围盒一致性守卫
   * 阶段 1.6：工业级全场景通用形态学闭运算引擎 (Phase 1.6 Industrial Generalization Engine)
   * 1. 环形多尺度底色采样器 (Annular Multi-Ring Profiler: 双同心环采样，彻底免疫彩色 Emoji 图标与文字噪点)
   * 2. 宽广自适应局部 ROI 窗口 (Wide-Span Adaptive ROI Window: 覆盖画幅 92%，彻底解决大卡片水平截断)
   * 3. 双轴跨文本与段落多点探针 (Dual-Axis Multi-Seed & Bridge Expansion: 水平+垂直连通桥突破长句子物理阻隔)
   * 4. 局部动态漂移容差与步长微分 (Floating Gradient Tolerance: 邻域差分导数约束，平滑容纳 CSS 线性渐变)
   * 5. 非对称各向异性可分离形态学核 (Anisotropic Separable Kernel: rx=6 保边界，ry=14 跨越段落多行小字)
   * 6. 高宽比自适应几何守卫 (Aspect-Aware Consistency Guards: 宽卡片硬包容守护，杜绝静默拦截)
   * 7. 亚像素物理边框约束精修 (Secondary Snap Refinement: 毫秒级锁定 1px 闭合外边框)
   * 8. 阶段 1.7：物理圆角自适应拟合与父子嵌套容器多级阶梯提取
   */
  private snapPointMorphological(
    clickX: number,
    clickY: number,
    options?: { forceParent?: boolean }
  ): SnappedBox | null {
    const W = this.width;
    const H = this.height;

    // 1. 局部优势底色聚类采样 (Dominant Background Profiler)
    // 1. 紧凑三同心环平坦度加权底色采样器 (Compact 3-Ring Dominant Background Profiler)
    // 采用 0px, 8px, 16px, 24px 三层紧凑同心环：
    // 既能让 r=16px 跨过 22px 粗体大字正中落入卡片底色，又保证 r=24px 绝不跳出 64px 高度的小微型 Badge 卡片！
    const sampleCoords: [number, number][] = [];
    const colorSamples: [number, number, number][] = [];
    const gradSamples: number[] = [];

    const radii = [0, 8, 16, 24];
    const counts = [1, 8, 12, 12];
    for (let rIdx = 0; rIdx < radii.length; rIdx++) {
      const r = radii[rIdx];
      const count = counts[rIdx];
      if (r === 0) {
        sampleCoords.push([clickX, clickY]);
        colorSamples.push(this.getRGB(clickX, clickY));
        const gx = this.getSobelGx(clickX, clickY);
        const gy = this.getSobelGy(clickX, clickY);
        gradSamples.push(Math.hypot(gx, gy));
      } else {
        for (let i = 0; i < count; i++) {
          const angle = (i * 2 * Math.PI) / count;
          const sx = Math.max(0, Math.min(W - 1, Math.round(clickX + r * Math.cos(angle))));
          const sy = Math.max(0, Math.min(H - 1, Math.round(clickY + r * Math.sin(angle))));
          sampleCoords.push([sx, sy]);
          colorSamples.push(this.getRGB(sx, sy));
          const gx = this.getSobelGx(sx, sy);
          const gy = this.getSobelGy(sx, sy);
          gradSamples.push(Math.hypot(gx, gy));
        }
      }
    }

    // (3) 平坦度加权聚类与候选簇列表提取 (簇半径 30)
    interface ClusterCandidate {
      indices: number[];
      score: number;
    }
    const candidates: ClusterCandidate[] = [];
    const visitedSamples = new Uint8Array(colorSamples.length);

    for (let i = 0; i < colorSamples.length; i++) {
      if (visitedSamples[i] === 1) continue;
      const cluster: number[] = [i];
      const [r1, g1, b1] = colorSamples[i];
      let totalGrad = gradSamples[i];

      for (let j = 0; j < colorSamples.length; j++) {
        if (i === j) continue;
        const [r2, g2, b2] = colorSamples[j];
        const dist = Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
        if (dist <= 30) {
          cluster.push(j);
          totalGrad += gradSamples[j];
        }
      }

      if (cluster.length >= 4) {
        for (const idx of cluster) {
          visitedSamples[idx] = 1;
        }
        const avgGrad = totalGrad / cluster.length;
        const score = cluster.length / (1 + avgGrad * 0.12);
        candidates.push({ indices: cluster, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length === 0) return null;

    // 候选簇降级循环 (最多尝试前 3 个候选簇，当第一候选仅为单行大字/标题时，平滑降级至第二候选卡片真底色)
    for (const candidate of candidates.slice(0, 3)) {
      const bestClusterIndices = candidate.indices;

      let baseR = 0, baseG = 0, baseB = 0;
      for (const idx of bestClusterIndices) {
        baseR += colorSamples[idx][0];
        baseG += colorSamples[idx][1];
        baseB += colorSamples[idx][2];
      }
      baseR /= bestClusterIndices.length;
      baseG /= bestClusterIndices.length;
      baseB /= bestClusterIndices.length;

      // 寻找距离点击点最近且属于优势底色的真实像素作为主种子点
      let bestSeedX = clickX;
      let bestSeedY = clickY;
      let minSeedDist = Infinity;
      for (const idx of bestClusterIndices) {
        const [sx, sy] = sampleCoords[idx];
        const d = Math.hypot(sx - clickX, sy - clickY);
        if (d < minSeedDist) {
          minSeedDist = d;
          bestSeedX = sx;
          bestSeedY = sy;
        }
      }

      // 2. 宽广自适应局部 ROI 窗口化计算 (Wide-Span Adaptive Local ROI Window)
      // 覆盖全图 (上限扩展至 2600px x 1800px)，彻底解决大尺寸全通栏业务卡片水平截断问题
      const maxRoiW = Math.min(2600, Math.max(600, W));
      const maxRoiH = Math.min(1800, Math.max(400, H));
      const halfW = Math.round(maxRoiW / 2);
      const halfH = Math.round(maxRoiH / 2);

      let roiX0 = Math.max(0, bestSeedX - halfW);
      let roiY0 = Math.max(0, bestSeedY - halfH);
      let roiX1 = Math.min(W - 1, roiX0 + maxRoiW - 1);
      let roiY1 = Math.min(H - 1, roiY0 + maxRoiH - 1);

      if (roiX1 - roiX0 < maxRoiW - 1 && roiX0 > 0) {
        roiX0 = Math.max(0, roiX1 - maxRoiW + 1);
      }
      if (roiY1 - roiY0 < maxRoiH - 1 && roiY0 > 0) {
        roiY0 = Math.max(0, roiY1 - maxRoiH + 1);
      }

      const roiW = roiX1 - roiX0 + 1;
      const roiH = roiY1 - roiY0 + 1;

      const roiSeedX = bestSeedX - roiX0;
      const roiSeedY = bestSeedY - roiY0;
      const roiSize = roiW * roiH;

      // 3. 垂直连通桥多点探针与双准则泛洪区域生长 (Vertical Multi-Seed & Floating Gradient Flood-fill)
      const mask = new Uint8Array(roiSize);
      const queue = new Int32Array(roiSize);
      let head = 0;
      let tail = 0;

      mask[roiSeedY * roiW + roiSeedX] = 1;
      queue[tail++] = (roiSeedY << 16) | roiSeedX;

      // 垂直跨文本行多点探针 (±16, ±26, ±36, ±48, ±64px)
      for (const vdy of [-64, -48, -36, -26, -16, 16, 26, 36, 48, 64]) {
        const probeY = bestSeedY + vdy;
        if (probeY >= 0 && probeY < H) {
          const [pr, pg, pb] = this.getRGB(bestSeedX, probeY);
          const dr = pr - baseR;
          const dg = pg - baseG;
          const db = pb - baseB;
          const pDist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
          if (pDist <= 16) {
            const probeRoiY = probeY - roiY0;
            const probeRoiX = bestSeedX - roiX0;
            if (probeRoiY >= 0 && probeRoiY < roiH && mask[probeRoiY * roiW + probeRoiX] === 0) {
              mask[probeRoiY * roiW + probeRoiX] = 1;
              queue[tail++] = (probeRoiY << 16) | probeRoiX;
            }
          }
        }
      }

      const maxFillLimit = Math.round(roiSize * 0.88);

      let floodMinX = roiW, floodMaxX = 0, floodMinY = roiH, floodMaxY = 0;

      while (head < tail) {
        if (tail > maxFillLimit) {
          break;
        }

        const packed = queue[head++];
        const cy = packed >> 16;
        const cx = packed & 0xffff;

        if (cx < floodMinX) floodMinX = cx;
        if (cx > floodMaxX) floodMaxX = cx;
        if (cy < floodMinY) floodMinY = cy;
        if (cy > floodMaxY) floodMaxY = cy;

        const currentGlobalX = roiX0 + cx;
        const currentGlobalY = roiY0 + cy;
        const [cr, cg, cb] = this.getRGB(currentGlobalX, currentGlobalY);

        const neighbors = [
          cx + 1, cy,
          cx - 1, cy,
          cx, cy + 1,
          cx, cy - 1,
        ];

        for (let i = 0; i < 8; i += 2) {
          const nx = neighbors[i];
          const ny = neighbors[i + 1];

          if (nx < 0 || nx >= roiW || ny < 0 || ny >= roiH) continue;
          const nIdx = ny * roiW + nx;
          if (mask[nIdx] !== 0) continue;

          const globalX = roiX0 + nx;
          const globalY = roiY0 + ny;
          const [r, g, b] = this.getRGB(globalX, globalY);

          const sdr = r - cr;
          const sdg = g - cg;
          const sdb = b - cb;
          const stepDist = Math.sqrt(2 * sdr * sdr + 4 * sdg * sdg + 3 * sdb * sdb);

          if (stepDist > 18) continue;

          const dr = r - baseR;
          const dg = g - baseG;
          const db = b - baseB;
          const colorDist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);

          if (colorDist > 8) {
            const gx = this.getSobelGx(globalX, globalY);
            const gy = this.getSobelGy(globalX, globalY);
            const grad = Math.hypot(gx, gy);

            const maxDist = (grad <= 14 && stepDist <= 6) ? 85 : 26;
            if (colorDist > maxDist) continue;

            if (grad > 22) continue;
          }

          mask[nIdx] = 1;
          queue[tail++] = (ny << 16) | nx;
        }
      }

      if (tail > maxFillLimit || tail < 400 || floodMinX >= floodMaxX || floodMinY >= floodMaxY) {
        continue;
      }

      // 4. 非对称各向异性空间可分离形态学闭运算
      const rx = 6;
      const ry = 14;

      const actX0 = Math.max(0, floodMinX - rx - 2);
      const actX1 = Math.min(roiW - 1, floodMaxX + rx + 2);
      const actY0 = Math.max(0, floodMinY - ry - 2);
      const actY1 = Math.min(roiH - 1, floodMaxY + ry + 2);

      const temp = new Uint8Array(roiSize);

      for (let y = actY0; y <= actY1; y++) {
        const rowOffset = y * roiW;
        let countOnes = 0;
        for (let x = actX0 - rx; x <= actX0 + rx; x++) {
          if (x >= 0 && x < roiW && mask[rowOffset + x] === 1) countOnes++;
        }
        for (let x = actX0; x <= actX1; x++) {
          temp[rowOffset + x] = countOnes > 0 ? 1 : 0;
          const removeX = x - rx;
          if (removeX >= 0 && mask[rowOffset + removeX] === 1) countOnes--;
          const addX = x + rx + 1;
          if (addX < roiW && mask[rowOffset + addX] === 1) countOnes++;
        }
      }

      for (let x = actX0; x <= actX1; x++) {
        let countOnes = 0;
        for (let y = actY0 - ry; y <= actY0 + ry; y++) {
          if (y >= 0 && y < roiH && temp[y * roiW + x] === 1) countOnes++;
        }
        for (let y = actY0; y <= actY1; y++) {
          mask[y * roiW + x] = countOnes > 0 ? 1 : 0;
          const removeY = y - ry;
          if (removeY >= 0 && temp[removeY * roiW + x] === 1) countOnes--;
          const addY = y + ry + 1;
          if (addY < roiH && temp[(y + ry + 1) * roiW + x] === 1) countOnes++;
        }
      }

      for (let y = actY0; y <= actY1; y++) {
        const rowOffset = y * roiW;
        let countOnes = 0;
        let winSize = 0;
        for (let x = actX0 - rx; x <= actX0 + rx; x++) {
          if (x >= 0 && x < roiW) {
            winSize++;
            if (mask[rowOffset + x] === 1) countOnes++;
          }
        }
        for (let x = actX0; x <= actX1; x++) {
          temp[rowOffset + x] = countOnes === winSize && winSize > 0 ? 1 : 0;
          const removeX = x - rx;
          if (removeX >= 0) {
            winSize--;
            if (mask[rowOffset + removeX] === 1) countOnes--;
          }
          const addX = x + rx + 1;
          if (addX < roiW) {
            winSize++;
            if (mask[rowOffset + addX] === 1) countOnes++;
          }
        }
      }

      for (let x = actX0; x <= actX1; x++) {
        let countOnes = 0;
        let winSize = 0;
        for (let y = actY0 - ry; y <= actY0 + ry; y++) {
          if (y >= 0 && y < roiH) {
            winSize++;
            if (temp[y * roiW + x] === 1) countOnes++;
          }
        }
        for (let y = actY0; y <= actY1; y++) {
          mask[y * roiW + x] = countOnes === winSize && winSize > 0 ? 1 : 0;
          const removeY = y - ry;
          if (removeY >= 0) {
            winSize--;
            if (temp[removeY * roiW + x] === 1) countOnes--;
          }
          const addY = y + ry + 1;
          if (addY < roiH) {
            winSize++;
            if (temp[(y + ry + 1) * roiW + x] === 1) countOnes++;
          }
        }
      }

      // 5. 提取连通域包围盒
      let minX = actX1, maxX = actX0, minY = actY1, maxY = actY0;
      let solidPixels = 0;

      for (let y = actY0; y <= actY1; y++) {
        const rowOffset = y * roiW;
        for (let x = actX0; x <= actX1; x++) {
          if (mask[rowOffset + x] === 1) {
            solidPixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (solidPixels < 600 || minX >= maxX || minY >= maxY) {
        continue;
      }

      const globalX = roiX0 + minX;
      const globalY = roiY0 + minY;
      const globalW = maxX - minX + 1;
      const globalH = maxY - minY + 1;

      // 6. 阶段 0 几何包围盒一致性守卫
      if (globalW < 40 || globalH < 24) {
        continue;
      }

      if (globalW >= W - 32 && globalH >= H - 32) {
        continue;
      }

      const ar = globalW / globalH;
      if (ar < 0.15 || ar > 12.0) {
        continue;
      }

      if (
        clickX < globalX - 8 ||
        clickX > globalX + globalW + 8 ||
        clickY < globalY - 8 ||
        clickY > globalY + globalH + 8
      ) {
        continue;
      }

      const boxCenterX = globalX + globalW / 2;
      const boxCenterY = globalY + globalH / 2;
      const offsetXRatio = Math.abs(boxCenterX - clickX) / globalW;
      const offsetYRatio = Math.abs(boxCenterY - clickY) / globalH;

      if (offsetYRatio > 0.48) {
        continue;
      }

      if (ar <= 2.2 && offsetXRatio > 0.48) {
        continue;
      }

      // 7. 调用 snapRectBounds 进行亚像素物理边框精修
      const refineMargin = Math.min(10, Math.max(4, Math.round(Math.min(globalW, globalH) * 0.08)));
      const refined = this.snapRectBounds(
        {
          x: globalX,
          y: globalY,
          width: globalW,
          height: globalH,
        },
        refineMargin
      );

      // 8. 阶段 1.7：物理圆角自适应拟合 (Adaptive Corner Radius rx Estimation)
      const estimatedRx = this.estimateCornerRadius(refined, baseR, baseG, baseB);

      const leafBox: SnappedBox = {
        id: `box-${Date.now().toString().slice(-6)}`,
        type: 'rect',
        x: refined.x,
        y: refined.y,
        width: refined.width,
        height: refined.height,
        rx: estimatedRx,
      };

      // 9. 阶段 1.8 方案 B：多层级包含关系提取 (支持 N 层冒泡)
      const levels = this.buildHierarchyLevels(leafBox, baseR, baseG, baseB, 4);
      if (levels && levels.length >= 2) {
        leafBox.levels = levels;

        if (options?.forceParent) {
          const topLevel = levels[levels.length - 1];
          return {
            id: topLevel.id,
            type: 'rect',
            x: topLevel.x,
            y: topLevel.y,
            width: topLevel.width,
            height: topLevel.height,
            rx: topLevel.rx,
            levels,
          };
        }
      }

      return leafBox;
    }

    return null;
  }

  /**
   * 阶段 1.8 方案 B：多层级嵌套容器自适应提取 (Hierarchical Container Extraction)
   * 采用 1D 平坦段滑窗扫描器向外探测，内生闭合自然终止守卫，防刺穿隔壁兄弟卡片
   */
  private extractParentContainer(
    leafBox: { x: number; y: number; width: number; height: number },
    leafBaseR: number,
    leafBaseG: number,
    leafBaseB: number
  ): { box: SnappedBox; baseRGB: [number, number, number] } | null {
    const W = this.width;
    const H = this.height;

    // 1. 沿叶子卡片 4 方向发射法向一维连续平坦段滑窗扫描射线 (1D Flat-Segment Ray Scanner)
    const scanRays: Array<{
      startX: number;
      startY: number;
      stepX: number;
      stepY: number;
    }> = [
      // Top rays
      { startX: Math.round(leafBox.x + leafBox.width * 0.33), startY: leafBox.y, stepX: 0, stepY: -1 },
      { startX: Math.round(leafBox.x + leafBox.width * 0.5), startY: leafBox.y, stepX: 0, stepY: -1 },
      { startX: Math.round(leafBox.x + leafBox.width * 0.67), startY: leafBox.y, stepX: 0, stepY: -1 },
      // Bottom rays
      { startX: Math.round(leafBox.x + leafBox.width * 0.33), startY: leafBox.y + leafBox.height - 1, stepX: 0, stepY: 1 },
      { startX: Math.round(leafBox.x + leafBox.width * 0.5), startY: leafBox.y + leafBox.height - 1, stepX: 0, stepY: 1 },
      { startX: Math.round(leafBox.x + leafBox.width * 0.67), startY: leafBox.y + leafBox.height - 1, stepX: 0, stepY: 1 },
      // Left rays
      { startX: leafBox.x, startY: Math.round(leafBox.y + leafBox.height * 0.33), stepX: -1, stepY: 0 },
      { startX: leafBox.x, startY: Math.round(leafBox.y + leafBox.height * 0.5), stepX: -1, stepY: 0 },
      { startX: leafBox.x, startY: Math.round(leafBox.y + leafBox.height * 0.67), stepX: -1, stepY: 0 },
      // Right rays
      { startX: leafBox.x + leafBox.width - 1, startY: Math.round(leafBox.y + leafBox.height * 0.33), stepX: 1, stepY: 0 },
      { startX: leafBox.x + leafBox.width - 1, startY: Math.round(leafBox.y + leafBox.height * 0.5), stepX: 1, stepY: 0 },
      { startX: leafBox.x + leafBox.width - 1, startY: Math.round(leafBox.y + leafBox.height * 0.67), stepX: 1, stepY: 0 },
    ];

    const validSeeds: Array<{ x: number; y: number; rgb: [number, number, number] }> = [];

    for (const ray of scanRays) {
      let crossedFirstBoundary = false;
      for (let d = 4; d <= 60; d++) {
        const px = ray.startX + d * ray.stepX;
        const py = ray.startY + d * ray.stepY;
        if (px < 4 || px >= W - 4 || py < 4 || py >= H - 4) break;

        const gx = this.getSobelGx(px, py);
        const gy = this.getSobelGy(px, py);
        const grad = Math.hypot(gx, gy);

        if (grad > 26) {
          if (!crossedFirstBoundary) {
            crossedFirstBoundary = true;
          } else {
            // 遇到二次强边界 (说明已触及相邻兄弟卡片或容器外墙)，立即终止外探防刺穿
            break;
          }
        }

        if (d + 4 <= 64) {
          let isFlat = true;
          const [r0, g0, b0] = this.getRGB(px, py);
          const endPx = ray.startX + (d + 4) * ray.stepX;
          const endPy = ray.startY + (d + 4) * ray.stepY;
          if (endPx < 4 || endPx >= W - 4 || endPy < 4 || endPy >= H - 4) continue;
          const [rEnd, gEnd, bEnd] = this.getRGB(endPx, endPy);

          const spanDiff = Math.sqrt(2 * (r0 - rEnd) ** 2 + 4 * (g0 - gEnd) ** 2 + 3 * (b0 - bEnd) ** 2);
          if (spanDiff > 8) continue;

          for (let k = 0; k <= 4; k++) {
            const kx = ray.startX + (d + k) * ray.stepX;
            const ky = ray.startY + (d + k) * ray.stepY;
            const kgx = this.getSobelGx(kx, ky);
            const kgy = this.getSobelGy(kx, ky);
            if (Math.hypot(kgx, kgy) >= 16) {
              isFlat = false;
              break;
            }
            const [kr, kg, kb] = this.getRGB(kx, ky);
            const distLeaf = Math.sqrt(2 * (kr - leafBaseR) ** 2 + 4 * (kg - leafBaseG) ** 2 + 3 * (kb - leafBaseB) ** 2);
            if (distLeaf < 14) {
              isFlat = false;
              break;
            }
          }

          if (isFlat) {
            const seedX = ray.startX + (d + 2) * ray.stepX;
            const seedY = ray.startY + (d + 2) * ray.stepY;
            validSeeds.push({ x: seedX, y: seedY, rgb: this.getRGB(seedX, seedY) });
            break;
          }
        }
      }
    }

    if (validSeeds.length === 0) {
      const wireParent = this.findEnclosingWireframeContainer(leafBox);
      if (!wireParent) return null;
      const rgb = this.sampleInteriorDominantColor(wireParent, 0.08);
      return { box: wireParent, baseRGB: rgb };
    }

    let bestSeed = validSeeds[0];
    let foundPair = false;

    for (let i = 0; i < validSeeds.length; i++) {
      for (let j = i + 1; j < validSeeds.length; j++) {
        const s1 = validSeeds[i], s2 = validSeeds[j];
        const dr = s1.rgb[0] - s2.rgb[0];
        const dg = s1.rgb[1] - s2.rgb[1];
        const db = s1.rgb[2] - s2.rgb[2];
        const diff = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
        if (diff <= 18) {
          bestSeed = s1;
          foundPair = true;
          break;
        }
      }
      if (foundPair) break;
    }

    // 2. 次级轻量泛洪提取父容器
    const parentBaseR = bestSeed.rgb[0];
    const parentBaseG = bestSeed.rgb[1];
    const parentBaseB = bestSeed.rgb[2];

    const roiX0 = 0;
    const roiY0 = 0;
    const roiW = W;
    const roiH = H;
    const roiSize = roiW * roiH;

    const seedRoiX = bestSeed.x;
    const seedRoiY = bestSeed.y;
    if (!this.pMask || !this.pQueue || !this.pTemp || this.pMask.length < roiSize) {
      this.pMask = new Uint8Array(roiSize);
      this.pQueue = new Int32Array(roiSize);
      this.pTemp = new Uint8Array(roiSize);
    } else {
      this.pMask!.fill(0, 0, roiSize);
      this.pTemp!.fill(0, 0, roiSize);
    }

    const mask = this.pMask!;
    const queue = this.pQueue!;
    let head = 0;
    let tail = 0;

    mask[seedRoiY * roiW + seedRoiX] = 1;
    queue[tail++] = (seedRoiY << 16) | seedRoiX;

    let floodMinX = roiW, floodMaxX = 0, floodMinY = roiH, floodMaxY = 0;
    const maxFillLimit = Math.min(500000, Math.round(roiSize * 0.75));
    let leakedToCanvasEdge = false;

    while (head < tail) {
      if (tail > maxFillLimit) {
        leakedToCanvasEdge = true;
        break;
      }
      const packed = queue[head++];
      const cy = packed >> 16;
      const cx = packed & 0xffff;

      if (cx <= 2 || cx >= roiW - 3 || cy <= 2 || cy >= roiH - 3) {
        leakedToCanvasEdge = true;
        break;
      }

      if (cx < floodMinX) floodMinX = cx;
      if (cx > floodMaxX) floodMaxX = cx;
      if (cy < floodMinY) floodMinY = cy;
      if (cy > floodMaxY) floodMaxY = cy;

      const currentGlobalX = roiX0 + cx;
      const currentGlobalY = roiY0 + cy;
      const [cr, cg, cb] = this.getRGB(currentGlobalX, currentGlobalY);

      const neighbors = [
        cx + 1, cy,
        cx - 1, cy,
        cx, cy + 1,
        cx, cy - 1,
      ];

      for (let i = 0; i < 8; i += 2) {
        const nx = neighbors[i];
        const ny = neighbors[i + 1];
        if (nx < 0 || nx >= roiW || ny < 0 || ny >= roiH) continue;
        const nIdx = ny * roiW + nx;
        if (mask[nIdx] !== 0) continue;

        const globalX = roiX0 + nx;
        const globalY = roiY0 + ny;
        const [r, g, b] = this.getRGB(globalX, globalY);

        const sdr = r - cr;
        const sdg = g - cg;
        const sdb = b - cb;
        const stepDist = Math.sqrt(2 * sdr * sdr + 4 * sdg * sdg + 3 * sdb * sdb);
        if (stepDist > 18) continue;

        const dr = r - parentBaseR;
        const dg = g - parentBaseG;
        const db = b - parentBaseB;
        const colorDist = Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);

        if (colorDist > 10) {
          const gx = this.getSobelGx(globalX, globalY);
          const gy = this.getSobelGy(globalX, globalY);
          const grad = Math.hypot(gx, gy);
          if (colorDist > 32 || grad > 24) continue;
        }

        mask[nIdx] = 1;
        queue[tail++] = (ny << 16) | nx;
      }
    }

    // 阶段 1.8 方案 B：内生闭合自然终止守卫 (拦截全图背景泄漏)
    if (
      leakedToCanvasEdge ||
      tail >= maxFillLimit * 0.85 ||
      tail < 800 ||
      floodMinX <= 2 ||
      floodMaxX >= W - 3 ||
      floodMinY <= 2 ||
      floodMaxY >= H - 3 ||
      floodMinX >= floodMaxX ||
      floodMinY >= floodMaxY
    ) {
      const wireParent = this.findEnclosingWireframeContainer(leafBox);
      if (!wireParent) return null;
      const rgb = this.sampleInteriorDominantColor(wireParent, 0.08);
      return { box: wireParent, baseRGB: rgb };
    }

    // 3. 形态学闭运算填平子卡片空洞与文本行
    const rx = 8;
    const ry = 16;
    const actX0 = Math.max(0, floodMinX - rx - 2);
    const actX1 = Math.min(roiW - 1, floodMaxX + rx + 2);
    const actY0 = Math.max(0, floodMinY - ry - 2);
    const actY1 = Math.min(roiH - 1, floodMaxY + ry + 2);

    const temp = this.pTemp!;

    // 水平膨胀
    for (let y = actY0; y <= actY1; y++) {
      const rowOffset = y * roiW;
      let countOnes = 0;
      for (let x = actX0 - rx; x <= actX0 + rx; x++) {
        if (x >= 0 && x < roiW && mask[rowOffset + x] === 1) countOnes++;
      }
      for (let x = actX0; x <= actX1; x++) {
        temp[rowOffset + x] = countOnes > 0 ? 1 : 0;
        const outX = x - rx;
        const inX = x + rx + 1;
        if (outX >= 0 && outX < roiW && mask[rowOffset + outX] === 1) countOnes--;
        if (inX >= 0 && inX < roiW && mask[rowOffset + inX] === 1) countOnes++;
      }
    }

    // 垂直膨胀
    for (let x = actX0; x <= actX1; x++) {
      let countOnes = 0;
      for (let y = actY0 - ry; y <= actY0 + ry; y++) {
        if (y >= 0 && y < roiH && temp[y * roiW + x] === 1) countOnes++;
      }
      for (let y = actY0; y <= actY1; y++) {
        if (countOnes > 0) mask[y * roiW + x] = 1;
        const outY = y - ry;
        const inY = y + ry + 1;
        if (outY >= 0 && outY < roiH && temp[outY * roiW + x] === 1) countOnes--;
        if (inY >= 0 && inY < roiH && temp[inY * roiW + x] === 1) countOnes++;
      }
    }

    // 水平腐蚀
    const fullW = 2 * rx + 1;
    for (let y = actY0; y <= actY1; y++) {
      const rowOffset = y * roiW;
      let countOnes = 0;
      for (let x = actX0 - rx; x <= actX0 + rx; x++) {
        if (x >= 0 && x < roiW && mask[rowOffset + x] === 1) countOnes++;
      }
      for (let x = actX0; x <= actX1; x++) {
        temp[rowOffset + x] = (countOnes === fullW) ? 1 : 0;
        const outX = x - rx;
        const inX = x + rx + 1;
        if (outX >= 0 && outX < roiW && mask[rowOffset + outX] === 1) countOnes--;
        if (inX >= 0 && inX < roiW && mask[rowOffset + inX] === 1) countOnes++;
      }
    }

    // 垂直腐蚀
    const fullH = 2 * ry + 1;
    for (let x = actX0; x <= actX1; x++) {
      let countOnes = 0;
      for (let y = actY0 - ry; y <= actY0 + ry; y++) {
        if (y >= 0 && y < roiH && temp[y * roiW + x] === 1) countOnes++;
      }
      for (let y = actY0; y <= actY1; y++) {
        mask[y * roiW + x] = (countOnes === fullH) ? 1 : 0;
        const outY = y - ry;
        const inY = y + ry + 1;
        if (outY >= 0 && outY < roiH && temp[outY * roiW + x] === 1) countOnes--;
        if (inY >= 0 && inY < roiH && temp[inY * roiW + x] === 1) countOnes++;
      }
    }

    // 提取外接包围盒
    let pMinX = actX1, pMaxX = actX0, pMinY = actY1, pMaxY = actY0;
    for (let y = actY0; y <= actY1; y++) {
      const rowOffset = y * roiW;
      for (let x = actX0; x <= actX1; x++) {
        if (mask[rowOffset + x] === 1) {
          if (x < pMinX) pMinX = x;
          if (x > pMaxX) pMaxX = x;
          if (y < pMinY) pMinY = y;
          if (y > pMaxY) pMaxY = y;
        }
      }
    }

    if (pMinX >= pMaxX || pMinY >= pMaxY) {
      const wireParent = this.findEnclosingWireframeContainer(leafBox);
      if (!wireParent) return null;
      const rgb = this.sampleInteriorDominantColor(wireParent, 0.08);
      return { box: wireParent, baseRGB: rgb };
    }

    const parentGlobalX = roiX0 + pMinX;
    const parentGlobalY = roiY0 + pMinY;
    const parentGlobalW = pMaxX - pMinX + 1;
    const parentGlobalH = pMaxY - pMinY + 1;

    // 4. 亚像素物理边框精修
    const refineMargin = Math.min(10, Math.max(4, Math.round(Math.min(parentGlobalW, parentGlobalH) * 0.06)));
    const refined = this.snapRectBounds(
      {
        x: parentGlobalX,
        y: parentGlobalY,
        width: parentGlobalW,
        height: parentGlobalH,
      },
      refineMargin
    );

    // 5. 几何包含关系与尺度有效性严格校验 (Parent Enclosure Invariant)
    const enclosesLeaf =
      refined.x <= leafBox.x - 4 &&
      refined.y <= leafBox.y - 4 &&
      refined.x + refined.width >= leafBox.x + leafBox.width + 4 &&
      refined.y + refined.height >= leafBox.y + leafBox.height + 4;

    const scaleValid =
      (refined.width >= leafBox.width * 1.15 || refined.height >= leafBox.height * 1.15) &&
      refined.width <= W * 0.98 &&
      refined.height <= H * 0.98;

    if (!enclosesLeaf || !scaleValid) {
      const wireParent = this.findEnclosingWireframeContainer(leafBox);
      if (!wireParent) return null;
      const rgb = this.sampleInteriorDominantColor(wireParent, 0.08);
      return { box: wireParent, baseRGB: rgb };
    }

    // 6. 四边物理轮廓校验 (Endogenous 4-Edge Continuity Guard)
    const checkInsetX = Math.max(4, Math.round(refined.width * 0.08));
    const checkInsetY = Math.max(4, Math.round(refined.height * 0.08));
    const stepY = Math.max(1, Math.round((refined.height - 2 * checkInsetY) / 50));
    const stepX = Math.max(1, Math.round((refined.width - 2 * checkInsetX) / 50));
    const bridgeR_Y = Math.max(1, Math.min(4, Math.round(8 / stepY)));
    const bridgeR_X = Math.max(1, Math.min(4, Math.round(8 / stepX)));

    const samplesL: number[] = [];
    for (let y = refined.y + checkInsetY; y <= refined.y + refined.height - checkInsetY; y += stepY) {
      samplesL.push(Math.abs(this.getSobelGx(refined.x, y)));
    }
    const contL = this.evaluateEdgeContinuity(samplesL, 14, bridgeR_Y).effectiveContinuity;

    const samplesR: number[] = [];
    for (let y = refined.y + checkInsetY; y <= refined.y + refined.height - checkInsetY; y += stepY) {
      samplesR.push(Math.abs(this.getSobelGx(refined.x + refined.width - 1, y)));
    }
    const contR = this.evaluateEdgeContinuity(samplesR, 14, bridgeR_Y).effectiveContinuity;

    const samplesT: number[] = [];
    for (let x = refined.x + checkInsetX; x <= refined.x + refined.width - checkInsetX; x += stepX) {
      samplesT.push(Math.abs(this.getSobelGy(x, refined.y)));
    }
    const contT = this.evaluateEdgeContinuity(samplesT, 14, bridgeR_X).effectiveContinuity;

    const samplesB: number[] = [];
    for (let x = refined.x + checkInsetX; x <= refined.x + refined.width - checkInsetX; x += stepX) {
      samplesB.push(Math.abs(this.getSobelGy(x, refined.y + refined.height - 1)));
    }
    const contB = this.evaluateEdgeContinuity(samplesB, 14, bridgeR_X).effectiveContinuity;

    const avgCont = (contL + contR + contT + contB) / 4;
    if (avgCont < 0.45 || Math.min(contL, contR, contT, contB) < 0.28) {
      const wireParent = this.findEnclosingWireframeContainer(leafBox);
      if (!wireParent) return null;
      const rgb = this.sampleInteriorDominantColor(wireParent, 0.08);
      return { box: wireParent, baseRGB: rgb };
    }

    // 7. 自适应圆角估计
    const parentRx = this.estimateCornerRadius(refined, parentBaseR, parentBaseG, parentBaseB);

    return {
      box: {
        id: `box-${Date.now().toString().slice(-6)}-p`,
        type: 'rect',
        x: refined.x,
        y: refined.y,
        width: refined.width,
        height: refined.height,
        rx: parentRx,
      },
      baseRGB: [parentBaseR, parentBaseG, parentBaseB],
    };
  }

  /**
   * 阶段 1.8 方案 B：多层级包含关系 N 层冒泡提取器 (Multi-Level Hierarchy Bubbler)
   */
  private buildHierarchyLevels(
    leafBox: SnappedBox,
    leafBaseR: number,
    leafBaseG: number,
    leafBaseB: number,
    maxDepth = 4
  ): SnappedBoxLevel[] | undefined {
    const levels: SnappedBoxLevel[] = [
      {
        level: 0,
        id: leafBox.id,
        type: 'rect',
        x: leafBox.x,
        y: leafBox.y,
        width: leafBox.width,
        height: leafBox.height,
        rx: leafBox.rx,
        label: 'Leaf Component',
      },
    ];

    let currentBox: SnappedBox = leafBox;
    let currentRGB: [number, number, number] = [leafBaseR, leafBaseG, leafBaseB];

    for (let depth = 1; depth < maxDepth; depth++) {
      const parentResult = this.extractParentContainer(
        currentBox,
        currentRGB[0],
        currentRGB[1],
        currentRGB[2]
      );
      if (!parentResult) break;

      const parentBox = parentResult.box;
      levels.push({
        level: depth,
        id: parentBox.id,
        type: 'rect',
        x: parentBox.x,
        y: parentBox.y,
        width: parentBox.width,
        height: parentBox.height,
        rx: parentBox.rx,
        label: depth === 1 ? 'Parent Container' : `Container Level ${depth}`,
      });

      currentBox = parentBox;
      currentRGB = parentResult.baseRGB;
    }

    return levels.length >= 2 ? levels : undefined;
  }

  /**
   * 阶段 1.7：物理圆角自适应拟合 (Adaptive Corner Radius rx Estimation)
   * 沿 4 个拐角 45° 角平分线向内探测，根据几何公式 R = s * (2 + √2) ≈ 3.41421356 * s 反解圆角
   * 融合直角极速归零、中位数多角容错、胶囊标识别与精细 2px 阶梯量化 (0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24...)
   */
  private estimateCornerRadius(
    box: { x: number; y: number; width: number; height: number },
    baseR: number,
    baseG: number,
    baseB: number
  ): number {
    const W = this.width;
    const H = this.height;
    if (!this.imgData || box.width < 12 || box.height < 12) return 16;

    const maxR = Math.min(box.width, box.height) / 2;
    if (maxR < 2) return 0;

    const deltaX = Math.min(36, Math.max(12, Math.round(box.width * 0.18)));
    const deltaY = Math.min(36, Math.max(12, Math.round(box.height * 0.18)));

    const cornerWings = [
      // Top-Left (TL)
      {
        ph: { x: box.x + deltaX, y: box.y - 4 },
        pv: { x: box.x - 4, y: box.y + deltaY },
        dirX: 1,
        dirY: 1,
        searchTopY: true,
        searchLeftX: true,
      },
      // Top-Right (TR)
      {
        ph: { x: box.x + box.width - 1 - deltaX, y: box.y - 4 },
        pv: { x: box.x + box.width + 3, y: box.y + deltaY },
        dirX: -1,
        dirY: 1,
        searchTopY: true,
        searchLeftX: false,
      },
      // Bottom-Left (BL)
      {
        ph: { x: box.x + deltaX, y: box.y + box.height + 3 },
        pv: { x: box.x - 4, y: box.y + box.height - 1 - deltaY },
        dirX: 1,
        dirY: -1,
        searchTopY: false,
        searchLeftX: true,
      },
      // Bottom-Right (BR)
      {
        ph: { x: box.x + box.width - 1 - deltaX, y: box.y + box.height + 3 },
        pv: { x: box.x + box.width + 3, y: box.y + box.height - 1 - deltaY },
        dirX: -1,
        dirY: -1,
        searchTopY: false,
        searchLeftX: false,
      },
    ];

    const cornerConfigs = cornerWings.map((w) => {
      const hx = Math.max(0, Math.min(W - 1, w.ph.x));
      const hy = Math.max(0, Math.min(H - 1, w.ph.y));
      const vx = Math.max(0, Math.min(W - 1, w.pv.x));
      const vy = Math.max(0, Math.min(H - 1, w.pv.y));

      const gradH = Math.hypot(this.getSobelGx(hx, hy), this.getSobelGy(hx, hy));
      const gradV = Math.hypot(this.getSobelGx(vx, vy), this.getSobelGy(vx, vy));

      // 选取梯度较小的一点作为该拐角专属背景点 (避开流程图连接线污染)
      const bgPoint = gradH <= gradV ? { x: hx, y: hy } : { x: vx, y: vy };
      return {
        bgX: bgPoint.x,
        bgY: bgPoint.y,
        dirX: w.dirX,
        dirY: w.dirY,
        searchTopY: w.searchTopY,
        searchLeftX: w.searchLeftX,
      };
    });

    // 若背景与卡片底色几乎无色差 (如白底白卡悬浮卡片、纯透明线框等)，直接降级至梯度域对角线测算器
    let avgBgDist = 0;
    for (const cfg of cornerConfigs) {
      const [bgR, bgG, bgB] = this.getRGB(cfg.bgX, cfg.bgY);
      avgBgDist += Math.sqrt(
        2 * (bgR - baseR) ** 2 + 4 * (bgG - baseG) ** 2 + 3 * (bgB - baseB) ** 2
      );
    }
    avgBgDist /= cornerConfigs.length;

    if (avgBgDist <= 10) {
      return this.estimateCornerRadiusWireframe(box);
    }

    const estimatedRadii: number[] = [];

    for (const cfg of cornerConfigs) {
      const [bgR, bgG, bgB] = this.getRGB(cfg.bgX, cfg.bgY);
      const bgToBaseDist = Math.sqrt(
        2 * (bgR - baseR) ** 2 + 4 * (bgG - baseG) ** 2 + 3 * (bgB - baseB) ** 2
      );

      // 色差门限：背景与卡片底色的区分门限
      const bgDistThreshold = Math.min(22, Math.max(8, bgToBaseDist * 0.45));

      const isCard = (x: number, y: number): boolean => {
        if (x < 0 || x >= W || y < 0 || y >= H) return false;
        const [r, g, b] = this.getRGB(x, y);
        const distBase = Math.sqrt(
          2 * (r - baseR) ** 2 + 4 * (g - baseG) ** 2 + 3 * (b - baseB) ** 2
        );
        const distBg = Math.sqrt(
          2 * (r - bgR) ** 2 + 4 * (g - bgG) ** 2 + 3 * (b - bgB) ** 2
        );

        // 如果自身比卡片底色更接近背景色，绝非卡片实体内部
        if (distBg <= distBase) return false;

        // 若色差极其贴近卡片底色，必定是卡片实体内部
        if (distBase <= Math.min(22, bgToBaseDist * 0.45)) return true;

        // 若处于 1px 物理高频边界线上 (梯度高且比背景更具底色亲和力)
        const gx = Math.abs(this.getSobelGx(x, y));
        const gy = Math.abs(this.getSobelGy(x, y));
        if (Math.hypot(gx, gy) >= 14 && distBase < distBg) {
          return true;
        }

        // 常规背景色差门限 (排除外部弥散软阴影)
        return distBg > bgDistThreshold && distBase < distBg;
      };

      // 1. 直边基准坐标 (直接对齐 Sobel 亚像素高精度物理边框，免受外部阴影提前触发干扰)
      const yEdge = cfg.searchTopY ? box.y : box.y + box.height - 1;
      const xEdge = cfg.searchLeftX ? box.x : box.x + box.width - 1;

      // 2. 检查物理直边交点 (xEdge, yEdge)：若自身即为卡片实体内部底色，则为 90° 尖锐直角
      const [cornerR, cornerG, cornerB] = this.getRGB(xEdge, yEdge);
      const cornerToBaseDist = Math.sqrt(
        2 * (cornerR - baseR) ** 2 + 4 * (cornerG - baseG) ** 2 + 3 * (cornerB - baseB) ** 2
      );
      const cornerToBgDist = Math.sqrt(
        2 * (cornerR - bgR) ** 2 + 4 * (cornerG - bgG) ** 2 + 3 * (cornerB - bgB) ** 2
      );
      if (cornerToBaseDist < cornerToBgDist && cornerToBaseDist <= Math.min(16, bgToBaseDist * 0.4)) {
        estimatedRadii.push(0);
        continue;
      }

      // 3. 沿水平与垂直物理切线分别步进，测量圆角切除退缩量
      let sv = 0;
      for (let s = 1; s <= maxR; s++) {
        const py = yEdge + s * cfg.dirY;
        if (isCard(xEdge, py)) {
          sv = s;
          break;
        }
      }

      let sh = 0;
      for (let s = 1; s <= maxR; s++) {
        const px = xEdge + s * cfg.dirX;
        if (isCard(px, yEdge)) {
          sh = s;
          break;
        }
      }

      let rVal = 0;
      if (sv > 0 && sh > 0) {
        rVal = (sv + sh) / 2;
      } else if (sv > 0) {
        rVal = sv;
      } else if (sh > 0) {
        rVal = sh;
      }

      estimatedRadii.push(rVal);
    }

    if (estimatedRadii.length === 0) {
      return this.estimateCornerRadiusWireframe(box);
    }

    // 中位数滤波
    estimatedRadii.sort((a, b) => a - b);
    const midIdx = Math.floor(estimatedRadii.length / 2);
    const rawR = estimatedRadii.length % 2 === 1
      ? estimatedRadii[midIdx]
      : (estimatedRadii[midIdx - 1] + estimatedRadii[midIdx]) / 2;

    // (1) 直角卡片阈值归零
    if (rawR <= 1.2) {
      return 0;
    }

    // (2) 胶囊状态标判定 (宽高比 >= 1.6 且圆角达到半高 58% 以上)
    const halfH = Math.round(box.height / 4) * 2;
    if (box.width / box.height >= 1.6 && rawR >= halfH * 0.58) {
      return halfH;
    }

    // (3) 当直边切线步进测得 11.5~15.2px 时 (可能为 16px 圆角受外部软阴影或切向掠射干扰低估)，
    // 激活 45° 对角线梯度峰值测算器进行高精度解耦校准
    let finalRawR = rawR;
    if (rawR >= 11.5 && rawR <= 15.2) {
      const wireframeRx = this.estimateCornerRadiusWireframe(box);
      if (wireframeRx >= 16) {
        finalRawR = wireframeRx;
      }
    }

    // (4) 精细化阶梯量化 (0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32...)
    if (finalRawR <= 3.0) return 2;
    if (finalRawR <= 5.0) return 4;
    if (finalRawR <= 7.0) return 6;
    if (finalRawR <= 9.5) return 8;
    if (finalRawR <= 11.5) return 10;
    if (finalRawR <= 15.2) return 12;
    if (finalRawR <= 18.5) return 16;
    if (finalRawR <= 22.0) return 20;
    if (finalRawR <= 26.0) return 24;
    if (finalRawR <= 30.0) return 28;
    if (finalRawR <= 34.0) return 32;

    return Math.min(maxR, Math.round(finalRawR / 4) * 4);
  }

  /**
   * 一维点集局部聚类器 (1D Value Clustering)
   */
  private cluster1DValues(values: number[], tol = 4): Array<{ val: number; count: number }> {
    if (values.length === 0) return [];
    const sorted = [...values].sort((a, b) => a - b);
    const clusters: Array<{ sum: number; count: number; val: number }> = [];
    for (const h of sorted) {
      let matched = false;
      for (const c of clusters) {
        if (Math.abs(h - c.sum / c.count) <= tol) {
          c.sum += h;
          c.count++;
          c.val = Math.round(c.sum / c.count);
          matched = true;
          break;
        }
      }
      if (!matched) {
        clusters.push({ sum: h, count: 1, val: h });
      }
    }
    return clusters.sort((a, b) => b.count - a.count);
  }

  /**
   * 纯透明线框与虚线边框自适应圆角拟合 (Adaptive Wireframe/Dashed Corner Radius Estimator)
   * 沿 4 个拐角 45° 角平分线向内探测，根据几何公式 R = s * (2 + √2) ≈ 3.41421356 * s 反解物理圆角
   */
  private estimateCornerRadiusWireframe(box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): number {
    const W = this.width;
    const H = this.height;
    const maxR = Math.min(48, Math.floor(Math.min(box.width, box.height) / 2));
    if (maxR < 2) return 0;

    const midX = Math.round(box.x + box.width / 2);
    const midY = Math.round(box.y + box.height / 2);

    // 探寻直边精确基准坐标 (沿直边方向进行 ±12px 架桥，跨越虚线缝隙并垂直方向 1px 精度定位边缘峰值)
    // 1. Top yEdge
    let yTop = box.y;
    let maxGT = 0;
    for (let dy = -4; dy <= 4; dy++) {
      const y = box.y + dy;
      if (y >= 1 && y < H - 1) {
        let gY = 0;
        for (let dx = -12; dx <= 12; dx += 3) {
          const gx = midX + dx;
          if (gx >= 1 && gx < W - 1) {
            const g = Math.abs(this.getSobelGy(gx, y));
            if (g > gY) gY = g;
          }
        }
        if (gY > maxGT) {
          maxGT = gY;
          yTop = y;
        }
      }
    }

    // 2. Bottom yEdge
    let yBottom = box.y + box.height - 1;
    let maxGB = 0;
    for (let dy = -4; dy <= 4; dy++) {
      const y = box.y + box.height - 1 + dy;
      if (y >= 1 && y < H - 1) {
        let gY = 0;
        for (let dx = -12; dx <= 12; dx += 3) {
          const gx = midX + dx;
          if (gx >= 1 && gx < W - 1) {
            const g = Math.abs(this.getSobelGy(gx, y));
            if (g > gY) gY = g;
          }
        }
        if (gY > maxGB) {
          maxGB = gY;
          yBottom = y;
        }
      }
    }

    // 3. Left xEdge
    let xLeft = box.x;
    let maxGL = 0;
    for (let dx = -4; dx <= 4; dx++) {
      const x = box.x + dx;
      if (x >= 1 && x < W - 1) {
        let gX = 0;
        for (let dy = -12; dy <= 12; dy += 3) {
          const gy = midY + dy;
          if (gy >= 1 && gy < H - 1) {
            const g = Math.abs(this.getSobelGx(x, gy));
            if (g > gX) gX = g;
          }
        }
        if (gX > maxGL) {
          maxGL = gX;
          xLeft = x;
        }
      }
    }

    // 4. Right xEdge
    let xRight = box.x + box.width - 1;
    let maxGR = 0;
    for (let dx = -4; dx <= 4; dx++) {
      const x = box.x + box.width - 1 + dx;
      if (x >= 1 && x < W - 1) {
        let gX = 0;
        for (let dy = -12; dy <= 12; dy += 3) {
          const gy = midY + dy;
          if (gy >= 1 && gy < H - 1) {
            const g = Math.abs(this.getSobelGx(x, gy));
            if (g > gX) gX = g;
          }
        }
        if (gX > maxGR) {
          maxGR = gX;
          xRight = x;
        }
      }
    }

    // 最大沿对角线探测步数
    const maxS = Math.min(20, Math.round(maxR * 0.35) + 4);

    const cornerConfigs = [
      { sx: xLeft, sy: yTop, dx: 1, dy: 1 },
      { sx: xRight, sy: yTop, dx: -1, dy: 1 },
      { sx: xLeft, sy: yBottom, dx: 1, dy: -1 },
      { sx: xRight, sy: yBottom, dx: -1, dy: -1 },
    ];

    const measurements: number[] = [];

    for (const cfg of cornerConfigs) {
      let maxGrad = -1;
      let peakS = 0;
      const gProfile: number[] = [];

      for (let s = 0; s <= maxS; s++) {
        const px = cfg.sx + s * cfg.dx;
        const py = cfg.sy + s * cfg.dy;
        let bestG = 0;
        for (const k of [-1, 0, 1]) {
          const qx = px - k * cfg.dy;
          const qy = py + k * cfg.dx;
          const gx = this.getSobelGx(qx, qy);
          const gy = this.getSobelGy(qx, qy);
          const g = Math.hypot(gx, gy);
          if (g > bestG) bestG = g;
        }
        gProfile.push(bestG);
        if (bestG > maxGrad) {
          maxGrad = bestG;
          peakS = s;
        }
      }

      if (maxGrad >= 8) {
        if (peakS === 0 || (peakS === 1 && gProfile[0] >= 0.65 * maxGrad)) {
          measurements.push(0);
        } else {
          let refinedS = peakS;
          if (peakS > 0 && peakS < gProfile.length - 1) {
            const g0 = gProfile[peakS - 1];
            const g1 = gProfile[peakS];
            const g2 = gProfile[peakS + 1];
            const denom = 2 * (g0 - 2 * g1 + g2);
            if (denom !== 0) {
              const delta = (g0 - g2) / denom;
              if (Math.abs(delta) <= 0.5) {
                refinedS += delta;
              }
            }
          }
          const calcR = refinedS * (2 + Math.SQRT2);
          measurements.push(calcR);
        }
      }
    }

    if (measurements.length === 0) return 0;

    measurements.sort((a, b) => a - b);
    const midIdx = Math.floor(measurements.length / 2);
    const rawR = measurements.length % 2 === 0
      ? (measurements[midIdx - 1] + measurements[midIdx]) / 2
      : measurements[midIdx];

    if (rawR <= 1.5) return 0;
    if (rawR <= 3.0) return 2;
    if (rawR <= 5.0) return 4;
    if (rawR <= 7.0) return 6;
    if (rawR <= 9.5) return 8;
    if (rawR <= 11.5) return 10;
    if (rawR <= 15.2) return 12;
    if (rawR <= 18.5) return 16;
    if (rawR <= 22.0) return 20;
    if (rawR <= 26.0) return 24;
    if (rawR <= 30.0) return 28;
    if (rawR <= 34.0) return 32;

    return Math.min(maxR, Math.round(rawR / 4) * 4);
  }

  /**
   * 探测包含目标卡片的纯透明线框或虚线父级编组 (Enclosing Wireframe & Dashed Parent Finder)
   * 沿内层叶子卡片 4 个外向法线发射 1D 架桥射线，锁定外围连续闭合虚线/实线边框
   */
  private findEnclosingWireframeContainer(leafBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): SnappedBox | null {
    const W = this.width;
    const H = this.height;

    const yRays = [
      Math.max(4, leafBox.y - 20),
      Math.max(4, leafBox.y + 10),
      Math.round(leafBox.y + leafBox.height / 2),
      Math.min(H - 4, leafBox.y + leafBox.height - 10),
      Math.min(H - 4, leafBox.y + leafBox.height + 20),
      Math.max(4, leafBox.y - 60),
      Math.min(H - 4, leafBox.y + leafBox.height + 60),
      Math.max(4, leafBox.y - 120),
      Math.min(H - 4, leafBox.y + leafBox.height + 120),
    ];

    const xRays = [
      Math.max(4, leafBox.x - 20),
      Math.max(4, leafBox.x + 10),
      Math.round(leafBox.x + leafBox.width / 2),
      Math.min(W - 4, leafBox.x + leafBox.width - 10),
      Math.min(W - 4, leafBox.x + leafBox.width + 20),
      Math.max(4, leafBox.x - 60),
      Math.min(W - 4, leafBox.x + leafBox.width + 60),
      Math.max(4, leafBox.x - 120),
      Math.min(W - 4, leafBox.x + leafBox.width + 120),
    ];

    // 1. 向左探测垂直边
    const leftHits: number[] = [];
    for (const y of yRays) {
      for (let x = leafBox.x - 4; x >= 4; x -= 2) {
        if (this.getBridgedSobelGx(x, y, 6) > 18) {
          leftHits.push(x);
          x -= 8;
        }
      }
    }

    // 2. 向右探测垂直边
    const rightHits: number[] = [];
    for (const y of yRays) {
      for (let x = leafBox.x + leafBox.width + 4; x <= W - 4; x += 2) {
        if (this.getBridgedSobelGx(x, y, 6) > 18) {
          rightHits.push(x);
          x += 8;
        }
      }
    }

    // 3. 向上探测水平边
    const topHits: number[] = [];
    for (const x of xRays) {
      for (let y = leafBox.y - 4; y >= 4; y -= 2) {
        if (this.getBridgedSobelGy(x, y, 6) > 18) {
          topHits.push(y);
          y -= 8;
        }
      }
    }

    // 4. 向下探测水平边
    const bottomHits: number[] = [];
    for (const x of xRays) {
      for (let y = leafBox.y + leafBox.height + 4; y <= H - 4; y += 2) {
        if (this.getBridgedSobelGy(x, y, 6) > 18) {
          bottomHits.push(y);
          y += 8;
        }
      }
    }

    const leftClusters = this.cluster1DValues(leftHits, 4);
    const rightClusters = this.cluster1DValues(rightHits, 4);
    const topClusters = this.cluster1DValues(topHits, 4);
    const bottomClusters = this.cluster1DValues(bottomHits, 4);

    if (
      leftClusters.length === 0 ||
      rightClusters.length === 0 ||
      topClusters.length === 0 ||
      bottomClusters.length === 0
    ) {
      return null;
    }

    for (const cL of leftClusters.slice(0, 4)) {
      for (const cR of rightClusters.slice(0, 4)) {
        for (const cT of topClusters.slice(0, 4)) {
          for (const cB of bottomClusters.slice(0, 4)) {
            const xL = cL.val;
            const xR = cR.val;
            const yT = cT.val;
            const yB = cB.val;

            if (
              xL > leafBox.x - 4 ||
              xR < leafBox.x + leafBox.width + 4 ||
              yT > leafBox.y - 4 ||
              yB < leafBox.y + leafBox.height + 4
            ) {
              continue;
            }

            const w = xR - xL;
            const h = yB - yT;
            if (
              (w < leafBox.width * 1.15 && h < leafBox.height * 1.15) ||
              w > W * 0.98 ||
              h > H * 0.98
            ) {
              continue;
            }

            const ar = w / h;
            if (ar < 0.15 || ar > 10.0) {
              continue;
            }

            // 四边连续性验证
            const insetX = Math.max(4, Math.round(w * 0.08));
            const insetY = Math.max(4, Math.round(h * 0.08));
            const stepY = Math.max(1, Math.round((h - 2 * insetY) / 60));
            const stepX = Math.max(1, Math.round((w - 2 * insetX) / 60));
            const bridgeR_Y = Math.max(1, Math.min(4, Math.round(8 / stepY)));
            const bridgeR_X = Math.max(1, Math.min(4, Math.round(8 / stepX)));

            // Left
            const samplesL: number[] = [];
            for (let y = yT + insetY; y <= yB - insetY; y += stepY) {
              samplesL.push(Math.max(
                Math.abs(this.getSobelGx(xL - 1, y)),
                Math.abs(this.getSobelGx(xL, y)),
                Math.abs(this.getSobelGx(xL + 1, y))
              ));
            }
            if (this.evaluateEdgeContinuity(samplesL, 16, bridgeR_Y).effectiveContinuity < 0.65) {
              continue;
            }

            // Right
            const samplesR: number[] = [];
            for (let y = yT + insetY; y <= yB - insetY; y += stepY) {
              samplesR.push(Math.max(
                Math.abs(this.getSobelGx(xR - 1, y)),
                Math.abs(this.getSobelGx(xR, y)),
                Math.abs(this.getSobelGx(xR + 1, y))
              ));
            }
            if (this.evaluateEdgeContinuity(samplesR, 16, bridgeR_Y).effectiveContinuity < 0.65) {
              continue;
            }

            // Top
            const samplesT: number[] = [];
            for (let x = xL + insetX; x <= xR - insetX; x += stepX) {
              samplesT.push(Math.max(
                Math.abs(this.getSobelGy(x, yT - 1)),
                Math.abs(this.getSobelGy(x, yT)),
                Math.abs(this.getSobelGy(x, yT + 1))
              ));
            }
            if (this.evaluateEdgeContinuity(samplesT, 16, bridgeR_X).effectiveContinuity < 0.65) {
              continue;
            }

            // Bottom
            const samplesB: number[] = [];
            for (let x = xL + insetX; x <= xR - insetX; x += stepX) {
              samplesB.push(Math.max(
                Math.abs(this.getSobelGy(x, yB - 1)),
                Math.abs(this.getSobelGy(x, yB)),
                Math.abs(this.getSobelGy(x, yB + 1))
              ));
            }
            if (this.evaluateEdgeContinuity(samplesB, 16, bridgeR_X).effectiveContinuity < 0.65) {
              continue;
            }

            const refined = this.snapRectBounds({ x: xL, y: yT, width: w, height: h }, 12);
            const parentRx = this.estimateCornerRadiusWireframe(refined);

            return {
              id: `box-${Date.now().toString().slice(-6)}-p`,
              type: 'rect',
              x: refined.x,
              y: refined.y,
              width: refined.width,
              height: refined.height,
              rx: parentRx,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 纯透明线框与虚线边框梯度域闭合雷达 (Wireframe & Dashed Border Closed Seeker)
   * 阶段 1.7 Task 3：彻底解决透明/虚线无底色差卡片的吸附识别
   */
  private snapPointWireframe(
    clickX: number,
    clickY: number,
    options?: { forceParent?: boolean }
  ): SnappedBox | null {
    const W = this.width;
    const H = this.height;

    // Y 探测射线组 (向左/向右探测垂直边)
    const yOffsets = [0, -15, 15, -35, 35, -60, 60, -95, 95, -140, 140, -190, 190, -250, 250];
    const leftHits: number[] = [];
    const rightHits: number[] = [];

    for (const off of yOffsets) {
      const y = clickY + off;
      if (y < 4 || y >= H - 4) continue;

      // Left
      for (let x = clickX - 4; x >= 4; x -= 2) {
        if (this.getBridgedSobelGx(x, y, 6) > 18) {
          leftHits.push(x);
          x -= 8;
        }
      }

      // Right
      for (let x = clickX + 4; x <= W - 4; x += 2) {
        if (this.getBridgedSobelGx(x, y, 6) > 18) {
          rightHits.push(x);
          x += 8;
        }
      }
    }

    // X 探测射线组 (向上/向下探测水平边)
    const xOffsets = [0, -20, 20, -50, 50, -90, 90, -140, 140, -200, 200, -280, 280, -380, 380];
    const topHits: number[] = [];
    const bottomHits: number[] = [];

    for (const off of xOffsets) {
      const x = clickX + off;
      if (x < 4 || x >= W - 4) continue;

      // Top
      for (let y = clickY - 4; y >= 4; y -= 2) {
        if (this.getBridgedSobelGy(x, y, 6) > 18) {
          topHits.push(y);
          y -= 8;
        }
      }

      // Bottom
      for (let y = clickY + 4; y <= H - 4; y += 2) {
        if (this.getBridgedSobelGy(x, y, 6) > 18) {
          bottomHits.push(y);
          y += 8;
        }
      }
    }

    const leftClusters = this.cluster1DValues(leftHits, 4);
    const rightClusters = this.cluster1DValues(rightHits, 4);
    const topClusters = this.cluster1DValues(topHits, 4);
    const bottomClusters = this.cluster1DValues(bottomHits, 4);

    if (
      leftClusters.length === 0 ||
      rightClusters.length === 0 ||
      topClusters.length === 0 ||
      bottomClusters.length === 0
    ) {
      return null;
    }

    interface CandidateBox {
      xL: number;
      xR: number;
      yT: number;
      yB: number;
      area: number;
    }
    const candidates: CandidateBox[] = [];

    for (const cL of leftClusters.slice(0, 4)) {
      for (const cR of rightClusters.slice(0, 4)) {
        for (const cT of topClusters.slice(0, 4)) {
          for (const cB of bottomClusters.slice(0, 4)) {
            const xL = cL.val;
            const xR = cR.val;
            const yT = cT.val;
            const yB = cB.val;

            if (xL >= clickX || xR <= clickX || yT >= clickY || yB <= clickY) {
              continue;
            }

            const w = xR - xL;
            const h = yB - yT;
            if (w < 40 || h < 24 || w > W * 0.98 || h > H * 0.98) {
              continue;
            }

            const ar = w / h;
            if (ar < 0.15 || ar > 10.0) {
              continue;
            }

            const centerX = (xL + xR) / 2;
            const centerY = (yT + yB) / 2;
            if (Math.abs(centerX - clickX) / w > 0.48 || Math.abs(centerY - clickY) / h > 0.48) {
              continue;
            }

            candidates.push({ xL, xR, yT, yB, area: w * h });
          }
        }
      }
    }

    // 根据模式排序：forceParent 时优先考虑大容器，默认优先贴合内层
    if (options?.forceParent) {
      candidates.sort((a, b) => b.area - a.area);
    } else {
      candidates.sort((a, b) => a.area - b.area);
    }

    for (const cand of candidates) {
      const { xL, xR, yT, yB } = cand;
      const w = xR - xL;
      const h = yB - yT;

      // 四边连续性验证
      const insetX = Math.max(4, Math.round(w * 0.08));
      const insetY = Math.max(4, Math.round(h * 0.08));
      const stepY = Math.max(1, Math.round((h - 2 * insetY) / 60));
      const stepX = Math.max(1, Math.round((w - 2 * insetX) / 60));
      const bridgeR_Y = Math.max(1, Math.min(4, Math.round(8 / stepY)));
      const bridgeR_X = Math.max(1, Math.min(4, Math.round(8 / stepX)));

      // Left
      const samplesL: number[] = [];
      for (let y = yT + insetY; y <= yB - insetY; y += stepY) {
        samplesL.push(Math.max(
          Math.abs(this.getSobelGx(xL - 1, y)),
          Math.abs(this.getSobelGx(xL, y)),
          Math.abs(this.getSobelGx(xL + 1, y))
        ));
      }
      if (this.evaluateEdgeContinuity(samplesL, 16, bridgeR_Y).effectiveContinuity < 0.65) {
        continue;
      }

      // Right
      const samplesR: number[] = [];
      for (let y = yT + insetY; y <= yB - insetY; y += stepY) {
        samplesR.push(Math.max(
          Math.abs(this.getSobelGx(xR - 1, y)),
          Math.abs(this.getSobelGx(xR, y)),
          Math.abs(this.getSobelGx(xR + 1, y))
        ));
      }
      if (this.evaluateEdgeContinuity(samplesR, 16, bridgeR_Y).effectiveContinuity < 0.65) {
        continue;
      }

      // Top
      const samplesT: number[] = [];
      for (let x = xL + insetX; x <= xR - insetX; x += stepX) {
        samplesT.push(Math.max(
          Math.abs(this.getSobelGy(x, yT - 1)),
          Math.abs(this.getSobelGy(x, yT)),
          Math.abs(this.getSobelGy(x, yT + 1))
        ));
      }
      if (this.evaluateEdgeContinuity(samplesT, 16, bridgeR_X).effectiveContinuity < 0.65) {
        continue;
      }

      // Bottom
      const samplesB: number[] = [];
      for (let x = xL + insetX; x <= xR - insetX; x += stepX) {
        samplesB.push(Math.max(
          Math.abs(this.getSobelGy(x, yB - 1)),
          Math.abs(this.getSobelGy(x, yB)),
          Math.abs(this.getSobelGy(x, yB + 1))
        ));
      }
      if (this.evaluateEdgeContinuity(samplesB, 16, bridgeR_X).effectiveContinuity < 0.65) {
        continue;
      }

      const refined = this.snapRectBounds({ x: xL, y: yT, width: w, height: h }, 12);
      const rx = this.estimateCornerRadiusWireframe(refined);

      const leafBox: SnappedBox = {
        id: `box-${Date.now().toString().slice(-6)}`,
        type: 'rect',
        x: refined.x,
        y: refined.y,
        width: refined.width,
        height: refined.height,
        rx,
      };

      // 检查外层是否还包含更高层级透明/虚线容器 (支持 N 层冒泡)
      const levels: SnappedBoxLevel[] = [
        {
          level: 0,
          id: leafBox.id,
          type: 'rect',
          x: leafBox.x,
          y: leafBox.y,
          width: leafBox.width,
          height: leafBox.height,
          rx: leafBox.rx,
          label: 'Leaf Component',
        },
      ];

      let currentBox: SnappedBox = leafBox;
      for (let depth = 1; depth < 4; depth++) {
        const parentBox = this.findEnclosingWireframeContainer(currentBox);
        if (!parentBox) break;
        levels.push({
          level: depth,
          id: parentBox.id,
          type: 'rect',
          x: parentBox.x,
          y: parentBox.y,
          width: parentBox.width,
          height: parentBox.height,
          rx: parentBox.rx,
          label: depth === 1 ? 'Parent Container' : `Container Level ${depth}`,
        });
        currentBox = parentBox;
      }

      if (levels.length >= 2) {
        leafBox.levels = levels;
        if (options?.forceParent) {
          const topLevel = levels[levels.length - 1];
          return {
            id: topLevel.id,
            type: 'rect',
            x: topLevel.x,
            y: topLevel.y,
            width: topLevel.width,
            height: topLevel.height,
            rx: topLevel.rx,
            levels,
          };
        }
      }

      return leafBox;
    }

    return null;
  }

  /**
   * 阶段 0：自适应多路平行射线雷达 (Adaptive Multi-Ray Radar - 兜底引擎)
   */
  private snapPointRaycast(clickX: number, clickY: number): SnappedBox | null {
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

    // 3. 引入环带盲区半径 R_inner (Annular Band Blind Zone)
    // 避开用户鼠标点击点周围紧贴的文字、图标与高频局部噪声，使探测射线直接从文字外围开始向外积分
    const rInner = Math.max(20, Math.min(36, Math.round(Math.min(W, H) * 0.012)));

    // 多路平行射线探测 (7 路光线，确保穿透内部单词、换行文本与图标间隙)
    const offsets = [-60, -40, -20, 0, 20, 40, 60];

    // 向左探测：起点避开中心盲区 rInner
    let detectedLeft = clickX - 100;
    for (let x = clickX - rInner; x >= Math.max(4, clickX - maxSearchW); x -= 4) {
      let hits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > colorThreshold || gx > 24) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedLeft = x;
        break;
      }
    }

    // 向右探测：起点避开中心盲区 rInner
    let detectedRight = clickX + 100;
    for (let x = clickX + rInner; x <= Math.min(W - 4, clickX + maxSearchW); x += 4) {
      let hits = 0;
      for (const off of offsets) {
        const y = Math.min(H - 4, Math.max(4, clickY + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gx = Math.abs(this.getSobelGx(x, y));
        if (colorDiff > colorThreshold || gx > 24) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedRight = x;
        break;
      }
    }

    // 向上探测：起点避开中心盲区 rInner
    let detectedTop = clickY - 80;
    for (let y = clickY - rInner; y >= Math.max(4, clickY - maxSearchH); y -= 4) {
      let hits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > colorThreshold || gy > 24) {
          hits++;
        }
      }
      if (hits >= 4) {
        detectedTop = y;
        break;
      }
    }

    // 向下探测：起点避开中心盲区 rInner
    let detectedBottom = clickY + 80;
    for (let y = clickY + rInner; y <= Math.min(H - 4, clickY + maxSearchH); y += 4) {
      let hits = 0;
      for (const off of offsets) {
        const x = Math.min(W - 4, Math.max(4, clickX + off));
        const [r, g, b] = this.getRGB(x, y);
        const colorDiff = Math.sqrt((r - baseR) ** 2 + (g - baseG) ** 2 + (b - baseB) ** 2);
        const gy = Math.abs(this.getSobelGy(x, y));
        if (colorDiff > colorThreshold || gy > 24) {
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

    // 4. 矩形包围盒几何合理性与一致性校验 (Bounding Box Geometric Validity Check)
    // (1) 宽高比合理性限制：避免将单行文本或长连线判定为卡片 (0.2 <= AR <= 5.5)
    const ar = estimatedWidth / estimatedHeight;
    if (ar < 0.2 || ar > 5.5) {
      return null;
    }

    // (2) 点击点中心偏离度校验 (Center Offset Ratio Check)：
    // 用户单击卡片时，点击位置通常落在卡片主体区域内。
    // 若 clickX 极其靠近 detectedLeft 而远离 detectedRight（偏离度 > 40%），说明某侧射线在极近处遭遇文字截断，判定吸附失效。
    const boxCenterX = (detectedLeft + detectedRight) / 2;
    const boxCenterY = (detectedTop + detectedBottom) / 2;
    const offsetXRatio = Math.abs(boxCenterX - clickX) / estimatedWidth;
    const offsetYRatio = Math.abs(boxCenterY - clickY) / estimatedHeight;

    if (offsetXRatio > 0.40 || offsetYRatio > 0.40) {
      return null;
    }

    // 5. 调用四边独立贯穿度积分算法，对射线抓取的粗选框进行二次毫米级精修贴合
    const refined = this.snapRectBounds(
      {
        x: detectedLeft,
        y: detectedTop,
        width: estimatedWidth,
        height: estimatedHeight,
      },
      48
    );

    const estimatedRx = this.estimateCornerRadius(refined, baseR, baseG, baseB);

    return {
      id: `box-${Date.now().toString().slice(-6)}`,
      type: 'rect',
      x: refined.x,
      y: refined.y,
      width: refined.width,
      height: refined.height,
      rx: estimatedRx,
    };
  }
}

export const globalEdgeSnapper = new SobelEdgeSnapper();
