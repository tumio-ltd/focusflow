# FocusFlow - 开源发布全流程执行指南与落地手册
## FocusFlow Open-Source Launch Playbook & Execution Checklist

> **文档版本**：`v1.0.0`  
> **制定日期**：`2026-09-05`  
> **当前基线**：Phase 2 Studio 模式 A（纯前端离线单机工作台）基本完成  
> **战略目标**：以“零依赖单文件交付、纯本地离线隐私、60fps 电影级架构图叙事”为核心卖点，打造 GitHub 3k~5k Stars 的现象级开源项目，抢占“架构图动态叙事”品类定义权。  
> **关联战略专刊**：
> - 📄 [docs/COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md (商业化与开源战略指南)](./COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md)
> - 🎨 [design/STUDIO_SPEC.md (Phase 2 可视化创作工作台规格)](../design/STUDIO_SPEC.md)
> - 🏗️ [design/MONOREPO_SPEC.md (Monorepo 架构规范)](../design/MONOREPO_SPEC.md)

---

## 目录 (Table of Contents)

- [1. 开源发布的总体战略与时间表](#1-开源发布的总体战略与时间表)
- [2. 阶段一：仓库安全审计、合规与工程精简 (Hardening & Sanitization)](#2-阶段一仓库安全审计合规与工程精简-hardening--sanitization)
- [3. 阶段二：顶级门面包装与视觉物料制作 (Brand Facade & Visuals)](#3-阶段二顶级门面包装与视觉物料制作-brand-facade--visuals)
- [4. 阶段三：零成本在线体验站与自动化 CI/CD (Live Demo & Pipelines)](#4-阶段三零成本在线体验站与自动化-cicd-live-demo--pipelines)
- [5. 阶段四：出海全网冷启动宣发推广 (Global Launch & Go-To-Market)](#5-阶段四出海全网冷启动宣发推广-global-launch--go-to-market)
- [6. 阶段五：社区运营与商业反向转化闭环 (Community & Conversion)](#6-阶段五社区运营与商业反向转化闭环-community--conversion)
- [7. 全流程执行任务 Checklist (全景勾选清单)](#7-全流程执行任务-checklist-全景勾选清单)

---

## 1. 开源发布的总体战略与时间表

```
                                 【开源发布 5 阶段路线图】

    [阶段 1: 仓库合规与安全脱敏] ──> [阶段 2: 门面包装与动图制作] ──> [阶段 3: Demo 部署与 CI 基建]
            (预计耗时: 1 天)                  (预计耗时: 2 天)                  (预计耗时: 1 天)
                                                                                  │
                                                                                  ▼
    [阶段 5: 社区运营与商业转化] <── [阶段 4: 全网多渠道冷启动宣发] <─────────────────┘
            (长期持续运营)                     (Launch Day + 首周)
```

* **发布时间窗口**：当前 Phase 2 模式 A 已经具备高度完善的交互工具与 10 项全通 E2E 测试，正处于开源的**黄金窗口期（Golden Window）**。
* **发布核心物料核心三角**：
  1. **极度吸睛的 10 秒 Hero 动图**（一秒看懂拖图、吸附、运镜的全过程）；
  2. **一键直达的零成本 Live Demo 在线体验站**（内置预设架构图，免上传即开即玩）；
  3. **单文件 HTML 交付亮点**（脱网自治、双击即播，击中极客与企业安全痛点）。

---

## 2. 阶段一：仓库安全审计、合规与工程精简 (Hardening & Sanitization)

### 2.1 开源协议落地 (License Placement)
根据 `COMMERCIALIZATION_AND_OPEN_SOURCE_STRATEGY.md` 的双轨开源切分架构，确立协议：
* **`packages/player` 与 `packages/dsl`**：采用 **MIT License**。
  * 允许任意开发者无门槛嵌入博客、Docs、知识库。播放器右下角保留 `Powered by FocusFlow` 换取反向链接与 SEO 权重。
* **`apps/studio`**：采用 **AGPL-3.0**（或 BSL 1.1）。
  * 保护单机前端工作台，允许个人免费本地运行，但从法律上封死竞争对手直接套壳上线商业 SaaS 的空间。
* **根目录 `LICENSE` 文件生成**：在项目根目录放置主许可文件。

### 2.2 敏感信息与本地绝对路径全面脱敏
* 运行全局扫描脚本，检索代码库中是否存在开发机物理路径（如 `/Users/xxx/`）；
* 检查是否存在私有 Token、硬编码密码、调试用私有邮箱或内部测试域名；
* 检查 Git 历史记录（使用 `gitleaks` 或 `git-filter-repo`），确保无误入历史的敏感配置文件。

### 2.3 代码库与冗余目录精简
当前仓库经过多轮演进，存在部分历史实验目录与临时文件，需在开源前规整：
* 梳理清理 `poc/`（旧单点原型目录，可选择精简保留或归档至 `legacy/`）；
* 检查 `design/archives/` 与根目录临时 patch 文件，确保工作区干净清爽；
* 检查根目录 `package.json` 中的 scripts，确保命令规范统一。

### 2.4 `.gitignore` 规则加固
确保以下文件绝对不会误提交：
* 自动化测试截图与视频：`apps/studio/test-results/`、`playwright-report/`；
* 本地视频录像帧与临时媒体：`scratch/video_frames/`、`.tempmediaStorage/`；
* 环境变量与敏感配置：`.env`、`.env.local`、`*.local`；
* 操作系统临时文件：`.DS_Store`、`Thumbs.db`。

---

## 3. 阶段二：顶级门面包装与视觉物料制作 (Brand Facade & Visuals)

在开源社区，**README 的品质直接决定了项目的 Star 转化率（转化率差距可达 10 倍以上）**。必须按顶流开源项目的最高标准进行包装。

### 3.1 核心视觉动图制作 (Hero Visuals)
* **主 Hero 动图 (10~15秒)**：
  - 录制流畅的 60fps 演示：**拖入 4K 架构大图 ➔ 框选微服务（Sobel 算法瞬间自动贴合边缘） ➔ 连线（8 向锚点吸附） ➔ 点击播放（电影级镜头平滑推拉 + 贝塞尔跑马灯流光） ➔ 一键导出单个 HTML**；
  - 格式输出：高质量 WebM / 优化压缩后的 GIF（文件体积控制在 5MB 以内，确保 GitHub 加载不卡顿）。
* **特性微动图/对比切片 (Feature Clips)**：
  - **Sobel 智能吸附对比**：传统手工抠图对齐（笨拙耗时） vs FocusFlow 智能吸附（随手一拉像素咬合）；
  - **三次贝塞尔流光**：展示 8 向锚点吸附与跑马灯流动质感；
  - **单文件独立交付**：展示断开网络后双击 `.html` 依然丝滑交互播放。

### 3.2 双语高水准 `README.md` 重构
* **Hero 标头区**：
  - 醒目的项目 Logo 与 Slogan：*“FocusFlow: Turn static architecture diagrams into 60fps cinematic interactive stories”*；
  - Badges 徽章墙：License、Playwright Tests Passing、TypeScript、PRs Welcome、Stars；
  - 🎯 **[🚀 Try Live Demo Online (免安装一键体验)]** 醒目按钮。
* **痛点解决对照表 (Why FocusFlow?)**：
  - 对比传统 PPT Morph、AE 动画、静态画图工具（Draw.io/Eraser.io）的痛点，突显 FocusFlow 的降维打击能力。
* **核心特性矩阵 (Feature Grid)**：
  - 图文并茂展示 5 大杀手级功能。
* **快速上手 (Quick Start)**：
  - 3 步极速本地运行指南（`pnpm install && pnpm dev`）。
* **架构设计与贡献说明**：
  - 简明阐明 Monorepo 模块分工；
  - 附带双语文档入口（English / 简体中文）。

### 3.3 社区协作基建规范 (Community Health)
* 创建 `CONTRIBUTING.md`：提供从 Fork、本地开发、运行测试到提 PR 的标准指南；
* 创建 `CODE_OF_CONDUCT.md`：标准开源社区行为准则；
* 创建 `.github/ISSUE_TEMPLATE/`：
  - `bug_report.md`（Bug 反馈模板，包含重现步骤、浏览器版本）；
  - `feature_request.md`（功能建议模板）；
* 创建 `.github/PULL_REQUEST_TEMPLATE.md`。

---

## 4. 阶段三：零成本在线体验站与自动化 CI/CD (Live Demo & Pipelines)

> ⚠️ **开源核心铁律**：90% 的开发者不会为了“看看效果”而在本地 clone 代码执行 `pnpm install`。**必须提供零等待、一键即开的在线体验站点**。

### 4.1 纯前端单机版静态托管部署
* **技术选型**：利用 **Vercel**、**Cloudflare Pages** 或 **GitHub Pages** 对 `@focusflow/studio` 的 `dist` 静态产物进行托管；
* **零服务器成本**：模式 A 纯前端架构无需任何后端服务器，所有的算力和交互在访客浏览器端执行，全球 CDN 流量完全免费；
* **域名绑定**：绑定独立品牌域名（如 `https://focusflow.dev` 或 `https://focusflow.io`）。

### 4.2 极速上手：内置精品预设架构图
* 新用户访问在线工作台时，手头往往没有现成的 4K 架构图；
* **工作台内置 2 套精品预置示例**：
  1. **经典电商微服务与网关链路图 (E-Commerce Microservices)**；
  2. **分布式存储与高可用 K8s 拓扑图 (Distributed Cloud Native Architecture)**；
* 用户打开 Demo 站无需上传任何文件，点击“加载示例”，1 秒即可沉浸式体验镜头推拉与交互。

### 4.3 GitHub Actions CI/CD 流水线
* 创建 `.github/workflows/ci.yml`：
  - 触发条件：所有针对 `main` 分支的 Push 和 PR；
  - 执行步骤：`pnpm install` ➔ `pnpm run lint` ➔ `pnpm run build` ➔ `playwright test`；
  - 价值：确保合并的代码永远不会破坏现有的 10 项 E2E 视觉工具测试，树立工业级工程可信度。
* 创建 `.github/workflows/deploy-demo.yml`：
  - 触发条件：`main` 分支合并通过后，自动打包构建并将静态产物推送到在线体验环境。

---

## 5. 阶段四：出海全网冷启动宣发推广 (Global Launch & Go-To-Market)

开源发布不是把代码设为 Public 就结束，而是一场**精心编排的全球全网协同战役**。

### 5.1 Launch Day 物料准备
1. **30~45 秒高能对比视频**：
   - 前 5 秒展示痛点：技术答辩/方案讲标时，一张密密麻麻的静态大图让人头晕犯困；
   - 随后的 25 秒展示 FocusFlow：直接把大图拖进浏览器，拉框自动吸附，点击播放瞬间变成 60fps 电影级镜头大片，导出单个 HTML 双击即播；
2. **多语言宣发推文与短文案**：
   - 准备好 X (Twitter) 推文草稿、Hacker News 标题格式、V2EX 讨论帖草稿。

### 5.2 全网多渠道齐发时间表与矩阵

```
                                【全网冷启动宣发传播阵列】

    [海外核心阵地]                                   [国内技术阵地]
    • X (Twitter) 动效短视频推文                      • V2EX (程序员 / 创意节点)
    • Hacker News (Show HN 冲榜)                     • 《阮一峰科技爱好者周刊》投稿
    • Reddit (r/webdev, r/selfhosted)               • 掘金 / 知乎技术专栏
    • Product Hunt (首发打榜准备)                    • 微信开源与架构师社群
```

#### 渠道 1：X (Twitter / 海外开发者圈)
* **发布形式**：发布带 15 秒高帧率短视频的推文，文案突出痛点与反差；
* **标签矩阵**：`#buildinpublic #indiehackers #opensource #devtools #react #webdev`；
* **互动策略**：主动 @海外知名独立开发者、架构设计大 V 和前端网红进行互动试用。

#### 渠道 2：Hacker News (极客风向标)
* **发帖格式**：`Show HN: FocusFlow – Turn static architecture diagrams into 60fps cinematic stories (Zero-dependency standalone HTML)`；
* **核心击中点**：HN 用户极度推崇“纯前端本地离线、尊重数据隐私、零依赖独立单文件 HTML”的设计哲学，切中痛点极易登上 HN 首页。

#### 渠道 3：Reddit 垂直社区
* 在 **r/webdev**, **r/reactjs**, **r/selfhosted**, **r/programming** 分享制作灵感与技术挑战（如“如何用 CSS Matrix3D 逆矩阵投影解决无限画布交互”与“Sobel 算子在前端边缘吸附中的实战”）。

#### 渠道 4：国内技术社区与技术周刊
* **V2EX**：在 `/go/programmer` 和 `/go/create` 发帖，重点介绍“解决架构图汇报痛点”与“纯前端单文件打包黑科技”；
* **《阮一峰科技爱好者周刊》**：在 GitHub Issue 专栏提交 FocusFlow 推荐（周刊读者高度重合，通常能带来 500~1,000 Stars 转化）；
* **知乎与掘金**：发布深度工程解析长文。

---

## 6. 阶段五：社区运营与商业反向转化闭环 (Community & Conversion)

开源的最终目的是为商业化建立最宽广的信任基石与流量蓄水池。

### 6.1 社区 Issue 响应与需求线索捕获
* 承诺核心 Issue 24 小时内响应，让早期参与者感受到团队的活跃与专业；
* **建立“付费需求线索雷达”**：
  - 当社区用户开始提出：“能不能多人同时改？” ➔ **记录为模式 B 团队协同（CASL）的付费线索**；
  - 当社区用户提出：“我想生成 4K 60fps MP4 发给客户，本地录像有点卡” ➔ **记录为模式 B 云端硬件渲染农场的付费线索**；
  - 当社区用户提出：“能不能去掉导出 HTML 的官方标志，换成我们公司 Logo？” ➔ **记录为企业版白标（White-labeling）的付费线索**。

### 6.2 商业转化漏斗埋设
1. **开源工作台右下角升级入口**：
   - 在 Studio 顶部/右侧保留极具质感的“☁️ FocusFlow Cloud (Coming Soon)”徽章；
   - 提供“申请内测资格”表单，提前收集数百位高意向企业和 Pro 用户邮箱（Email Waitlist）；
2. **导出单文件 HTML 的自然流量飞轮**：
   - 导出的独立演示文件在控制栏右下角默认带有一个优雅的 `Powered by FocusFlow`；
   - 每一个被发送给客户或嵌入到博客中的架构图，都在自发为 FocusFlow 带来高质量的精准反向流量。

---

## 7. 全流程执行任务 Checklist (全景勾选清单)

### 📋 阶段一：仓库合规与安全脱敏
- [ ] **1.1 开源协议落地**
  - [ ] 根目录创建并确认 `LICENSE` 文件（主许可）
  - [ ] `packages/player` 与 `packages/dsl` 确立为 MIT 协议并在 package.json 中标明
  - [ ] `apps/studio` 确立为 AGPL-3.0 / BSL 1.1 并在 package.json 中标明
- [ ] **1.2 敏感信息与工程路径脱敏**
  - [ ] 全局搜索并清除所有个人开发机物理绝对路径（如 `/Users/xxx/`）
  - [ ] 检查并确保无私有 API Key、内部测试邮箱与临时调试数据
  - [ ] 运行敏感词与安全审计扫描（`gitleaks` 检查 Git 提交历史）
- [ ] **1.3 代码库与冗余目录精简**
  - [ ] 规整或归档 `poc/` 遗留单点测试目录
  - [ ] 清理未跟踪的临时 patch 与测试产物文件
  - [ ] 根目录 `package.json` scripts 整理与描述规范化
- [ ] **1.4 校验 `.gitignore` 规则**
  - [ ] 验证 `test-results/`、`playwright-report/` 严格被忽略
  - [ ] 验证媒体录制临时文件夹 `scratch/`、`.tempmediaStorage/` 严格被忽略
  - [ ] 验证 `.env*` 严格被忽略

---

### 📋 阶段二：顶级门面包装与视觉物料
- [ ] **2.1 核心视觉动图制作**
  - [ ] 录制 10~15 秒 60fps 主 Hero 演示流程（拖图 ➔ 吸附 ➔ 运镜 ➔ 导出）
  - [ ] 压缩并输出体积 < 5MB 的高质量主 Hero GIF/WebM
  - [ ] 截取 3 张核心特性对比图（Sobel 边缘吸附对比、贝塞尔流线、单文件断网离线播放）
- [ ] **2.2 重构双语高水准 `README.md`**
  - [ ] 撰写英文版 Hero Slogan、项目定位与 Badges 徽章
  - [ ] 插入主 Hero 动图与“🚀 Try Live Demo Online”醒目跳转按钮
  - [ ] 编写 Why FocusFlow 痛点对比矩阵（对比 PPT/AE/静态画图）
  - [ ] 编写 3 步快速上手指南（`pnpm install && pnpm dev`）
  - [ ] 提供中文版文档入口链接（`README.zh-CN.md`）
- [ ] **2.3 社区规范文件落地**
  - [ ] 创建 `CONTRIBUTING.md`（环境准备、分支规范、PR 提交流程）
  - [ ] 创建 `CODE_OF_CONDUCT.md`（行为准则）
  - [ ] 创建 `.github/ISSUE_TEMPLATE/bug_report.md`
  - [ ] 创建 `.github/ISSUE_TEMPLATE/feature_request.md`
  - [ ] 创建 `.github/PULL_REQUEST_TEMPLATE.md`

---

### 📋 阶段三：零成本在线体验站与自动化 CI/CD
- [ ] **3.1 零成本静态托管部署**
  - [ ] 配置 Vercel / Cloudflare Pages 静态站点托管工程
  - [ ] 绑定独立二级域名（如 `https://focusflow.dev`）
  - [ ] 测试 HTTPS、全球 CDN 边缘分发速度与静态资源加载
- [ ] **3.2 工作台内置预设精品架构图示例**
  - [ ] 准备经典微服务拓扑图素材并内置到 Studio 项目中
  - [ ] 实现顶栏一键“加载预置示例架构”按钮，确保访客 0 门槛即开即玩
- [ ] **3.3 GitHub Actions CI/CD 流水线**
  - [ ] 编写 `.github/workflows/ci.yml`（执行 lint、build、10 项 Playwright E2E 测试）
  - [ ] 编写 `.github/workflows/deploy-demo.yml`（push main 自动部署更新 Live Demo）
  - [ ] 验证流水线在 GitHub Actions 虚拟环境中 100% 绿灯跑通

---

### 📋 阶段四：出海全网冷启动宣发推广
- [ ] **4.1 宣发物料准备**
  - [ ] 制作 30~45 秒产品反差对比视频（带精炼英文字幕）
  - [ ] 撰写 Twitter/X 动效发布推文及标签组合
  - [ ] 撰写 Hacker News Show HN 介绍长文与技术细节说明
  - [ ] 撰写 V2EX、知乎、掘金国内发布贴文案
- [ ] **4.2 全网协同发布执行**
  - [ ] GitHub 仓库设为 **Public**
  - [ ] X (Twitter) 同步发布视频推文，@相关领域开发者博主
  - [ ] Hacker News 发布 `Show HN: FocusFlow ...`
  - [ ] Reddit 垂直社区（r/webdev, r/selfhosted）发帖互动
  - [ ] V2EX 程序员节点发布讨论帖
  - [ ] 提交《阮一峰科技爱好者周刊》推荐 PR
- [ ] **4.3 监控与快速互动**
  - [ ] 持续 48 小时密切关注评论区，100% 积极回复 HN/Reddit/X 上的技术提问
  - [ ] 收集首发反馈并快速修复阻碍体验的 First-day Bugs

---

### 📋 阶段五：社区运营与商业闭环转化
- [ ] **5.1 社区反馈收集机制**
  - [ ] 开启 GitHub Discussions 作为社区问答与作品展示广场
  - [ ] 设立 Bug / Feature 优先级处理机制（SLA < 24 小时）
- [ ] **5.2 商业化等待名单（Waitlist）搭建**
  - [ ] 在工作台放置“☁️ FocusFlow Cloud 协同与 4K 渲染（申请内测）”入口
  - [ ] 沉淀首批高意向企业与 Pro 会员邮箱列表
- [ ] **5.3 模式 B（SaaS 闭源）精准研发驱动**
  - [ ] 汇总首月社区高频诉求，直接指导 `apps/api` 与 `apps/render-worker` 的研发排期
