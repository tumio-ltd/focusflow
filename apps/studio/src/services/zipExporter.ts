import JSZip from 'jszip';
import type { FocusFlowDSL } from '@focusflow/dsl';
import { compileStandaloneHtml } from './standalonePackager';

/**
 * 纯前端内存中打包并导出标准 FocusFlow 工程 ZIP 归档包
 */
export async function exportProjectZip(
  dsl: FocusFlowDSL, 
  assetBlob?: Blob | null,
  projectName?: string
): Promise<void> {
  const zip = new JSZip();
  const safeTitle = (projectName || dsl.meta?.title || 'focusflow-project')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();

  // 1. 写入 config.json DSL 配置文件
  zip.file('config.json', JSON.stringify(dsl, null, 2));

  // 2. 写入自包含独立演播入口 index.html
  const standaloneHtml = await compileStandaloneHtml(dsl);
  zip.file('index.html', standaloneHtml);

  // 3. 写入原始底图资产
  if (assetBlob) {
    zip.file('assets/architecture.png', assetBlob);
  }

  // 4. 写入工程自述与离线演播指南 README.md
  const readmeContent = `# ${dsl.meta?.title || 'FocusFlow 架构演示项目'}

本项目由 **FocusFlow Studio** (离线自治架构演进演示系统) 自动编译导出。

## 📁 目录结构
- \`index.html\`: 0 依赖纯前端离线演播入口，双击即可在任意现代浏览器中打开体验 60FPS 运镜
- \`config.json\`: 遵循标准 FocusFlow JSON DSL 规范的工程定义文件
- \`assets/\`: 高清底图与图元素材

## 🚀 离线运行
直接双击 \`index.html\` 即可播放；或通过任意静态文件服务器分发：
\`\`\`bash
npx serve .
\`\`\`

---
*FocusFlow Universal Player Engine · 2026*
`;
  zip.file('README.md', readmeContent);

  // 5. 纯前端生成并下载 ZIP
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
