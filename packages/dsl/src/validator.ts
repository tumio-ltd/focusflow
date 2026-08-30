import type { FocusFlowDSL } from './schema.js';

export function validateDSL(dsl: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!dsl || typeof dsl !== 'object') {
    return { valid: false, errors: ['DSL 必须是一个 JSON 对象'] };
  }

  const d = dsl as Partial<FocusFlowDSL>;
  if (!d.meta) errors.push('缺少 meta 字段');
  if (!d.asset?.url) errors.push('缺少 asset.url 字段');
  if (!Array.isArray(d.scenes) || d.scenes.length === 0) {
    errors.push('scenes 必须为非空数组');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
