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
  - [2.3 为什么选用 Turborepo 而不是 Nx？(全栈 NestJS 场景深度技术选型对比)](#23-为什么选用-turborepo-而不是-nx全栈-nestjs-场景深度技术选型对比)
  - [2.4 为什么选用 Prisma 而不是 Sequelize？(ORM 核心技术选型与深度对比)](#24-为什么选用-prisma-而不是-sequelizeorm-核心技术选型与深度对比)
- [3. 完整 Monorepo 工作区目录全景](#3-完整-monorepo-工作区目录全景)
  - [3.1 POC & Phase 1 (MVP) 现有代码资产与 Monorepo 映射关系对照表](#31-poc--phase-1-mvp-现有代码资产与-monorepo-映射关系对照表)
- [4. 各子包核心职责与协同机制](#4-各子包核心职责与协同机制)
  - [4.1 `packages/player` (底层播放器内核)](#41-packagesplayer-底层播放器内核)
  - [4.2 `apps/studio` (上层可视化创作工作台)](#42-appsstudio-上层可视化创作工作台)
  - [4.3 `packages/dsl` (统一领域契约包)](#43-packagesdsl-统一领域契约包)
  - [4.4 `apps/api` (NestJS 主 RESTful API 服务)](#44-appsapi-nestjs-主-restful-api-服务)
  - [4.5 `apps/render-worker` (NestJS 4K 视频渲染工作节点)](#45-appsrender-worker-nestjs-4k-视频渲染工作节点)
  - [4.6 `packages/database` (纯粹数据层 · 零 NestJS 依赖)](#46-packagesdatabase-纯粹数据层--零-nestjs-依赖)
  - [4.7 共享配置包 (`packages/config-*`)](#47-共享配置包-packagesconfig-)
- [5. 核心配置文件工程标准与原型 (Configuration Blueprints)](#5-核心配置文件工程标准与原型-configuration-blueprints)
  - [5.1 `pnpm-workspace.yaml` 工作区定义](#51-pnpm-workspaceyaml-工作区定义)
  - [5.2 `turbo.json` 拓扑任务与构建缓存配置](#52-turbojson-拓扑任务与构建缓存配置)
  - [5.3 根目录 `package.json` 统一命令调度](#53-根目录-packagejson-统一命令调度)
  - [5.4 消息队列强类型契约原型 (`packages/dsl/src/jobs.ts`)](#54-消息队列强类型契约原型-packagesdslsrcjobsts)
  - [5.5 纯粹数据层包声明 (`packages/database/package.json`)](#55-纯粹数据层包声明-packagesdatabasepackagejson)
  - [5.6 `tsconfig.base.json` 跨包复合类型引用](#56-tsconfigbasejson-跨包复合类型引用)
  - [5.7 现代 ESM 子路径导出标准 (`packages/player/package.json`)](#57-现代-esm-子路径导出标准-packagesplayerpackagejson)
  - [5.8 NestJS 服务端子包声明 (`apps/api/package.json`)](#58-nestjs-服务端子包声明-appsapipackagejson)
- [6. 开发与构建工作流 (Development Workflow)](#6-开发与构建工作流-development-workflow)
- [7. 平滑无痛迁移实施路线图 (Migration Checklist)](#7-平滑无痛迁移实施路线图-migration-checklist)

---

## 1. Monorepo 改造背景与核心目标

在 Phase 1 (MVP) 中，FocusFlow 采用单一目录结构（Single Package），所有的引擎代码集中在 `src/` 中。随着 **Phase 2 (FocusFlow Studio 可视化创作工作台)** 与 **Phase 3 (云端 SaaS 平台与 NestJS API)** 的展开：
1. **上层应用（React 19 Studio 工作台）** 需要依赖 **底层渲染内核（原生 JS FocusFlowPlayer）**；
2. **底层内核** 必须保持 **100% 零大型框架依赖（~35KB 极简体积）**，绝不能被 React/Tailwind 等上层依赖污染；
3. **数据契约（DSL Types & Schema）** 需要在 Studio 前端、Player 内核与 NestJS 后端三方共享，避免类型分叉与接口不一致。

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
    │  🗄️ 数据持久化与 ORM: PostgreSQL 18 + Prisma ORM              │
    │  • 100% 编译期类型推导 / 声明式 Schema / 原生 JSONB 过滤支持 │
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
| **ORM / 数据层** | **`Prisma ORM`** | Sequelize / TypeORM | 声明式 DSL 建模、Rust 查询引擎、100% 自动生成 TS 类型，原生支持 PostgreSQL 18 JSONB。 |
| **模块导出** | **Node.js ESM `"exports"`** | 传统 `main/module` | 严谨支持 Subpath Exports（如 `@focusflow/player/styles.css`），原生 ESM。 |
| **跨包类型** | **`TS Project References`** | 单一 tsconfig | `"composite": true` 支持未构建状态下 IDE 毫秒级跨包代码跳转与类型补全。 |
| **版本协同** | **`Changesets`** | semantic-release | 支持多包协同升级与交互式声明版本变更，自动聚合 CHANGELOG。 |

---

### 2.3 为什么选用 Turborepo 而不是 Nx？(全栈 NestJS 场景深度技术选型对比)

在考虑引入 NestJS 后端服务时，业内常讨论“是否需要切换到 Nx”。经过对架构侵入性、维护成本及开发体验的深度评估，**FocusFlow 坚定选择「Turborepo + pnpm」，坚决不引入 Nx**。

#### 1. Turborepo vs Nx 全栈深度评估矩阵

```
+---------------------+-----------------------------------+------------------------------------+
| 评估维度            | Turborepo + pnpm (FocusFlow 选定) | Nx                                 |
+---------------------+-----------------------------------+------------------------------------+
| 1. 侵入性与依赖锁定 | 🏆 零侵入 (基于标准 package.json) | ❌ 强侵入 (依赖 @nx/nest, @nx/vite)|
| 2. 升级与维护成本   | 🏆 极低 (NestJS 官方升级无缝跟进) | ⚠️ 极高 (每次大版本升级 nx migrate 易报错)|
| 3. 学习曲线与上手度 | 🏆 5 分钟上手 (只需 1 个 turbo.json)| ❌ 复杂繁重 (project.json, executors)|
| 4. 前后端共享包能力 | 🏆 原生 workspace:* 协议秒级共享   | ✅ 支持 (但需配置 TS path 映射)    |
| 5. 构建速度与缓存   | 🏆 极快 (Go/Rust 原生单二进制内核)| ✅ 快 (但 node 进程内存开销较大)   |
| 6. 适用项目体量     | 🏆 中小型 ~ 超大型全栈产品矩阵    | 偏向百人团队、几百个微服务的巨型航母|
+---------------------+-----------------------------------+------------------------------------+
```

#### 2. 为什么 NestJS 在 Turborepo 中更纯粹、更丝滑？
1. **零插件绑架（No Plugin Lock-in）**：
   * 在 Turborepo 中，NestJS 保持为其**最纯粹的官方标准形态**（使用标准的 `nest-cli.json` 与 `nest start --watch`）；
   * 在 Nx 中，项目被深度绑定在 `@nx/nest` 插件上，每当 NestJS 或 TypeScript 发布新版本时，必须等待 Nx 官方适配，且运行 `nx migrate` 极易出现脚本报错和配置污染；
2. **前后端同构共享 `@focusflow/dsl` 极其简便**：
   * NestJS 后端（`apps/api`）与 React 前端（`apps/studio`）只需在 `package.json` 中声明 `"@focusflow/dsl": "workspace:*"`，即可直接 `import { FocusFlowDSL } from '@focusflow/dsl'`，无需配置任何复杂的 Webpack/Rollup 重定向；
3. **一键并行拉起全栈开发环境**：
   * 根目录只需执行一行 `pnpm dev`，Turborepo 会并发同时启动 Studio 前端（`:5174`）与 NestJS 后端（`:3000`），实时监听、热重载两不误；
4. **业界顶级开源全栈 SaaS 最佳实践背书**：
   * 国际顶级全栈开源产品矩阵（如 **Cal.com** 日程平台、**Dub.co** 短链分析、**Supabase** 云控制台）均 100% 采用 **pnpm + Turborepo** 驱动其前端与 Node/NestJS 后端服务。

---

### 2.4 为什么选用 Prisma 而不是 Sequelize？(ORM 核心技术选型与深度对比)

在 Node.js / TypeScript 服务端生态中，ORM（对象关系映射）是连接业务逻辑与 PostgreSQL 18 数据库的核心桥梁。针对 **Prisma** 与老牌 ORM **Sequelize**，我们进行了系统性的架构解析与对比评估。

#### 1. Prisma 核心架构与 4 大支柱组件

Prisma 是专为现代化 TypeScript 全栈应用设计的下一代数据层框架（Next-Generation ORM），其底层由高性能 Rust 查询引擎驱动，包含 4 大核心组件：

```
                           【Prisma 现代化数据引擎 4 大核心支柱】

   ┌────────────────────────────────────────────────────────────────────────┐
   │ 📝 1. Prisma Schema (schema.prisma)                                    │
   │    • 声明式单一真实可信源 (Single Source of Truth)                     │
   │    • 直观人类可读 DSL: 定义数据模型、关联关系、字段约束与索引          │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 🚀 2. Prisma Client (@prisma/client)                                   │
   │    • 100% 自动生成的强类型查询构建器 (Auto-generated & Tailored)       │
   │    • 零类型断言、深层嵌套查询类型推导、原生 JSONB 字段智能补全          │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 🔄 3. Prisma Migrate (prisma migrate)                                  │
   │    • 声明式数据库版本迁移引擎: 自动对比 Schema 生成 SQL Diff 变更脚本  │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 🖥️ 4. Prisma Studio (npx prisma studio)                                │
   │    • 开箱即用的零配置 Web 端可视化数据浏览器与管理控制台               │
   └────────────────────────────────────────────────────────────────────────┘
```

#### 2. Prisma vs Sequelize 8 维全方位对比评估矩阵

```
+------------------------+------------------------------------+------------------------------------+
| 评估维度                | Prisma (FocusFlow 选定)            | Sequelize (传统老一代)             |
+------------------------+------------------------------------+------------------------------------+
| 1. TypeScript 原生度   | 🏆 100% 编译期类型推导 (零人工维护)| ⚠️ 需 sequelize-typescript 额外配置|
| 2. 数据建模方式        | 🏆 声明式 DSL (schema.prisma 纯粹) | ⚠️ JS 代码级定义 (冗长分散、易脱节)|
| 3. 关联关系查询 DX     | 🏆 include 链式推导 (返回类型精准) | ⚠️ include 数组配置繁杂，类型丢失  |
| 4. PostgreSQL JSONB    | 🏆 原生一等公民 (支持深层 Path 过滤)| ⚠️ 基础 JSON 类型，无类型补全支持  |
| 5. 数据库迁移自动化    | 🏆 prisma migrate 自动生成 SQL 差异| ⚠️ 需手写 up()/down() 双向迁移脚本 |
| 6. 可视化管理后台      | 🏆 内置开箱即用 (Prisma Studio)    | ❌ 无内置 GUI (需依赖第三方 DBeaver)|
| 7. 底层性能与引擎      | 🏆 Rust 原生高性能查询引擎 + 批处理| ⚠️ 纯 JS 构造 SQL，易掉入 N+1 陷阱 |
| 8. 社区演进与现代规范  | 🏆 现代 TS / NestJS 黄金标准 (2026)| ⚠️ 2011 年老框架，社区活跃度衰退   |
+------------------------+------------------------------------+------------------------------------+
```

#### 3. FocusFlow 坚决选择 Prisma 的 4 大决定性理由

1. **FocusFlow 核心资产 DSL 的 PostgreSQL 18 原生 JSONB 支持**：
   * FocusFlow 项目的核心数据（镜头、视口、图层、流光连线、场景序列）以复杂 JSON DSL 形式存储；
   * Prisma 提供了对 PostgreSQL JSONB 的**一等公民级别支持**，支持直接进行按路径筛选与类型断言，极大提升查询效率；
2. **100% 零人工维护的编译期绝对类型安全**：
   * 在 Sequelize 中，每当修改表结构，必须手动同步修改 TypeScript Interface，字段名一旦拼错只能在运行时报错；
   * 在 Prisma 中，运行 `prisma generate` 会自动生成精准的 TypeScript 类型，在 IDE 中获得丝滑的自动补全，**从根源上消灭了 90% 的运行时字段类型错误**；
3. **极度纯净的 Monorepo 跨包解耦（`packages/database`）**：
   * 如前所述，`packages/database` 仅需维护一个 `schema.prisma` 并导出原生 `PrismaClient`，**零依赖任何上层 Web 框架**，既能供 NestJS 使用，又能供轻量 CLI 脚本直接操作数据库；
4. **极致高效的迁移与本地调试体验**：
   * 修改 `schema.prisma` 后，一行 `pnpm db:migrate` 自动生成标准的 SQL 迁移文件，一行 `pnpm db:studio` 立即在浏览器打开可视化控制台管理数据，开发效率比 Sequelize 提升数倍！

---

## 3. 完整 Monorepo 工作区目录全景

```text
focusflow/                                     # 🏗️ FocusFlow Monorepo 根目录
├── 🎨 apps/                                   # 业务应用层 (Applications)
│   │
│   ├── 🖥️ studio/                             # 【前端 App】React 19 可视化创作工作台
│   │   ├── public/templates/                  # 官方预置架构图模板
│   │   ├── src/                               # Studio 前端源码 (React 19 + Tailwind + shadcn/ui)
│   │   │   ├── components/                    # 画布、时间轴、属性面板、顶部栏组件
│   │   │   ├── stores/                        # Zustand 全局响应式状态 (DSL/Canvas/History)
│   │   │   ├── compiler/                      # 纯前端离线单文件 Base64 打包引擎
│   │   │   ├── hooks/                         # 快捷键与 Auto-Refine 逻辑
│   │   │   ├── App.tsx                        # 工作台根组件
│   │   │   └── main.tsx                       # 入口挂载
│   │   ├── package.json                       # 依赖 @focusflow/player, @focusflow/dsl, @focusflow/config-*
│   │   ├── tsconfig.json                      # 继承 @focusflow/config-typescript/base.json
│   │   └── vite.config.ts                     # Vite 8 配置文件 (端口: 5174)
│   │
│   ├── ⚡ api/                                # 【后端 App 1】主 RESTful API 服务 (NestJS)
│   │   ├── src/                               # I/O 密集型 API 源码
│   │   │   ├── modules/                       # 核心业务模块划分
│   │   │   │   ├── projects/                  # 📦 项目管理模块 (CRUD, Viewport, 版本快照)
│   │   │   │   ├── assets/                    # 🖼️ 静态资产托管模块 (S3/OSS 直传与元数据解析)
│   │   │   │   ├── exporter/                  # 📦 独立单文件 HTML 流式导出模块
│   │   │   │   └── share/                     # 🌐 云端只读短链与 iframe 嵌入分发模块
│   │   │   ├── common/                        # 异常过滤器、拦截器与 PrismaService 适配
│   │   │   ├── app.module.ts
│   │   │   └── main.ts                        # 启动入口 (端口: 3000, Swagger 接口文档)
│   │   ├── test/app.e2e-spec.ts               # e2e 测试 (测试逻辑提取为独立 async 函数)
│   │   ├── package.json                       # 依赖 @focusflow/database, @focusflow/dsl
│   │   └── tsconfig.json
│   │
│   └── 🎥 render-worker/                      # 【后端 App 2】4K 视频转码与渲染消费者 (NestJS Worker)
│       ├── src/                               # CPU/GPU 密集型转码源码
│       │   ├── processors/                    # 队列消费者 (BullMQ / Redis Queue)
│       │   │   └── video-render.processor.ts  # 消费 4K 60fps 渲染任务
│       │   ├── engine/                        # Headless Chrome 逐帧截帧与 FFmpeg 硬件加速流水线
│       │   ├── worker.module.ts
│       │   └── main.ts                        # 独立后台守护进程
│       ├── package.json                       # 依赖 @focusflow/database, @focusflow/dsl, remotion
│       └── tsconfig.json
│
├── 📦 packages/                               # 共享核心库与配置包 (Shared Packages)
│   │
│   ├── 🚀 player/                             # 1. 播放器渲染内核 (纯原生 JS ~35KB, 零外部框架依赖)
│   │   ├── src/ (core/, motion/, hud/)        # 60fps GPU 镜头、SVG 贝塞尔流光、Sobel 吸附
│   │   ├── dist/                              # IIFE 与 ESM 编译产物
│   │   └── package.json                       # 导出 @focusflow/player
│   │
│   ├── 📜 dsl/                                # 2. 统一领域契约包 (DSL 语法树 + 消息队列 Job 契约)
│   │   ├── src/
│   │   │   ├── schema.ts                      # FocusFlow DSL TypeScript 强类型定义
│   │   │   ├── validator.ts                   # JSON Schema 结构校验器
│   │   │   └── jobs.ts                        # 💡 BullMQ 视频转码任务与事件强类型契约
│   │   └── package.json                       # 导出 @focusflow/dsl
│   │
│   ├── 🗄️ database/                           # 3. 纯粹数据层 (PostgreSQL 18 + Prisma, 💡 零 NestJS 依赖)
│   │   ├── prisma/
│   │   │   ├── schema.prisma                  # 唯一的数据库模型定义 (Project, Asset, RenderJob)
│   │   │   └── migrations/                    # 统一数据库迁移历史
│   │   ├── src/index.ts                       # 仅导出原生 PrismaClient 与自动生成类型
│   │   └── package.json                       # 纯 TypeScript / Prisma 依赖 (无 @nestjs/*)
│   │
│   ├── 🧩 ui/                                 # 4. 【预留演进】跨端共享 UI 组件库 (Radix / Tailwind)
│   │
│   ├── ⚙️ config-typescript/                  # 5. 【共享配置】统一 TypeScript 配置 (tsconfig.base.json)
│   ├── ⚙️ config-eslint/                      # 6. 【共享配置】统一 ESLint 规则与 Flat Config
│   └── ⚙️ config-tailwind/                    # 7. 【共享配置】统一 Tailwind 科技感暗黑设计 Token
│
├── 💡 examples/                               # 官方实战演示示例库 (luxehms, overlay-demo, simple-demo)
├── 🛠️ scripts/                                 # 离线单文件打包器与脚手架 CLI (build-standalone.js, create-project.js)
├── 📚 docs/                                   # 创作者指南与算法技术专刊 (USAGE_GUIDE.md, EDGE_SNAPPER_ALGORITHM.md)
├── 📐 design/                                 # PRD、架构与研发规格体系 (PRODUCT_DESIGN.md, MONOREPO_SPEC.md, STUDIO_SPEC.md)
│
├── 📦 legacy/                                 # 🏛️ 【历史版本物理备份库】(Historical Archives)
│   ├── phase0-poc/                            # 🧪 Phase 0 POC 概念验证极简原型快照 (只读封存)
│   │   ├── src/                               # 早期概念验证原型代码 (画布平移/缩放与基础连线)
│   │   ├── index.html                         # 早期 POC 验证页面
│   │   └── README.md
│   └── phase1-mvp/                            # 🚀 Phase 1 MVP 完整源码与示例独立快照备份 (只读封存)
│       ├── src/                               # 纯单体运行时完整源码 (core/, motion/, hud/, styles/)
│       ├── examples/                          # 示例工程 (luxehms, overlay-demo, simple-demo)
│       ├── scripts/                           # 初始打包脚本
│       ├── index.html
│       └── package.json
│
├── .changeset/                                # Changesets 多包版本管理配置
├── package.json                               # Monorepo 根配置与聚合 scripts 命令
├── pnpm-workspace.yaml                        # pnpm 工作区包匹配声明
├── turbo.json                                 # Turborepo 构建管道与缓存规则
├── index.html                                 # 根目录本地多示例预览门户 (Vite 8 驱动)
└── README.md
```

---

### 3.1 POC & Phase 1 (MVP) 现有代码资产与 Monorepo 映射关系对照表

在改造为 Monorepo 后，**POC 与 MVP 阶段沉淀的 100% 全部代码资产不会有任何丢弃或浪费**。我们采用**“双重保险备份（物理备份库 + Git 永久标签）”**与**“平滑升维归位”**策略：

| 现有 MVP / POC 目录与文件 | 改造后归宿位置 | 处理策略与角色定位 |
| :--- | :--- | :--- |
| **POC 早期验证原型** | **`legacy/phase0-poc/`** | **【🧪 POC 概念原型镜像封存】**：将早期探索验证镜头缩放与路径流光的 POC 原型独立归档，保留项目的技术探索原貌。 |
| **MVP 完整单体工程** | **`legacy/phase1-mvp/`** | **【🏛️ MVP 完整单体镜像封存】**：将 Phase 1 收官阶段的完整单体工程（`src/`、`examples/`、`scripts/`、`package.json`）完整复制至此，独立封存，随时可双开对照或一键启动运行。 |
| **`src/`** (core/, motion/, hud/, styles/) | **`packages/player/src/`** | **【100% 完整平移保留 · 核心基石】**：MVP 沉淀的 60fps GPU 镜头运动学、贝塞尔流光、气泡动效、Sobel 智能吸附与标定 HUD，完整平移为底层独立运行时内核（`@focusflow/player`）。 |
| **`src/types/dsl.d.ts`** | **`packages/dsl/src/schema.ts`** | **【提取与类型增强 · 领域契约】**：将原 TypeScript 类型定义提取为共享契约包，供 Player、Studio、API 三方共同引用。 |
| **`examples/luxehms/`** | **`examples/luxehms/`** | **【原地保留 · 黄金测试用例】**：作为官方 4K 复杂架构图黄金基准工程（Golden Regression Testbed）与演示模板。 |
| **`examples/overlay-demo/`** | **`examples/overlay-demo/`** | **【原地保留 · 实战案例】**：作为画中画多图层动态覆盖下钻的官方实战用例。 |
| **`examples/simple-demo/`** | **`examples/simple-demo/`** | **【原地保留 · 冒烟测试】**：作为双节点极简冒烟测试用例。 |
| **`scripts/build-standalone.js`** | **`scripts/build-standalone.js`** | **【原地保留 & 路径适配】**：更新内部 import 路径，继续作为命令行一键内联打包工具。 |
| **`scripts/create-project.js`** | **`scripts/create-project.js`** | **【原地保留】**：继续作为快速创建本地项目的 CLI 脚手架。 |
| **`index.html`** (根门户入口) | **`index.html`** | **【原地保留】**：作为本地多示例聚合导航页，支持一键切换预览各个实战案例。 |
| **`docs/`** & **`design/`** | **`docs/`** & **`design/`** | **【原地保留 & 持续更新】**：作为 FocusFlow 统一的全局技术专刊与架构规范中心。 |
| **Git Tag `v1.3.0-mvp`** | **Git Release Snapshot** | **【🏷️ Git 版本快照】**：在 Git 历史中打上永久标签，永不丢失。 |

---

---

## 4. 各子包核心职责与协同机制

### 4.1 `packages/player` (底层播放器内核)
* **职责**：纯运行时播放与动效渲染引擎，负责 60fps GPU 镜头变换、SVG 贝塞尔流线动态路由、毛玻璃气泡阶梯弹入；
* **特性**：**100% 零大型框架依赖**，保持极致轻量化（~35KB JS，~8KB CSS）；
* **产物**：ESM 模块供 Studio 调用，IIFE 单文件包供独立 HTML 离线内联。

### 4.2 `apps/studio` (上层可视化创作工作台)
* **职责**：面向创作者的现代化 Web 工作台，负责底图拖拽建项目、无限画布平移缩放、镜头取景器、时间轴拖拽排序、一键导出；
* **依赖**：通过 `"@focusflow/player": "workspace:*"` 引入播放器内核，在画布中央实时挂载 Player 实例；
* **技术栈**：React 19 + TypeScript + Vite 8 + Tailwind CSS + shadcn/ui + Zustand。

### 4.3 `packages/dsl` (统一领域契约包：DSL Schema + 消息队列 Job Contracts)
* **职责**：
  1. 维护全局唯一的 FocusFlow JSON DSL TypeScript 接口定义与 JSON Schema 校验函数；
  2. 维护 `src/jobs.ts`：定义 `RenderVideoJobPayload`、`RenderJobStatusEvent` 等 BullMQ 异步任务与事件的数据结构；
* **价值**：确保 Studio 前端、Player 内核、API 生产者与 Render Worker 消费者四方永远保持 100% 类型一致。

### 4.4 `apps/api` (NestJS 主 RESTful API 服务)
* **职责**：I/O 密集型核心 API，负责项目 CRUD、PostgreSQL 18 数据持久化、S3/OSS 资产直传、独立 HTML 流式下载与只读短链路由；
* **核心规范**：
  * **Swagger 全覆盖**：所有 Controller 端点严格配置 `@ApiTags`, `@ApiOperation`, `@ApiResponse`；
  * **强类型参数校验**：所有入参 DTO 严格配置 `class-validator` 装饰器；
  * **e2e 测试规范**：测试逻辑均提取为独立 async 函数，由 `it()` 块调用执行；
* **依赖**：引入 `"@focusflow/database": "workspace:*"` 与 `"@focusflow/dsl": "workspace:*"`, 并在自身 `common/prisma/` 封装轻量 NestJS `PrismaService`。

### 4.5 `apps/render-worker` (NestJS 4K 视频渲染工作节点)
* **职责**：CPU/GPU 密集型后台服务，作为 BullMQ 队列消费者，专门负责驱动 Remotion / Puppeteer 逐帧步进截帧与 FFmpeg 4K 60fps 高清转码合成；
* **隔离价值**：重度计算负载完全与主 API 服务物理隔离，绝不因视频转码而阻塞任何用户的在线 HTTP 请求。

### 4.6 `packages/database` (纯粹数据层 · 零 NestJS 依赖)
* **职责**：专注于 PostgreSQL 18 数据库模型维护（`schema.prisma`）与迁移，仅导出原生的 `PrismaClient` 与类型定义；
* **解耦优势**：**100% 框架无关**，不仅供 NestJS 服务使用，还可被独立的 Node.js 迁移脚本、数据清洗脚本和 CLI 工具无痛轻量引入。

### 4.7 共享配置包 (`packages/config-*`)
* **`@focusflow/config-typescript`**：导出 `base.json`、`react.json`、`nest.json` 等统一 TS 规则；
* **`@focusflow/config-eslint`**：导出统一的 ESLint Flat Config，杜绝代码风格分歧；
* **`@focusflow/config-tailwind`**：导出暗黑科技感颜色 Token、毛玻璃模糊滤镜与动画预设。

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
    "dev:api": "turbo run dev --filter=@focusflow/api",
    "dev:worker": "turbo run dev --filter=@focusflow/render-worker",
    "dev:player": "vite",
    "build": "turbo run build",
    "build:standalone": "node scripts/build-standalone.js examples/luxehms",
    "create:project": "node scripts/create-project.js",
    "db:migrate": "pnpm --filter=@focusflow/database prisma migrate dev",
    "db:studio": "pnpm --filter=@focusflow/database prisma studio",
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

### 5.4 消息队列强类型契约原型 (`packages/dsl/src/jobs.ts`)
```typescript
/**
 * 4K 视频渲染任务负载契约 (BullMQ Job Payload)
 */
export interface RenderVideoJobPayload {
  jobId: string;
  projectId: string;
  dslSnapshot: any; // 提交转码时刻的完整 FocusFlow DSL 快照
  resolution: '4K' | '2K' | '1080P';
  fps: 30 | 60;
  outputFormat: 'mp4' | 'gif';
  requestedBy: string;
  createdAt: string;
}

/**
 * 视频转码进度与完成事件
 */
export interface RenderJobProgressEvent {
  jobId: string;
  currentFrame: number;
  totalFrames: number;
  progressPercent: number;
  status: 'queued' | 'rendering_frames' | 'encoding_ffmpeg' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}
```

---

### 5.5 纯粹数据层包声明 (`packages/database/package.json`)
```json
{
  "name": "@focusflow/database",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.18.0"
  },
  "devDependencies": {
    "prisma": "^5.18.0",
    "typescript": "^5.5.0"
  }
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

### 5.5 现代 ESM 子路径导出标准 (`packages/player/package.json`)
```json
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

### 5.6 NestJS 服务端子包声明 (`apps/api/package.json`)
```json
{
  "name": "@focusflow/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main.js"
  },
  "dependencies": {
    "@focusflow/dsl": "workspace:*",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "^5.18.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@types/node": "^22.0.0",
    "prisma": "^5.18.0",
    "typescript": "^5.5.0"
  }
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
