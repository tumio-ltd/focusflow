# FocusFlow - 开源发布全流程执行指南与落地手册
## FocusFlow Open-Source Launch Playbook & Execution Checklist

> **文档版本**：`v1.1.0`（生产就绪深化版）  
> **制定/更新日期**：`2026-09-09`  
> **当前技术基线**：Phase 2 Studio 模式 A（纯前端离线单机工作台）**100% 开发完成**，涵盖 Stage 1 ~ Stage 5.7（含音频时间轴对齐与无头渲染 CLI），**52 项 Playwright E2E 自动化测试全量通过**。  
> **战略定位**：以“零依赖单文件交付、纯本地离线隐私、60fps 电影级架构图叙事、音画智能同步与 Agent 自动化视频管线”为核心卖点，打造 GitHub 3k~5k Stars 的现象级开源项目，抢占“架构图动态叙事”品类绝对定义权。  
> **关联战略专刊**：
> - 📄 [docs/COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md (商业化与开源战略指南)](./COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md)
> - 🎨 [design/STUDIO_SPEC.md (Phase 2 可视化创作工作台规格)](../design/STUDIO_SPEC.md)
> - 🌌 [design/PARALLAX_AND_SCROLLYTELLING_SPEC.md (视差深度与滚轮交互叙事规范)](../design/PARALLAX_AND_SCROLLYTELLING_SPEC.md)
> - 🏗️ [design/MONOREPO_SPEC.md (Monorepo 架构规范)](../design/MONOREPO_SPEC.md)

---

## 目录 (Table of Contents)

