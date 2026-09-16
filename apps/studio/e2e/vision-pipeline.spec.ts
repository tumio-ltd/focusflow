import { test, expect } from '@playwright/test';
import {
  compressImageForVision,
  type CompressionOptions,
} from '../src/services/autoTour/imageCompressor';
import {
  extractAndParseModelJson,
  clampFrustumToViewport,
  sanitizeBoundingBox,
  sanitizeVisionLLMOutput,
} from '../src/services/autoTour/dslSanitizer';
import {
  OpenAIVisionAdapter,
  GeminiVisionAdapter,
  SiliconFlowVisionAdapter,
  CustomVisionAdapter,
  createVisionAdapter,
} from '../src/services/autoTour/adapters';
import {
  buildVisionDirectorSystemPrompt,
  buildVisionUserPrompt,
} from '../src/services/autoTour/visionPromptTemplates';

/**
 * 1. Verify Client-side Adaptive Image Compressor logic and boundary clamping
 */
async function verifyClientSideImageCompressor(): Promise<void> {
  const dummyBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...dummyData';
  const result = await compressImageForVision(dummyBase64, {
    maxDimension: 1536,
    quality: 0.85,
  });

  expect(result).toBeDefined();
  expect(result.width).toBeLessThanOrEqual(1536);
  expect(result.height).toBeLessThanOrEqual(1536);
  expect(result.base64DataUrl).toBeTruthy();
  expect(typeof result.durationMs).toBe('number');
}

/**
 * 2. Verify DSL Sanitizer markdown fence stripping and fault-tolerant JSON parser
 */
async function verifyMarkdownStrippingAndJsonHealing(): Promise<void> {
  // Test case A: Markdown ```json fence
  const markdownJson = `\`\`\`json
{
  "projectTitle": "Cloud Architecture Overview",
  "boxes": [
    { "id": "box-1", "x": 120, "y": 140, "width": 400, "height": 200, "label": "API Gateway" }
  ]
}
\`\`\``;
  const parsedA = extractAndParseModelJson(markdownJson);
  expect(parsedA.projectTitle).toBe('Cloud Architecture Overview');
  expect(parsedA.boxes).toHaveLength(1);

  // Test case B: Trailing comma error recovery
  const trailingCommaJson = `
  {
    "projectTitle": "Fault Tolerant System",
    "boxes": [
      { "id": "box-2", "x": 50, "y": 80, "width": 300, "height": 180, },
    ],
  }`;
  const parsedB = extractAndParseModelJson(trailingCommaJson);
  expect(parsedB.projectTitle).toBe('Fault Tolerant System');
  expect(parsedB.boxes[0].id).toBe('box-2');

  // Test case C: Envelope with conversational preamble and postscript
  const conversationalResponse = `Certainly! Here is your requested FocusFlow tour specification:
{
  "projectTitle": "Event Driven Kafka Pipeline",
  "scenes": []
}
Hope this helps you present your architecture!`;
  const parsedC = extractAndParseModelJson(conversationalResponse);
  expect(parsedC.projectTitle).toBe('Event Driven Kafka Pipeline');

  // Test case D: Truncated JSON stream (token limit cutoff inside scenes array)
  // Replicating: "SyntaxError: Expected ',' or ']' after array element in JSON"
  const truncatedJson = `{
  "projectTitle": "Truncated Microservices Architecture",
  "boxes": [
    { "id": "box-1", "x": 100, "y": 100, "width": 400, "height": 200, "label": "Gateway" }
  ],
  "scenes": [
    {
      "id": "scene-0",
      "title": "01 Panorama",
      "duration": 4500,
      "voiceoverScript": "Complete overview of the ingress gateway and microservices."
    },
    {
      "id": "scene-1",
      "title": "02 Deep Dive Ingress",
      "duration": 5000,
      "voiceoverScript": "Here the stream abruptly cuts off because token limit was reached`;
  const parsedD = extractAndParseModelJson(truncatedJson);
  expect(parsedD.projectTitle).toBe('Truncated Microservices Architecture');
  expect(parsedD.boxes).toHaveLength(1);
  expect(parsedD.scenes.length).toBeGreaterThanOrEqual(1);
  expect(parsedD.scenes[0].id).toBe('scene-0');
}

/**
 * 3. Verify Mathematical Frustum Safety Clamping (no black borders)
 */
