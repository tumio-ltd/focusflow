import type { FocusFlowDSL } from '@focusflow/dsl';
import {
  focusflowProjectsControllerCreateProject,
  focusflowProjectsControllerDeleteProject,
  focusflowProjectsControllerDuplicateProject,
  focusflowProjectsControllerGetProject,
  focusflowProjectsControllerListProjects,
  focusflowProjectsControllerUpdateProject,
} from '@/api/generated/focusflow-projects/focusflow-projects';
import { getActiveWorkspaceId } from '@/api/custom-instance';
import type {
  IProjectRepository,
  ProjectMetaIndex,
  ProjectRecord,
} from './project-repository.interface';

/**
 * Mode-B Cloud REST Storage Adapter communicating with NestJS API using Orval React-Query / Axios SDK
 */
export class CloudRestStorageAdapter implements IProjectRepository {
  readonly storageType = 'cloud' as const;

  async listProjects(): Promise<ProjectMetaIndex[]> {
    try {
      const workspaceId = getActiveWorkspaceId() || undefined;
      const response = await focusflowProjectsControllerListProjects({
        workspaceId,
        limit: 100,
      });

      return (response.projects || []).map((item) => {
        const dsl = (item.dslJson || {}) as unknown as Partial<FocusFlowDSL>;
        return {
          id: item.id,
          title: item.title,
          createdAt: new Date(item.createdAt).getTime(),
          updatedAt: new Date(item.updatedAt).getTime(),
          sceneCount: dsl.scenes?.length || 0,
          thumbnail: item.bgImageUrl || undefined,
          isCloud: true,
          slug: item.slug,
          workspaceId: item.workspaceId,
          versionNo: item.versionNo,
        };
      });
    } catch (err) {
      console.error('[CloudRestStorageAdapter] Failed to list cloud projects:', err);
      throw err;
    }
  }

  async loadProject(id: string): Promise<ProjectRecord | null> {
    try {
      const project = await focusflowProjectsControllerGetProject(id);
      if (!project) return null;

      const dsl = (project.dslJson || {}) as unknown as FocusFlowDSL;

      return {
        id: project.id,
        title: project.title,
        createdAt: new Date(project.createdAt).getTime(),
        updatedAt: new Date(project.updatedAt).getTime(),
        sceneCount: dsl.scenes?.length || 0,
        thumbnail: project.bgImageUrl || undefined,
        isCloud: true,
        slug: project.slug,
        workspaceId: project.workspaceId,
        versionNo: project.versionNo,
        dsl,
      };
    } catch (err) {
      console.error(`[CloudRestStorageAdapter] Failed to load cloud project ${id}:`, err);
      return null;
    }
  }

  async saveProject(record: ProjectRecord): Promise<void> {
    try {
      // If project has a local draft ID format ('proj_...'), create it on the cloud first
      const isLocalDraftId = record.id.startsWith('proj_');

      if (!isLocalDraftId) {
        try {
          const updated = await focusflowProjectsControllerUpdateProject(record.id, {
            title: record.title,
            dslJson: record.dsl as unknown as Record<string, unknown>,
          });
          record.updatedAt = new Date(updated.updatedAt).getTime();
          record.versionNo = updated.versionNo;
          record.isCloud = true;
          return;
        } catch (err: any) {
          // If not found on cloud, fall through to create
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }

      // Create new project on cloud
      const workspaceId = record.workspaceId || getActiveWorkspaceId() || undefined;
      const created = await focusflowProjectsControllerCreateProject({
        title: record.title,
        workspaceId,
        dslJson: record.dsl as unknown as Record<string, unknown>,
      });

      record.id = created.id;
      record.title = created.title;
      record.slug = created.slug;
      record.workspaceId = created.workspaceId;
      record.versionNo = created.versionNo;
      record.createdAt = new Date(created.createdAt).getTime();
      record.updatedAt = new Date(created.updatedAt).getTime();
      record.isCloud = true;
    } catch (err) {
      console.error('[CloudRestStorageAdapter] Failed to save cloud project:', err);
      throw err;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await focusflowProjectsControllerDeleteProject(id);
    } catch (err) {
      console.error(`[CloudRestStorageAdapter] Failed to delete cloud project ${id}:`, err);
      throw err;
    }
  }

  async duplicateProject(id: string): Promise<string> {
    try {
      const existing = await this.loadProject(id);
      const title = existing ? `${existing.title} (副本)` : undefined;

      const duplicated = await focusflowProjectsControllerDuplicateProject(id, {
        title,
      });

      return duplicated.id;
    } catch (err) {
      console.error(`[CloudRestStorageAdapter] Failed to duplicate cloud project ${id}:`, err);
      throw err;
    }
  }

  async renameProject(id: string, newTitle: string): Promise<void> {
    try {
      await focusflowProjectsControllerUpdateProject(id, {
        title: newTitle,
      });
    } catch (err) {
      console.error(`[CloudRestStorageAdapter] Failed to rename cloud project ${id}:`, err);
      throw err;
    }
  }
}
