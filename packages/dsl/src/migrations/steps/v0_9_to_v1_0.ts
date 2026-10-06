import type { DSLMigrationStep } from '../types.js';

/**
 * 0.9.0 (MVP 阶段遗留草稿格式) -> 1.0.0 (生产级统一 AST) 升级迁移步进
 */
export const migrateV0_9ToV1_0: DSLMigrationStep = (raw: Record<string, any>): Record<string, any> => {
  const current = JSON.parse(JSON.stringify(raw));

  // 1. 规范化顶层元信息与版本号
  current.schemaVersion = '1.0.0';
  if (!current.$schema || typeof current.$schema !== 'string') {
    current.$schema = 'https://focusflow.io/schemas/dsl/v1.json';
  }

  // 2. 规范化 meta 属性
  if (!current.meta || typeof current.meta !== 'object') {
    current.meta = {};
  }
  if (!current.meta.title || typeof current.meta.title !== 'string') {
    current.meta.title = 'Untitled FocusFlow Project';
  }

  // 2.1 规范化 viewport
  if (!current.meta.viewport || typeof current.meta.viewport !== 'object') {
    current.meta.viewport = { width: 1920, height: 1080, aspectRatio: '16:9' };
  } else {
    const width = Number(current.meta.viewport.width) > 0 ? Number(current.meta.viewport.width) : 1920;
    const height = Number(current.meta.viewport.height) > 0 ? Number(current.meta.viewport.height) : 1080;
    current.meta.viewport.width = width;
    current.meta.viewport.height = height;

    if (!current.meta.viewport.aspectRatio) {
      if (width === 3840 && height === 2160) {
        current.meta.viewport.aspectRatio = '16:9';
      } else if (width === 1920 && height === 1080) {
        current.meta.viewport.aspectRatio = '16:9';
      } else if (width === 1080 && height === 1920) {
        current.meta.viewport.aspectRatio = '9:16';
      } else {
        current.meta.viewport.aspectRatio = `${width}:${height}`;
      }
    }
  }

  // 2.2 规范化 theme
  if (!current.meta.theme || typeof current.meta.theme !== 'object') {
    current.meta.theme = { mode: 'dark' };
  } else if (!['dark', 'light', 'auto'].includes(current.meta.theme.mode)) {
    current.meta.theme.mode = 'dark';
  }

  // 3. 规范化 asset 资源定义
  if (!current.asset || typeof current.asset !== 'object') {
    current.asset = { url: 'https://placeholder.focusflow.io/asset.svg' };
  } else if (typeof current.asset.url !== 'string' || !current.asset.url.trim()) {
    current.asset.url = 'https://placeholder.focusflow.io/asset.svg';
  }

  // 4. 规范化 elements 集合
  if (!current.elements || typeof current.elements !== 'object') {
    current.elements = {
      boxes: [],
      paths: [],
      dots: [],
      images: [],
    };
  } else {
    current.elements.boxes = Array.isArray(current.elements.boxes) ? current.elements.boxes : [];
    current.elements.paths = Array.isArray(current.elements.paths) ? current.elements.paths : [];
    current.elements.dots = Array.isArray(current.elements.dots) ? current.elements.dots : [];
    current.elements.images = Array.isArray(current.elements.images) ? current.elements.images : [];
  }

  // 拓扑悬空引用自愈
  const boxIdSet = new Set<string>();
  for (const b of current.elements.boxes) {
    if (b && typeof b.id === 'string') {
      boxIdSet.add(b.id);
    }
  }

  // 过滤端点不存在的悬空 paths
  current.elements.paths = current.elements.paths.filter((p: any) => {
    if (!p || typeof p !== 'object') return false;
    const fromBox = typeof p.from === 'string' ? p.from.split('.')[0] : undefined;
    const toBox = typeof p.to === 'string' ? p.to.split('.')[0] : undefined;
    if (fromBox && !boxIdSet.has(fromBox)) return false;
    if (toBox && !boxIdSet.has(toBox)) return false;
    return true;
  });

  const validPathIdSet = new Set<string>(current.elements.paths.map((p: any) => p.id).filter(Boolean));
  const validDotIdSet = new Set<string>(current.elements.dots.map((d: any) => d.id).filter(Boolean));
  const validImgIdSet = new Set<string>(current.elements.images.map((i: any) => i.id).filter(Boolean));

  // 5. 规范化 scenes 分幕序列
  if (!Array.isArray(current.scenes) || current.scenes.length === 0) {
    current.scenes = [
      {
        id: 'scene-01',
        title: 'Overview',
        duration: 3000,
        camera: { x: 0, y: 0, zoom: 1.0 },
        activeElements: {},
      },
    ];
  } else {
    current.scenes = current.scenes.map((s: any, idx: number) => {
      if (!s || typeof s !== 'object') {
        return {
          id: `scene-${String(idx + 1).padStart(2, '0')}`,
          title: `Scene ${idx + 1}`,
          duration: 3000,
          camera: { x: 0, y: 0, zoom: 1.0 },
          activeElements: {},
        };
      }

      const id = typeof s.id === 'string' && s.id.trim() ? s.id.trim() : `scene-${String(idx + 1).padStart(2, '0')}`;
      const title =
        typeof s.title === 'string' && s.title.trim()
          ? s.title.trim()
          : typeof s.name === 'string' && s.name.trim()
            ? s.name.trim()
            : `Scene ${idx + 1}`;
      const duration = typeof s.duration === 'number' && s.duration > 0
        ? s.duration
        : typeof s.durationMs === 'number' && s.durationMs > 0
          ? s.durationMs
          : 3000;

      // 规范化相机参数 (-50 ~ 50, zoom 0.1 ~ 3.0)
      const rawCam = s.camera && typeof s.camera === 'object' ? s.camera : {};
      const cx = typeof rawCam.x === 'number' && !Number.isNaN(rawCam.x) ? Math.max(-50, Math.min(50, rawCam.x)) : 0;
      const cy = typeof rawCam.y === 'number' && !Number.isNaN(rawCam.y) ? Math.max(-50, Math.min(50, rawCam.y)) : 0;
      const czoom = typeof rawCam.zoom === 'number' && !Number.isNaN(rawCam.zoom) ? Math.max(0.1, Math.min(3.0, rawCam.zoom)) : 1.0;

      const normalizedScene: Record<string, any> = {
        ...s,
        id,
        title,
        duration,
        camera: {
          x: cx,
          y: cy,
          zoom: czoom,
        },
      };

      // 规范化 activeElements 并清理悬空 ID
      if (s.activeElements && typeof s.activeElements === 'object') {
        normalizedScene.activeElements = {
          boxes: Array.isArray(s.activeElements.boxes)
            ? s.activeElements.boxes.filter((bId: string) => boxIdSet.has(bId))
            : [],
          paths: Array.isArray(s.activeElements.paths)
            ? s.activeElements.paths.filter((pId: string) => validPathIdSet.has(pId))
            : [],
          dots: Array.isArray(s.activeElements.dots)
            ? s.activeElements.dots.filter((dId: string) => validDotIdSet.has(dId))
            : [],
          images: Array.isArray(s.activeElements.images)
            ? s.activeElements.images.filter((iId: string) => validImgIdSet.has(iId))
            : [],
        };
      } else {
        normalizedScene.activeElements = {};
      }

      return normalizedScene;
    });
  }

  // 6. 规范化 audio
  if (current.audio && typeof current.audio === 'object') {
    if (!Array.isArray(current.audio.tracks)) {
      current.audio.tracks = [];
    }
  }

  return current;
};
