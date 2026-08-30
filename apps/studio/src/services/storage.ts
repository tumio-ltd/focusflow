import { get, set, del } from 'idb-keyval';
import type { FocusFlowDSL } from '@focusflow/dsl';

export interface ProjectMetaIndex {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sceneCount: number;
  thumbnail?: string;
}

export interface ProjectRecord extends ProjectMetaIndex {
  dsl: FocusFlowDSL;
  imageBlob?: Blob;
}

const INDEX_KEY = 'focusflow_project_index';
const CURRENT_ID_KEY = 'focusflow_current_project_id';
const PROJECT_PREFIX = 'focusflow_project_data_';

/**
 * 获取本地所有项目的元数据索引列表
 */
export async function getProjectIndex(): Promise<ProjectMetaIndex[]> {
  try {
    const list = await get<ProjectMetaIndex[]>(INDEX_KEY);
    return list || [];
  } catch (err) {
    console.error('Failed to get project index from IndexedDB:', err);
    return [];
  }
}

/**
 * 获取单个工程的完整记录 (含 DSL 及二进制底图)
 */
export async function getProjectRecord(id: string): Promise<ProjectRecord | null> {
  try {
    const record = await get<ProjectRecord>(`${PROJECT_PREFIX}${id}`);
    return record || null;
  } catch (err) {
    console.error(`Failed to get project record for id ${id}:`, err);
    return null;
  }
}

/**
 * 保存单个工程并自动更新元数据索引列表
 */
export async function saveProjectRecord(record: ProjectRecord): Promise<void> {
  try {
    // 1. 写入单个工程详情
    await set(`${PROJECT_PREFIX}${record.id}`, record);

    // 2. 更新元数据索引
    const index = await getProjectIndex();
    const existingIdx = index.findIndex((item) => item.id === record.id);
    const meta: ProjectMetaIndex = {
      id: record.id,
      title: record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      sceneCount: record.sceneCount,
      thumbnail: record.thumbnail,
    };

    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.unshift(meta);
    }

    await set(INDEX_KEY, index);
  } catch (err) {
    console.error('Failed to save project record to IndexedDB:', err);
    throw err;
  }
}

/**
 * 物理删除工程及其元数据索引
 */
export async function deleteProjectRecord(id: string): Promise<void> {
  try {
    await del(`${PROJECT_PREFIX}${id}`);
    const index = await getProjectIndex();
    const nextIndex = index.filter((item) => item.id !== id);
    await set(INDEX_KEY, nextIndex);
  } catch (err) {
    console.error(`Failed to delete project record ${id}:`, err);
    throw err;
  }
}

/**
 * 获取当前打开的工程 ID
 */
export async function getCurrentProjectId(): Promise<string | null> {
  try {
    const id = await get<string>(CURRENT_ID_KEY);
    return id || null;
  } catch {
    return null;
  }
}

/**
 * 设置当前打开的工程 ID
 */
export async function setCurrentProjectId(id: string): Promise<void> {
  try {
    await set(CURRENT_ID_KEY, id);
  } catch (err) {
    console.error('Failed to set current project id in IndexedDB:', err);
  }
}
