import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FocusFlowPlayer } from '@focusflow/player';
import type { ElementBox, ElementPath, ElementDot, CalloutItem } from '@focusflow/dsl';
import { 
  WorkbenchLayout, 
  TopBar, 
  LeftToolbox, 
  RightInspector, 
  BottomTimeline 
} from '@/components/layout';
import { 
  InfiniteCanvas, 
  CanvasOverlay
} from '@/components/canvas';
import { 
  ImageUploadModal, 
  ProjectManagerModal, 
  TemplatesModal,
  AudienceModal,
  ExportModal
} from '@/components/modals';
import { useEditorStore, useProjectStore, useStorageStore } from '@/stores';
import { type ImageMeta, parseImageUrl } from '@/utils/imageDecoder';
import type { ArchitectureTemplate } from '@/templates';
import { captureCanvasToCamera } from '@/utils/cameraMath';
import { globalEdgeSnapper } from '@/utils/edgeSnapper';
import { useStudioKeyboard } from '@/hooks/useStudioKeyboard';
import '@focusflow/player/styles.css';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 视口变换与容器尺寸跟踪 (使用 useRef 隔离高频手势平移，避免触发根组件与侧边栏 Re-render)
  const canvasTransformRef = useRef({ scale: 1, x: 0, y: 0 });
  const containerRectRef = useRef({ width: 1920, height: 1080 });

  // Zustand Store Hooks (使用原子 Selector 独立订阅，禁止订阅高频 cursorCoords 状态)
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const activeSceneIndex = useEditorStore((s) => s.activeSceneIndex);
  const setActiveSceneIndex = useEditorStore((s) => s.setActiveSceneIndex);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const isSmartSnapEnabled = useEditorStore((s) => s.isSmartSnapEnabled);
  const toggleSmartSnap = useEditorStore((s) => s.toggleSmartSnap);
  const isCrosshairEnabled = useEditorStore((s) => s.isCrosshairEnabled);
  const toggleCrosshair = useEditorStore((s) => s.toggleCrosshair);

  const {
    dsl,
    isDirty,
    past,
    future,
    undo,
    redo,
    setDSL,
    ingestNewAsset,
    updateMetaTitle,
    updateSceneCamera,
    updateSceneTitle,
    addScene,
    duplicateScene,
    deleteScene,
    reorderScenes,
    addBox,
    addPath,
    addDot,
    addCallout,
    toggleElementInScene,
    inheritPreviousSceneElements,
    deleteElement,
    calibrateViewport,
    toggleShowPlayerControls,
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

    try {
      const player = new FocusFlowPlayer({
        container: containerRef.current,
        dsl,
        debug: false,
        disableCamera: true, // 编辑工作台内底图保持 1:1 绝对空间，运镜由 InfiniteCanvas 与 Frustum 取景框协同展现
        enableKeyboard: false, // 禁用内部全局按键监听，由 Studio 统一调度快捷键与抓手平移
        showControls: !!dsl.meta.controls?.showControls,
        onSceneChange: (index: number) => {
          setActiveSceneIndex(index);
        },
      });

      playerRef.current = player;
      // 预先缓存底图像素到 Sobel 空间分析器，并在底图载入时自动校准画布物理 Viewport (消除黑边与比例失真)
      if (player.imgEl) {
        const handleImageReady = () => {
          const natW = player.imgEl?.naturalWidth || 0;
          const natH = player.imgEl?.naturalHeight || 0;
          if (natW > 0 && natH > 0) {
            const currentViewport = useProjectStore.getState().dsl.meta.viewport;
            if (currentViewport.width !== natW || currentViewport.height !== natH) {
              console.log(
                `[FocusFlow] Auto-calibrating canvas viewport to image natural size: ${natW}×${natH} (was ${currentViewport.width}×${currentViewport.height})`
              );
              calibrateViewport({ width: natW, height: natH });
            }
            globalEdgeSnapper.setImageElement(player.imgEl!, natW, natH);
          }
        };

        if (player.imgEl.complete && player.imgEl.naturalWidth > 0) {
          handleImageReady();
        } else {
          player.imgEl.addEventListener('load', handleImageReady, { once: true });
        }
      }

      return () => {
        player.destroy();
        playerRef.current = null;
      };
    } catch (err) {
      console.warn('Player init warning:', err);
    }
  }, [dsl.asset?.url, currentProjectId, setActiveSceneIndex, calibrateViewport]);

  // 3.1 同步播放器独立控制栏显隐
  useEffect(() => {
    playerRef.current?.setShowControls(!!dsl.meta.controls?.showControls);
  }, [dsl.meta.controls?.showControls]);

  // 3.2 同步当前场景切换 (非自动演播状态下同步底图图元)
  useEffect(() => {
    if (!isPlaying) {
      playerRef.current?.goToStep(activeSceneIndex, false);
    }
  }, [activeSceneIndex, isPlaying]);

  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
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

    // 自动嗅探模板底图真实尺寸校准 Viewport
    if (tpl.dsl.asset?.url) {
      try {
        const meta = await parseImageUrl(tpl.dsl.asset.url, tpl.title);
        if (meta.width > 0 && meta.height > 0) {
          calibrateViewport({ width: meta.width, height: meta.height });
        }
      } catch (e) {
        console.warn('Template image parse error:', e);
      }
    }

    // 创建对应的新工程
    const newProjectId = await createProject(tpl.title, useProjectStore.getState().dsl);
    console.log('Created project from template:', newProjectId);
  };

  useStudioKeyboard({
    onExport: () => setIsExportModalOpen(true),
    onSave: handleSaveDraft,
    onPresent: () => setIsAudienceModalOpen(true),
    onOpenTemplates: () => setIsTemplatesModalOpen(true),
    onOpenProjects: () => setIsProjectsModalOpen(true),
    onOpenImport: () => setIsUploadModalOpen(true),
  });

  const handleCanvasTransformChange = useCallback(
    (transform: { scale: number; x: number; y: number }, rect: { width: number; height: number }) => {
      canvasTransformRef.current = transform;
      containerRectRef.current = rect;
    },
    []
  );

  // 一键捕获当前视口为当前场景摄像机参数
  const handleCaptureCurrentCamera = useCallback(() => {
    const newCamera = captureCanvasToCamera(
      canvasTransformRef.current,
      containerRectRef.current,
      dsl.meta.viewport.width,
      dsl.meta.viewport.height,
      activeScene?.camera.duration || 1.2
    );
    updateSceneCamera(activeSceneIndex, newCamera);
  }, [dsl.meta.viewport.width, dsl.meta.viewport.height, activeScene?.camera.duration, updateSceneCamera, activeSceneIndex]);

  const handleBoxCreated = (box: ElementBox) => {
    addBox(box, activeSceneIndex);
  };

  const handlePathCreated = (path: ElementPath) => {
    addPath(path, activeSceneIndex);
  };

  const handleDotCreated = (dot: ElementDot) => {
    addDot(dot, activeSceneIndex);
  };

  const handleCalloutCreated = (callout: CalloutItem) => {
    addCallout(callout, activeSceneIndex);
  };

  // 提取当前场景图元信息用于 Inspector 展示 (通过 useMemo 保持引用稳定，阻断侧边栏重绘)
  const inspectorElements = useMemo(
    () => [
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
      ...(dsl.elements.dots || []).map((d) => ({
        id: d.id,
        type: 'dot' as const,
        name: d.id,
        active: activeScene?.activeElements.dots?.includes(d.id) || false,
      })),
      ...(activeScene?.activeElements.callouts || []).map((c) => ({
        id: c.id,
        type: 'callout' as const,
        name: c.title || c.id,
        active: true,
      })),
    ],
    [dsl.elements, activeScene?.activeElements]
  );

  // 时间轴场景列表记忆化
  const timelineScenes = useMemo(
    () =>
      dsl.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        duration: s.camera.duration || 1.2,
        zoom: s.camera.zoom,
        boxCount: s.activeElements.boxes?.length || 0,
      })),
    [dsl.scenes]
  );

  return (
    <>
      <WorkbenchLayout
        topBar={
          <TopBar
            title={dsl.meta.title}
            onTitleChange={updateMetaTitle}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
            onUndo={undo}
            onRedo={redo}
            isSaved={!isDirty}
            showPlayerControls={!!dsl.meta.controls?.showControls}
            onTogglePlayerControls={toggleShowPlayerControls}
            onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            onOpenProjects={() => setIsProjectsModalOpen(true)}
            onOpenImport={() => setIsUploadModalOpen(true)}
            onOpenAudience={() => setIsAudienceModalOpen(true)}
            onSave={handleSaveDraft}
            onExport={() => setIsExportModalOpen(true)}
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
            onTransformChange={handleCanvasTransformChange}
          >
            <div className="w-full h-full relative">
              {/* 底层 FocusFlow 播放器挂载容器 */}
              <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-none" />

              {/* 统一交互标定绘制层 (选框 / 连线 / 脉冲圆点 / 解说气泡 / 取景框) */}
              <CanvasOverlay
                contentWidth={dsl.meta.viewport.width}
                contentHeight={dsl.meta.viewport.height}
                activeTool={activeTool}
                camera={{
                  zoom: activeScene?.camera.zoom || 1.0,
                  x: activeScene?.camera.x || 0,
                  y: activeScene?.camera.y || 0,
                  duration: activeScene?.camera.duration,
                }}
                boxes={dsl.elements.boxes || []}
                isPlaying={isPlaying}
                onCameraChange={(cam) => updateSceneCamera(activeSceneIndex, cam)}
                onBoxCreated={handleBoxCreated}
                onPathCreated={handlePathCreated}
                onDotCreated={handleDotCreated}
                onCalloutCreated={handleCalloutCreated}
              />
            </div>
          </InfiniteCanvas>
        }
        rightInspector={
          <RightInspector
            sceneTitle={activeScene?.title}
            onSceneTitleChange={(title) => updateSceneTitle(activeSceneIndex, title)}
            cameraZoom={activeScene?.camera.zoom}
            onCameraZoomChange={(zoom) => updateSceneCamera(activeSceneIndex, { zoom })}
            cameraX={activeScene?.camera.x ?? 0}
            onCameraXChange={(x) => updateSceneCamera(activeSceneIndex, { x })}
            cameraY={activeScene?.camera.y ?? 0}
            onCameraYChange={(y) => updateSceneCamera(activeSceneIndex, { y })}
            onCameraReset={() => updateSceneCamera(activeSceneIndex, { x: 0, y: 0 })}
            cameraDuration={activeScene?.camera.duration || 1.2}
            onCameraDurationChange={(duration) => updateSceneCamera(activeSceneIndex, { duration })}
            onCaptureCurrentCamera={handleCaptureCurrentCamera}
            canInherit={activeSceneIndex > 0}
            onInheritPreviousScene={() => inheritPreviousSceneElements(activeSceneIndex)}
            elements={inspectorElements}
            onToggleElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              const isPath = dsl.elements.paths?.some((p) => p.id === id);
              const isDot = dsl.elements.dots?.some((d) => d.id === id);
              const type = isBox ? 'boxes' : isPath ? 'paths' : isDot ? 'dots' : 'images';
              toggleElementInScene(activeSceneIndex, type, id);
            }}
            onDeleteElement={(id) => {
              const isBox = dsl.elements.boxes?.some((b) => b.id === id);
              const isPath = dsl.elements.paths?.some((p) => p.id === id);
              const isDot = dsl.elements.dots?.some((d) => d.id === id);
              const type = isBox ? 'boxes' : isPath ? 'paths' : isDot ? 'dots' : 'images';
              deleteElement(type, id);
            }}
            viewport={dsl.meta.viewport}
            isSmartSnapEnabled={isSmartSnapEnabled}
            onToggleSmartSnap={toggleSmartSnap}
            isCrosshairEnabled={isCrosshairEnabled}
            onToggleCrosshair={toggleCrosshair}
          />
        }
        bottomTimeline={
          <BottomTimeline
            scenes={timelineScenes}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={handleSelectScene}
            onAddScene={addScene}
            onDuplicateScene={duplicateScene}
            onDeleteScene={(idx) => {
              deleteScene(idx);
              if (activeSceneIndex >= dsl.scenes.length - 1) {
                setActiveSceneIndex(Math.max(0, dsl.scenes.length - 2));
              }
            }}
            onReorderScenes={(source, target) => {
              reorderScenes(source, target);
              setActiveSceneIndex(target);
            }}
            onUpdateSceneTitle={(idx, title) => updateSceneTitle(idx, title)}
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

      <AudienceModal
        isOpen={isAudienceModalOpen}
        onClose={() => setIsAudienceModalOpen(false)}
        dsl={dsl}
        initialSceneIndex={activeSceneIndex}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dsl={dsl}
      />
    </>
  );
}
