import { create } from 'zustand';
import type { 
  FocusFlowDSL, 
  SceneStep, 
  ElementBox, 
  ElementPath, 
  ElementDot, 
  ElementImage,
  CalloutItem,
  AudioTrackConfig,
  AudioMarker
} from '@focusflow/dsl';
import type { ImageMeta } from '@/utils/imageDecoder';

const MAX_HISTORY = 50;

const defaultInitialDSL: FocusFlowDSL = {
  meta: {
    title: '微服务电商架构演进演示',
    viewport: { width: 5120, height: 2880 },
    theme: { mode: 'dark' },
    controls: { showHUDButton: true, autoplay: false, interval: 3800, showControls: false }
  },
  asset: {
    url: '/01-system_architecture_dark.png'
  },
  elements: {
    boxes: [
      {
        id: 'box-gateway',
        type: 'rect',
        x: 350,
        y: 280,
        width: 380,
        height: 200,
        rx: 12,
        ry: 12,
        style: { stroke: '#38bdf8', strokeWidth: 3, glow: true }
      },
      {
        id: 'box-order',
        type: 'rect',
        x: 950,
        y: 280,
        width: 380,
        height: 200,
        rx: 12,
        ry: 12,
        style: { stroke: '#34d399', strokeWidth: 3, glow: true }
      }
    ],
    paths: [
      {
        id: 'path-gateway-order',
        from: 'box-gateway.right',
        to: 'box-order.left',
        style: { stroke: '#38bdf8', strokeWidth: 3, mode: 'stream', flowSpeed: 1.5 }
      }
    ],
    dots: [],
    images: []
  },
  scenes: [
    {
      id: 'scene-0',
      title: '01 全局微服务网关入口',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-gateway'],
        paths: [],
        callouts: [
          {
            id: 'callout-gateway',
            targetBoxId: 'box-gateway',
            position: { left: '380px', top: '210px' },
            theme: 'blue',
            title: '微服务网关集群',
            desc: '负责全站流量路由、动态鉴权、限流熔断与灰度分流'
          }
        ]
      }
    },
    {
      id: 'scene-1',
      title: '02 订单中心与分布式事务',
      camera: { zoom: 1.7, x: 16, y: -4, duration: 1.5 },
      activeElements: {
        boxes: ['box-order'],
        paths: ['path-gateway-order'],
        callouts: [
          {
            id: 'callout-order',
            targetBoxId: 'box-order',
            position: { left: '980px', top: '210px' },
            theme: 'green',
            title: '订单处理引擎',
            desc: '基于 Seata AT 模式保障高并发下单分布式事务最终一致性'
          }
        ]
      }
    }
  ]
};

export interface ProjectState {
  dsl: FocusFlowDSL;
  isDirty: boolean;
  past: FocusFlowDSL[];
  future: FocusFlowDSL[];

