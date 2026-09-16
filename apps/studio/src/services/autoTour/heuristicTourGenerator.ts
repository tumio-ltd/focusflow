import type { FocusFlowDSL, ElementBox, ElementPath, CalloutItem, SceneStep } from '@focusflow/dsl';

export interface HeuristicTourOptions {
  /** 自定义工程标题 (默认从文件名提取或根据语种提供默认标题) */
  title?: string;
  /** 底图访问 URL (相对路径、绝对 URL 或 Data URI) */
  assetUrl: string;
  /** 期望聚焦的目标集群数 (默认 3~4 个) */
  targetClusterCount?: number;
  /** 当前语言环境 ('zh' | 'en'，未指定则根据环境自动探测) */
  locale?: 'zh' | 'en';
}


export interface ClusterBoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  energyScore: number;
}

export interface CameraFrustum {
  zoom: number;
  x: number;
  y: number;
  duration: number;
}

/**
 * 辅助函数：根据灰度值提取 (Rec. 601 标量)
 */
function getGray(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): number {
  const cx = Math.max(0, Math.min(width - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(height - 1, Math.round(y)));
  const idx = (cy * width + cx) * 4;
  return (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
}

/**
 * 辅助函数：计算 3x3 Sobel 梯度幅值
 */
function getSobelGradient(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): number {
  const gx =
    getGray(data, width, height, x + 1, y - 1) +
    2 * getGray(data, width, height, x + 1, y) +
    getGray(data, width, height, x + 1, y + 1) -
    (getGray(data, width, height, x - 1, y - 1) +
      2 * getGray(data, width, height, x - 1, y) +
      getGray(data, width, height, x - 1, y + 1));

  const gy =
    getGray(data, width, height, x - 1, y + 1) +
    2 * getGray(data, width, height, x, y + 1) +
    getGray(data, width, height, x + 1, y + 1) -
    (getGray(data, width, height, x - 1, y - 1) +
      2 * getGray(data, width, height, x, y - 1) +
      getGray(data, width, height, x + 1, y - 1));

  return Math.sqrt(gx * gx + gy * gy);
}

/**
 * 辅助函数：计算单元格内的局部色彩方差
 */
function getCellRgbVariance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  cellSize: number
): number {
  let sumR = 0,
    sumG = 0,
    sumB = 0;
  let count = 0;
  const sampleStep = Math.max(2, Math.floor(cellSize / 4));

  for (let y = startY; y < startY + cellSize && y < height; y += sampleStep) {
    for (let x = startX; x < startX + cellSize && x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
      count++;
    }
  }

  if (count === 0) return 0;
  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;

  let variance = 0;
  for (let y = startY; y < startY + cellSize && y < height; y += sampleStep) {
    for (let x = startX; x < startX + cellSize && x < width; x += sampleStep) {
      const idx = (y * width + x) * 4;
      variance +=
        (data[idx] - avgR) ** 2 +
        (data[idx + 1] - avgG) ** 2 +
        (data[idx + 2] - avgB) ** 2;
    }
  }

  return Math.sqrt(variance / count);
}

/**
 * 纯前端启发式视觉重心聚类算法 (Heuristic Saliency Clustering Engine)
 * 从离屏 ImageData 像素矩阵中提取 3~4 个核心模块外接矩形
 */
export function extractHeuristicClusters(
  imgData: ImageData | { data: Uint8ClampedArray; width: number; height: number },
  targetCount = 3
): ClusterBoundingBox[] {
  const { width, height, data } = imgData;

  // 1. 自适应计算采样网格步长 (根据底图短边自适应在 24px ~ 48px 之间)
  const cellSize = Math.max(24, Math.min(48, Math.floor(Math.min(width, height) / 50)));
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);

  const energyGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  let totalEnergy = 0;
  let sampleCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cellSize + cellSize / 2;
      const cy = r * cellSize + cellSize / 2;
      const grad = getSobelGradient(data, width, height, cx, cy);
      const colorVar = getCellRgbVariance(data, width, height, c * cellSize, r * cellSize, cellSize);
      const cellEnergy = grad * 0.7 + colorVar * 0.3;
      energyGrid[r][c] = cellEnergy;
      totalEnergy += cellEnergy;
      sampleCount++;
    }
  }

  const meanEnergy = sampleCount > 0 ? totalEnergy / sampleCount : 0;
  let varianceEnergy = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      varianceEnergy += (energyGrid[r][c] - meanEnergy) ** 2;
    }
  }
  const stdEnergy = Math.sqrt(varianceEnergy / (sampleCount || 1));
  const activeThreshold = meanEnergy + stdEnergy * 0.35;

  // 2. 连通域种子生长聚类 (Connected Component Flood Fill on Grid)
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const candidateBoxes: ClusterBoundingBox[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!visited[r][c] && energyGrid[r][c] > activeThreshold) {
        // 发现未访问的显著单元，展开 BFS
        let minC = c,
          maxC = c,
          minR = r,
          maxR = r;
        let clusterScore = 0;
        const queue: Array<[number, number]> = [[r, c]];
        visited[r][c] = true;

        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          minC = Math.min(minC, currC);
          maxC = Math.max(maxC, currC);
          minR = Math.min(minR, currR);
          maxR = Math.max(maxR, currR);
          clusterScore += energyGrid[currR][currC];

          // 8-邻域扩展 (带 1 格容错间距，吸附相近模块)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = currR + dr;
              const nc = currC + dc;
              if (
                nr >= 0 &&
                nr < rows &&
                nc >= 0 &&
                nc < cols &&
                !visited[nr][nc] &&
                energyGrid[nr][nc] > activeThreshold * 0.75
              ) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }
        }

        const boxX = minC * cellSize;
        const boxY = minR * cellSize;
        const boxW = (maxC - minC + 1) * cellSize;
        const boxH = (maxR - minR + 1) * cellSize;

        // 过滤过小杂讯（文字、碎图标）与过大背景外框
        const minValidW = Math.min(200, width * 0.08);
        const minValidH = Math.min(120, height * 0.08);
        const maxArea = width * height * 0.65;

        if (boxW >= minValidW && boxH >= minValidH && boxW * boxH <= maxArea) {
          candidateBoxes.push({
            id: `box-${candidateBoxes.length + 1}`,
            x: Math.max(20, boxX - 10),
            y: Math.max(20, boxY - 10),
            width: Math.min(width - boxX - 20, boxW + 20),
            height: Math.min(height - boxY - 20, boxH + 20),
            energyScore: clusterScore,
          });
        }
      }
    }
  }

  // 3. 非极大值抑制 (NMS / IoU 合并)
  candidateBoxes.sort((a, b) => b.energyScore - a.energyScore);
  const selectedBoxes: ClusterBoundingBox[] = [];

  for (const box of candidateBoxes) {
    let hasOverlap = false;
    for (const chosen of selectedBoxes) {
      const interX1 = Math.max(box.x, chosen.x);
      const interY1 = Math.max(box.y, chosen.y);
      const interX2 = Math.min(box.x + box.width, chosen.x + chosen.width);
      const interY2 = Math.min(box.y + box.height, chosen.y + chosen.height);
      const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
      const unionArea = box.width * box.height + chosen.width * chosen.height - interArea;
      const iou = unionArea > 0 ? interArea / unionArea : 0;

      if (iou > 0.35) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      selectedBoxes.push(box);
      if (selectedBoxes.length >= targetCount) break;
    }
  }

  // 4. 高鲁棒性兜底 (Fallback Heuristic): 若图片过于平滑或无明显边缘导致提取不足
  if (selectedBoxes.length < 3) {
    const isWider = width >= height;
    const fallbackBoxes: ClusterBoundingBox[] = isWider
      ? [
          // 横向三等分架构
          {
            id: 'box-1',
            x: Math.round(width * 0.08),
            y: Math.round(height * 0.2),
            width: Math.round(width * 0.24),
            height: Math.round(height * 0.55),
            energyScore: 100,
          },
          {
            id: 'box-2',
            x: Math.round(width * 0.38),
            y: Math.round(height * 0.2),
            width: Math.round(width * 0.25),
            height: Math.round(height * 0.55),
            energyScore: 90,
          },
          {
            id: 'box-3',
            x: Math.round(width * 0.68),
            y: Math.round(height * 0.2),
            width: Math.round(width * 0.24),
            height: Math.round(height * 0.55),
            energyScore: 80,
          },
        ]
      : [
          // 纵向三层架构
          {
            id: 'box-1',
            x: Math.round(width * 0.15),
            y: Math.round(height * 0.08),
            width: Math.round(width * 0.7),
            height: Math.round(height * 0.24),
            energyScore: 100,
          },
          {
            id: 'box-2',
            x: Math.round(width * 0.15),
            y: Math.round(height * 0.38),
            width: Math.round(width * 0.7),
            height: Math.round(height * 0.24),
            energyScore: 90,
          },
          {
            id: 'box-3',
            x: Math.round(width * 0.15),
            y: Math.round(height * 0.68),
            width: Math.round(width * 0.7),
            height: Math.round(height * 0.24),
            energyScore: 80,
          },
        ];
    return fallbackBoxes;
  }

  return selectedBoxes;
}

