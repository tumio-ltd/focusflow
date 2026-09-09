<div align="center">

<img src="./apps/studio/public/logos/logo-horizontal.svg" alt="FocusFlow Logo" width="340" />

<p align="center">
  <strong>将复杂的静态系统架构大图，转化为 60fps 电影级运镜交互故事。</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> •
  <a href="./README.zh-CN.md">简体中文</a>
</p>

[![License](https://img.shields.io/badge/License-MIT%20%7C%20AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0+-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-在线体验站-success?logo=github)](https://tumio-ltd.github.io/focusflow/)

<br />

<a href="https://tumio-ltd.github.io/focusflow/">
  <img src="https://img.shields.io/badge/🚀_在线试玩_Live_Demo-无需安装_秒级体验-0284c7?style=for-the-badge&logoColor=white" alt="在线体验站" height="42" />
</a>

<br /><br />
</div>

---

## 💡 为什么需要 FocusFlow？

向客户、投资人或技术委员会展示复杂的微服务、分布式系统或 AI 大模型流向图时，传统的静态图存在天然的表达瓶颈：

* **认知过载（Cognitive Overload）**：一张 4K/8K 架构全景图堆砌了上百个节点与复杂连线，观众在 30 秒内就会迷失阅读焦点；
* **PPT 与录屏难以两全**：幻灯片翻页切碎了拓扑的全局上下文；录制的 MP4 视频又无法随时暂停缩放查看微服务配置细节；
* **动效制作成本高昂**：通常需要熟练的动效设计师在 After Effects 中耗费数天逐帧标定。

**FocusFlow 彻底改变了这一现状。** 它让你能像电影导演调度镜头一样编排架构图：
- 在 **60fps GPU 硬件加速** 下平滑推拉运镜、聚焦局部节点；
- 沿依赖路径实时渲染**带方向脉冲的三次贝塞尔发光流线**；
- 驱动 **AI 语音解说与音画波形同步**；
- 一键编译为 **100% 离线运行的单文件 HTML**，任意浏览器双击即可在断网环境下流畅演示。

### 📊 传统方案对比矩阵

| 核心维度 | FocusFlow | 传统幻灯片 (PPT / Keynote) | 静态绘图工具 (Draw.io / Excalidraw) | 录屏工具 (Loom / OBS) |
| :--- | :---: | :---: | :---: | :---: |
| **电影级镜头运镜** | **原生 60fps 连续视锥运动学** | 离散生硬平移翻页 | ❌ 无 | 固定死视角录像 |
| **交互式细节探索** | **全自由（播放中随时暂停缩放）** | ❌ 仅限静态翻页 | 手动拖拽画布 | ❌ 固定扁平像素 |
| **框选对齐成本** | **Sobel 算子毫秒级边缘吸附** | 手工肉眼对齐 | 手工拉线微调 | ❌ 无 |
| **动态脉冲流光** | **实时三次贝塞尔发光管线** | ❌ 难以实现 | 静态箭头连线 | 事先烘焙像素 |
| **分发与交付形态** | **自包含单文件 HTML ($< 5\text{MB}$)** | 需装专属 Office 软件 | 导出图片 / XML | 臃肿体积的视频文件 |
| **运行依赖** | **100% 纯前端离线（零服务端依赖）** | 依赖本地软件 | 依赖 Web 服务 | 依赖本地播放器 |

---

## ✨ 核心特性

### 🎥 1. 60fps GPU 视锥电影级运镜
由运动学变换矩阵驱动的仿射平滑插值（`scale`、`translate3d`、`rotate`）。无论是全局俯瞰还是下钻到最细小的数据库表字段，均保持极致丝滑、无频闪与文字抗锯齿重采样。

### 🧲 2. Sobel 智能边缘吸附
内置计算机视觉边缘梯度卷积算法：在架构图上随意拖拽标定框，算法在 $< 1\text{ms}$ 内自动检测像素边界，精准紧贴微服务容器边框。

### ⚡ 3. 动态贝塞尔流光路由
智能计算相对锚点空间位置（水平流向自动 `right ➔ left`，垂直流向自动 `bottom ➔ top`），支持多色发光脉冲与流向动画。

### 🎙️ 4. AI 语音解说与音画同步
内置离线 Web Speech API 与云端大模型语音合成接口。配齐可视化音频波形轨道与字幕标定，根据台词字数自动推导镜头驻留时长。

### 🏝️ 5. 灵动岛 HUD 与禅模式（Zen Mode）
底部悬浮胶囊控制岛，实时显示章节序号、流转进度条、时长倒计时与元素密度计数。支持全屏演示时无操作自动隐藏的**禅模式**。

### 📦 6. 单文件离线 HTML 编译器
一键将 4K 底图、画中画覆盖层、旁白音频、运动脚本与播放内核深度打包为一个自包含的单个 `.html` 文件，双击即可在任何离线电脑上独立播放。

---

## 🚀 快速开始

### 1. 在线直接体验
无需安装任何环境，浏览器直接打开：  
👉 **[https://tumio-ltd.github.io/focusflow/](https://tumio-ltd.github.io/focusflow/)**

### 2. 本地工程启动 (Turborepo)

```bash
# 克隆仓库
git clone https://github.com/tumio-ltd/focusflow.git
cd focusflow

# 安装项目依赖 (推荐使用 pnpm 9+)
pnpm install

# 启动可视化工作台 (FocusFlow Studio)
pnpm dev:studio
# 👉 浏览器访问 http://localhost:5174

# 全量构建所有软件包
pnpm build
```

---

## 🏗️ Monorepo 工作区架构

```text
focusflow/
├── apps/
│   └── studio/               # 可视化创作工作台 (React 19, Tailwind CSS v4, Lucide)
├── packages/
│   ├── player/               # 高性能 60fps 运行时渲染引擎 (~35KB 极简体积，零 UI 框架依赖)
│   ├── dsl/                  # 共享 TypeScript DSL 架构契约与 JSON Schema
│   ├── config-typescript/    # 共享 TypeScript 编译规则
│   ├── config-oxlint/        # 毫秒级 Oxlint 质检配置
│   └── config-tailwind/      # 跨端暗黑/明亮科技设计 Token
├── examples/
│   ├── luxehms/              # 4K 高并发微服务架构实战案例
│   ├── sales-fee/            # 5K 全景销售网络拓扑与佣金结算实战案例
│   ├── overlay-demo/         # 画中画动态下钻实战案例
│   └── simple-demo/          # 双节点极简冒烟测试
├── docs/                     # 面向公众的技术白皮书与算法原理解析
└── scripts/                  # 单文件打包编译器与脚手架 CLI
```

---

## 📦 软件包矩阵

| 软件包 | 当前版本 | 开源协议 | 职责说明 |
| :--- | :--- | :--- | :--- |
| **`@focusflow/player`** | `v1.0.0` | **MIT** | 轻量级 (~35KB) 原生 JS 60fps 画布运镜渲染播放内核 |
| **`@focusflow/dsl`** | `v1.0.0` | **MIT** | FocusFlow 领域契约定义、几何运算类型与校验器 |
| **`@focusflow/studio`** | `v1.0.0` | **AGPL-3.0** | 现代化时间轴可视化交互编排工作台 |

---

## 📖 技术专刊与算法白皮书

详尽的工程架构与算法推导文档可查阅 [`docs/`](docs/) 目录：

* 📘 [**工作台使用与调镜实战指南**](docs/USAGE_GUIDE.md)：从拖图建项目到导出单文件的 3 步全流程指引。
* 📐 [**Sobel 边缘吸附算法原理**](docs/EDGE_SNAPPER_ALGORITHM.md)：像素级卷积梯度算子与坐标投影推导。
* 🎵 [**音频播放与导出仲裁矩阵**](docs/AUDIO_PLAYBACK_AND_EXPORT_MATRIX.md)：离线与云端双引擎解说设计规范。
* 📹 [**60fps WebM 纯前端录制方案**](docs/LOCAL_60FPS_WEBM_RECORDING_PLAN.md)：浏览器虚拟时钟与低开销视频压制管线。
* 🛠️ [**PNPM 脚本统一调度速查**](docs/PNPM_SCRIPTS.md)：Monorepo 常用任务指令清单。

---

## 🤝 参与贡献

热烈欢迎社区开发者提交 Pull Request 与反馈建议！  
请随时前往 [GitHub Issues](https://github.com/tumio-ltd/focusflow/issues) 交流讨论。

---

## 📄 开源协议

FocusFlow 采用双重开源许可模式：
* **核心渲染内核与 DSL** (`packages/player`, `packages/dsl`, `tooling/*`, `examples/*`)：遵循 **[MIT 许可协议](LICENSE)**。
* **Studio 可视化创作工作台** (`apps/studio`)：遵循 **[GNU Affero General Public License v3.0 (AGPL-3.0)](apps/studio/LICENSE)**。

版权所有 &copy; 2026 **Tumio Soft Technology Co., Ltd. (图米奥软件科技)**
