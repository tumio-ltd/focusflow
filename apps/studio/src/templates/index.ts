import type { FocusFlowDSL, SceneStep, CalloutItem } from '@focusflow/dsl';
import { hotelPmsTemplate } from './tpl-hotel-pms';
import { microservicesTemplate } from './tpl-microservices';
import { dddArchitectureTemplate } from './tpl-ddd-architecture';
import { k8sCloudNativeTemplate } from './tpl-k8s-cloudnative';
import { realtimeLakehouseTemplate } from './tpl-realtime-lakehouse';
import { aiRagPipelineTemplate } from './tpl-ai-rag-pipeline';
import { focusflowArchitectureTemplate } from './tpl-focusflow-architecture';
import { focusflowWorkflowTemplate } from './tpl-focusflow-workflow';

export interface ArchitectureTemplate {
  id: string;
  title: string;
  titleI18n?: {
    zh?: string;
    en?: string;
  };
  category: 'hotel' | 'microservice' | 'ddd' | 'cloudnative' | 'database' | 'ai' | 'devtools';
  categoryLabel: string;
  categoryLabelI18n?: {
    zh?: string;
    en?: string;
  };
  desc: string;
  descI18n?: {
    zh?: string;
    en?: string;
  };
  sceneCount: number;
  estimatedDuration: number;
  accentColor: string;
  coverImage: string;
  coverImageI18n?: {
    zh?: string;
    en?: string;
  };
  featured?: boolean;
  supportedLangs?: ('zh' | 'en')[];
  dsl: FocusFlowDSL;
}

/**
 * Multilingual fallback helpers
 */
export function getTemplateTitle(tpl: ArchitectureTemplate, lang: string = 'zh'): string {
  const normLang = lang.startsWith('en') ? 'en' : 'zh';
  return tpl.titleI18n?.[normLang] || tpl.title;
}

export function getTemplateDesc(tpl: ArchitectureTemplate, lang: string = 'zh'): string {
  const normLang = lang.startsWith('en') ? 'en' : 'zh';
  return tpl.descI18n?.[normLang] || tpl.desc;
}

export function getTemplateCover(tpl: ArchitectureTemplate, lang: string = 'zh'): string {
  const normLang = lang.startsWith('en') ? 'en' : 'zh';
  return tpl.coverImageI18n?.[normLang] || tpl.coverImage;
}

export function getSceneVoiceoverScript(scene: SceneStep, lang: string = 'zh'): string {
  const normLang = lang.startsWith('en') ? 'en' : 'zh';
  if (scene.voiceoverScriptI18n?.[normLang]?.trim()) {
    return scene.voiceoverScriptI18n[normLang].trim();
  }
  if (scene.voiceoverScript?.trim()) {
    return scene.voiceoverScript.trim();
  }
  return scene.titleI18n?.[normLang] || scene.title || '';
}

export function getCalloutTitle(callout: CalloutItem, lang: string = 'en'): string {
  const normLang = lang.startsWith('zh') ? 'zh' : (lang.startsWith('en') ? 'en' : lang.toLowerCase());
  return callout.titleI18n?.[normLang] || callout.titleI18n?.en || callout.title;
}

