#!/usr/bin/env node

/**
 * FocusFlow Model Catalog Sync Script (Solution 1)
 *
 * Automatically or semi-automatically detects, queries, and synchronizes the latest
 * Vision LLM and TTS model catalogs from Google Gemini, OpenAI, and SiliconFlow.
 *
 * Usage:
 *   node scripts/sync-models.mjs             # Run in dry-run mode by default
 *   node scripts/sync-models.mjs --write     # Fetch and write updates to catalog
 *   node scripts/sync-models.mjs --dry-run   # Explicit dry-run check
 *   node scripts/sync-models.mjs --provider=gemini
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const STUDIO_DIR = resolve(ROOT_DIR, 'apps/studio');
const CATALOG_PATH = resolve(STUDIO_DIR, 'src/services/autoTour/modelCatalog.generated.json');

// Parse CLI flags
const args = process.argv.slice(2);
const isWriteMode = args.includes('--write');
const isDryRun = args.includes('--dry-run') || !isWriteMode;
const providerArg = args.find((a) => a.startsWith('--provider='))?.split('=')[1] || 'all';

// Proxy support
const proxy =
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy ||
  '';

/**
 * Resilient HTTP fetcher using curl with proxy support and timeout
 */
function fetchUrl(url, headers = {}) {
  const curlArgs = ['-s', '--connect-timeout', '10', '--max-time', '15'];

  if (proxy) {
    curlArgs.push('-x', proxy);
  }

  for (const [key, val] of Object.entries(headers)) {
    curlArgs.push('-H', `${key}: ${val}`);
  }

  curlArgs.push(url);

  try {
    const stdout = execFileSync('curl', curlArgs, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    // Return empty on network error to allow fallback
    return '';
  }
}

/**
 * 1. Fetch & Parse Gemini Models
 */
function fetchGeminiModels() {
  console.log('🔍 [Gemini] Fetching latest models from official endpoints & docs...');
  const models = new Set();
  const ttsModels = new Set();

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (apiKey) {
    console.log('  ↳ Using GEMINI_API_KEY for direct API probe...');
    const raw = fetchUrl(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data.models)) {
        for (const m of data.models) {
          const id = (m.name || '').replace(/^models\//, '');
          if (!id) continue;
          if (id.includes('tts')) {
            ttsModels.add(id);
          } else if (
            (id.includes('flash') || id.includes('pro') || id.includes('gemini-')) &&
            !id.includes('embedding') &&
            !id.includes('robotics') &&
            !id.includes('aqa')
          ) {
            models.add(id);
          }
        }
      }
    } catch {
      // Fall through to doc scraping
    }
  }

  // Scrape official doc models
  console.log('  ↳ Scraping Google AI latest model documentation (ai.google.dev)...');
  const html = fetchUrl('https://ai.google.dev/gemini-api/docs/models');
  if (html) {
    const matches = [...html.matchAll(/\/gemini-api\/docs\/models\/([a-zA-Z0-9.-]+)/g)];
    for (const m of matches) {
      const id = m[1];
      if (id.includes('tts')) {
        ttsModels.add(id);
      } else if (
        (id.includes('flash') || id.includes('pro')) &&
        !id.includes('embedding') &&
        !id.includes('robotics')
      ) {
        models.add(id);
      }
    }
  }

  // Guaranteed baseline models
  const baseline = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];
  for (const b of baseline) models.add(b);

  const baselineTts = [
    'gemini-3.1-flash-tts-preview',
    'gemini-3.8-live',
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
    'gemini-2.0-flash',
  ];
  for (const t of baselineTts) ttsModels.add(t);

  return {
    vision: Array.from(models),
    tts: Array.from(ttsModels),
  };
}

/**
 * 2. Fetch & Parse OpenAI Models
 */
