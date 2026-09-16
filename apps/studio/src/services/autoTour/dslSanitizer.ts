/**
 * Client-side Resilience & Auto-Healing Engine (dslSanitizer.ts)
 * 
 * Protects FocusFlow Studio from unpredictable LLM outputs:
 * 1. Strips Markdown blocks, preambles, and malformed JSON envelopes.
 * 2. Enforces mathematical frustum safety clamping (no black borders).
 * 3. Sanitizes element bounding boxes against physical image boundaries.
 * 4. Fills structural defaults and language-aware fallback narrations.
 */

import {
  type SceneStep,
  type ElementBox,
  type ElementPath,
  type CalloutItem,
} from '@focusflow/dsl';

export interface SanitizedVisionResult {
  projectTitle: string;
  scenes: SceneStep[];
  elements: {
    boxes: ElementBox[];
    paths: ElementPath[];
    callouts: CalloutItem[];
  };
}

/**
 * 1. Strips Markdown code blocks and extracts valid JSON payload from model response text.
/**
 * Auto-repairs truncated or malformed JSON strings caused by model token limits.
 * Handles unclosed quotes, incomplete array elements, and unbalanced brackets/braces.
 */
export function repairTruncatedJson(raw: string): string {
  let text = raw.trim();

  // Strip markdown fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Must start with '{'
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return '{}';
  text = text.substring(startIdx);

  // First try direct parse
  try {
    JSON.parse(text);
    return text;
  } catch {
    // Continue repair
  }

  // State machine tracking string literals and brackets
  let inString = false;
  let isEscaped = false;
  const stack: ('{' | '[')[] = [];
  let lastSafeCutIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}') {
      if (stack[stack.length - 1] === '{') {
        stack.pop();
        if (stack.length <= 1) {
          lastSafeCutIndex = i + 1;
        }
      }
    } else if (ch === ']') {
      if (stack[stack.length - 1] === '[') {
        stack.pop();
        if (stack.length <= 1) {
          lastSafeCutIndex = i + 1;
        }
      }
    }
  }

  // If ended while still inside a string, close the quote
  if (inString) {
    text += '"';
  }

  // Remove trailing comma if present
  text = text.replace(/,\s*$/, '');

  // Attempt strategy 1: balance the remaining open stack
  let balanced = text;
  for (let i = stack.length - 1; i >= 0; i--) {
    balanced = balanced.replace(/,\s*$/, '');
    balanced += stack[i] === '{' ? '}' : ']';
  }

  try {
    JSON.parse(balanced);
    return balanced;
  } catch {
    // Strategy 2: If cut off in the middle of an incomplete property or array element,
    // rewind to the last comma and balance brackets
    const lastComma = text.lastIndexOf(',');
    if (lastComma > 0) {
      let cut = text.substring(0, lastComma);
      const newStack: ('{' | '[')[] = [];
      let str = false;
      let esc = false;
      for (let j = 0; j < cut.length; j++) {
        const c = cut[j];
        if (str) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') str = false;
          continue;
        }
        if (c === '"') { str = true; continue; }
        if (c === '{' || c === '[') newStack.push(c);
        else if (c === '}' && newStack[newStack.length - 1] === '{') newStack.pop();
        else if (c === ']' && newStack[newStack.length - 1] === '[') newStack.pop();
      }
      for (let j = newStack.length - 1; j >= 0; j--) {
        cut = cut.replace(/,\s*$/, '');
        cut += newStack[j] === '{' ? '}' : ']';
      }
      try {
        JSON.parse(cut);
        return cut;
      } catch {
        // Fall through
      }
    }
  }

  // Strategy 3: rewind to lastSafeCutIndex
  if (lastSafeCutIndex > 0) {
    let safe = text.substring(0, lastSafeCutIndex);
    if (!safe.endsWith('}')) safe += '}';
    try {
      JSON.parse(safe);
      return safe;
    } catch {
      // Fall through
    }
  }

  return balanced;
}

/**
 * 1. Strips Markdown code blocks and extracts valid JSON payload from model response text.
 * Resilient against truncated model outputs, unclosed braces, and trailing commas.
 */
