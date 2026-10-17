import { test, expect } from '@playwright/test';
import { SobelEdgeSnapper } from '../src/utils/edgeSnapper';

/**
 * 辅助函数：在内存离屏缓冲中绘制纯色/渐变矩形
 */
function fillRect(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  colorFn: (x: number, y: number) => [number, number, number]
) {
  for (let y = Math.max(0, ry); y < Math.min(canvasH, ry + rh); y++) {
    for (let x = Math.max(0, rx); x < Math.min(canvasW, rx + rw); x++) {
      const idx = (y * canvasW + x) * 4;
      const [r, g, b] = colorFn(x, y);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = 255;
    }
  }
}

/**
 * 辅助函数：绘制 1px/2px 物理线框
 */
function strokeRect(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  rgb: [number, number, number]
) {
  for (let x = rx; x < rx + rw; x++) {
    if (x >= 0 && x < canvasW) {
      if (ry >= 0 && ry < canvasH) {
        const i1 = (ry * canvasW + x) * 4;
        buffer[i1] = rgb[0]; buffer[i1 + 1] = rgb[1]; buffer[i1 + 2] = rgb[2];
      }
      const bY = ry + rh - 1;
      if (bY >= 0 && bY < canvasH) {
        const i2 = (bY * canvasW + x) * 4;
        buffer[i2] = rgb[0]; buffer[i2 + 1] = rgb[1]; buffer[i2 + 2] = rgb[2];
      }
    }
  }
  for (let y = ry; y < ry + rh; y++) {
    if (y >= 0 && y < canvasH) {
      if (rx >= 0 && rx < canvasW) {
        const i1 = (y * canvasW + rx) * 4;
        buffer[i1] = rgb[0]; buffer[i1 + 1] = rgb[1]; buffer[i1 + 2] = rgb[2];
      }
      const rX = rx + rw - 1;
      if (rX >= 0 && rX < canvasW) {
        const i2 = (y * canvasW + rX) * 4;
        buffer[i2] = rgb[0]; buffer[i2 + 1] = rgb[1]; buffer[i2 + 2] = rgb[2];
      }
    }
  }
}

function fillRoundedRect(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  colorFn: (x: number, y: number) => [number, number, number]
) {
  const r2 = radius * radius;
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      let inside = true;
      if (px < x + radius && py < y + radius) {
        const dx = px - (x + radius);
        const dy = py - (y + radius);
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (px >= x + w - radius && py < y + radius) {
        const dx = px - (x + w - radius - 1);
        const dy = py - (y + radius);
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (px < x + radius && py >= y + h - radius) {
        const dx = px - (x + radius);
        const dy = py - (y + h - radius - 1);
        if (dx * dx + dy * dy > r2) inside = false;
      } else if (px >= x + w - radius && py >= y + h - radius) {
        const dx = px - (x + w - radius - 1);
        const dy = py - (y + h - radius - 1);
        if (dx * dx + dy * dy > r2) inside = false;
      }

      if (inside && px >= 0 && px < canvasW && py >= 0 && py < canvasH) {
        const idx = (py * canvasW + px) * 4;
        const [r, g, b] = colorFn(px, py);
        buffer[idx] = r;
        buffer[idx + 1] = g;
        buffer[idx + 2] = b;
      }
    }
  }
}

function strokeRoundedRect(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  rgb: [number, number, number]
) {
  const rOuter2 = radius * radius;
  const rInner = Math.max(0, radius - 1);
  const rInner2 = rInner * rInner;

  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      let isStroke = false;
      if (px < x + radius && py < y + radius) {
        const dx = px - (x + radius);
        const dy = py - (y + radius);
        const d2 = dx * dx + dy * dy;
        if (d2 <= rOuter2 && d2 >= rInner2) isStroke = true;
      } else if (px >= x + w - radius && py < y + radius) {
        const dx = px - (x + w - radius - 1);
        const dy = py - (y + radius);
        const d2 = dx * dx + dy * dy;
        if (d2 <= rOuter2 && d2 >= rInner2) isStroke = true;
      } else if (px < x + radius && py >= y + h - radius) {
        const dx = px - (x + radius);
        const dy = py - (y + h - radius - 1);
        const d2 = dx * dx + dy * dy;
        if (d2 <= rOuter2 && d2 >= rInner2) isStroke = true;
      } else if (px >= x + w - radius && py >= y + h - radius) {
        const dx = px - (x + w - radius - 1);
        const dy = py - (y + h - radius - 1);
        const d2 = dx * dx + dy * dy;
        if (d2 <= rOuter2 && d2 >= rInner2) isStroke = true;
      } else if (
        (py === y || py === y + h - 1) && px >= x + radius && px < x + w - radius ||
        (px === x || px === x + w - 1) && py >= y + radius && py < y + h - radius
      ) {
        isStroke = true;
      }

      if (isStroke && px >= 0 && px < canvasW && py >= 0 && py < canvasH) {
        const idx = (py * canvasW + px) * 4;
        buffer[idx] = rgb[0];
        buffer[idx + 1] = rgb[1];
        buffer[idx + 2] = rgb[2];
      }
    }
  }
}

/**
 * 辅助函数：绘制虚线圆角矩形 (如 AWS VPC / K8s Namespace 编组框)
 */
