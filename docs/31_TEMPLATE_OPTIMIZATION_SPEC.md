<p align="right"><strong>English</strong> • <a href="./31_TEMPLATE_OPTIMIZATION_SPEC.zh-CN.md">简体中文</a></p>

# FocusFlow Official Architecture Templates Optimization & Bilingual i18n Specification

> **Document Version**: v1.0.0  
> **Updated Date**: 2026-09-13  
> **Related Modules**: `@focusflow/studio`, `@focusflow/dsl`, `@focusflow/player`  
> **Document Scope**: Documents physical calibration standards, animation design principles for official flagship templates, and system-level architectural overhaul addressing internationalization (i18n) defects in the Templates Modal, serving as the definitive technical standard for template engineering and bilingual quality acceptance.

---

## Table of Contents

- [1. Background & Objectives](#1-background--objectives)
- [2. Three Core Design Principles for Templates](#2-three-core-design-principles-for-templates)
  - [1. Asset Immutability Principle](#1-asset-immutability-principle)
  - [2. Animation Restraint & Visual Purity Principle](#2-animation-restraint--visual-purity-principle)
  - [3. End-to-End Bilingual i18n Principle](#3-end-to-end-bilingual-i18n-principle)
- [3. Retrospective: Physical Calibration of Microservices Template](#3-retrospective-physical-calibration-of-microservices-template)
  - [1. Root Fix: Eliminating Callout Occlusion (-80px Boundary Clipping)](#1-root-fix-eliminating-callout-occlusion--80px-boundary-clipping)
  - [2. Camera Frustum Framing & Focus Calibration](#2-camera-frustum-framing--focus-calibration)
  - [3. Redundant Path Cleanup & Storage Element Realignment](#3-redundant-path-cleanup--storage-element-realignment)
  - [4. Gemini TTS Physical Pacing Calibration & Consolidation](#4-gemini-tts-physical-pacing-calibration--consolidation)
  - [5. Motion Design Decision (Dropping Redundant Dot Particle Flows)](#5-motion-design-decision-dropping-redundant-dot-particle-flows)
- [4. Templates Modal i18n Defect Diagnosis](#4-templates-modal-i18n-defect-diagnosis)
  - [1. Defect 1: Hardcoded Chinese Title & Description in Data Layer](#1-defect-1-hardcoded-chinese-title--description-in-data-layer)
  - [2. Defect 2: Untranslated Category Badges on Template Cards](#2-defect-2-untranslated-category-badges-on-template-cards)
  - [3. Defect 3: Search Index Disconnect in English](#3-defect-3-search-index-disconnect-in-english)
  - [4. Defect 4: Project Title Lacks Language Awareness Upon Cloning](#4-defect-4-project-title-lacks-language-awareness-upon-cloning)
- [5. Comprehensive i18n Architecture for Template System](#5-comprehensive-i18n-architecture-for-template-system)
  - [1. Recommendation 1: Extend `ArchitectureTemplate` Interface with `titleI18n` & `descI18n`](#1-recommendation-1-extend-architecturetemplate-interface-with-titlei18n--desci18n)
  - [2. Recommendation 2: Wire Card Category Badges to i18n Dictionary](#2-recommendation-2-wire-card-category-badges-to-i18n-dictionary)
  - [3. Recommendation 3: Context-Aware Card Display & Dual-Language Fuzzy Search](#3-recommendation-3-context-aware-card-display--dual-language-fuzzy-search)
  - [4. Recommendation 4: Language-Aware Initialization When Creating Projects from Templates](#4-recommendation-4-language-aware-initialization-when-creating-projects-from-templates)
  - [5. Complementary Mechanism: Single-Language Template Fallback Chain](#5-complementary-mechanism-single-language-template-fallback-chain)
  - [6. Multi-Language Considerations for Voiceover Scripts & AI Narration](#6-multi-language-considerations-for-voiceover-scripts--ai-narration)
  - [7. Internationalization Audit of Underlying SVG Assets](#7-internationalization-audit-of-underlying-svg-assets)
- [6. Bilingual Template Data Matrix](#6-bilingual-template-data-matrix)
- [7. Implementation Roadmap & Acceptance Checklist](#7-implementation-roadmap--acceptance-checklist)

---

## 1. Background & Objectives

As a modern platform for dynamic architecture storytelling and presentations, FocusFlow relies on its official benchmark templates (such as *High-Availability Microservices Topology*, *Enterprise LLM RAG Pipeline*, and *Real-Time Streaming Lakehouse*) as key demonstration assets for onboarding, capability evaluation, and industrial presentations.

During recent engineering practice, fine-grained physical calibration was completed in a local development environment (`localhost:5174`) for the *High-Availability Microservices Topology* template. Concurrently, an audit of the Studio globalization experience exposed that **template titles, descriptions, and category badges inside the Templates Modal remained entirely in Chinese even when the user selected English**.

This specification consolidates the physical tuning results of the microservices benchmark template, establishes animation restraint boundaries, and codifies technical standards for full bilingual i18n across the template system.

---

## 2. Three Core Design Principles for Templates

### 1. Asset Immutability Principle
- **Core Definition**: When designing camera paths, scenes, callout cards, or path animations for an architecture diagram, **the underlying visual asset (SVG / vector diagram / bitmap) must be treated as a read-only Single Source of Truth (Ground Truth)**.
- **User Mental Model**: Real-world users typically import architectural diagrams from Visio, Draw.io, or corporate topology standards. They expect FocusFlow to "orchestrate cinematic camera flight and voiceover narration atop their existing diagrams", rather than being forced to modify their original graphics.
- **Execution Rule**: All bounding boxes (`Box`), callout cards (`Callout`), and dynamic connection lines (`Path`) must be calibrated within the DSL Overlay layer using absolute or relative coordinates. Altering or repainting underlying artwork to accommodate animation is strictly prohibited.

### 2. Animation Restraint & Visual Purity Principle
- **Guard Against Animation Fatigue**: Avoid adding distracting, repetitive, or double-stroked wipe effects over topologies that already convey clear visual relationships.
- **Eliminate Redundant Curves**: If the background diagram already illustrates explicit directional arrows or dashed lines (e.g., gRPC calls from Gateway to Order Service), do not overlay parallel auto-bezier paths in the DSL. Keep the canvas uncluttered and information-focused.
- **Pragmatic Technology Choices**: Hold off on complex experiments (such as moving dot particle streams) until standard, lightweight primitive components are mature. **Restraint is quality**.

### 3. End-to-End Bilingual i18n Principle
- **Comprehensive Coverage**: From modal categories, titles, and descriptions, to project names, scene titles, callouts, and voiceover scripts upon cloning, equivalent Chinese and English expressions must be available.
- **Context Awareness**: When users switch the UI language to English (`en`), all display layers, search indices, and project initialization routines must automatically use idiomatic English terminology.

---

## 3. Retrospective: Physical Calibration of Microservices Template

Through combined live-playback and design-mode pixel-level calibration, a robust and consolidated DSL configuration was achieved:

### 1. Root Fix: Eliminating Callout Occlusion (-80px Boundary Clipping)
- **Legacy Defect**: The previous template used a naive `top: box.y - 80px` formula. On a 4K (3840×2160) canvas where Callout cards are 120px~160px high, inverted scale compensation caused callout cards to directly overlap title banners of the API Gateway, Order Service, Inventory Service, and Distributed Transaction Coordinator.
- **Calibrated Coordinates**:
  - **Scene 1 (Global Topology)**: `co-ms-overview` moved to safe whitespace below the gateway (`left: 158px, top: 1016px`).
  - **Scene 2 (Edge Ingress)**: `co-gw-sentinel` cleared from gateway header (`left: 232px, top: 964px`); `co-gw-jwt` shifted to whitespace right of Ingress (`left: 1024px, top: 214px`).
  - **Scene 3 (Order Core)**: `co-order-snowflake` and `co-order-idempotent` stationed on left/right safety flanks (`859px` and `2109px`).
  - **Scene 4 (Anti-Overselling Inventory)**: `co-stock-lua` and `co-stock-bucket` positioned in upper and right safe margins (`1209px, 770px` and `2093px, 818px`).
  - **Scene 5 (Distributed Transactions)**: `co-seata-undo` and `co-seata-raft` elevated to unobstructed header zones (`2291px, 470px` and `2972px, 464px`).

### 2. Camera Frustum Framing & Focus Calibration
- **Scene 1**: `zoom: 1.0, x: 0, y: 0` (Global immersive overview).
- **Scene 2**: `zoom: 1.85, x: -20.5, y: -12` (Precise framing of edge ingress and gateway nodes).
- **Scene 3**: `zoom: 2.05, x: -5, y: -18` (High-magnification focus on order lifecycle & Nacos registry).
- **Scene 4**: `zoom: 2.05, x: -5, y: 10` (Pan focus on atomic inventory pre-deduction engine).
- **Scene 5**: `zoom: 1.90, x: 24, y: -2` (Framing Seata TC cluster, APM distributed tracing, and database sharding).

### 3. Redundant Path Cleanup & Storage Element Realignment
- **Removed Conflicting Paths**: Cleaned up `path-gw-order` spanning the gateway and order service, removing ghosting caused by overlaying an auto-bezier line over native gRPC arcs.
- **Aligned Storage Elements**: Bottom storage boxes realigned to match exact SVG components:
  - `box-kafka-bus` (Event Bus for Peak Shaving)
  - `box-db-sharding` (MySQL Dynamic Database & Table Sharding)
  - `box-es-search` (Elasticsearch Read-Replicas Search Engine)

### 4. Gemini TTS Physical Pacing Calibration & Consolidation
Synthesized using `gemini-3.1-flash-tts-preview` (Voice: `Puck`) to establish real physical voiceover durations:
- Scene 1: `21,487 ms` (~21.5s)
- Scene 2: `22,500 ms` (~22.5s)
- Scene 3: `19,540 ms` (~19.5s)
- Scene 4: `20,180 ms` (~20.2s)
- Scene 5: `22,420 ms` (~22.4s)
- Total Master Duration: `106,127 ms` (~1m 46s), with 5 scene markers accurately pegged.

### 5. Motion Design Decision (Dropping Redundant Dot Particle Flows)
- **Evaluation**: Proposal C suggested flowing dot primitives along paths to visualize RPC / message delivery instead of repeating full-line Draw/Stream wipes.
- **Final Decision**: **Discarded for benchmark templates**. The base diagram already provides clean, clear arrows and connection lines. Adding moving dots increased cognitive load and DSL complexity without adding narrative value. Standard, crisp static paths deliver superior storytelling.

---

## 4. Templates Modal i18n Defect Diagnosis

Auditing [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx) and [apps/studio/src/templates/index.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/index.ts) revealed 4 major i18n disconnects:

### 1. Defect 1: Hardcoded Chinese Title & Description in Data Layer
- **Code State**:
  ```typescript
  export interface ArchitectureTemplate {
    id: string;
    title: string;       // Chinese only
    desc: string;        // Chinese only
    category: 'hotel' | 'microservice' | 'ddd' | 'cloudnative' | 'database' | 'ai';
    categoryLabel: string;
    // ...
  }
  ```
- **Consequence**: `TemplatesModal.tsx` rendered `{tpl.title}` and `{tpl.desc}` directly. Even with the Studio UI switched to English, template cards remained 100% Chinese.

### 2. Defect 2: Untranslated Category Badges on Template Cards
- **Code State**: Modal top category tabs used translated dictionaries (`categoryMicroservice: 'Microservices'`), but the badge in the top-left corner of the card preview bound directly to `{tpl.categoryLabel}`.
- **Consequence**: In English mode, the top tab read `Microservices`, while the card badge displayed `'微服务 & 电商中台'`.

### 3. Defect 3: Search Index Disconnect in English
- **Code State**: Search filtering compared `searchQuery` solely against `tpl.title` and `tpl.desc`.
- **Consequence**: Searching for terms like `Microservice`, `Gateway`, or `CloudNative` returned zero results because the data layer only contained Chinese text.

### 4. Defect 4: Project Title Lacks Language Awareness Upon Cloning
- **Code State**:
  ```typescript
  const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
    setDSL(tpl.dsl);
    const newProjectId = await createProject(tpl.title, useProjectStore.getState().dsl);
  };
  ```
- **Consequence**: Clicking "Apply Template" in English mode initialized the top bar project name and `dsl.meta.title` to the Chinese title, producing Chinese filenames during HTML export or video recording.

---

## 5. Comprehensive i18n Architecture for Template System

### 1. Recommendation 1: Extend `ArchitectureTemplate` Interface with `titleI18n` & `descI18n`
In [apps/studio/src/templates/index.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/index.ts):

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

### 2. Recommendation 2: Wire Card Category Badges to i18n Dictionary
In [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx), reuse translated category definitions:

```tsx
<Badge variant="slate" className="backdrop-blur-md bg-black/60 border-white/20 text-xs text-white">
  {categories.find((c) => c.id === tpl.category)?.label || tpl.categoryLabelI18n?.[currentLang] || tpl.categoryLabel}
</Badge>
```
- **Chinese Mode**: `微服务 & 电商`
- **English Mode**: `Microservices`

### 3. Recommendation 3: Context-Aware Card Display & Dual-Language Fuzzy Search
Introduce language awareness in [TemplatesModal.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/components/modals/TemplatesModal.tsx):

```typescript
const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';

const getTemplateTitle = (tpl: ArchitectureTemplate) =>
  currentLang === 'en' && tpl.titleI18n?.en ? tpl.titleI18n.en : tpl.title;

const getTemplateDesc = (tpl: ArchitectureTemplate) =>
  currentLang === 'en' && tpl.descI18n?.en ? tpl.descI18n.en : tpl.desc;
```

Support bi-directional keyword search:
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

### 4. Recommendation 4: Language-Aware Initialization When Creating Projects from Templates
In [apps/studio/src/App.tsx](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/App.tsx) `handleApplyTemplate`:

```typescript
const handleApplyTemplate = async (tpl: ArchitectureTemplate) => {
  const currentLang = (i18n.language || 'zh').startsWith('zh') ? 'zh' : 'en';
  const initialTitle = (currentLang === 'en' && tpl.titleI18n?.en) ? tpl.titleI18n.en : tpl.title;

  const clonedDSL: FocusFlowDSL = {
    ...tpl.dsl,
    meta: {
      ...tpl.dsl.meta,
      title: initialTitle,
    },
  };

  setDSL(clonedDSL);
  setActiveSceneIndex(0);

  const newProjectId = await createProject(initialTitle, clonedDSL);
  console.log('Created project from template:', newProjectId, initialTitle);
};
```

### 5. Complementary Mechanism: Single-Language Template Fallback Chain
As open-source community contributions grow, single-language templates (e.g., enterprise intranets or locale-specific compliance topologies) will emerge. The architecture provides natural fallback:

1. **Three-Tier Fallback Chain**:
   ```typescript
   export function getTemplateTitle(tpl: ArchitectureTemplate, lang: string): string {
     return tpl.titleI18n?.[lang as 'zh' | 'en'] || tpl.title;
   }
   export function getTemplateDesc(tpl: ArchitectureTemplate, lang: string): string {
     return tpl.descI18n?.[lang as 'zh' | 'en'] || tpl.desc;
   }
   ```
2. **Zero Overhead for Single-Language Authors**: Specifying only `title` and `desc` without `titleI18n.en` works cleanly without build warnings.
3. **Locale Indicator Badges**: Templates lacking a translation for the active UI language display a subtle badge (`ZH Only`) to set clear expectations.

### 6. Multi-Language Considerations for Voiceover Scripts & AI Narration

#### (1) Diagnostic: Decoupling Hardcoded Voiceover Scripts
In [aiTtsSynthesizer.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/services/audio/tts/aiTtsSynthesizer.ts) and timeline components, voiceover extraction previously defaulted to `scene.voiceoverScript?.trim() || scene.title`.

#### (2) Runtime Voiceover Resolution Fallback
```typescript
export function getSceneVoiceoverScript(scene: SceneStep, lang: string = 'zh'): string {
  if (scene.voiceoverScriptI18n?.[lang]?.trim()) {
    return scene.voiceoverScriptI18n[lang].trim();
  }
  if (scene.voiceoverScript?.trim()) {
    return scene.voiceoverScript.trim();
  }
  return scene.titleI18n?.[lang] || scene.title || '';
}
```

#### (3) Primary Script Injection on Instantiation
When a user in English mode creates a project from a template:
- Assign `scene.voiceoverScript = scene.voiceoverScriptI18n.en` and `scene.title = scene.titleI18n.en`.
- Retain complete original `voiceoverScriptI18n` dictionaries in the DSL for lossless language switching.

#### (4) Acoustic Differences & Adaptive Duration (`adaptedDuration`)
English spoken technical terminology takes 10%~25% longer than concise Chinese. The TTS engine automatically adapts `scene.duration` and timeline scene markers to prevent premature camera transitions.

### 7. Internationalization Audit of Underlying SVG Assets
Inspection of [microservices-architecture.svg](file:///Users/xt/WebstormProjects/focusflow/apps/studio/public/templates/microservices-architecture.svg) confirms all headers, components (`APISIX`, `Nacos`, `Sentinel`, `Seata TC`, `Kafka`, `MySQL`), and metrics (`120k QPS`, `100% ACID`) are natively designed in standard English. No dual SVG assets are required; runtime software i18n fully closes the loop.

---

## 6. Bilingual Template Data Matrix

| Template ID | Language | Title | Description | Category |
| :--- | :--- | :--- | :--- | :--- |
| **`tpl-hotel-pms`** | **ZH** | LuxeHMS 酒店 PMS 房态与高并发预订核心架构 | NestJS CASL 动态鉴权 + Redis 房态分布式锁 + PostgreSQL 行级事务 + Tape Chart 房态甘特图 | `hotel`<br/>(酒店 & 调度系统) |
| | **EN** | LuxeHMS Hotel PMS & High-Concurrency Booking Engine | NestJS CASL Auth + Redis Distributed Locks + PostgreSQL Row Transactions + Interactive Tape Chart PiP | `hotel`<br/>(Hotel & Scheduling) |
| **`tpl-microservices`** | **ZH** | 微服务高可用电商中台演进架构 | APISIX 网关集群 + 订单状态机 + Redis Lua 库存防超卖 + Seata AT 2PC 分布式事务 | `microservice`<br/>(微服务 & 电商) |
| | **EN** | Cloud-Native High-Availability Microservices Topology | APISIX Gateway Cluster + Order State Machine + Redis Lua Anti-Overselling + Seata AT 2PC Transaction | `microservice`<br/>(Microservices) |
| **`tpl-ai-rag-pipeline`** | **ZH** | 企业级大模型 RAG 检索增强生成全链路架构 | 知识库递归切片 + Milvus 密集向量检索 + Cross-Encoder 重排 + Prompt 组装与 LLM 溯源推理 | `ai`<br/>(AI 大模型 & RAG) |
| | **EN** | Enterprise LLM RAG Pipeline & Semantic Retrieval | Document Ingestion + Milvus Vector Search + Cross-Encoder Rerank + Grounded LLM Reasoning | `ai`<br/>(AI & LLM RAG) |
| **`tpl-realtime-lakehouse`** | **ZH** | 实时流批一体湖仓与智能分析拓扑 | Debezium CDC 增量采集 + Kafka 3.7 KRaft 削峰 + Flink 1.19 状态计算 + Apache Iceberg 湖仓与 ClickHouse OLAP | `database`<br/>(分布式计算 & 湖仓) |
| | **EN** | Real-Time Lakehouse & Streaming Analytics Topology | Debezium CDC + Kafka 3.7 KRaft + Flink Stateful Stream + Apache Iceberg ACID Lakehouse & ClickHouse | `database`<br/>(Streaming & Lakehouse) |
| **`tpl-ddd-architecture`** | **ZH** | DDD 领域驱动设计典型分层架构模型 | Interfaces 用户接口层 + Application 应用服务层 + Domain 聚合根核心 + Infrastructure 基础设施仓储 | `ddd`<br/>(DDD 领域驱动) |
| | **EN** | Domain-Driven Design (DDD) Layered Architecture | User Interface + Application Service + Domain Aggregate Root + Infrastructure Repository | `ddd`<br/>(DDD Architecture) |
| **`tpl-k8s-cloudnative`** | **ZH** | Kubernetes 云原生 GitOps 自动化流水线 | Git 声明式配置仓库 + ArgoCD 控制器 + K8s 集群金丝雀渐进式发布演进 | `cloudnative`<br/>(云原生 & DevOps) |
| | **EN** | Kubernetes Cloud-Native GitOps Delivery Pipeline | Declarative Git Repo + Progressive K8s Canary Deployment Engine | `cloudnative`<br/>(Cloud Native) |

---

## 7. Implementation Roadmap & Acceptance Checklist

### Phase 0: Baseline Calibration & Spec
- [x] **Microservices Template Consolidation**: Precise coordinates, durations, and elements locked in [tpl-microservices.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/src/templates/tpl-microservices.ts).
- [x] **Motion Restraint Documentation**: Codified Asset Immutability Principle; discarded redundant Dot particle overlays.
- [x] **Three Flagship Templates Deep Audit**:
  - [x] Microservices Topology: 5 scenes audited; 120k QPS / 36k TPS capacity validated; bilingual scripts synced.
  - [x] Enterprise AI RAG: 5 cinematic scenes upgraded; 11 elements with bilingual scripts; tech stack covers DeepSeek-R1 / Claude 3.5 Sonnet / Milvus 2.4 / Ragas.
  - [x] Real-Time Lakehouse: 5 scenes upgraded; 10 elements with bilingual scripts; tech stack covers Debezium CDC / Kafka 3.7 KRaft / Flink 1.19 / Iceberg V2 / ClickHouse 24.

### Phase 1: Types & Metadata Layer
- [x] **1.1 Extend `ArchitectureTemplate`**: Added `titleI18n`, `descI18n`, `categoryLabelI18n`, `supportedLangs`.
- [x] **1.2 Bilingual Metadata Injection**: Populated 3 core flagship templates with complete `titleI18n` and `descI18n`.
- [x] **1.3 Multi-Language Fallback Utilities**: Implemented `getTemplateTitle`, `getTemplateDesc`, and `getSceneVoiceoverScript`.
- [x] **1.4 Single-Language Template Type Safety**: Verified seamless fallback without TypeScript warnings.

### Phase 2: TemplatesModal UI & UX
- [x] **2.1 Card Category Badge i18n**: Dynamically resolved via `categories.find(c => c.id === tpl.category)?.label`.
- [x] **2.2 Card Title & Description Language Adaptation**: Rendered dynamically through fallback helpers.
- [x] **2.3 Bi-Directional Fuzzy Search**: Supports concurrent querying across English and Chinese terms.
- [x] **2.4 Locale Indicator Badge**: Single-language templates display `ZH Only` pill in English mode.

### Phase 3: Template Instantiation
- [x] **3.1 Dynamic Project Title**: Initializes project name and `dsl.meta.title` using active language.
- [x] **3.2 Scene Title & Script Injection**: Populates primary `scene.title` and `scene.voiceoverScript` matching active locale while preserving dual dictionaries in DSL.

### Phase 4: Voiceover & Audio TTS Pipeline
- [x] **4.1 Decouple TTS Script Extraction**: Synthesizer consumes resolved voiceover text per active language.
- [x] **4.2 Speaker Model & Locale Matching**: Passes language parameters and generates localized scene markers.
- [x] **4.3 Adaptive Duration Calibration**: Stretches `scene.duration` to match physical audio track length.
- [x] **4.4 Waveform & Teleprompter Sync**: Timeline and Inspector adapt display text to match active locale.

### Phase 5: Audience & Export Subtitles
- [x] **5.1 Audience Modal Subtitle Switching**: Playback island and offline speech use resolved script.
- [x] **5.2 Standalone HTML Export**: Verified exported single-file HTML player correctly renders localized scenes.

### Phase 6: Testing & Quality Gate
- [x] **6.1 Type & Build Gate**: Zero TypeScript errors (`pnpm --filter studio typecheck`) and successful bundle builds.
- [x] **6.2 Playwright E2E Coverage**: Solidified [e2e/templates-i18n.spec.ts](file:///Users/xt/WebstormProjects/focusflow/apps/studio/e2e/templates-i18n.spec.ts).
- [x] **6.3 Visual Inspection**: Verified flawless bilingual visual layouts and text wrapping.
