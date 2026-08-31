# 🛠️ FocusFlow · pnpm 脚本与工程开发指令全景指南

| 元数据项 | 说明 |
| :--- | :--- |
| **文档版本** | `v1.0.0` |
| **更新日期** | `2026-08-31` |
| **适用架构** | FocusFlow Monorepo（Turborepo + pnpm Workspace） |
| **维护团队** | FocusFlow Core Architecture Working Group |

---

## 📑 目录导航

- [1. 常用开发与构建速查表](#1-常用开发与构建速查表)
- [2. 根目录全局脚本详解 (Root Scripts)](#2-根目录全局脚本详解-root-scripts)
  - [2.1 本地开发与调试](#21-本地开发与调试)
  - [2.2 质量门禁与格式化](#22-质量门禁与格式化)
  - [2.3 生产构建与版本管理](#23-生产构建与版本管理)
- [3. 工作区应用与子包脚本 (Workspace Packages)](#3-工作区应用与子包脚本-workspace-packages)
  - [3.1 `apps/studio`（可视化工作台）](#31-appsstudio可视化工作台)
  - [3.2 `packages/player`（核心播放引擎）](#32-packagesplayer核心播放引擎)
  - [3.3 `packages/dsl`（DSL 语法规范与类型）](#33-packagesdsldsl-语法规范与类型)
- [4. 数据库与基础设施运维指令](#4-数据库与基础设施运维指令)
- [5. 高级技巧与过滤执行范式](#5-高级技巧与过滤执行范式)

---

## 1. 常用开发与构建速查表

```bash
# 1. 启动 Studio 可视化工作台开发环境 (推荐，端口: 5174)
pnpm dev:studio

# 2. 执行全库静态检查 (Oxlint 毫秒级极速质检)
pnpm lint

# 3. 执行全库 TypeScript 复合类型校验
pnpm typecheck

# 4. 执行全量 23 项 Playwright E2E 端到端自动化测试
pnpm --filter @focusflow/studio test:e2e

# 5. 查看 E2E 测试可视化 HTML 报告
pnpm --filter @focusflow/studio test:e2e:report

# 6. 全库生产包拓扑构建
pnpm build
```

---

## 2. 根目录全局脚本详解 (Root Scripts)

在项目根目录下直接运行的命令，由 Turborepo 统一调度与缓存加速：

### 2.1 本地开发与调试

| 命令 | 底层实现 | 说明 |
| :--- | :--- | :--- |
| `pnpm dev` | `turbo run dev` | 并行启动所有配置了 `dev` 任务的应用与服务 |
| `pnpm dev:studio` | `turbo run dev --filter=@focusflow/studio` | 专享启动 Studio 工作台（Vite HMR，默认地址 `http://localhost:5174`） |
| `pnpm dev:api` | `turbo run dev --filter=@focusflow/api` | 启动后端 BFF 服务（NestJS / Fastify，预备模式 B） |
| `pnpm dev:worker` | `turbo run dev --filter=@focusflow/render-worker` | 启动 4K 视频云渲染 Worker（预备模式 B） |
| `pnpm dev:player` | `vite` | 单独启动 Player 示例预览环境 |

### 2.2 质量门禁与格式化

| 命令 | 底层实现 | 说明 |
| :--- | :--- | :--- |
| `pnpm lint` | `oxlint .` | 使用 Rust 驱动的 Oxlint 极速扫描全库（20~30ms 内完成，0 容忍警告与错误） |
| `pnpm typecheck` | `turbo run typecheck` | 触发全库各 Package 的 `tsc --noEmit`，进行强类型复合校验 |
| `pnpm format` | `prettier --write .` | 使用 Prettier 自动格式化全库代码风格 |
| `pnpm format:check` | `prettier --check .` | 检查全库代码是否符合 Prettier 格式化规范 |

### 2.3 生产构建与版本管理

| 命令 | 底层实现 | 说明 |
| :--- | :--- | :--- |
| `pnpm build` | `turbo run build` | 按拓扑依赖顺序编译 `@focusflow/dsl`、`@focusflow/player` 与 `@focusflow/studio` |
| `pnpm build:standalone` | `node scripts/build-standalone.js examples/luxehms` | 针对指定案例生成单文件离线 HTML 演示包 |
| `pnpm create:project` | `node scripts/create-project.js` | 交互式命令行脚手架，快速创建新工程目录骨架 |
| `pnpm changeset` | `changeset` | 交互式生成 Monorepo 语义化版本变更说明集 |

---

## 3. 工作区应用与子包脚本 (Workspace Packages)

可以通过 `pnpm --filter <包名> <脚本名>` 精准针对特定子模块执行指令：

### 3.1 `apps/studio`（可视化工作台）

工作区包名：`@focusflow/studio`

| 命令 | 说明 |
| :--- | :--- |
| `pnpm --filter @focusflow/studio dev` | 启动 Studio 本地 Vite 开发服务器 (`http://localhost:5174`) |
| `pnpm --filter @focusflow/studio build` | 执行 `tsc && vite build` 生成 Studio 生产环境静态资源 |
| `pnpm --filter @focusflow/studio preview` | 本地启动 HTTP 服务器预览 `dist/` 生产构建产物 |
| `pnpm --filter @focusflow/studio typecheck` | 对 Studio 前端组件、Hooks、Store 进行纯类型检查 |
| `pnpm --filter @focusflow/studio test:e2e` | 启动 Playwright 并发执行 23 项端到端全流程测试 |
| `pnpm --filter @focusflow/studio test:e2e:report` | 本地启动 Playwright 可视化 HTML 测试报告网页服务 |
| `pnpm --filter @focusflow/studio test:e2e:archive` | 将当前最新测试报告复制并带精确时间戳永久归档至 `playwright-reports/` |

### 3.2 `packages/player`（核心播放引擎）

工作区包名：`@focusflow/player`

| 命令 | 说明 |
| :--- | :--- |
| `pnpm --filter @focusflow/player build` | 构建并输出 `dist/focusflow.es.js` (ESM) 与 `dist/focusflow.iife.js` (自包含 IIFE) |
| `pnpm --filter @focusflow/player dev` | 启动播放引擎的实时开发与调试模式 |
| `pnpm --filter @focusflow/player typecheck` | 验证播放引擎公开 API 与 `.d.ts` 类型声明正确性 |

### 3.3 `packages/dsl`（DSL 语法规范与类型）

工作区包名：`@focusflow/dsl`

| 命令 | 说明 |
| :--- | :--- |
| `pnpm --filter @focusflow/dsl build` | 执行 `tsc` 编译生成 AST 声明文件与分发包 |
| `pnpm --filter @focusflow/dsl dev` | `tsc --watch` 实时监视 DSL 规范代码变动 |
| `pnpm --filter @focusflow/dsl typecheck` | 校验 DSL 复合 Schema 类型定义 |

---

## 4. 数据库与基础设施运维指令

适用于模式 B（云端全栈 SaaS）数据层：

| 命令 | 底层实现 | 说明 |
| :--- | :--- | :--- |
| `pnpm db:migrate` | `pnpm --filter=@focusflow/database prisma migrate dev` | 执行 Prisma 数据库结构迁移并同步至 PostgreSQL 18 |
| `pnpm db:studio` | `pnpm --filter=@focusflow/database prisma studio` | 启动 Prisma 官方 Web 版可视化数据库管理控制台 |

---

## 5. 高级技巧与过滤执行范式

### 🎯 仅运行指定文件的 E2E 测试
```bash
# 仅执行 Stage 5 的导出测试套件
pnpm --filter @focusflow/studio exec playwright test e2e/stage5-export-compiler.spec.ts

# 单 Worker 串行调试模式（打印控制台细节）
pnpm --filter @focusflow/studio exec playwright test --workers=1
```

### ⚡ 忽略缓存强制全量重新构建
```bash
pnpm build --force
```

### 🧹 清理全库构建产物与依赖缓存
```bash
# 清理各包下的 dist 与 .turbo 缓存目录
rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist packages/*/dist .turbo
pnpm install
```

---
*FocusFlow Architecture Working Group · 2026.08*
