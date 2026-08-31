# FocusFlow Studio 数字工艺级视觉与交互设计规范 (Linear-Grade Craftsmanship Design Spec)

> **设计愿景**：将 FocusFlow Studio 从“功能完备的架构演播工作台”进一步升维至“具备顶尖数字工艺感（Digital Craftsmanship）的专业级创作软件”，深度对标 **Linear.app** 的拟物物理微光、四级暗黑景深色阶、次像素精雕排版与轻量弹性微交互。

---

## 目录 (Table of Contents)
- [1. 设计哲学与核心原则](#1-设计哲学与核心原则)
- [2. 模块一：拟物物理微光与双层阴影系统 (Keycap Inset Highlight)](#2-模块一拟物物理微光与双层阴影系统-keycap-inset-highlight)
- [3. 模块二：四级暗黑景深色阶与毛玻璃层级 (4-Tier Surface Elevation Hierarchy)](#3-模块二四级暗黑景深色阶与毛玻璃层级-4-tier-surface-elevation-hierarchy)
- [4. 模块三：全局排版与次像素精密渲染 (Typography & Crisp Antialiasing)](#4-模块三全局排版与次像素精密渲染-typography--crisp-antialiasing)
- [5. 模块四：弹性物理微交互与动力学曲线 (Spring Micro-Motion)](#5-模块四弹性物理微交互与动力学曲线-spring-micro-motion)
- [6. 模块五：微雕实体快捷键键帽组件 (Kbd Physical Keycaps)](#6-模块五微雕实体快捷键键帽组件-kbd-physical-keycaps)
- [7. 分阶段落地路线图与验收清单 (Phased Implementation Roadmap)](#7-分阶段落地路线图与验收清单-phased-implementation-roadmap)

---

## 1. 设计哲学与核心原则

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Linear-Grade Craftsmanship 4 大支柱                             │
├────────────────────────────┬────────────────────────────┬──────────────────────────────┤
│ 1. 0 刺眼硬边，靠面层与微光 │ 2. 物理拟物顶光 (Bevel)     │ 3. 严格四级暗黑景深色阶       │
│ 绝不使用高反差 1px 亮线框  │ 1px 顶部内嵌反射光模拟键帽 │ 画布 ➔ 容器 ➔ 卡片 ➔ 浮动层  │
├────────────────────────────┼────────────────────────────┼──────────────────────────────┤
│ 4. 雕刻级次像素抗锯齿排版  │ 5. 快速弹性贝塞尔微动效    │ 6. 微雕快捷键实体物理键帽    │
│ 微负字距 + 等宽数值无抖动  │ cubic-bezier(0.16,1,0.3,1) │ Kbd 键帽赋予明确键盘心智     │
└────────────────────────────┴────────────────────────────┴──────────────────────────────┘
```

1. **去硬边化（Zero Harsh Outlines）**：在深色背景下，界面依靠微弱透明面层（Alpha Fill）与顶边微光界定层级，彻底剔除 100% 不透明的白色/亮色硬轮廓线。
2. **物理光照一致性（Unified Optical Lighting）**：全站模拟自上而下 45° 的平行漫反射环境光，按键与卡片顶部呈现 1px 入射高光，底部呈现柔和闭塞阴影。
3. **数字工艺感（Digital Precision）**：数字、时长、坐标等动态数据统一采用等宽排版，文本采用微负字间距，呈现如瑞士钟表刻度般的严密感。

---

## 2. 模块一：拟物物理微光与双层阴影系统 (Keycap Inset Highlight)

### 2.1 物理光学原理
当环境光线打在微微隆起的物理按键上时，按键上表面斜切边缘（Top Bevel）会反射出一条微细亮线，而按键下表面则会投影出极微弱的接触阴影。Linear 的核心质感正来源于此。

```
                    45° 入射漫反射光线
                           ↓ ↓ ↓
       ┌────────────────────────────────────────────────────────────┐ ← 1px 顶光: inset 0 1px 0 0 rgba(255,255,255,0.08)
       │  [Icon 14px]  模板中心 (12px font-medium)                   │   (表面底色: bg-muted/40)
       └────────────────────────────────────────────────────────────┘
         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ← 底部微阴影: 0 1px 2px rgba(0,0,0,0.4)
```

### 2.2 Token 与 Tailwind 扩展规范

```css
/* packages/config-tailwind/tailwind.config.js 中扩展 boxShadow */
boxShadow: {
  /* 常规暗黑微面层按键 (Secondary / Outline) */
  'keycap': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.35)',
  'keycap-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 2px 6px 0 rgba(0, 0, 0, 0.45)',
  'keycap-active': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  
  /* 品牌高饱和 CTA 按键 (导出独立 HTML / 核心确认) */
  'keycap-cyan': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.35), 0 4px 14px 0 rgba(56, 189, 248, 0.25)',
  'keycap-cyan-hover': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.45), 0 6px 20px 0 rgba(56, 189, 248, 0.35)',
  
  /* 模态弹窗与浮动面板多阶扩散柔影 */
  'elevation-modal': '0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06)',
  'elevation-dropdown': '0 12px 28px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
}
```

---

## 3. 模块二：四级暗黑景深色阶与毛玻璃层级 (4-Tier Surface Elevation Hierarchy)

### 3.1 空间层级模型与色阶矩阵

```
  【层级 L3】浮动模态弹窗 / 快捷视口胶囊 (#111827 + elevation-modal + blur 24px)
       ▲
  【层级 L2】交互控件 / 场景卡片 / 图层列表项 (bg-muted/40 + shadow-keycap)
       ▲
  【层级 L1】工作台固定外壳: TopBar / Toolbox / Inspector / Timeline (#0b0f19 + blur 16px)
       ▲
  【层级 L0】最深沉底视口画布 Canvas (#04060a)
```

| 空间层级 | 语义角色 | RGB 通道 / Hex | 毛玻璃与环境阴影 | 应用界面元素 |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0 (Canvas)** | 最深画布底色 | `4 6 10` (`#04060a`) | 0 Blur，纯粹黑 | 视口点阵网格底层、全屏演播底衬 |
| **Level 1 (Dock & Shelves)** | 固定容器外壳 | `11 15 25` (`#0b0f19`) | `backdrop-blur: 16px`, `border-b border-border/40` | TopBar, LeftToolbox, RightInspector, BottomTimeline |
| **Level 2 (Surface Elements)** | 界面面层与卡片 | `30 41 59 / 0.4` | `shadow-keycap`, `hover:shadow-keycap-hover` | 导航按钮, 时间轴场景卡片, 检查器图层项, 搜索输入框 |
| **Level 3 (Elevated Modals)** | 浮动层与模态弹窗 | `17 24 39` (`#111827`) | `shadow-elevation-modal`, `backdrop-blur: 24px` | 模板中心, 工程列表, 资产导入, 导出中心, 画布快捷缩放胶囊 |

### 3.2 电影级模态弹窗遮罩 (Cinematic Scrim)
- **旧版**：常规 `bg-black/60` 灰色滤镜。
- **Linear 工艺级**：
  ```css
  /* 景深虚化遮罩层 */
  .modal-scrim {
    background-color: rgba(4, 6, 10, 0.65);
    backdrop-filter: blur(8px) brightness(0.65);
  }
  ```
  工作台背景在弹窗呼出瞬间产生类似相机大光圈虚化效果，视觉注意力 100% 聚焦于弹窗主体。

---

## 4. 模块三：全局排版与次像素精密渲染 (Typography & Crisp Antialiasing)

### 4.1 全局字体渲染管线
在 `apps/studio/src/index.css` 中注入顶配抗锯齿指令：

```css
@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}
```

### 4.2 雕刻级字间距（Tracking）标尺

| 字号阶梯 | 字号大小 | Tracking (Tailwind) | 典型应用与效果 |
| :--- | :--- | :--- | :--- |
| **Hero Title** | `16px (text-base)` | `tracking-[-0.02em]` (`tracking-tight`) | 模态弹窗 Header 大标题，稳重内敛 |
| **Section Title** | `14px (text-sm)` | `tracking-[-0.015em]` | TopBar 项目标题、检查器折叠面板标题 |
| **Control Text** | `12px (text-xs)` | `tracking-[-0.005em]` | 按钮文案、输入框 Label、Tab 切换项 |
| **Tabular Numbers** | `12px (text-xs)` | `font-mono font-feature-settings: "tnum"` | 时间轴秒数 (`1.2s`)、分辨率 (`1920×1080`)、图元计数 |

---

## 5. 模块四：弹性物理微交互与动力学曲线 (Spring Micro-Motion)

### 5.1 Linear 专用弹性收敛曲线 (Kinetic Ease-Out Curve)
摒弃默认机械的 `ease-in-out`，在 Tailwind 中配置专属微动效曲线：

```js
// packages/config-tailwind/tailwind.config.js
transitionTimingFunction: {
  'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
}
```

### 5.2 控件微交互状态机 (Control Micro-States)

```
       [ 默认态 (Default) ] ─── Hover (移入) ───➔ [ 悬浮微升 (Lifted) ]
             │                                         │
             │                                   transform: translateY(-0.5px)
             │                                   shadow-keycap-hover
             │                                         │
             └─────────────── Press (按下) ────────────┘
                                   │
                                   ▼
                          [ 物理微下沉 (Pressed) ]
                          transform: translateY(0.5px) scale(0.985)
                          shadow-keycap-active
```

- **响应周期**：`duration-150 ease-spring`，点击反馈清脆爽快，兼具高灵敏度与机械阻尼感。

---

## 6. 模块五：微雕实体快捷键键帽组件 (Kbd Physical Keycaps)

### 6.1 `<Kbd>` 原子组件设计规范

```tsx
// apps/studio/src/components/ui/Kbd.tsx
export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center h-4.5 min-w-[18px] px-1.5',
        'rounded-[4px] text-[10px] font-mono font-semibold',
        'bg-muted/80 text-muted-foreground select-none',
        'border border-border/40 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.3)]',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
```

### 6.2 Tooltip 深度集成效果
将原先纯文字的快捷键提示（如 `⌘Z`、`Space`、`1 / V`）升级为精致键帽展示：

```
       ┌──────────────────────────────────────────────┐
       │  撤销上一步操作          [ ⌘ ] [ Z ]         │  ← 实体微雕键帽
       └──────────────────────────────────────────────┘
```

---

## 7. 分阶段落地路线图与验收清单 (Phased Implementation Roadmap)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: 视觉核心与拟物微光 (Visual Core & Keycap Elevation)                           │
│ ├─ [ ] tailwind.config.js 扩展 shadow-keycap / shadow-keycap-cyan / spring 缓动曲线    │
│ ├─ [ ] Button.tsx 引入 shadow-keycap 与 hover/active 物理微下沉动效                    │
│ └─ [ ] 全局注入 -webkit-font-smoothing 与 tracking 雕刻级字间距                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 2: 空间色阶与景深遮罩 (Elevation Tiers & Cinematic Depth)                        │
│ ├─ [ ] 落地 Level 0 ~ Level 3 四级暗黑景深色阶                                         │
│ ├─ [ ] 模态弹窗 (Modals) 升级 backdrop-blur-md + brightness(0.65) 景深遮罩             │
│ └─ [ ] 右侧检查器图层项与底部时间轴场景卡片全面适配 shadow-keycap                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 3: 细节微雕与原子增强 (Atomic Precision & Kbd Component)                         │
│ ├─ [ ] 封装独立 <Kbd> 实体微雕按键组件                                                 │
│ ├─ [ ] 升级 Tooltip.tsx 快捷键槽位为双键帽展示                                         │
│ └─ [ ] Playwright 全量 E2E 回归测试与截图像素级复核                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📝 状态与维护记录
- **创建时间**：2026-08-31
- **当前状态**：`APPROVED_SPEC`（设计方案已完整归档，待用户指令分步实施）
- **关联设计文档**：[`STUDIO_SPEC.md`](file:///Users/xt/WebstormProjects/focusflow/design/STUDIO_SPEC.md)
