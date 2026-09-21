<p align="right">
  <strong>English</strong> • <a href="./00_PNPM_SCRIPTS.zh-CN.md">简体中文</a>
</p>

# 🛠️ FocusFlow · pnpm Scripts & Monorepo Development Guide

| Metadata | Description |
| :--- | :--- |
| **Specification Version** | `v1.0.0` |
| **Last Updated** | `2026-08-31` |
| **Architecture** | FocusFlow Monorepo (Turborepo + pnpm Workspace) |
| **Target Audience** | FocusFlow Core Developers & Open Source Contributors |

---

## 📑 Table of Contents

- [1. Quick Command Cheat Sheet](#1-quick-command-cheat-sheet)
- [2. Root Global Scripts](#2-root-global-scripts)
  - [2.1 Local Development & Debugging](#21-local-development--debugging)
  - [2.2 Quality Gates & Code Formatting](#22-quality-gates--code-formatting)
  - [2.3 Production Builds & Release Management](#23-production-builds--release-management)
- [3. Workspace Packages Scripts](#3-workspace-packages-scripts)
  - [3.1 `apps/studio` (Visual Workbench)](#31-appsstudio-visual-workbench)
  - [3.2 `packages/player` (Core Playback Engine)](#32-packagesplayer-core-playback-engine)
  - [3.3 `packages/dsl` (DSL Specification & Type Definitions)](#33-packagesdsl-dsl-specification--type-definitions)
- [4. Database & Infrastructure Operations](#4-database--infrastructure-operations)
- [5. Advanced Tips & Filter Execution Patterns](#5-advanced-tips--filter-execution-patterns)

---

## 1. Quick Command Cheat Sheet

```bash
# 1. Start Studio visual workbench development server (recommended, default port: 5174)
pnpm dev:studio

# 2. Run blazing-fast linting across the monorepo (Oxlint Rust-powered linter)
pnpm lint

# 3. Check TypeScript types across all workspaces
pnpm typecheck

# 4. Run all 23 Playwright E2E integration tests
pnpm --filter @focusflow/studio test:e2e

# 5. Open visual HTML report for E2E test runs
pnpm --filter @focusflow/studio test:e2e:report

# 6. Build production bundles for all packages in topological order
pnpm build
```

---

## 2. Root Global Scripts

Commands executed directly from the monorepo root, orchestrated and accelerated by Turborepo:

### 2.1 Local Development & Debugging

| Command | Underlying Script | Description |
| :--- | :--- | :--- |
| `pnpm dev` | `turbo run dev` | Concurrently start all workspaces configured with `dev` tasks |
| `pnpm dev:studio` | `turbo run dev --filter=@focusflow/studio` | Launch Studio workbench exclusively (Vite HMR at `http://localhost:5174`) |
| `pnpm dev:api` | `turbo run dev --filter=@focusflow/api` | Start backend BFF server (NestJS / Fastify, Mode B preparation) |
| `pnpm dev:worker` | `turbo run dev --filter=@focusflow/render-worker` | Start 4K video cloud render worker (Mode B preparation) |
| `pnpm dev:player` | `vite` | Launch isolated Player demo preview environment |

### 2.2 Quality Gates & Code Formatting

| Command | Underlying Script | Description |
| :--- | :--- | :--- |
| `pnpm lint` | `oxlint .` | Instant monorepo scanning via Rust-powered Oxlint (completes in 20~30ms, zero tolerance for errors/warnings) |
| `pnpm typecheck` | `turbo run typecheck` | Trigger `tsc --noEmit` across all packages for strict composite type verification |
| `pnpm format` | `prettier --write .` | Automatically reformat all code styles across the repository using Prettier |
| `pnpm format:check` | `prettier --check .` | Verify codebase compliance with Prettier rules without modifying files |

### 2.3 Production Builds & Release Management

| Command | Underlying Script | Description |
| :--- | :--- | :--- |
| `pnpm build` | `turbo run build` | Compile `@focusflow/dsl`, `@focusflow/player`, and `@focusflow/studio` in topological dependency order |
| `pnpm build:standalone` | `node scripts/build-standalone.js examples/luxehms` | Compile a designated project into a single-file zero-dependency offline HTML package |
| `pnpm create:project` | `node scripts/create-project.js` | Interactive CLI scaffolding wizard to quickly bootstrap new project directory skeletons |
| `pnpm changeset` | `changeset` | Interactive semver bump and changelog generation tool for monorepo packages |

---

## 3. Workspace Packages Scripts

Target individual packages directly using `pnpm --filter <package-name> <command>`:

### 3.1 `apps/studio` (Visual Workbench)

Workspace package: `@focusflow/studio`

| Command | Description |
| :--- | :--- |
| `pnpm --filter @focusflow/studio dev` | Start local Vite dev server with Hot Module Replacement (`http://localhost:5174`) |
| `pnpm --filter @focusflow/studio build` | Execute `tsc && vite build` to generate production static assets in `apps/studio/dist` |
| `pnpm --filter @focusflow/studio preview` | Spin up a local HTTP server to preview built production bundle |
| `pnpm --filter @focusflow/studio typecheck` | Strict type checking for React components, custom hooks, and Zustand stores |
| `pnpm --filter @focusflow/studio test:e2e` | Launch Playwright to execute all 23 end-to-end user journey tests |
| `pnpm --filter @focusflow/studio test:e2e:report` | Serve visual HTML Playwright test run report locally |
| `pnpm --filter @focusflow/studio test:e2e:archive` | Archive latest test reports with ISO timestamps permanently to `playwright-reports/` |

### 3.2 `packages/player` (Core Playback Engine)

Workspace package: `@focusflow/player`

| Command | Description |
| :--- | :--- |
| `pnpm --filter @focusflow/player build` | Bundle and emit `dist/focusflow.es.js` (ESM) and `dist/focusflow.iife.js` (self-contained IIFE) |
| `pnpm --filter @focusflow/player dev` | Start live watch and rebuild mode for the playback engine |
| `pnpm --filter @focusflow/player typecheck` | Validate public API surface and `.d.ts` declaration file accuracy |

### 3.3 `packages/dsl` (DSL Specification & Type Definitions)

Workspace package: `@focusflow/dsl`

| Command | Description |
| :--- | :--- |
| `pnpm --filter @focusflow/dsl build` | Compile DSL AST declarations, validators, and distribution bundles via `tsc` |
| `pnpm --filter @focusflow/dsl dev` | Run `tsc --watch` for real-time validation during DSL schema evolution |
| `pnpm --filter @focusflow/dsl typecheck` | Check DSL composite schema and geometry type definitions |

---

## 4. Database & Infrastructure Operations

Applicable to Mode B (Cloud SaaS) persistence tier:

| Command | Underlying Script | Description |
| :--- | :--- | :--- |
| `pnpm db:migrate` | `pnpm --filter=@focusflow/database prisma migrate dev` | Execute Prisma schema migrations against PostgreSQL 18 |
| `pnpm db:studio` | `pnpm --filter=@focusflow/database prisma studio` | Open Prisma Studio Web UI to inspect database tables |

---

## 5. Advanced Tips & Filter Execution Patterns

### 🎯 Run a Single E2E Test Suite
```bash
# Execute only the Stage 5 export compiler test suite
pnpm --filter @focusflow/studio exec playwright test e2e/stage5-export-compiler.spec.ts

# Debug in serial single-worker mode with verbose console output
pnpm --filter @focusflow/studio exec playwright test --workers=1
```

### ⚡ Force Full Rebuild Bypassing Cache
```bash
pnpm build --force
```

### 🧹 Deep Clean Build Artifacts & Dependency Caches
```bash
# Clean dist and .turbo caches across all packages
rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/*/dist packages/*/dist .turbo
pnpm install
```

---
*FocusFlow Architecture Working Group · 2026.08*
