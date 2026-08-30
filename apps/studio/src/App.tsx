import React, { useEffect, useRef, useState } from 'react';
import { FocusFlowPlayer } from '@focusflow/player';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Save, 
  Sparkles, 
  Sun, 
  Moon, 
  MousePointer, 
  Square, 
  GitCommit, 
  MessageSquare,
  Layers,
  Settings
} from 'lucide-react';
import '@focusflow/player/styles.css';

// Demo initial DSL for Studio mounting
const initialDSL: FocusFlowDSL = {
  meta: {
    title: 'FocusFlow Studio - 架构演示工作台',
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
    }
  ]
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<FocusFlowPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<'select' | 'box' | 'line' | 'callout'>('select');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = new FocusFlowPlayer({
      container: containerRef.current,
      dsl: initialDSL,
      debug: false,
      onSceneChange: (index: number) => {
        setCurrentSceneIndex(index);
      }
    });

    player.init().then(() => {
      playerRef.current = player;
    });

    return () => {
      player.destroy();
    };
  }, []);

  const togglePlay = () => {
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
    <div className={`flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none ${isDark ? 'dark' : ''}`}>
      {/* 1. 顶部操作栏 (TopBar) */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-wide text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>FocusFlow Studio</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
            Phase 2 Workbench
          </span>
          <span className="text-sm font-medium text-slate-300 ml-4 border-l border-slate-700 pl-4">
            {initialDSL.meta.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="p-2 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition"
            title="切换暗黑/明亮主题"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition text-slate-200">
            <Save className="w-3.5 h-3.5" />
            <span>保存草稿</span>
          </button>
          
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-md shadow-lg shadow-cyan-950 transition">
            <Download className="w-3.5 h-3.5" />
            <span>一键导出 HTML</span>
          </button>
        </div>
      </header>

      {/* 2. 主工作台三栏布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧浮动工具栏 (Left Toolbox) */}
        <aside className="w-14 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-4 gap-3 z-10">
          <button 
            onClick={() => setActiveTool('select')}
            className={`p-2.5 rounded-lg transition ${activeTool === 'select' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            title="抓手与选择工具"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveTool('box')}
            className={`p-2.5 rounded-lg transition ${activeTool === 'box' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            title="智能高亮选框 (Sobel 自动吸附)"
          >
            <Square className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveTool('line')}
            className={`p-2.5 rounded-lg transition ${activeTool === 'line' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            title="贝塞尔拓扑流光连线"
          >
            <GitCommit className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setActiveTool('callout')}
            className={`p-2.5 rounded-lg transition ${activeTool === 'callout' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            title="解说气泡与徽章"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </aside>

        {/* 中央画布视口 (Center Canvas mounting FocusFlowPlayer) */}
        <main className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          <div 
            ref={containerRef} 
            className="w-full h-full relative" 
            style={{ minHeight: '400px' }}
          />

          {/* 画布悬浮浮动控制器 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl z-20">
            <button onClick={handlePrev} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button onClick={togglePlay} className="p-2 bg-cyan-500 text-slate-950 rounded-full hover:bg-cyan-400 transition shadow-md shadow-cyan-500/20">
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button onClick={handleNext} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-slate-400 px-2 border-l border-slate-700">
              0{currentSceneIndex + 1} / 0{initialDSL.scenes.length}
            </span>
          </div>
        </main>

        {/* 右侧属性面板 (Right Inspector) */}
        <aside className="w-72 border-l border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-4 overflow-y-auto z-10">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-300 font-semibold text-xs uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>属性检查器 (Inspector)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">场景名称</label>
              <input 
                className="w-full bg-slate-800/80 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                defaultValue={initialDSL.scenes[0].title}
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">运镜缩放 (Zoom)</label>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                defaultValue="1.0"
                className="w-full accent-cyan-500 cursor-pointer" 
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-slate-300 font-semibold text-xs">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>激活图元</span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                  <input type="checkbox" defaultChecked className="accent-cyan-500 rounded" />
                  <span>微服务网关选框 (box-demo-1)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                  <input type="checkbox" defaultChecked className="accent-cyan-500 rounded" />
                  <span>解说气泡 (callout-1)</span>
                </label>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. 底部时间轴 (Bottom Timeline) */}
      <footer className="h-20 border-t border-slate-800 bg-slate-900/90 px-4 flex items-center gap-4 z-20">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">时间轴</span>
        <div className="flex items-center gap-2 overflow-x-auto flex-1 py-2">
          {initialDSL.scenes.map((scene, idx) => (
            <div 
              key={scene.id}
              onClick={() => {
                setCurrentSceneIndex(idx);
                playerRef.current?.goToScene(idx);
              }}
              className={`px-3 py-2 rounded-lg border text-xs cursor-pointer transition flex items-center gap-2 shrink-0 ${
                currentSceneIndex === idx 
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-medium shadow-md shadow-cyan-950' 
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${currentSceneIndex === idx ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'}`} />
              <span>{scene.title}</span>
              <span className="text-[10px] opacity-60 font-mono">1.2s</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