/**
 * 拓扑方向判决与分镜时序排序
 * 判断是“自顶向下纵向分层”还是“从左向右横向流水”
 */
export function sortClustersByTopologicalFlow(
  clusters: ClusterBoundingBox[]
): { sorted: ClusterBoundingBox[]; isVertical: boolean } {
  if (clusters.length <= 1) return { sorted: clusters, isVertical: true };

  const centers = clusters.map((c) => ({
    cx: c.x + c.width / 2,
    cy: c.y + c.height / 2,
    cluster: c,
  }));

  let sumX = 0,
    sumY = 0;
  for (const p of centers) {
    sumX += p.cx;
    sumY += p.cy;
  }
  const avgX = sumX / centers.length;
  const avgY = sumY / centers.length;

  let varX = 0,
    varY = 0;
  for (const p of centers) {
    varX += (p.cx - avgX) ** 2;
    varY += (p.cy - avgY) ** 2;
  }

  const isVertical = varY >= varX;

  const sorted = [...clusters].sort((a, b) => {
    if (isVertical) {
      return a.y + a.height / 2 - (b.y + b.height / 2);
    } else {
      return a.x + a.width / 2 - (b.x + b.width / 2);
    }
  });

  return { sorted, isVertical };
}

/**
 * 电影级摄像机推拉视锥计算模型 (Camera Frustum Math)
 * 将目标框元 AABB 尺寸与位置，转换为保证 16:9 画幅不越界的自适应 Zoom 与百分比中心偏移
 */