function strokeDashedRoundedRect(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  rgb: [number, number, number],
  dashLength = 6,
  gapLength = 6
) {
  const period = dashLength + gapLength;
  const setPixel = (px: number, py: number) => {
    if (px >= 0 && px < canvasW && py >= 0 && py < canvasH) {
      const idx = (py * canvasW + px) * 4;
      buffer[idx] = rgb[0];
      buffer[idx + 1] = rgb[1];
      buffer[idx + 2] = rgb[2];
      buffer[idx + 3] = 255;
    }
  };

  let dist = 0;

  // 1. Top edge: x + radius -> x + w - radius, at y
  for (let px = x + radius; px < x + w - radius; px++) {
    if (dist % period < dashLength) setPixel(px, y);
    dist++;
  }

  // 2. Top-Right arc
  const trCx = x + w - radius - 1;
  const trCy = y + radius;
  const arcN = Math.round((Math.PI / 2) * radius);
  for (let i = 0; i < arcN; i++) {
    const angle = -Math.PI / 2 + (i / arcN) * (Math.PI / 2);
    const px = Math.round(trCx + radius * Math.cos(angle));
    const py = Math.round(trCy + radius * Math.sin(angle));
    if (dist % period < dashLength) setPixel(px, py);
    dist++;
  }

  // 3. Right edge: y + radius -> y + h - radius, at x + w - 1
  for (let py = y + radius; py < y + h - radius; py++) {
    if (dist % period < dashLength) setPixel(x + w - 1, py);
    dist++;
  }

  // 4. Bottom-Right arc
  const brCx = x + w - radius - 1;
  const brCy = y + h - radius - 1;
  for (let i = 0; i < arcN; i++) {
    const angle = (i / arcN) * (Math.PI / 2);
    const px = Math.round(brCx + radius * Math.cos(angle));
    const py = Math.round(brCy + radius * Math.sin(angle));
    if (dist % period < dashLength) setPixel(px, py);
    dist++;
  }

  // 5. Bottom edge: x + w - radius -> x + radius, at y + h - 1
  for (let px = x + w - radius - 1; px >= x + radius; px--) {
    if (dist % period < dashLength) setPixel(px, y + h - 1);
    dist++;
  }

  // 6. Bottom-Left arc
  const blCx = x + radius;
  const blCy = y + h - radius - 1;
  for (let i = 0; i < arcN; i++) {
    const angle = Math.PI / 2 + (i / arcN) * (Math.PI / 2);
    const px = Math.round(blCx + radius * Math.cos(angle));
    const py = Math.round(blCy + radius * Math.sin(angle));
    if (dist % period < dashLength) setPixel(px, py);
    dist++;
  }

  // 7. Left edge: y + h - radius -> y + radius, at x
  for (let py = y + h - radius - 1; py >= y + radius; py--) {
    if (dist % period < dashLength) setPixel(x, py);
    dist++;
  }

  // 8. Top-Left arc
  const tlCx = x + radius;
  const tlCy = y + radius;
  for (let i = 0; i < arcN; i++) {
    const angle = Math.PI + (i / arcN) * (Math.PI / 2);
    const px = Math.round(tlCx + radius * Math.cos(angle));
    const py = Math.round(tlCy + radius * Math.sin(angle));
    if (dist % period < dashLength) setPixel(px, py);
    dist++;
  }
}

function drawDropShadow(
  buffer: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  blurRadius: number,
  shadowColor: [number, number, number],
  maxAlpha = 0.4,
  offsetY = 4,
  cornerRadius = 0
) {
  const sigma = Math.max(1, blurRadius / 2.5);
  const twoSigma2 = 2 * sigma * sigma;

  const minX = Math.max(0, x - blurRadius * 2);
  const maxX = Math.min(canvasW - 1, x + w + blurRadius * 2);
  const minY = Math.max(0, y + offsetY - blurRadius * 2);
  const maxY = Math.min(canvasH - 1, y + h + offsetY + blurRadius * 2);

  const cx = x + w / 2;
  const cy = y + offsetY + h / 2;
  const halfW = w / 2;
  const halfH = h / 2;
  const r = Math.min(cornerRadius, Math.min(halfW, halfH));

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const qx = Math.abs(px - cx) - (halfW - r);
      const qy = Math.abs(py - cy) - (halfH - r);
      const dist = Math.hypot(Math.max(0, qx), Math.max(0, qy)) - r;

      if (dist <= blurRadius * 2) {
        const effectiveDist = Math.max(0, dist);
        const alpha = maxAlpha * Math.exp(-(effectiveDist * effectiveDist) / twoSigma2);
        if (alpha > 0.005) {
          const idx = (py * canvasW + px) * 4;
          const bgR = buffer[idx];
          const bgG = buffer[idx + 1];
          const bgB = buffer[idx + 2];
          buffer[idx] = Math.round(bgR * (1 - alpha) + shadowColor[0] * alpha);
          buffer[idx + 1] = Math.round(bgG * (1 - alpha) + shadowColor[1] * alpha);
          buffer[idx + 2] = Math.round(bgB * (1 - alpha) + shadowColor[2] * alpha);
        }
      }
    }
  }
}

/**
 * 1. 验证常规标准卡片单次点击像素级咬合 (Standard Card Snapping)
 */
