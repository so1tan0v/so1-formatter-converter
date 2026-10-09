/**
 * Imports from packages
 */
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';

/**
 * Imports from presentation
 */
import { codeGlanceMinimap } from '@presentation/editors/codeglance';
import type { EditorLanguage } from '@presentation/editors/languages';
import {
  defineMonacoTheme,
  MONACO_THEME_NAME,
} from '@presentation/editors/monaco/define-monaco-theme';
import { registerJson5Language } from '@presentation/editors/monaco/json5-language';
import { useMediaQuery } from '@presentation/hooks/useMediaQuery';
import { useTheme } from '@presentation/theme/useTheme';

interface CodeEditorProps {
  value: string;
  language: EditorLanguage;
  readOnly?: boolean;
  ariaLabel: string;
  onChange?: (value: string) => void;
}

/**
 * Редактор кода на Monaco с подсветкой и темой приложения
 *
 * @param value Текст в редакторе
 * @param language Язык подсветки
 * @param readOnly Признак режима только для чтения
 * @param ariaLabel Подпись редактора для вспомогательных технологий
 * @param onChange Обработчик изменения текста
 */
export function CodeEditor({
  value,
  language,
  readOnly = false,
  ariaLabel,
  onChange,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery('(max-width: 991px), (pointer: coarse)');
  const showCodeGlance = useMediaQuery('(min-width: 992px)');

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    defineMonacoTheme(monacoRef.current, theme);
    monacoRef.current.editor.setTheme(MONACO_THEME_NAME);
  }, [theme]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="code-editor" ref={hostRef}>
      <Editor
        value={value}
        language={language}
        theme={MONACO_THEME_NAME}
        loading={<div className="code-editor__loading">loading editor...</div>}
        onMount={(instance) => {
          editorRef.current = instance;
          instance.layout();
        }}
        onChange={(next) => {
          if (typeof next === 'undefined') {
            return;
          }

          onChange?.(next);
        }}
        beforeMount={(monaco) => {
          monacoRef.current = monaco;
          registerJson5Language(monaco);
          defineMonacoTheme(monaco, theme);
          monaco.editor.setTheme(MONACO_THEME_NAME);
        }}
        options={{
          readOnly,
          ariaLabel,
          fontFamily: theme.tokens.fontMono,
          fontSize: compact ? 16 : 13,
          lineHeight: compact ? 22 : 20,
          minimap: codeGlanceMinimap(showCodeGlance),
          wordWrap: 'on',
          wrappingIndent: 'indent',
          automaticLayout: false,
          scrollBeyondLastLine: false,
          mouseWheelZoom: false,
          contextmenu: !compact,
          folding: !compact,
          lineNumbers: compact ? 'off' : 'on',
          lineDecorationsWidth: compact ? 4 : 8,
          lineNumbersMinChars: compact ? 2 : 3,
          glyphMargin: false,
          renderLineHighlight: readOnly ? 'none' : 'line',
          overviewRulerLanes: compact ? 0 : 2,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          padding: { top: 4, bottom: 4 },
          tabSize: 2,
          fixedOverflowWidgets: true,
          scrollbar: {
            verticalScrollbarSize: compact ? 8 : 10,
            horizontalScrollbarSize: compact ? 8 : 10,
            alwaysConsumeMouseWheel: false,
          },
          quickSuggestions: !readOnly && !compact,
          occurrencesHighlight: 'off',
          renderWhitespace: 'none',
          smoothScrolling: true,
          cursorBlinking: 'blink',
          domReadOnly: readOnly,
        }}
      />
    </div>
  );
}