export function calculateCameraFrustum(
  box: ClusterBoundingBox,
  viewportWidth: number,
  viewportHeight: number,
  transitionDuration = 1.4
): CameraFrustum {
  const bw = Math.max(50, box.width);
  const bh = Math.max(50, box.height);

  // 1. 视锥缩放倍率反推 (预留 1.6x 呼吸边距与气泡容纳安全距离)
  const idealZoomX = viewportWidth / (bw * 1.6);
  const idealZoomY = viewportHeight / (bh * 1.6);
  const zoom = Math.max(1.6, Math.min(2.5, Math.min(idealZoomX, idealZoomY)));

  // 2. 目标中心相对底图绝对原点的百分比偏移 (-50% ~ +50%)
  const boxCenterX = box.x + bw / 2;
  const boxCenterY = box.y + bh / 2;
  const rawOffsetX = ((boxCenterX - viewportWidth / 2) / viewportWidth) * 100;
  const rawOffsetY = ((boxCenterY - viewportHeight / 2) / viewportHeight) * 100;

  // 3. 边缘安全防穿帮钳位 (Edge Clamping): 确保放大后视锥边缘绝对不超出底图范围
  const maxClampedPercentX = (1 - 1 / zoom) * 50;
  const maxClampedPercentY = (1 - 1 / zoom) * 50;

  const clampedX = Number(
    Math.max(-maxClampedPercentX, Math.min(maxClampedPercentX, rawOffsetX)).toFixed(2)
  );
  const clampedY = Number(
    Math.max(-maxClampedPercentY, Math.min(maxClampedPercentY, rawOffsetY)).toFixed(2)
  );

  return {
    zoom: Number(zoom.toFixed(2)),
    x: clampedX,
    y: clampedY,
    duration: transitionDuration,
  };
}

