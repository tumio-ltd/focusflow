import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'FocusFlow',
      formats: ['es', 'iife'],
      fileName: (format) => `focusflow.${format}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'focusflow.css';
          return assetInfo.name || 'asset-[name]';
        },
      },
    },
  },
});