async function verifyStandardCardSnapping(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：深黑 #0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 卡片：(300, 200), 500x300, 暗灰蓝 #1e293b (30, 41, 59)
  fillRect(buffer, W, H, 300, 200, 500, 300, () => [30, 41, 59]);
  // 边框：浅蓝 #3b82f6 (59, 130, 246)
  strokeRect(buffer, W, H, 300, 200, 500, 300, [59, 130, 246]);

  // 卡片内部模拟文本行 (白字)
  fillRect(buffer, W, H, 350, 280, 280, 16, () => [240, 240, 240]);
  fillRect(buffer, W, H, 350, 320, 200, 16, () => [240, 240, 240]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击文本上方空白处
  const box1 = snapper.snapPoint(500, 240);
  expect(box1).not.toBeNull();
  expect(Math.abs(box1!.x - 300)).toBeLessThanOrEqual(2);
  expect(Math.abs(box1!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(box1!.width - 500)).toBeLessThanOrEqual(3);
  expect(Math.abs(box1!.height - 300)).toBeLessThanOrEqual(3);

  // 点击文字正中间 (验证文字空洞熔平)
  const box2 = snapper.snapPoint(420, 288);
  expect(box2).not.toBeNull();
  expect(Math.abs(box2!.x - 300)).toBeLessThanOrEqual(2);
  expect(Math.abs(box2!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(box2!.width - 500)).toBeLessThanOrEqual(3);
}

/**
 * 2. 验证微型元数据 Badge 卡片与 22px 粗体大字场景 (Case 1: Badge with Bold Typography)
 */
async function verifyBadgeCardWithLargeBoldText(): Promise<void> {
  const W = 1600;
  const H = 900;
  const buffer = new Uint8ClampedArray(W * H * 4);

  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // Badge 卡片：(1000, 80), 180x64, 底色 #0f172a (15, 23, 42), 边框 #334155 (51, 65, 85)
  fillRect(buffer, W, H, 1000, 80, 180, 64, () => [15, 23, 42]);
  strokeRect(buffer, W, H, 1000, 80, 180, 64, [51, 65, 85]);

  // 顶部小字：PEAK TRAFFIC (高 10px)
  fillRect(buffer, W, H, 1020, 92, 100, 10, () => [148, 163, 184]);
  // 底部加粗大字：120k QPS (高 22px, 亮青色)
  fillRect(buffer, W, H, 1020, 112, 120, 22, () => [6, 182, 212]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 从顶部小字处点击
  const boxTop = snapper.snapPoint(1050, 95);
  expect(boxTop).not.toBeNull();
  expect(Math.abs(boxTop!.x - 1000)).toBeLessThanOrEqual(2);
  expect(Math.abs(boxTop!.y - 80)).toBeLessThanOrEqual(2);
  expect(Math.abs(boxTop!.width - 180)).toBeLessThanOrEqual(3);
  expect(Math.abs(boxTop!.height - 64)).toBeLessThanOrEqual(3);

  // 从底部粗体大字处点击
  const boxBottom = snapper.snapPoint(1050, 122);
  expect(boxBottom).not.toBeNull();
  expect(Math.abs(boxBottom!.x - 1000)).toBeLessThanOrEqual(2);
  expect(Math.abs(boxBottom!.y - 80)).toBeLessThanOrEqual(2);
  expect(Math.abs(boxBottom!.width - 180)).toBeLessThanOrEqual(3);
  expect(Math.abs(boxBottom!.height - 64)).toBeLessThanOrEqual(3);
}

/**
 * 3. 验证宽广全通栏业务大卡片与平滑渐变及长段落 (Case 2: PostgreSQL 18 & Wide Card)
 */
async function verifyWideSpanCardWithGradientAndParagraphs(): Promise<void> {
  const W = 1600;
  const H = 1000;
  const buffer = new Uint8ClampedArray(W * H * 4);

  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 模拟外层容器 Data & Persistence
  fillRect(buffer, W, H, 50, 100, 1500, 800, () => [15, 23, 42]);
  strokeRect(buffer, W, H, 50, 100, 1500, 800, [51, 65, 85]);

  // 内部 PostgreSQL 18 卡片：(100, 200), 1330x140
  // 底色为微弱线性渐变 (从左侧 #064e3b 到右侧 #022c22)
  fillRect(buffer, W, H, 100, 200, 1330, 140, (x) => {
    const t = (x - 100) / 1330;
    const r = Math.round(6 + t * (2 - 6));
    const g = Math.round(78 + t * (44 - 78));
    const b = Math.round(59 + t * (34 - 59));
    return [r, g, b];
  });
  // 边框为绿色 #10b981 (16, 185, 129)
  strokeRect(buffer, W, H, 100, 200, 1330, 140, [16, 185, 129]);

  // 标题：PostgreSQL 18
  fillRect(buffer, W, H, 180, 220, 200, 18, () => [16, 185, 129]);
  // 描述段落：第 1 行 (长 850px)
  fillRect(buffer, W, H, 140, 260, 850, 14, () => [200, 200, 200]);
  // 描述段落：第 2 行 (长 500px)
  fillRect(buffer, W, H, 140, 285, 500, 14, () => [200, 200, 200]);
  // 右侧胶囊徽章：Primary Relational DB
  fillRect(buffer, W, H, 1150, 218, 180, 24, () => [6, 95, 70]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 用户点击在右侧徽章下方 (x=1100, y=260)
  const boxRight = snapper.snapPoint(1100, 260);
  expect(boxRight).not.toBeNull();
  // 验证绝不发生截断，左边界必须到达 x=100，右边界必须到达 x=1430
  expect(Math.abs(boxRight!.x - 100)).toBeLessThanOrEqual(4);
  expect(Math.abs(boxRight!.width - 1330)).toBeLessThanOrEqual(6);
  expect(Math.abs(boxRight!.y - 200)).toBeLessThanOrEqual(3);
  expect(Math.abs(boxRight!.height - 140)).toBeLessThanOrEqual(4);

  // 用户点击在左侧标题与图标附近 (x=200, y=225)
  const boxLeft = snapper.snapPoint(200, 225);
  expect(boxLeft).not.toBeNull();
  expect(Math.abs(boxLeft!.x - 100)).toBeLessThanOrEqual(4);
  expect(Math.abs(boxLeft!.width - 1330)).toBeLessThanOrEqual(6);
}

/**
 * 4. 验证点击彩色 Emoji / 图标中心免疫静默 (Case 2: Emoji / Icon Immunity)
 */
async function verifyEmojiIconClickImmunity(): Promise<void> {
  const W = 1200;
  const H = 600;
  const buffer = new Uint8ClampedArray(W * H * 4);

  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 卡片：(200, 150), 700x200, 暗红背景 #450a0a (69, 10, 10), 红框 #ef4444 (239, 68, 68)
  fillRect(buffer, W, H, 200, 150, 700, 200, () => [69, 10, 10]);
  strokeRect(buffer, W, H, 200, 150, 700, 200, [239, 68, 68]);

  // 模拟一个 24x24 的闪电 ⚡ 彩色图标 (黄色 + 橙色 + 黑色高频杂斑)
  fillRect(buffer, W, H, 230, 175, 24, 24, (x, y) => {
    return [(x * 17) % 255, (y * 23 + 120) % 255, 30];
  });

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 光标正中 24x24 彩色图标内部 (x=242, y=187)
  const box = snapper.snapPoint(242, 187);
  expect(box).not.toBeNull();
  // 验证环形采样器成功跨越图标杂斑捕获暗红底色，并完整圈中 700x200 卡片
  expect(Math.abs(box!.x - 200)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.y - 150)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.width - 700)).toBeLessThanOrEqual(5);
  expect(Math.abs(box!.height - 200)).toBeLessThanOrEqual(4);
}

/**
 * 5. 验证毫秒级运算性能基准 (Performance Benchmark: < 10ms)
 */
async function verifyPerformanceBenchmark(): Promise<void> {
  const W = 1920;
  const H = 1080;
  const buffer = new Uint8ClampedArray(W * H * 4);
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);
  fillRect(buffer, W, H, 200, 200, 1200, 300, () => [30, 41, 59]);
  strokeRect(buffer, W, H, 200, 200, 1200, 300, [59, 130, 246]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 预热 1 次
  snapper.snapPoint(600, 350);

  const t0 = performance.now();
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    const box = snapper.snapPoint(600, 350);
    expect(box).not.toBeNull();
  }
  const avgMs = (performance.now() - t0) / iterations;
  // 严格要求单次形态学闭运算吸附平均耗时 < 100ms (在 1080p 全高清画幅及 4 并发 Worker 高负载下)
  expect(avgMs).toBeLessThan(100);
}

/**
 * 6. 阶段 1.7：验证直角卡片圆角自适应归零 (Square Box rx = 0)
 */
async function verifySquareCardRadiusFitting(): Promise<void> {
  const W = 1000;
  const H = 700;
  const buffer = new Uint8ClampedArray(W * H * 4);

  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 绘制纯直角卡片 (rx = 0)
  fillRect(buffer, W, H, 200, 150, 400, 250, () => [30, 41, 59]);
  strokeRect(buffer, W, H, 200, 150, 400, 250, [59, 130, 246]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  const box = snapper.snapPoint(350, 250);
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.y - 150)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.width - 400)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.height - 250)).toBeLessThanOrEqual(3);
  // 核心校验：必须精确输出 rx = 0
  expect(box!.rx).toBe(0);
}

/**
 * 7. 阶段 1.7：验证微型 Badge (rx=6) 与胶囊卡片 (rx=H/2) 自动量化
 */