/**
 * 纯前端启发式 AI 导览合成主入口 (Main Tour Synthesis Entrypoint)
 * 输入底图像素数据或 HTMLImageElement，输出一套开箱即用的 4 幕电影级 FocusFlowDSL
 */
export function generateHeuristicAutoTour(
  imgSource:
    | HTMLImageElement
    | ImageData
    | { data: Uint8ClampedArray; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
  options: HeuristicTourOptions
): FocusFlowDSL {
  let imgDataObj: { data: Uint8ClampedArray; width: number; height: number };

  if ('data' in imgSource && 'width' in imgSource) {
    imgDataObj = imgSource;
  } else if (typeof document !== 'undefined' && imgSource instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(imgSource, 0, 0, viewportWidth, viewportHeight);
      imgDataObj = ctx.getImageData(0, 0, viewportWidth, viewportHeight);
    } else {
      // Canvas 失败回退为伪造对象
      imgDataObj = {
        data: new Uint8ClampedArray(viewportWidth * viewportHeight * 4),
        width: viewportWidth,
        height: viewportHeight,
      };
    }
  } else {
    imgDataObj = {
      data: new Uint8ClampedArray(viewportWidth * viewportHeight * 4),
      width: viewportWidth,
      height: viewportHeight,
    };
  }

  // 1. 聚类提取 3 个核心架构模块
  const rawClusters = extractHeuristicClusters(imgDataObj, options.targetClusterCount || 3);
  const { sorted: clusters, isVertical } = sortClustersByTopologicalFlow(rawClusters);

  // 2. 装配 Boxes
  const colorPalette = [
    { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.05)', theme: 'blue' },
    { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.05)', theme: 'green' },
    { stroke: '#818cf8', fill: 'rgba(129, 140, 248, 0.05)', theme: 'indigo' },
    { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.05)', theme: 'pink' },
  ];

  const placeholderTitlesZh = [
    '01 接入网关与安全控制层',
    '02 业务微服务中台处理集群',
    '03 分布式存储与持久化中台',
    '04 消息事件总线与大数据层',
  ];
  const placeholderTitlesEn = [
    '01 Ingress Gateway & Security Layer',
    '02 Business Microservices Hub',
    '03 Distributed Persistence Cluster',
    '04 Event Bus & Analytics Layer',
  ];

  const placeholderDescsZh = [
    '负责多端全渠道流量路由、自适应动态限流、身份鉴权验签与边缘调度。',
    '基于分布式高并发流水线编排业务状态机，保障分布式事务最终一致性。',
    '高可用读写分离与分库分表集群，提供纳秒级缓存加速与强一致保障。',
    '事件驱动流式管道与实时日志聚合分析，实现全链路透明监控。',
  ];
  const placeholderDescsEn = [
    'Handles omnichannel traffic routing, dynamic rate-limiting, and edge security validation.',
    'Orchestrates state machines with high concurrency, guaranteeing eventual consistency.',
    'Provides high-availability sharding, sub-millisecond in-memory cache, and ACID compliance.',
    'Event-driven streaming pipeline and log aggregation for real-time observability.',
  ];

  const boxes: ElementBox[] = clusters.map((c, i) => {
    const palette = colorPalette[i % colorPalette.length];
    return {
      id: `box-${i + 1}`,
      type: 'rect',
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      rx: 16,
      ry: 16,
      style: {
        stroke: palette.stroke,
        strokeWidth: 3,
        glow: true,
        fill: palette.fill,
      },
    };
  });

  // 3. 装配 Paths 连线
  const paths: ElementPath[] = [];
  for (let i = 0; i < boxes.length - 1; i++) {
    const fromId = boxes[i].id;
    const toId = boxes[i + 1].id;
    const fromAnchor = isVertical ? `${fromId}.bottom` : `${fromId}.right`;
    const toAnchor = isVertical ? `${toId}.top` : `${toId}.left`;

    paths.push({
      id: `path-${i + 1}-${i + 2}`,
      from: fromAnchor,
      to: toAnchor,
      style: {
        stroke: colorPalette[i % colorPalette.length].stroke,
        strokeWidth: 3,
        mode: 'stream',
        flowSpeed: 1.6,
        glow: true,
      },
    });
  }

  // 4. 装配 Callouts
  const isEn = options.locale === 'en';

  const callouts: CalloutItem[] = clusters.map((c, i) => {
    const palette = colorPalette[i % colorPalette.length];
    // 根据空间自适应决定 Callout 相对位置 (优先放在上方或右侧)
    const calloutLeft = Math.min(viewportWidth - 360, Math.max(20, c.x + 20));
    const calloutTop = Math.max(30, c.y - 85);

    const titleZh = placeholderTitlesZh[i] || `模块 ${i + 1}`;
    const titleEn = placeholderTitlesEn[i] || `Module ${i + 1}`;
    const descZh = placeholderDescsZh[i] || '通用架构业务拓扑集群模块';
    const descEn = placeholderDescsEn[i] || 'General architecture business module';

    return {
      id: `callout-${i + 1}`,
      targetBoxId: `box-${i + 1}`,
      position: {
        left: `${Math.round(calloutLeft)}px`,
        top: `${Math.round(calloutTop)}px`,
      },
      theme: palette.theme,
      title: isEn ? titleEn : titleZh,
      desc: isEn ? descEn : descZh,
      titleI18n: {
        zh: titleZh,
        en: titleEn,
      },
      descI18n: {
        zh: descZh,
        en: descEn,
      },
      style: {
        fontSize: 14,
        titleFontSize: 13,
        maxWidth: 360,
      },
    };
  });

  // 5. 编排 4 幕电影级分镜头 (Storyboard Scenes)
  const scenes: SceneStep[] = [];

  const scene0TitleZh = '01 全局架构拓扑总览';
  const scene0TitleEn = '01 Global Architecture Overview';
  const scene0ScriptZh =
    '系统整体架构全景总览，展现核心网关接入层、业务微服务集群与持久化中台的完整拓扑时序。';
  const scene0ScriptEn =
    'High-level architectural overview illustrating ingress gateways, microservices hubs, and data persistence topology.';

  // 第 1 幕：全景鸟瞰 (Overview)
  scenes.push({
    id: 'scene-0',
    title: isEn ? scene0TitleEn : scene0TitleZh,
    titleI18n: {
      zh: scene0TitleZh,
      en: scene0TitleEn,
    },
    duration: 4200,
    voiceoverScript: isEn ? scene0ScriptEn : scene0ScriptZh,
    voiceoverScriptI18n: {
      zh: scene0ScriptZh,
      en: scene0ScriptEn,
    },
    camera: {
      zoom: 1.0,
      x: 0,
      y: 0,
      duration: 1.2,
    },
    activeElements: {
      boxes: boxes.map((b) => b.id),
      paths: [],
      callouts: [],
    },
  });

  // 第 2~4 幕：局部特写与推拉镜头 (Close-ups and Dolly Shots)
  for (let i = 0; i < boxes.length; i++) {
    const frustum = calculateCameraFrustum(clusters[i], viewportWidth, viewportHeight, 1.4);
    const sceneIndex = i + 1;
    const activePaths = paths.slice(0, i).map((p) => p.id);

    const sceneTitleZh = placeholderTitlesZh[i] || `0${sceneIndex + 1} 核心业务集群特写`;
    const sceneTitleEn = placeholderTitlesEn[i] || `0${sceneIndex + 1} Core Cluster Close-Up`;
    const sceneScriptZh = placeholderDescsZh[i];
    const sceneScriptEn = placeholderDescsEn[i];

    scenes.push({
      id: `scene-${sceneIndex}`,
      title: isEn ? sceneTitleEn : sceneTitleZh,
      titleI18n: {
        zh: sceneTitleZh,
        en: sceneTitleEn,
      },
      duration: 4800,
      voiceoverScript: isEn ? sceneScriptEn : sceneScriptZh,
      voiceoverScriptI18n: {
        zh: sceneScriptZh,
        en: sceneScriptEn,
      },
      camera: {
        zoom: frustum.zoom,
        x: frustum.x,
        y: frustum.y,
        duration: frustum.duration,
      },
      activeElements: {
        boxes: boxes.slice(0, i + 1).map((b) => b.id),
        paths: activePaths,
        callouts: [callouts[i]],
      },
    });
  }

  // 6. 整合组装为标准 FocusFlowDSL
  const defaultMetaTitle = isEn
    ? 'Enterprise Architecture Evolution Tour'
    : '企业系统架构演进导览';

  const dsl: FocusFlowDSL = {
    $schema: 'https://focusflow.io/schema/v1.json',
    meta: {
      title: options.title || defaultMetaTitle,
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
        aspectRatio: '16:9',
      },
      theme: {
        mode: 'dark',
        accent: '#38bdf8',
      },
      controls: {
        showHUDButton: true,
        autoplay: false,
        interval: 4500,
        showControls: false,
      },
    },
    asset: {
      url: options.assetUrl,
    },
    elements: {
      boxes,
      paths,
      dots: [],
      images: [],
    },
    scenes,
  };

  return dsl;
}

