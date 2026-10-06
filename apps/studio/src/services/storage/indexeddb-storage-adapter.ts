import { get, set, del } from 'idb-keyval';
import type {
  IProjectRepository,
  ProjectMetaIndex,
  ProjectRecord,
} from './project-repository.interface';

const INDEX_KEY = 'focusflow_project_index';
const CURRENT_ID_KEY = 'focusflow_current_project_id';
const PROJECT_PREFIX = 'focusflow_project_data_';

/**
 * Mode-A Offline Canvas Draft Storage Adapter using browser IndexedDB (idb-keyval)
 */
export class IndexedDbStorageAdapter implements IProjectRepository {
  readonly storageType = 'indexeddb' as const;

  async listProjects(): Promise<ProjectMetaIndex[]> {
    try {
      const list = await get<ProjectMetaIndex[]>(INDEX_KEY);
      return (list || []).map((item) => ({ ...item, isCloud: false }));
    } catch (err) {
      console.error('[IndexedDbStorageAdapter] Failed to get project index:', err);
      return [];
    }
  }

  async loadProject(id: string): Promise<ProjectRecord | null> {
    try {
      const record = await get<ProjectRecord>(`${PROJECT_PREFIX}${id}`);
      if (!record) return null;
      return { ...record, isCloud: false };
    } catch (err) {
      console.error(`[IndexedDbStorageAdapter] Failed to get project record for id ${id}:`, err);
      return null;
    }
  }

  async saveProject(record: ProjectRecord): Promise<void> {
    try {
      // 1. Persist project record
      await set(`${PROJECT_PREFIX}${record.id}`, { ...record, isCloud: false });

      // 2. Update index
      const index = await this.listProjects();
      const existingIdx = index.findIndex((item) => item.id === record.id);
      const meta: ProjectMetaIndex = {
        id: record.id,
        title: record.title,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        sceneCount: record.sceneCount,
        thumbnail: record.thumbnail,
        isCloud: false,
      };

      if (existingIdx >= 0) {
        index[existingIdx] = meta;
      } else {
        index.unshift(meta);
      }

      await set(INDEX_KEY, index);
    } catch (err) {
      console.error('[IndexedDbStorageAdapter] Failed to save project record:', err);
      throw err;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await del(`${PROJECT_PREFIX}${id}`);
      const index = await this.listProjects();
      const nextIndex = index.filter((item) => item.id !== id);
      await set(INDEX_KEY, nextIndex);
    } catch (err) {
      console.error(`[IndexedDbStorageAdapter] Failed to delete project record ${id}:`, err);
      throw err;
    }
  }

  async duplicateProject(id: string): Promise<string> {
    const target = await this.loadProject(id);
    if (!target) throw new Error('Target project not found in local IndexedDB');

    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const newRecord: ProjectRecord = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      title: `${target.title} (副本)`,
      createdAt: now,
      updatedAt: now,
      imageBlob: target.imageBlob,
      audioBlob: target.audioBlob,
      sceneAudioBlobs: target.sceneAudioBlobs ? { ...target.sceneAudioBlobs } : undefined,
      isCloud: false,
    };
    newRecord.dsl.meta.title = newRecord.title;

    await this.saveProject(newRecord);
    return newId;
  }

  async renameProject(id: string, newTitle: string): Promise<void> {
    const existing = await this.loadProject(id);
    if (!existing) return;

    existing.title = newTitle;
    existing.dsl.meta.title = newTitle;
    existing.updatedAt = Date.now();

    await this.saveProject(existing);
  }

  // Active session helper functions
  async getCurrentProjectId(): Promise<string | null> {
    try {
      const id = await get<string>(CURRENT_ID_KEY);
      return id || null;
    } catch {
      return null;
    }
  }

  async setCurrentProjectId(id: string): Promise<void> {
    try {
      await set(CURRENT_ID_KEY, id);
    } catch (err) {
      console.error('[IndexedDbStorageAdapter] Failed to set current project id:', err);
    }
  }
}