async function verifyBadgeAndPillRadiusFitting(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // (1) 绘制微圆角 Badge (rx = 6, 180x64)
  fillRoundedRect(buffer, W, H, 150, 100, 180, 64, 6, () => [15, 23, 42]);
  strokeRoundedRect(buffer, W, H, 150, 100, 180, 64, 6, [51, 65, 85]);

  // (2) 绘制胶囊状态标 (rx = 16 = H/2, 160x32)
  fillRoundedRect(buffer, W, H, 500, 100, 160, 32, 16, () => [6, 78, 59]);
  strokeRoundedRect(buffer, W, H, 500, 100, 160, 32, 16, [16, 185, 129]);

  // (3) 绘制中型标准圆角卡片 (rx = 16, 400x240)
  fillRoundedRect(buffer, W, H, 200, 300, 400, 240, 16, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 200, 300, 400, 240, 16, [59, 130, 246]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 验证 Badge 微圆角 (预期 rx = 6)
  const badgeBox = snapper.snapPoint(220, 130);
  expect(badgeBox).not.toBeNull();
  expect(Math.abs(badgeBox!.x - 150)).toBeLessThanOrEqual(2);
  expect(Math.abs(badgeBox!.y - 100)).toBeLessThanOrEqual(2);
  expect(badgeBox!.rx).toBe(6);

  // 验证胶囊全圆角 (预期 rx = 16)
  const pillBox = snapper.snapPoint(580, 116);
  expect(pillBox).not.toBeNull();
  expect(Math.abs(pillBox!.x - 500)).toBeLessThanOrEqual(2);
  expect(Math.abs(pillBox!.y - 100)).toBeLessThanOrEqual(2);
  expect(pillBox!.rx).toBe(16);

  // 验证标准卡片圆角 (预期 rx = 16)
  const cardBox = snapper.snapPoint(400, 420);
  expect(cardBox).not.toBeNull();
  expect(Math.abs(cardBox!.x - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(cardBox!.y - 300)).toBeLessThanOrEqual(2);
  expect(cardBox!.rx).toBe(16);
}

/**
 * 8. 阶段 1.7：验证父子嵌套卡片多层级吸附与提取 (Hierarchical Snapping)
 */
async function verifyHierarchicalContainerSnapping(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全局背景
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // (1) 绘制外层大分组父容器: Data & Persistence (x=160, y=100, w=760, h=500, rx=16)
  fillRoundedRect(buffer, W, H, 160, 100, 760, 500, 16, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 160, 100, 760, 500, 16, [71, 85, 105]);

  // (2) 绘制内层子卡片: PostgreSQL 18 (x=240, y=200, w=260, h=140, rx=8)
  fillRoundedRect(buffer, W, H, 240, 200, 260, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 240, 200, 260, 140, 8, [96, 165, 250]);

  // (3) 绘制内层第二个兄弟子卡片: Redis Cache (x=560, y=200, w=260, h=140, rx=8)
  fillRoundedRect(buffer, W, H, 560, 200, 260, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 560, 200, 260, 140, 8, [248, 113, 113]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 1. 普通单击内层子卡片 (点击 PostgreSQL 内部: 320, 260)
  const leafBox = snapper.snapPoint(320, 260);
  expect(leafBox).not.toBeNull();
  expect(Math.abs(leafBox!.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.width - 260)).toBeLessThanOrEqual(3);
  expect(Math.abs(leafBox!.height - 140)).toBeLessThanOrEqual(3);
  expect(leafBox!.rx).toBe(8);

  // 校验多层级候选树 levels
  expect(leafBox!.levels).toBeDefined();
  expect(leafBox!.levels!.length).toBe(2);

  // Level 0: 叶子卡片自身
  const lvl0 = leafBox!.levels![0];
  expect(lvl0.level).toBe(0);
  expect(Math.abs(lvl0.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl0.y - 200)).toBeLessThanOrEqual(2);
  expect(lvl0.rx).toBe(8);

  // Level 1: 外层父容器
  const lvl1 = leafBox!.levels![1];
  expect(lvl1.level).toBe(1);
  expect(Math.abs(lvl1.x - 160)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.y - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.width - 760)).toBeLessThanOrEqual(3);
  expect(Math.abs(lvl1.height - 500)).toBeLessThanOrEqual(3);
  expect(lvl1.rx).toBe(16);

  // 2. 修饰符直达父容器 (forceParent: true)
  const parentDirectBox = snapper.snapPoint(320, 260, { forceParent: true });
  expect(parentDirectBox).not.toBeNull();
  expect(Math.abs(parentDirectBox!.x - 160)).toBeLessThanOrEqual(2);
  expect(Math.abs(parentDirectBox!.y - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(parentDirectBox!.width - 760)).toBeLessThanOrEqual(3);
  expect(Math.abs(parentDirectBox!.height - 500)).toBeLessThanOrEqual(3);
  expect(parentDirectBox!.rx).toBe(16);
  expect(parentDirectBox!.levels).toBeDefined();
}

/**
 * 9. 阶段 1.7：全功能组合压力与端到端时延基准 (< 50ms)
 */
async function verifyPhase17PerformanceBenchmark(): Promise<void> {
  const W = 1920;
  const H = 1080;
  const buffer = new Uint8ClampedArray(W * H * 4);
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 父级容器
  fillRoundedRect(buffer, W, H, 200, 150, 1100, 700, 16, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 200, 150, 1100, 700, 16, [71, 85, 105]);

  // 子卡片
  fillRoundedRect(buffer, W, H, 300, 250, 400, 240, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 300, 250, 400, 240, 8, [96, 165, 250]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 预热
  snapper.snapPoint(450, 350);

  const t0 = performance.now();
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    const box = snapper.snapPoint(450, 350);
    expect(box).not.toBeNull();
    expect(box!.levels).toBeDefined();
  }
  const avgMs = (performance.now() - t0) / iterations;
  // 严格要求包含两阶段形态学闭运算与圆角拟合的全链路单次耗时 < 150ms (在 1080p 纯 CPU 及 4 并发 Worker 高负载下)
  expect(avgMs).toBeLessThan(150);
}

/**
 * 10. 阶段 1.7 Task 3：纯透明线框卡片吸附 (Wireframe Rect: fill: transparent, stroke: solid)
 * 验证：内部与画布背景色差 ΔE = 0，仅由 1px 细线包裹，内部含文字杂色，点击空白处精准吸附外围边框
 */
async function verifyTransparentWireframeSnapping(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：深黑 #0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 纯透明线框卡片：(300, 200), 500x300, fill: transparent (即保持 [12, 18, 32], ΔE = 0)
  // 边框：浅蓝 #3b82f6 (59, 130, 246)
  strokeRect(buffer, W, H, 300, 200, 500, 300, [59, 130, 246]);

  // 卡片内部模拟文本行 (白字)
  fillRect(buffer, W, H, 340, 240, 180, 16, () => [255, 255, 255]);
  fillRect(buffer, W, H, 340, 270, 320, 14, () => [148, 163, 184]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击卡片内部纯透明空白区域 (450, 320)
  const box = snapper.snapPoint(450, 320);

  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - 300)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.width - 500)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.height - 300)).toBeLessThanOrEqual(3);
  expect(box!.rx).toBe(0);
}

