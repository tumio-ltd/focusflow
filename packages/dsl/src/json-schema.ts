import { z } from 'zod';
import { FocusFlowDslSchema } from './validator.js';

export interface GenerateJsonSchemaOptions {
  id?: string;
  title?: string;
  description?: string;
  target?: 'draft-7' | 'draft-2020-12';
}

/**
 * Generates standard JSON Schema specification object from FocusFlowDslSchema.
 * Uses Zod's native toJSONSchema converter and injects standard schema metadata ($id, title, description).
 */
export function generateDslJsonSchema(options?: GenerateJsonSchemaOptions): Record<string, unknown> {
  const target = options?.target ?? 'draft-7';
  const id = options?.id ?? 'https://focusflow.io/schemas/dsl/v1.json';
  const title = options?.title ?? 'FocusFlowDSL';
  const description =
    options?.description ??
    'FocusFlow Declarative Domain Specific Language (DSL) Abstract Syntax Tree Specification';

  const rawSchema = z.toJSONSchema(FocusFlowDslSchema, {
    target,
  }) as Record<string, unknown>;

  return {
    $schema: target === 'draft-7' ? 'http://json-schema.org/draft-07/schema#' : 'https://json-schema.org/draft/2020-12/schema',
    $id: id,
    title,
    description,
    ...rawSchema,
  };
}
