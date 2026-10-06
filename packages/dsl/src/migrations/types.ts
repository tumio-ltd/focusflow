import type { FocusFlowDSL } from '../schema.js';

export const CURRENT_DSL_VERSION = '1.0.0';
export const DEFAULT_LEGACY_VERSION = '0.9.0';

/**
 * 单步迁移变换函数类型签名
 */
export type DSLMigrationStep = (raw: Record<string, any>) => Record<string, any>;

/**
 * 迁移步骤元数据定义
 */
export interface MigrationStepDefinition {
  fromVersion: string;
  targetVersion: string;
  description: string;
  step: DSLMigrationStep;
}

/**
 * 迁移参数配置
 */
export interface MigrationOptions {
  /** 目标迁移版本号，若不传则默认为当前系统最新版本 (CURRENT_DSL_VERSION) */
  targetVersion?: string;
  /** 迁移完成后是否调用 Zod 运行强校验，默认为 true */
  validate?: boolean;
  /** 是否自动清理悬空引用与孤儿图元 (拓扑自愈)，默认为 true */
  cleanDanglingRefs?: boolean;
}

/**
 * 安全迁移执行结果返回结构
 */
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  stepsApplied: string[];
  dsl?: FocusFlowDSL;
  error?: string;
  validationErrors?: string[];
}
