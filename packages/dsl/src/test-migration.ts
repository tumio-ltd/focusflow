import {
  migrateDsl,
  migrateDSLToLatest,
  safeMigrateDsl,
  registerMigrationStep,
  CURRENT_DSL_VERSION,
  validateDSL,
  type FocusFlowDSL,
} from './index.js';

function assert(desc: string, condition: boolean) {
  if (!condition) {
    console.error(`❌ FAILED: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
  console.log(`✅ PASSED: ${desc}`);
}

console.log('=== STARTING FOCUSFLOW DSL MIGRATION PIPELINE TEST SUITE ===');

// --- Test 1: Legacy 0.9.0 (no schemaVersion) migration to 1.0.0 ---
{
  const legacyDSL = {
    meta: {
      title: 'Legacy Architecture Demo',
      viewport: {
        width: 1920,
        height: 1080,
      },
    },
    asset: {
      url: 'https://example.com/arch.svg',
    },
    elements: {
      boxes: [
        {
          id: 'box-1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
        },
      ],
      paths: [
        {
          id: 'path-1',
          from: 'box-1.right',
          to: 'box-nonexistent.left', // Dangling reference
        },
      ],
    },
    scenes: [
      {
        id: 'scene-1',
        title: 'Introduction',
        duration: 4000,
        camera: {
          x: 0,
          y: 0,
          zoom: 1.0,
        },
      },
    ],
  };

  const migrated = migrateDsl(legacyDSL);

  assert('Migrated DSL must have schemaVersion 1.0.0', migrated.schemaVersion === '1.0.0');
  assert('Viewport aspectRatio must be normalized to 16:9', migrated.meta.viewport.aspectRatio === '16:9');
  assert('Default theme mode must be dark', migrated.meta.theme?.mode === 'dark');
  assert('Dangling path referencing box-nonexistent must be pruned', migrated.elements.paths.length === 0);

  // Verify that the migrated DSL passes the full Zod validator
  const validation = validateDSL(migrated);
  assert('Migrated DSL must pass validateDSL() 100%', validation.valid === true);
}

// --- Test 2: Minimal partial DSL missing scenes/viewport auto-fills defaults ---
{
  const barebonesDSL = {
    meta: {
      title: 'Minimal Draft',
    },
    asset: {
      url: 'https://example.com/simple.png',
    },
  };

  const migrated = migrateDSLToLatest(barebonesDSL);

  assert('Schema version matches current', migrated.schemaVersion === CURRENT_DSL_VERSION);
  assert('Viewport width is 1920', migrated.meta.viewport.width === 1920);
  assert('Viewport height is 1080', migrated.meta.viewport.height === 1080);
  assert('Auto-generated default scene must be present', migrated.scenes.length === 1);
  assert('Default scene title is Overview', migrated.scenes[0].title === 'Overview');

  const validation = validateDSL(migrated);
  assert('Auto-filled DSL passes validation', validation.valid === true);
}

// --- Test 3: Already at 1.0.0 is pass-through ---
{
  const v1DSL: FocusFlowDSL = {
    schemaVersion: '1.0.0',
    meta: {
      title: 'Modern 1.0.0 Graph',
      viewport: {
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
      },
      theme: {
        mode: 'dark',
      },
    },
    asset: {
      url: 'https://example.com/asset.svg',
    },
    elements: {
      boxes: [],
      paths: [],
      dots: [],
      images: [],
    },
    scenes: [
      {
        id: 's1',
        title: 'Scene 1',
        duration: 3000,
        camera: { x: 0, y: 0, zoom: 1 },
        activeElements: {},
      },
    ],
  };

  const result = migrateDsl(v1DSL, '1.0.0');
  assert('Already at 1.0.0 preserves version', result.schemaVersion === '1.0.0');
  assert('Already at 1.0.0 preserves title', result.meta.title === 'Modern 1.0.0 Graph');
}

// --- Test 4: safeMigrateDsl returns diagnostic result on error ---
{
  const invalidResult = safeMigrateDsl(null);
  assert('safeMigrateDsl returns success=false on null', invalidResult.success === false);
  assert(
    'safeMigrateDsl error contains descriptive message',
    Boolean(invalidResult.error && invalidResult.error.includes('Expected dslJson to be a non-null object')),
  );
}

// --- Test 5: Unknown migration path error handling ---
{
  const unknownDSL = {
    schemaVersion: '0.1.0-alpha',
    meta: { title: 'Unknown' },
  };

  let threw = false;
  try {
    migrateDsl(unknownDSL, '1.0.0');
  } catch (err: any) {
    threw = true;
    assert('Error message specifies unknown version', err.message.includes('No migration path registered'));
  }
  assert('Unknown source version throws error', threw === true);
}

// --- Test 6: Multi-step migration pipeline chaining ---
{
  // Register simulated future migration: 1.0.0 -> 1.1.0
  registerMigrationStep({
    fromVersion: '1.0.0',
    targetVersion: '1.1.0',
    description: 'Simulated 1.0.0 to 1.1.0 upgrade adding new tag',
    step: (raw) => {
      const copy: Record<string, any> = { ...raw, schemaVersion: '1.1.0' };
      copy.meta = { ...copy.meta, tag: 'v1.1-upgraded' };
      return copy;
    },
  });

  const legacyDSL = {
    meta: {
      title: 'Chain Migration Test',
      viewport: { width: 1920, height: 1080 },
    },
    asset: { url: 'https://test.com/img.png' },
    elements: { boxes: [] },
    scenes: [
      { id: 's1', title: 'S1', duration: 2000, camera: { x: 0, y: 0, zoom: 1 } },
    ],
  };

  // 0.9.0 -> 1.0.0 -> 1.1.0 without validation (since 1.1.0 is a mock future schema)
  const chained = migrateDsl(legacyDSL, '1.1.0', { validate: false });
  assert('Chained migration reaches target version 1.1.0', chained.schemaVersion === '1.1.0');
  assert('Step transformation applied', (chained.meta as any).tag === 'v1.1-upgraded');
}

console.log('=== ALL FOCUSFLOW DSL MIGRATION TESTS PASSED PERFECTLY ===\n');