async function verifyFrustumSafetyClamping(): Promise<void> {
  // At zoom 1.0, camera cannot pan at all: safe percentage is 0%
  const overviewCamera = clampFrustumToViewport({ zoom: 1.0, x: 25, y: -30 });
  expect(overviewCamera.zoom).toBe(1.0);
  expect(overviewCamera.x).toBe(0);
  expect(overviewCamera.y).toBe(0);

  // At zoom 2.0, max safe offset is (1 - 1/2) * 50 = 25%
  const closeupCamera = clampFrustumToViewport({ zoom: 2.0, x: 45, y: -40 });
  expect(closeupCamera.zoom).toBe(2.0);
  expect(closeupCamera.x).toBe(25);
  expect(closeupCamera.y).toBe(-25);

  // Extreme zoom clamped to [1.0, 3.0]
  const extremeZoom = clampFrustumToViewport({ zoom: 8.5, x: 10, y: 10 });
  expect(extremeZoom.zoom).toBe(3.0);
}

/**
 * 4. Verify Bounding Box Boundary Clamping and Fallback Generation
 */
async function verifyBoundingBoxAndFallbackGeneration(): Promise<void> {
  const viewportW = 1920;
  const viewportH = 1080;

  // Clamps out-of-bounds coordinates
  const { elementBox } = sanitizeBoundingBox(
    {
      id: 'box-overflow',
      x: 2500,
      y: 1500,
      width: 500,
      height: 300,
      label: 'Edge Gateway',
    },
    viewportW,
    viewportH,
    0
  );

  expect(elementBox.x + elementBox.width).toBeLessThanOrEqual(viewportW);
  expect(elementBox.y + elementBox.height).toBeLessThanOrEqual(viewportH);

  // When model returns empty boxes, auto-heals with default center box and 4 scenes
  const sanitizedFallbackZh = sanitizeVisionLLMOutput({}, viewportW, viewportH, 'zh');
  expect(sanitizedFallbackZh.elements.boxes.length).toBeGreaterThanOrEqual(1);
  expect(sanitizedFallbackZh.scenes.length).toBe(4);
  expect(sanitizedFallbackZh.scenes[0].title).toContain('总览');

  // English fallback verification (zero Chinese leakage)
  const sanitizedFallbackEn = sanitizeVisionLLMOutput({}, viewportW, viewportH, 'en');
  expect(sanitizedFallbackEn.projectTitle).toBe('System Architecture AI Showcase');
  expect(sanitizedFallbackEn.scenes[0].title).not.toMatch(/[\u4e00-\u9fa5]/);
  expect(sanitizedFallbackEn.scenes[0].voiceoverScript).not.toMatch(/[\u4e00-\u9fa5]/);
}

/**
 * 5. Verify Vision Adapter Factory and Provider Adapter Instantiations
 */
async function verifyVisionAdapterFactoryAndAdapters(): Promise<void> {
  const geminiAdapter = createVisionAdapter({
    provider: 'gemini',
    apiKey: 'AIzaSyFakeKey123',
    model: 'gemini-3.8-flash',
  });
  expect(geminiAdapter.providerId).toBe('gemini');
  expect(geminiAdapter.model).toBe('gemini-3.8-flash');

  const openaiAdapter = createVisionAdapter({
    provider: 'openai',
    apiKey: 'sk-proj-FakeKey456',
    model: 'gpt-4o',
  });
  expect(openaiAdapter.providerId).toBe('openai');
  expect(openaiAdapter.model).toBe('gpt-4o');

  const siliconFlowAdapter = createVisionAdapter({
    provider: 'siliconflow',
    apiKey: 'sk-silicon-FakeKey789',
    model: 'Qwen/Qwen2.5-VL-72B-Instruct',
  });
  expect(siliconFlowAdapter.providerId).toBe('siliconflow');
  expect(siliconFlowAdapter.model).toBe('Qwen/Qwen2.5-VL-72B-Instruct');

  const customAdapter = createVisionAdapter({
    provider: 'custom',
    apiKey: 'sk-custom-FakeKey000',
    baseUrl: 'https://my-proxy.com/v1',
    model: 'claude-3-7-sonnet',
  });
  expect(customAdapter.providerId).toBe('custom');
  expect(customAdapter.model).toBe('claude-3-7-sonnet');
}

/**
 * 6. Verify Mocked OpenAI and Gemini Adapter Call Flows & Friendly Error Translation
 */