- [1. 开源发布的总体战略与时间表](#1-开源发布的总体战略与时间表)
  - [1.1 核心价值四大支柱 (The 4 Core Pillars)](#11-核心价值四大支柱-the-4-core-pillars)
  - [1.2 五阶段推进路线图与发布时间窗口](#12-五阶段推进路线图与发布时间窗口)
- [2. 阶段一：仓库安全审计、合规与工程精简 (Hardening & Sanitization)](#2-阶段一仓库安全审计合规与工程精简-hardening--sanitization)
  - [2.1 双轨开源协议落地 (License Placement)](#21-双轨开源协议落地-license-placement)
  - [2.2 敏感信息与本地绝对路径全面脱敏](#22-敏感信息与本地绝对路径全面脱敏)
  - [2.3 冗余目录精简与构建规范化](#23-冗余目录精简与构建规范化)
  - [2.4 `.gitignore` 规则加固](#24-gitignore-规则加固)
- [3. 阶段二：顶级门面包装与多圈层视觉物料 (Brand Facade & Visuals)](#3-阶段二顶级门面包装与多圈层视觉物料-brand-facade--visuals)
  - [3.1 30 秒高能 Hero 动图与分镜脚本](#31-30-秒高能-hero-动图与分镜脚本)
  - [3.2 三类目标受众的痛点穿透与文案定位](#32-三类目标受众的痛点穿透与文案定位)
  - [3.3 双语高水准 `README.md` 架构设计](#33-双语高水准-readmemd-架构设计)
  - [3.4 社区规范治理套件 (Community Health)](#34-社区规范治理套件-community-health)
- [4. 阶段三：零成本在线体验站与自动化 CI/CD (Live Demo & Pipelines)](#4-阶段三零成本在线体验站与自动化-cicd-live-demo--pipelines)
  - [4.1 纯前端单机版静态托管部署方案](#41-纯前端单机版静态托管部署方案)
  - [4.2 6 大行业模板开箱即用保障](#42-6-大行业模板开箱即用保障)
  - [4.3 GitHub Actions CI/CD 流水线落地](#43-github-actions-cicd-流水线落地)
- [5. 阶段四：出海全网冷启动宣发推广 (Global Launch & Go-To-Market)](#5-阶段四出海全网冷启动宣发推广-global-launch--go-to-market)
  - [5.1 宣发黄金时间窗口 (Golden Timing)](#51-宣发黄金时间窗口-golden-timing)
  - [5.2 渠道分发实战策略与文案模板](#52-渠道分发实战策略与文案模板)
- [6. 阶段五：社区运营与商业反向转化闭环 (Community & Conversion)](#6-阶段五社区运营与商业反向转化闭环-community--conversion)
  - [6.1 付费需求线索雷达 (Lead Radar)](#61-付费需求线索雷达-lead-radar)
  - [6.2 流量飞轮与云端 SaaS 转化漏斗](#62-流量飞轮与云端-saas-转化漏斗)
- [7. 全流程执行任务 Checklist (全景详细分解清单)](#7-全流程执行任务-checklist-全景详细分解清单)

---

## 1. 开源发布的总体战略与时间表

### 1.1 核心价值四大支柱 (The 4 Core Pillars)

不同于常规的前端绘图工具，FocusFlow 开源版本的核心竞争力建立在以下四大不可替代的技术壁垒之上：

```
┌────────────────────────────────────────────────────────────────────────┐
│               FocusFlow 开源发布四大核心技术壁垒 (4 Pillars)            │
├───────────────────────────────────┬────────────────────────────────────┤
│ 🛡️ 1. 纯前端零依赖独立交付        │ 🎬 2. 60fps 电影级运镜与智能吸附   │
│ • 纯离线运行，数据绝不出浏览器     │ • 无限平滑缩放平移 (Zoom to Cursor)│
│ • 一键导出单文件 HTML，双击即播   │ • 3×3 Sobel 算子像素级边缘强吸附   │
│ • 内置 ZIP 全量离线归档编译器     │ • 三次贝塞尔流光拓扑与霓虹高亮     │
├───────────────────────────────────┼────────────────────────────────────┤
│ 🎙️ 3. 音画同步与智能旁白合成      │ 🤖 4. 无头渲染 CLI 与 Agent 管线   │
│ • 多线程 Web Worker 提取波形峰值  │ • Playwright CDP 虚拟时钟确定性渲染│
│ • 激光红线播放头实时点击与拖拽    │ • 60fps 绝对零丢帧 WebM/MP4 输出   │
│ • 离线 TTS 自适应拉伸场景时长     │ • NDJSON 结构化流协议与自愈建议    │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 1.2 五阶段推进路线图与发布时间窗口

```
                                  【开源发布 5 阶段路线图】

    [阶段 1: 仓库合规与安全脱敏] ──> [阶段 2: 顶级门面与视觉物料] ──> [阶段 3: Demo 部署与 CI 基建]
            (预计耗时: 1 天)                  (预计耗时: 2 天)                  (预计耗时: 1 天)
                                                                                  │
                                                                                  ▼
    [阶段 5: 社区运营与商业转化] <── [阶段 4: 全网多渠道冷启动宣发] <─────────────────┘
            (长期持续运营)                     (Launch Day + 首周)
```

* **发布时间窗口评估**：
  当前模式 A 已完成全部功能，并通过了 52 项严苛的 Playwright E2E 测试。代码库健壮度极高，处于开源的**最佳窗口期（Prime Launch Window）**。

---

## 2. 阶段一：仓库安全审计、合规与工程精简 (Hardening & Sanitization)

### 2.1 双轨开源协议落地 (License Placement)
根据 [`COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md`](./COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md) 确立的双轨协议：
1. **核心渲染内核与 DSL**：
   - `packages/player` 与 `packages/dsl` 采用 **MIT License**；
   - 目标：最大化降低开源社区、技术博主与企业团队嵌入成本。在播放器右下角保留微型 `Powered by FocusFlow` 标识，形成持续的反向反链与 SEO 资产；
2. **可视化创作工作台**：
   - `apps/studio` 采用 **AGPL-3.0**（或 BSL 1.1 / Elastic License v2 变体）；
   - 目标：允许个人或内部团队免费本地使用，但从法律上封死竞争者直接将 Studio 前端套壳上线云端 SaaS 盈利的漏洞；
3. **根目录主许可文件**：
   - 创建根目录 `LICENSE`，明确声明双轨条款；在各子包 `package.json` 中明确声明 `"license"` 字段。

### 2.2 敏感信息与本地绝对路径全面脱敏
执行自动化排查脚本，确保代码库干净：
```bash
# 1. 检查是否存在本地绝对路径残留 (例如 /Users/ 或 /home/)
git grep -n "/Users/" -- ":!docs/" ":!design/"
git grep -n "localhost:" -- ":!*.spec.ts"

# 2. 检查可能遗留的 API Key 或敏感 Token
git grep -iE "(secret|apikey|token|password|private_key)" -- ":!node_modules" ":!*.d.ts"

# 3. 使用 gitleaks 检查 Git 提交历史中是否存在泄露凭据
npx gitleaks detect --source . -v
```

### 2.3 冗余目录精简与构建规范化
* **归档废弃测试文件**：清理或合并早期临时探索代码；
* **清理临时渲染目录**：确保 `apps/studio/test-results/`、`.tempmediaStorage/`、`scratch/` 不存在未提交的巨大二进制媒体；
* **规范根目录 `package.json`**：确保 `pnpm build`、`pnpm test`、`pnpm lint`、`pnpm typecheck` 逻辑清晰且在全新机器上可一键通过。

### 2.4 `.gitignore` 规则加固
核验并加固根目录与各子应用 `.gitignore`：
```gitignore
# 媒体录制与渲染缓存
*.webm
*.mp4
test-results/
playwright-report/
.tempmediaStorage/
scratch/

# 环境与构建中间产物
.env
.env.*
!.env.example
dist/
build/
.turbo/
```

---

## 3. 阶段二：顶级门面包装与多圈层视觉物料 (Brand Facade & Visuals)

在 GitHub 生态中，**README 的排版与第一张 Hero 动图决定了 80% 访客是否会点击 Star**。必须按照顶流国际开源项目标准（如 Supabase, Excalidraw, tldraw, Shadcn UI）进行全方位视觉包装。

### 3.1 30 秒高能 Hero 动图与分镜脚本

制作 1080p 60fps 高清视频，压缩生成体积 $\le 4.5\text{MB}$ 的高质量 GIF 与 MP4：

| 时间轴 | 画面镜头 | 动作与交互操作 | 核心视觉心智冲击 |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:05** | 痛点呈现 | 屏幕上是一张庞大复杂的系统架构图，鼠标盲目乱晃，镜头突然定格闪烁红叉 | “传统的静态架构图复杂晦涩，没人看得懂” |
| **00:05 - 00:12** | 极速导入与吸附 | 将大图拖入 FocusFlow 工作台，鼠标拉出矩形框，Sobel 算法瞬间**咔哒**紧密吸附在网关模块边缘；拖拽贝塞尔连线自动吸附锚点 | “无需繁琐排版，像素级智能吸附” |
| **00:12 - 00:20** | 镜头推拉与流光 | 点击播放按钮，镜头瞬间以电影级贝塞尔曲线向右下方推拉下沉，流光在链路中飞速流动，Callout 气泡阶梯式淡入 | “60fps 电影级运镜，直击核心链路” |
| **00:20 - 00:26** | 旁白与音频驱动 | 展开底部波形轨，点击一键 TTS，时间轴自适应拉伸，激光播放头伴随语音朗读精准推进 | “音画毫秒级同步，自动生成讲解” |
| **00:26 - 00:30** | 单文件独立交付 | 点击“导出独立 HTML”，断开网络，在本地浏览器双击打开导出的 `.html` 文件，全屏丝滑交互 | “零服务器依赖，双击即看，隐私安全 100%” |

### 3.2 三类目标受众的痛点穿透与文案定位

针对开源社区三类核心传播人群，制定击中痛点的文案钩子：

1. **企业架构师 / 资深后端 Tech Lead**：
   - *痛点*：“架构评审和向业务方汇报时，画了三天的静态图没人有耐心看，讲到第三个模块大家都迷失了方向。”
   - *解法*：“FocusFlow 让你像导演拍摄电影一样分幕编排架构图，镜头聚焦到哪里，听众的注意力就在哪里。”
2. **开源作者 / 知名技术博主**：
   - *痛点*：“在 GitHub README 和技术文章里贴静态流程图太单薄；录成视频又不能交互搜索和放大查看细节。”
   - *解法*：“导出单文件 HTML 嵌入博客或文档，读者既能看自动运镜讲解，又能随时暂停缩放查看每一个微服务配置。”
3. **AI Agent 开发者 / 自动化工程师**：
   - *痛点*：“LLM 生成了复杂系统的 DSL，但缺乏一个开箱即用的离线视频渲染器。”
   - *解法*：“基于虚拟时钟的 CLI 无头渲染管线，Agent 输入一份 JSON，全自动输出 60fps 帧对齐的高清讲解短视频。”

### 3.3 双语高水准 `README.md` 架构设计

重构项目根目录 `README.md`（英文为主）与 `README.zh-CN.md`（中文镜像）：
* **标头区**：
  - 官方矢量 BrandLogo + Slogan：
    > *FocusFlow: Turn complex architecture diagrams into 60fps cinematic interactive stories.*
  - Badges 徽章矩阵：License, CI Passing, Playwright (52/52), TypeScript, PRs Welcome, Discord;
  - 🎯 **[🚀 Try Live Demo Online (无需安装，一秒体验)]** 醒目高亮行动呼吁（CTA）。
* **Why FocusFlow? 对比矩阵**：
  - 对比传统 PPT 翻页平移、AE 动效制作、Draw.io/Excalidraw、Loom 录屏，突出“无损缩放、交互探索、零体积单文件”的降维打击。
* **特性展台 (Feature Highlights)**：
  - 图文展示 5 大核心功能（Sobel 吸附、贝塞尔流光、波形音画同步、单文件编译器、无头 CLI）。
* **3 步快速启动 (Quick Start)**：
  ```bash
  git clone https://github.com/focusflow-dev/focusflow.git
  cd focusflow
  pnpm install
  pnpm dev
  ```
* **单文件编译器与嵌入示例 (Standalone & Embedding)**：
  - 展示如何在 React / Vue / Vanilla JS 中引入 `@focusflow/player`。

### 3.4 社区规范治理套件 (Community Health)
完善 `.github/` 目录规范：
* `CONTRIBUTING.md`：规范 Monorepo 贡献指引、Turbo 构建命令、E2E 测试要求（严格遵守用户规范：测试逻辑抽离独立 async 函数）；
* `CODE_OF_CONDUCT.md`：采用 Contributor Covenant 标准行为规范；
* `.github/ISSUE_TEMPLATE/bug_report.yml` & `feature_request.yml`：采用 GitHub Form 结构化表单收集运行环境、复现 DSL；
* `.github/PULL_REQUEST_TEMPLATE.md`。

---

## 4. 阶段三：零成本在线体验站与自动化 CI/CD (Live Demo & Pipelines)

### 4.1 纯前端单机版静态托管部署方案
* **选型推荐**：优先采用 **Cloudflare Pages** 或 **Vercel** 托管；
* **零运维成本**：
  - 构建命令：`pnpm --filter=@focusflow/studio build`
  - 输出目录：`apps/studio/dist`
  - 静态资源经全球 Edge CDN 缓存，100 万访问量成本为 $0；
* **域名解析**：绑定独立顶级域名（如 `https://focusflow.dev`）。

### 4.2 6 大行业模板开箱即用保障
* 体验站初次进入时，自动载入默认微服务电商架构（LuxeHMS 拓扑）；
* 顶部导航醒目提供【模板中心】按钮，涵盖系统架构、微服务调用、数据流向、业务时序、云原生集群等 6 大行业开箱即用模板，用户无需准备底图即可完整体验从取景到导出的全流程。

### 4.3 GitHub Actions CI/CD 流水线落地
在 `.github/workflows/` 创建两大自动化流水线：
1. **`ci.yml`（代码质量与集成测试看门狗）**：
   - 触发：所有针对 `main` 的 PR 与 Push；
   - 步骤：Node 20 + pnpm 10 安装 ➔ `pnpm typecheck` ➔ `pnpm build` ➔ `pnpm exec playwright install --with-deps chromium` ➔ `pnpm --filter=@focusflow/studio exec playwright test`；
   - 保障：任何破坏 52 项 E2E 场景的代码严禁合并入主分支。
2. **`deploy-demo.yml`（体验站自动持续部署）**：
   - 触发：`main` 分支有代码合并时自动触发；
   - 步骤：构建产物直接同步推送至 Cloudflare Pages / GitHub Pages。

---

## 5. 阶段四：出海全网冷启动宣发推广 (Global Launch & Go-To-Market)

### 5.1 宣发黄金时间窗口 (Golden Timing)
* **发布日推荐**：周二或周三（北美太平洋时间 PST 07:30 ~ 08:30 AM / 北京时间 23:30 ~ 00:30）；
* 避开周一（清空邮件高峰）与周五（准备度周末），避开重大科技公司发布会（如 Apple Event、Google I/O）。

### 5.2 渠道分发实战策略与文案模板

#### 渠道 1：Hacker News (Show HN - 最具爆发力的极客阵地)
* **标题格式**：
  > `Show HN: FocusFlow – Turn complex architecture diagrams into 60fps cinematic stories`
* **首楼技术自述（Creator's Comment）**：
  - 简短真诚，重点阐述技术选型理念：
    * 为什么坚持纯前端离线与 100% 隐私安全（“无后端、数据绝不上云”）；
    * 如何实现单文件 HTML 独立打包（全量 Base64 内联与独立运行时）；
    * 前端图像边缘吸附算法挑战（Canvas Sobel 算子实时计算）；
    * 附上 GitHub 仓库链接与免登录 Live Demo。

#### 渠道 2：X (Twitter - 海外开发者圈自传播)
* **推文结构**：
  - 顶部直接附带 15 秒高清演示短视频（无缓冲自动播放）；
  - 配文：“Stop presenting complex architecture diagrams as boring static images. Today, I'm open-sourcing FocusFlow:
    ✨ Snap & auto-align with Sobel edge detection
    🎬 60fps cinematic camera pans & Bezier flow
    🎙️ Audio waveform & voiceover sync
    📦 100% offline, zero-dependency single-file HTML export
    Try the live demo (link in comments) 👇 #opensource #webdev #react #devtools”；
  - 在回复中 @知名独立开发者与前端技术博主。

#### 渠道 3：Reddit 垂直板块
* **目标 Subreddit**：`r/webdev` (2M+ 开发者), `r/reactjs`, `r/selfhosted`, `r/programming`；
* **发帖角度**：以工程深度剖析为主（*“How I built a 60fps zoom-to-cursor infinite canvas and edge-snapping engine in pure React”*），避免纯广告推销。

#### 渠道 4：国内技术生态
* **V2EX**：`/go/programmer` 和 `/go/create` 节点发帖，突出架构师汇报痛点与纯前端无后端黑科技；
* **《阮一峰科技爱好者周刊》**：在 GitHub Issue 提交推荐，通常可稳定带来 500~1,000 Star 转化；
* **知乎/掘金/公众号**：发布长文《聊聊我是如何把一张静态架构图做成好莱坞级动效的》。

---

## 6. 阶段五：社区运营与商业反向转化闭环 (Community & Conversion)

### 6.1 付费需求线索雷达 (Lead Radar)
社区 Issue 和 Discussions 是最精准的商业需求探测仪：

| 社区用户反馈信号 | 用户潜在诉求分析 | 对应的模式 B (SaaS) 商业化功能 |
| :--- | :--- | :--- |
| *“能不能支持团队多人同时编辑同一个工程？”* | 团队协同、权限隔离、冲突治理 | **模式 B Stage 7 (CASL 权限与实时协同)** |
| *“本地录屏 CPU 占用高，想要更高清的 4K MP4 视频”* | 云端大算力批量渲染、即时转码 | **模式 B Stage 9 (BullMQ + Remotion 渲染集群)** |
| *“导出的 HTML 能否替换成我们企业自己的域名和品牌标志？”* | 企业白标、合规与品牌心智 | **模式 B 企业定制方案 (White-labeling)** |
| *“能不能提供只读链接，在飞书/Notion 文档里直接免密嵌入？”* | 文档系统嵌入、短链分发 | **模式 B Stage 10 (云端分享与 iframe 嵌入)** |

### 6.2 流量飞轮与云端 SaaS 转化漏斗
1. **工作台常驻内测预约入口**：
   - 在 Studio 顶部/右侧保留极具质感的“☁️ FocusFlow Cloud (申请内测)”徽章，收集高意向企业用户邮箱（Waitlist）；
2. **导出单文件 HTML 的自然增长飞轮**：
   - 导出的独立演示文件在控制栏右下角默认带有精致的 `Powered by FocusFlow`；
   - 每一个被发送给客户或嵌入到博客中的架构图，都在全网自发为 FocusFlow 带来精准反向流量。

---

## 7. 全流程执行任务 Checklist (全景详细分解清单)

### 📋 阶段一：仓库安全审计、合规与工程精简
- [ ] **1.1 开源协议落地**
  - [ ] 根目录确认并创建主 `LICENSE` 文件
  - [ ] `packages/player/package.json` 与 `packages/dsl/package.json` 标注 `"license": "MIT"`
  - [ ] `apps/studio/package.json` 标注 `"license": "AGPL-3.0"`
- [ ] **1.2 敏感信息脱敏与绝对路径排查**
  - [ ] 执行敏感路径检测命令（`git grep -n "/Users/"`）并清理
  - [ ] 执行敏感词安全审计（`npx gitleaks detect --source .`）
  - [ ] 检查代码中是否残留非公开内网 IP、测试 Token 或私有邮箱
- [ ] **1.3 冗余目录精简与构建验证**
  - [ ] 清理未跟踪的媒体与测试残片（`scratch/`、`.tempmediaStorage/`、`test-results/`）
  - [ ] 运行 `pnpm build` 与 `pnpm typecheck` 确认全新克隆下零报错通过
- [ ] **1.4 加固 `.gitignore` 规则**
  - [ ] 确保 `test-results/`、`playwright-report/`、`*.webm`、`.env*` 被严格忽略

---

### 📋 阶段二：顶级门面包装与视觉物料
- [ ] **2.1 30 秒高能 Hero 动图与分镜制作**
  - [ ] 按照分镜脚本录制 1080p 60fps 完整流程演示（拖图 ➔ 吸附 ➔ 运镜 ➔ 音画同步 ➔ 导出）
  - [ ] 压缩生成体积 $\le 4.5\text{MB}$ 的高质量主 Hero GIF/WebM
  - [ ] 截取 3 张核心特性对比图（Sobel 吸附对齐、贝塞尔流光、断网独立运行）
- [ ] **2.2 重构双语 `README.md`**
  - [ ] 编写英文版 Hero 标头、Slogan、Badges 徽章与在线体验 CTA 按钮
  - [ ] 编写 Why FocusFlow 痛点对比矩阵（对比传统画图工具与 PPT）
  - [ ] 编写 3 步快速上手指南（`pnpm install && pnpm dev`）
  - [ ] 编写 `README.zh-CN.md` 中文镜像文档并在主文档建立互跳链接
- [ ] **2.3 社区规范与协作治理文件**
  - [ ] 创建 `CONTRIBUTING.md`（明确贡献分支、E2E 测试编写规范）
  - [ ] 创建 `CODE_OF_CONDUCT.md`
  - [ ] 创建 `.github/ISSUE_TEMPLATE/bug_report.yml`
  - [ ] 创建 `.github/ISSUE_TEMPLATE/feature_request.yml`
  - [ ] 创建 `.github/PULL_REQUEST_TEMPLATE.md`

---

### 📋 阶段三：零成本在线体验站与自动化 CI/CD
- [ ] **3.1 纯前端单机版静态托管部署**
  - [ ] 创建 Cloudflare Pages / Vercel 静态工程配置
  - [ ] 绑定独立二级域名（如 `https://focusflow.dev`）并验证 HTTPS 全球访问速度
- [ ] **3.2 体验站 6 大预置模板验证**
  - [ ] 确保访客打开体验站无需上传任何文件，直接畅玩预设架构图
  - [ ] 验证模板中心 6 大模板切换与一键应用流畅无阻
- [ ] **3.3 GitHub Actions CI/CD 流水线**
  - [ ] 编写 `.github/workflows/ci.yml`（全量 52 项 Playwright E2E 测试自动回归）
  - [ ] 编写 `.github/workflows/deploy-demo.yml`（`main` 分支自动构建并发布体验站）
  - [ ] 在 GitHub Actions 中跑通全量绿灯流程

---

### 📋 阶段四：出海全网冷启动宣发推广
- [ ] **4.1 Launch Day 宣发文案准备**
  - [ ] 撰写 Hacker News `Show HN` 英文长帖与技术解析
  - [ ] 撰写 X (Twitter) 15 秒视频推文、标签矩阵与互动博主名单
  - [ ] 撰写 Reddit（`r/webdev` 等）技术深析长文
  - [ ] 撰写 V2EX 程序员节点讨论帖文案
- [ ] **4.2 全网协同发布推进**
  - [ ] GitHub 仓库设为 **Public**
  - [ ] 锁定北美早晨窗口（PST 08:00 AM）同步发布 HN、X、Reddit
  - [ ] 国内社区同步发布 V2EX 与提交阮一峰周刊 Issue
- [ ] **4.3 评论区互动与高优 Bug 修复**
  - [ ] 保持 48 小时极速互动响应，逐条回复 HN 和 Reddit 技术提问
  - [ ] 设立当日 Bug 突击通道，保障首发体验口碑

---

### 📋 阶段五：社区运营与商业反向转化闭环
- [ ] **5.1 社区交流与作品广场**
  - [ ] 启用 GitHub Discussions 作为用户案例与技术问答阵地
  - [ ] 建立 Discord 官方交流群并在 README 中展示入口
- [ ] **5.2 商业化等待名单（Waitlist）**
  - [ ] 在工作台顶部/右侧设置“☁️ FocusFlow Cloud (申请内测)”弹窗或链接
  - [ ] 沉淀首批高意向企业与 Pro 会员邮箱列表
- [ ] **5.3 驱动模式 B（SaaS 全栈）精准研发**
  - [ ] 根据首月反馈排定模式 B（Stage 6~11）的云端协同与 4K 渲染集群任务
