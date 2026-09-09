# FocusFlow 自动化开源投影同步工作流技术原理与架构规范
## Automated Open-Source Projection Synchronization Engine & Open-Core Specification

> **文档状态**：🚀 **工程架构标准 · 生产环境已落地**  
> **制定日期**：2026-09-09  
> **核心工具**：[`scripts/sync-oss.js`](file:///Users/xt/WebstormProjects/focusflow/scripts/sync-oss.js)  
> **调用命令**：`pnpm sync:oss` / `pnpm sync:oss --force`  
> **关联架构**：
> - 📄 [OPEN_SOURCE_LAUNCH_PLAYBOOK.md (全景开源商业化操盘手册)](file:///Users/xt/WebstormProjects/focusflow/docs-internal/OPEN_SOURCE_LAUNCH_PLAYBOOK.md)
> - 📐 [MONOREPO_SPEC.md (Monorepo 架构与 Open-Core 规范)](file:///Users/xt/WebstormProjects/focusflow/design/MONOREPO_SPEC.md)

---

## 1. 架构背景与核心痛点

### 1.1 商业开源（COSS）的核心矛盾
在商业开源（Commercial Open Source Software, COSS）软件的生命周期中，存在一对经典的架构矛盾：
1. **开源生态获客需求（模式 A）**：必须将高价值、低门槛的单机版内核与创作工作台（`@focusflow/player`、`@focusflow/dsl`、`@focusflow/studio`）完全开源，发布到 GitHub 建立庞大的开发者心智、获取 Star 与社区贡献；
2. **商业变现与数据主权需求（模式 B）**：企业的核心 SaaS 云服务（`apps/api` 鉴权微服务、`apps/render-worker` 4K 批量渲染集群、`packages/database` 多租户商业数据模型）以及商业战略文档（定价策略、出海宣发 Playbook、PRD 研发复盘）必须**绝对物理隔离**，绝不能泄漏至 GitHub 公共空间。

### 1.2 传统方案的缺陷对比
为解决上述矛盾，业界传统方案通常存在明显硬伤：

| 方案 | 运作机制 | 致命缺陷 |
| :--- | :--- | :--- |
| **双独立仓库 (Two Repos)** | 开源放 Repo A，云端放 Repo B，私有包发 npm | 研发割裂，无法在一个 VS Code 窗口中跨端重构；DSL 类型契约修改后无法毫秒级热重载；CI 维护成本翻倍。 |
| **Git Submodule** | 私有主仓通过子模块嵌套开源子仓 | 极易出现“游离头指针（Detached HEAD）”；子模块版本锁死繁琐；团队新人拉取代码极易报错。 |
| **Git Subtree** | 通过 `git subtree split` 切出单一目录推送到公仓 | **仅支持单一 prefix 目录**（如只推 `packages/player`），无法一次性聚合 `apps/*`、`packages/*`、`docs/*` 与根目录配置文件。 |
| **Google Copybara** | 基于 Java 规则引擎做仓库间代码搬运 | 需额外安装配置复杂的 Java 运行时与 Skylark 规则文件，对中小全栈团队过于繁重冗余。 |

### 1.3 FocusFlow 的创新解法：基于轻量影子工作区的「开源目录投影引擎」
FocusFlow 自主设计并落地了 **`scripts/sync-oss.js`**，采用**“单一全量真理之源（内部 Gitea Monorepo）+ 自动化白名单隔离投影（GitHub 外部开源仓）”**模式。

---

## 2. 系统架构与拓扑流程全景

```
       ┌─────────────────────────────────────────────────────────────┐
       │     内部私有 Monorepo (Single Source of Truth - Gitea)      │
       │  • 包含全量模式 A（开源单机）+ 模式 B（商业云端）全部代码资产 │
       │  • 包含内部商业机密 docs-internal/、产品设计全案 design/    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
               日常开发提交:           │ 周期性开源同步:
               git push origin main   │ pnpm sync:oss
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │    scripts/sync-oss.js 引擎   │
                      └───────────────┬───────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │ (1) 申请系统临时沙箱        │ (2) 浅克隆 GitHub main     │ (3) 物理排空现有非 .git
         │     /tmp/focusflow-oss-xxx │     --depth 1              │     构建资产
         └────────────────────────────┼────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │ (4) 遍历提取白名单目录      │ (5) 黑名单熔断安全哨兵     │ (6) Git Porcelain
         │     (Player/DSL/Studio...) │     (强检无私有文件残留)   │     真实差分感知
         └────────────────────────────┼────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │ (7) 自动装配语义提交       │ (8) 推流对齐 GitHub main   │ (9) 销毁并回收临时沙箱
         │     chore(sync): ...       │     git push origin main   │     零磁盘空间残留
         └────────────────────────────┴────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │            外部 GitHub 公共开源仓 (Public OSS Repo)          │
       │  • 仅含 @focusflow/player, @focusflow/dsl, apps/studio      │
       │  • 仅含公开技术白皮书 docs/、工程规范 tooling/              │
       │  • 0 模式 B 代码、0 商业战略、0 历史测试残片                │
       └─────────────────────────────────────────────────────────────┘
```

---

## 3. `sync-oss.js` 9 步原子化流水线执行原理

### Step 1: 系统隔离环境分配 (OS Sandbox Allocation)
* 引擎调用 Node.js `fs.mkdtempSync(path.join(os.tmpdir(), 'focusflow-oss-'))`，在操作系统的临时目录下创建一个专用的影子工作区（如 `/tmp/focusflow-oss-xxxxxx`）。
* **优势**：所有 Git 操作完全在独立目录发生，绝对不污染或修改开发者当前工程的 Git 分支、工作区（Working Tree）、Stash 缓存或暂存区。

### Step 2: 目标端轻量抓取 (Shallow Clone)
* 引擎在影子工作区内执行：
  ```bash
  git clone --depth 1 -b main git@github.com:tumio-ltd/focusflow.git .
  ```
* **优势**：使用 `--depth 1` 浅层克隆，只下载目标分支最新单次提交的元数据（耗时通常 $< 1.5\text{s}$），极大节约网络带宽与同步耗时。

### Step 3: 影子工作区全量净空 (Staging Non-Git Evacuation)
* 遍历影子工作区根目录，**保留 `.git` 目录，强制递归删除其余所有文件和子目录**。
* **目的**：确保 GitHub 远端历史存在的旧文件（如之前已被废弃删除的 `poc/`、`legacy/`、旧文档）能够被正确感知为 `delete mode`，实现 100% 精确的单向状态对齐。

### Step 4: 白名单递归投影与构建产物过滤 (Whitelist Copy & Filtering)
* 引擎严格按照 **`OSS_WHITELIST`** 清单，逐一将本地工作区的资产递归拷贝至影子工作区：
  ```javascript
  const OSS_WHITELIST = [
    'apps/studio',                  // 创作工作台单机版
    'packages/player',              // 核心渲染引擎
    'packages/dsl',                 // DSL 契约定义
    'packages/config-oxlint',       // 共享代码质检配置
    'packages/config-tailwind',     // 共享设计系统 Token
    'packages/config-typescript',   // 共享编译配置
    'examples',                     // 官方架构图实战示例
    'docs',                         // 面向社区的技术白皮书与开发指南
    'scripts',                      // 导出与构建工具 CLI
    'package.json',                 // 统一 Monorepo 根依赖
    'pnpm-lock.yaml',               // 锁版本保障全新 clone 一致性
    'pnpm-workspace.yaml',          // pnpm 工作区声明
    'turbo.json',                   // Turborepo 构建管线定义
    'tsconfig.base.json',           // TypeScript 基础引用
    'vite.config.js',               // 本地门户服务配置
    'CHANGELOG.md',                 // 公开版本变更日志
    'LICENSE',                      // 开源双协议声明
    'README.md',                    // 官方公开门面
    'index.html',                   // 门户挂载页
    '.changeset',                   // 多包语义化版本工具
    '.oxlintrc.json',               // 代码扫描规则
    '.prettierrc.json',             // 代码美化规范
    '.gitignore'                    // 忽略配置
  ];
  ```
* **深度防噪过滤**：在递归拷贝过程中，引擎内置过滤机制，主动跳过 `node_modules`、`.git`、`dist`、`.turbo`、`.DS_Store` 等中间过程与临时产物，确保进入影子工作区的只有最干净的纯源码。

### Step 5: 黑名单安全熔断哨兵 (Circuit Breaker Blacklist Verification)
* 拷贝完成后，引擎会主动触发二次硬核安检：
  ```javascript
  const PRIVATE_BLACKLIST = [
    'docs-internal',        // 商业与宣发机密文档
    'design',               // 产品全案 PRD 与研发总结
    'legacy',               // 历史归档
    'apps/api',             // 模式 B：NestJS SaaS API 微服务
    'apps/render-worker',   // 模式 B：服务端无头渲染集群
    'packages/database',    // 模式 B：Prisma 商业数据模型
    '.env',                 // 任何环境变量文件
    '.env.local'
  ];
  ```
* **熔断机制**：只要在影子工作区中扫描到上述任何路径存在，**引擎立即抛出 `SECURITY VIOLATION` 异常并强行退出 (`process.exit(1)`)**，杜绝因白名单误配导致的泄密。

### Step 6: 差分引擎与变更感知 (Git Porcelain Diff Inspection)
* 执行 `git status --porcelain`。
* **幂等性保障**：如果检测到没有实质变更，引擎输出 `✅ GitHub open-source repository is already up to date` 并正常结束，绝不向 GitHub 提交冗余无意义的空 Commit。

### Step 7: 规范化语义提交构建 (Semantic Conventional Commit Packaging)
* 当检测到真实源码增量或文件修改时，引擎自动将变更全部暂存 (`git add -A`)，并根据当前系统时间戳动态合成符合 Angular/Conventional Commits 规范的提交信息：
  ```text
  chore(sync): update open-source projection from internal monorepo (YYYY-MM-DD)
  ```

### Step 8: 安全推流与远端分支对齐 (Authenticated Branch Projection Push)
* 引擎在影子工作区内直接向 GitHub 远端推流：
  ```bash
  git push origin main
  ```
* 如传入 `--force` 参数（例如首次规范重构对齐时），则使用 `git push --force origin main`。

### Step 9: 临时生命周期回收与零污染保障 (Lifecycle Teardown)
* 在 `try ... finally` 代码块保障下，无论同步成功还是异常中断，引擎都会强制递归清理 `/tmp/focusflow-oss-xxxxxx` 临时沙箱，确保开发者宿主机环境永远保持干净整洁。

---

## 4. 团队日常协同开发准则

### 4.1 研发日常行为准则（单仓库零心智负担）
1. **默认远端唯一化**：
   - 团队成员本地的 Git `origin` 统一绑定私有 Gitea 地址：
     ```bash
     origin https://git.tumio.site/tumio/focusflow.git
     ```
   - 开发者平时所有的日常开发、分支合并、特性提交，均只需使用标准的 `git commit` 和 `git push origin <branch>`。
2. **模式 B 新功能开发**：
   - 当开始研发模式 B（云端 SaaS）时，后端 NestJS 代码可直接创建在 `apps/api/`，数据库 Schema 直接写在 `packages/database/`。
   - 所有这些新代码天然在 GitHub 黑名单管控中，开发者无需时刻提心吊胆担心误推外泄。

### 4.2 开源同步发版触发点
在以下任一场景发生时，由核心维护者运行一次同步指令：
1. **正式发版（Release Tagging）**：通过 `@changesets/cli` 提升了 `@focusflow/player` 或 `@focusflow/studio` 的版本号；
2. **重要特性或 Bugfix 完成**：单机版完成了重要体验优化或修复；
3. **指令操作**：
   ```bash
   # 常规增量同步
   pnpm sync:oss

   # 首次对齐或历史重写时强制覆盖对齐
   pnpm sync:oss --force
   ```

### 4.3 处理外部开源社区 PR 的回流机制 (Inbound PR Ingestion)
当 GitHub 上有外部开源贡献者提交了 Pull Request 时：
1. 在 GitHub 网页端进行 Code Review 并正常点击 **Squash and Merge**；
2. 本地开发者在内部 Monorepo 中拉取该分支补丁：
   ```bash
   # 从 GitHub 拉取社区贡献的代码补丁合入内部主仓
   git fetch github main
   git cherry-pick <commit-hash>
   # 或 git merge github/main
   git push origin main
   ```
3. 社区贡献的代码自然融入内部全量 Monorepo，并随内部 Gitea 自动备份与流转。

---

## 5. 常见异常与应急处理

| 故障现象 | 根因分析 | 推荐处理措施 |
| :--- | :--- | :--- |
| **`Permission to tumio-ltd/focusflow.git denied`** | 本地机器未正确配置 GitHub SSH 密钥访问权限 | 检查 `~/.ssh/id_ed25519.pub` 是否已添加至 GitHub 账号，并验证 `ssh -T git@github.com`。 |
| **`SECURITY VIOLATION: Blacklisted path found`** | 某个被黑名单禁止的文件或文件夹意外出现在了白名单拷贝逻辑中 | 检查本地是否在公开目录下误放了敏感文件（如在 `docs/` 放置了 PRD），将其移入 `docs-internal/` 后重试。 |
| **`failed to push some refs to github.com` (Non-fast-forward)** | GitHub 远端存在未合并的独立提交历史 | 确认 GitHub 上无外部重要变更后，执行 `pnpm sync:oss --force` 强行覆盖对齐，或先通过临时分支合并。 |

---

> [!NOTE]
> 本机制使 FocusFlow 能够在兼顾**绝对商业机密隔离**的同时，享受到**统一 Monorepo 的极致开发协同与类型共享体验**，是现代 COSS 商业开源项目最敏捷、成本最低的工业级实施典范。
