import type { FocusFlowDSL } from '@focusflow/dsl';

export const aiRagPipelineTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '企业级大模型 RAG 检索增强生成全链路架构',
    viewport: {
      width: 3840,
      height: 2160,
      aspectRatio: '16:9',
    },
    theme: {
      mode: 'dark',
      accent: '#a855f7',
    },
    controls: {
      showHUDButton: true,
      autoplay: false,
      interval: 4000,
      showControls: false,
    },
  },
  asset: {
    url: './templates/ai-rag-pipeline.svg',
  },
  elements: {
    boxes: [
      // ROW 1: 边缘网关、语义缓存、智能体编排与工具沙箱
      {
        id: 'box-client-ingress',
        type: 'rect',
        x: 300,
        y: 260,
        width: 650,
        height: 220,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-semantic-cache',
        type: 'rect',
        x: 1200,
        y: 260,
        width: 750,
        height: 220,
        rx: 16,
        style: {
          stroke: '#34d399',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-agent-orchestrator',
        type: 'rect',
        x: 2150,
        y: 260,
        width: 650,
        height: 220,
        rx: 16,
        style: {
          stroke: '#fbbf24',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-tool-sandbox',
        type: 'rect',
        x: 3000,
        y: 260,
        width: 650,
        height: 220,
        rx: 16,
        style: {
          stroke: '#a855f7',
          strokeWidth: 2,
          glow: false,
        },
      },

      // ROW 2: 核心四大阶段 (Core 4 Stages)
      {
        id: 'box-docs-chunk',
        type: 'rect',
        x: 300,
        y: 600,
        width: 650,
        height: 440,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-milvus-vector',
        type: 'rect',
        x: 1200,
        y: 600,
        width: 750,
        height: 440,
        rx: 16,
        style: {
          stroke: '#34d399',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-reranker',
        type: 'rect',
        x: 2150,
        y: 600,
        width: 650,
        height: 440,
        rx: 16,
        style: {
          stroke: '#fbbf24',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-llm-inference',
        type: 'rect',
        x: 3000,
        y: 600,
        width: 650,
        height: 440,
        rx: 18,
        style: {
          stroke: '#a855f7',
          strokeWidth: 5,
          glow: true,
        },
      },

      // ROW 3: 底层数据湖、可观测评估与微调飞轮
      {
        id: 'box-storage-lake',
        type: 'rect',
        x: 300,
        y: 1140,
        width: 900,
        height: 240,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-eval-observability',
        type: 'rect',
        x: 1300,
        y: 1140,
        width: 1300,
        height: 240,
        rx: 16,
        style: {
          stroke: '#a855f7',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-feedback-flywheel',
        type: 'rect',
        x: 2700,
        y: 1140,
        width: 950,
        height: 240,
        rx: 16,
        style: {
          stroke: '#fbbf24',
          strokeWidth: 2,
          glow: false,
        },
      },
    ],
    paths: [
      {
        id: 'path-chunk-vector',
        from: 'box-docs-chunk.right',
        to: 'box-milvus-vector.left',
        style: {
          stroke: '#38bdf8',
          strokeWidth: 3,
          mode: 'draw',
          flowSpeed: 2.0,
        },
      },
      {
        id: 'path-vector-rerank',
        from: 'box-milvus-vector.right',
        to: 'box-reranker.left',
        style: {
          stroke: '#34d399',
          strokeWidth: 3,
          mode: 'draw',
          flowSpeed: 2.0,
        },
      },
      {
        id: 'path-rerank-llm',
        from: 'box-reranker.right',
        to: 'box-llm-inference.left',
        style: {
          stroke: '#a855f7',
          strokeWidth: 4,
          mode: 'draw',
          flowSpeed: 2.4,
        },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 企业级大模型 RAG 全链路拓扑',
      titleI18n: {
        zh: '01 企业级大模型 RAG 全链路拓扑',
        en: '01 Global GenAI & RAG Pipeline',
      },
      duration: 17500,
      voiceoverScript:
        '欢迎体验 FocusFlow 企业级大模型 RAG 全链路拓扑。系统采用现代化云原生架构，涵盖端到端 180 毫秒混合检索重排、LangGraph 智能体状态机编排，以及结合 DeepSeek-R1 与 Claude 3.5 Sonnet 的零幻觉溯源推理闭环。',
      voiceoverScriptI18n: {
        zh: '欢迎体验 FocusFlow 企业级大模型 RAG 全链路拓扑。系统采用现代化云原生架构，涵盖端到端 180 毫秒混合检索重排、LangGraph 智能体状态机编排，以及结合 DeepSeek-R1 与 Claude 3.5 Sonnet 的零幻觉溯源推理闭环。',
        en: 'Welcome to the FocusFlow Enterprise GenAI and Multi-Stage RAG Pipeline. Built for sub-180ms hybrid retrieval and LangGraph multi-agent orchestration, this architecture ensures zero-hallucination grounded reasoning powered by DeepSeek-R1 and Claude 3.5 Sonnet.',
      },
      camera: {
        zoom: 1,
        x: 0,
        y: 0,
        duration: 1.2,
      },
      activeElements: {
        boxes: [
          'box-client-ingress',
          'box-semantic-cache',
          'box-agent-orchestrator',
          'box-tool-sandbox',
          'box-docs-chunk',
          'box-milvus-vector',
          'box-reranker',
          'box-llm-inference',
          'box-storage-lake',
          'box-eval-observability',
          'box-feedback-flywheel',
        ],
        paths: [],
        callouts: [
          {
            id: 'co-rag-overview',
            targetBoxId: 'box-llm-inference',
            position: {
              left: '2980px',
              top: '1060px',
            },
            theme: 'purple',
            title: 'Production-Grade GenAI RAG',
            desc: 'Sub-180ms P99 latency, 120M+ vector scale with 99.4% grounded faithfulness',
            titleI18n: {
              zh: '企业级 RAG 生产级标杆',
              en: 'Production-Grade GenAI RAG',
            },
            descI18n: {
              zh: '端到端 P99 < 180ms，支持 1.2 亿向量切片与 99.4% 零幻觉忠实度',
              en: 'Sub-180ms P99 latency, 120M+ vector scale with 99.4% grounded faithfulness',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 多模态语义切片与双重 Embedding',
      titleI18n: {
        zh: '02 多模态语义切片与双重 Embedding',
        en: '02 Semantic Ingestion & Dual Embedding',
      },
      duration: 19500,
      voiceoverScript:
        '文档接入层采用 LayoutLMv3 解析复杂版式，结合 AST 语法树与 512 Token 递归滑动窗口，保留 15% 上下文重叠；通过 BGE-M3 生成 1024 维密集向量，并同步提取 BM25 词频，支撑每分钟 24,000 篇文档的高吞吐灌库。',
      voiceoverScriptI18n: {
        zh: '文档接入层采用 LayoutLMv3 解析复杂版式，结合 AST 语法树与 512 Token 递归滑动窗口，保留 15% 上下文重叠；通过 BGE-M3 生成 1024 维密集向量，并同步提取 BM25 词频，支撑每分钟 24,000 篇文档的高吞吐灌库。',
        en: 'The ingestion tier parses complex documents via LayoutLMv3 and AST trees. Utilizing recursive chunking with 15% overlap, it generates 1024-dim dense embeddings via BGE-M3 alongside BM25 sparse frequencies, sustaining 24,000 documents per minute.',
      },
      camera: {
        zoom: 1.85,
        x: -28,
        y: -5,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-docs-chunk', 'box-client-ingress'],
        paths: ['path-chunk-vector'],
        callouts: [
          {
            id: 'co-rag-chunk',
            targetBoxId: 'box-docs-chunk',
            position: {
              left: '260px',
              top: '1060px',
            },
            theme: 'blue',
            title: 'Semantic Recursive Chunking',
            desc: '512-token window with 15% overlap prevents boundary truncation',
            titleI18n: {
              zh: '语义递归分块与重叠保护',
              en: 'Semantic Recursive Chunking',
            },
            descI18n: {
              zh: '512 Token 滑动窗口 + 15% 重叠，保持跨段落句子完整语义边界',
              en: '512-token window with 15% overlap prevents boundary truncation',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 420,
            },
          },
          {
            id: 'co-rag-embedding',
            targetBoxId: 'box-docs-chunk',
            position: {
              left: '960px',
              top: '620px',
            },
            theme: 'blue',
            title: 'Dual Embedding (Dense + BM25)',
            desc: '1024-dim dense embeddings + BM25 sparse tokens capture semantic & keyword intent',
            titleI18n: {
              zh: 'BGE-M3 密集 + 稀疏双嵌入',
              en: 'Dual Embedding (Dense + BM25)',
            },
            descI18n: {
              zh: '1024 维语义稠密向量结合 BM25 词频倒排，兼顾语义泛化与专有名词精确匹配',
              en: '1024-dim dense embeddings + BM25 sparse tokens capture semantic & keyword intent',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
    {
      id: 'scene-3',
      title: '03 Milvus 混合检索与 Cross-Encoder 重排',
      titleI18n: {
        zh: '03 Milvus 混合检索与 Cross-Encoder 重排',
        en: '03 Hybrid Retrieval & Cross-Encoder Rerank',
      },
      duration: 20500,
      voiceoverScript:
        'Milvus 2.4 分布式集群结合 GPU 加速 HNSW 索引与 Tantivy 全文稀疏检索，通过倒数排名融合算法召回 Top-50 候选集；随后由 BGE-Reranker 执行交叉注意力深度打分，裁剪至高信度 Top-5 切片，检索精度提升 34%。',
      voiceoverScriptI18n: {
        zh: 'Milvus 2.4 分布式集群结合 GPU 加速 HNSW 索引与 Tantivy 全文稀疏检索，通过倒数排名融合算法召回 Top-50 候选集；随后由 BGE-Reranker 执行交叉注意力深度打分，裁剪至高信度 Top-5 切片，检索精度提升 34%。',
        en: 'Milvus 2.4 pairs GPU-accelerated HNSW vectors with Tantivy full-text search, merging candidates via Reciprocal Rank Fusion. The BGE-Reranker applies cross-attention scoring to prune Top-50 down to the 5 most relevant chunks, boosting precision by 34%.',
      },
      camera: {
        zoom: 1.85,
        x: 0,
        y: -5,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-milvus-vector', 'box-reranker'],
        paths: ['path-vector-rerank'],
        callouts: [
          {
            id: 'co-rag-milvus',
            targetBoxId: 'box-milvus-vector',
            position: {
              left: '1160px',
              top: '1060px',
            },
            theme: 'green',
            title: 'Milvus Hybrid RRF Fusion',
            desc: 'Sub-8.4ms P95 search latency with 97.8% recall across 120M vector chunks',
            titleI18n: {
              zh: 'HNSW + Tantivy 混合检索 (RRF k=60)',
              en: 'Milvus Hybrid RRF Fusion',
            },
            descI18n: {
              zh: 'P95 检索延迟仅 8.4ms，Recall@50 达 97.8%，毫秒级融合粗排候选',
              en: 'Sub-8.4ms P95 search latency with 97.8% recall across 120M vector chunks',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-rag-rerank',
            targetBoxId: 'box-reranker',
            position: {
              left: '2120px',
              top: '1060px',
            },
            theme: 'amber',
            title: 'Cross-Attention Re-Ranking',
            desc: 'Prunes Top-50 to Top-5 and places high-scoring chunks at context edges',
            titleI18n: {
              zh: 'BGE-Reranker-Large 交叉注意力重排',
              en: 'Cross-Attention Re-Ranking',
            },
            descI18n: {
              zh: 'Top-50 裁剪至 Top-5，规避 Lost-in-the-Middle，检索精度大幅提升 34%',
              en: 'Prunes Top-50 to Top-5 and places high-scoring chunks at context edges',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
    {
      id: 'scene-4',
      title: '04 Prompt 组装与大模型引用溯源推理',
      titleI18n: {
        zh: '04 Prompt 组装与大模型引用溯源推理',
        en: '04 Grounded Reasoning & Citations',
      },
      duration: 19500,
      voiceoverScript:
        '精排切片经 Lost-in-the-Middle 重排后注入大模型上下文。DeepSeek-R1 通过思维链逐步交叉验证切片证据，以每秒 92 Token 极速生成，并在文本中标记可交互下钻的精确引用角标，使大模型幻觉率降低至 0.1% 以下。',
      voiceoverScriptI18n: {
        zh: '精排切片经 Lost-in-the-Middle 重排后注入大模型上下文。DeepSeek-R1 通过思维链逐步交叉验证切片证据，以每秒 92 Token 极速生成，并在文本中标记可交互下钻的精确引用角标，使大模型幻觉率降低至 0.1% 以下。',
        en: 'Top chunks are placed strategically into prompt edges to mitigate "Lost-in-the-Middle". DeepSeek-R1 executes step-by-step chain-of-thought verification, streaming 92 tokens per second with interactive footnote citations, driving hallucination below 0.1%.',
      },
      camera: {
        zoom: 1.85,
        x: 28,
        y: -5,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-llm-inference', 'box-tool-sandbox'],
        paths: ['path-rerank-llm'],
        callouts: [
          {
            id: 'co-rag-cot',
            targetBoxId: 'box-llm-inference',
            position: {
              left: '2980px',
              top: '1060px',
            },
            theme: 'purple',
            title: 'CoT Reasoning & Footnote Citations',
            desc: 'Step-by-step fact cross-checking with interactive footnote citations',
            titleI18n: {
              zh: 'DeepSeek-R1 思维链事实核验',
              en: 'CoT Reasoning & Footnote Citations',
            },
            descI18n: {
              zh: '推理步骤严格锚定切片坐标，精准输出角标引用 [1][2]，消除幻觉',
              en: 'Step-by-step fact cross-checking with interactive footnote citations',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-rag-sandbox',
            targetBoxId: 'box-tool-sandbox',
            position: {
              left: '2980px',
              top: '500px',
            },
            theme: 'purple',
            title: 'E2B Isolated Code Sandbox',
            desc: 'Executes Python and Text-to-SQL in isolated Wasm with 3000ms timeouts',
            titleI18n: {
              zh: 'E2B Wasm 隔离执行沙箱',
              en: 'E2B Isolated Code Sandbox',
            },
            descI18n: {
              zh: '安全运行 Python 数据清洗与 Text-to-SQL，超时阈值 3000ms 强制阻断',
              en: 'Executes Python and Text-to-SQL in isolated Wasm with 3000ms timeouts',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 430,
            },
          },
        ],
      },
    },
    {
      id: 'scene-5',
      title: '05 安全防护护栏与 Ragas 自动化持续评估',
      titleI18n: {
        zh: '05 安全防护护栏与 Ragas 自动化持续评估',
        en: '05 Safety Guardrails & Ragas Continuous Eval',
      },
      duration: 19000,
      voiceoverScript:
        '系统在边缘部署 Llama-Guard-3 防范越狱注入与敏感信息泄露；底层由 MinIO 与 PostgreSQL 提供多租户数据湖隔离，并联动 Arize Phoenix 与 Ragas 实时监控忠实度与召回率，驱动 DPO 偏好对齐飞轮持续自进化。',
      voiceoverScriptI18n: {
        zh: '系统在边缘部署 Llama-Guard-3 防范越狱注入与敏感信息泄露；底层由 MinIO 与 PostgreSQL 提供多租户数据湖隔离，并联动 Arize Phoenix 与 Ragas 实时监控忠实度与召回率，驱动 DPO 偏好对齐飞轮持续自进化。',
        en: 'Llama-Guard-3 guards against jailbreaks and leaks at the edge. Downstream, MinIO and PostgreSQL provide multi-tenant isolation, while Arize Phoenix and Ragas continuously track faithfulness metrics, fueling the self-improving DPO alignment flywheel.',
      },
      camera: {
        zoom: 1.75,
        x: 0,
        y: 22,
        duration: 1.5,
      },
      activeElements: {
        boxes: [
          'box-semantic-cache',
          'box-agent-orchestrator',
          'box-storage-lake',
          'box-eval-observability',
          'box-feedback-flywheel',
        ],
        paths: [],
        callouts: [
          {
            id: 'co-rag-guard',
            targetBoxId: 'box-semantic-cache',
            position: {
              left: '1180px',
              top: '500px',
            },
            theme: 'green',
            title: 'Semantic Cache & Llama-Guard-3',
            desc: '38.2% cache hit rate at 3.8ms; real-time PII scrubbing and jailbreak filtering',
            titleI18n: {
              zh: 'Redis 向量缓存与 Llama-Guard-3',
              en: 'Semantic Cache & Llama-Guard-3',
            },
            descI18n: {
              zh: '语义距离 > 0.96 命中率 38.2%，耗时仅 3.8ms；实时 PII 脱敏与防注入',
              en: '38.2% cache hit rate at 3.8ms; real-time PII scrubbing and jailbreak filtering',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-rag-eval',
            targetBoxId: 'box-eval-observability',
            position: {
              left: '1350px',
              top: '1400px',
            },
            theme: 'purple',
            title: 'Ragas Observability & DPO Flywheel',
            desc: 'Tracks 0.984 faithfulness & 0.962 context precision; fuels DPO fine-tuning',
            titleI18n: {
              zh: 'Ragas 持续评估与 DPO 自我进化飞轮',
              en: 'Ragas Observability & DPO Flywheel',
            },
            descI18n: {
              zh: '实时追踪忠实度 0.984 与上下文精确率 0.962；负反馈自动合成难负例训练集',
              en: 'Tracks 0.984 faithfulness & 0.962 context precision; fuels DPO fine-tuning',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 460,
            },
          },
        ],
      },
    },
  ],
};