function fetchOpenAIModels() {
  console.log('🔍 [OpenAI] Fetching latest models from official endpoints & docs...');
  const models = new Set();
  const ttsModels = new Set();

  const apiKey = process.env.OPENAI_API_KEY || '';
  if (apiKey) {
    console.log('  ↳ Using OPENAI_API_KEY for direct API probe...');
    const raw = fetchUrl('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${apiKey}`,
    });
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data.data)) {
        for (const m of data.data) {
          const id = m.id || '';
          if (id.includes('tts')) {
            ttsModels.add(id);
          } else if (
            id.startsWith('gpt-4o') ||
            id.startsWith('gpt-4-turbo') ||
            id.startsWith('gpt-5') ||
            id.startsWith('gpt-6')
          ) {
            models.add(id);
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // Scrape official docs
  const html = fetchUrl('https://platform.openai.com/docs/models');
  if (html) {
    const matches = [...html.matchAll(/models\/(gpt-[a-zA-Z0-9.-]+)/g)];
    for (const m of matches) {
      const id = m[1];
      if (id.includes('tts')) {
        ttsModels.add(id);
      } else if (!id.includes('whisper') && !id.includes('realtime')) {
        models.add(id);
      }
    }
  }

  const baseline = [
    'gpt-6-astra',
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
  ];
  for (const b of baseline) models.add(b);

  const baselineTts = ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'];
  for (const t of baselineTts) ttsModels.add(t);

  return {
    vision: Array.from(models),
    tts: Array.from(ttsModels),
  };
}

/**
 * 3. Fetch & Parse SiliconFlow Models
 */
function fetchSiliconFlowModels() {
  console.log('🔍 [SiliconFlow] Fetching latest models from official endpoints & registry...');
  const models = new Set();
  const ttsModels = new Set();

  const apiKey = process.env.SILICONFLOW_API_KEY || '';
  if (apiKey) {
    console.log('  ↳ Using SILICONFLOW_API_KEY for direct API probe...');
    const raw = fetchUrl('https://api.siliconflow.cn/v1/models', {
      Authorization: `Bearer ${apiKey}`,
    });
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data.data)) {
        for (const m of data.data) {
          const id = m.id || '';
          if (id.toLowerCase().includes('cosyvoice') || id.toLowerCase().includes('fish-speech')) {
            ttsModels.add(id);
          } else if (id.includes('VL') || id.toLowerCase().includes('vision')) {
            models.add(id);
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  const baseline = [
    'Qwen/Qwen2.5-VL-72B-Instruct',
    'Qwen/Qwen2.5-VL-32B-Instruct',
    'Qwen/Qwen2.5-VL-7B-Instruct',
    'Pro/Qwen/Qwen2.5-VL-72B-Instruct',
  ];
  for (const b of baseline) models.add(b);

  const baselineTts = [
    'FunAudioLLM/CosyVoice2-0.5B',
    'fishaudio/fish-speech-1.5',
    'FunAudioLLM/SenseVoiceSmall',
  ];
  for (const t of baselineTts) ttsModels.add(t);

  return {
    vision: Array.from(models),
    tts: Array.from(ttsModels),
  };
}

/**
 * Metadata & Description Formatter
 */
function buildModelItem(id, provider) {
  // Known curated metadata map
  const curated = {
    'gemini-3.8-flash': {
      label: 'Gemini 3.8 Flash',
      tag: 'Recommended',
      description: '官方最新 GA 旗舰，速度与智能巅峰 (支持 64k 输出)',
      descriptionEn: 'Latest GA multimodal flagship, pinnacle of speed & reasoning (64k output)',
    },
    'gemini-3.7-flash': {
      label: 'Gemini 3.7 Flash',
      tag: 'Agentic',
      description: '前沿多模态主力，复杂编码与工作流编排',
      descriptionEn: 'Frontier multimodal model for agentic workflows & code reasoning',
    },
    'gemini-3.1-pro-preview': {
      label: 'Gemini 3.1 Pro',
      tag: 'Deep Reasoning',
      description: '深度复杂架构推演与长程逻辑分析',
      descriptionEn: 'Deep architectural reasoning and long-context analysis',
    },
    'gemini-3.1-flash-lite': {
      label: 'Gemini 3.1 Flash-Lite',
      tag: 'Fast & Cheap',
      description: '超低延迟高吞吐，前沿级轻量性能',
      descriptionEn: 'Frontier performance at ultra-low latency & cost',
    },
    'gemini-3.5-flash': {
      label: 'Gemini 3.5 Flash',
      description: '稳定基线多模态版本',
      descriptionEn: 'Stable baseline multimodal version',
    },
    'gemini-2.5-flash': {
      label: 'Gemini 2.5 Flash',
      description: '经典多模态版本',
      descriptionEn: 'Classic multimodal version',
    },
    'gemini-2.5-pro': {
      label: 'Gemini 2.5 Pro',
      description: '经典高精度版本',
      descriptionEn: 'Classic high precision reasoning',
    },
    'gpt-6-astra': {
      label: 'GPT-6 Astra',
      tag: 'Frontier',
      description: 'OpenAI 顶尖推理旗舰，端到端复杂图文分析',
      descriptionEn: 'OpenAI frontier flagship, complex multimodal reasoning',
    },
    'gpt-5.6-sol': {
      label: 'GPT-5.6 Sol',
      tag: 'Pro Work',
      description: '高阶专业工作流与精细化多模态解析',
      descriptionEn: 'Flagship model for complex professional multimodal work',
    },
    'gpt-5.6-terra': {
      label: 'GPT-5.6 Terra',
      tag: 'Balanced',
      description: '智能与成本的最佳平衡',
      descriptionEn: 'Balances frontier intelligence and operational cost',
    },
    'gpt-4o': {
      label: 'GPT-4o',
      tag: 'Recommended',
      description: '成熟全能多模态旗舰，架构解析精准',
      descriptionEn: 'Proven omni multimodal flagship, precision topology OCR',
    },
    'gpt-4o-mini': {
      label: 'GPT-4o Mini',
      tag: 'Fast & Cheap',
      description: '极速轻量，经济型选择',
      descriptionEn: 'Fast & lightweight, economical choice',
    },
    'gpt-4-turbo': {
      label: 'GPT-4 Turbo',
      description: '经典视觉版本',
      descriptionEn: 'Classic vision release',
    },
    'Qwen/Qwen2.5-VL-72B-Instruct': {
      label: 'Qwen2.5-VL-72B-Instruct',
      tag: 'Top Open',
      description: '顶尖开源视觉模型',
      descriptionEn: 'Top-tier open source multimodal vision model',
    },
    'Qwen/Qwen2.5-VL-32B-Instruct': {
      label: 'Qwen2.5-VL-32B-Instruct',
      description: '高效平衡版',
      descriptionEn: 'High efficiency balanced vision model',
    },
    'Qwen/Qwen2.5-VL-7B-Instruct': {
      label: 'Qwen2.5-VL-7B-Instruct',
      description: '轻量敏捷版',
      descriptionEn: 'Lightweight agile vision model',
    },
    'Pro/Qwen/Qwen2.5-VL-72B-Instruct': {
      label: 'Pro/Qwen2.5-VL-72B-Instruct',
      tag: 'Pro Lane',
      description: '高并发专属通道',
      descriptionEn: 'High concurrency dedicated enterprise channel',
    },
    'claude-3-7-sonnet-20250219': {
      label: 'Claude 3.7 Sonnet',
      tag: 'Claude Frontier',
      description: '卓越图文与代码推理',
      descriptionEn: 'Frontier multimodal vision & hybrid reasoning',
    },
    'claude-3-5-sonnet-20241022': {
      label: 'Claude 3.5 Sonnet',
      description: '经典高阶视觉',
      descriptionEn: 'Classic high-tier multimodal vision',
    },
  };

  if (curated[id]) {
    return { id, ...curated[id] };
  }

  // Auto-generate sensible defaults for newly discovered models
  const cleanLabel = id.replace(/^[a-zA-Z0-9_-]+\//, '');
  return {
    id,
    label: cleanLabel,
    tag: 'New',
    description: `最新探测到的大语言多模态模型 (${provider})`,
    descriptionEn: `Newly discovered multimodal model (${provider})`,
  };
}

/**
 * Filters out niche/experimental sub-variants, sorts chronologically (newest first),
 * and strictly limits the list to at most `limit` mainstream models (default 5).
 */
function filterAndSortMainstreamModels(modelIds, provider, limit = 5) {
  if (provider === 'gemini') {
    const mainstream = modelIds.filter((id) => {
      const lower = id.toLowerCase();
      if (
        lower.includes('image') ||
        lower.includes('audio') ||
        lower.includes('native') ||
        lower.includes('preview-09') ||
        lower.includes('preview-12') ||
        lower.includes('deep-research') ||
        lower.includes('lyria') ||
        lower.includes('live') ||
        lower.includes('omni') ||
        lower === 'gemini-3.6-flash' ||
        lower === 'gemini-3.5-flash-lite'
      ) {
        return false;
      }
      return lower.startsWith('gemini-');
    });

    const scoreMap = {
      'gemini-3.8-flash': 3.85,
      'gemini-3.7-flash': 3.75,
      'gemini-3.1-pro-preview': 3.70,
      'gemini-3.1-flash-lite': 3.65,
      'gemini-3.5-flash': 3.50,
      'gemini-2.5-flash': 2.55,
      'gemini-2.5-pro': 2.54,
      'gemini-2.0-flash': 2.05,
    };

    mainstream.sort((a, b) => {
      const scoreA = scoreMap[a] ?? parseFloat(a.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] || '0');
      const scoreB = scoreMap[b] ?? parseFloat(b.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] || '0');
      return scoreB - scoreA;
    });

    return mainstream.slice(0, limit);
  }

  if (provider === 'openai') {
    const scoreMap = {
      'gpt-6-astra': 6.0,
      'gpt-5.6-sol': 5.62,
      'gpt-5.6-terra': 5.61,
      'gpt-5.6-luna': 5.60,
      'gpt-4o': 4.90,
      'gpt-4o-mini': 4.80,
      'gpt-4-turbo': 4.50,
    };

    const sorted = [...modelIds].sort((a, b) => {
      const scoreA = scoreMap[a] ?? 1.0;
      const scoreB = scoreMap[b] ?? 1.0;
      return scoreB - scoreA;
    });

    return sorted.slice(0, limit);
  }

  if (provider === 'siliconflow') {
    const priority = [
      'Qwen/Qwen2.5-VL-72B-Instruct',
      'Pro/Qwen/Qwen2.5-VL-72B-Instruct',
      'Qwen/Qwen2.5-VL-32B-Instruct',
      'Qwen/Qwen2.5-VL-7B-Instruct',
    ];

    const sorted = [...modelIds].sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return sorted.slice(0, limit);
  }

  if (provider === 'custom') {
    const priority = [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'gpt-4o',
      'gpt-4o-mini',
    ];

    const sorted = [...modelIds].sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return sorted.slice(0, limit);
  }

  return modelIds.slice(0, limit);
}

/**
 * Main Orchestration Routine
 */
async function main() {
  console.log('====================================================');
  console.log('🚀 FocusFlow Model Catalog Sync Script (Solution 1)');
  console.log(`Mode: ${isWriteMode ? '✍️ WRITE (--write)' : '🔍 DRY-RUN (--dry-run)'}`);
  if (proxy) console.log(`Proxy: 🌐 ${proxy}`);
  console.log('====================================================\n');

  const catalog = {
    updatedAt: new Date().toISOString(),
    providers: {},
  };

  if (providerArg === 'all' || providerArg === 'gemini') {
    const res = fetchGeminiModels();
    const mainstreamVision = filterAndSortMainstreamModels(res.vision, 'gemini', 5);
    catalog.providers.gemini = {
      defaultVisionModel: 'gemini-3.8-flash',
      defaultTtsModel: 'gemini-3.1-flash-tts-preview',
      visionModels: mainstreamVision.map((id) => buildModelItem(id, 'gemini')),
      ttsModels: res.tts.slice(0, 5),
      officialDocUrl: 'https://ai.google.dev/gemini-api/docs/latest-model',
    };
  }

  if (providerArg === 'all' || providerArg === 'openai') {
    const res = fetchOpenAIModels();
    const mainstreamVision = filterAndSortMainstreamModels(res.vision, 'openai', 5);
    catalog.providers.openai = {
      defaultVisionModel: 'gpt-4o',
      defaultTtsModel: 'tts-1',
      visionModels: mainstreamVision.map((id) => buildModelItem(id, 'openai')),
      ttsModels: res.tts.slice(0, 5),
      officialDocUrl: 'https://platform.openai.com/docs/models',
    };
  }

  if (providerArg === 'all' || providerArg === 'siliconflow') {
    const res = fetchSiliconFlowModels();
    const mainstreamVision = filterAndSortMainstreamModels(res.vision, 'siliconflow', 5);
    catalog.providers.siliconflow = {
      defaultVisionModel: 'Qwen/Qwen2.5-VL-72B-Instruct',
      defaultTtsModel: 'FunAudioLLM/CosyVoice2-0.5B',
      visionModels: mainstreamVision.map((id) => buildModelItem(id, 'siliconflow')),
      ttsModels: res.tts.slice(0, 5),
      officialDocUrl: 'https://cloud.siliconflow.cn/models',
    };
  }

  if (providerArg === 'all' || providerArg === 'custom') {
    const customModels = [
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'gpt-4o',
      'gpt-4o-mini',
    ];
    const mainstreamVision = filterAndSortMainstreamModels(customModels, 'custom', 5);
    catalog.providers.custom = {
      defaultVisionModel: 'gpt-4o',
      defaultTtsModel: 'tts-1',
      visionModels: mainstreamVision.map((id) => buildModelItem(id, 'custom')),
      ttsModels: ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'],
      officialDocUrl: 'https://docs.anthropic.com/en/docs/models-overview',
    };
  }

  // Print Summary Table
  console.log('\n📊 [Summary of Detected Model Matrix]:');
  for (const [provider, conf] of Object.entries(catalog.providers)) {
    console.log(`\nProvider: [${provider.toUpperCase()}]`);
    console.log(`  Vision Models (${conf.visionModels.length}):`);
    conf.visionModels.forEach((m) => {
      const tagStr = m.tag ? ` [${m.tag}]` : '';
      console.log(`    • ${m.id}${tagStr} - ${m.description}`);
    });
    console.log(`  TTS Models (${conf.ttsModels.length}):`);
    conf.ttsModels.forEach((m) => {
      console.log(`    • ${m}`);
    });
  }

  if (isWriteMode) {
    console.log(`\n💾 Writing synchronized catalog to: ${CATALOG_PATH}`);
    writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
    console.log('✅ Catalog successfully updated and saved!');
  } else {
    console.log('\n💡 Dry-run completed. To write this catalog to disk, run:');
    console.log('   npm run sync:models -- --write\n');
  }
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
