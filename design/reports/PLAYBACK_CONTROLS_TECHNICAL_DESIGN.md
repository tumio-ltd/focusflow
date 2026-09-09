# FocusFlow 统一演播控制组件 (PlaybackIsland) 开发设计规范文档 (TDD)

> **版本**：v1.0.0  
> **架构模式**：内核单源原生类 + Studio React 薄封装 (Vanilla Core + React Thin Wrapper)  
> **关联文档**：[`PLAYBACK_CONTROLS_PRODUCT_DESIGN.md`](file:///Users/xt/WebstormProjects/focusflow/design/reports/PLAYBACK_CONTROLS_PRODUCT_DESIGN.md)  
> **核心定位**：将 FocusFlow 全场景演播控制组件收敛为单一原生核心代码源，消除 Studio 与 Player 脱机内核的双重实现，无缝适配 Light / Dark 双主题。

---

## 1. 架构目标与工程分层 (Architecture & Layering)

### 1.1 架构核心思想
* **单一事实来源 (Single Source of Truth)**：演播控制胶囊的 DOM 骨架结构、CSS 样式规则、状态动画与微勋章逻辑，**100% 收敛于 `@focusflow/player` 内核包**中；
* **零运行时依赖 (Zero-Dependency Runtime)**：核心类 `PlaybackIsland` 采用纯标准 Web API（Vanilla JS DOM + CSS Custom Properties），不引入 React、Vue 或任何外部三方依赖，保障导出的单文件 HTML 极致轻量（< 50KB）；
* **React 优雅互通 (React Interop)**：在 `@focusflow/studio` 中提供极其轻薄的受控封装组件 `<PlaybackIslandReact />`，负责生命周期绑定与响应式状态转发。

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               @focusflow/player (内核层)                                  │
│                                                                                          │
│  ┌──────────────────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │ packages/player/src/ui/playback-island.js   │   │ packages/player/src/styles/     │  │
│  │ class PlaybackIsland (纯原生 DOM 状态机与渲染) │   │ focusflow.css (自适应双主题变量)│  │
│  └──────────────────────┬───────────────────────┘   └────────────────┬────────────────┘  │
└─────────────────────────┼────────────────────────────────────────────┼───────────────────┘
                          │ (原生引入)                                  │ (样式级联)
         ┌────────────────┴────────────────────────┐                   │
         ▼                                         ▼                   ▼
┌─────────────────────────────────┐   ┌────────────────────────────────────────────────────┐
│      单文件独立 HTML 导出       │   │             @focusflow/studio (应用层)             │
│   (FocusFlowPlayer 内部直调)    │   │                                                    │
│  * 离线双击秒开                 │   │  ┌──────────────────────────────────────────────┐  │
│  * 自动适配系统深浅色           │   │  │ apps/studio/src/components/playback/         │  │
│                                 │   │  │ PlaybackIslandReact.tsx (极薄包装组件 ~50行) │  │
│                                 │   │  └──────────────────────┬───────────────────────┘  │
│                                 │   │                         │                          │
│                                 │   │     ┌───────────────────┴───────────────────┐      │
│                                 │   │     ▼                                       ▼      │
│                                 │   │ ┌──────────────────────┐  ┌──────────────────────┐ │
│                                 │   │ │ AudienceModal.tsx    │  │ 60FPS 屏幕录制       │ │
│                                 │   │ │ (全屏演播大屏)       │  │ (胶囊常驻/创作者隔离)│ │
│                                 │   │ └──────────────────────┘  └──────────────────────┘ │
│                                 │   └────────────────────────────────────────────────────┘
```

---

## 2. 内核原生类设计 (`PlaybackIsland`)

### 2.1 模块位置与命名
* 源码路径：[`packages/player/src/ui/playback-island.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/ui/playback-island.js)
* 导出入口：[`packages/player/src/index.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/index.js) 与 [`packages/player/src/index.d.ts`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/index.d.ts)

### 2.2 TypeScript 接口定义 (Type Contract)

```typescript
export type PlaybackHudMode = 'full' | 'minimal' | 'zen';

export interface PlaybackIslandOptions {
  container?: HTMLElement;               // 挂载的目标父容器
  hudMode?: PlaybackHudMode;             // 初始 HUD 模式 (默认 'full')
  isRecording?: boolean;                 // 是否处于视频录制模式
  enableKeyboard?: boolean;              // 是否由该组件内部托管快捷键 (默认 false, Studio由外层统一调度)
  onTogglePlay?: () => void;             // 点击播放/暂停
  onPrev?: () => void;                   // 点击上一幕
  onNext?: () => void;                   // 点击下一幕
  onCycleHudMode?: () => void;           // 点击切换 HUD 三态
  onRestoreFull?: () => void;            // 点击沉浸态底部感应唤醒浮岛
}

export interface PlaybackIslandState {
  isPlaying: boolean;
  currentSceneIdx: number;
  totalScenes: number;
  currentSceneTitle: string;
  sceneElapsedMs: number;
  sceneDurationMs: number;
  hudMode: PlaybackHudMode;
  isRecording: boolean;
  isUserActive: boolean;
  elementCount?: number;
}
```

### 2.3 核心类方法与生命周期设计

```javascript
export class PlaybackIsland {
  constructor(options = {}) {
    this.options = options;
    this.state = {
      isPlaying: false,
      currentSceneIdx: 0,
      totalScenes: 1,
      currentSceneTitle: '',
      sceneElapsedMs: 0,
      sceneDurationMs: 0,
      hudMode: options.hudMode || 'full',
      isRecording: !!options.isRecording,
      isUserActive: true,
      elementCount: 0,
    };
    
    // DOM 元素缓存引用（避免每次查询与重绘）
    this.rootEl = null;
    this.fullIslandEl = null;
    this.minimalIslandEl = null;
    this.zenIslandEl = null;
    
    this.prevBtnEl = null;
    this.playBtnEl = null;
    this.nextBtnEl = null;
    this.scenePillEl = null;
    this.sceneIndexTextEl = null;
    this.sceneTitleTextEl = null;
    this.timerPillEl = null;
    this.timerTextEl = null;
    this.elementCountEl = null;
    this.hudToggleBtnEl = null;
    
    if (options.container) {
      this.mount(options.container);
    }
  }

  mount(container) { ... }                 // 构建初始 DOM 并绑定事件监听
  update(partialState) { ... }             // 高频增量细粒度渲染 (仅修改 textContent 与 classList)
  setHudMode(mode) { ... }                 // 切换 full / minimal / zen
  destroy() { ... }                        // 解绑事件、清理 DOM、释放引用
}
```

### 2.4 极致性能考量：零抖动增量渲染 (Fine-Grained DOM Updates)
在 60FPS 演播或走时状态下，`update()` 方法每秒可能被触发多次。
* **严禁行为**：严禁在 `update()` 中重新执行 `innerHTML = ...`，避免破坏 DOM 树并引发布局重排（Reflow）；
* **增量策略**：
  * 时间文本变化：仅更新 `this.timerTextEl.textContent = formattedTime`；
  * 分幕索引变化：仅更新 `this.sceneIndexTextEl.textContent = '02 / 05'` 与 `this.sceneTitleTextEl.textContent = title`；
  * 按钮禁用态：仅切换 `this.prevBtnEl.disabled = (idx === 0)`；
  * 显隐动效：通过切换 CSS 类名（`.ff-island-visible`、`.ff-island-hidden`）触发 GPU 合成层硬件加速过渡。

---

## 3. 双主题（Light / Dark）与样式规范系统

### 3.1 CSS Custom Properties 统一架构
在 [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css) 中新增独立命名空间 `--ff-island-*`：

```css
/* ==========================================================================
   Playback Island Unified Tokens
   ========================================================================== */

/* 1. 默认/浅色主题 (Light Mode): 匹配 Studio 浅色与白天阅读模式 */
:root, .light {
  --ff-island-bg: rgba(255, 255, 255, 0.88);
  --ff-island-border: rgba(0, 0, 0, 0.08);
  --ff-island-divider: rgba(0, 0, 0, 0.08);
  --ff-island-text: #0f172a;
  --ff-island-muted: #64748b;
  --ff-island-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  
  --ff-island-btn-hover: rgba(0, 0, 0, 0.05);
  --ff-island-play-bg: rgba(14, 165, 233, 0.12);
  --ff-island-play-border: rgba(14, 165, 233, 0.35);
  --ff-island-play-text: #0284c7;
  
  --ff-island-timer-bg: rgba(14, 165, 233, 0.08);
  --ff-island-timer-border: rgba(14, 165, 233, 0.20);
  --ff-island-timer-text: #0284c7;
}

/* 2. 深色主题 (Dark Mode): 匹配 Studio .dark 与暗夜极客模式 */
.dark, [data-theme="dark"] {
  --ff-island-bg: rgba(15, 23, 42, 0.90);
  --ff-island-border: rgba(255, 255, 255, 0.10);
  --ff-island-divider: rgba(255, 255, 255, 0.12);
  --ff-island-text: #f8fafc;
  --ff-island-muted: #94a3b8;
  --ff-island-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.70), 0 0 20px rgba(56, 189, 248, 0.10);
  
  --ff-island-btn-hover: rgba(255, 255, 255, 0.08);
  --ff-island-play-bg: rgba(56, 189, 248, 0.18);
  --ff-island-play-border: rgba(56, 189, 248, 0.40);
  --ff-island-play-text: #38bdf8;
  
  --ff-island-timer-bg: rgba(8, 47, 73, 0.60);
  --ff-island-timer-border: rgba(56, 189, 248, 0.20);
  --ff-island-timer-text: #38bdf8;
}

