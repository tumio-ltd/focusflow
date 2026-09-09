#!/usr/bin/env node
/**
 * FocusFlow Open-Source Selective Projection Sync Script
 * 
 * Synchronizes only open-source allowed directories to GitHub repository,
 * ensuring all internal assets (design/, docs-internal/, legacy/, apps/api, packages/database, etc.)
 * remain strictly private on the internal Gitea repository.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 🟢 Whitelist: ONLY these paths will be synchronized to GitHub
const OSS_WHITELIST = [
  'apps/studio',
  'packages/player',
  'packages/dsl',
  'packages/config-oxlint',
  'packages/config-tailwind',
  'packages/config-typescript',
  'examples',
  'docs',
  'scripts',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
  'tsconfig.base.json',
  'vite.config.js',
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'index.html',
  '.changeset',
  '.oxlintrc.json',
  '.prettierrc.json',
  '.gitignore'
];

// 🔴 Blacklist: These paths MUST NEVER appear in GitHub public repo
const PRIVATE_BLACKLIST = [
  'docs-internal',
  'design',
  'legacy',
  'apps/api',
  'apps/render-worker',
  'packages/database',
  '.env',
  '.env.local'
];

const TARGET_REMOTE = 'github';
const TARGET_BRANCH = 'main';

function run(cmd, cwd = projectRoot, options = {}) {
  return execSync(cmd, {
    cwd,
    stdio: options.silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    env: { ...process.env, GIT_SSH_COMMAND: 'ssh -o ControlMaster=no -o ConnectTimeout=15' }
  });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.turbo') continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  console.log('🚀 Starting FocusFlow Open-Source Selective Sync to GitHub...');
  const isForce = process.argv.includes('--force');

  // 1. Create temporary worktree directory
  const tempDir = path.join(os.tmpdir(), `focusflow-oss-${Date.now()}`);
  console.log(`📦 Creating local isolated worktree: ${tempDir}`);

  // Ensure target remote branch is tracked locally
  try {
    run(`git fetch ${TARGET_REMOTE} ${TARGET_BRANCH}`, projectRoot, { silent: true });
  } catch {
    console.warn(`⚠️ Warning: Failed to fetch latest from ${TARGET_REMOTE}/${TARGET_BRANCH}, using local ref.`);
  }

  // Add worktree rooted at TARGET_REMOTE/TARGET_BRANCH (or local head if remote ref absent)
  let baseRef = `${TARGET_REMOTE}/${TARGET_BRANCH}`;
  try {
    execSync(`git rev-parse --verify ${baseRef}`, { cwd: projectRoot, stdio: 'ignore' });
  } catch {
    baseRef = 'HEAD';
  }

  run(`git worktree add "${tempDir}" -B oss-sync ${baseRef}`);

  try {
    // 2. Clean all non-.git files in the worktree
    console.log('🧹 Evacuating non-git tracked files from worktree staging...');
    for (const file of fs.readdirSync(tempDir)) {
      if (file === '.git') continue;
      fs.rmSync(path.join(tempDir, file), { recursive: true, force: true });
    }

    // 3. Copy only whitelisted assets
    console.log('📋 Copying whitelisted open-source assets...');
    for (const relPath of OSS_WHITELIST) {
      const srcPath = path.join(projectRoot, relPath);
      const destPath = path.join(tempDir, relPath);
      if (fs.existsSync(srcPath)) {
        copyRecursive(srcPath, destPath);
      } else {
        console.warn(`⚠️ Warning: Whitelist path "${relPath}" does not exist in workspace, skipping.`);
      }
    }

    // 4. Strict security verification: ensure NO blacklisted paths exist in staging
    console.log('🔒 Verifying security blacklist isolation...');
    for (const badPath of PRIVATE_BLACKLIST) {
      const checkPath = path.join(tempDir, badPath);
      if (fs.existsSync(checkPath)) {
        throw new Error(`🚨 SECURITY VIOLATION: Blacklisted path "${badPath}" found in staging! Aborting immediately.`);
      }
    }

    // 5. Check Git status in staging
    const status = run('git status --porcelain', tempDir, { silent: true }).trim();
    if (!status) {
      console.log('✅ GitHub open-source repository is already up to date. No changes to push.');
      return;
    }

    console.log('📝 Detected changes to open-source projection:');
    console.log(status.split('\n').slice(0, 15).join('\n'));
    if (status.split('\n').length > 15) {
      console.log(`... and ${status.split('\n').length - 15} more files.`);
    }

    // 6. Commit changes
    run('git add -A', tempDir);
    run('git config user.name "xiangc579"', tempDir);
    run('git config user.email "gf.bahamut@gmail.com"', tempDir);
    const dateStr = new Date().toISOString().slice(0, 10);
    const commitMsg = `chore(sync): update open-source projection from internal monorepo (${dateStr})`;
    run(`git commit --author="xiangc579 <gf.bahamut@gmail.com>" -m "${commitMsg}"`, tempDir);

    // 7. Push to GitHub
    console.log('📤 Pushing clean projection to GitHub (main)...');
    const pushCmd = isForce
      ? `git push --force ${TARGET_REMOTE} oss-sync:${TARGET_BRANCH}`
      : `git push ${TARGET_REMOTE} oss-sync:${TARGET_BRANCH}`;
    run(pushCmd, tempDir);

    console.log('🎉 Successfully synchronized open-source projection to GitHub!');
  } finally {
    // 8. Clean worktree
    console.log('🧹 Releasing local worktree...');
    try {
      run(`git worktree remove "${tempDir}" --force`, projectRoot, { silent: true });
    } catch {
      // ignore
    }
  }
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message || err);
  process.exit(1);
});