async function verifyMockedAdapterFlowsAndErrorTranslation(): Promise<void> {
  const originalFetch = globalThis.fetch;

  try {
    // 1. Mock OpenAI 401 Unauthorized
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Incorrect API key provided' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const openaiAdapter = new OpenAIVisionAdapter({ apiKey: 'invalid-key' });
    await expect(
      openaiAdapter.analyzeArchitectureDiagram({
        imageMeta: {
          base64DataUrl: 'data:image/jpeg;base64,sample',
          width: 1920,
          height: 1080,
        },
        language: 'zh',
      })
    ).rejects.toThrow(/401 Unauthorized/);

    // 2. Mock Gemini 429 Quota Exceeded
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Resource has been exhausted (quota)' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });

    const geminiAdapter = new GeminiVisionAdapter({ apiKey: 'quota-exceeded-key' });
    await expect(
      geminiAdapter.analyzeArchitectureDiagram({
        imageMeta: {
          base64DataUrl: 'data:image/jpeg;base64,sample',
          width: 1920,
          height: 1080,
        },
        language: 'en',
      })
    ).rejects.toThrow(/429 Quota Exceeded/);

    // 3. Mock Successful OpenAI Vision Response with Markdown Wrapper
    const mockModelOutput = {
      projectTitle: 'E-Commerce Cloud Architecture',
      boxes: [
        {
          id: 'box-ingress',
          x: 100,
          y: 120,
          width: 500,
          height: 250,
          label: 'API Gateway Cluster',
        },
      ],
      scenes: [
        {
          id: 'scene-0',
          title: '01 Panorama Architecture',
          duration: 4500,
          voiceoverScript: 'Comprehensive overview of edge ingress and core microservices.',
          camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
          focusBoxIds: ['box-ingress'],
        },
      ],
    };

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `\`\`\`json\n${JSON.stringify(mockModelOutput)}\n\`\`\``,
              },
            },
          ],
          usage: {
            prompt_tokens: 350,
            completion_tokens: 420,
            total_tokens: 770,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    const validOpenAIAdapter = new OpenAIVisionAdapter({ apiKey: 'valid-openai-key' });
    const successResult = await validOpenAIAdapter.analyzeArchitectureDiagram({
      imageMeta: {
        base64DataUrl: 'data:image/jpeg;base64,sample',
        width: 1920,
        height: 1080,
      },
      language: 'en',
    });

    expect(successResult.result.projectTitle).toBe('E-Commerce Cloud Architecture');
    expect(successResult.result.elements.boxes).toHaveLength(1);
    expect(successResult.result.scenes).toHaveLength(1);
    expect(successResult.usage?.totalTokens).toBe(770);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/**
 * 7. Verify Architecture Vision Prompt Templates
 */
async function verifyVisionPromptTemplates(): Promise<void> {
  const zhPrompt = buildVisionDirectorSystemPrompt({
    viewportWidth: 1920,
    viewportHeight: 1080,
    language: 'zh',
  });
  expect(zhPrompt).toContain('1920 x 1080');
  expect(zhPrompt).toContain('Simplified Chinese');

  const enPrompt = buildVisionDirectorSystemPrompt({
    viewportWidth: 3840,
    viewportHeight: 2160,
    language: 'en',
  });
  expect(enPrompt).toContain('3840 x 2160');
  expect(enPrompt).toContain('English (en)');

  const userPromptEn = buildVisionUserPrompt('en');
  expect(userPromptEn).not.toMatch(/[\u4e00-\u9fa5]/);
}

// Playwright test suites calling extracted async functions
test.describe('Phase 2: Vision LLM Pipeline & Resilient Adapters Suite', () => {
  test('TC601: verify client-side adaptive downsampling and image compressor', async () => {
    await verifyClientSideImageCompressor();
  });

  test('TC602: verify dsl sanitizer markdown stripping and fault-tolerant JSON healing', async () => {
    await verifyMarkdownStrippingAndJsonHealing();
  });

  test('TC603: verify frustum safety clamping prevents black borders', async () => {
    await verifyFrustumSafetyClamping();
  });

  test('TC604: verify bounding box boundary limits and fallback scene generation', async () => {
    await verifyBoundingBoxAndFallbackGeneration();
  });

  test('TC605: verify vision adapter factory and provider adapter configurations', async () => {
    await verifyVisionAdapterFactoryAndAdapters();
  });

  test('TC606: verify mocked adapter call flows and error message translations', async () => {
    await verifyMockedAdapterFlowsAndErrorTranslation();
  });

  test('TC607: verify vision architecture prompt templates', async () => {
    await verifyVisionPromptTemplates();
  });
});
