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
              // 远端资源未配置 Access-Control-Allow-Origin 时，优雅降级为纯手动选框模式
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

  /**
   * 单击智能卡片边界吸附 (Sobel Spatial Integration & 1D Energy Projection)
   */
  public snapPoint(clickX: number, clickY: number): SnappedBox | null {
    if (!this.isReady || !this.imgData) return null;

    const W = this.width;
    const H = this.height;
    const data = this.imgData;

    const roiRadiusX = 900;
    const roiRadiusY = 600;

    const x1 = Math.max(1, Math.floor(clickX - roiRadiusX));
    const x2 = Math.min(W - 2, Math.ceil(clickX + roiRadiusX));
    const y1 = Math.max(1, Math.floor(clickY - roiRadiusY));
    const y2 = Math.min(H - 2, Math.ceil(clickY + roiRadiusY));

    const roiW = x2 - x1 + 1;
    const roiH = y2 - y1 + 1;

    if (roiW < 60 || roiH < 40) return null;

    const cx = Math.floor(clickX - x1);
    const cy = Math.floor(clickY - y1);

    // 1. Grayscale 灰度化
    const gray = new Uint8Array(roiW * roiH);
    for (let ry = 0; ry < roiH; ry++) {
      const globalY = y1 + ry;
      const rowOffset = ry * roiW;
      for (let rx = 0; rx < roiW; rx++) {
        const globalX = x1 + rx;
        const idx = (globalY * W + globalX) * 4;
        gray[rowOffset + rx] = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
      }
    }

    // 2. Sobel 3x3 空间卷积与能量积分投影
    const profileX = new Float32Array(roiW);
    const profileY = new Float32Array(roiH);

    for (let ry = 1; ry < roiH - 1; ry++) {
      const r_prev = (ry - 1) * roiW;
      const r_curr = ry * roiW;
      const r_next = (ry + 1) * roiW;

      for (let rx = 1; rx < roiW - 1; rx++) {
        const gx = (gray[r_prev + rx + 1] + 2 * gray[r_curr + rx + 1] + gray[r_next + rx + 1]) -
                   (gray[r_prev + rx - 1] + 2 * gray[r_curr + rx - 1] + gray[r_next + rx - 1]);

        const gy = (gray[r_next + rx - 1] + 2 * gray[r_next + rx] + gray[r_next + rx + 1]) -
                   (gray[r_prev + rx - 1] + 2 * gray[r_prev + rx] + gray[r_prev + rx + 1]);

        profileX[rx] += Math.abs(gx);
        profileY[ry] += Math.abs(gy);
      }
    }

    // 3. 一维平滑滤波 [1, 2, 1]/4
    const smoothX = new Float32Array(roiW);
    for (let i = 1; i < roiW - 1; i++) {
      smoothX[i] = (profileX[i - 1] + 2 * profileX[i] + profileX[i + 1]) * 0.25;
    }

    const smoothY = new Float32Array(roiH);
    for (let i = 1; i < roiH - 1; i++) {
      smoothY[i] = (profileY[i - 1] + 2 * profileY[i] + profileY[i + 1]) * 0.25;
    }

    let maxEnergyX = 0;
    for (let i = 0; i < roiW; i++) {
      if (smoothX[i] > maxEnergyX) maxEnergyX = smoothX[i];
    }

    let maxEnergyY = 0;
    for (let i = 0; i < roiH; i++) {
      if (smoothY[i] > maxEnergyY) maxEnergyY = smoothY[i];
    }

    const thresholdX = Math.max(600, maxEnergyX * 0.20);
    const thresholdY = Math.max(400, maxEnergyY * 0.20);

    // 4. 双向由内向外寻找能量峰值
    let bestLeftRx = -1;
    for (let rx = cx - 12; rx >= 6; rx--) {
      if (smoothX[rx] >= thresholdX && smoothX[rx] >= smoothX[rx - 1] && smoothX[rx] >= smoothX[rx + 1]) {
        bestLeftRx = rx;
        break;
      }
    }

    let bestRightRx = -1;
    for (let rx = cx + 12; rx <= roiW - 7; rx++) {
      if (smoothX[rx] >= thresholdX && smoothX[rx] >= smoothX[rx - 1] && smoothX[rx] >= smoothX[rx + 1]) {
        bestRightRx = rx;
        break;
      }
    }

    let bestTopRy = -1;
    for (let ry = cy - 10; ry >= 6; ry--) {
      if (smoothY[ry] >= thresholdY && smoothY[ry] >= smoothY[ry - 1] && smoothY[ry] >= smoothY[ry + 1]) {
        bestTopRy = ry;
        break;
      }
    }

    let bestBottomRy = -1;
    for (let ry = cy + 10; ry <= roiH - 7; ry++) {
      if (smoothY[ry] >= thresholdY && smoothY[ry] >= smoothY[ry - 1] && smoothY[ry] >= smoothY[ry + 1]) {
        bestBottomRy = ry;
        break;
      }
    }

    if (bestLeftRx !== -1 && bestRightRx !== -1 && bestTopRy !== -1 && bestBottomRy !== -1) {
      const minX = x1 + bestLeftRx;
      const maxX = x1 + bestRightRx;
      const minY = y1 + bestTopRy;
      const maxY = y1 + bestBottomRy;

      const width = maxX - minX;
      const height = maxY - minY;

      if (width >= 40 && height >= 25) {
        return {
          id: `box-${Date.now().toString().slice(-6)}`,
          type: 'rect',
          x: minX,
          y: minY,
          width,
          height,
          rx: 16,
        };
      }
    }

    return null;
  }

  /**
   * 拖拽选框松手瞬间，基于候选矩形 4 边的 ±24px 窄带一维能量极大值自适应微调吸附
   */
  public snapRectBounds(
    raw: SnappedBounds,
    searchRadius = 24
  ): SnappedBounds {
    if (!this.isReady || !this.imgData) return raw;

    // 当框太小则不吸附
    if (raw.width < 30 || raw.height < 20) return raw;

    const centerX = raw.x + raw.width / 2;
    const centerY = raw.y + raw.height / 2;

    const smartBox = this.snapPoint(centerX, centerY);
    if (smartBox) {
      // 校验吸附结果与用户拉框相似度，若交集匹配度在合理误差范围，则采用精准吸附结果
      const deltaLeft = Math.abs(smartBox.x - raw.x);
      const deltaRight = Math.abs((smartBox.x + smartBox.width) - (raw.x + raw.width));
      const deltaTop = Math.abs(smartBox.y - raw.y);
      const deltaBottom = Math.abs((smartBox.y + smartBox.height) - (raw.y + raw.height));

      if (
        deltaLeft < searchRadius * 2 &&
        deltaRight < searchRadius * 2 &&
        deltaTop < searchRadius * 2 &&
        deltaBottom < searchRadius * 2
      ) {
        return {
          x: smartBox.x,
          y: smartBox.y,
          width: smartBox.width,
          height: smartBox.height,
        };
      }
    }

    return raw;
  }
}

export const globalEdgeSnapper = new SobelEdgeSnapper();
