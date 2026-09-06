import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * 1. 验证 CLI 无头渲染管线支持 --json NDJSON 流式事件输出
 */
async function verifyHeadlessCliNdjsonOutput(): Promise<void> {
  const scriptPath = path.join(projectRoot, 'scripts/render-video.mjs');
  const outputPath = path.join(projectRoot, 'dist/test-e2e-ndjson.mp4');
  const quickConfigPath = path.join(projectRoot, 'dist/.quick-test-config.json');

  if (!fs.existsSync(path.dirname(quickConfigPath))) {
    fs.mkdirSync(path.dirname(quickConfigPath), { recursive: true });
  }

  // 1 幕极速分镜配置 (总时长 800ms，渲染仅需约 2 秒)
  fs.writeFileSync(
    quickConfigPath,
    JSON.stringify({
      meta: { title: 'Quick Test', viewport: { width: 1280, height: 720 }, controls: { interval: 800 } },
      asset: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
      elements: { boxes: [], paths: [] },
      scenes: [
        {
          id: 'scene-quick',
          title: 'Quick Scene',
          duration: 800,
          camera: { zoom: 1.0, x: 0, y: 0, duration: 0.4 },
          activeElements: {},
        },
      ],
    }),
    'utf-8'
  );

  const cmd = `node "${scriptPath}" "${quickConfigPath}" -o "${outputPath}" --fps 30 --timeout 60 --json`;

  const { stdout } = await execAsync(cmd, { cwd: projectRoot });

  const lines = stdout.trim().split('\n').filter(Boolean);
  const events = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // 验证包含 init, progress, complete 事件
  const initEvent = events.find((e) => e.type === 'init');
  expect(initEvent).toBeDefined();
  expect(initEvent.resolution).toBeDefined();
  expect(initEvent.fps).toBe(30);

  const progressEvents = events.filter((e) => e.type === 'progress');
  expect(progressEvents.length).toBeGreaterThan(0);

  const completeEvent = events.find((e) => e.type === 'complete');
  expect(completeEvent).toBeDefined();
  expect(completeEvent.totalFrames).toBeGreaterThan(0);

  // 验证生成的文件合法
  expect(fs.existsSync(outputPath)).toBe(true);
  const stat = fs.statSync(outputPath);
  expect(stat.size).toBeGreaterThan(1024);

  // 清理
  try {
    fs.unlinkSync(outputPath);
  } catch {}
}

/**
 * 2. 验证 DSL 缺失或非法时给出标准退出码 1 与结构化自愈修复建议
 */
async function verifyInvalidDslErrorHandling(): Promise<void> {
  const scriptPath = path.join(projectRoot, 'scripts/render-video.mjs');
  const invalidPath = path.join(projectRoot, 'non-existent-dir-for-test');

  let caughtError: any = null;
  try {
    await execAsync(`node "${scriptPath}" "${invalidPath}" --json`, { cwd: projectRoot });
  } catch (err: any) {
    caughtError = err;
  }

  expect(caughtError).toBeDefined();
  expect(caughtError.code).toBe(1);

  const errorJson = JSON.parse(caughtError.stdout || caughtError.stderr);
  expect(errorJson.type).toBe('error');
  expect(errorJson.code).toBe('ERR_INVALID_DSL');
  expect(errorJson.suggestion).toBeDefined();
}

test.describe('FocusFlow Headless Video Rendering Pipeline (Stage 5.7)', () => {
  test('TC571: 验证 CLI 确定性虚拟时钟步进渲染与 NDJSON 流协议', async () => {
    await verifyHeadlessCliNdjsonOutput();
  });

  test('TC572: 验证非法路径退出状态码与 Agent 结构化自愈建议', async () => {
    await verifyInvalidDslErrorHandling();
  });
});
