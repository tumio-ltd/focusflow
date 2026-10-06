import type { FocusFlowDSL } from '../schema.js';
import { validateDSL } from '../validator.js';
import {
  CURRENT_DSL_VERSION,
  DEFAULT_LEGACY_VERSION,
  type MigrationOptions,
  type MigrationResult,
  type MigrationStepDefinition,
} from './types.js';
import { migrateV0_9ToV1_0 } from './steps/v0_9_to_v1_0.js';

/**
 * 迁移步骤注册注册表: Key 为源版本号 (fromVersion)
 */
const MIGRATION_REGISTRY = new Map<string, MigrationStepDefinition>();

/**
 * 注册跨版本迁移步进定义
 */
export function registerMigrationStep(stepDef: MigrationStepDefinition): void {
  MIGRATION_REGISTRY.set(stepDef.fromVersion, stepDef);
}

// 默认注册 0.9.0 (MVP 遗留格式) 到 1.0.0 的迁移器
registerMigrationStep({
  fromVersion: '0.9.0',
  targetVersion: '1.0.0',
  description: 'Migrate legacy FocusFlow DSL (MVP 0.9.0) to standardized 1.0.0 AST',
  step: migrateV0_9ToV1_0,
});

/**
 * FocusFlow DSL 跨版本链式平滑迁移核心引擎
 * 
 * @param dslJson 原始任意版本的 DSL JSON 对象 (支持 string 或未知 object)
 * @param targetVersion 期望升级的目标版本号，默认升级到系统最新版本 (CURRENT_DSL_VERSION: "1.0.0")
 * @param options 迁移扩展参数 (是否校验、拓扑修复等)
 * @returns 升级到目标版本并通过校验的强类型 FocusFlowDSL
 */
export function migrateDsl(
  dslJson: unknown,
  targetVersion: string = CURRENT_DSL_VERSION,
  options?: MigrationOptions,
): FocusFlowDSL {
  if (!dslJson || typeof dslJson !== 'object') {
    throw new TypeError(
      `[FocusFlow DSL Migration] Expected dslJson to be a non-null object, received ${typeof dslJson}`,
    );
  }

  // 深拷贝断绝外部引用污染
  let current = JSON.parse(JSON.stringify(dslJson)) as Record<string, any>;
  const effectiveTarget = options?.targetVersion || targetVersion || CURRENT_DSL_VERSION;

  // 缺省规则：若缺少 schemaVersion，一律视作 0.9.0 遗留草稿版本
  let currentVersion = typeof current.schemaVersion === 'string' && current.schemaVersion.trim()
    ? current.schemaVersion.trim()
    : DEFAULT_LEGACY_VERSION;

  // 若版本已对齐，直接检查校验
  if (currentVersion === effectiveTarget) {
    if (options?.validate !== false) {
      const validation = validateDSL(current);
      if (!validation.valid) {
        throw new Error(
          `[FocusFlow DSL Migration] DSL already at version "${currentVersion}" but failed validation:\n` +
            validation.errors.map((errStr) => `  - ${errStr}`).join('\n'),
        );
      }
      return (validation.data ?? current) as FocusFlowDSL;
    }
    return current as FocusFlowDSL;
  }

  const visitedVersions = new Set<string>([currentVersion]);
  const maxHops = 50;
  let hops = 0;

  while (currentVersion !== effectiveTarget) {
    hops++;
    if (hops > maxHops) {
      throw new Error(
        `[FocusFlow DSL Migration] Exceeded maximum migration depth (${maxHops}) while migrating from "${current.schemaVersion}" to "${effectiveTarget}"`,
      );
    }

    const stepDef = MIGRATION_REGISTRY.get(currentVersion);
    if (!stepDef) {
      throw new Error(
        `[FocusFlow DSL Migration] No migration path registered from version "${currentVersion}" towards target "${effectiveTarget}". Available from-versions: ${Array.from(MIGRATION_REGISTRY.keys()).join(', ') || 'none'}`,
      );
    }

    if (visitedVersions.has(stepDef.targetVersion)) {
      throw new Error(
        `[FocusFlow DSL Migration] Cyclic migration loop detected: version "${stepDef.targetVersion}" was already visited`,
      );
    }

    // 执行单步迁移
    current = stepDef.step(current);
    currentVersion = stepDef.targetVersion;
    current.schemaVersion = currentVersion;
    visitedVersions.add(currentVersion);
  }

  // 迁移完成后的 Zod 强校验
  if (options?.validate !== false) {
    const validation = validateDSL(current);
    if (!validation.valid) {
      throw new Error(
        `[FocusFlow DSL Migration] Validation failed after completing migration to "${currentVersion}":\n` +
          validation.errors.map((errStr) => `  - ${errStr}`).join('\n'),
      );
    }
    return (validation.data ?? current) as FocusFlowDSL;
  }

  return current as FocusFlowDSL;
}

/**
 * 自动跨版本迁移门面函数（对齐 11-dsl-schema.md § 5.2 命名规范）
 * 无论输入多古老的 DSL，统一平滑升级至当前最新 Schema 结构
 */
export function migrateDSLToLatest(input: unknown, options?: MigrationOptions): FocusFlowDSL {
  return migrateDsl(input, CURRENT_DSL_VERSION, options);
}

/**
 * 安全非抛错模式的迁移执行器，适合在 API 控制器或导入解析器中使用
 */
export function safeMigrateDsl(
  dslJson: unknown,
  targetVersion: string = CURRENT_DSL_VERSION,
  options?: MigrationOptions,
): MigrationResult {
  const effectiveTarget = options?.targetVersion || targetVersion || CURRENT_DSL_VERSION;
  const initialVersion =
    dslJson && typeof dslJson === 'object' && typeof (dslJson as any).schemaVersion === 'string'
      ? (dslJson as any).schemaVersion
      : DEFAULT_LEGACY_VERSION;

  try {
    const dsl = migrateDsl(dslJson, effectiveTarget, options);
    return {
      success: true,
      fromVersion: initialVersion,
      toVersion: effectiveTarget,
      stepsApplied: initialVersion === effectiveTarget ? [] : [`${initialVersion}->${effectiveTarget}`],
      dsl,
    };
  } catch (err: any) {
    return {
      success: false,
      fromVersion: initialVersion,
      toVersion: effectiveTarget,
      stepsApplied: [],
      error: err?.message || String(err),
    };
  }
}