/* 3. 脱机单文件 HTML 自适应: 跟随终端操作系统偏好 */
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --ff-island-bg: rgba(15, 23, 42, 0.90);
    --ff-island-border: rgba(255, 255, 255, 0.10);
    --ff-island-divider: rgba(255, 255, 255, 0.12);
    --ff-island-text: #f8fafc;
    --ff-island-muted: #94a3b8;
    --ff-island-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.70), 0 0 20px rgba(56, 189, 248, 0.10);
    --ff-island-btn-hover: rgba(255, 255, 255, 0.08);
    --ff-island-play-bg: rgba(56, 189, 248, 0.18);
    --ff-island-play-border: rgba(56, 189, 248, 0.40);
    --ff-island-play-text: #38bdf8;
    --ff-island-timer-bg: rgba(8, 47, 73, 0.60);
    --ff-island-timer-border: rgba(56, 189, 248, 0.20);
    --ff-island-timer-text: #38bdf8;
  }
}
```

---

## 4. Studio React 薄包装组件设计 (`PlaybackIslandReact`)

### 4.1 组件设计与源码结构
* 路径：[`apps/studio/src/components/playback/PlaybackIslandReact.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/playback/PlaybackIslandReact.tsx)
* 特点：**零 DOM 重复定义，仅作为 React 状态和事件与原生实例间的网关胶水层**。

