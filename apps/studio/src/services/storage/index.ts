import type {
  IProjectRepository,
  ProjectMetaIndex,
  ProjectRecord,
  StorageMode,
} from './project-repository.interface';
import { IndexedDbStorageAdapter } from './indexeddb-storage-adapter';
import { CloudRestStorageAdapter } from './cloud-rest-storage-adapter';

export * from './project-repository.interface';
export * from './indexeddb-storage-adapter';
export * from './cloud-rest-storage-adapter';
export * from './cloud-sync';

// Global active storage state
let activeMode: StorageMode = 'indexeddb';

export function getActiveStorageMode(): StorageMode {
  return activeMode;
}

export function setActiveStorageMode(mode: StorageMode): void {
  activeMode = mode;
}

export function getStorageRepository(mode: StorageMode = activeMode): IProjectRepository {
  if (mode === 'cloud') {
    return new CloudRestStorageAdapter();
  }
  return new IndexedDbStorageAdapter();
}

// -------------------------------------------------------------
// Backward-compatibility exports matching original storage.ts
// -------------------------------------------------------------
const localAdapter = new IndexedDbStorageAdapter();

export async function getProjectIndex(): Promise<ProjectMetaIndex[]> {
  return localAdapter.listProjects();
}

export async function getProjectRecord(id: string): Promise<ProjectRecord | null> {
  return localAdapter.loadProject(id);
}

export async function saveProjectRecord(record: ProjectRecord): Promise<void> {
  return localAdapter.saveProject(record);
}

export async function deleteProjectRecord(id: string): Promise<void> {
  return localAdapter.deleteProject(id);
}

export async function getCurrentProjectId(): Promise<string | null> {
  return localAdapter.getCurrentProjectId();
}

export async function setCurrentProjectId(id: string): Promise<void> {
  return localAdapter.setCurrentProjectId(id);
}
