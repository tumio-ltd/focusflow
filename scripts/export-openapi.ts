import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const apiDir = path.resolve(projectRoot, 'apps/api');
const targetOpenApiJson = path.resolve(apiDir, 'openapi.json');

console.log('🚀 [OpenAPI] Commencing static OpenAPI schema extraction...');
console.log(`📁 Target output path: ${targetOpenApiJson}`);

try {
  // Execute generate-openapi in apps/api without starting network listeners
  execSync('npm run generate:openapi', {
    cwd: apiDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPORT_OPENAPI: 'true',
    },
  });

  if (!fs.existsSync(targetOpenApiJson)) {
    throw new Error(`OpenAPI JSON file not found at expected location: ${targetOpenApiJson}`);
  }

  const stat = fs.statSync(targetOpenApiJson);
  console.log(`✅ [OpenAPI] Schema exported successfully! Size: ${(stat.size / 1024).toFixed(2)} KB`);
} catch (err: any) {
  console.error(`❌ [OpenAPI] Extraction failed: ${err.message}`);
  process.exit(1);
}
