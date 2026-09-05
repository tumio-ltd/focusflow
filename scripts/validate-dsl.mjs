#!/usr/bin/env node

/**
 * FocusFlow DSL Static Linter & Validator
 * High-speed (< 50ms) offline static checker for FocusFlow DSL (config.json).
 * Validates JSON schema, referential integrity, camera safety bounds, and asset URLs.
 *
 * Usage: node scripts/validate-dsl.mjs <path-to-config.json>
 * Example: node scripts/validate-dsl.mjs examples/overlay-demo/config.json
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('\x1b[33mUsage: node scripts/validate-dsl.mjs <path-to-config.json>\x1b[0m');
  process.exit(1);
}

const configPath = path.resolve(process.cwd(), args[0]);

if (!fs.existsSync(configPath)) {
  console.error(`\x1b[31m✖ File not found: ${configPath}\x1b[0m`);
  process.exit(1);
}

const startTime = performance.now();
const errors = [];
const warnings = [];

// 1. JSON Syntax Check
let dsl;
try {
  const content = fs.readFileSync(configPath, 'utf-8');
  dsl = JSON.parse(content);
} catch (err) {
  console.error(`\x1b[31m✖ JSON Parse Error: ${err.message}\x1b[0m`);
  process.exit(1);
}

if (!dsl || typeof dsl !== 'object') {
  console.error('\x1b[31m✖ DSL must be a valid JSON object.\x1b[0m');
  process.exit(1);
}

// 2. Meta Validation
if (!dsl.meta) {
  errors.push('Missing top-level "meta" object.');
} else {
  if (!dsl.meta.title) {
    warnings.push('meta.title is empty or missing.');
  }
  if (!dsl.meta.viewport || typeof dsl.meta.viewport.width !== 'number' || typeof dsl.meta.viewport.height !== 'number') {
    errors.push('meta.viewport must specify numeric "width" and "height" (e.g. 1920x1080).');
  }
}

const viewportW = dsl.meta?.viewport?.width || 1920;
const viewportH = dsl.meta?.viewport?.height || 1080;

// 3. Asset Validation
if (!dsl.asset) {
  errors.push('Missing top-level "asset" object.');
} else {
  if (!dsl.asset.url) {
    errors.push('asset.url is required.');
  } else if (dsl.asset.url.startsWith('data:')) {
    if (dsl.asset.url.length > 400000) {
      warnings.push(
        `asset.url contains a massive Base64 Data URI (${(dsl.asset.url.length / 1024).toFixed(1)} KB). ` +
        'Recommendation: Use local relative file paths (e.g. "./assets/arch.png") or HTTP URLs to avoid token exhaustion and bloated files.'
      );
    }
  } else if (!dsl.asset.url.startsWith('http://') && !dsl.asset.url.startsWith('https://')) {
    // Relative path check
    const baseDir = path.dirname(configPath);
    const resolvedPath = path.resolve(baseDir, dsl.asset.url);
    if (!fs.existsSync(resolvedPath)) {
      warnings.push(`Local asset file not found on disk at: ${resolvedPath} (relative to config.json directory)`);
    }
  }

  if (typeof dsl.asset.width !== 'number' || typeof dsl.asset.height !== 'number') {
    warnings.push('asset.width or asset.height is missing or non-numeric.');
  }
}

// 4. Elements & Referential Integrity
const elements = dsl.elements || {};
const boxIds = new Set();
const pathIds = new Set();
const dotIds = new Set();
const imageIds = new Set();

// 4.1 Boxes
if (Array.isArray(elements.boxes)) {
  elements.boxes.forEach((box, idx) => {
    if (!box.id) {
      errors.push(`elements.boxes[${idx}] is missing an "id".`);
      return;
    }
    if (boxIds.has(box.id)) {
      errors.push(`Duplicate box id "${box.id}".`);
    }
    boxIds.add(box.id);

    if (typeof box.x !== 'number' || typeof box.y !== 'number' || typeof box.width !== 'number' || typeof box.height !== 'number') {
      errors.push(`Box "${box.id}" has invalid bounds (x, y, width, height must all be numbers).`);
    } else {
      if (box.width <= 0 || box.height <= 0) {
        errors.push(`Box "${box.id}" width and height must be positive numbers.`);
      }
      if (box.x + box.width > viewportW * 1.5 || box.y + box.height > viewportH * 1.5) {
        warnings.push(`Box "${box.id}" extends far beyond the canvas viewport.`);
      }
    }
  });
}

// 4.2 Paths
if (Array.isArray(elements.paths)) {
  elements.paths.forEach((p, idx) => {
    if (!p.id) {
      errors.push(`elements.paths[${idx}] is missing an "id".`);
      return;
    }
    if (pathIds.has(p.id)) {
      errors.push(`Duplicate path id "${p.id}".`);
    }
    pathIds.add(p.id);

    if (!p.from || !p.to) {
      errors.push(`Path "${p.id}" must have both "from" and "to" fields.`);
      return;
    }

    const fromBoxId = p.from.split('.')[0];
    const toBoxId = p.to.split('.')[0];

    if (!boxIds.has(fromBoxId)) {
      errors.push(`Path "${p.id}" refers to non-existent from-box "${fromBoxId}".`);
    }
    if (!boxIds.has(toBoxId)) {
      errors.push(`Path "${p.id}" refers to non-existent to-box "${toBoxId}".`);
    }

    if (!p.from.includes('.') || !p.to.includes('.')) {
      warnings.push(`Path "${p.id}" does not specify explicit 8-way anchors (e.g. "${fromBoxId}.right" -> "${toBoxId}.left"). System will use auto-inferred anchors.`);
    }
  });
}

// 4.3 Dots & Images
if (Array.isArray(elements.dots)) {
  elements.dots.forEach((d, idx) => {
    if (d.id) dotIds.add(d.id);
  });
}
if (Array.isArray(elements.images)) {
  elements.images.forEach((img, idx) => {
    if (img.id) imageIds.add(img.id);
  });
}

// 5. Scenes & Camera Validation
if (!Array.isArray(dsl.scenes) || dsl.scenes.length === 0) {
  errors.push('DSL must contain a non-empty "scenes" array.');
} else {
  dsl.scenes.forEach((scene, sIdx) => {
    const sName = scene.title || scene.id || `Scene ${sIdx + 1}`;

    // Camera validation
    if (!scene.camera) {
      errors.push(`[${sName}] Missing "camera" object.`);
    } else {
      const { zoom = 1, x = 0, y = 0, duration = 1.2 } = scene.camera;

      if (typeof zoom !== 'number' || zoom < 0.1 || zoom > 10) {
        errors.push(`[${sName}] Invalid camera.zoom (${zoom}). Recommended: 1.0 ~ 3.0.`);
      }

      // Check if camera x/y is mistaken for pixel coordinates instead of percentage offset (-50 ~ 50)
      if (Math.abs(x) > 60 || Math.abs(y) > 60) {
        warnings.push(
          `[${sName}] camera.x (${x}) or camera.y (${y}) is unusually large (> 60). ` +
          'Note: FocusFlow camera.x and camera.y are percentage offsets (-50 to +50) relative to image center (0,0 is center, -25 is 25% left, 25 is 25% right), NOT absolute pixels!'
        );
      }

      if (typeof duration !== 'number' || duration < 0) {
        warnings.push(`[${sName}] camera.duration should be a non-negative number of seconds.`);
      }
    }

    // Active Elements
    const active = scene.activeElements || {};
    if (Array.isArray(active.boxes)) {
      active.boxes.forEach((bId) => {
        if (!boxIds.has(bId)) {
          errors.push(`[${sName}] activeElements.boxes references unknown box "${bId}".`);
        }
      });
    }

    if (Array.isArray(active.paths)) {
      active.paths.forEach((pId) => {
        if (!pathIds.has(pId)) {
          errors.push(`[${sName}] activeElements.paths references unknown path "${pId}".`);
        }
      });
    }

    if (Array.isArray(active.callouts)) {
      active.callouts.forEach((callout, cIdx) => {
        const cId = callout.id || `callout-${cIdx}`;
        const targetId = callout.targetBoxId || callout.boxId;

        if (!targetId) {
          warnings.push(`[${sName}] Callout "${cId}" has neither "targetBoxId" nor "boxId".`);
        } else if (!boxIds.has(targetId)) {
          errors.push(`[${sName}] Callout "${cId}" targets non-existent box "${targetId}".`);
        }

        if (callout.boxId && !callout.targetBoxId) {
          warnings.push(`[${sName}] Callout "${cId}" uses legacy "boxId". Recommendation: Use "targetBoxId" to ensure leader-line rendering.`);
        }

        if (!callout.title) {
          warnings.push(`[${sName}] Callout "${cId}" is missing a "title".`);
        }
        if (!callout.desc && !callout.description) {
          warnings.push(`[${sName}] Callout "${cId}" is missing body text ("desc" / "description").`);
        }
      });
    }
  });
}

// 6. Summary Report
const elapsed = (performance.now() - startTime).toFixed(1);

console.log('\n============================================================');
console.log(`🔍 FocusFlow DSL Validation Report (${elapsed} ms)`);
console.log(`📁 File: ${path.basename(configPath)}`);
console.log('============================================================\n');

if (errors.length > 0) {
  console.log(`\x1b[31m✖ Found ${errors.length} Critical Error(s):\x1b[0m`);
  errors.forEach((err, i) => console.log(`  ${i + 1}. \x1b[31m${err}\x1b[0m`));
  console.log('');
}

if (warnings.length > 0) {
  console.log(`\x1b[33m⚠ Found ${warnings.length} Warning(s) & Optimization Tip(s):\x1b[0m`);
  warnings.forEach((warn, i) => console.log(`  ${i + 1}. \x1b[33m${warn}\x1b[0m`));
  console.log('');
}

if (errors.length === 0) {
  console.log(`\x1b[32m✔ DSL Syntax & Structure Valid!\x1b[0m`);
  console.log(`  • Title: "${dsl.meta?.title || 'Untitled'}"`);
  console.log(`  • Scenes: ${dsl.scenes?.length || 0} step(s)`);
  console.log(`  • Boxes: ${boxIds.size} defined`);
  console.log(`  • Paths: ${pathIds.size} defined`);
  console.log(`\n\x1b[32m🎉 Ready for Standalone Packaging & Video Rendering.\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`\x1b[31m❌ Validation Failed with ${errors.length} error(s). Please fix before packaging.\x1b[0m\n`);
  process.exit(1);
}
