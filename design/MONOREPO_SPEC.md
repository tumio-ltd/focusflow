# FocusFlow - Monorepo 工程化架构与改造实施规格说明书
## Monorepo Engineering Architecture & Workspace Migration Specification

> **文档版本**：`v1.0.0`  
> **制定日期**：`2026-08-29`  
> **文档状态**：🚀 **Phase 2 Monorepo 改造实施标准 · 指导落地中**  
> **关联技术专刊**：
> - 📄 [PRODUCT_DESIGN.md (主产品方案与 PRD)](file:///Users/xt/WebstormProjects/focusflow/design/PRODUCT_DESIGN.md)
> - 🎨 [STUDIO_SPEC.md (Phase 2 可视化创作工作室与全栈规格)](file:///Users/xt/WebstormProjects/focusflow/design/STUDIO_SPEC.md)
> - 📐 [MVP_SPEC.md (Phase 1 播放引擎与 HUD 执行规格)](file:///Users/xt/WebstormProjects/focusflow/design/MVP_SPEC.md)
> - 📐 [MOTION_ENGINE_SPEC.md (动效数学与渲染规格)](file:///Users/xt/WebstormProjects/focusflow/design/MOTION_ENGINE_SPEC.md)
> 
> **适用对象**：前端架构师、DevOps 工程师、全栈研发  
> **文档定位**：FocusFlow 转型为多包协同工作区（Monorepo）的标准规范、工具链选型、目录结构、配置原型与迁移执行指南

---

## 目录 (Table of Contents)

- [1. Monorepo 改造背景与核心目标](#1-monorepo-改造背景与核心目标)
- [2. 核心技术选型与遵循标准 (Toolchain & Standards)](#2-核心技术选型与遵循标准-toolchain--standards)
  - [2.1 标准体系概览](#21-标准体系概览)
  - [2.2 选型对比与决策考量](#22-选型对比与决策考量)
- [3. 完整 Monorepo 工作区目录全景](#3-完整-monorepo-工作区目录全景)
- [4. 各子包核心职责与协同机制](#4-各子包核心职责与协同机制)
  - [4.1 `packages/player` (底层播放器内核)](#41-packagesplayer-底层播放器内核)
  - [4.2 `apps/studio` (上层可视化创作工作台)](#42-appsstudio-上层可视化创作工作台)
  - [4.3 `packages/dsl` (共享 DSL 类型与验证契约)](#43-packagesdsl-共享-dsl-类型与验证契约)
- [5. 核心配置文件工程标准与原型 (Configuration Blueprints)](#5-核心配置文件工程标准与原型-configuration-blueprints)
  - [5.1 `pnpm-workspace.yaml` 工作区定义](#51-pnpm-workspaceyaml-工作区定义)
  - [5.2 `turbo.json` 拓扑任务与构建缓存配置](#52-turbojson-拓扑任务与构建缓存配置)
  - [5.3 根目录 `package.json` 统一命令调度](#53-根目录-packagejson-统一命令调度)
  - [5.4 `tsconfig.base.json` 跨包复合类型引用](#54-tsconfigbasejson-跨包复合类型引用)
  - [5.5 现代 ESM 子路径导出标准 (`package.json "exports"`)](#55-现代-esm-子路径导出标准-packagejson-exports)
- [6. 开发与构建工作流 (Development Workflow)](#6-开发与构建工作流-development-workflow)
- [7. 平滑无痛迁移实施路线图 (Migration Checklist)](#7-平滑无痛迁移实施路线图-migration-checklist)

---

## 1. Monorepo 改造背景与核心目标

在 Phase 1 (MVP) 中，FocusFlow 采用单一目录结构（Single Package），所有的引擎代码集中在 `src/` 中。随着 **Phase 2 (FocusFlow Studio 可视化创作工作台)** 与 **Phase 3 (云端 SaaS 平台)** 的展开：
1. **上层应用（React 19 Studio 工作台）** 需要依赖 **底层渲染内核（原生 JS FocusFlowPlayer）**；
2. **底层内核** 必须保持 **100% 零大型框架依赖（~35KB 极简体积）**，绝不能被 React/Tailwind 等上层依赖污染；
3. **数据契约（DSL Types & Schema）** 需要在 Studio、Player 与服务端三方共享，避免类型分叉。

因此，将项目升级为 **现代化 Monorepo 工作区**，实现**“一个仓库、多包解耦、依赖隔离、秒级协同”**是项目的必然演进路径。

---

## 2. 核心技术选型与遵循标准 (Toolchain & Standards)

### 2.1 标准体系概览

```
                     【FocusFlow Monorepo 工具链全景】

    ┌───────────────────────────────────────────────────────────────┐
    │  🚀 任务编排与构建缓存: Turborepo (turbo)                     │
    │  • 拓扑依赖感知 (Topological Graph) / 智能增量缓存 (Cache)   │
    ├───────────────────────────────────────────────────────────────┤
    │  📦 包管理与依赖隔离: pnpm Workspaces (pnpm v9+)             │
    │  • 硬链接零冗余 / workspace:* 协议 / 严格防幽灵依赖           │
    ├───────────────────────────────────────────────────────────────┤
    │  📐 类型与模块标准: TypeScript Project References + ESM Exports│
    │  • "composite": true 增量类型推导 / package.json "exports"     │
    ├───────────────────────────────────────────────────────────────┤
    │  📜 版本与发布协同: Changesets (@changesets/cli)              │
    │  • 多包语义化发版 (SemVer) / 自动生成 CHANGELOG               │
    └───────────────────────────────────────────────────────────────┘
```

### 2.2 选型对比与决策考量

| 维度 | 选定方案 | 替代方案 (未选) | 决策依据 |
| :--- | :--- | :--- | :--- |
| **包管理器** | **`pnpm Workspaces`** | npm / yarn | 基于硬链接与符号链接存储，依赖安装速度最快，严格杜绝幽灵依赖，行业标配。 |
| **任务编排** | **`Turborepo` (`turbo`)** | Nx / Lerna | Go/Rust 内核驱动，零配置学习成本低，拓扑构建与哈希缓存极快，无侵入性。 |
| **模块导出** | **Node.js ESM `"exports"`** | 传统 `main/module` | 严谨支持 Subpath Exports（如 `@focusflow/player/styles.css`），原生 ESM。 |
| **跨包类型** | **`TS Project References`** | 单一 tsconfig | `"composite": true` 支持未构建状态下 IDE 毫秒级跨包代码跳转与类型补全。 |
| **版本协同** | **`Changesets`** | semantic-release | 支持多包协同升级与交互式声明版本变更，自动聚合 CHANGELOG。 |

---

## 3. 完整 Monorepo 工作区目录全景

```text
focusflow/                                     # 🏗️ FocusFlow Monorepo 根目录
├── 🎨 apps/                                   # 上层独立应用集合
│   └── 🖥️ studio/                             # 【Phase 2】React 19 可视化创作工作台
│       ├── public/templates/                  # 官方预置架构图模板
│       ├── src/                               # Studio 前端源码 (React 19 + Tailwind + shadcn/ui)
│       │   ├── components/                    # 画布、时间轴、属性面板、顶部栏组件
│       │   ├── stores/                        # Zustand 全局响应式状态 (DSL/Canvas/History)
│       │   ├── compiler/                      # 纯前端离线单文件 Base64 打包引擎
│       │   ├── hooks/                         # 快捷键与 Auto-Refine 逻辑
│       │   ├── App.tsx                        # 工作台根组件
│       │   └── main.tsx                       # 入口挂载
│       ├── package.json                       # 声明依赖 "@focusflow/player": "workspace:*"
│       ├── tsconfig.json                      # 继承根目录 tsconfig.base.json
│       └── vite.config.ts                     # Vite 8 配置文件 (端口: 5174)
│
├── 📦 packages/                               # 共享核心包与底层引擎库
│   ├── 🚀 player/                             # 底层纯运行时播放器内核 (原 src/ 目录提取)
│   │   ├── src/                               # 零外部依赖原生 ES 源码 (~35KB)
│   │   │   ├── core/                          # 播放器生命周期、镜头运动学、状态机
│   │   │   ├── motion/                        # 几何自动测长、贝塞尔流光、气泡阶梯动效
│   │   │   ├── hud/                           # 标定助手、Sobel 吸附、Auto-Refine
│   │   │   ├── styles/focusflow.css           # 核心样式与发光滤镜
│   │   │   └── index.js                       # 统一导出入口
│   │   ├── dist/                              # 打包产物 (IIFE 与 ESM)
│   │   ├── package.json                       # 声明导出 "@focusflow/player"
│   │   └── tsconfig.json
│   │
│   └── 📜 dsl/                                # 共享 DSL 类型与 Schema 校验包
│       ├── src/
│       │   ├── schema.ts                      # FocusFlow DSL TypeScript 强类型定义
│       │   └── validator.ts                   # DSL 合法性校验器
│       ├── package.json                       # 声明导出 "@focusflow/dsl"
│       └── tsconfig.json
│
├── 💡 examples/                               # 官方实战演示示例库
│   ├── luxehms/                               # LuxeHMS 4K 架构拓扑示例 (config.json + standalone.html)
│   ├── overlay-demo/                          # 画中画动态覆盖图下钻示例
│   └── simple-demo/                           # 极简测试用例
│
├── 🛠️ scripts/                                 # CLI 自动化与打包脚本
│   ├── build-standalone.js                    # 离线单文件 HTML 打包器
│   └── create-project.js                      # 新项目极速脚手架
│
├── 📚 docs/                                   # 创作者指南与算法技术专刊
├── 📐 design/                                 # PRD、架构与研发规格体系
│
├── .changeset/                                # Changesets 多包版本管理配置
├── package.json                               # Monorepo 根配置与聚合 scripts 命令
├── pnpm-workspace.yaml                        # pnpm 工作区包匹配声明
├── turbo.json                                 # Turborepo 构建管道与缓存规则
├── tsconfig.base.json                         # 统一 TypeScript 基础配置
├── vite.config.js                             # 根门户预览配置 (端口: 5173)
└── README.md
```

---

## 4. 各子包核心职责与协同机制

### 4.1 `packages/player` (底层播放器内核)
* **职责**：纯运行时播放与动效渲染引擎，负责 60fps GPU 镜头变换、SVG 贝塞尔流线动态路由、毛玻璃气泡阶梯弹入；
* **特性**：**100% 零大型框架依赖**，保持极致轻量化（~35KB JS，~8KB CSS）；
* **产物**：
  * ESM 模块供 `@focusflow/studio` 直接 import 调用；
  * IIFE 单文件包供独立 HTML 离线内联。

### 4.2 `apps/studio` (上层可视化创作工作台)
* **职责**：面向创作者的现代化 Web 工作台，负责底图拖拽建项目、无限画布平移缩放、镜头取景器、时间轴拖拽排序、一键导出；
* **依赖**：通过 `"@focusflow/player": "workspace:*"` 引入播放器内核，在画布中央实时挂载 Player 实例；
* **技术栈**：React 19 + TypeScript + Vite 8 + Tailwind CSS + shadcn/ui + Zustand。

### 4.3 `packages/dsl` (共享 DSL 类型与验证契约)
* **职责**：维护全局唯一的 FocusFlow JSON DSL TypeScript 接口定义（`SceneStep`, `CameraConfig`, `ElementBox`, `ElementPath` 等）与 JSON Schema 校验函数；
* **价值**：确保 Studio 生成的数据、Player 消费的数据以及 CLI 编译的数据永远保持 100% 类型一致。

---

## 5. 核心配置文件工程标准与原型 (Configuration Blueprints)

### 5.1 `pnpm-workspace.yaml` 工作区定义
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

---

### 5.2 `turbo.json` 拓扑任务与构建缓存配置
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    }
  }
}
```

---

### 5.3 根目录 `package.json` 统一命令调度
```json
{
  "name": "focusflow-monorepo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "turbo run dev",
    "dev:studio": "turbo run dev --filter=@focusflow/studio",
    "dev:player": "vite",
    "build": "turbo run build",
    "build:standalone": "node scripts/build-standalone.js examples/luxehms",
    "create:project": "node scripts/create-project.js",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "changeset": "changeset"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vite": "^8.2.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

---

### 5.4 `tsconfig.base.json` 跨包复合类型引用
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "isolatedModules": true
  }
}
```

---

### 5.5 现代 ESM 子路径导出标准 (`package.json "exports"`)
```json
// packages/player/package.json
{
  "name": "@focusflow/player",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./src/styles/focusflow.css",
    "./package.json": "./package.json"
  },
  "files": ["dist", "src"]
}
```

---

## 6. 开发与构建工作流 (Development Workflow)

```bash
# 1. 一键安装全工作区所有依赖 (基于硬链接秒级完成)
pnpm install

# 2. 启动 Phase 2 Studio 可视化创作工作台
pnpm dev:studio
# 浏览器访问 http://localhost:5174

# 3. 启动 Phase 1 播放器与多示例展示门户
pnpm dev:player
# 浏览器访问 http://localhost:5173

# 4. 全局拓扑并行构建 (Turborepo 智能缓存)
pnpm build

# 5. 多包协同版本发布记录
pnpm changeset
```

---

## 7. 平滑无痛迁移实施路线图 (Migration Checklist)

- [ ] **Step 1: 根工作区环境配置 (Root Workspace Setup)**
  - [ ] 1.1 创建 `pnpm-workspace.yaml`，指定 `packages/*` 与 `apps/*`
  - [ ] 1.2 创建 `turbo.json`，配置 `build` 拓扑与 `dist/**` 缓存产物
  - [ ] 1.3 创建 `tsconfig.base.json`，配置 `"composite": true` 复合类型标准
- [ ] **Step 2: 底层播放器与 DSL 契约提取 (Extract Packages)**
  - [ ] 2.1 创建 `packages/dsl`，迁移提取 `src/types/dsl.d.ts` 为标准共享包
  - [ ] 2.2 创建 `packages/player`，将当前 `src/` 迁移至 `packages/player/src/`
  - [ ] 2.3 配置 `packages/player/package.json` 的 ESM Subpath Exports
- [ ] **Step 3: Studio 前端工程初始化 (Init Studio App)**
  - [ ] 3.1 在 `apps/studio` 初始化 React 19 + TypeScript + Vite 8 + Tailwind 工程
  - [ ] 3.2 引入 `"@focusflow/player": "workspace:*"` 与 `"@focusflow/dsl": "workspace:*"`
  - [ ] 3.3 验证 Studio 画布成功挂载并实例化 Player 播放器
- [ ] **Step 4: 脚本与 CI 构建联调 (Scripts & Verification)**
  - [ ] 4.1 更新 `scripts/build-standalone.js` 适配新目录路径
  - [ ] 4.2 执行 `pnpm build`，验证 Turborepo 拓扑编译与缓存命中率 100%
