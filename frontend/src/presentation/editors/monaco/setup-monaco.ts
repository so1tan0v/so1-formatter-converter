/**
 * Imports from packages
 */
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

/**
 * Настраивает загрузчик Monaco и web-workers редактора
 */
export function setupMonaco(): void {
  const monacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'json') {
        return new jsonWorker();
      }

      return new editorWorker();
    },
  };

  Object.assign(globalThis, { MonacoEnvironment: monacoEnvironment });
  loader.config({ monaco });
}