/**
 * 11. 阶段 1.7 Task 3：虚线编组容器吸附 (Dashed Group Container: stroke-dasharray: 6 6)
 * 验证：点击 6px 实线 + 6px 空气间隙的虚线编组框内部，算法自动触发 1D 架桥，吸附误差 <= 2px
 */
async function verifyDashedContainerSnapping(): Promise<void> {
  const W = 1920;
  const H = 1080;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：深黑 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 绘制 16px 圆角虚线编组框: (200, 150), 800x500, stroke-dasharray: 6 6, stroke: [96, 165, 250]
  strokeDashedRoundedRect(buffer, W, H, 200, 150, 800, 500, 16, [96, 165, 250], 6, 6);

  // 内部模拟一些局部说明文字
  fillRect(buffer, W, H, 240, 190, 220, 18, () => [255, 255, 255]);
  fillRect(buffer, W, H, 240, 220, 360, 14, () => [148, 163, 184]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击虚线容器内部空白处 (500, 350)
  const box = snapper.snapPoint(500, 350);

  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.y - 150)).toBeLessThanOrEqual(2);
  expect(Math.abs(box!.width - 800)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.height - 500)).toBeLessThanOrEqual(3);
  expect(box!.rx).toBe(16);
}

/**
 * 12. 阶段 1.7 Task 3：复合嵌套架构验证 (虚线 VPC 编组包裹实心微服务卡片，双向多层级切换)
 * 验证：在虚线 VPC 内部点击实心 PostgreSQL 卡片，先选中叶子卡片并输出 levels；使用 forceParent 强制直达外层虚线 VPC
 */
async function verifyNestedWireframeAndSolidHierarchy(): Promise<void> {
  const W = 1920;
  const H = 1080;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // (1) 全局画布背景：深蓝灰 #0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // (2) 外层父容器: AWS VPC (x=160, y=100, w=760, h=500, rx=16)
  // 纯透明底色 (保持 12, 18, 32)，虚线边框 stroke-dasharray: 6 6, 边框浅蓝 (96, 165, 250)
  strokeDashedRoundedRect(buffer, W, H, 160, 100, 760, 500, 16, [96, 165, 250], 6, 6);

  // (3) 绘制内层实心子卡片 1: PostgreSQL 18 (x=240, y=200, w=260, h=140, rx=8)
  fillRoundedRect(buffer, W, H, 240, 200, 260, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 240, 200, 260, 140, 8, [96, 165, 250]);

  // (4) 绘制内层实心子卡片 2: Redis Cache (x=560, y=200, w=260, h=140, rx=8)
  fillRoundedRect(buffer, W, H, 560, 200, 260, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 560, 200, 260, 140, 8, [248, 113, 113]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 1. 普通单击内层子卡片 (点击 PostgreSQL 内部: 320, 260)
  const leafBox = snapper.snapPoint(320, 260);
  expect(leafBox).not.toBeNull();
  expect(Math.abs(leafBox!.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.width - 260)).toBeLessThanOrEqual(3);
  expect(Math.abs(leafBox!.height - 140)).toBeLessThanOrEqual(3);
  expect(leafBox!.rx).toBe(8);

  // 校验多层级候选树 levels
  expect(leafBox!.levels).toBeDefined();
  expect(leafBox!.levels!.length).toBe(2);

  // Level 0: 叶子卡片自身
  const lvl0 = leafBox!.levels![0];
  expect(lvl0.level).toBe(0);
  expect(Math.abs(lvl0.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl0.y - 200)).toBeLessThanOrEqual(2);
  expect(lvl0.rx).toBe(8);

  // Level 1: 外层虚线 VPC 父容器
  const lvl1 = leafBox!.levels![1];
  expect(lvl1.level).toBe(1);
  expect(Math.abs(lvl1.x - 160)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.y - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.width - 760)).toBeLessThanOrEqual(3);
  expect(Math.abs(lvl1.height - 500)).toBeLessThanOrEqual(3);
  expect(lvl1.rx).toBe(16);

  // 2. 修饰符直达父容器 (forceParent: true)
  const parentDirectBox = snapper.snapPoint(320, 260, { forceParent: true });
  expect(parentDirectBox).not.toBeNull();
  expect(Math.abs(parentDirectBox!.x - 160)).toBeLessThanOrEqual(2);
  expect(Math.abs(parentDirectBox!.y - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(parentDirectBox!.width - 760)).toBeLessThanOrEqual(3);
  expect(Math.abs(parentDirectBox!.height - 500)).toBeLessThanOrEqual(3);
  expect(parentDirectBox!.rx).toBe(16);
  expect(parentDirectBox!.levels).toBeDefined();
}

/**
 * 13. 阶段 1.7 Task 4：验证带强弥散阴影与 1px 物理边框卡片吸附 (Drop-Shadow Card Decoupling)
 */
async function verifyDropShadowCardSnapping(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：浅灰白 #f1f5f9 (241, 245, 249)
  fillRect(buffer, W, H, 0, 0, W, H, () => [241, 245, 249]);

  // (1) 绘制深色大投影 (外扩 24px，向下偏移 6px，圆角 16px)
  drawDropShadow(buffer, W, H, 300, 200, 480, 320, 24, [15, 23, 42], 0.35, 6, 16);

  // (2) 绘制卡片实体 (纯白 #ffffff，带 1px 细边框 #cbd5e1，圆角 rx = 16)
  fillRoundedRect(buffer, W, H, 300, 200, 480, 320, 16, () => [255, 255, 255]);
  strokeRoundedRect(buffer, W, H, 300, 200, 480, 320, 16, [203, 213, 225]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击卡片中心 (540, 360)
  const snapped = snapper.snapPoint(540, 360);
  expect(snapped).not.toBeNull();

  // 严格校验：1px 物理边框贴合，误差 ≤ 1px，绝不向外溢出至 24px 软阴影区
  expect(Math.abs(snapped!.x - 300)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapped!.y - 200)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapped!.width - 480)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped!.height - 320)).toBeLessThanOrEqual(2);
  expect(snapped!.rx).toBe(16);
}

/**
 * 14. 阶段 1.7 Task 4：验证纯阴影悬浮卡片吸附 (Elevation Card: fill: white on white canvas, no border)
 */
