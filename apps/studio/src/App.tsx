import React, { useEffect, useRef } from 'react';
import { FocusFlowPlayer } from '@focusflow/player';
import { 
  WorkbenchLayout, 
  TopBar, 
  LeftToolbox, 
  RightInspector, 
  BottomTimeline 
} from '@/components/layout';
import { InfiniteCanvas } from '@/components/canvas';
import { useEditorStore, useProjectStore } from '@/stores';
import '@focusflow/player/styles.css';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);

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
    updateMetaTitle,
    updateSceneCamera,
    updateSceneTitle,
    addScene,
    duplicateScene,
    toggleElementInScene,
    deleteElement,
    markSaved,
  } = useProjectStore();

  const activeScene = dsl.scenes[activeSceneIndex] || dsl.scenes[0];

  // Initialize Player
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

  const handleSaveDraft = () => {
    markSaved();
    alert('🎉 草稿已成功同步并持久化至本地 IndexedDB！');
  };

  const handleExportHtml = () => {
    alert('📦 正在打包 FocusFlow 0 依赖单文件离线 HTML...');
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
    <WorkbenchLayout
      topBar={
        <TopBar
          title={dsl.meta.title}
          onTitleChange={updateMetaTitle}
          canUndo={true}
          canRedo={false}
          isSaved={!isDirty}
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
  );
}