export function extractAndParseModelJson(rawText: string): Record<string, any> {
  if (!rawText || typeof rawText !== 'string') {
    return {};
  }

  let cleaned = rawText.trim();

  // 1. Remove markdown fence ```json or ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Locate first '{'
  const startIdx = cleaned.indexOf('{');
  if (startIdx !== -1) {
    cleaned = cleaned.substring(startIdx);
  }

  // 3. Try standard JSON parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // 4. Try intelligent truncated JSON auto-repair
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired);
    } catch {
      // 5. Fault-tolerant attempt: strip trailing commas before } or ] and control characters
      try {
        const sanitized = cleaned
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        const repairedSanitized = repairTruncatedJson(sanitized);
        return JSON.parse(repairedSanitized);
      } catch {
        // 6. Resilient heuristic fallback: extract title if available, return empty structure
        // so that sanitizeVisionLLMOutput can synthesize default scenes without crashing
        const titleMatch = cleaned.match(/"(?:projectTitle|title)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        return {
          projectTitle: titleMatch ? titleMatch[1] : undefined,
          boxes: [],
          scenes: [],
        };
      }
    }
  }
}

/**
 * 2. Mathematical safety net clamping camera offsets to prevent revealing black borders.
 */
export function clampFrustumToViewport(camera: {
  zoom?: number;
  x?: number;
  y?: number;
  duration?: number;
}): { zoom: number; x: number; y: number; duration: number } {
  const safeZoom = Math.max(1.0, Math.min(3.0, camera.zoom || 1.0));
  const maxSafePercentX = (1 - 1 / safeZoom) * 50;
  const maxSafePercentY = (1 - 1 / safeZoom) * 50;

  const rawX = typeof camera.x === 'number' ? camera.x : 0;
  const rawY = typeof camera.y === 'number' ? camera.y : 0;

  return {
    zoom: Number(safeZoom.toFixed(2)),
    x: Number(Math.max(-maxSafePercentX, Math.min(maxSafePercentX, rawX)).toFixed(2)),
    y: Number(Math.max(-maxSafePercentY, Math.min(maxSafePercentY, rawY)).toFixed(2)),
    duration: camera.duration && camera.duration > 0 ? camera.duration : 1.2,
  };
}

/**
 * 3. Validate and sanitize bounding boxes within canvas boundaries.
 */
export function sanitizeBoundingBox(
  box: any,
  viewportW: number,
  viewportH: number,
  index: number
): { elementBox: ElementBox; label: string } {
  const w = Math.max(80, Math.min(viewportW, box.width || 400));
  const h = Math.max(60, Math.min(viewportH, box.height || 250));
  const maxX = Math.max(0, viewportW - w);
  const maxY = Math.max(0, viewportH - h);

  const safeX = Math.max(0, Math.min(maxX, typeof box.x === 'number' ? box.x : 100));
  const safeY = Math.max(0, Math.min(maxY, typeof box.y === 'number' ? box.y : 100));

  const strokeColor = box.strokeColor || box.style?.stroke || '#06b6d4';
  const fillColor = box.fillColor || box.style?.fill || 'rgba(6, 182, 212, 0.08)';
  const strokeWidth = box.strokeWidth || box.style?.strokeWidth || 3;
  const label = (box.label || `Component Cluster ${index + 1}`).trim();

  const elementBox: ElementBox = {
    id: box.id || `box-vision-${index + 1}`,
    type: 'rect',
    x: Number(safeX.toFixed(1)),
    y: Number(safeY.toFixed(1)),
    width: Number(w.toFixed(1)),
    height: Number(h.toFixed(1)),
    rx: 16,
    ry: 16,
    style: {
      stroke: strokeColor,
      strokeWidth,
      glow: true,
      fill: fillColor,
    },
  };

  return { elementBox, label };
}

/**
 * 4. Full DSL Sanitizer: processes raw LLM response into robust FocusFlow scenes & elements.
 */
