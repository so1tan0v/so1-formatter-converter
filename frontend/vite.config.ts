import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor', '@monaco-editor/react'],
  },
  resolve: {
    alias: {
      '@app': path.resolve(rootDir, 'src/app'),
      '@application': path.resolve(rootDir, 'src/application'),
      '@domain': path.resolve(rootDir, 'src/domain'),
      '@infrastructure': path.resolve(rootDir, 'src/infrastructure'),
      '@presentation': path.resolve(rootDir, 'src/presentation'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