/**
 * 异步从图片 URL 或 Data URI 解析并生成启发式导览 DSL
 */
export async function generateHeuristicAutoTourFromUrl(
  url: string,
  viewportWidth = 1920,
  viewportHeight = 1080,
  options: Partial<HeuristicTourOptions> = {}
): Promise<FocusFlowDSL> {
  const detectedLocale: 'zh' | 'en' =
    options.locale ||
    (typeof window !== 'undefined' &&
    (localStorage.getItem('focusflow_locale')?.startsWith('en') ||
      document.documentElement.lang?.startsWith('en'))
      ? 'en'
      : 'zh');

  const defaultTitle =
    detectedLocale === 'en'
      ? 'Enterprise Architecture Evolution Tour'
      : '企业系统架构演进导览';

  const mergedOptions: HeuristicTourOptions = {
    assetUrl: url,
    title: options.title || defaultTitle,
    targetClusterCount: options.targetClusterCount || 3,
    locale: detectedLocale,
  };


  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return generateHeuristicAutoTour(
      {
        data: new Uint8ClampedArray(viewportWidth * viewportHeight * 4),
        width: viewportWidth,
        height: viewportHeight,
      },
      viewportWidth,
      viewportHeight,
      mergedOptions
    );
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || viewportWidth;
      const h = img.naturalHeight || viewportHeight;
      const dsl = generateHeuristicAutoTour(img, w, h, mergedOptions);
      resolve(dsl);
    };
    img.onerror = () => {
      console.warn('[heuristicTourGenerator] Failed to load image from URL, falling back to heuristic mock grid.');
      const dsl = generateHeuristicAutoTour(
        {
          data: new Uint8ClampedArray(viewportWidth * viewportHeight * 4),
          width: viewportWidth,
          height: viewportHeight,
        },
        viewportWidth,
        viewportHeight,
        mergedOptions
      );
      resolve(dsl);
    };
    img.src = url;
  });
}

