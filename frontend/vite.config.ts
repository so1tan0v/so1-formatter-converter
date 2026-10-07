import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { yandexMetrikaCounterHtml } from './src/infrastructure/analytics/yandex-metrika';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Вставляет счётчик Метрики в исходный HTML, чтобы номер жил в одном модуле
 */
function yandexMetrikaHtmlPlugin(): Plugin {
  return {
    name: 'yandex-metrika-html',
    transformIndexHtml(html) {
      const snippet = yandexMetrikaCounterHtml();

      return html.replace('<body>', `<body>\n${snippet}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), yandexMetrikaHtmlPlugin()],
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
