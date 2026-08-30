import { create } from 'zustand';
import type { 
  FocusFlowDSL, 
  SceneStep, 
  ElementBox, 
  ElementPath, 
  ElementDot, 
  ElementImage 
} from '@focusflow/dsl';
import type { ImageMeta } from '@/utils/imageDecoder';

const defaultInitialDSL: FocusFlowDSL = {
  meta: {
    title: '微服务电商架构演进演示',
    viewport: { width: 1920, height: 1080 },
    theme: { mode: 'dark' },
    controls: { showHUDButton: true, autoplay: false, interval: 3800 }
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80'
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

  // Actions
  setDSL: (dsl: FocusFlowDSL) => void;
  ingestNewAsset: (meta: ImageMeta) => void;
  updateMetaTitle: (title: string) => void;
  updateSceneCamera: (sceneIndex: number, camera: Partial<SceneStep['camera']>) => void;
  updateSceneTitle: (sceneIndex: number, title: string) => void;
  addScene: () => void;
  duplicateScene: (index: number) => void;
  deleteScene: (index: number) => void;
  toggleElementInScene: (
    sceneIndex: number, 
    elementType: 'boxes' | 'paths' | 'dots' | 'images', 
    elementId: string
  ) => void;
  addBox: (box: ElementBox, activeInSceneIndex?: number) => void;
  addPath: (path: ElementPath, activeInSceneIndex?: number) => void;
  deleteElement: (elementType: 'boxes' | 'paths' | 'dots' | 'images', elementId: string) => void;
  markSaved: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  dsl: defaultInitialDSL,
  isDirty: false,

  setDSL: (dsl) => set({ dsl, isDirty: true }),

  ingestNewAsset: (meta) =>
    set({
      dsl: {
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
      },
      isDirty: true,
    }),

  updateMetaTitle: (title) =>
    set((state) => ({
      dsl: {
        ...state.dsl,
        meta: {
          ...state.dsl.meta,
          title,
        },
      },
      isDirty: true,
    })),

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

      return {
        dsl: { ...state.dsl, scenes },
        isDirty: true,
      };
    }),

  updateSceneTitle: (sceneIndex, title) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const target = scenes[sceneIndex];
      if (!target) return state;

      scenes[sceneIndex] = { ...target, title };
      return {
        dsl: { ...state.dsl, scenes },
        isDirty: true,
      };
    }),

  addScene: () =>
    set((state) => {
      const newIndex = state.dsl.scenes.length;
      const newScene: SceneStep = {
        id: `scene-${Date.now()}`,
        title: `${String(newIndex + 1).padStart(2, '0')} 新建场景`,
        camera: { zoom: 1.2, x: 0, y: 0, duration: 1.2 },
        activeElements: {
          boxes: [],
          paths: [],
          callouts: [],
        },
      };
      return {
        dsl: {
          ...state.dsl,
          scenes: [...state.dsl.scenes, newScene],
        },
        isDirty: true,
      };
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

      return {
        dsl: { ...state.dsl, scenes },
        isDirty: true,
      };
    }),

  deleteScene: (index) =>
    set((state) => {
      if (state.dsl.scenes.length <= 1) return state; // 至少保留 1 个场景
      const scenes = state.dsl.scenes.filter((_, idx) => idx !== index);
      return {
        dsl: { ...state.dsl, scenes },
        isDirty: true,
      };
    }),

  toggleElementInScene: (sceneIndex, elementType, elementId) =>
    set((state) => {
      const scenes = [...state.dsl.scenes];
      const scene = scenes[sceneIndex];
      if (!scene) return state;

      const activeList = scene.activeElements[elementType] || [];
      const isAlreadyActive = activeList.includes(elementId);

      const nextActiveList = isAlreadyActive
        ? activeList.filter((id) => id !== elementId)
        : [...activeList, elementId];

      scenes[sceneIndex] = {
        ...scene,
        activeElements: {
          ...scene.activeElements,
          [elementType]: nextActiveList,
        },
      };

      return {
        dsl: { ...state.dsl, scenes },
        isDirty: true,
      };
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

      return {
        dsl: {
          ...state.dsl,
          elements: {
            ...state.dsl.elements,
            boxes,
          },
          scenes,
        },
        isDirty: true,
      };
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

      return {
        dsl: {
          ...state.dsl,
          elements: {
            ...state.dsl.elements,
            paths,
          },
          scenes,
        },
        isDirty: true,
      };
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

      // 同时从所有场景中移除该图元引用
      const scenes = state.dsl.scenes.map((s) => ({
        ...s,
        activeElements: {
          ...s.activeElements,
          [elementType]: s.activeElements[elementType]?.filter((id) => id !== elementId) || [],
        },
      }));

      return {
        dsl: { ...state.dsl, elements, scenes },
        isDirty: true,
      };
    }),

  markSaved: () => set({ isDirty: false }),
}));
