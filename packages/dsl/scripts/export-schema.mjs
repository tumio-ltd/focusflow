import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDslJsonSchema } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const schema = generateDslJsonSchema({
  id: 'https://focusflow.io/schemas/dsl/v1.json',
  title: 'FocusFlowDSL',
  description: 'FocusFlow Declarative Domain Specific Language (DSL) Abstract Syntax Tree Specification',
  target: 'draft-7',
});

const jsonContent = JSON.stringify(schema, null, 2) + '\n';

// 1. Output to packages/dsl/dsl-schema.json (as specified in WBS 6.4.3)
const rootSchemaPath = path.join(packageRoot, 'dsl-schema.json');
fs.writeFileSync(rootSchemaPath, jsonContent, 'utf-8');

// 2. Output to packages/dsl/schema/focusflow-dsl.v1.json (as specified in spec 11 § 3.3 and § 6)
const schemaDir = path.join(packageRoot, 'schema');
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir, { recursive: true });
}
const versionedSchemaPath = path.join(schemaDir, 'focusflow-dsl.v1.json');
fs.writeFileSync(versionedSchemaPath, jsonContent, 'utf-8');

console.log('[FocusFlow DSL] JSON Schema exported successfully:');
console.log(`  - Root Schema:      ${rootSchemaPath} (${(Buffer.byteLength(jsonContent) / 1024).toFixed(1)} KB)`);
console.log(`  - Versioned Schema: ${versionedSchemaPath} (${(Buffer.byteLength(jsonContent) / 1024).toFixed(1)} KB)`);