```tsx
import React, { useEffect, useRef } from 'react';
import { PlaybackIsland, type PlaybackHudMode } from '@focusflow/player';

export interface PlaybackIslandReactProps {
  isPlaying: boolean;
  currentSceneIdx: number;
  totalScenes: number;
  currentSceneTitle?: string;
  sceneElapsedMs: number;
  sceneDurationMs: number;
  hudMode: PlaybackHudMode;
  isRecording?: boolean;
  isUserActive?: boolean;
  elementCount?: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCycleHudMode?: () => void;
  onRestoreFull?: () => void;
}

export const PlaybackIslandReact: React.FC<PlaybackIslandReactProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const islandRef = useRef<PlaybackIsland | null>(null);

  // 1. 挂载阶段：实例化单一内核 PlaybackIsland
  useEffect(() => {
    if (!containerRef.current) return;

    const island = new PlaybackIsland({
      container: containerRef.current,
      hudMode: props.hudMode,
      isRecording: props.isRecording,
      onTogglePlay: props.onTogglePlay,
      onPrev: props.onPrev,
      onNext: props.onNext,
      onCycleHudMode: props.onCycleHudMode,
      onRestoreFull: props.onRestoreFull,
    });

    islandRef.current = island;

    return () => {
      island.destroy();
      islandRef.current = null;
    };
  }, []);

  // 2. 更新阶段：高频纳秒级响应状态变更 (增量推送)
  useEffect(() => {
    if (!islandRef.current) return;
    islandRef.current.update({
      isPlaying: props.isPlaying,
      currentSceneIdx: props.currentSceneIdx,
      totalScenes: props.totalScenes,
      currentSceneTitle: props.currentSceneTitle || '',
      sceneElapsedMs: props.sceneElapsedMs,
      sceneDurationMs: props.sceneDurationMs,
      hudMode: props.hudMode,
      isRecording: !!props.isRecording,
      isUserActive: props.isUserActive ?? true,
      elementCount: props.elementCount || 0,
    });
  }, [
    props.isPlaying,
    props.currentSceneIdx,
    props.totalScenes,
    props.currentSceneTitle,
    props.sceneElapsedMs,
    props.sceneDurationMs,
    props.hudMode,
    props.isRecording,
    props.isUserActive,
    props.elementCount,
  ]);

  return <div ref={containerRef} className="focusflow-island-react-portal pointer-events-none" />;
};
```

---

## 5. 宿主集成方案与代码瘦身 (Host Integrations)

### 5.1 `AudienceModal.tsx` 重构
* **瘦身前**：L401 ~ L560 包含 160 行复杂的内联 JSX 标签、图标导入、三态分支判断与时间逻辑；
* **瘦身后**：彻底清除内联 JSX，替换为纯净的一行声明：
  ```tsx
  <PlaybackIslandReact
    isPlaying={isPlaying}
    currentSceneIdx={currentSceneIdx}
    totalScenes={totalScenes}
    currentSceneTitle={currentScene?.title}
    sceneElapsedMs={sceneElapsedMs}
    sceneDurationMs={currentSceneDurationMs}
    hudMode={playbackHudMode}
    isRecording={isRecording}
    isUserActive={isUserActive}
    elementCount={(currentScene?.activeElements.boxes || []).length}
    onTogglePlay={handleTogglePlay}
    onPrev={handlePrev}
    onNext={handleNext}
    onCycleHudMode={cyclePlaybackHudMode}
    onRestoreFull={() => setPlaybackHudMode('full')}
  />
  ```

