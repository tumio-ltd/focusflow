# FocusFlow Studio · Stage 4 详细技术开发设计文档
## 场景关键帧时间轴编排与图层矩阵 (Sequence Timeline & Layer Matrix)

---

## 1. 架构目标与交互全景 (Objectives & Interaction Architecture)

Stage 4 核心使命是构筑 **FocusFlow Studio 模式 A（离线自治模式）** 的“场景时序编排”与“工程历史版本控制”核心能力：
1. **场景卡片流时间轴编排器 (`TimelineTrack`)**：
   - 底部水平时间轴支持多场景卡片拖拽重排（Drag-and-Drop Reorder）、快速插入、复制副本、删除与双击就地重命名；
   - 卡片实时呈现：场景序号、场景标题、运镜放大倍率与运镜时长徽章、包含图元数量徽章；
   - 集成演播控制条：总动画时长动态累加、当前场景驻留时间精确调节、全局自动轮播开关与播放进度条。
2. **零膨胀自研历史时间旅行引擎 (Undo / Redo History Stack)**：
   - 专为 FocusFlow DSL 语法树设计的轻量 Immutable 历史栈，维护 `past`、`present`、`future` 三维状态快照（上限 50 步）；
   - 全局自动拦截 `⌘ Z` / `Ctrl + Z`（撤销）与 `⌘ ⇧ Z` / `Ctrl + Y`（重做）；
   - 顶部控制台 TopBar 撤销/重做按键实时根据栈深深度使能/置灰（`canUndo`, `canRedo`）。
3. **图层可见性矩阵与场景继承机制 (Layer Visibility Matrix & Inheritance)**：
   - 在右侧 Inspector 面板与底部时间轴中，实现当前场景对全局图元库（Boxes, Paths, Dots, Images）的矩阵式勾选与一键继承；
   - 支持从上一幕快速同步激活状态，提升多场景架构演进的制作效率。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FocusFlow Studio · Stage 4 时序与历史架构                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ 1. 场景卡片时间轴 (Track) │ │ 2. 历史时间旅行栈(History)│ │ 3. 图层可见性矩阵(Matrix)│
│ - 水平卡片流拖拽重排序   │ │ - past/present/future 栈 │ │ - 全局图元 vs 当前场景   │
│ - 场景复制/删除/插入/改名│ │ - ⌘Z 撤销 / ⌘⇧Z 重做     │ │ - 一键从前一幕继承状态   │
│ - 单幕运镜时长动态累加   │ │ - TopBar 按键双向状态响应│ │ - 批量显隐/聚焦高亮      │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
                                         │
                                         ▼
                       ┌───────────────────────────────────┐
                       │   Zustand useProjectStore 历史切片 │
                       │   60fps 毫秒级防抖持久化与重放     │
                       └───────────────────────────────────┘
```

---

## 2. 场景卡片流时间轴设计 (Sequence Timeline & Drag Reorder)

### 2.1 场景卡片数据模型与状态流转

底部时间轴组件 [`BottomTimeline.tsx`](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/layout/BottomTimeline.tsx) 演进为支持多交互操作的专业影视级轨道：
- **卡片展示**：
  - 场景序号（`01`, `02`, `03`...）
  - 场景标题（双击可触发内联编辑）
  - 运镜徽章（如 `1.8x`）
  - 运镜时长（如 `1.5s`）
  - 关联图元计数（如 `4 元素`）
- **拖拽排序 (Drag & Drop Reorder)**：
  - 用户拖动场景卡片，产生位移指示线，释放后触发 `reorderScenes(sourceIndex, targetIndex)`；
  - 自动保持 `activeSceneIndex` 的合理重定向。
- **快捷操作菜单 (Context Actions)**：
  - 复制当前场景 (`duplicateScene`)
  - 删除当前场景 (`deleteScene`)
  - 向前插入新场景 / 向后插入新场景 (`insertScene`)

### 2.2 总时长动态计算公式 (Total Timeline Duration)

$$\text{TotalDuration} = \sum_{i=0}^{N-1} \left( \text{scene}_i.\text{camera}.\text{duration} + \text{scene}_i.\text{stayInterval} \right)$$
在时间轴左侧实时呈现 `总时长: 12.8s · 共 5 幕场景`，并支持总进度滑动条拖拽定位。

---

## 3. 零膨胀历史时间旅行栈设计 (Undo / Redo History Stack)

### 3.1 历史状态机数学定义

历史栈定义为三元组 $H = (P, C, F)$：
- $P = [S_0, S_1, \dots, S_{k-1}]$：过去快照列表（Past Snapshots，最大深度 $M = 50$）；
- $C = S_k$：当前状态快照（Current/Present DSL）；
- $F = [S_{k+1}, \dots, S_{k+m}]$：未来快照列表（Future Snapshots）。

**状态迁移规则**：
1. **用户触发修改操作 (Mutate Action)**：
   $$P' = [P, C]_{[-M:]}, \quad C' = S_{\text{new}}, \quad F' = []$$
2. **撤销操作 (Undo Action)**：若 $|P| > 0$，
   $$C' = P[-1], \quad P' = P[:-1], \quad F' = [C, F]$$
3. **重做操作 (Redo Action)**：若 $|F| > 0$，
   $$C' = F[0], \quad F' = F[1:], \quad P' = [P, C]$$

### 3.2 快捷键与生命周期绑定 (Keyboard Bindings)

在 `apps/studio/src/hooks/useHistoryKeyboard.ts` 中注册全局快捷键监听：
- `⌘ + Z` 或 `Ctrl + Z`：执行 `undo()`；
- `⌘ + Shift + Z` 或 `Ctrl + Shift + Z` 或 `⌘ + Y` 或 `Ctrl + Y`：执行 `redo()`；
- 智能防抖过滤：在用户连续拖拽滑块或连续敲击键盘输入标题时，合并为单次历史记录，避免污染撤销栈。

---

## 4. 图层可见性矩阵管理 (Layer Visibility Matrix)

### 4.1 全局图元与当前场景映射关系

FocusFlow 架构图元分为“全局图元池”与“每幕场景激活列表”：
- **全局图元池**：`dsl.elements` 包含全图所有的 `boxes`, `paths`, `dots`, `images`；
- **每幕激活列表**：`scene.activeElements` 声明当前场景需要点亮发光与入场动画的图元 ID 数组。

### 4.2 场景间图元状态继承 (Inherit from Previous Scene)

在 Inspector 面板中提供“继承上一幕激活状态”一键操作：
$$\text{activeElements}_{\text{current}} = \text{Clone}(\text{activeElements}_{\text{prev}})$$
大幅减少用户在连续多幕中重复勾选共同基础架构组件的工作量。

---

## 5. Playwright E2E 自动化测试设计 (Testing Strategy)

严格遵循全局规则（**测试用例逻辑全部提取为独立的异步 helper 函数，在 `it()` / `test()` 中调用**）：

```typescript
// apps/studio/e2e/stage4-timeline-history.spec.ts

