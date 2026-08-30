import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * FocusFlow Project Initializer (Scaffolding Tool)
 * Creates a brand new FocusFlow interactive project with standard boilerplate,
 * auto-configured config.json, index.html and asset binding.
 *
 * Usage: node scripts/create-project.js <project-name> [image-path]
 * Example: node scripts/create-project.js payment-gateway ./my-architecture.png
 */
function createProject(projectNameArg, imagePathArg) {
  if (!projectNameArg) {
    console.log(`
⚡ FocusFlow Project Scaffolding CLI

Usage:
  node scripts/create-project.js <project-name> [image-path]
  pnpm create:project <project-name> [image-path]

Examples:
  node scripts/create-project.js order-system ./assets/order_architecture.png
  pnpm create:project cloud-network
`);
    process.exit(0);
  }

  const projectName = projectNameArg.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const targetDir = path.join(projectRoot, 'examples', projectName);

  if (fs.existsSync(targetDir)) {
    console.warn(`⚠️ Warning: Directory "examples/${projectName}" already exists.`);
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Handle Asset Image
  let targetImageName = 'system_architecture.png';
  let viewportWidth = 5120;
  let viewportHeight = 2880;

  if (imagePathArg) {
    const absSrc = path.resolve(process.cwd(), imagePathArg);
    if (fs.existsSync(absSrc)) {
      targetImageName = path.basename(absSrc);
      const destPath = path.join(targetDir, targetImageName);
      fs.copyFileSync(absSrc, destPath);
      console.log(`✓ Copied asset image: ${targetImageName} -> examples/${projectName}/${targetImageName}`);

      // Try reading PNG / JPEG header dimensions (pure JS)
      try {
        const buffer = fs.readFileSync(destPath);
        if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          // PNG IHDR width & height at offset 16 & 20 (big endian)
          viewportWidth = buffer.readUInt32BE(16);
          viewportHeight = buffer.readUInt32BE(20);
          console.log(`✓ Detected intrinsic image resolution: ${viewportWidth} × ${viewportHeight}`);
        }
      } catch {
        // Fallback to default 4K
      }
    } else {
      console.warn(`⚠️ Source image not found at "${absSrc}". Using placeholder name "${targetImageName}".`);
    }
  }

  // 2. Generate Starter config.json
  const formattedTitle = projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const starterDSL = {
    "$schema": "https://focusflow.io/schema/v1.json",
    "meta": {
      "title": `${formattedTitle} - Architecture Showcase`,
      "viewport": {
        "width": viewportWidth,
        "height": viewportHeight
      },
      "theme": {
        "bg": "#0a0e17",
        "accent": "#38bdf8",
        "warn": "#f472b6",
        "green": "#34d399",
        "amber": "#fbbf24"
      },
      "controls": {
        "autoplay": false,
        "interval": 3800,
        "showPlayBtn": true,
        "showCounter": true,
        "showProgress": true,
        "showHUDButton": true
      }
    },
    "asset": {
      "url": `./${targetImageName}`
    },
    "elements": {
      "boxes": [],
      "paths": [],
      "dots": [],
      "images": []
    },
    "scenes": [
      {
        "id": "scene-1",
        "title": "Overview",
        "camera": {
          "zoom": 1.0,
          "x": 0.0,
          "y": 0.0,
          "duration": 1.0
        },
        "activeElements": {
          "boxes": [],
          "paths": [],
          "dots": [],
          "images": [],
          "callouts": [
            {
              "id": "co-overview",
              "position": {
                "left": "10%",
                "top": "12%"
              },
              "theme": "blue",
              "title": `${formattedTitle} Topology`,
              "desc": "Enterprise architecture overview · Scalable microservices ecosystem"
            }
          ]
        }
      },
      {
        "id": "scene-2",
        "title": "Core Service (Draft)",
        "camera": {
          "zoom": 1.45,
          "x": 0.0,
          "y": 0.0,
          "duration": 1.2
        },
        "activeElements": {
          "boxes": [],
          "paths": [],
          "dots": [],
          "images": [],
          "callouts": []
        }
      },
      {
        "id": "scene-3",
        "title": "Summary",
        "camera": {
          "zoom": 1.0,
          "x": 0.0,
          "y": 0.0,
          "duration": 1.0
        },
        "activeElements": {
          "boxes": [],
          "paths": [],
          "dots": [],
          "images": [],
          "callouts": []
        }
      }
    ]
  };

  const configPath = path.join(targetDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(starterDSL, null, 2), 'utf-8');
  console.log(`✓ Generated config.json: examples/${projectName}/config.json`);

  // 3. Generate index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formattedTitle} - FocusFlow Architecture Showcase</title>
  <link rel="stylesheet" href="../../src/styles/focusflow.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background: #0a0e17;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    #app {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="app"></div>

  <script type="module">
    import { FocusFlowPlayer } from '../../src/index.js';

    fetch('./config.json')
      .then(res => res.json())
      .then(dsl => {
        window.player = new FocusFlowPlayer({
          container: '#app',
          dsl: dsl,
          basePath: './',
          debug: false // 提示：随时在页面按 ⌘+Shift+D (Mac) 或 Ctrl+Shift+D 唤出标定助手
        });
      })
      .catch(err => {
        console.error('[FocusFlow] Failed to load config.json:', err);
      });
  </script>
</body>
</html>`;

  const indexPath = path.join(targetDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`✓ Generated index.html: examples/${projectName}/index.html`);

  // 4. Generate README.md
  const readmeContent = `# ${formattedTitle} - Interactive Showcase

本工程由 FocusFlow 脚手架自动生成。

## 🎬 制作与标定三步流

1. **启动开发服务器**：
   \`\`\`bash
   pnpm dev
   \`\`\`
2. **在浏览器中打开并按快捷键标定**：
   * 浏览器访问当前演示或通过入口切换；
   * 按 **\`⌘+Shift+D\` (Mac)** 或 **\`Ctrl+Shift+D\` (Windows)** 唤出标定助手；
   * 鼠标拉框 / 吸附卡片，一键复制 JSON 粘贴回 \`config.json\`。
3. **一键打包独立单文件 HTML**：
   \`\`\`bash
   node scripts/build-standalone.js examples/${projectName}
   \`\`\`
`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
  console.log(`✓ Generated README.md: examples/${projectName}/README.md`);

  console.log(`
🎉 新项目脚手架生成完毕！
📁 项目目录: examples/${projectName}/

🚀 快速开始:
  1. 运行 pnpm dev
  2. 打开浏览器按 ⌘+Shift+D (Mac) 开启标定助手，抓取选框并粘贴进 config.json
  3. 运行 node scripts/build-standalone.js examples/${projectName} 生成离线单文件！
`);
}

// Parse args
const args = process.argv.slice(2);
createProject(args[0], args[1]);
