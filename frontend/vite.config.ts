import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import {
  YANDEX_METRIKA_COUNTER_ID,
  isYandexMetrikaEnabled,
  yandexMetrikaCounterHtml,
} from './src/infrastructure/analytics/yandex-metrika';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Вставляет счётчик Метрики в исходный HTML, если YANDEX_METRIKA_ENABLED включён
 *
 * @param enabled Включён ли счётчик для этой сборки
 */
function yandexMetrikaHtmlPlugin(enabled: boolean): Plugin {
  return {
    name: 'yandex-metrika-html',
    transformIndexHtml(html) {
      const snippet = yandexMetrikaCounterHtml(
        YANDEX_METRIKA_COUNTER_ID,
        enabled,
      );

      if (snippet === '') {
        return html;
      }

      return html.replace('<body>', `<body>\n${snippet}`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, rootDir, 'YANDEX_METRIKA_');
  const enabled = isYandexMetrikaEnabled(
    process.env.YANDEX_METRIKA_ENABLED ?? fileEnv.YANDEX_METRIKA_ENABLED,
  );

  return {
    plugins: [react(), yandexMetrikaHtmlPlugin(enabled)],
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
  };
});