async function verifyTimelineCardReorderAndDuplicate(page: Page): Promise<void>;
async function verifySceneTitleInlineEditing(page: Page): Promise<void>;
async function verifyUndoRedoKeyboardAndButtons(page: Page): Promise<void>;
async function verifyLayerMatrixInheritance(page: Page): Promise<void>;
async function verifyTimelinePlaybackControls(page: Page): Promise<void>;

test.describe('FocusFlow Studio Stage 4 E2E Timeline & History Suite', () => {
  test('TC401: 验证时间轴场景卡片复制、删除与重命名', async ({ page }) => {
    await verifyTimelineCardReorderAndDuplicate(page);
  });

  test('TC402: 验证场景标题双击内联编辑与实时同步', async ({ page }) => {
    await verifySceneTitleInlineEditing(page);
  });

  test('TC403: 验证 ⌘Z 撤销与 ⌘⇧Z 重做历史时间旅行', async ({ page }) => {
    await verifyUndoRedoKeyboardAndButtons(page);
  });

  test('TC404: 验证图层可见性矩阵勾选与上一幕状态继承', async ({ page }) => {
    await verifyLayerMatrixInheritance(page);
  });

  test('TC405: 验证演播控制条播放、暂停与上一幕/下一幕切换', async ({ page }) => {
    await verifyTimelinePlaybackControls(page);
  });
});
```

---

## 6. Stage 4 任务分解与执行清单 (WBS Checklist)

- [x] **Task 4.1: 场景卡片流时间轴高级编排器 (Scene Timeline & Drag Reorder)**
  - [x] 4.1.1 在 `useProjectStore.ts` 中实现 `reorderScenes`, `insertScene`, `duplicateScene`, `deleteScene` 完整时序 Action
  - [x] 4.1.2 升级 `src/components/layout/BottomTimeline.tsx`：实现卡片序号、运镜徽章、双击改名、复制/删除浮动按键与拖拽排序
  - [x] 4.1.3 支持总时长与单场景运镜时长动态计算呈现
- [x] **Task 4.2: 历史时间旅行撤销/重做引擎 (Undo / Redo History Stack)**
  - [x] 4.2.1 封装 `useProjectStore` 的 `undo`, `redo`, `past`, `future` 历史快照状态机
  - [x] 4.2.2 编写 `src/hooks/useHistoryKeyboard.ts`：全局监听 `⌘Z` / `⌘⇧Z` / `Ctrl+Z` / `Ctrl+Y` 快捷键
  - [x] 4.2.3 在 `TopBar.tsx` 中双向绑定撤销/重做按键与可用状态
- [ ] **Task 4.3: 图层可见性矩阵与状态继承 (Layer Visibility Matrix)**
  - [ ] 4.3.1 在 `RightInspector.tsx` 增强图元列表：支持全量图元显隐勾选、搜索过滤、快速删除
  - [ ] 4.3.2 增加“从上一幕继承图元”快捷按键，实现跨场景图元状态一键克隆
- [ ] **Task 4.4: 国际化词条扩充与类型声明 (i18n Augmentation)**
  - [ ] 4.4.1 扩充 `src/locales/zh/` 与 `src/locales/en/`（`timeline.ts`, `inspector.ts`, `common.ts` 增补时序与撤销词条）
- [ ] **Task 4.5: 质量门禁与 Playwright E2E 自动化测试 (Quality Gates & Verification)**
  - [ ] 4.5.1 编写 `e2e/stage4-timeline-history.spec.ts`（独立异步 helper 函数规范）
  - [ ] 4.5.2 运行 `pnpm lint`（Oxlint 极速静态检查 0 警告 0 错误）
  - [ ] 4.5.3 运行 `pnpm typecheck`（TypeScript 复合类型 100% 编译通过）
  - [ ] 4.5.4 运行 `pnpm build`（Turborepo 全局拓扑构建验证通过）

---
*FocusFlow Studio Architecture Working Group · 2026.08*
