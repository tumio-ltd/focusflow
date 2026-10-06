import { create } from 'zustand';
import type { FocusFlowDSL } from '@focusflow/dsl';
import {
  type ProjectMetaIndex,
  type ProjectRecord,
  type StorageMode,
  getStorageRepository,
  getActiveStorageMode,
  setActiveStorageMode,
  getCurrentProjectId,
  setCurrentProjectId,
  promoteLocalProjectToCloud,
} from '@/services/storage';
import { setSceneAudioBlob, getSceneAudioBlob } from '@/services/audio';

export interface StorageState {
  currentProjectId: string | null;
  projectList: ProjectMetaIndex[];
  isSaving: boolean;
  isLoading: boolean;
  storageMode: StorageMode;

  // Actions
  setStorageMode: (mode: StorageMode) => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (title: string, dsl: FocusFlowDSL, imageBlob?: Blob, audioBlob?: Blob) => Promise<string>;
  openProject: (id: string) => Promise<ProjectRecord | null>;
  saveProject: (id: string, dsl: FocusFlowDSL, imageBlob?: Blob, audioBlob?: Blob) => Promise<void>;
  renameProject: (id: string, newTitle: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
  promoteToCloud: (id: string) => Promise<ProjectRecord>;
}

export const useStorageStore = create<StorageState>((set, get) => ({
  currentProjectId: null,
  projectList: [],
  isSaving: false,
  isLoading: false,
  storageMode: getActiveStorageMode(),

  setStorageMode: async (mode: StorageMode) => {
    setActiveStorageMode(mode);
    set({ storageMode: mode });
    await get().loadProjects();
  },

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const repo = getStorageRepository(get().storageMode);
      const list = await repo.listProjects();
      const currentId = await getCurrentProjectId();
      set({ projectList: list, currentProjectId: currentId });
    } catch (err) {
      console.error('[StorageStore] Failed to load projects:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (title, dsl, imageBlob, audioBlob) => {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    let resolvedAudioBlob = audioBlob;
    const mainAudioUrl = dsl.audio?.tracks?.[0]?.url;
    if (!resolvedAudioBlob && mainAudioUrl && mainAudioUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(mainAudioUrl);
        if (resp.ok) {
          resolvedAudioBlob = await resp.blob();
        }
      } catch {}
    }

    const resolvedSceneAudioBlobs: Record<string, Blob> = {};
    for (const scene of dsl.scenes) {
      if (scene.voiceoverAudio?.url) {
        const inMemoryBlob = getSceneAudioBlob(scene.id);
        if (inMemoryBlob) {
          resolvedSceneAudioBlobs[scene.id] = inMemoryBlob;
        } else if (scene.voiceoverAudio.url.startsWith('blob:')) {
          try {
            const resp = await fetch(scene.voiceoverAudio.url);
            if (resp.ok) {
              const b = await resp.blob();
              resolvedSceneAudioBlobs[scene.id] = b;
              setSceneAudioBlob(scene.id, b);
            }
          } catch {}
        }
      }
    }

    const record: ProjectRecord = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      sceneCount: dsl.scenes.length,
      dsl,
      imageBlob,
      audioBlob: resolvedAudioBlob,
      sceneAudioBlobs: resolvedSceneAudioBlobs,
      isCloud: get().storageMode === 'cloud',
    };

    const repo = getStorageRepository(get().storageMode);
    await repo.saveProject(record);
    await setCurrentProjectId(record.id);
    const list = await repo.listProjects();
    set({ currentProjectId: record.id, projectList: list });
    return record.id;
  },

  openProject: async (id) => {
    const repo = getStorageRepository(get().storageMode);
    let record = await repo.loadProject(id);

    // Fallback: If in cloud mode but project exists locally in IndexedDB, fetch from local
    if (!record && get().storageMode === 'cloud') {
      const localRepo = getStorageRepository('indexeddb');
      record = await localRepo.loadProject(id);
    }

    if (record) {
      // 关键会话保鲜机制：若工程包含持久化的底层二进制图片 (imageBlob)，自动在当前会话中重新生成有效的 ObjectURL
      if (record.imageBlob && record.dsl?.asset) {
        const freshUrl = URL.createObjectURL(record.imageBlob);
        record.dsl.asset.url = freshUrl;
      }
      // 关键会话保鲜机制：若工程包含持久化的音频解说 (audioBlob)，自动在当前会话中重新生成有效的 ObjectURL
      if (record.audioBlob && record.dsl?.audio?.tracks?.[0]) {
        const freshAudioUrl = URL.createObjectURL(record.audioBlob);
        record.dsl.audio.tracks[0].url = freshAudioUrl;
      } else if (!record.audioBlob && record.dsl?.audio?.tracks?.[0]?.url?.startsWith('blob:')) {
        record.dsl.audio.tracks[0].url = '';
      }

      // 🌟 关键会话保鲜机制：分幕独立专属音频 (sceneAudioBlobs) 深度重现
      if (record.dsl?.scenes) {
        for (const scene of record.dsl.scenes) {
          const sceneBlob = record.sceneAudioBlobs?.[scene.id];
          if (sceneBlob) {
            const freshSceneUrl = URL.createObjectURL(sceneBlob);
            if (scene.voiceoverAudio) {
              scene.voiceoverAudio.url = freshSceneUrl;
            } else {
              scene.voiceoverAudio = {
                url: freshSceneUrl,
                durationMs: scene.duration || 3800,
              };
            }
            setSceneAudioBlob(scene.id, sceneBlob);
          } else if (scene.voiceoverAudio?.url?.startsWith('blob:')) {
            // 安全防卫：如果历史工程中遗留了前次会话未持久化的死亡 blob: URL，安全置空防止抛出 ERR_FILE_NOT_FOUND
            console.warn(`[Storage] Expired session blob URL detected for scene "${scene.title}" without binary payload, resetting dead audio URL.`);
            scene.voiceoverAudio = undefined;
          }
        }
      }

      await setCurrentProjectId(id);
      set({ currentProjectId: id });
    }
    return record;
  },

  saveProject: async (id, dsl, imageBlob, audioBlob) => {
    set({ isSaving: true });
    try {
      const repo = getStorageRepository(get().storageMode);
      const existing = await repo.loadProject(id);
      const now = Date.now();

      // 智能提取待持久化的主音轨 audioBlob
      let resolvedAudioBlob = audioBlob || existing?.audioBlob;
      const mainAudioUrl = dsl.audio?.tracks?.[0]?.url;
      if (mainAudioUrl) {
        if (mainAudioUrl.startsWith('blob:')) {
          try {
            const resp = await fetch(mainAudioUrl);
            if (resp.ok) {
              resolvedAudioBlob = await resp.blob();
            }
          } catch {
            // Keep existing if fetch fails
          }
        }
      } else {
        resolvedAudioBlob = undefined;
      }

      // 🌟 智能提取各分幕专属待持久化的 sceneAudioBlobs
      const resolvedSceneAudioBlobs: Record<string, Blob> = {
        ...(existing?.sceneAudioBlobs || {}),
      };

      const currentSceneIds = new Set(dsl.scenes.map((s) => s.id));
      for (const sceneId of Object.keys(resolvedSceneAudioBlobs)) {
        if (!currentSceneIds.has(sceneId)) {
          delete resolvedSceneAudioBlobs[sceneId];
        }
      }

      for (const scene of dsl.scenes) {
        const audioUrl = scene.voiceoverAudio?.url;
        if (!audioUrl) {
          delete resolvedSceneAudioBlobs[scene.id];
          continue;
        }

        const cachedBlob = getSceneAudioBlob(scene.id);
        if (cachedBlob) {
          resolvedSceneAudioBlobs[scene.id] = cachedBlob;
          continue;
        }

        if (audioUrl.startsWith('blob:')) {
          try {
            const resp = await fetch(audioUrl);
            if (resp.ok) {
              const b = await resp.blob();
              resolvedSceneAudioBlobs[scene.id] = b;
              setSceneAudioBlob(scene.id, b);
            }
          } catch {
            // Keep existing
          }
        }
      }

      const record: ProjectRecord = {
        id,
        title: dsl.meta.title || existing?.title || '未命名工程',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        sceneCount: dsl.scenes.length,
        dsl,
        imageBlob: imageBlob || existing?.imageBlob,
        audioBlob: resolvedAudioBlob,
        sceneAudioBlobs: resolvedSceneAudioBlobs,
        thumbnail: existing?.thumbnail,
        isCloud: get().storageMode === 'cloud',
        workspaceId: existing?.workspaceId,
        slug: existing?.slug,
        versionNo: existing?.versionNo,
      };

      await repo.saveProject(record);
      const list = await repo.listProjects();
      set({ projectList: list });
    } finally {
      set({ isSaving: false });
    }
  },

  renameProject: async (id, newTitle) => {
    const repo = getStorageRepository(get().storageMode);
    await repo.renameProject(id, newTitle);
    const list = await repo.listProjects();
    set({ projectList: list });
  },

  duplicateProject: async (id) => {
    const repo = getStorageRepository(get().storageMode);
    const newId = await repo.duplicateProject(id);
    const list = await repo.listProjects();
    set({ projectList: list });
    return newId;
  },

  deleteProject: async (id) => {
    const repo = getStorageRepository(get().storageMode);
    await repo.deleteProject(id);
    const list = await repo.listProjects();
    const currentId = get().currentProjectId;
    const nextCurrentId = currentId === id ? (list[0]?.id || null) : currentId;
    if (nextCurrentId) {
      await setCurrentProjectId(nextCurrentId);
    }
    set({ projectList: list, currentProjectId: nextCurrentId });
  },

  promoteToCloud: async (id) => {
    const promotedRecord = await promoteLocalProjectToCloud(id);
    setActiveStorageMode('cloud');
    await setCurrentProjectId(promotedRecord.id);
    const cloudRepo = getStorageRepository('cloud');
    const list = await cloudRepo.listProjects();
    set({
      storageMode: 'cloud',
      currentProjectId: promotedRecord.id,
      projectList: list,
    });
    return promotedRecord;
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__STORAGE_STORE__ = useStorageStore;
}
