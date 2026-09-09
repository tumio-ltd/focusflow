import type { FocusFlowDSL } from '@focusflow/dsl';
import { hotelPmsTemplate } from './tpl-hotel-pms';
import { microservicesTemplate } from './tpl-microservices';
import { dddArchitectureTemplate } from './tpl-ddd-architecture';
import { k8sCloudNativeTemplate } from './tpl-k8s-cloudnative';
import { realtimeLakehouseTemplate } from './tpl-realtime-lakehouse';
import { aiRagPipelineTemplate } from './tpl-ai-rag-pipeline';

export interface ArchitectureTemplate {
  id: string;
  title: string;
  category: 'hotel' | 'microservice' | 'ddd' | 'cloudnative' | 'database' | 'ai';
  categoryLabel: string;
  desc: string;
  sceneCount: number;
  estimatedDuration: number;
  accentColor: string;
  coverImage: string;
  featured?: boolean;
  dsl: FocusFlowDSL;
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
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
    category: 'microservice',
    categoryLabel: '微服务 & 电商中台',
    desc: 'API 网关集群 + 订单微服务 + 库存防超卖 + Seata AT 分布式事务一致性协调',
    sceneCount: 5,
    estimatedDuration: 7.2,
    accentColor: '#34d399',
    coverImage: './templates/microservices-architecture.svg',
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
    category: 'database',
    categoryLabel: '实时计算 & 数据湖仓',
    desc: 'Debezium CDC 增量采集 + Kafka 3.7 KRaft 削峰 + Flink 1.19 状态计算 + Apache Iceberg 湖仓与 ClickHouse OLAP',
    sceneCount: 3,
    estimatedDuration: 4.2,
    accentColor: '#34d399',
    coverImage: './templates/realtime-lakehouse.svg',
    dsl: realtimeLakehouseTemplate,
  },
  {
    id: 'tpl-ai-rag-pipeline',
    title: '企业级大模型 RAG 检索增强生成全链路架构',
    category: 'ai',
    categoryLabel: 'AI 大模型 & RAG',
    desc: '知识库递归切片 + Milvus 密集向量检索 + Cross-Encoder 重排 + Prompt 组装与 LLM 溯源推理',
    sceneCount: 3,
    estimatedDuration: 4.1,
    accentColor: '#a855f7',
    coverImage: './templates/ai-rag-pipeline.svg',
    dsl: aiRagPipelineTemplate,
  },
];
