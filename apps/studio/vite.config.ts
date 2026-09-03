import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(import.meta.dirname, './src') },
      { find: /^@focusflow\/player$/, replacement: resolve(import.meta.dirname, '../../packages/player/src/index.js') },
    ],
  },
  server: {
    port: 5174,
  },
});