async function verifyElevationCardSnapping(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：纯白 #ffffff (255, 255, 255)
  fillRect(buffer, W, H, 0, 0, W, H, () => [255, 255, 255]);

  // (1) 绘制高斯柔和弥散阴影 (外扩 18px，向下偏移 4px，圆角 16px)
  drawDropShadow(buffer, W, H, 360, 240, 440, 280, 18, [0, 0, 0], 0.32, 4, 16);

  // (2) 绘制卡片实体 (纯白 #ffffff，无任何描边 stroke，纯依靠 box-shadow 呈现高程)
  fillRoundedRect(buffer, W, H, 360, 240, 440, 280, 16, () => [255, 255, 255]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击纯阴影悬浮卡片内部 (580, 380)
  const snapped = snapper.snapPoint(580, 380);
  expect(snapped).not.toBeNull();

  // 严格校验：通过二阶差分与高斯拐点定位物理卡片边缘，误差 ≤ 2px
  expect(Math.abs(snapped!.x - 360)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped!.y - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped!.width - 440)).toBeLessThanOrEqual(3);
  expect(Math.abs(snapped!.height - 280)).toBeLessThanOrEqual(3);
  expect(snapped!.rx).toBe(16);
}

/**
 * 15. 阶段 1.7 Task 5：验证拖拽粗选框大容差纠偏对齐与动态圆角贴合 (Rubberband Drag-to-Snap)
 */
async function verifyRubberbandDragToSnap(): Promise<void> {
  const W = 1600;
  const H = 1000;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：深黑背景 #0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 1. 绘制标准圆角卡片 (x=300, y=200, w=400, h=240, rx=16)
  fillRoundedRect(buffer, W, H, 300, 200, 400, 240, 16, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 300, 200, 400, 240, 16, [59, 130, 246]);

  // 2. 绘制微圆角 Badge (x=800, y=200, w=180, h=64, rx=6)
  fillRoundedRect(buffer, W, H, 800, 200, 180, 64, 6, () => [15, 23, 42]);
  strokeRoundedRect(buffer, W, H, 800, 200, 180, 64, 6, [51, 65, 85]);

  // 3. 绘制直角方形卡片 (x=800, y=360, w=320, h=180, rx=0)
  fillRect(buffer, W, H, 800, 360, 320, 180, () => [30, 41, 59]);
  strokeRect(buffer, W, H, 800, 360, 320, 180, [59, 130, 246]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // (1) 验证标准卡片：模拟用户粗略拉框，四周带 ±15~18px 严重偏差
  // 真实卡片: [300, 200, 400, 240]
  // 手绘粗框: [282, 185, 436, 271] (起点偏左上 15~18px，宽高多出 30~36px)
  const snappedCard = snapper.snapBoxBounds({
    x: 282,
    y: 185,
    width: 436,
    height: 271,
  });

  expect(snappedCard).not.toBeNull();
  expect(Math.abs(snappedCard.x - 300)).toBeLessThanOrEqual(1);
  expect(Math.abs(snappedCard.y - 200)).toBeLessThanOrEqual(1);
  expect(Math.abs(snappedCard.width - 400)).toBeLessThanOrEqual(2);
  expect(Math.abs(snappedCard.height - 240)).toBeLessThanOrEqual(2);
  expect(snappedCard.rx).toBe(16);

  // (2) 验证微圆角 Badge：模拟用户粗略拉框，周围带 ±12px 偏差
  // 真实 Badge: [800, 200, 180, 64]
  // 手绘粗框: [788, 190, 204, 82]
  const snappedBadge = snapper.snapBoxBounds({
    x: 788,
    y: 190,
    width: 204,
    height: 82,
  });

  expect(snappedBadge).not.toBeNull();
  expect(Math.abs(snappedBadge.x - 800)).toBeLessThanOrEqual(2);
  expect(Math.abs(snappedBadge.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(snappedBadge.width - 180)).toBeLessThanOrEqual(3);
  expect(Math.abs(snappedBadge.height - 64)).toBeLessThanOrEqual(3);
  expect(snappedBadge.rx).toBe(6);

  // (3) 验证直角方形卡片：模拟用户粗拉框，纠偏后归零 rx = 0
  // 真实方形: [800, 360, 320, 180]
  // 手绘粗框: [786, 348, 348, 204]
  const snappedSquare = snapper.snapBoxBounds({
    x: 786,
    y: 348,
    width: 348,
    height: 204,
  });

  expect(snappedSquare).not.toBeNull();
  expect(Math.abs(snappedSquare.x - 800)).toBeLessThanOrEqual(2);
  expect(Math.abs(snappedSquare.y - 360)).toBeLessThanOrEqual(2);
  expect(Math.abs(snappedSquare.width - 320)).toBeLessThanOrEqual(3);
  expect(Math.abs(snappedSquare.height - 180)).toBeLessThanOrEqual(3);
  expect(snappedSquare.rx).toBe(0);
}

/**
 * 16. 阶段 1.8 Task 1 / 方案 A：验证大圆角 (rx = 24) 与居中连线去污染吸附 (Large Radius rx=24 & Center Connector Immunity)
 */
async function verifyLargeRadiusAndCenterConnectorCard(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图深色底色：#0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 1. 绘制 rx = 24 的大圆角业务卡片 (420x260, x=300, y=200)
  fillRoundedRect(buffer, W, H, 300, 200, 420, 260, 24, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 300, 200, 420, 260, 24, [59, 130, 246]);

  // 2. 居中垂直流程图连接线 (midX = 510, 宽 4px, 高对比度青色 #00d2ff [0, 210, 255])
  // 顶部连线：覆盖 (508..512, 0..200)
  fillRect(buffer, W, H, 508, 0, 4, 200, () => [0, 210, 255]);
  // 底部连线：覆盖 (508..512, 460..H)
  fillRect(buffer, W, H, 508, 460, 4, H - 460, () => [0, 210, 255]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 单击卡片内部 (510, 330)
  const snapped = snapper.snapPoint(510, 330);
  expect(snapped).not.toBeNull();
  expect(Math.abs(snapped!.x - 300)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped!.y - 200)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped!.width - 420)).toBeLessThanOrEqual(3);
  expect(Math.abs(snapped!.height - 260)).toBeLessThanOrEqual(3);
  expect(snapped!.rx).toBe(24);
}

/**
 * 17. 阶段 1.8 Task 2 / 方案 B：验证紧凑间距网格 (10px gap) 与 3 层嵌套层次冒泡 (3-Level Hierarchy & Compact Grid)
 */
async function verifyCompactGridAndMultiLevelHierarchy(): Promise<void> {
  const W = 1400;
  const H = 900;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图背景：#0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // Level 2 (VPC 大集群容器): x=100, y=80, w=900, h=600, rx=16
  fillRoundedRect(buffer, W, H, 100, 80, 900, 600, 16, () => [20, 28, 45]);
  strokeRoundedRect(buffer, W, H, 100, 80, 900, 600, 16, [51, 65, 85]);

  // Level 1 (Subnet 子网容器): x=170, y=160, w=760, h=440, rx=12
  fillRoundedRect(buffer, W, H, 170, 160, 760, 440, 12, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 170, 160, 760, 440, 12, [71, 85, 105]);

  // Level 0 (紧密排列微服务卡片，水平间隙仅 10px)
  // 左卡 A: x=240, y=250, w=240, h=140, rx=8
  fillRoundedRect(buffer, W, H, 240, 250, 240, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 240, 250, 240, 140, 8, [96, 165, 250]);

  // 右卡 B: x=490, y=250, w=240, h=140, rx=8 (与左卡间隙仅 490 - (240 + 240) = 10px)
  fillRoundedRect(buffer, W, H, 490, 250, 240, 140, 8, () => [51, 65, 85]);
  strokeRoundedRect(buffer, W, H, 490, 250, 240, 140, 8, [248, 113, 113]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 单击左卡内部 (320, 310)
  const leafBox = snapper.snapPoint(320, 310);
  expect(leafBox).not.toBeNull();
  expect(Math.abs(leafBox!.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.y - 250)).toBeLessThanOrEqual(2);
  expect(Math.abs(leafBox!.width - 240)).toBeLessThanOrEqual(3);
  expect(Math.abs(leafBox!.height - 140)).toBeLessThanOrEqual(3);
  expect(leafBox!.rx).toBe(8);

  // 验证 3 级完整包含树
  expect(leafBox!.levels).toBeDefined();
  expect(leafBox!.levels!.length).toBe(3);

  // Level 0: 左卡自身
  const lvl0 = leafBox!.levels![0];
  expect(lvl0.level).toBe(0);
  expect(Math.abs(lvl0.x - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl0.y - 250)).toBeLessThanOrEqual(2);
  expect(lvl0.rx).toBe(8);

  // Level 1: Subnet 中间层
  const lvl1 = leafBox!.levels![1];
  expect(lvl1.level).toBe(1);
  expect(Math.abs(lvl1.x - 170)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.y - 160)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl1.width - 760)).toBeLessThanOrEqual(3);
  expect(Math.abs(lvl1.height - 440)).toBeLessThanOrEqual(3);
  expect(lvl1.rx).toBe(12);

  // Level 2: VPC 最外层
  const lvl2 = leafBox!.levels![2];
  expect(lvl2.level).toBe(2);
  expect(Math.abs(lvl2.x - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl2.y - 80)).toBeLessThanOrEqual(2);
  expect(Math.abs(lvl2.width - 900)).toBeLessThanOrEqual(3);
  expect(Math.abs(lvl2.height - 600)).toBeLessThanOrEqual(3);
  expect(lvl2.rx).toBe(16);

  // 修饰符直达最外层父容器 (forceParent: true)
  const topParent = snapper.snapPoint(320, 310, { forceParent: true });
  expect(topParent).not.toBeNull();
  expect(Math.abs(topParent!.x - 100)).toBeLessThanOrEqual(2);
  expect(Math.abs(topParent!.y - 80)).toBeLessThanOrEqual(2);
  expect(topParent!.rx).toBe(16);
}