export function sanitizeVisionLLMOutput(
  rawInput: string | Record<string, any>,
  viewportW: number,
  viewportH: number,
  language: 'zh' | 'en' = 'zh'
): SanitizedVisionResult {
  const isEn = language === 'en';
  const data = typeof rawInput === 'string' ? extractAndParseModelJson(rawInput) : rawInput;

  // 1. Project Title
  const fallbackTitle = isEn
    ? 'System Architecture AI Showcase'
    : '系统架构演进与技术拓扑全景';
  const projectTitle = (data.projectTitle || data.title || fallbackTitle).trim();

  // 2. Boxes & Labels
  const rawBoxes = Array.isArray(data.boxes) ? data.boxes : [];
  const sanitizedBoxes: ElementBox[] = [];
  const boxLabels = new Map<string, string>();

  rawBoxes.forEach((box: any, idx: number) => {
    const { elementBox, label } = sanitizeBoundingBox(box, viewportW, viewportH, idx);
    sanitizedBoxes.push(elementBox);
    boxLabels.set(elementBox.id, label);
  });

  // If no boxes returned, create 3 standard architectural tiers
  if (sanitizedBoxes.length === 0) {
    const defaultTiers = isEn
      ? [
          { label: 'Traffic Ingress & Gateway Tier', y: 0.12, h: 0.22, color: '#38bdf8' },
          { label: 'Core Microservices Hub', y: 0.38, h: 0.26, color: '#818cf8' },
          { label: 'Distributed Persistence Tier', y: 0.68, h: 0.22, color: '#34d399' },
        ]
      : [
          { label: '流量接入与安全网关层', y: 0.12, h: 0.22, color: '#38bdf8' },
          { label: '核心业务微服务中台', y: 0.38, h: 0.26, color: '#818cf8' },
          { label: '分布式持久化数据底座', y: 0.68, h: 0.22, color: '#34d399' },
        ];

    defaultTiers.forEach((tier, i) => {
      const boxId = `box-vision-${i + 1}`;
      sanitizedBoxes.push({
        id: boxId,
        type: 'rect',
        x: Number((viewportW * 0.15).toFixed(1)),
        y: Number((viewportH * tier.y).toFixed(1)),
        width: Number((viewportW * 0.7).toFixed(1)),
        height: Number((viewportH * tier.h).toFixed(1)),
        rx: 16,
        ry: 16,
        style: {
          stroke: tier.color,
          strokeWidth: 3,
          glow: true,
          fill: 'rgba(56, 189, 248, 0.08)',
        },
      });
      boxLabels.set(boxId, tier.label);
    });
  }

  // 3. Callouts
  const rawCallouts = Array.isArray(data.callouts) ? data.callouts : [];
  const sanitizedCallouts: CalloutItem[] = [];

  rawCallouts.forEach((c: any, idx: number) => {
    if (c && (c.title || c.desc || c.text)) {
      const leftPx =
        c.position?.left ||
        `${Math.round(Math.max(20, Math.min(viewportW - 360, c.x ?? viewportW * 0.5)))}px`;
      const topPx =
        c.position?.top ||
        `${Math.round(Math.max(30, Math.min(viewportH - 60, c.y ?? viewportH * 0.5)))}px`;

      const title = (c.title || (isEn ? 'Architecture Note' : '架构注释')).trim();
      const desc = (c.desc || c.text || (isEn ? 'Key architectural component details.' : '核心技术组件说明。')).trim();

      sanitizedCallouts.push({
        id: c.id || `callout-vision-${idx + 1}`,
        targetBoxId: c.targetBoxId || (sanitizedBoxes[idx]?.id ?? sanitizedBoxes[0].id),
        position: {
          left: leftPx,
          top: topPx,
        },
        theme: c.theme || 'blue',
        title,
        desc,
        titleI18n: {
          zh: isEn ? '' : title,
          en: isEn ? title : '',
        },
        descI18n: {
          zh: isEn ? '' : desc,
          en: isEn ? desc : '',
        },
        style: {
          fontSize: 14,
          titleFontSize: 13,
          maxWidth: 360,
        },
      });
    }
  });

  // 4. Scenes
  const rawScenes = Array.isArray(data.scenes) ? data.scenes : [];
  const sanitizedScenes: SceneStep[] = [];

  if (rawScenes.length > 0) {
    rawScenes.forEach((s: any, idx: number) => {
      const sceneId = s.id || `scene-${idx}`;
      const defaultSceneTitle = isEn
        ? `0${idx + 1} Architecture Flow Stage ${idx + 1}`
        : `0${idx + 1} 架构拓扑演进第 ${idx + 1} 幕`;
      const title = (s.title || defaultSceneTitle).trim();
      const duration = typeof s.duration === 'number' && s.duration >= 2000 ? s.duration : 5000;

      const voiceoverScript = (
        s.voiceoverScript ||
        s.narration ||
        (isEn
          ? `Now presenting the ${title}, highlighting component interactions and resiliency patterns.`
          : `正在展现${title}，聚焦核心组件高可用交互与数据拓扑流向。`)
      ).trim();

      const camera = clampFrustumToViewport(s.camera || { zoom: idx === 0 ? 1.0 : 1.8 });

      // Match active box IDs
      const rawBoxIds = s.activeElements?.boxes || s.focusBoxIds;
      const activeBoxIds = Array.isArray(rawBoxIds)
        ? rawBoxIds.filter((id: string) => sanitizedBoxes.some((b) => b.id === id))
        : idx === 0
        ? sanitizedBoxes.map((b) => b.id)
        : [sanitizedBoxes[Math.min(idx - 1, sanitizedBoxes.length - 1)].id];

      // Match active callouts
      const activeCallouts = sanitizedCallouts.filter(
        (c) => !c.targetBoxId || activeBoxIds.includes(c.targetBoxId)
      );

      sanitizedScenes.push({
        id: sceneId,
        title,
        titleI18n: {
          zh: isEn ? '' : title,
          en: isEn ? title : '',
        },
        duration,
        voiceoverScript,
        voiceoverScriptI18n: {
          zh: isEn ? '' : voiceoverScript,
          en: isEn ? voiceoverScript : '',
        },
        camera,
        activeElements: {
          boxes: activeBoxIds,
          paths: [],
          callouts: activeCallouts.length > 0 ? [activeCallouts[0]] : [],
        },
      });
    });
  } else {
    // If no scenes returned, build 4-scene standard cinematic journey
    sanitizedScenes.push({
      id: 'scene-0',
      title: isEn ? '01 Global Architecture Panorama' : '01 全局架构拓扑总览',
      titleI18n: {
        zh: '01 全局架构拓扑总览',
        en: '01 Global Architecture Panorama',
      },
      duration: 4500,
      voiceoverScript: isEn
        ? 'Panoramic overview of the system architecture topology and traffic gateways.'
        : '全局系统架构总览，展现全链路微服务与数据分层拓扑。',
      voiceoverScriptI18n: {
        zh: '全局系统架构总览，展现全链路微服务与数据分层拓扑。',
        en: 'Panoramic overview of the system architecture topology and traffic gateways.',
      },
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: sanitizedBoxes.map((b) => b.id),
        paths: [],
        callouts: sanitizedCallouts.slice(0, 1),
      },
    });

    sanitizedBoxes.forEach((box, idx) => {
      if (idx >= 3) return; // Limit closeups to 3
      const zoom = 1.85;
      const targetPercentX = ((box.x + box.width / 2) / viewportW - 0.5) * 100;
      const targetPercentY = ((box.y + box.height / 2) / viewportH - 0.5) * 100;
      const boxLabel = boxLabels.get(box.id) || `Component ${idx + 1}`;

      const sceneTitleZh = `0${idx + 2} ${boxLabel} 核心特写`;
      const sceneTitleEn = `0${idx + 2} ${boxLabel} Deep Dive`;
      const sceneVoiceZh = `聚焦 ${boxLabel}，具备高吞吐处理能力与容灾弹性。`;
      const sceneVoiceEn = `Focusing on ${boxLabel}, delivering high-throughput processing and zero-trust security.`;

      sanitizedScenes.push({
        id: `scene-${idx + 1}`,
        title: isEn ? sceneTitleEn : sceneTitleZh,
        titleI18n: {
          zh: sceneTitleZh,
          en: sceneTitleEn,
        },
        duration: 5000,
        voiceoverScript: isEn ? sceneVoiceEn : sceneVoiceZh,
        voiceoverScriptI18n: {
          zh: sceneVoiceZh,
          en: sceneVoiceEn,
        },
        camera: clampFrustumToViewport({
          zoom,
          x: targetPercentX,
          y: targetPercentY,
          duration: 1.3,
        }),
        activeElements: {
          boxes: [box.id],
          paths: [],
          callouts: sanitizedCallouts.filter((c) => c.targetBoxId === box.id),
        },
      });
    });
  }

  return {
    projectTitle,
    scenes: sanitizedScenes,
    elements: {
      boxes: sanitizedBoxes,
      paths: [],
      callouts: sanitizedCallouts,
    },
  };
}
