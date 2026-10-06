import type { FocusFlowDSL } from '@focusflow/dsl';

export type StorageMode = 'indexeddb' | 'cloud';

export interface ProjectMetaIndex {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sceneCount: number;
  thumbnail?: string;
  // Cloud Mode metadata extensions
  isCloud?: boolean;
  slug?: string;
  workspaceId?: string;
  versionNo?: number;
}

export interface ProjectRecord extends ProjectMetaIndex {
  dsl: FocusFlowDSL;
  imageBlob?: Blob;
  audioBlob?: Blob;
  sceneAudioBlobs?: Record<string, Blob>;
}

export interface IProjectRepository {
  readonly storageType: StorageMode;
  listProjects(): Promise<ProjectMetaIndex[]>;
  loadProject(id: string): Promise<ProjectRecord | null>;
  saveProject(record: ProjectRecord): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string): Promise<string>;
  renameProject(id: string, newTitle: string): Promise<void>;
}
