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
  </style>
</head>
<body>
  <div id="app"></div>

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