  // Actions
  setDSL: (dsl: FocusFlowDSL) => void;
  ingestNewAsset: (meta: ImageMeta) => void;
  updateMetaTitle: (title: string) => void;
  updateSceneCamera: (sceneIndex: number, camera: Partial<SceneStep['camera']>) => void;
  updateSceneTitle: (sceneIndex: number, title: string) => void;
  addScene: (initialCamera?: SceneStep['camera']) => void;
  insertScene: (index: number, initialCamera?: SceneStep['camera']) => void;
  reorderScenes: (sourceIndex: number, targetIndex: number) => void;
  duplicateScene: (index: number) => void;
  deleteScene: (index: number) => void;
  toggleElementInScene: (
    sceneIndex: number, 
    elementType: 'boxes' | 'paths' | 'dots' | 'images' | 'callouts', 
    elementId: string
  ) => void;
  inheritPreviousSceneElements: (targetSceneIndex: number) => void;
  addBox: (box: ElementBox, activeInSceneIndex?: number) => void;
  addPath: (path: ElementPath, activeInSceneIndex?: number) => void;
  addDot: (dot: ElementDot, activeInSceneIndex?: number) => void;
  addCallout: (callout: CalloutItem, activeInSceneIndex?: number) => void;
  addImage: (image: ElementImage, activeInSceneIndex?: number) => void;
  deleteElement: (elementType: 'boxes' | 'paths' | 'dots' | 'images' | 'callouts', elementId: string) => void;
  updateBoxBounds: (boxId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  updateDotPosition: (dotId: string, position: { cx: number; cy: number }) => void;
  updateCallout: (calloutId: string, updates: Partial<CalloutItem>) => void;
  updateImage: (imageId: string, updates: Partial<ElementImage>) => void;
  updatePathEndpoints: (pathId: string, endpoints: { from?: string; to?: string }) => void;
  updateElementStyle: (elementId: string, style: { stroke?: string; fill?: string; strokeWidth?: number; glow?: boolean; mode?: 'draw' | 'stream' | 'pulse'; speed?: number; flowSpeed?: number; rx?: number; r?: number; pulse?: boolean; borderRadius?: number; boxShadow?: boolean | string; border?: string; animation?: 'fade' | 'zoom-fade' | 'slide-up'; opacity?: number }) => void;
  calibrateViewport: (viewport: { width: number; height: number }) => void;
  toggleShowPlayerControls: () => void;
  updateSceneDuration: (sceneIndex: number, duration: number) => void;
  updateSceneVoiceoverScript: (sceneIndex: number, script: string) => void;
  setAudioTrack: (track: AudioTrackConfig) => void;
  removeAudioTrack: (trackId: string) => void;
  updateAudioTrackVolume: (volume: number) => void;
  addAudioMarker: (marker: AudioMarker) => void;
  batchUpdateScenesDuration: (durations: number[]) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
}

function pushHistory(state: ProjectState, nextDSL: FocusFlowDSL): Partial<ProjectState> {
  const currentSnapshot = JSON.parse(JSON.stringify(state.dsl));
  const past = [...state.past, currentSnapshot].slice(-MAX_HISTORY);
  return {
    past,
    future: [],
    dsl: nextDSL,
    isDirty: true,
  };
}

export const useProjectStore = create<ProjectState>((set) => ({
  dsl: defaultInitialDSL,
  isDirty: false,
  past: [],
  future: [],

  setDSL: (dsl) =>
    set((state) => pushHistory(state, dsl)),

  calibrateViewport: (viewport) =>
    set((state) => {
      const { width, height } = viewport;
      if (
        !width ||
        !height ||
        (state.dsl.meta.viewport.width === width && state.dsl.meta.viewport.height === height)
      ) {
        return state;
      }
      return {
        dsl: {
          ...state.dsl,
          meta: {
            ...state.dsl.meta,
            viewport: { width, height },
          },
        },
      };
    }),

  ingestNewAsset: (meta) =>
    set((state) => {
      const nextDSL: FocusFlowDSL = {
        meta: {
          title: meta.fileName || '全新架构演示项目',
          viewport: { width: meta.width, height: meta.height },
          theme: { mode: 'dark' },
          controls: { showHUDButton: true, autoplay: false, interval: 4000 },
        },
        asset: {
          url: meta.url,
        },
        elements: {
          boxes: [],
          paths: [],
          dots: [],
          images: [],
        },
        scenes: [
          {
            id: `scene-${Date.now()}`,
            title: '01 全局总览架构',
            camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
            activeElements: {
              boxes: [],
              paths: [],
              callouts: [],
            },
          },
        ],
      };
      return pushHistory(state, nextDSL);
    }),

  updateMetaTitle: (title) =>
    set((state) => {
      const nextDSL = {
        ...state.dsl,
        meta: {
          ...state.dsl.meta,
          title,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  toggleShowPlayerControls: () =>
    set((state) => {
      const currentShow = state.dsl.meta?.controls?.showControls ?? false;
      const nextDSL = {
        ...state.dsl,
        meta: {
          ...state.dsl.meta,
          controls: {
            ...(state.dsl.meta?.controls || {}),
            showControls: !currentShow,
          },
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updateSceneCamera: (sceneIndex, camera) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const target = scenes[sceneIndex];
      if (!target) return state;

      scenes[sceneIndex] = {
        ...target,
        camera: {
          ...target.camera,
          ...camera,
        },
      };

      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  updateSceneTitle: (sceneIndex, title) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const target = scenes[sceneIndex];
      if (!target) return state;

      scenes[sceneIndex] = { ...target, title };
      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  addScene: (initialCamera) =>
    set((state) => {
      const newIndex = state.dsl.scenes.length;
      const newScene: SceneStep = {
        id: `scene-${Date.now()}`,
        title: `${String(newIndex + 1).padStart(2, '0')} 新建场景`,
        camera: initialCamera ? { ...initialCamera } : { zoom: 1.2, x: 0, y: 0, duration: 1.2 },
        activeElements: {
          boxes: [],
          paths: [],
          callouts: [],
        },
      };
      const nextDSL = {
        ...state.dsl,
        scenes: [...state.dsl.scenes, newScene],
      };
      return pushHistory(state, nextDSL);
    }),

  insertScene: (index, initialCamera) =>
    set((state) => {
      const newScene: SceneStep = {
        id: `scene-${Date.now()}`,
        title: `${String(index + 1).padStart(2, '0')} 插入场景`,
        camera: initialCamera ? { ...initialCamera } : { zoom: 1.2, x: 0, y: 0, duration: 1.2 },
        activeElements: {
          boxes: [],
          paths: [],
          callouts: [],
        },
      };
      const scenes = [...state.dsl.scenes];
      scenes.splice(index, 0, newScene);
      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  reorderScenes: (sourceIndex, targetIndex) =>
    set((state) => {
      if (sourceIndex === targetIndex) return state;
      const scenes = [...state.dsl.scenes];
      const [moved] = scenes.splice(sourceIndex, 1);
      if (!moved) return state;
      scenes.splice(targetIndex, 0, moved);
      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  duplicateScene: (index) =>
    set((state) => {
      const target = state.dsl.scenes[index];
      if (!target) return state;

      const clonedScene: SceneStep = {
        ...JSON.parse(JSON.stringify(target)),
        id: `scene-${Date.now()}`,
        title: `${target.title} (副本)`,
      };

      const scenes = [...state.dsl.scenes];
      scenes.splice(index + 1, 0, clonedScene);

      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  deleteScene: (index) =>
    set((state) => {
      if (state.dsl.scenes.length <= 1) return state; // 至少保留 1 个场景
      const scenes = state.dsl.scenes.filter((_, idx) => idx !== index);
      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  toggleElementInScene: (sceneIndex, elementType, elementId) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const scene = scenes[sceneIndex];
      if (!scene) return state;

      if (elementType === 'callouts') {
        const callouts = scene.activeElements.callouts || [];
        const exists = callouts.some((c) => c.id === elementId);
        let nextCallouts;
        if (exists) {
          nextCallouts = callouts.filter((c) => c.id !== elementId);
        } else {
          const allCallouts = state.dsl.scenes.flatMap((s) => s.activeElements.callouts || []);
          const found = allCallouts.find((c) => c.id === elementId);
          nextCallouts = found ? [...callouts, found] : callouts;
        }
        scenes[sceneIndex] = {
          ...scene,
          activeElements: {
            ...scene.activeElements,
            callouts: nextCallouts,
          },
        };
        const nextDSL = { ...state.dsl, scenes };
        return pushHistory(state, nextDSL);
      }

      const activeList = scene.activeElements[elementType] || [];
      const nextActiveList = activeList.includes(elementId)
        ? activeList.filter((id) => id !== elementId)
        : [...activeList, elementId];

      scenes[sceneIndex] = {
        ...scene,
        activeElements: {
          ...scene.activeElements,
          [elementType]: nextActiveList,
        },
      };

      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  inheritPreviousSceneElements: (targetSceneIndex) =>
    set((state) => {
      if (targetSceneIndex <= 0) return state;
      const prevScene = state.dsl.scenes[targetSceneIndex - 1];
      const targetScene = state.dsl.scenes[targetSceneIndex];
      if (!prevScene || !targetScene) return state;

      const scenes = [...state.dsl.scenes];
      scenes[targetSceneIndex] = {
        ...targetScene,
        activeElements: JSON.parse(JSON.stringify(prevScene.activeElements)),
      };

      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  addBox: (box, activeInSceneIndex = 0) =>
    set((state) => {
      const boxes = [...(state.dsl.elements.boxes || []), box];
      const scenes = [...state.dsl.scenes];
      const targetScene = scenes[activeInSceneIndex];

      if (targetScene) {
        const currentBoxes = targetScene.activeElements.boxes || [];
        if (!currentBoxes.includes(box.id)) {
          scenes[activeInSceneIndex] = {
            ...targetScene,
            activeElements: {
              ...targetScene.activeElements,
              boxes: [...currentBoxes, box.id],
            },
          };
        }
      }

      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          boxes,
        },
        scenes,
      };
      return pushHistory(state, nextDSL);
    }),

  addPath: (path, activeInSceneIndex = 0) =>
    set((state) => {
      const paths = [...(state.dsl.elements.paths || []), path];
      const scenes = [...state.dsl.scenes];
      const targetScene = scenes[activeInSceneIndex];

      if (targetScene) {
        const currentPaths = targetScene.activeElements.paths || [];
        if (!currentPaths.includes(path.id)) {
          scenes[activeInSceneIndex] = {
            ...targetScene,
            activeElements: {
              ...targetScene.activeElements,
              paths: [...currentPaths, path.id],
            },
          };
        }
      }

      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          paths,
        },
        scenes,
      };
      return pushHistory(state, nextDSL);
    }),

  addDot: (dot, activeInSceneIndex = 0) =>
    set((state) => {
      const dots = [...(state.dsl.elements.dots || []), dot];
      const scenes = [...state.dsl.scenes];
      const targetScene = scenes[activeInSceneIndex];

      if (targetScene) {
        const currentDots = targetScene.activeElements.dots || [];
        if (!currentDots.includes(dot.id)) {
          scenes[activeInSceneIndex] = {
            ...targetScene,
            activeElements: {
              ...targetScene.activeElements,
              dots: [...currentDots, dot.id],
            },
          };
        }
      }

      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          dots,
        },
        scenes,
      };
      return pushHistory(state, nextDSL);
    }),

  addCallout: (callout, activeInSceneIndex = 0) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const targetScene = scenes[activeInSceneIndex];

      if (targetScene) {
        const currentCallouts = targetScene.activeElements.callouts || [];
        scenes[activeInSceneIndex] = {
          ...targetScene,
          activeElements: {
            ...targetScene.activeElements,
            callouts: [...currentCallouts, callout],
          },
        };
      }

      const nextDSL = {
        ...state.dsl,
        scenes,
      };
      return pushHistory(state, nextDSL);
    }),

  addImage: (image, activeInSceneIndex = 0) =>
    set((state) => {
      const images = [...(state.dsl.elements.images || []), image];
      const scenes = [...state.dsl.scenes];
      const targetScene = scenes[activeInSceneIndex];

      if (targetScene) {
        const currentImages = targetScene.activeElements.images || [];
        if (!currentImages.includes(image.id)) {
          scenes[activeInSceneIndex] = {
            ...targetScene,
            activeElements: {
              ...targetScene.activeElements,
              images: [...currentImages, image.id],
            },
          };
        }
      }

      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          images,
        },
        scenes,
      };
      return pushHistory(state, nextDSL);
    }),

  deleteElement: (elementType, elementId) =>
    set((state) => {
      const elements = { ...state.dsl.elements };
      if (elementType === 'boxes') {
        elements.boxes = elements.boxes?.filter((b: ElementBox) => b.id !== elementId) || [];
      } else if (elementType === 'paths') {
        elements.paths = elements.paths?.filter((p: ElementPath) => p.id !== elementId) || [];
      } else if (elementType === 'dots') {
        elements.dots = elements.dots?.filter((d: ElementDot) => d.id !== elementId) || [];
      } else if (elementType === 'images') {
        elements.images = elements.images?.filter((i: ElementImage) => i.id !== elementId) || [];
      }

      const scenes = state.dsl.scenes.map((s) => {
        if (elementType === 'callouts') {
          return {
            ...s,
            activeElements: {
              ...s.activeElements,
              callouts: s.activeElements.callouts?.filter((c) => c.id !== elementId) || [],
            },
          };
        }
        return {
          ...s,
          activeElements: {
            ...s.activeElements,
            [elementType]: s.activeElements[elementType]?.filter((id) => id !== elementId) || [],
          },
        };
      });

      const nextDSL = { ...state.dsl, elements, scenes };
      return pushHistory(state, nextDSL);
    }),

  updateBoxBounds: (boxId, bounds) =>
    set((state) => {
      const boxes = state.dsl.elements.boxes?.map((b: ElementBox) =>
        b.id === boxId
          ? {
              ...b,
              x: Math.round(bounds.x),
              y: Math.round(bounds.y),
              width: Math.round(bounds.width),
              height: Math.round(bounds.height),
            }
          : b
      ) || [];
      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          boxes,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updateDotPosition: (dotId, position) =>
    set((state) => {
      const dots = state.dsl.elements.dots?.map((d: ElementDot) =>
        d.id === dotId
          ? {
              ...d,
              cx: Math.round(position.cx),
              cy: Math.round(position.cy),
            }
          : d
      ) || [];
      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          dots,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updateCallout: (calloutId, updates) =>
    set((state) => {
      let modified = false;
      const scenes = state.dsl.scenes.map((s) => {
        if (!s.activeElements?.callouts) return s;
        const exists = s.activeElements.callouts.some((c) => c.id === calloutId);
        if (!exists) return s;
        modified = true;
        return {
          ...s,
          activeElements: {
            ...s.activeElements,
            callouts: s.activeElements.callouts.map((c) =>
              c.id === calloutId
                ? {
                    ...c,
                    ...updates,
                    position: updates.position
                      ? { ...c.position, ...updates.position }
                      : c.position,
                    style: updates.style
                      ? { ...(c.style || {}), ...updates.style }
                      : c.style,
                  }
                : c
            ),
          },
        };
      });

      if (!modified) return state;
      const nextDSL = { ...state.dsl, scenes };
      return pushHistory(state, nextDSL);
    }),

  updateImage: (imageId, updates) =>
    set((state) => {
      const images =
        state.dsl.elements.images?.map((img: ElementImage) =>
          img.id === imageId
            ? {
                ...img,
                ...updates,
                x: updates.x !== undefined ? Math.round(updates.x) : img.x,
                y: updates.y !== undefined ? Math.round(updates.y) : img.y,
                width: updates.width !== undefined ? Math.round(updates.width) : img.width,
                height: updates.height !== undefined ? Math.round(updates.height) : img.height,
                style: updates.style
                  ? { ...(img.style || {}), ...updates.style }
                  : img.style,
              }
            : img
        ) || [];

      const nextDSL = {
        ...state.dsl,
        elements: {
          ...state.dsl.elements,
          images,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updatePathEndpoints: (pathId, { from, to }) =>
    set((state) => {
      const elements = { ...state.dsl.elements };
      if (!elements.paths) return state;
      const paths = elements.paths.map((p: ElementPath) =>
        p.id === pathId
          ? {
              ...p,
              from: from !== undefined ? from : p.from,
              to: to !== undefined ? to : p.to,
            }
          : p
      );
      const nextDSL = {
        ...state.dsl,
        elements: {
          ...elements,
          paths,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updateElementStyle: (elementId, style) =>
    set((state) => {
      const elements = { ...state.dsl.elements };
      // 1. Check boxes
      if (elements.boxes?.some((b: ElementBox) => b.id === elementId)) {
        elements.boxes = elements.boxes.map((b: ElementBox) =>
          b.id === elementId ? { 
            ...b, 
            rx: style.rx !== undefined ? style.rx : b.rx,
            style: { ...(b.style || {}), ...style } 
          } : b
        );
      }
      // 2. Check paths
      if (elements.paths?.some((p: ElementPath) => p.id === elementId)) {
        elements.paths = elements.paths.map((p: ElementPath) =>
          p.id === elementId ? { ...p, style: { ...(p.style || {}), ...style } } : p
        );
      }
      // 3. Check dots
      if (elements.dots?.some((d: ElementDot) => d.id === elementId)) {
        elements.dots = elements.dots.map((d: ElementDot) =>
          d.id === elementId ? { 
            ...d, 
            r: style.r !== undefined ? style.r : d.r,
            style: { ...(d.style || {}), ...style } 
          } : d
        );
      }
      // 4. Check images
      if (elements.images?.some((img: ElementImage) => img.id === elementId)) {
        elements.images = elements.images.map((img: ElementImage) =>
          img.id === elementId ? { ...img, style: { ...(img.style || {}), ...style } } : img
        );
      }

      // 5. Check callouts
      let isCallout = false;
      const scenes = state.dsl.scenes.map((s) => {
        if (!s.activeElements?.callouts) return s;
        if (s.activeElements.callouts.some((c) => c.id === elementId)) {
          isCallout = true;
          return {
            ...s,
            activeElements: {
              ...s.activeElements,
              callouts: s.activeElements.callouts.map((c) => {
                if (c.id !== elementId) return c;
                const color = style.stroke || style.fill;
                let theme = c.theme;
                if (color) {
                  if (color.includes('38bdf8')) theme = 'blue';
                  else if (color.includes('34d399')) theme = 'green';
                  else if (color.includes('fbbf24')) theme = 'amber';
                  else if (color.includes('f472b6') || color.includes('f43f5e') || color.includes('ec4899')) theme = 'pink';
                  else if (color.includes('a855f7')) theme = 'purple';
                  else theme = color;
                }
                return { ...c, theme };
              }),
            },
          };
        }
        return s;
      });

      const nextDSL = { ...state.dsl, elements, ...(isCallout ? { scenes } : {}) };
      return pushHistory(state, nextDSL);
    }),

  updateSceneDuration: (sceneIndex: number, duration: number) =>
    set((state) => {
      if (sceneIndex < 0 || sceneIndex >= state.dsl.scenes.length) return state;
      const scenes = [...state.dsl.scenes];
      scenes[sceneIndex] = {
        ...scenes[sceneIndex],
        duration: Math.max(500, Math.round(duration)),
      };
      return pushHistory(state, { ...state.dsl, scenes });
    }),

  updateSceneVoiceoverScript: (sceneIndex: number, script: string) =>
    set((state) => {
      if (sceneIndex < 0 || sceneIndex >= state.dsl.scenes.length) return state;
      const scenes = [...state.dsl.scenes];
      scenes[sceneIndex] = {
        ...scenes[sceneIndex],
        voiceoverScript: script,
      };
      return pushHistory(state, { ...state.dsl, scenes });
    }),

  setAudioTrack: (track: AudioTrackConfig) =>
    set((state) => {
      const nextDSL: FocusFlowDSL = {
        ...state.dsl,
        audio: {
          ...state.dsl.audio,
          tracks: [track],
        },
      };
      return pushHistory(state, nextDSL);
    }),

  removeAudioTrack: (trackId: string) =>
    set((state) => {
      const currentTracks = state.dsl.audio?.tracks || [];
      const filtered = currentTracks.filter((t) => t.id !== trackId);
      const nextDSL: FocusFlowDSL = {
        ...state.dsl,
        audio: {
          ...state.dsl.audio,
          tracks: filtered,
        },
      };
      return pushHistory(state, nextDSL);
    }),

  updateAudioTrackVolume: (volume: number) =>
    set((state) => {
      const tracks = (state.dsl.audio?.tracks || []).map((t) => ({
        ...t,
        volume: Math.max(0, Math.min(1, volume)),
      }));
      return pushHistory(state, {
        ...state.dsl,
        audio: { ...state.dsl.audio, tracks },
      });
    }),

  addAudioMarker: (marker: AudioMarker) =>
    set((state) => {
      const tracks = (state.dsl.audio?.tracks || []).map((t, idx) => {
        if (idx === 0) {
          return {
            ...t,
            markers: [...(t.markers || []), marker],
          };
        }
        return t;
      });
      return pushHistory(state, {
        ...state.dsl,
        audio: { ...state.dsl.audio, tracks },
      });
    }),

  batchUpdateScenesDuration: (durations: number[]) =>
    set((state) => {
      const scenes = state.dsl.scenes.map((s, idx) => ({
        ...s,
        duration: durations[idx] !== undefined ? Math.max(500, Math.round(durations[idx])) : s.duration,
      }));
      return pushHistory(state, { ...state.dsl, scenes });
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const past = [...state.past];
      const previous = past.pop()!;
      const future = [JSON.parse(JSON.stringify(state.dsl)), ...state.future];
      return {
        past,
        future,
        dsl: previous,
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const future = [...state.future];
      const next = future.shift()!;
      const past = [...state.past, JSON.parse(JSON.stringify(state.dsl))].slice(-MAX_HISTORY);
      return {
        past,
        future,
        dsl: next,
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),
}));