### 5.2 `FocusFlowPlayer` 内核集成
* 在 [`packages/player/src/core/player.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/core/player.js) 中：
  * 彻底移除原先的 `.ff-step-tabs`（粗糙横向长 Tab）；
  * 当 `this.showControls === true` 时，初始化内置的 `new PlaybackIsland({ container: this.stageEl, ... })`；
  * 单文件导出的脱机 HTML（`standalonePackager.ts`）自动拥有与 Studio 完全一致的居中高质感胶囊！

---

## 6. 任务分解 Checklist (Task Breakdown Checklist)

### 阶段一：Player 内核单源组件与样式研发 (Phase 1: Native Island Core)
- [ ] **1.1 编写原生组件模块**
  - 新建 [`packages/player/src/ui/playback-island.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/ui/playback-island.js)；
  - 实现 `mount`、`update`、`setHudMode`、`destroy` 方法；
  - 编写 SVG 矢量内置图标（Prev, Play, Pause, Next, Clock, Eye, EyeOff, Layers, Maximize2），实现 0 外部依赖；
- [ ] **1.2 注入双主题样式与动效**
  - 在 [`packages/player/src/styles/focusflow.css`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/styles/focusflow.css) 中实现 `.focusflow-island`、`minimal` 胶囊与 `zen` 底部唤醒感应带；
  - 配置 `:root` / `.dark` / `@media (prefers-color-scheme: dark)` 双主题 CSS Token；
- [ ] **1.3 导出与类型声明**
  - 在 [`packages/player/src/index.js`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/index.js) 导出 `PlaybackIsland`；
  - 在 [`packages/player/src/index.d.ts`](file:///Users/xt/WebstormProjects/focusflow/packages/player/src/index.d.ts) 补全 TypeScript 类型定义；
- [ ] **1.4 改造 `FocusFlowPlayer` 核心类**
  - 移除 `player.js` 中的旧版 `.ff-step-tabs` 结构；
  - 接入 `this.island = new PlaybackIsland(...)` 并与分幕状态机（`StateMachine`）事件联动；
- [ ] **1.5 构建与打包验证**
  - 执行 `pnpm --filter=@focusflow/player build` 验证 IIFE/ESM 构建正常，包体积保持 < 50KB。

---

### 阶段二：Studio React 薄包装与模态框集成 (Phase 2: Studio React Wrapper & Integration)
- [ ] **2.1 创建 React 包装层**
  - 新建 [`apps/studio/src/components/playback/PlaybackIslandReact.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/playback/PlaybackIslandReact.tsx)；
- [ ] **2.2 重构 AudienceModal**
  - 在 [`apps/studio/src/components/modals/AudienceModal.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/AudienceModal.tsx) 移除重复内联 JSX，接入 `<PlaybackIslandReact />`；
- [ ] **2.3 验证双主题响应 (Light & Dark Themes)**
  - 在 Studio 切换深色 / 浅色模式，检查控制岛是否在 1ms 内自动平滑变色。

---

### 阶段三：录制稳定性与脱机单文件 HTML 回归 (Phase 3: Parity & Clean Recording)
- [ ] **3.1 视频录制成片验证**
  - 验证 `isRecording: true` 时，MVP 控制胶囊稳定入片且无 3 秒自动淡出；
  - 验证录制成片中物理剔除关闭按钮与 Eye 切换按钮；
- [ ] **3.2 单文件 HTML 导出实测**
  - 导出单文件 HTML 并直接在浏览器双击打开；
  - 检查脱机状态下控制胶囊是否与 Studio 演播 1:1 像素级一致，且暂停时不显示时间。

---

### 阶段四：全量自动化测试与工程收尾 (Phase 4: Full E2E & Regression)
- [ ] **4.1 类型检查**
  - 运行 `pnpm typecheck` 确保全仓库 0 错误；
- [ ] **4.2 导出编译器 E2E 测试**
  - 运行 `pnpm --filter=@focusflow/studio test:e2e e2e/stage5-export-compiler.spec.ts`；
- [ ] **4.3 音频与无痕录制 E2E 测试**
  - 运行 `pnpm --filter=@focusflow/studio test:e2e e2e/stage5-audio-sync.spec.ts`；
- [ ] **4.4 文档归档与提交**
  - 验证两份设计文档完整保存于 `design/reports/` 并提交 Git。
