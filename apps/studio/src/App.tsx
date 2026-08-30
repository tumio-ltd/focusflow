import React, { useEffect, useRef, useState } from 'react';
import { FocusFlowPlayer } from '@focusflow/player';
import { 
  WorkbenchLayout, 
  TopBar, 
  LeftToolbox, 
  RightInspector, 
  BottomTimeline 
} from '@/components/layout';
import { InfiniteCanvas } from '@/components/canvas';
import { ImageUploadModal, ProjectManagerModal, TemplatesModal } from '@/components/modals';
import { useEditorStore, useProjectStore, useStorageStore } from '@/stores';
import type { ImageMeta } from '@/utils/imageDecoder';
import type { ArchitectureTemplate } from '@/templates';
import '@focusflow/player/styles.css';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zustand Store Hooks
  const { 
    activeTool, 
    setActiveTool, 
    activeSceneIndex, 
    setActiveSceneIndex, 
    isPlaying, 
    togglePlay 
  } = useEditorStore();

  const {
    dsl,
    isDirty,
    setDSL,
    ingestNewAsset,
    updateMetaTitle,
    updateSceneCamera,
    updateSceneTitle,
    addScene,
    duplicateScene,
    toggleElementInScene,
    deleteElement,
    markSaved,
  } = useProjectStore();

  const {
    currentProjectId,
    loadProjects,
    openProject,
    createProject,
    saveProject,
  } = useStorageStore();

  const activeScene = dsl.scenes[activeSceneIndex] || dsl.scenes[0];

  // 1. 初始化时从 IndexedDB 载入最近工程
  useEffect(() => {
    loadProjects().then(async () => {
      const storageState = useStorageStore.getState();
      if (storageState.currentProjectId) {
        const record = await openProject(storageState.currentProjectId);
        if (record?.dsl) {
          setDSL(record.dsl);
        }
      } else if (storageState.projectList.length === 0) {
        // 创建初始示范工程
        const currentDSL = useProjectStore.getState().dsl;
        const initialId = await createProject(currentDSL.meta.title, currentDSL);
        console.log('Initialized first local project:', initialId);
      }
    });
  }, [loadProjects, openProject, createProject, setDSL]);

  // 2. 500ms 防抖自动存盘至 IndexedDB
  useEffect(() => {
    if (!isDirty || !currentProjectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveProject(currentProjectId, dsl);
      markSaved();
      console.log('Auto-saved project to IndexedDB at', new Date().toLocaleTimeString());
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dsl, isDirty, currentProjectId, saveProject, markSaved]);

  // 3. Initialize FocusFlow Player
  useEffect(() => {
    if (!containerRef.current) return;

    const player = new FocusFlowPlayer({
      container: containerRef.current,
      dsl,
      debug: false,
      onSceneChange: (index: number) => {
        setActiveSceneIndex(index);
      },
    });

    player.init().then(() => {
      playerRef.current = player;
    });

    return () => {
      player.destroy();
    };
  }, [dsl, setActiveSceneIndex]);

  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    playerRef.current?.goToScene(index);
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    playerRef.current.togglePlay();
    togglePlay();
  };

  const handleNext = () => {
    if (activeSceneIndex < dsl.scenes.length - 1) {
      handleSelectScene(activeSceneIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeSceneIndex > 0) {
      handleSelectScene(activeSceneIndex - 1);
    }
  };

  const handleSaveDraft = async () => {
    if (currentProjectId) {
      await saveProject(currentProjectId, dsl);
      markSaved();
      alert('🎉 工程已实时存入本地 IndexedDB！');
    }
  };

  const handleExportHtml = () => {
    alert('📦 正在打包 FocusFlow 0 依赖单文件离线 HTML...');
  };

  const handleAssetImported = async (meta: ImageMeta) => {
    ingestNewAsset(meta);
    setActiveSceneIndex(0);

    // 立即新建并保存工程
    const newProjectId = await createProject(meta.fileName, useProjectStore.getState().dsl, meta.blob);
    console.log('Created project for imported asset:', newProjectId);
  };

  const handleOpenProjectById = async (id: string) => {
    const record = await openProject(id);
    if (record?.dsl) {
      setDSL(record.dsl);
      setActiveSceneIndex(0);
    }
  };

  const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
    setDSL(tpl.dsl);
    setActiveSceneIndex(0);

    // 创建对应的新工程
    const newProjectId = await createProject(tpl.title, tpl.dsl);
    console.log('Created project from template:', newProjectId);
  };

  // 提取当前场景图元信息用于 Inspector 展示
  const inspectorElements = [
    ...(dsl.elements.boxes || []).map((b) => ({
      id: b.id,
      type: 'box' as const,
      name: b.id,
      active: activeScene?.activeElements.boxes?.includes(b.id) || false,
    })),
    ...(dsl.elements.paths || []).map((p) => ({
      id: p.id,
      type: 'path' as const,
      name: p.id,
      active: activeScene?.activeElements.paths?.includes(p.id) || false,
    })),
  ];

  return (
    <>
      <WorkbenchLayout
        topBar={
          <TopBar
            title={dsl.meta.title}
            onTitleChange={updateMetaTitle}
            canUndo={true}
            canRedo={false}
            isSaved={!isDirty}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            onOpenProjects={() => setIsProjectsModalOpen(true)}
            onOpenImport={() => setIsUploadModalOpen(true)}
            onSave={handleSaveDraft}
            onExport={handleExportHtml}
          />
        }
        leftToolbox={
          <LeftToolbox
            activeTool={activeTool}
            onToolChange={setActiveTool}
          />
        }
        centerCanvas={
          <InfiniteCanvas
            contentWidth={dsl.meta.viewport.width}
            contentHeight={dsl.meta.viewport.height}
          >
            <div ref={containerRef} className="w-full h-full relative" />
          </InfiniteCanvas>
        }
        rightInspector={
          <RightInspector
            sceneTitle={activeScene?.title}
            onSceneTitleChange={(title) => updateSceneTitle(activeSceneIndex, title)}
            cameraZoom={activeScene?.camera.zoom}
            onCameraZoomChange={(zoom) => updateSceneCamera(activeSceneIndex, { zoom })}
            cameraDuration={activeScene?.camera.duration || 1.2}
            onCameraDurationChange={(duration) => updateSceneCamera(activeSceneIndex, { duration })}
            elements={inspectorElements}
            onToggleElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              toggleElementInScene(activeSceneIndex, isBox ? 'boxes' : 'paths', id);
            }}
            onDeleteElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              deleteElement(isBox ? 'boxes' : 'paths', id);
            }}
          />
        }
        bottomTimeline={
          <BottomTimeline
            scenes={dsl.scenes.map((s) => ({
              id: s.id,
              title: s.title,
              duration: s.camera.duration || 1.2,
              zoom: s.camera.zoom,
              boxCount: s.activeElements.boxes?.length || 0,
            }))}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={handleSelectScene}
            onAddScene={addScene}
            onDuplicateScene={duplicateScene}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        }
      />

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImport={handleAssetImported}
      />

      <ProjectManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        onSelectProject={handleOpenProjectById}
        onNewProject={() => setIsUploadModalOpen(true)}
      />

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />
    </>
  );
}
