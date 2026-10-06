import axios from 'axios';
import {
  platformAssetsControllerConfirmUpload,
  platformAssetsControllerRequestPresignedUpload,
} from '@/api/generated/platform-assets/platform-assets';
import { RequestPresignedUploadDtoType } from '@/api/model/requestPresignedUploadDtoType';
import { getActiveWorkspaceId } from '@/api/custom-instance';
import { IndexedDbStorageAdapter } from './indexeddb-storage-adapter';
import { CloudRestStorageAdapter } from './cloud-rest-storage-adapter';
import type { ProjectRecord } from './project-repository.interface';

/**
 * Uploads a local Blob to cloud object storage using presigned URL workflow
 */
export async function uploadBlobToCloud(
  blob: Blob,
  filename: string,
  type: RequestPresignedUploadDtoType,
  workspaceId: string,
  projectId?: string,
): Promise<string> {
  const mimeType = blob.type || (type === RequestPresignedUploadDtoType.BACKGROUND_IMAGE ? 'image/png' : 'audio/webm');
  const sizeBytes = blob.size;

  // 1. Request presigned upload URL from Platform Assets API
  const presigned = await platformAssetsControllerRequestPresignedUpload({
    workspaceId,
    name: filename,
    mimeType,
    sizeBytes,
    type,
    projectId,
  });

  // 2. Direct binary transfer to S3 / Object Storage (bypassing main API)
  await axios.put(presigned.uploadUrl, blob, {
    headers: {
      'Content-Type': mimeType,
    },
    // Prevent default interceptors from adding Authorization header to third-party S3 URL
    transformRequest: [(data) => data],
  });

  // 3. Confirm asset upload with platform
  const confirmed = await platformAssetsControllerConfirmUpload({
    workspaceId,
    assetId: presigned.assetId,
  });

  return confirmed.publicUrl || presigned.publicUrl;
}

/**
 * WBS 8.4.3: Promotes a local Mode-A offline draft in IndexedDB to a fully cloud-hosted Mode-B Project
 * - Direct cloud upload of background image blob
 * - Direct cloud upload of audio narration blobs
 * - Replaces blob: URLs in DSL with permanent CDN/S3 URLs
 * - Persists structured DSL to cloud REST API
 */
export async function promoteLocalProjectToCloud(
  localProjectId: string,
  customWorkspaceId?: string,
): Promise<ProjectRecord> {
  const localAdapter = new IndexedDbStorageAdapter();
  const cloudAdapter = new CloudRestStorageAdapter();

  const record = await localAdapter.loadProject(localProjectId);
  if (!record) {
    throw new Error(`Local project with ID ${localProjectId} not found in IndexedDB`);
  }

  const workspaceId = customWorkspaceId || getActiveWorkspaceId();
  if (!workspaceId) {
    throw new Error('Active workspace context is required to promote project to cloud');
  }

  // 1. Upload background image if present
  let resolvedImageBlob = record.imageBlob;
  const assetUrl = record.dsl.asset?.url;
  if (!resolvedImageBlob && assetUrl?.startsWith('blob:')) {
    try {
      const resp = await fetch(assetUrl);
      if (resp.ok) {
        resolvedImageBlob = await resp.blob();
      }
    } catch (err) {
      console.warn('[CloudSync] Failed to fetch background blob url:', err);
    }
  }

  if (resolvedImageBlob && record.dsl.asset) {
    const cloudImageUrl = await uploadBlobToCloud(
      resolvedImageBlob,
      'backdrop-architecture.png',
      RequestPresignedUploadDtoType.BACKGROUND_IMAGE,
      workspaceId,
    );
    record.dsl.asset.url = cloudImageUrl;
    record.imageBlob = undefined;
  }

  // 2. Upload main audio track if present
  let resolvedAudioBlob = record.audioBlob;
  const mainAudioUrl = record.dsl.audio?.tracks?.[0]?.url;
  if (!resolvedAudioBlob && mainAudioUrl?.startsWith('blob:')) {
    try {
      const resp = await fetch(mainAudioUrl);
      if (resp.ok) {
        resolvedAudioBlob = await resp.blob();
      }
    } catch (err) {
      console.warn('[CloudSync] Failed to fetch main audio blob url:', err);
    }
  }

  if (resolvedAudioBlob && record.dsl.audio?.tracks?.[0]) {
    const cloudAudioUrl = await uploadBlobToCloud(
      resolvedAudioBlob,
      'main-narration.webm',
      RequestPresignedUploadDtoType.VOICEOVER_AUDIO,
      workspaceId,
    );
    record.dsl.audio.tracks[0].url = cloudAudioUrl;
    record.audioBlob = undefined;
  }

  // 3. Upload scene voiceover audio tracks if present
  if (record.dsl.scenes) {
    for (const scene of record.dsl.scenes) {
      let sceneBlob = record.sceneAudioBlobs?.[scene.id];
      const sceneAudioUrl = scene.voiceoverAudio?.url;
      if (!sceneBlob && sceneAudioUrl?.startsWith('blob:')) {
        try {
          const resp = await fetch(sceneAudioUrl);
          if (resp.ok) {
            sceneBlob = await resp.blob();
          }
        } catch (err) {
          console.warn(`[CloudSync] Failed to fetch scene ${scene.id} audio blob:`, err);
        }
      }

      if (sceneBlob && scene.voiceoverAudio) {
        const cloudSceneAudioUrl = await uploadBlobToCloud(
          sceneBlob,
          `scene-${scene.id}-voiceover.webm`,
          RequestPresignedUploadDtoType.VOICEOVER_AUDIO,
          workspaceId,
        );
        scene.voiceoverAudio.url = cloudSceneAudioUrl;
      }
    }
    record.sceneAudioBlobs = undefined;
  }

  // 4. Save to Cloud API
  record.workspaceId = workspaceId;
  await cloudAdapter.saveProject(record);

  return record;
}
