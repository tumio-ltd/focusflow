import React, { useEffect, useRef, useState } from 'react';
import { FocusFlowPlayer } from '@focusflow/player';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  WorkbenchLayout, 
  TopBar, 
  LeftToolbox, 
  RightInspector, 
  BottomTimeline,
  ToolType 
} from '@/components/layout';
import '@focusflow/player/styles.css';

// Initial Mock DSL for Studio Development
const initialDSL: FocusFlowDSL = {
  meta: {
    title: '微服务电商架构演进演示',
    viewport: { width: 1920, height: 1080 },
    theme: { mode: 'dark' },
    controls: { showHUDButton: true }
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80'
  },
  elements: {
    boxes: [
      {
        id: 'box-demo-1',
        type: 'rect',
        x: 400,
        y: 300,
        width: 360,
        height: 180,
        rx: 12,
        ry: 12,
        style: { stroke: '#38bdf8', strokeWidth: 3, glow: true }
      },
      {
        id: 'box-demo-2',
        type: 'rect',
        x: 900,
        y: 300,
        width: 360,
        height: 180,
        rx: 12,
        ry: 12,
        style: { stroke: '#34d399', strokeWidth: 3, glow: true }
      }
    ],
    paths: []
  },
  scenes: [
    {
      id: 'scene-0',
      title: '01 全局总览架构',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-demo-1'],
        callouts: [
          {
            id: 'callout-1',
            targetBoxId: 'box-demo-1',
            position: { left: '420px', top: '240px' },
            theme: 'blue',
            title: '微服务网关集群',
            desc: '负责全局流量路由、鉴权与限流调度'
          }
        ]
      }
    },
    {
      id: 'scene-1',
      title: '02 订单微服务核心',
      camera: { zoom: 1.8, x: 15, y: -5, duration: 1.5 },
      activeElements: {
        boxes: ['box-demo-2'],
        callouts: [
          {
            id: 'callout-2',
            targetBoxId: 'box-demo-2',
            position: { left: '920px', top: '240px' },
            theme: 'green',
            title: '订单处理引擎',
            desc: '处理分布式事务与库存防超卖'
          }
        ]
      }
    }
  ]
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);

  // States
  const [projectTitle, setProjectTitle] = useState(initialDSL.meta.title);
  const [isDark, setIsDark] = useState(true);
  const [locale, setLocale] = useState<'zh' | 'en'>('zh');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(initialDSL.scenes[0].camera.zoom);
  const [cameraDuration, setCameraDuration] = useState(initialDSL.scenes[0].camera.duration || 1.2);

  // Initialize Player
  useEffect(() => {
    if (!containerRef.current) return;

    const player = new FocusFlowPlayer({
      container: containerRef.current,
      dsl: initialDSL,
      debug: false,
      onSceneChange: (index: number) => {
        setActiveSceneIndex(index);
        const scene = initialDSL.scenes[index];
        if (scene) {
          setCameraZoom(scene.camera.zoom);
          setCameraDuration(scene.camera.duration || 1.2);
        }
      }
    });

    player.init().then(() => {
      playerRef.current = player;
    });

    return () => {
      player.destroy();
    };
  }, []);

  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    playerRef.current?.goToScene(index);
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    playerRef.current.togglePlay();
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    playerRef.current?.next();
  };

  const handlePrev = () => {
    playerRef.current?.prev();
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <WorkbenchLayout
        topBar={
          <TopBar
            title={projectTitle}
            onTitleChange={setProjectTitle}
            isDark={isDark}
            onThemeToggle={() => setIsDark(!isDark)}
            locale={locale}
            onLocaleChange={setLocale}
            canUndo={true}
            canRedo={false}
            onSave={() => alert('草稿已成功保存至本地 IndexedDB！')}
            onExport={() => alert('正在打包生成独立离线 HTML...')}
          />
        }
        leftToolbox={
          <LeftToolbox
            activeTool={activeTool}
            onToolChange={setActiveTool}
          />
        }
        centerCanvas={
          <div ref={containerRef} className="w-full h-full relative" />
        }
        rightInspector={
          <RightInspector
            sceneTitle={initialDSL.scenes[activeSceneIndex]?.title}
            cameraZoom={cameraZoom}
            onCameraZoomChange={setCameraZoom}
            cameraDuration={cameraDuration}
            onCameraDurationChange={setCameraDuration}
          />
        }
        bottomTimeline={
          <BottomTimeline
            scenes={initialDSL.scenes.map((s) => ({
              id: s.id,
              title: s.title,
              duration: s.camera.duration || 1.2,
              zoom: s.camera.zoom,
              boxCount: s.activeElements.boxes?.length || 0,
            }))}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={handleSelectScene}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        }
      />
    </div>
  );
}
