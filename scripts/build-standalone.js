import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Builds a 100% standalone, single-file HTML for any FocusFlow example.
 * Inlines CSS, JS Engine, DSL configuration, and encodes image assets to Base64 data URIs.
 *
 * Usage: node scripts/build-standalone.js [example-dir] [output-file]
 * Example: node scripts/build-standalone.js examples/overlay-demo dist/overlay-demo-standalone.html
 */
async function buildStandalone(exampleDirArg = 'examples/overlay-demo', outputFileArg) {
  const exampleDir = path.resolve(projectRoot, exampleDirArg);
  const configPath = path.join(exampleDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    console.error(`❌ config.json not found in ${exampleDir}`);
    process.exit(1);
  }

  console.log(`📦 Packaging FocusFlow Standalone HTML from: ${exampleDirArg}`);

  // 1. Read and parse DSL
  const dslRaw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const dsl = JSON.parse(JSON.stringify(dslRaw)); // Clone

  // 2. Base64-encode main asset image
  if (dsl.asset?.url && !dsl.asset.url.startsWith('data:') && !dsl.asset.url.startsWith('http')) {
    const cleanImgPath = dsl.asset.url.startsWith('./') ? dsl.asset.url.slice(2) : dsl.asset.url;
    const absImgPath = path.join(exampleDir, cleanImgPath);
    if (fs.existsSync(absImgPath)) {
      const ext = path.extname(absImgPath).slice(1) || 'png';
      const b64 = fs.readFileSync(absImgPath).toString('base64');
      dsl.asset.url = `data:image/${ext};base64,${b64}`;
      console.log(`  ✓ Inlined main asset: ${cleanImgPath} (${(b64.length / 1024).toFixed(1)} KB base64)`);
    }
  }

  // 3. Base64-encode dynamic overlay images
  if (dsl.elements?.images && Array.isArray(dsl.elements.images)) {
    dsl.elements.images.forEach((img) => {
      if (img.url && !img.url.startsWith('data:') && !img.url.startsWith('http')) {
        const cleanImgPath = img.url.startsWith('./') ? img.url.slice(2) : img.url;
        const absImgPath = path.join(exampleDir, cleanImgPath);
        if (fs.existsSync(absImgPath)) {
          const ext = path.extname(absImgPath).slice(1) || 'png';
          const b64 = fs.readFileSync(absImgPath).toString('base64');
          img.url = `data:image/${ext};base64,${b64}`;
          console.log(`  ✓ Inlined overlay image: ${cleanImgPath} (${(b64.length / 1024).toFixed(1)} KB base64)`);
        }
      }
    });
  }

  // 4. Read CSS
  const cssPath = path.join(projectRoot, 'packages/player/src/styles/focusflow.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  console.log(`  ✓ Inlined CSS (${(cssContent.length / 1024).toFixed(1)} KB)`);

  // 5. Bundle JS engine as IIFE using Vite
  const buildResult = await build({
    root: projectRoot,
    logLevel: 'warn',
    build: {
      write: false,
      lib: {
        entry: path.join(projectRoot, 'packages/player/src/index.js'),
        name: 'FocusFlow',
        formats: ['iife'],
        fileName: () => 'bundle.iife.js'
      },
      rollupOptions: {
        output: {
          extend: true
        }
      }
    }
  });

  let bundledJs = '';
  if (Array.isArray(buildResult)) {
    const chunk = buildResult[0].output.find(o => o.type === 'chunk');
    bundledJs = chunk ? chunk.code : '';
  } else if (buildResult.output) {
    const chunk = buildResult.output.find(o => o.type === 'chunk');
    bundledJs = chunk ? chunk.code : '';
  }

  console.log(`  ✓ Bundled JS Engine (${(bundledJs.length / 1024).toFixed(1)} KB)`);

  // 6. Assemble Single HTML
  const title = dsl.meta?.title || 'FocusFlow Standalone Showcase';
  const bgColor = dsl.meta?.theme?.bg || '#0a0e17';

  const WATERMARK_SVG_LOGO = `<svg viewBox="0 0 128 128" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" class="ff-watermark-icon">
    <defs>
      <linearGradient id="ffWatermarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284c7" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
      <filter id="ffWatermarkGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <g stroke="#38bdf8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
      <path d="M 40 24 L 28 24 A 4 4 0 0 0 24 28 L 24 40" />
      <path d="M 88 24 L 100 24 A 4 4 0 0 1 104 28 L 104 40" />
      <path d="M 24 88 L 24 100 A 4 4 0 0 0 28 104 L 40 104" />
      <path d="M 104 88 L 104 100 A 4 4 0 0 1 100 104 L 88 104" />
    </g>
    <path d="M 28 96 C 52 96, 56 32, 100 32" stroke="url(#ffWatermarkGrad)" stroke-width="11" stroke-linecap="round" filter="url(#ffWatermarkGlow)" />
    <circle cx="100" cy="32" r="7" fill="#ffffff" filter="url(#ffWatermarkGlow)" />
  </svg>`;

  const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #app {
      width: 100%;
      height: 100%;
    }
    ${cssContent}

    /* ==========================================================================
       FocusFlow Official Watermark Badge (开源版官方微型水印角标)
       ========================================================================== */
    .ff-watermark-badge {
      --ff-watermark-y: 0px;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 40;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px 4px 5px;
      border-radius: 9999px;
      background: rgba(10, 14, 23, 0.78);
      border: 1px solid rgba(56, 189, 248, 0.22);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      text-decoration: none;
      user-select: none;
      cursor: pointer;
      opacity: 0.82;
      transform: translateY(var(--ff-watermark-y));
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ff-watermark-badge:hover {
      opacity: 1;
      background: rgba(13, 20, 36, 0.92);
      border-color: rgba(56, 189, 248, 0.55);
      transform: translateY(calc(var(--ff-watermark-y) - 1.5px));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 14px rgba(56, 189, 248, 0.2);
    }

    .ff-watermark-badge:active {
      transform: translateY(var(--ff-watermark-y));
      opacity: 0.95;
    }

    /* 避让右下角最小化胶囊控制器 (Scheme A: Upward Displacement) */
    body:has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
    :has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
    .ff-watermark-badge.ff-watermark-displaced {
      --ff-watermark-y: -42px;
    }

    .ff-watermark-logo-box {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .ff-watermark-badge:hover .ff-watermark-logo-box {
      background: rgba(56, 189, 248, 0.2);
      border-color: rgba(56, 189, 248, 0.45);
    }

    .ff-watermark-icon {
      width: 14px;
      height: 14px;
      display: block;
    }

    .ff-watermark-label {
      display: flex;
      align-items: baseline;
      gap: 4px;
      line-height: 1;
      white-space: nowrap;
    }

    .ff-watermark-prefix {
      font-size: 10.5px;
      font-weight: 400;
      letter-spacing: 0.02em;
      color: rgba(148, 163, 184, 0.85);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ff-watermark-brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: -0.01em;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    @media (max-width: 640px) {
      .ff-watermark-badge {
        bottom: 74px;
        right: 12px;
        padding: 3px 8px 3px 4px;
      }
      body:has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
      :has(.ff-island-minimal.ff-island-visible) .ff-watermark-badge,
      .ff-watermark-badge.ff-watermark-displaced {
        --ff-watermark-y: 0px;
      }
      .ff-watermark-prefix {
        display: none;
      }
      .ff-watermark-logo-box {
        width: 18px;
        height: 18px;
      }
      .ff-watermark-icon {
        width: 12px;
        height: 12px;
      }
      .ff-watermark-brand {
        font-size: 10px;
      }
    }

    :fullscreen .ff-watermark-badge,
    :-webkit-full-screen .ff-watermark-badge {
      bottom: 28px;
      right: 28px;
      opacity: 0.65;
    }

    :fullscreen .ff-watermark-badge:hover,
    :-webkit-full-screen .ff-watermark-badge:hover {
      opacity: 1;
    }
  </style>
</head>
<body>
  <div id="app"></div>

  <!-- FocusFlow Official Watermark Badge (开源版官方微型水印角标) -->
  <a
    href="https://tumio-ltd.github.io/focusflow/"
    target="_blank"
    rel="noopener noreferrer"
    class="ff-watermark-badge"
    data-testid="focusflow-watermark-badge"
    title="FocusFlow · 动效架构演进演示 (点击探索)"
  >
    <div class="ff-watermark-logo-box">
      ${WATERMARK_SVG_LOGO}
    </div>
    <span class="ff-watermark-label">
      <span class="ff-watermark-prefix">Powered by</span>
      <span class="ff-watermark-brand">FocusFlow</span>
    </span>
  </a>

  <!-- FocusFlow Engine Bundle -->
  <script>
${bundledJs}
  </script>

  <!-- Auto Mount Player -->
  <script>
    (function() {
      const dsl = ${JSON.stringify(dsl, null, 2)};
      const PlayerClass = window.FocusFlow?.FocusFlowPlayer || window.FocusFlowPlayer;
      if (PlayerClass) {
        window.player = new PlayerClass({
          container: '#app',
          dsl: dsl,
          basePath: './',
          debug: false,
          showHUDButton: false
        });
      } else {
        console.error('[FocusFlow] FocusFlowPlayer class not found in window.');
      }
    })();
  </script>
</body>
</html>`;

  // 7. Output Files
  const defaultOutName = `${path.basename(exampleDir)}-standalone.html`;
  const distOutPath = outputFileArg
    ? path.resolve(projectRoot, outputFileArg)
    : path.join(projectRoot, 'dist', defaultOutName);

  const localOutPath = path.join(exampleDir, 'standalone.html');

  const distDir = path.dirname(distOutPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Write to dist/
  fs.writeFileSync(distOutPath, standaloneHtml, 'utf-8');

  // Also write to examples/[name]/standalone.html for easy access
  fs.writeFileSync(localOutPath, standaloneHtml, 'utf-8');

  console.log(`\n🎉 Success! Standalone single-file HTML generated:`);
  console.log(`   👉 产物 1: ${path.relative(projectRoot, distOutPath)} (${(fs.statSync(distOutPath).size / 1024).toFixed(1)} KB)`);
  console.log(`   👉 产物 2: ${path.relative(projectRoot, localOutPath)} (${(fs.statSync(localOutPath).size / 1024).toFixed(1)} KB)`);
  console.log(`   💡 双击上面任一 HTML 文件，即可在任何没有 Node 环境/无网的浏览器中直接运行！\n`);
}

// CLI args
const args = process.argv.slice(2);
const exampleDir = args[0] || 'examples/luxehms';
const outputFile = args[1];

buildStandalone(exampleDir, outputFile).catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