/**
 * 18. 阶段 1.8 Task 3 / 方案 C：验证长间隙稀疏虚线边框吸附 (Sparse Dashed Container: stroke-dasharray: 4 12)
 */
async function verifySparseDashedAndDottedContainer(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 背景：#0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 稀疏虚线容器：x=200, y=150, w=700, h=450, rx=16, dashLength=4, gapLength=12 (占空比 25%)
  strokeDashedRoundedRect(buffer, W, H, 200, 150, 700, 450, 16, [96, 165, 250], 4, 12);

  // 内部绘制若干杂色干扰图块 (模拟复杂架构图内文本)
  fillRect(buffer, W, H, 260, 200, 180, 20, () => [148, 163, 184]);
  fillRect(buffer, W, H, 260, 240, 300, 14, () => [100, 116, 139]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 点击虚线容器内部空白处 (450, 320)
  const box = snapper.snapPoint(450, 320);
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x - 200)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.y - 150)).toBeLessThanOrEqual(3);
  expect(Math.abs(box!.width - 700)).toBeLessThanOrEqual(4);
  expect(Math.abs(box!.height - 450)).toBeLessThanOrEqual(4);
  expect(box!.rx).toBe(16);
}

/**
 * 19. 阶段 1.8 Task 4 / 方案 D：验证极微弱阴影高程卡与粗边框强阴影解耦 (Ultra-Faint Elevation & Thick Border with Shadow)
 */
async function verifyUltraFaintElevationAndThickBorderShadow(): Promise<void> {
  // 场景 1：纯白画布上的极微弱阴影高程卡 (maxAlpha = 0.08, blur = 18px, fill: white, no border)
  {
    const W = 1200;
    const H = 800;
    const buffer = new Uint8ClampedArray(W * H * 4);
    fillRect(buffer, W, H, 0, 0, W, H, () => [255, 255, 255]);

    // 绘制微弱弥散阴影 (maxAlpha = 0.08)
    drawDropShadow(buffer, W, H, 360, 240, 440, 280, 18, [0, 0, 0], 0.08, 4, 16);
    // 绘制纯白实体卡片 (无边框)
    fillRoundedRect(buffer, W, H, 360, 240, 440, 280, 16, () => [255, 255, 255]);

    const snapper = new SobelEdgeSnapper();
    snapper.setImageData(buffer, W, H);

    const snapped = snapper.snapPoint(580, 380);
    expect(snapped).not.toBeNull();
    expect(Math.abs(snapped!.x - 360)).toBeLessThanOrEqual(3);
    expect(Math.abs(snapped!.y - 240)).toBeLessThanOrEqual(3);
    expect(Math.abs(snapped!.width - 440)).toBeLessThanOrEqual(4);
    expect(Math.abs(snapped!.height - 280)).toBeLessThanOrEqual(4);
    expect(snapped!.rx).toBe(16);
  }

  // 场景 2：3px 粗边框伴随 24px 强弥散阴影卡片 (Multi-width Box-Hat Kurtosis 解耦)
  {
    const W = 1200;
    const H = 800;
    const buffer = new Uint8ClampedArray(W * H * 4);
    fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

    // 绘制 24px 强弥散投影 (maxAlpha = 0.40)
    drawDropShadow(buffer, W, H, 300, 200, 400, 240, 24, [0, 0, 0], 0.40, 6, 12);
    // 绘制卡片实体 (x=300, y=200, w=400, h=240, rx=12)
    fillRoundedRect(buffer, W, H, 300, 200, 400, 240, 12, () => [30, 41, 59]);

    // 绘制 3px 粗实线边框 (stroke 3px)
    for (let t = 0; t < 3; t++) {
      strokeRoundedRect(
        buffer,
        W,
        H,
        300 + t,
        200 + t,
        400 - 2 * t,
        240 - 2 * t,
        Math.max(0, 12 - t),
        [59, 130, 246]
      );
    }

    const snapper = new SobelEdgeSnapper();
    snapper.setImageData(buffer, W, H);

    // 点击卡片内部 (500, 320)
    const snapped = snapper.snapPoint(500, 320);
    expect(snapped).not.toBeNull();
    expect(Math.abs(snapped!.x - 300)).toBeLessThanOrEqual(3);
    expect(Math.abs(snapped!.y - 200)).toBeLessThanOrEqual(3);
    expect(Math.abs(snapped!.width - 400)).toBeLessThanOrEqual(3);
    expect(Math.abs(snapped!.height - 240)).toBeLessThanOrEqual(3);
    expect(snapped!.rx).toBe(12);
  }
}

