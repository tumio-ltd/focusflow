# FocusFlow 官方架构模板体系优化与双语国际化技术规范 (Official Templates Optimization & i18n Spec)

> **文档版本**: v1.0.0  
> **更新日期**: 2026-09-13  
> **关联模块**: `@focusflow/studio`, `@focusflow/dsl`, `@focusflow/player`  
> **文档定位**: 记录 FocusFlow 官方架构标杆模板的实机调优标准、动效设计决策原则，以及针对「模板中心弹窗」中英文国际化缺陷的深度诊断与系统级改造方案，作为模板工程演进与国际化质量验收的权威技术规范。

---

## 目录 (Table of Contents)

- [一、 背景与建设目标 (Background & Objectives)](#一-背景与建设目标-background--objectives)
- [二、 模板设计三大核心原则 (Core Design Principles)](#二-模板设计三大核心原则-core-design-principles)
  - [1. 底图不可侵入原则 (Asset Immutability Principle)](#1-底图不可侵入原则-asset-immutability-principle)
  - [2. 动效克制与视觉纯净化原则 (Animation Restraint & Purity)](#2-动效克制与视觉纯净化原则-animation-restraint--purity)
  - [3. 端到端双语国际化原则 (End-to-End i18n Principle)](#3-端到端双语国际化原则-end-to-end-i18n-principle)
- [三、 标杆模板《微服务高可用电商中台》实机调优复盘 (Microservices Template Optimization Retrospective)](#三-标杆模板微服务高可用电商中台实机调优复盘-microservices-template-optimization-retrospective)
  - [1. 痛点根治：Callout 标注卡片反向压盖 (-80px 穿模) 彻底修复](#1-痛点根治callout-标注卡片反向压盖--80px-穿模-彻底修复)
  - [2. 运镜视口与画幅聚焦精细校准](#2-运镜视口与画幅聚焦精细校准)
  - [3. 冗余连线清理与底层存储图元对齐](#3-冗余连线清理与底层存储图元对齐)
  - [4. Gemini TTS 真实播音时序建立与固化](#4-gemini-tts-真实播音时序建立与固化)
  - [5. 连线动效方案决策（放弃 Dot 粒子流动动效）](#5-连线动效方案决策放弃-dot-粒子流动动效)
- [四、 模板弹窗多语言体验缺陷深度诊断 (Templates Modal i18n Issue Diagnosis)](#四-模板弹窗多语言体验缺陷深度诊断-templates-modal-i18n-issue-diagnosis)
  - [1. 缺陷 1：模板名称与描述在数据层硬编码中文 (Hardcoded Title & Desc)](#1-缺陷-1模板名称与描述在数据层硬编码中文-hardcoded-title--desc)
  - [2. 缺陷 2：卡片左上角分类 Badge 中英混杂 (Untranslated Category Badge)](#2-缺陷-2卡片左上角分类-badge-中英混杂-untranslated-category-badge)
  - [3. 缺陷 3：英文搜索索引断层 (Search Index Disconnect)](#3-缺陷-3英文搜索索引断层-search-index-disconnect)
  - [4. 缺陷 4：模板克隆应用后工程标题缺少语言感知 (Project Title Non-Adaptive)](#4-缺陷-4模板克隆应用后工程标题缺少语言感知-project-title-non-adaptive)
- [五、 模板系统双语国际化升级方案 (Comprehensive i18n Architecture)](#五-模板系统双语国际化升级方案-comprehensive-i18n-architecture)
  - [1. 建议 1：扩展 `ArchitectureTemplate` 接口支持双语元数据 (`titleI18n` & `descI18n`)](#1-建议-1扩展-architecturetemplate-接口支持双语元数据-titlei18n--desci18n)
  - [2. 建议 2：TemplatesModal 卡片左上角分类 Badge 接入 i18n 字典](#2-建议-2templatesmodal-卡片左上角分类-badge-接入-i18n-字典)
  - [3. 建议 3：卡片展示与模糊检索全量接通当前语言环境](#3-建议-3卡片展示与模糊检索全量接通当前语言环境)
  - [4. 建议 4：模板应用创建新工程时的语言感知与初始化](#4-建议-4模板应用创建新工程时的语言感知与初始化)
  - [5. 补充机制：单语言模板兼容性与优雅降级链 (Single-Language Template Fallback)](#5-补充机制单语言模板兼容性与优雅降级链-single-language-template-fallback)
  - [6. 分幕台词 (Voiceover Scripts) 与 AI 智能配音的多语言闭环考量](#6-分幕台词-voiceover-scripts-与-ai-智能配音的多语言闭环考量)
  - [7. 底图资产的国际化现状评估（天然支持英文字符）](#7-底图资产的国际化现状评估天然支持英文字符)
- [六、 标杆模板双语对照矩阵 (Bilingual Template Data Matrix)](#六-标杆模板双语对照矩阵-bilingual-template-data-matrix)
- [七、 实施落地计划与检查清单 (Action Items & Acceptance Checklist)](#七-实施落地计划与检查清单-action-items--acceptance-checklist)

---

## 一、 背景与建设目标 (Background & Objectives)

FocusFlow 作为现代化架构故事化与动态演示平台，官方架构标杆模板（如《微服务高可用电商中台演进架构》、《企业级大模型 RAG 全链路架构》、《实时流批一体湖仓拓扑》等）是用户开箱体验、评估核心能力与输出工业级演示的关键抓手。

在近期工程实践中，用户在实际开发环境（`localhost:5174`）中对《微服务高可用电商中台演进架构》进行了精细的实机标定与调优。与此同时，在 Studio 全球化多语言体验审查中暴露出：**模板中心弹窗（TemplatesModal）内的模板名称、描述、左上角分类徽章即使在英文界面下也全部显示为中文**。

本规范旨在固化微服务标杆模板的实机调优成果，沉淀动效设计边界，并建立模板中心双语国际化的系统性改造标准。

---

## 二、 模板设计三大核心原则 (Core Design Principles)

### 1. 底图不可侵入原则 (Asset Immutability Principle)
- **核心定义**：在为架构图设计运镜、分幕、标注卡片或连线动效时，**底图（SVG/矢量图/位图）被视作只读的单一事实来源（Ground Truth），不可侵入、不可随意篡改**。
- **业务心智**：真实业务用户在使用 FocusFlow 时，架构底图往往来自专业架构师的 Visio/Draw.io 导出或官方标准拓扑，用户期望在此基础上“赋予其运镜与旁白”，而非被迫反向修改底图设计。
- **执行准则**：所有高亮框元（Box）、标注卡片（Callout）、动态连线（Path）均在 DSL 覆盖层（Overlay）中进行绝对或相对坐标标定，杜绝通过重绘或修改底图来强行迁就动效。

### 2. 动效克制与视觉纯净化原则 (Animation Restraint & Purity)
- **警惕动效过载**：避免在已有清晰拓扑关系的底图上叠加过于喧宾夺主、高频重复或造成“双线重影”的擦除重绘流光。
- **去冗余连线**：若底图已有明确的箭头与数据流向标示（例如网关到订单服务的 gRPC 虚线），避免在 DSL 中再次配置平行重叠的 auto-bezier 路径，优先保持画面清爽与信息聚焦。
- **技术选型决策**：对于沿轨迹流动数据点（Dot 粒子动效）等方案，在未形成标准轻量通用图元组件前审慎上线，不盲目增加复杂度，**克制即是品质**。

### 3. 端到端双语国际化原则 (End-to-End i18n Principle)
- **无死角多语言**：从模板弹窗的卡片分类、标题、描述，到模板应用后工程名称、分幕标题、Callout 标注以及语音台词脚本，均具备中英双语等价表达。
- **上下文感知**：在用户切换界面语言为英文（`en`）时，所有展示层、搜索层与新工程初始化层均自动呈现地道英文术语，杜绝“中英夹生”或硬编码中文残留。

---

## 三、 标杆模板《微服务高可用电商中台》实机调优复盘 (Microservices Template Optimization Retrospective)

在开发环境中，通过结合实际播放态与设计态的像素级调优，形成了完全收敛并固化的 DSL 配置：

### 1. 痛点根治：Callout 标注卡片反向压盖 (-80px 穿模) 彻底修复
- **初始模板缺陷**：旧模板简单采用 `top: box.y - 80px` 算法，在 4K（3840×2160）画布下，Callout 卡片本身高度达到 120px~160px，叠加反缩放后直接覆盖了 API 网关、订单中台、库存服务与分布式事务协调器的标题栏核心文字。
- **实机优化坐标**：
  - **Scene 1 (全局拓扑)**：`co-ms-overview` 移至网关下方安全留白区（`left: 158px, top: 1016px`）。
  - **Scene 2 (边缘接入)**：`co-gw-sentinel` 避开网关顶部（`left: 232px, top: 964px`）；`co-gw-jwt` 移至 Ingress 框体右侧空白带（`left: 1024px, top: 214px`）。
  - **Scene 3 (订单中台)**：`co-order-snowflake` 与 `co-order-idempotent` 分列订单框左右侧翼安全区（`859px` 与 `2109px`）。
  - **Scene 4 (库存防超卖)**：`co-stock-lua` 与 `co-stock-bucket` 分布在库存框上方与右侧安全区（`1209px, 770px` 与 `2093px, 818px`）。
  - **Scene 5 (分布式事务)**：`co-seata-undo` 与 `co-seata-raft` 上浮至安全空白区（`2291px, 470px` 与 `2972px, 464px`）。

### 2. 运镜视口与画幅聚焦精细校准
- **Scene 1**：`zoom: 1.0, x: 0, y: 0`（全局沉浸总览）。
- **Scene 2**：`zoom: 1.85, x: -20.5, y: -12`（精准锁定边缘流量入口与网关卡片）。
- **Scene 3**：`zoom: 2.05, x: -5, y: -18`（高倍聚焦订单核心生命周期与 Nacos 注册中心）。
- **Scene 4**：`zoom: 2.05, x: -5, y: 10`（平移聚焦库存原子预扣减引擎）。
- **Scene 5**：`zoom: 1.90, x: 24, y: -2`（聚焦 Seata TC 集群、APM 链路追踪与底层存储分片）。

### 3. 冗余连线清理与底层存储图元对齐
- **清理冲突连线**：移除了跨越网关到订单服务的 `path-gw-order`，消除与底图已有 gRPC 弧线重叠造成的双线重影。
- **校准底层图元**：底行盒子修正为与实际 SVG 严格一致的三大系统：
  - `box-kafka-bus`（削峰事件总线）
  - `box-db-sharding`（MySQL 动态分库分表）
  - `box-es-search`（Elasticsearch 读写分离检索引擎）

### 4. Gemini TTS 真实播音时序建立与固化
实机使用 `gemini-3.1-flash-tts-preview`（发音人 `Puck`）生成高保真音频，固化真实播音停留时长：
- Scene 1：`21,487 ms` (~21.5s)
- Scene 2：`22,500 ms` (~22.5s)
- Scene 3：`19,540 ms` (~19.5s)
- Scene 4：`20,180 ms` (~20.2s)
- Scene 5：`22,420 ms` (~22.4s)
- 全局母带总时长：`106,127 ms` (~1 分 46 秒)，5 个分幕 Marker 精准锚定。

### 5. 连线动效方案决策（放弃 Dot 粒子流动动效）
- **讨论方案**：曾讨论方案 C（让图元 Dot 沿路径轨迹单向流动，表现 RPC / 消息投递，替代重复从头擦除重绘的 Draw/Stream）。
- **最终决策**：**在当前标杆模板中放弃该项过度优化**。理由是底图已有非常清晰的数据流箭头与指示线，过多的动态流光或点动效反而分散注意力，且增加了 DSL 的复杂度；保留基础清晰 Path 即可满足高质量叙事。

---

## 四、 模板弹窗多语言体验缺陷深度诊断 (Templates Modal i18n Issue Diagnosis)

在审查 [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx) 与模板源定义 [apps/studio/src/templates/index.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/index.ts) 时，发现以下四大国际化断层缺陷：

### 1. 缺陷 1：模板名称与描述在数据层硬编码中文 (Hardcoded Title & Desc)
- **代码现状**：
  ```typescript
  // apps/studio/src/templates/index.ts
  export interface ArchitectureTemplate {
    id: string;
    title: string;       // 仅存中文: '微服务高可用电商中台演进架构'
    desc: string;        // 仅存中文: 'API 网关集群 + 订单微服务 + 库存防超卖...'
    category: 'hotel' | 'microservice' | 'ddd' | 'cloudnative' | 'database' | 'ai';
    categoryLabel: string;
    // ...
  }
  ```
- **后果**：在 [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx) 中直接输出 `{tpl.title}` 和 `{tpl.desc}`，即使用户将 Studio 界面切换为 English，卡片上的标题与描述依然全为中文。

### 2. 缺陷 2：卡片左上角分类 Badge 中英混杂 (Untranslated Category Badge)
- **代码现状**：
  - 弹窗顶部 Tab 分类按钮使用了 i18n 翻译字典（`categoryMicroservice: 'Microservices'`）；
  - 但卡片封面图左上角的悬浮徽章直接绑定了 `{tpl.categoryLabel}`：
    ```tsx
    <Badge variant="slate" className="backdrop-blur-md bg-black/60 border-white/20 text-xs text-white">
      {tpl.categoryLabel}
    </Badge>
    ```
- **后果**：在英文界面下，顶部 Tab 选中的是 `Microservices`，但下方卡片左上角却赫然写着 `'微服务 & 电商中台'`，视觉感官严重不协调。

### 3. 缺陷 3：英文搜索索引断层 (Search Index Disconnect)
- **代码现状**：
  ```typescript
  const matchQuery =
    tpl.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    tpl.desc.toLowerCase().includes(searchQuery.toLowerCase().trim());
  ```
- **后果**：海外或英文用户若在搜索框输入英文关键词（如 `Microservice`、`Gateway`、`CloudNative`），由于 `tpl.title` 和 `tpl.desc` 只有中文，搜索结果直接为空。

### 4. 缺陷 4：模板克隆应用后工程标题缺少语言感知 (Project Title Non-Adaptive)
- **代码现状**：
  ```typescript
  // apps/studio/src/App.tsx
  const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
    setDSL(tpl.dsl);
    // ...
    const newProjectId = await createProject(tpl.title, useProjectStore.getState().dsl);
  };
  ```
- **后果**：英文用户点击“Apply Template”创建工程后，顶部 TopBar 项目名称与 `dsl.meta.title` 仍被初始化为纯中文 `'微服务高可用电商中台演进架构'`，导致后续导出 HTML、录制视频的文件名依然是中文。

---

## 五、 模板系统双语国际化升级方案 (Comprehensive i18n Architecture)

为彻底解决上述缺陷，建议实施一套轻量、高扩展性且与 FocusFlow DSL 现有国际化规范（`titleI18n` / `descI18n`）完全对齐的架构方案：

### 1. 建议 1：扩展 `ArchitectureTemplate` 接口支持双语元数据 (`titleI18n` & `descI18n`)
在 [apps/studio/src/templates/index.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/index.ts) 中升级接口定义：

```typescript
export interface ArchitectureTemplate {
  id: string;
  title: string;
  titleI18n?: {
    zh: string;
    en: string;
  };
  category: 'hotel' | 'microservice' | 'ddd' | 'cloudnative' | 'database' | 'ai';
  categoryLabel: string;
  categoryLabelI18n?: {
    zh: string;
    en: string;
  };
  desc: string;
  descI18n?: {
    zh: string;
    en: string;
  };
  sceneCount: number;
  estimatedDuration: number;
  accentColor: string;
  coverImage: string;
  featured?: boolean;
  dsl: FocusFlowDSL;
}
```

### 2. 建议 2：TemplatesModal 卡片左上角分类 Badge 接入 i18n 字典
在 [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx) 中，彻底摒弃硬编码的 `tpl.categoryLabel`，优先复用已有的 categories 国际化映射：

```tsx
// 改造前:
<Badge variant="slate" ...>{tpl.categoryLabel}</Badge>

// 改造后:
<Badge variant="slate" className="backdrop-blur-md bg-black/60 border-white/20 text-xs text-white">
  {categories.find((c) => c.id === tpl.category)?.label || tpl.categoryLabelI18n?.[currentLang] || tpl.categoryLabel}
</Badge>
```
- **中文环境下显示**：`微服务 & 电商`
- **英文环境下显示**：`Microservices`

### 3. 建议 3：卡片展示与模糊检索全量接通当前语言环境
在 [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx) 中引入当前语言感知：

```typescript
const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

// 获取动态标题与描述辅助函数
const getTemplateTitle = (tpl: ArchitectureTemplate) =>
  currentLang === 'en' && tpl.titleI18n?.en ? tpl.titleI18n.en : tpl.title;

const getTemplateDesc = (tpl: ArchitectureTemplate) =>
  currentLang === 'en' && tpl.descI18n?.en ? tpl.descI18n.en : tpl.desc;
```

并在搜索过滤中加入双语双向匹配：
```typescript
const filteredTemplates = ARCHITECTURE_TEMPLATES.filter((tpl) => {
  const matchCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
  const q = searchQuery.toLowerCase().trim();
  if (!q) return matchCategory;

  const matchTitle =
    tpl.title.toLowerCase().includes(q) ||
    (tpl.titleI18n?.en && tpl.titleI18n.en.toLowerCase().includes(q));
  const matchDesc =
    tpl.desc.toLowerCase().includes(q) ||
    (tpl.descI18n?.en && tpl.descI18n.en.toLowerCase().includes(q));

  return matchCategory && (matchTitle || matchDesc);
});
```

### 4. 建议 4：模板应用创建新工程时的语言感知与初始化
在 [apps/studio/src/App.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 的 `handleApplyTemplate` 中：

```typescript
const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';
  const initialTitle = (currentLang === 'en' && tpl.titleI18n?.en) ? tpl.titleI18n.en : tpl.title;

  // 1. 同步将 DSL meta 中的全局标题设置为当前语言对应的标题
  const clonedDSL: FocusFlowDSL = {
    ...tpl.dsl,
    meta: {
      ...tpl.dsl.meta,
      title: initialTitle,
    },
  };

  setDSL(clonedDSL);
  setActiveSceneIndex(0);

  // 2. 创建对应新工程并存储
  const newProjectId = await createProject(initialTitle, clonedDSL);
  console.log('Created project from template:', newProjectId, initialTitle);
};
```

### 5. 补充机制：单语言模板兼容性与优雅降级链 (Single-Language Template Fallback)

日后随着社区开源与业务拓展，必然会引入**纯中文（或纯英文）单语言专有模板**（如特定合规系统、国内政企专网拓扑等）。方案完全天生支持单语言模板，遵循以下三大保障：

1. **三级安全降级链条（Fallback Chain）**：
   ```typescript
   export function getTemplateTitle(tpl: ArchitectureTemplate, lang: string): string {
     // 优先匹配目标语言 -> 其次全局默认 title -> 绝不出现 undefined / 空白
     return tpl.titleI18n?.[lang as 'zh' | 'en'] || tpl.title;
   }
   export function getTemplateDesc(tpl: ArchitectureTemplate, lang: string): string {
     return tpl.descI18n?.[lang as 'zh' | 'en'] || tpl.desc;
   }
   ```
2. **轻量配置零负担**：
   单语言模板只需定义基础的 `title` 与 `desc`，无需提供 `titleI18n.en`。系统在英文界面下自动原样呈现其原始标题与描述，搜索也正常命中。
3. **单语言专属体验增强（可选）**：
   对于未配置对应语言翻译的单语言模板，可在卡片封面角标呈现微型语言胶囊（如 `ZH Only` 或 `🇨🇳 中文专享`），向海外用户建立清晰心理预期。

### 6. 分幕台词 (Voiceover Scripts) 与 AI 智能配音的多语言闭环考量

在前期标杆模板（如《微服务高可用电商中台》）的设计中，我们前瞻性地为 5 幕都设计了高水准的中英双语播音台词（`voiceoverScript` 与 `voiceoverScriptI18n: { zh: '...', en: '...' }`）。但在审查 Studio 现有音频基础设施时，发现目前代码仍存在明显的“台词语种脱钩”技术债。对此，系统规范做如下权威设计：

#### (1) 现状痛点诊断：TTS 与时间轴硬编码单一主台词
- **代码断层**：在 [aiTtsSynthesizer.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts)、[AudioWaveformTrack.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/timeline/AudioWaveformTrack.tsx) 与 [App.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 中，TTS 合成、波形文本显示和分幕时长估算均硬编码为：
  ```typescript
  const text = scene.voiceoverScript?.trim() || scene.title;
  ```
- **不良后果**：海外用户在英文界面下点击“一键生成 AI 旁白配音”时，系统依然提取了中文 `voiceoverScript` 进行念白；且检查器右侧的台词提词器输入框也只呈现中文。

#### (2) 运行时台词解析算法（Voiceover Resolution Fallback）
建立全局统一的台词多语言取值工具函数：
```typescript
export function getSceneVoiceoverScript(scene: SceneStep, lang: string = 'zh'): string {
  // 1. 优先取匹配目标语言的专属翻译台词
  if (scene.voiceoverScriptI18n?.[lang]?.trim()) {
    return scene.voiceoverScriptI18n[lang].trim();
  }
  // 2. 次优取主字段台词 (若主字段本身就是当前语种或单语言模板)
  if (scene.voiceoverScript?.trim()) {
    return scene.voiceoverScript.trim();
  }
  // 3. 兜底回退为分幕标题 (用于短平快的无旁白运镜)
  return scene.titleI18n?.[lang] || scene.title || '';
}
```

#### (3) 模板应用实例化时的台词主通道注入 (Template Instantiation Injection)
当用户在英文界面（`i18n.language.startsWith('en')`）点击“应用此模板创建工程”时：
- **智能映射主台词**：将模板中各分幕的 `scene.voiceoverScript` 主字段自动填充为 `scene.voiceoverScriptI18n.en`，分幕标题 `scene.title` 填充为 `scene.titleI18n.en`；
- **成效**：用户进入 Studio 画布后，时间轴、提词器卡片和分幕指示器天然就是纯正的地道英文，用户点击“生成 AI 配音”即可直接调用英文发音人生成对应母带；
- **反向保留**：工程 DSL 内部依然完整保留原始的 `voiceoverScriptI18n` 双语字典，保证随时可做多语种自由切换。

#### (4) 语种声学特征差异与分幕停留时长自适应 (`adaptedDuration`)
英文与中文在技术术语的音节长度和语速上具有显著物理差异：
- **时序重算**：英文念诵同等信息量（如 *“BGP Anycast CDN”, “120,000 QPS”, “Sliding-window throttles”*）时，自然发音时长通常比紧凑的中文长 10%~25%；
- **规则**：当以英文台词生成 TTS 时，TTS 服务应依据英文音频的实际时长，自适应将该幕的停留时长（`scene.duration`）与母带分幕标记（Marker）自动拉伸匹配，杜绝“台词尚未念完、运镜已强行切走”的跳帧穿模现象。

### 7. 底图资产的国际化现状评估（天然支持英文字符）
- **底图审查结论**：对 [microservices-architecture.svg](file:///Users/xt/WebstormProjects/focusflow/apps/studio/public/templates/microservices-architecture.svg) 原生矢量的代码审计显示，其顶部 Header（`SYSTEM TOPOLOGY // CLOUD-NATIVE`、`Cloud-Native High-Availability E-Commerce Microservices`）、技术组件（`APISIX`、`Nacos`、`Sentinel`、`Seata TC`、`Kafka`、`MySQL`）及所有指标（`120k QPS`、`100% ACID`）均为标准全英文设计。
- **结论**：底图本身天然具备国际化水准，无需针对中英文分流两张 SVG，只需在 Studio 软件交互层与 DSL 元数据层补齐国际化能力即可达成完美闭环。

---

## 六、 标杆模板双语对照矩阵 (Bilingual Template Data Matrix)

以下为 6 套架构模板在 `index.ts` 中建议同步更新的双语标准元数据对照表：

| 模板 ID | 语言 | 标题 (Title) | 简明描述 (Description) | 分类标识 |
| :--- | :--- | :--- | :--- | :--- |
| **`tpl-hotel-pms`** | **中文** | LuxeHMS 酒店 PMS 房态与高并发预订核心架构 | NestJS CASL 动态鉴权 + Redis 房态分布式锁 + PostgreSQL 行级事务 + Tape Chart 房态甘特图 | `hotel`<br/>(酒店 & 调度系统) |
| | **EN** | LuxeHMS Hotel PMS & High-Concurrency Booking Engine | NestJS CASL Auth + Redis Distributed Locks + PostgreSQL Row Transactions + Interactive Tape Chart PiP | `hotel`<br/>(Hotel & Scheduling) |
| **`tpl-microservices`** | **中文** | 微服务高可用电商中台演进架构 | APISIX 网关集群 + 订单状态机 + Redis Lua 库存防超卖 + Seata AT 2PC 分布式事务 | `microservice`<br/>(微服务 & 电商) |
| | **EN** | Cloud-Native High-Availability Microservices Topology | APISIX Gateway Cluster + Order State Machine + Redis Lua Anti-Overselling + Seata AT 2PC Transaction | `microservice`<br/>(Microservices) |
| **`tpl-ai-rag-pipeline`** | **中文** | 企业级大模型 RAG 检索增强生成全链路架构 | 知识库递归切片 + Milvus 密集向量检索 + Cross-Encoder 重排 + Prompt 组装与 LLM 溯源推理 | `ai`<br/>(AI 大模型 & RAG) |
| | **EN** | Enterprise LLM RAG Pipeline & Semantic Retrieval | Document Ingestion + Milvus Vector Search + Cross-Encoder Rerank + Grounded LLM Reasoning | `ai`<br/>(AI & LLM RAG) |
| **`tpl-realtime-lakehouse`** | **中文** | 实时流批一体湖仓与智能分析拓扑 | Debezium CDC 增量采集 + Kafka 3.7 KRaft 削峰 + Flink 1.19 状态计算 + Apache Iceberg 湖仓与 ClickHouse OLAP | `database`<br/>(分布式计算 & 湖仓) |
| | **EN** | Real-Time Lakehouse & Streaming Analytics Topology | Debezium CDC + Kafka 3.7 KRaft + Flink Stateful Stream + Apache Iceberg ACID Lakehouse & ClickHouse | `database`<br/>(Streaming & Lakehouse) |
| **`tpl-ddd-architecture`** | **中文** | DDD 领域驱动设计典型分层架构模型 | Interfaces 用户接口层 + Application 应用服务层 + Domain 聚合根核心 + Infrastructure 基础设施仓储 | `ddd`<br/>(DDD 领域驱动) |
| | **EN** | Domain-Driven Design (DDD) Layered Architecture | User Interface + Application Service + Domain Aggregate Root + Infrastructure Repository | `ddd`<br/>(DDD Architecture) |
| **`tpl-k8s-cloudnative`** | **中文** | Kubernetes 云原生 GitOps 自动化流水线 | Git 声明式配置仓库 + ArgoCD 控制器 + K8s 集群金丝雀渐进式发布演进 | `cloudnative`<br/>(云原生 & DevOps) |
| | **EN** | Kubernetes Cloud-Native GitOps Delivery Pipeline | Declarative Git Repo + ArgoCD Controller + Progressive K8s Canary Deployment Engine | `cloudnative`<br/>(Cloud Native) |

---

## 七、 实施落地计划与细化拆解清单 (Action Items & Detailed Phased Checklist)

### 阶段 0：标杆模板实机标定与规范建立 (Phase 0: Baseline Calibration & Spec)
- [x] **微服务标杆模板实机固化**：已将开发环境精确坐标、时长与图元配置固化至 [tpl-microservices.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/tpl-microservices.ts)。
- [x] **动效边界决策记录**：明确确立“底图不可侵入原则”，决定放弃在标杆模板上叠加 Dot 粒子冗余动效。
- [x] **三大主力标杆模板技术特性与分幕台词专业性审查**：
  - [x] **模板一《微服务高可用电商中台演进架构》**：已完成 5 幕深度审查，技术选型前沿主流、120k QPS/36k TPS 容量指标自洽、中英双语台词精准专业；已将 Scene 1 柔性事务学术定义优化为“最终一致性闭环”。
  - [x] **模板二《企业级大模型 RAG 检索增强生成架构》**：已完成 5 幕电影级运镜升级与深度核验，补齐全部 11 个图元与中英双语播音台词，技术栈涵盖 DeepSeek-R1 / Claude 3.5 Sonnet / BGE-M3 / Milvus 2.4 / Ragas / E2B 沙箱，规范与代码已完全同步。
  - [x] **模板三《实时流批一体湖仓与智能分析拓扑》**：已完成 5 幕升级与深度核验，补齐全部 10 个图元与中英双语播音台词，技术栈涵盖 Debezium CDC / Kafka 3.7 KRaft / Flink 1.19 / Iceberg V2 / ClickHouse 24 / Nessie / Feast / MirrorMaker 2，规范与代码已完全同步。

### 阶段 1：模板元数据层与类型定义升级 (Phase 1: Types & Metadata Layer)
- [x] **1.1 扩展 `ArchitectureTemplate` 接口定义**：在 [apps/studio/src/templates/index.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/index.ts) 中增加 `titleI18n`、`descI18n`、`categoryLabelI18n` 以及可选的 `supportedLangs?: ('zh' | 'en')[]` 字段。
- [x] **1.2 注入三大主力标杆模板的双语元数据**：聚焦三大主力模板（`tpl-microservices` 微服务电商、`tpl-ai-rag-pipeline` AI 大模型 RAG、`tpl-realtime-lakehouse` 实时流批湖仓），在 `ARCHITECTURE_TEMPLATES` 中注入中英双语 `titleI18n` 与 `descI18n`；其余 3 套模板保持单一中文原样不动，同时作为单语言模板自然降级机制的实机验证用例。
- [x] **1.3 实现多语言通用解析与降级工具函数**：
  - `getTemplateTitle(tpl, lang)`：优先 `titleI18n?.[lang]`，降级为 `title`；
  - `getTemplateDesc(tpl, lang)`：优先 `descI18n?.[lang]`，降级为 `desc`；
  - `getSceneVoiceoverScript(scene, lang)`：三级降级链路（`voiceoverScriptI18n[lang]` ➔ `voiceoverScript` ➔ `title`）。
- [x] **1.4 单语言模板编译与类型安全验证**：验证仅提供单一 `title`/`desc`（如纯中文模板）时无 TypeScript 报错且运行时安全。

### 阶段 2：模板中心弹窗交互与多语言体验改造 (Phase 2: TemplatesModal UI & UX)
- [x] **2.1 卡片左上角分类 Badge 接入 i18n 字典**：彻底移除写死的 `tpl.categoryLabel`，改用 `categories.find(c => c.id === tpl.category)?.label || tpl.categoryLabel`，消灭中英混杂。
- [x] **2.2 卡片标题与描述接通语言自适应**：在卡片列表渲染中调用 `getTemplateTitle` 与 `getTemplateDesc`，实时感知 `i18n.language`。
- [x] **2.3 模糊搜索索引双向全量对齐**：改造 `filteredTemplates` 检索逻辑，同时支持中英双向关键词（如搜 `Microservices` 或 `微服务` 均可精确命中）。
- [x] **2.4 单语言模板轻量标签展示**：当模板未提供当前界面语言的翻译时（如英文界面下展示纯中文模板），在卡片角标呈现微型语言胶囊（`ZH Only` / `仅中文`），向海外用户建立清晰心理预期。

### 阶段 3：模板克隆与工程初始化的多语言感知 (Phase 3: Template Instantiation)
- [x] **3.1 工程标题动态初始化**：在 [App.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) 的 `handleApplyTemplate` 中，若当前为英文界面，自动以 `tpl.titleI18n?.en || tpl.title` 作为新工程名称和 `dsl.meta.title`。
- [x] **3.2 分幕主台词与标题语言注入**：
  - 英文模式下应用模板时，自动遍历克隆 DSL 的分幕，将各分幕的 `scene.title` 初始化为 `scene.titleI18n?.en || scene.title`；
  - 将各分幕的 `scene.voiceoverScript` 主台词初始化为 `scene.voiceoverScriptI18n?.en || scene.voiceoverScript`；
  - DSL 内部完整保留 `titleI18n` 与 `voiceoverScriptI18n` 原始双语字典，保证后续随时可无损切回。

### 阶段 4：分幕台词与 AI TTS 语音全链路对齐 (Phase 4: Voiceover & Audio TTS Pipeline)
- [x] **4.1 TTS 合成台词提取解耦硬编码**：改造 [aiTtsSynthesizer.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts)，调用 `getSceneVoiceoverScript(scene, lang)` 获取合成文本，彻底告别英文模式念中文的缺陷。
- [x] **4.2 发音人模型与语种智能匹配**：TTS 合成入参支持 `lang` 参数，分幕 Marker 标签按当前语种动态适配（英文模式写入英文 Marker Label）。
- [x] **4.3 语速差异与分幕停留时长弹性伸缩 (`adaptedDuration`)**：根据英文 TTS 物理音频的实际时长，自适应校准该分幕停留时间（`scene.duration`）与母带时间轴分幕标记（Marker），杜绝台词被运镜截断。
- [x] **4.4 时间轴波形卡片与提词器联动**：[AudioWaveformTrack.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/timeline/AudioWaveformTrack.tsx) 与右侧检查器提词器输入框根据当前语言展示对应台词文本与分幕边界标签。

### 阶段 5：播放态与单文件导出字幕联动 (Phase 5: Audience & Export Subtitles)
- [x] **5.1 观众模式（AudienceModal）字幕与语音动态切换**：在全屏播放和录制时，演播控制浮岛（PlaybackIslandReact）与离线 WebSpeech 台词调用统一台词解析函数，展示并播放当前工程语种台词。
- [x] **5.2 单文件 HTML 导出多语言封装**：验证导出的独立 HTML 播放器能够正常显示当前工程设定的双语分幕与台词。

### 阶段 6：自动化测试与质量门禁验收 (Phase 6: Testing & Quality Gate)
- [x] **6.1 类型与构建检查**：运行 `pnpm --filter studio typecheck` 与 `pnpm build`，确保零类型错误与全包正常构建。
- [x] **6.2 Playwright 端到端测试覆盖**：
  - 编写并固化 [e2e/templates-i18n.spec.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/templates-i18n.spec.ts) 测试套件（测试模板中心在英文状态下的卡片文字、左上角分类 Badge、ZH Only 标记与中英双向搜索）；
  - 验证英文模式下点击应用模板后，创建的新工程标题与分幕台词、分幕标题均为英文。
- [x] **6.3 截图对比人机验收**：通过截屏审查中英两套语言下的 TemplatesModal 卡片视觉排版，确保无溢出与文字断行（已完成双语实机截屏比对与人工核验，文字排版自然，无溢出折行，验收通过）。

