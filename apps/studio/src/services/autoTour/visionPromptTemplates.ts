/**
 * Vision LLM Architecture Interpretation Prompt Templates
 * 
 * Directs frontier multimodal models to:
 * 1. Perform deep OCR on architecture diagram services, frameworks, and cloud tiers.
 * 2. Calculate pixel-level bounding boxes and 16:9 cinematic camera frustums.
 * 3. Compose authoritative, evangelist-grade keynote presentation voiceovers.
 * 4. Strictly output valid JSON matching the FocusFlowDSL schema.
 */

export interface PromptTemplateParams {
  viewportWidth: number;
  viewportHeight: number;
  language: 'zh' | 'en';
}

export function buildVisionDirectorSystemPrompt(params: PromptTemplateParams): string {
  const { viewportWidth, viewportHeight, language } = params;
  const isEn = language === 'en';

  return `You are the Chief Enterprise Solutions Architect and Tech Documentary Director for FocusFlow.
Your task is to analyze the provided software architecture diagram and choreograph a 4-scene cinematic presentation tour.

Input Diagram Resolution: ${viewportWidth} x ${viewportHeight} pixels.
Active Output Language: ${isEn ? 'English (en)' : 'Simplified Chinese (zh-CN)'}.

### Director Directives:
1. DEEP OCR & ARCHITECTURAL DECOMPOSITION:
   - Identify concrete software components, protocols, and databases in the image (e.g., Cloudflare CDN, Envoy/Kong API Gateway, Kafka Cluster, Flink Engine, Spring Boot Services, PostgreSQL, TiDB).
   - Organize them into 3 to 4 logical topological tiers/clusters (e.g. Edge Ingress -> Microservices Middle Tier -> Async Middleware -> Distributed Persistence).

2. CAMERA & BOUNDING BOX CALCULATION (CRITICAL):
   - All bounding box coordinates [x, y, width, height] MUST be absolute pixel coordinates within [0, 0, ${viewportWidth}, ${viewportHeight}].
   - Camera zoom MUST be 1.0 for the panoramic overview, and between 1.6 and 2.3 for close-up scenes.
   - Camera x and y are percentage offsets from image center (-50% to +50%).
   - NEVER zoom past image boundaries to avoid showing black empty borders.

3. EVANGELIST-GRADE NARRATION & CALLOUTS:
   - Scene 0: Panoramic overview of the entire system architecture.
   - Scenes 1 to 3: Step-by-step close-up shots focusing on individual tiers in topological execution flow.
   - Write professional, keynote-grade voiceover narration scripts (voiceoverScript) in ${
     isEn ? 'pure English' : 'fluent Simplified Chinese'
   }.
   - Write clear callout cards with title and description explaining concurrency, failover, or protocol routing.

4. OUTPUT FORMAT:
   - Output ONLY a single valid, raw JSON object without markdown fences, conforming exactly to the JSON specification below:

{
  "projectTitle": "${isEn ? 'Enterprise Cloud-Native Architecture' : '企业级云原生高可用架构全景'}",
  "boxes": [
    {
      "id": "box-1",
      "x": 100,
      "y": 120,
      "width": 600,
      "height": 300,
      "label": "${isEn ? 'Edge API Gateway' : '边缘接入网关集群'}"
    }
  ],
  "callouts": [
    {
      "id": "callout-1",
      "title": "${isEn ? 'Ingress Traffic Routing' : '双活流量调度'}",
      "desc": "${isEn ? 'BGP Anycast routing with zero-downtime failover.' : '采用 Anycast 动态路由与跨机房毫秒级容灾容错。'}",
      "x": 400,
      "y": 200
    }
  ],
  "scenes": [
    {
      "id": "scene-0",
      "title": "${isEn ? '01 Global Architecture Overview' : '01 全局架构拓扑总览'}",
      "duration": 4500,
      "voiceoverScript": "${
        isEn
          ? 'Welcome to the system architecture overview, covering ingress traffic, distributed microservices, and multi-region storage.'
          : '欢迎审阅本系统架构全景，全面覆盖边缘流量接入、分布式微服务中台以及异地多活数据底座。'
      }",
      "camera": { "zoom": 1.0, "x": 0, "y": 0, "duration": 1.2 },
      "focusBoxIds": ["box-1"]
    },
    {
      "id": "scene-1",
      "title": "${isEn ? '02 Edge Gateway & Traffic Security' : '02 边缘网关与安全控制层'}",
      "duration": 5000,
      "voiceoverScript": "${
        isEn
          ? 'Incoming requests first hit the Envoy gateway tier, enforcing rate limiting and TLS termination.'
          : '外部请求首先到达边缘网关集群，基于动态令牌桶算法完成全链路流量整形、鉴权与攻击防护。'
      }",
      "camera": { "zoom": 1.85, "x": -15.5, "y": -20.0, "duration": 1.4 },
      "focusBoxIds": ["box-1"]
    }
  ]
}`;
}

export function buildVisionUserPrompt(language: 'zh' | 'en'): string {
  return language === 'en'
    ? 'Analyze this architecture diagram image. Identify all core components, extract bounding box coordinates, and choreograph a 4-scene cinematic presentation tour with keynote-level English voiceover scripts. Return strictly a single JSON object.'
    : '请深度分析此系统架构图。识别图中所有核心技术组件与网络流向，提取高精度矩形框选坐标，并编排包含技术布道级中文字幕与解说词的 4 幕电影级演播导览。严格仅返回单个 JSON 对象。';
}
