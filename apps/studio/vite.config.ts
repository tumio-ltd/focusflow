import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(import.meta.dirname, './src') },
      { find: /^@focusflow\/player$/, replacement: resolve(import.meta.dirname, '../../packages/player/src/index.js') },
    ],
  },
  server: {
    port: 5174,
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://*.feishu.cn https://*.notion.so https://*.yuque.com http://localhost:* http://127.0.0.1:*",
    },
  },
  preview: {
    port: 5174,
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://*.feishu.cn https://*.notion.so https://*.yuque.com http://localhost:* http://127.0.0.1:*",
    },
  },
});
