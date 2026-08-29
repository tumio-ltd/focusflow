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
  - [2.5 Prisma 事务 (Transaction)、并发锁 (Lock) 与自动审计日志 (Audit Log) 实现规格](#25-prisma-事务-transaction并发锁-lock-与自动审计日志-audit-log-实现规格)
  - [2.6 为什么选用 Oxlint + Prettier 而不是传统 ESLint？(现代化极速代码质量流选型)](#26-为什么选用-oxlint--prettier-而不是传统-eslint现代化极速代码质量流选型)
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
  - [4.8 全局跨端 Dark / Light 双主题配色系统设计规范 (Semantic Tokens & Dual-Theme Architecture)](#48-全局跨端-dark--light-双主题配色系统设计规范-semantic-tokens--dual-theme-architecture)
  - [4.9 全栈端到端国际化 (i18n)架构设计规范与语言代码标准](#49-全栈端到端国际化-i18n-架构设计规范与语言代码标准)
  - [4.10 全栈身份认证 (JWT)、CASL 细粒度权限与 Redis 基础设施](#410-全栈身份认证-jwtcasl-细粒度权限与-redis-基础设施)
- [5. 核心配置文件工程标准与原型 (Configuration Blueprints)](#5-核心配置文件工程标准与原型-configuration-blueprints)
  - [5.1 `pnpm-workspace.yaml` 工作区定义](#51-pnpm-workspaceyaml-工作区定义)
  - [5.2 `turbo.json` 拓扑任务与构建缓存配置](#52-turbojson-拓扑任务与构建缓存配置)
  - [5.3 根目录 `package.json` 统一命令调度](#53-根目录-packagejson-统一命令调度)
  - [5.4 统一领域契约包声明与队列任务原型 (`packages/dsl/package.json` & `src/jobs.ts`)](#54-统一领域契约包声明与队列任务原型-packagesdslpackagejson--srcjobsts)
  - [5.5 纯粹数据层包声明 (`packages/database/package.json`)](#55-纯粹数据层包声明-packagesdatabasepackagejson)
  - [5.6 `tsconfig.base.json` 跨包复合类型引用](#56-tsconfigbasejson-跨包复合类型引用)
  - [5.7 现代 ESM 子路径导出标准 (`packages/player/package.json`)](#57-现代-esm-子路径导出标准-packagesplayerpackagejson)
  - [5.8 NestJS 主服务端子包声明 (`apps/api/package.json`)](#58-nestjs-主服务端子包声明-appsapipackagejson)
  - [5.9 NestJS 4K 视频渲染工作节点声明 (`apps/render-worker/package.json`)](#59-nestjs-4k-视频渲染工作节点声明-appsrender-workerpackagejson)
  - [5.10 全局代码质检与排版配置原型 (`.oxlintrc.json` & `.prettierrc.json`)](#510-全局代码质检与排版配置原型-oxlintrcjson--prettierrcjson)
  - [5.11 NestJS Swagger / OpenAPI 接口文档与参数强校验规范范式 (API & DTO Specifications)](#511-nestjs-swagger--openapi-接口文档与参数强校验规范范式-api--dto-specifications)
  - [5.12 前后端全链路类型安全：自动化 OpenAPI 客户端 SDK 生成 (Orval + TanStack React Query)](#512-前后端全链路类型安全自动化-openapi-客户端-sdk-生成-orval--tanstack-react-query)
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
    │  ⚡ 代码质检与美化: Oxlint (Rust 内核) + Prettier            │
    │  • 50ms 极速扫描 / 零配置内置 React & TS 规则 / 自动排版格式化 │
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
| **代码质检与排版** | **`Oxlint + Prettier`** | 传统 ESLint + Prettier | Rust 极速内核（快 50~100 倍），内置 TS/React/Hooks 规则，消灭依赖地狱，排版与查错完美解耦。 |
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

### 2.5 Prisma 事务 (Transaction)、并发锁 (Lock) 与自动审计日志 (Audit Log) 实现规格

#### 1. Prisma 对事务 (Transaction) 的支持机制
Prisma 提供了两种完善的事务模型，完美覆盖简单与高复杂度业务：

* **A. 顺序/批量事务 (Batch Transactions)**：
  ```typescript
  // 所有操作在一个原子事务中并发/批量提交，任意一个失败全局回滚
  const [project, version] = await prisma.$transaction([
    prisma.project.create({ data: { title: 'LuxeHMS', slug: 'luxehms' } }),
    prisma.projectVersion.create({ data: { version: 1, projectId: '...' } })
  ]);
  ```
* **B. 交互式闭包事务 (Interactive Transactions - 推荐)**：
  ```typescript
  // 支持在事务作用域内执行动态条件判断、版本检查与隔离级别控制
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
    if (project.isLocked) throw new BusinessException('项目已锁定，禁止修改');
    
    await tx.project.update({ where: { id: projectId }, data: { dslJson: newDsl } });
    await tx.projectVersion.create({ data: { projectId, dslJson: newDsl } });
  }, {
    maxWait: 5000,                                 // 获取连接最大等待时间 (ms)
    timeout: 10000,                                // 事务执行最大超时时间 (ms)
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead // 隔离级别 (ReadCommitted, Serializable 等)
  });
  ```

---

#### 2. Prisma 对并发锁 (Lock) 的支持机制

* **A. 乐观并发控制 (Optimistic Concurrency Control / 乐观锁 · 推荐主力)**：
  * 在数据模型中维护 `version Int @default(0)`；
  * 更新时带上版本校验并自增：
    ```typescript
    const updated = await prisma.project.updateMany({
      where: { id: projectId, version: currentVersion }, // 条件匹配
      data: { dslJson: newDsl, version: { increment: 1 } } // 版本原子递增
    });
    if (updated.count === 0) {
      throw new ConflictException('数据已被他人更新，请刷新重试 (Version Conflict)');
    }
    ```
* **B. 悲观行级排他锁 (Pessimistic Locking / `SELECT ... FOR UPDATE`)**：
  * 在交互式事务闭包中直接使用 `$queryRaw` 执行带锁查询：
    ```typescript
    await prisma.$transaction(async (tx) => {
      // 悲观行级排他锁: 阻止其他事务并发修改该记录
      const [project] = await tx.$queryRaw<Project[]>`
        SELECT * FROM "Project" WHERE id = ${projectId} FOR UPDATE
      `;
      // 执行后续修改
      await tx.project.update({ where: { id: projectId }, data: { ... } });
    });
    ```

---

#### 3. 仿照 HMS-B 架构的 Prisma 自动写操作审计日志 (`audit_log`) 落地方案

针对酒店 PMS 系统 (`hms-b`) 中成熟的 **“异步上下文 (CLS) + 实体拦截 + 变更差分 (Diff) + 同事务原子落盘”** 架构，Prisma 能够基于现代 **Prisma Client 扩展机制 (`$extends.query`)** 实现 **100% 同等能力且更加强类型、无侵入** 的自动审计系统！

```
                      【FocusFlow Prisma 自动审计日志流水线】

 客户端请求 ──> AuditInterceptor (nestjs-cls 提取 userId, requestId, ip)
                      │
                      ▼
 业务 Service ──> prisma.project.update(...) (零侵入业务代码)
                      │
                      ▼ ──(Prisma Client Extension $extends.query 自动拦截)──
                      ├─ 1. 查询变更前原始快照 (oldRecord)
                      ├─ 2. 执行实际更新 SQL 获得最新快照 (newRecord)
                      ├─ 3. 字段级差分引擎比对 (computeDiff ➔ oldValues vs newValues)
                      └─ 4. 同事务原子写入 audit_log 表 (tx.auditLog.create)
                      │
                      ▼
 统一提交事务 (业务数据与增量审计记录原子落盘 🚀)
```

#### 4. Prisma 自动审计扩展核心代码原型 (`packages/database/src/audit.extension.ts`)

```typescript
import { Prisma } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

/**
 * 字段级增量差分函数
 */
function computeDiff(oldObj: Record<string, any>, newObj: Record<string, any>) {
  const oldValues: Record<string, any> = {};
  const newValues: Record<string, any> = {};
  const ignoredKeys = new Set(['updatedAt', 'version']);

  for (const key of Object.keys(newObj)) {
    if (ignoredKeys.has(key)) continue;
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      oldValues[key] = oldObj[key];
      newValues[key] = newObj[key];
    }
  }
  return { oldValues, newValues };
}

/**
 * Prisma 全局自动审计日志 Client Extension
 */
export const createAuditExtension = (cls: ClsService) => {
  return Prisma.defineExtension({
    name: 'AuditLogExtension',
    query: {
      $allModels: {
        // 拦截全部模型的 create 操作
        async create({ model, args, query }) {
          const result = await query(args);
          const ctx = cls.get('auditContext'); // 包含 userId, requestId, ip, ua
          if (ctx) {
            await (Prisma as any).rawClient.auditLog.create({
              data: {
                operId: ctx.userId,
                requestId: ctx.requestId,
                entity: model,
                entityId: result.id,
                action: 'add',
                newValues: result,
                more: { ip: ctx.ip, ua: ctx.ua }
              }
            });
          }
          return result;
        },

        // 拦截全部模型的 update 操作 (精准字段差分)
        async update({ model, args, query }) {
          const client = (Prisma as any).rawClient;
          const oldRecord = await client[model].findUnique({ where: args.where });
          const result = await query(args);
          const ctx = cls.get('auditContext');

          if (ctx && oldRecord) {
            const { oldValues, newValues } = computeDiff(oldRecord, result);
            if (Object.keys(newValues).length > 0) {
              await client.auditLog.create({
                data: {
                  operId: ctx.userId,
                  requestId: ctx.requestId,
                  entity: model,
                  entityId: result.id,
                  action: 'update',
                  oldValues,
                  newValues,
                  more: { ip: ctx.ip, ua: ctx.ua }
                }
              });
            }
          }
          return result;
        },

        // 拦截全部模型的 delete 操作
        async delete({ model, args, query }) {
          const client = (Prisma as any).rawClient;
          const oldRecord = await client[model].findUnique({ where: args.where });
          const result = await query(args);
          const ctx = cls.get('auditContext');

          if (ctx && oldRecord) {
            await client.auditLog.create({
              data: {
                operId: ctx.userId,
                requestId: ctx.requestId,
                entity: model,
                entityId: oldRecord.id,
                action: 'delete',
                oldValues: oldRecord,
                more: { ip: ctx.ip, ua: ctx.ua }
              }
            });
          }
          return result;
        }
      }
    }
  });
};
```

---

### 2.6 为什么选用 Oxlint + Prettier 而不是传统 ESLint？(现代化极速代码质量流选型)

在现代化 React 19 + Vite 8 + Turborepo 技术栈下，传统基于 JavaScript 解释执行的 ESLint 已成为全栈 Monorepo 最大的构建与开发瓶颈。FocusFlow 全面采用 **`Oxlint + Prettier`** 架构组合。

#### 1. Oxlint + Prettier vs ESLint 8 维全方位评估矩阵

```
+------------------------+------------------------------------+------------------------------------+
| 评估维度                | 🚀 Oxlint + Prettier (FocusFlow 选定)| 🐢 ESLint + Prettier (传统老一代)   |
+------------------------+------------------------------------+------------------------------------+
| 1. 执行速度 (500 文件) | 🏆 ~50ms (快 50~100 倍, Rust 内核) | ⚠️ 3s ~ 8s (Node.js 单线程慢)      |
| 2. 内存与 CPU 开销     | 🏆 极低 (轻量单二进制秒级启动)     | ⚠️ 较高 (数十个 npm 插件内存开销)  |
| 3. 插件安装与依赖数量  | 🏆 零/极少插件 (内置 TS/React/Hooks)| ❌ 繁重 (需装 15+ eslint-plugin-*) |
| 4. 配置复杂度          | 🏆 极简 (开箱即用、零样板代码)     | ⚠️ 繁琐 (Flat Config v9 学习成本)  |
| 5. 代码格式化支持      | ✅ 搭配 Prettier 完美分工 (查错+排版)| ⚠️ 与 Prettier 规则频繁冲突打架   |
| 6. 类型感知检查 (Type) | ⚠️ 专注 AST 极速语法 (交由 tsc)    | ✅ 支持 typescript-eslint 深度类型推导|
| 7. 现代生态契合度      | 🏆 与 Vite/Rolldown/VoidZero 同源  | ⚠️ 逐渐转向 Rust/Zig 现代化重构    |
| 8. Git Pre-commit 体验 | 🏆 瞬间通过 (0 毫秒卡顿感)         | ⚠️ 提交代码时需等待数秒            |
+------------------------+------------------------------------+------------------------------------+
```

#### 2. FocusFlow 采用 Oxlint + Prettier 的 3 大核心优势

1. **速度提升 50~100 倍（极致 Sub-Second 开发体验）**：
   * Oxlint 由 Vue 核心团队成员主导的 VoidZero / OxC 团队基于 Rust 编写，500 个文件的全库扫描仅需 30~50ms，保存文件和提交代码完全零感知卡顿；
2. **彻底消灭 15+ 个 `eslint-plugin-*` 的依赖地狱**：
   * 原生内置了对 TypeScript、React 19、React Hooks（如 `useEffect` 依赖项检查）、JSX A11y 等全套规则的深度检查，不再需要维护复杂的 ESLint 插件树；
3. **职责 100% 绝对解耦**：
   * **Oxlint** 专职负责“**语法与逻辑找错（Correctness / Linting）**”；
   * **Prettier** 专职负责“**统一代码美化排版（Formatting）**”；
   * **TypeScript (`tsc --noEmit`)** 专职负责“**编译期深层类型推导守卫（Type-checking）**”。

---

## 3. 完整 Monorepo 工作区目录全景

```text
focusflow/                                     # 🏗️ FocusFlow Monorepo 根目录
├── 🎨 apps/                                   # 业务应用层 (Applications)
│   │
│   ├── 🖥️ studio/                             # 【前端 App】React 19 可视化创作工作台
│   │   ├── public/templates/                  # 官方预置架构图模板
│   │   ├── src/                               # Studio 前端源码 (React 19 + Tailwind + shadcn/ui)
│   │   │   ├── routes/                        # 🚦 TanStack Router 强类型文件路由体系
│   │   │   │   ├── __root.tsx                 # 根路由布局 (全局 QueryClientProvider & Toaster)
│   │   │   │   ├── index.tsx                  # / (项目大厅与模板中心)
│   │   │   │   ├── project.new.tsx            # /project/new (底图拖拽创建向导)
│   │   │   │   ├── project.$projectId.tsx     # /project/:projectId (三栏可视化工作台)
│   │   │   │   └── share.$slug.tsx            # /share/:slug (云端只读分享视图)
│   │   │   ├── api/                           # 🌐 Orval 自动化生成的类型安全客户端 SDK
│   │   │   │   ├── generated/                 # 自动生成的 React Query Hooks (useGetProjectById, useUpdateProject)
│   │   │   │   ├── model/                     # 自动生成的 TypeScript DTO 契约模型
│   │   │   │   └── custom-fetch.ts            # 全局 Fetch 拦截器与 BaseURL 注入
│   │   │   ├── components/                    # 画布、时间轴、属性面板、顶部栏组件
│   │   │   ├── stores/                        # Zustand 全局响应式状态 (DSL/Canvas/History)
│   │   │   ├── compiler/                      # 纯前端离线单文件 Base64 打包引擎
│   │   │   ├── hooks/                         # 快捷键与 Auto-Refine 逻辑
│   │   │   ├── App.tsx                        # 工作台根组件
│   │   │   └── main.tsx                       # 入口挂载
│   │   ├── orval.config.ts                    # ⚙️ Orval 自动化 OpenAPI 代码生成配置文件
│   │   ├── package.json                       # 依赖 @focusflow/player, @tanstack/react-router, @tanstack/react-query
│   │   ├── tsconfig.json                      # 继承 @focusflow/config-typescript/base.json
│   │   └── vite.config.ts                     # Vite 8 配置文件 (集成 TanStackRouterVite 插件)
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
│   ├── ⚙️ config-oxlint/                      # 6. 【共享配置】💡 统一 Oxlint 极速质检规则 (.oxlintrc.json)
│   └── ⚙️ config-tailwind/                    # 7. 【共享配置】统一 Tailwind 科技感暗黑设计 Token
│
├── 💡 examples/                               # 官方实战演示示例库 (luxehms, overlay-demo, simple-demo)
├── 🛠️ scripts/                                 # 离线单文件打包器与脚手架 CLI (build-standalone.js, create-project.js)
├── 📚 docs/                                   # 创作者指南与算法技术专刊 (USAGE_GUIDE.md, EDGE_SNAPPER_ALGORITHM.md)
├── 📐 design/                                 # PRD、架构与研发规格体系 (PRODUCT_DESIGN.md, MONOREPO_SPEC.md, STUDIO_SPEC.md)
│
├── 📦 legacy/                                 # 🏛️ 【历史版本物理备份库】(Historical Archives)
│   ├── phase0-poc/                            # 🧪 Phase 0 POC 概念验证极简原型快照 (只读封存)
│   └── phase1-mvp/                            # 🚀 Phase 1 MVP 完整源码与示例独立快照备份 (只读封存)
│
├── .changeset/                                # Changesets 多包版本管理配置
├── .oxlintrc.json                             # 💡 全局 Oxlint 极速质检规则配置
├── .prettierrc.json                           # 💡 全局 Prettier 统一代码排版与美化配置
├── docker-compose.yml                         # 🐳 本地快速拉起 PostgreSQL 18 + Redis 7 编排
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
* **依赖机制**：通过 `"@focusflow/player": "workspace:*"` 引入播放器内核，在画布中央实时挂载 Player 实例；
* **核心技术栈与 8 大功能域必要库包选型清单**：

| 功能领域 | 核心规划软件库 | 作用与实现业务功能 |
| :--- | :--- | :--- |
| **1. UI 组件与双主题系统** | `shadcn/ui` + `@radix-ui/*` + `next-themes` | 暗黑科技风/极简亮白双主题三栏工作台、属性调节滑块 (`Slider`)、导出下拉菜单 (`DropdownMenu`) |
| **2. 全局状态与撤销/重做** | `zustand` (v5) + `zundo` | 毫秒级 DSL 响应式状态树、无限步 `Ctrl/⌘ + Z` 历史时间旅行 (Undo/Redo) 撤销重做栈 |
| **3. 场景时间轴拖拽编排** | `@dnd-kit/core` + `@dnd-kit/sortable` | 底部水平时间轴轨道上场景卡片的流畅拖拽重排与顺序重组 |
| **4. 无限画布手势与交互** | `@use-gesture/react` + `lucide-react` | 鼠标滚轮中心缩放 (Zoom-to-cursor)、抓手平移手势 (Pan/Drag) 与全套极简暗黑/明亮矢量图标库 |
| **5. 路由与深链接状态** | `@tanstack/react-router` (v1) | 100% 编译期类型安全路由导航、URL Search Params 状态双向同步与无缝恢复 |
| **6. 多语言国际化 (i18n)** | `i18next` + `react-i18next` | 中英双语 (zh/en) 毫秒级热切换、TS 编译期词条 Key 自动联想补全与防拼错强校验 |
| **7. 服务端请求与 SDK** | `@tanstack/react-query` (v5) + `orval` | 自动化生成的强类型 API Client Hooks、数据缓存、网络重试与右侧面板属性修改的乐观更新 |
| **8. 纯前端离线压缩打包** | `jszip` | 纯前端在浏览器内存中直接将底图、覆盖图与 `config.json` 压缩打包为 `.zip` 离线工程包 |
| **9. 优雅用户反馈与通知** | `sonner` | 高颜值毛玻璃悬浮通知 (如 `✨ 智能像素贴合完成`、`🚀 单文件 HTML 导出成功`、`🔗 短链已复制`) |
| **10. 底层内核与领域契约** | `@focusflow/player` + `@focusflow/dsl` | 画布中央 60fps 实时渲染播放视口与共享 TypeScript DSL 语法树类型契约 |

#### `apps/studio/package.json` 完整配置蓝图
```json
{
  "name": "@focusflow/studio",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@focusflow/player": "workspace:*",
    "@focusflow/dsl": "workspace:*",
    "@tanstack/react-router": "^1.50.0",
    "@tanstack/react-query": "^5.50.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@use-gesture/react": "^10.3.1",
    "zustand": "^5.0.0",
    "zundo": "^2.1.0",
    "next-themes": "^0.3.0",
    "i18next": "^23.12.0",
    "react-i18next": "^15.0.0",
    "@casl/ability": "^6.7.0",
    "@casl/react": "^4.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "jszip": "^3.10.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@focusflow/config-typescript": "workspace:*",
    "@focusflow/config-oxlint": "workspace:*",
    "@focusflow/config-tailwind": "workspace:*",
    "@tanstack/router-plugin": "^1.50.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/jszip": "^3.4.1",
    "orval": "^7.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^8.2.0"
  }
}
```

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
* **`@focusflow/config-oxlint`**：导出统一的 Oxlint 规则配置文件（`.oxlintrc.json`），实现全工作区毫秒级语法与逻辑查错；
* **`.prettierrc.json`**：全局统一的 Prettier 规则，负责 TS/TSX/JSON/CSS/MD 统一排版与美化；
* **`@focusflow/config-tailwind`**：导出暗黑/明亮双主题颜色 Token、毛玻璃模糊滤镜与动画预设。

---

### 4.8 全局跨端 Dark / Light 双主题配色系统设计规范 (Semantic Tokens & Dual-Theme Architecture)

FocusFlow 旗下所有前端应用（包括 `apps/studio`、独立导出的单文件 HTML 以及底层播放器 `packages/player`）必须 **100% 严格支持 Dark（暗黑宇宙）与 Light（极简明亮）双套配色体系**，杜绝硬编码颜色值。

#### 1. 语义化 CSS 变量 Token 映射矩阵 (`packages/config-tailwind/tokens.css`)

```css
:root {
  /* ☀️ Light 主题: 极简纯净演播室风格 (Clean Studio White) */
  --bg-app: #F8FAFC;
  --bg-canvas: #EEF2F6;
  --bg-panel: rgba(255, 255, 255, 0.92);
  --bg-card: #FFFFFF;
  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-strong: rgba(15, 23, 42, 0.16);
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --accent-cyan: #0284C7;        /* 亮色饱和科技蓝 */
  --accent-indigo: #4F46E5;      /* 亮色深邃紫 */
  --stream-glow: rgba(2, 132, 199, 0.35);
  --hud-glass-bg: rgba(255, 255, 255, 0.90);
  --hud-glass-border: rgba(15, 23, 42, 0.10);
  --shadow-hud: 0 10px 30px -5px rgba(0, 0, 0, 0.08);
}

.dark, [data-theme="dark"] {
  /* 🌙 Dark 主题: 深邃暗黑科技风 (Deep Space Neon) */
  --bg-app: #0B0F17;
  --bg-canvas: #07090E;
  --bg-panel: rgba(15, 23, 42, 0.85);
  --bg-card: #131B2E;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --accent-cyan: #06B6D4;        /* 暗黑高亮荧光青 */
  --accent-indigo: #6366F1;      /* 暗黑霓虹紫 */
  --stream-glow: rgba(6, 182, 212, 0.55);
  --hud-glass-bg: rgba(15, 23, 42, 0.82);
  --hud-glass-border: rgba(255, 255, 255, 0.12);
  --shadow-hud: 0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.15);
}
```

#### 2. React 工作台无缝主题切换 (`next-themes` 驱动)
* 在根路由 `src/routes/__root.tsx` 注入 `ThemeProvider`：
  ```tsx
  import { ThemeProvider } from 'next-themes';

  export function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    );
  }
  ```
* 顶部栏提供 `Light ☀️ / Dark 🌙 / System 💻` 三态一键切换开关，实时响应操作系统外观设置，并通过 `localStorage` 自动持久化！

#### 3. 独立离线单文件 HTML 与 Player 内核的主题自适应
* 导出的独立单文件 HTML 亦内置轻量主题切换器；
* FocusFlow DSL 支持显式声明 `theme: 'dark' | 'light' | 'auto'`，无论底图是白底还是黑底，HUD 气泡与流光动效均能达到最佳视觉对比度！

---

### 4.9 全栈端到端国际化 (i18n) 架构设计规范与语言代码标准

FocusFlow 设计了贯穿 **“Studio 创作端 + Player 内核端 + API 服务端 + 数据库存储层”** 的 4 层协同国际化架构。

```
                        【FocusFlow 全栈 i18n 协同流水线】

 🖥️ Studio 创作端 ──> i18next + react-i18next (100% 强类型 Key 智能补全与热切换)
          │
 🚀 Player 渲染端 ──> 轻量内置双语字典 (零外部依赖, 运行时体积增加 < 0.5KB)
          │
 ⚡ NestJS API 端 ──> nestjs-i18n (按 Accept-Language 返回多语言错误响应与校验文案)
          │
 🗄️ PostgreSQL 18 ──> 原生 JSONB 多语言存储 (如 title: {"zh": "微服务", "en": "Microservices"})
```

#### 1. 语言代码选型深度对比：Short Code (`zh` / `en`) vs BCP-47 (`zh-CN` / `en-US`)

| 评估维度 | 🏆 方案 A: Short Code (`zh` / `en`) | 方案 B: BCP-47 Code (`zh-CN` / `en-US`) |
| :--- | :--- | :--- |
| **数据体积与紧凑度** | 🏆 **极致紧凑**（数据库 JSONB 键名短，网络传输 Payload 更小） | ⚠️ 较冗长（每个字段多占 3~4 个字符） |
| **URL 参数与代码心智** | 🏆 **直观简洁**（如 `?lang=zh`、`t('tools.box')`、`dict.zh`） | ⚠️ 需处理大小写规范（如 `zh-cn` vs `zh-CN` 拼写不一致） |
| **方言/地区细分能力** | ⚠️ 适合通用简体中文与通用国际英语（不细分地区） | 🏆 原生支持繁体中文 (`zh-TW`)、美式 (`en-US`)、英式 (`en-GB`) |
| **FocusFlow 决策与回退策略** | **主力采纳**：数据库 JSONB 字段与通用接口全面使用 **Short Code (`zh` / `en`)**。<br>同时支持**层级回退机制**：当客户端传入 `zh-CN` 时自动匹配 `zh`，传入 `zh-TW` 时优先查找 `zh-TW`，未命中则自然回退至 `zh`。 |

---

#### 2. Studio 创作前端实现规格 (`i18next` + `react-i18next`)
* **目录组织**：`apps/studio/src/locales/zh/` 与 `apps/studio/src/locales/en/`（按 `toolbar.json`, `inspector.json`, `common.json` 模块化组织）；
* **100% 编译期类型推导**：通过 `src/i18n.d.ts` 声明合并，在组件中输入 `t('...')` 时自动获得精准 IDE 补全与防拼错检查；
* **顶部栏语言切换器**：提供 `🇨🇳 简体中文 / 🇺🇸 English` 一键无刷新热重载切换，并在 `localStorage` 自动持久化。

---

#### 3. Player 内核与独立单文件 HTML 规格 (零依赖微型字典)
* 底层渲染引擎必须保持纯粹与超轻量，**严禁引入第三方 i18n 运行时库**；
* 内核内置微型字典（约 30 行纯 TS 代码，体积 < 0.5KB），根据 `dsl.locale` 或浏览器 `navigator.language` 自动呈现“场景 1 / 4”或“Scene 1 of 4”、全屏快捷键提示等。

---

#### 4. NestJS API 后端与 DTO 错误响应规格 (`nestjs-i18n`)
* 自动拦截 HTTP `Accept-Language` 请求头进行语言协商；
* DTO 参数校验失败时自动返回当前语言的友好提示（如 `"项目名称不能为空"` vs `"Project title is required"`）。

---

#### 5. 数据库层规格 (PostgreSQL 18 原生 JSONB 模式)
* **模型定义 (`schema.prisma`)**：
  ```prisma
  model Template {
    id          String   @id @default(uuid())
    slug        String   @unique
    // 💡 采用紧凑的 Short Code JSONB 存储多语言文本
    title       Json     @db.JsonB // {"zh": "微服务全景图", "en": "Microservices Overview"}
    description Json     @db.JsonB
    tags        Json     @db.JsonB // {"zh": ["架构", "SaaS"], "en": ["Architecture", "SaaS"]}
    dslJson     Json     @db.JsonB
    createdAt   DateTime @default(now())
  }
  ```
* **NestJS 自动解包拦截器 (`I18nTransformInterceptor`)**：后端查询输出时，自动将 JSONB 多语言对象转换为当前语言的单字符串输出给前端，业务 Service 层无感！
* **DSL 视觉故事板多语言支持**：企业创作者可在 Studio 中为同一个气泡注解与连线说明配置双语文本（`textI18n: { zh: "鉴权中心", en: "Auth Center" }`），实现**“一份架构图，跨国汇报一键切英文演示”**！

---

### 4.10 全栈身份认证 (JWT)、CASL 细粒度权限与 Redis 基础设施

FocusFlow SaaS 构建了**“全局 JWT 双 Token 身份鉴权 + CASL 前后端同构细粒度授权 + Redis 7 异步队列基础设施”**的安全与并发架构。

```
                              【FocusFlow 安全与权限全景流水线】

   客户端请求 (携带 Authorization Bearer 或 HttpOnly Cookie)
          │
          ▼
   1. JwtAuthGuard (全局守卫，@Public() 白名单放行) ──> 提取当前登录 User
          │
          ▼
   2. CASL AbilityFactory (生成当前用户的动态权限能力 Ability)
          │
          ├─ 后端 NestJS: prisma.project.findMany({ where: accessibleBy(ability).Project })
          └─ 前端 Studio: <Can I="update" this={project}><SaveButton /></Can>
          │
          ▼
   3. Redis 7 分布式基础设施 (BullMQ 任务调度、接口限流与转码进度 Pub/Sub)
```

#### 1. JWT 双 Token 身份认证架构 (Authentication)
* **Access Token (短效访问凭证)**：
  * 有效期：15 分钟，载荷包含 `userId`, `email`, `role`；
  * 传输方式：HTTP `Authorization: Bearer <token>` 请求头。
* **Refresh Token (长效刷新凭证)**：
  * 有效期：7 天，存储于 PostgreSQL 用户表（哈希加盐存储），并通过 `HttpOnly; Secure; SameSite=Strict` Cookie 传输；
  * 当 Access Token 过期报 401 时，前端 Axios/Fetch 拦截器自动调用 `/api/auth/refresh` 进行无感静默续期。
* **全局 Guard 守卫与公开端点注解**：
  ```typescript
  // 公开接口豁免鉴权
  @Public()
  @Get('share/:slug')
  async getShareProject(@Param('slug') slug: string) { ... }
  ```

---

#### 2. CASL 前后端同构细粒度权限模型 (Authorization)

FocusFlow 采用 **CASL (`@casl/ability` + `@casl/prisma`)** 实现基于属性的访问控制（ABAC）：

##### A. 领域权限能力工厂 (`apps/api/src/common/casl/casl-ability.factory.ts`)
```typescript
import { AbilityBuilder, createPrismaAbility, PrismaQuery, PureAbility } from '@casl/prisma';
import { User, Project } from '@prisma/client';

export type AppAbility = PureAbility<[string, any], PrismaQuery>;

export class CaslAbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    // 1. 系统管理员拥有所有权限
    if (user.role === 'ADMIN') {
      can('manage', 'all');
      return build();
    }

    // 2. 项目权限：Owner 拥有全部读写删权限
    can('manage', 'Project', { ownerId: user.id });

    // 3. 项目权限：协同成员 (Editor) 可读写但不可删除
    can(['read', 'update'], 'Project', {
      members: { some: { userId: user.id, role: 'EDITOR' } }
    });

    // 4. 项目权限：所有用户可读取公开项目
    can('read', 'Project', { isPublic: true });

    // 5. 商业化配额控制：免费用户禁止触发 4K 渲染
    if (user.tier === 'FREE') {
      cannot('create', 'RenderJob', { resolution: '4K' }).because('4K 超清渲染为 Pro 会员专享特权');
    }

    return build();
  }
}
```

##### B. Prisma 自动生成安全 SQL (`accessibleBy`)
```typescript
// 自动根据 CASL 规则注入 SQL WHERE，杜绝人工漏写导致越权
const projects = await prisma.project.findMany({
  where: accessibleBy(userAbility).Project,
  orderBy: { updatedAt: 'desc' }
});
```

##### C. React Studio 前端 UI 声明式控制 (`@casl/react`)
```tsx
import { Can } from '@casl/react';
import { useAbility } from '@/hooks/useAbility';

export const ActionToolbar = ({ project }: { project: Project }) => {
  return (
    <div className="flex gap-2">
      {/* 仅对有编辑权限者展示保存按钮 */}
      <Can I="update" this={project}>
        <button className="btn-primary">保存修改</button>
      </Can>

      {/* 仅对 Owner 展示删除项目按钮 */}
      <Can I="delete" this={project}>
        <button className="btn-danger">删除项目</button>
      </Can>
    </div>
  );
};
```

---

#### 3. Redis 7 基础设施与 BullMQ 异步队列

##### A. 本地一键开发编排 (`docker-compose.yml`)
在 Monorepo 根目录提供标准 Docker 基础设施：
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:18-alpine
    container_name: focusflow-postgres
    environment:
      POSTGRES_DB: focusflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: focusflow-redis
    command: redis-server --appendonly yes --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

##### B. Redis 7 在 FocusFlow 中的三大职责
1. **BullMQ 任务队列与状态机**：管理 4K 视频渲染任务的分发、重试、死信队列与单节点并发限流（Concurrency Limit = 2）；
2. **实时转码进度广播**：Render Worker 逐帧渲染时通过 Redis Pub/Sub 广播进度，API 网关订阅后通过 WebSocket 直推 Studio 前端；
3. **API 限流与防刷控制**：针对免费用户的导出单文件与高频接口进行滑动窗口限流（Rate Limiting）。

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
    "format:check": {
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
    "lint": "oxlint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "turbo run typecheck",
    "changeset": "changeset"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "oxlint": "^0.15.0",
    "prettier": "^3.3.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vite": "^8.2.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

---

### 5.4 统一领域契约包声明与队列任务原型 (`packages/dsl/package.json` & `src/jobs.ts`)

#### 1. `packages/dsl/package.json`
```json
{
  "name": "@focusflow/dsl",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./jobs": {
      "types": "./dist/jobs.d.ts",
      "import": "./dist/jobs.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "@focusflow/config-typescript": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

#### 2. `packages/dsl/src/jobs.ts` (BullMQ 任务契约)
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

### 5.6 `tsconfig.base.json` 跨包复合类型引用
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

### 5.7 现代 ESM 子路径导出标准 (`packages/player/package.json`)
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

### 5.8 NestJS 主服务端子包声明 (`apps/api/package.json`)
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
    "@focusflow/database": "workspace:*",
    "@focusflow/dsl": "workspace:*",
    "@casl/ability": "^6.7.0",
    "@casl/prisma": "^1.5.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "^5.18.0",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "ioredis": "^5.4.0",
    "nestjs-cls": "^4.4.0",
    "nestjs-i18n": "^10.4.0",
    "passport-jwt": "^4.0.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.1",
    "@types/node": "^22.0.0",
    "prisma": "^5.18.0",
    "typescript": "^5.5.0"
  }
}
```

---

### 5.9 NestJS 4K 视频渲染工作节点声明 (`apps/render-worker/package.json`)
```json
{
  "name": "@focusflow/render-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main.js"
  },
  "dependencies": {
    "@focusflow/database": "workspace:*",
    "@focusflow/dsl": "workspace:*",
    "@nestjs/bullmq": "^11.0.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@remotion/bundler": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "bullmq": "^5.8.0",
    "ioredis": "^5.4.0",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0"
  }
}
```

---

### 5.10 全局代码质检与排版配置原型 (`.oxlintrc.json` & `.prettierrc.json`)

#### 1. 统一 Oxlint 规则配置文件 (`.oxlintrc.json`)
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "unicorn", "typescript", "oxc"],
  "rules": {
    "eqeqeq": "warn",
    "no-unused-vars": "error",
    "react/jsx-key": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "ignorePatterns": ["dist/**", "node_modules/**", "legacy/**"]
}
```

#### 2. 统一 Prettier 配置文件 (`.prettierrc.json`)
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

---

### 5.11 NestJS Swagger / OpenAPI 接口文档与参数强校验规范范式 (API & DTO Specifications)

在 FocusFlow 项目中，所有 NestJS 端点必须严格遵循 **“Swagger 文档 100% 覆盖 + DTO 参数强校验 + 全局 ValidationPipe”** 的企业级工程标准：

#### 1. 入口 `main.ts`：OpenAPI 文档与全局校验管道初始化
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 开启全局强参数校验与类型转换 (ValidationPipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // 自动剔除 DTO 中未声明的非法字段 (防注入)
      transform: true,              // 自动将入参转换为 DTO 类实例并进行基础类型强转
      forbidNonWhitelisted: true,   // 存在非法字段时直接抛出 400 异常
      transformOptions: { enableImplicitConversion: true }
    })
  );

  // 2. 初始化 OpenAPI (Swagger) 交互式文档
  const config = new DocumentBuilder()
    .setTitle('FocusFlow Cloud API')
    .setDescription('FocusFlow 架构图与视觉故事板 SaaS 核心 RESTful 服务')
    .setVersion('1.0.0')
    .addTag('项目管理 (Projects)', '项目 CRUD、DSL 版本快照与状态同步')
    .addTag('静态资产 (Assets)', '底图与覆盖图直传、尺寸探测与 CDN 托管')
    .addTag('单文件导出 (Exporter)', '独立 HTML 离线单文件动态内联打包')
    .addTag('视频渲染 (Render)', '4K 60fps MP4/GIF 异步转码与任务队列')
    .addTag('云端分享 (Share)', '只读演示短链路由与 iframe 嵌入分发')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // 访问路径: http://localhost:3000/api/docs

  await app.listen(3000);
}
bootstrap();
```

#### 2. DTO 层：参数校验与 OpenAPI 属性声明范式 (`create-project.dto.ts`)
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsObject } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', example: 'LuxeHMS 核心系统架构图' })
  @IsNotEmpty({ message: '项目名称不能为空' })
  @IsString({ message: '项目名称必须为字符串' })
  title: string;

  @ApiPropertyOptional({ description: '项目详细描述', example: '用于向架构委员会汇报的 4K 全景演示' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '视口设计物理基准宽度 (px)', default: 5120, example: 5120 })
  @IsInt()
  @Min(800)
  @Max(16384)
  viewportW: number;

  @ApiProperty({ description: '视口设计物理基准高度 (px)', default: 2880, example: 2880 })
  @IsInt()
  @Min(600)
  @Max(16384)
  viewportH: number;

  @ApiProperty({ description: '主底图访问 URL / S3 Key', example: 'https://cdn.focusflow.io/assets/arch.png' })
  @IsNotEmpty()
  @IsString()
  bgImageUrl: string;

  @ApiProperty({ description: '初始 FocusFlow DSL 完整 JSON 结构', type: 'object' })
  @IsNotEmpty()
  @IsObject()
  dslJson: Record<string, any>;
}
```

#### 3. Controller 层：Swagger 路由注解与响应模型规范 (`projects.controller.ts`)
```typescript
import { Controller, Post, Get, Put, Param, Body, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('项目管理 (Projects)')
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: '创建新项目', description: '初始化 FocusFlow 项目并持久化 DSL' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '项目创建成功', schema: { example: { id: 'uuid', slug: 'luxehms' } } })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '入参格式校验未通过 (DTO Validation Failed)' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情与完整 DSL', description: '根据项目 UUID 查询完整场景与资产信息' })
  @ApiParam({ name: 'id', description: '项目 UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '项目不存在' })
  async getProjectById(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '实时保存项目 DSL 与版本快照', description: 'Studio 工作台触发全量或增量 DSL 状态同步' })
  @ApiParam({ name: 'id', description: '项目 UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: '保存成功并生成版本记录' })
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto
  ) {
    return this.projectsService.update(id, dto);
  }
}
```

---

### 5.12 前后端全链路类型安全：自动化 OpenAPI 客户端 SDK 生成 (Orval + TanStack React Query)

在现代全栈 Monorepo 体系中，**严禁前端开发者手工手写 API 请求函数与 Interface 类型**。FocusFlow 采用业界最高效的 **`Orval`** 工具链，实现从 NestJS Swagger 规范到 React Query Hooks 的 **100% 全自动零代码生成**！

```
                      【前后端全链路类型安全闭环 (End-to-End Type Safety)】

   NestJS Controller (带 @ApiOperation & DTO 校验)
          │
          ▼
   生成 OpenAPI 3.0 JSON 规范 (apps/api/openapi.json)
          │
          ▼
   Orval 极速编译器 (pnpm generate:api)
          │
          ├─ 1. 自动生成 100% 强类型 TypeScript DTO 接口
          ├─ 2. 自动生成 Axios / Fetch 底层 HTTP 请求客户端
          └─ 3. 自动生成 TanStack React Query (v5) Hooks (useGetProject, useCreateProject)
          │
          ▼
   React Studio 组件中零手写直接调用: const { mutate, data } = useCreateProject();
   (一旦后端字段变动，前端 IDE 编译期红线立即预警，根绝联调 Bug 🚀)
```

#### 1. Orval 配置文件 (`apps/studio/orval.config.ts`)
```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  focusflowApi: {
    input: {
      target: '../api/openapi.json', // 读取 NestJS 导出的 OpenAPI 规范
    },
    output: {
      mode: 'tags-split',          // 按 Controller @ApiTags 自动拆分生成不同模块
      target: 'src/api/generated', // 生成的目标目录
      schemas: 'src/api/model',    // 生成的 TypeScript DTO 类型目录
      client: 'react-query',       // 🏆 自动生成 TanStack React Query v5 Hooks
      httpClient: 'fetch',         // 原生轻量 Fetch 客户端 (零 Axios 体积负担)
      override: {
        mutator: {
          path: 'src/api/custom-fetch.ts', // 自定义全局鉴权与 BaseURL 拦截器
          name: 'customFetch',
        },
      },
    },
  },
});
```

#### 2. React Studio 业务组件中的极致优雅调用示范 (`apps/studio/src/components/topbar/ProjectTitle.tsx`)
```tsx
import React from 'react';
import { useGetProjectById, useUpdateProject } from '@/api/generated/projects';

interface ProjectTitleProps {
  projectId: string;
}

export const ProjectTitle: React.FC<ProjectTitleProps> = ({ projectId }) => {
  // 1. 自动生成的 Query Hook: 拥有自动缓存、加载态、类型推导
  const { data: project, isLoading, error } = useGetProjectById(projectId);

  // 2. 自动生成的 Mutation Hook: 拥有强类型入参补全与乐观更新回调
  const { mutate: updateProject, isPending } = useUpdateProject();

  if (isLoading) return <div>加载中...</div>;

  const handleTitleChange = (newTitle: string) => {
    // 这里的入参自动与后端 UpdateProjectDto 100% 强校验绑定，字段拼错编译期直接飘红！
    updateProject({
      id: projectId,
      data: {
        title: newTitle,
      },
    });
  };

  return (
    <input
      className="font-bold bg-transparent border-b border-transparent hover:border-slate-700"
      defaultValue={project?.title}
      onBlur={(e) => handleTitleChange(e.target.value)}
      disabled={isPending}
    />
  );
};
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