export function getCalloutDesc(callout: CalloutItem, lang: string = 'en'): string {
  const normLang = lang.startsWith('zh') ? 'zh' : (lang.startsWith('en') ? 'en' : lang.toLowerCase());
  return callout.descI18n?.[normLang] || callout.descI18n?.en || callout.desc;
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'tpl-focusflow-workflow',
    title: 'FocusFlow 活画布官方功能全景与痛点破局 (45s 宣传导播)',
    titleI18n: {
      zh: 'FocusFlow 活画布官方功能全景与痛点破局 (45s 宣传导播)',
      en: 'FocusFlow Living Canvas · 45s Official Feature Showcase',
    },
    category: 'devtools',
    categoryLabel: '官方宣传 & 活画布全景',
    categoryLabelI18n: {
      zh: '官方宣传 & 活画布全景',
      en: 'Showcase & Living Canvas',
    },
    desc: '瑞士极简白底全景 + 传统演示三大困境破局 + 视锥取景 + 60fps 空间连续运镜 + 随时暂停交互 + 1080P/单HTML双模交付',
    descI18n: {
      zh: '瑞士极简白底全景 + 传统演示三大困境破局 + 视锥取景 + 60fps 空间连续运镜 + 随时暂停交互 + 1080P/单HTML双模交付',
      en: 'Swiss Clean 4K Canvas + Paradigm Shift + Camera Frustum Framing + 60fps Spatial Continuity + Live Pause + Dual Delivery',
    },
    sceneCount: 5,
    estimatedDuration: 56,
    accentColor: '#2563eb',
    coverImage: '/focusflow_workflow_light.png',
    coverImageI18n: {
      zh: '/focusflow_workflow_light.png',
      en: '/focusflow_workflow_light_en.png',
    },
    featured: true,
    supportedLangs: ['zh', 'en'],
    dsl: focusflowWorkflowTemplate,
  },
  {
    id: 'tpl-focusflow-architecture',
    title: 'FocusFlow Studio 官方架构与 60fps 运镜演播',
    titleI18n: {
      zh: 'FocusFlow Studio 官方架构与 60fps 运镜演播',
      en: 'FocusFlow Studio Architecture & 60fps Walkthrough',
    },
    category: 'devtools',
    categoryLabel: '开发者工具 & 引擎架构',
    categoryLabelI18n: {
      zh: '开发者工具 & 架构',
      en: 'DevTools & Architecture',
    },
    desc: '4K 工作台人机交互层 + 毫秒级 Sobel CV 边缘吸附 + 60fps GPU 运镜与贝塞尔流光 + 100% 离线单文件 HTML 独立编译器',
    descI18n: {
      zh: '4K 工作台人机交互层 + 毫秒级 Sobel CV 边缘吸附 + 60fps GPU 运镜与贝塞尔流光 + 100% 离线单文件 HTML 独立编译器',
      en: 'Workbench Anatomy + Real-time Sobel CV Snapping + 60fps GPU Kinematics + 100% Offline Single-File HTML Compiler',
    },
    sceneCount: 6,
    estimatedDuration: 102,
    accentColor: '#06b6d4',
    coverImage: '/focusflow_architecture_dark.png',
    featured: true,
    supportedLangs: ['en', 'zh'],
    dsl: focusflowArchitectureTemplate,
  },
  {
    id: 'tpl-hotel-pms',
    title: 'LuxeHMS 酒店 PMS 房态与高并发预订核心架构 (经典示例升级版)',
    category: 'hotel',
    categoryLabel: '酒店 & 调度系统',
    desc: 'NestJS CASL 动态鉴权 + Redis 房态分布式锁 + PostgreSQL 行级事务 + Tape Chart 房态甘特画卷画中画深度下钻',
    sceneCount: 5,
    estimatedDuration: 7.3,
    accentColor: '#38bdf8',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    featured: true,
    dsl: hotelPmsTemplate,
  },
  {
    id: 'tpl-microservices',
    title: '微服务高可用电商中台演进架构',
    titleI18n: {
      zh: '微服务高可用电商中台演进架构',
      en: 'Cloud-Native High-Availability Microservices Topology',
    },
    category: 'microservice',
    categoryLabel: '微服务 & 电商中台',
    categoryLabelI18n: {
      zh: '微服务 & 电商',
      en: 'Microservices',
    },
    desc: 'APISIX 网关集群 + 订单状态机 + Redis Lua 库存防超卖 + Seata AT 2PC 分布式事务',
    descI18n: {
      zh: 'APISIX 网关集群 + 订单状态机 + Redis Lua 库存防超卖 + Seata AT 2PC 分布式事务',
      en: 'APISIX Gateway Cluster + Order State Machine + Redis Lua Anti-Overselling + Seata AT 2PC Transaction',
    },
    sceneCount: 5,
    estimatedDuration: 7.2,
    accentColor: '#34d399',
    coverImage: './templates/microservices-architecture.svg',
    supportedLangs: ['zh', 'en'],
    dsl: microservicesTemplate,
  },
  {
    id: 'tpl-ddd-architecture',
    title: 'DDD 领域驱动设计典型分层架构模型',
    category: 'ddd',
    categoryLabel: 'DDD 领域驱动设计',
    desc: 'Interfaces 用户接口层 + Application 应用服务层 + Domain 聚合根核心 + Infrastructure 基础设施仓储',
    sceneCount: 2,
    estimatedDuration: 2.6,
    accentColor: '#fbbf24',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    dsl: dddArchitectureTemplate,
  },
  {
    id: 'tpl-k8s-cloudnative',
    title: 'Kubernetes 云原生 GitOps 自动化流水线',
    category: 'cloudnative',
    categoryLabel: '云原生 & DevOps',
    desc: 'Git 声明式配置仓库 + ArgoCD 控制器 + K8s 集群金丝雀渐进式发布演进',
    sceneCount: 2,
    estimatedDuration: 2.6,
    accentColor: '#0ea5e9',
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=600&q=80',
    dsl: k8sCloudNativeTemplate,
  },
  {
    id: 'tpl-realtime-lakehouse',
    title: '实时流批一体湖仓与智能分析拓扑',
    titleI18n: {
      zh: '实时流批一体湖仓与智能分析拓扑',
      en: 'Real-Time Lakehouse & Streaming Analytics Topology',
    },
    category: 'database',
    categoryLabel: '实时计算 & 数据湖仓',
    categoryLabelI18n: {
      zh: '实时计算 & 数据湖仓',
      en: 'Streaming & Lakehouse',
    },
    desc: 'Debezium CDC 增量采集 + Kafka 3.7 KRaft 削峰 + Flink 1.19 状态计算 + Apache Iceberg 湖仓与 ClickHouse OLAP',
    descI18n: {
      zh: 'Debezium CDC 增量采集 + Kafka 3.7 KRaft 削峰 + Flink 1.19 状态计算 + Apache Iceberg 湖仓与 ClickHouse OLAP',
      en: 'Debezium CDC + Kafka 3.7 KRaft + Flink Stateful Stream + Apache Iceberg ACID Lakehouse & ClickHouse',
    },
    sceneCount: 5,
    estimatedDuration: 9.4,
    accentColor: '#34d399',
    coverImage: './templates/realtime-lakehouse.svg',
    supportedLangs: ['zh', 'en'],
    dsl: realtimeLakehouseTemplate,
  },
  {
    id: 'tpl-ai-rag-pipeline',
    title: '企业级大模型 RAG 检索增强生成全链路架构',
    titleI18n: {
      zh: '企业级大模型 RAG 检索增强生成全链路架构',
      en: 'Enterprise LLM RAG Pipeline & Semantic Retrieval',
    },
    category: 'ai',
    categoryLabel: 'AI 大模型 & RAG',
    categoryLabelI18n: {
      zh: 'AI 大模型 & RAG',
      en: 'AI & LLM RAG',
    },
    desc: '知识库递归切片 + Milvus 密集向量检索 + Cross-Encoder 重排 + Prompt 组装与 LLM 溯源推理',
    descI18n: {
      zh: '知识库递归切片 + Milvus 密集向量检索 + Cross-Encoder 重排 + Prompt 组装与 LLM 溯源推理',
      en: 'Document Ingestion + Milvus Vector Search + Cross-Encoder Rerank + Grounded LLM Reasoning',
    },
    sceneCount: 5,
    estimatedDuration: 9.4,
    accentColor: '#a855f7',
    coverImage: './templates/ai-rag-pipeline.svg',
    supportedLangs: ['zh', 'en'],
    dsl: aiRagPipelineTemplate,
  },
];
