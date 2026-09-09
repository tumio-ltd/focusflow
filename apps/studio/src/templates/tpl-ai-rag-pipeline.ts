import type { FocusFlowDSL } from '@focusflow/dsl';

export const aiRagPipelineTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '企业级大模型 RAG 检索增强生成全链路架构',
    viewport: { width: 3840, height: 2160 },
    theme: { mode: 'dark', accent: '#a855f7' },
    controls: { showHUDButton: true, autoplay: false, interval: 3600 },
  },
  asset: {
    url: './templates/ai-rag-pipeline.svg',
  },
  elements: {
    boxes: [
      {
        id: 'box-docs-chunk',
        type: 'rect',
        x: 300,
        y: 600,
        width: 650,
        height: 440,
        rx: 16,
        style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-milvus-vector',
        type: 'rect',
        x: 1200,
        y: 600,
        width: 750,
        height: 440,
        rx: 16,
        style: { stroke: '#34d399', strokeWidth: 5, glow: true },
      },
      {
        id: 'box-reranker',
        type: 'rect',
        x: 2150,
        y: 600,
        width: 650,
        height: 440,
        rx: 16,
        style: { stroke: '#fbbf24', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-llm-inference',
        type: 'rect',
        x: 3000,
        y: 600,
        width: 650,
        height: 440,
        rx: 18,
        style: { stroke: '#a855f7', strokeWidth: 6, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-chunk-vector',
        from: 'box-docs-chunk.right',
        to: 'box-milvus-vector.left',
        style: { stroke: '#38bdf8', strokeWidth: 3, mode: 'stream', flowSpeed: 2.0 },
      },
      {
        id: 'path-vector-rerank',
        from: 'box-milvus-vector.right',
        to: 'box-reranker.left',
        style: { stroke: '#34d399', strokeWidth: 3, mode: 'stream', flowSpeed: 2.0 },
      },
      {
        id: 'path-rerank-llm',
        from: 'box-reranker.right',
        to: 'box-llm-inference.left',
        style: { stroke: '#a855f7', strokeWidth: 4, mode: 'stream', flowSpeed: 2.4 },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 知识库切片与多模态 Embedding 向量化',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-docs-chunk', 'box-milvus-vector', 'box-reranker', 'box-llm-inference'],
        paths: ['path-chunk-vector', 'path-vector-rerank', 'path-rerank-llm'],
        callouts: [
          {
            id: 'co-rag-1',
            targetBoxId: 'box-docs-chunk',
            position: { left: '340px', top: '520px' },
            theme: 'blue',
            title: '语义递归切片 (Recursive Chunking)',
            desc: '保留标题层级与上下文重叠度 (Overlap 15%)',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 混合检索与 Cross-Encoder 精准重排',
      camera: { zoom: 1.8, x: -2, y: 0, duration: 1.4 },
      activeElements: {
        boxes: ['box-milvus-vector', 'box-reranker'],
        paths: ['path-vector-rerank'],
        callouts: [
          {
            id: 'co-rag-2',
            targetBoxId: 'box-milvus-vector',
            position: { left: '1240px', top: '520px' },
            theme: 'green',
            title: '密集向量 + 稀疏关键词混合检索',
            desc: '结合 BM25 与 HNSW 向量索引，召回 Top-50 后经 BGE-Reranker 过滤至 Top-5',
          },
        ],
      },
    },
    {
      id: 'scene-3',
      title: '03 Prompt 上下文组装与大模型深度推理',
      camera: { zoom: 1.9, x: 28, y: 0, duration: 1.5 },
      activeElements: {
        boxes: ['box-llm-inference'],
        paths: ['path-rerank-llm'],
        callouts: [
          {
            id: 'co-rag-3',
            targetBoxId: 'box-llm-inference',
            position: { left: '3040px', top: '520px' },
            theme: 'cyan',
            title: 'LLM 生成与引用溯源 (Citations)',
            desc: '严格依据引用切片上下文回答，从源头杜绝大模型幻觉',
          },
        ],
      },
    },
  ],
};