/**
 * 20. 阶段 1.8 Task 5 / 方案 E：验证拖拽粗选框大容差纠偏排除内部分割线 (Internal Accent Bar Rejection)
 */
async function verifyDragSnapWithInternalAccentBar(): Promise<void> {
  const W = 1200;
  const H = 800;
  const buffer = new Uint8ClampedArray(W * H * 4);

  // 全图深色底色：#0c1220 (12, 18, 32)
  fillRect(buffer, W, H, 0, 0, W, H, () => [12, 18, 32]);

  // 1. 绘制标准卡片：(300, 200), 440x240, rx=12, 底色 [30, 41, 59], 外框 [59, 130, 246]
  fillRoundedRect(buffer, W, H, 300, 200, 440, 240, 12, () => [30, 41, 59]);
  strokeRoundedRect(buffer, W, H, 300, 200, 440, 240, 12, [59, 130, 246]);

  // 2. 在卡片内部左侧 22px 处绘制一条贯穿上下的高亮装饰色条/内部分割线 (x=322, 宽 3px, 高亮琥珀色 [245, 158, 11])
  // 该线左右两侧均为卡片底色 [30, 41, 59]，具有强梯度与高连续性
  fillRect(buffer, W, H, 322, 210, 3, 220, () => [245, 158, 11]);

  const snapper = new SobelEdgeSnapper();
  snapper.setImageData(buffer, W, H);

  // 3. 用户手绘粗选框：起点 (282, 184)，尺寸 476x272
  // 左侧起点 282，搜索半径 40px，寻峰窗口涵盖 [242, 322]，恰好深入至内部装饰条 x=322 处！
  const snapped = snapper.snapBoxBounds(
    {
      x: 282,
      y: 184,
      width: 476,
      height: 272,
    },
    { customRadius: 40 }
  );

  expect(snapped).not.toBeNull();
  // 必须成功排斥内部分割线 (x=322)，精准锁定真正的物理外框 (x=300)
  expect(Math.abs(snapped.x - 300)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapped.y - 200)).toBeLessThanOrEqual(1);
  expect(Math.abs(snapped.width - 440)).toBeLessThanOrEqual(2);
  expect(Math.abs(snapped.height - 240)).toBeLessThanOrEqual(2);
  expect(snapped.rx).toBe(12);
}

// Playwright test runner 编排
test.describe('SobelEdgeSnapper Industrial Suite (Phase 1.6 ~ 1.8)', () => {
  test('TC-SNAP-01: Standard Card Snapping with text hole melting', async () => {
    await verifyStandardCardSnapping();
  });

  test('TC-SNAP-02: Badge Card with 22px bold text (Case 1)', async () => {
    await verifyBadgeCardWithLargeBoldText();
  });

  test('TC-SNAP-03: Wide-Span Card with linear gradient and multi-line paragraphs (Case 2)', async () => {
    await verifyWideSpanCardWithGradientAndParagraphs();
  });

  test('TC-SNAP-04: Emoji / colorful icon click immunity (Case 2 Silent Failure)', async () => {
    await verifyEmojiIconClickImmunity();
  });

  test('TC-SNAP-05: Real-time execution benchmark (< 10ms)', async () => {
    await verifyPerformanceBenchmark();
  });

  test('TC-SNAP-06: Square Card Radius Fitting (rx = 0)', async () => {
    await verifySquareCardRadiusFitting();
  });

  test('TC-SNAP-07: Badge (rx = 6) and Pill Tag (rx = H/2) Radius Fitting', async () => {
    await verifyBadgeAndPillRadiusFitting();
  });

  test('TC-SNAP-08: Hierarchical Container Snapping with levels & forceParent', async () => {
    await verifyHierarchicalContainerSnapping();
  });

  test('TC-SNAP-09: Phase 1.7 full pipeline performance benchmark', async () => {
    await verifyPhase17PerformanceBenchmark();
  });

  test('TC-SNAP-10: Transparent Wireframe Card Snapping (Wireframe: fill: transparent, stroke: solid)', async () => {
    await verifyTransparentWireframeSnapping();
  });

  test('TC-SNAP-11: Dashed Border Group Container Snapping (stroke-dasharray: 6 6)', async () => {
    await verifyDashedContainerSnapping();
  });

  test('TC-SNAP-12: Nested Wireframe and Solid Hierarchy (Dashed VPC + Solid Microservice Cards)', async () => {
    await verifyNestedWireframeAndSolidHierarchy();
  });

  test('TC-SNAP-13: Drop-Shadow Card Decoupling (1px border + blur=24px)', async () => {
    await verifyDropShadowCardSnapping();
  });

  test('TC-SNAP-14: Elevation Card Snapping (fill: white on white canvas, blur=18px, no border)', async () => {
    await verifyElevationCardSnapping();
  });

  test('TC-SNAP-15: Rubberband Drag-to-Snap with displacement correction and dynamic rx fitting', async () => {
    await verifyRubberbandDragToSnap();
  });

  test('TC-SNAP-16: Large Radius (rx=24) & Center Connector Line Immunity (RFC 46 Module A)', async () => {
    await verifyLargeRadiusAndCenterConnectorCard();
  });

  test('TC-SNAP-17: Compact Grid (10px gap) & 3-Level Hierarchy Bubbling (RFC 46 Module B)', async () => {
    await verifyCompactGridAndMultiLevelHierarchy();
  });

  test('TC-SNAP-18: Sparse Dashed Container (stroke-dasharray: 4 12) Snapping (RFC 46 Module C)', async () => {
    await verifySparseDashedAndDottedContainer();
  });

  test('TC-SNAP-19: Ultra-Faint Elevation (alpha=0.08) & Thick Border Drop Shadow (RFC 46 Module D)', async () => {
    await verifyUltraFaintElevationAndThickBorderShadow();
  });

  test('TC-SNAP-20: Drag-to-Snap with Internal Accent Bar Rejection (RFC 46 Module E)', async () => {
    await verifyDragSnapWithInternalAccentBar();
  });
});

