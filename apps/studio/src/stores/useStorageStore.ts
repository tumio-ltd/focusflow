import { create } from 'zustand';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  getProjectIndex, 
  getProjectRecord, 
  saveProjectRecord, 
  deleteProjectRecord, 
  getCurrentProjectId, 
  setCurrentProjectId,
  ProjectMetaIndex, 
  ProjectRecord 
} from '@/services/storage';

export interface StorageState {
  currentProjectId: string | null;
  projectList: ProjectMetaIndex[];
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (title: string, dsl: FocusFlowDSL, imageBlob?: Blob, audioBlob?: Blob) => Promise<string>;
  openProject: (id: string) => Promise<ProjectRecord | null>;
  saveProject: (id: string, dsl: FocusFlowDSL, imageBlob?: Blob, audioBlob?: Blob) => Promise<void>;
  renameProject: (id: string, newTitle: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;
  deleteProject: (id: string) => Promise<void>;
}

export const useStorageStore = create<StorageState>((set, get) => ({
  currentProjectId: null,
  projectList: [],
  isSaving: false,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const list = await getProjectIndex();
      const currentId = await getCurrentProjectId();
      set({ projectList: list, currentProjectId: currentId });
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

    const record: ProjectRecord = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      sceneCount: dsl.scenes.length,
      dsl,
      imageBlob,
      audioBlob: resolvedAudioBlob,
    };

    await saveProjectRecord(record);
    await setCurrentProjectId(id);
    const list = await getProjectIndex();
    set({ currentProjectId: id, projectList: list });
    return id;
  },

  openProject: async (id) => {
    const record = await getProjectRecord(id);
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
      }
      await setCurrentProjectId(id);
      set({ currentProjectId: id });
    }
    return record;
  },

  saveProject: async (id, dsl, imageBlob, audioBlob) => {
    set({ isSaving: true });
    try {
      const existing = await getProjectRecord(id);
      const now = Date.now();

      // 智能提取待持久化的 audioBlob
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
        // Track was removed
        resolvedAudioBlob = undefined;
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
        thumbnail: existing?.thumbnail,
      };

      await saveProjectRecord(record);
      const list = await getProjectIndex();
      set({ projectList: list });
    } finally {
      set({ isSaving: false });
    }
  },

  renameProject: async (id, newTitle) => {
    const existing = await getProjectRecord(id);
    if (!existing) return;

    existing.title = newTitle;
    existing.dsl.meta.title = newTitle;
    existing.updatedAt = Date.now();

    await saveProjectRecord(existing);
    const list = await getProjectIndex();
    set({ projectList: list });
  },

  duplicateProject: async (id) => {
    const target = await getProjectRecord(id);
    if (!target) throw new Error('Target project not found');

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const newRecord: ProjectRecord = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      title: `${target.title} (副本)`,
      createdAt: now,
      updatedAt: now,
      imageBlob: target.imageBlob,
    };
    newRecord.dsl.meta.title = newRecord.title;
    if (newRecord.imageBlob && newRecord.dsl?.asset) {
      newRecord.dsl.asset.url = URL.createObjectURL(newRecord.imageBlob);
    }

    await saveProjectRecord(newRecord);
    const list = await getProjectIndex();
    set({ projectList: list });
    return newId;
  },

  deleteProject: async (id) => {
    await deleteProjectRecord(id);
    const list = await getProjectIndex();
    const currentId = get().currentProjectId;
    const nextCurrentId = currentId === id ? (list[0]?.id || null) : currentId;
    if (nextCurrentId) {
      await setCurrentProjectId(nextCurrentId);
    }
    set({ projectList: list, currentProjectId: nextCurrentId });
  },
}));
