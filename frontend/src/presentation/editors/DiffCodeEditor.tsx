/**
 * Imports from packages
 */
import { useMonaco, type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

/**
 * Imports from presentation
 */
import { codeGlanceMinimap } from '@presentation/editors/codeglance';
import {
  defineMonacoTheme,
  MONACO_THEME_NAME,
} from '@presentation/editors/monaco/define-monaco-theme';
import { registerJson5Language } from '@presentation/editors/monaco/json5-language';
import { useMediaQuery } from '@presentation/hooks/useMediaQuery';
import { useTheme } from '@presentation/theme/useTheme';

export type DiffSide = 'original' | 'modified';

interface DiffCodeEditorProps {
  original: string;
  modified: string;
  language: string;
  ignoreTrimWhitespace: boolean;
  hideUnchangedRegions: boolean;
  onOriginalChange: (value: string) => void;
  onModifiedChange: (value: string) => void;
  onDropFiles: (files: File[], side: DiffSide) => void;
}

/**
 * Двухпанельное сравнение Monaco. Прокрутка сторон связана так же,
 * как в JetBrains: пустые зоны выравнивают строки, и scroll одной
 * панели двигает другую
 *
 * @param original Исходный текст
 * @param modified Текст, с которым сравниваем
 * @param language Язык подсветки обеих сторон
 * @param ignoreTrimWhitespace Не учитывать пробелы по краям строк
 * @param hideUnchangedRegions Сворачивать длинные неизменённые куски
 * @param onOriginalChange Правка левой стороны
 * @param onModifiedChange Правка правой стороны
 * @param onDropFiles Файлы, брошенные на одну из сторон
 */
export function DiffCodeEditor({
  original,
  modified,
  language,
  ignoreTrimWhitespace,
  hideUnchangedRegions,
  onOriginalChange,
  onModifiedChange,
  onDropFiles,
}: DiffCodeEditorProps) {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const hostRef = useRef<HTMLDivElement>(null);
  const diffRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const originalRef = useRef(original);
  const modifiedRef = useRef(modified);
  const languageRef = useRef(language);
  const themeRef = useRef(theme);
  const onOriginalChangeRef = useRef(onOriginalChange);
  const onModifiedChangeRef = useRef(onModifiedChange);
  const onDropFilesRef = useRef(onDropFiles);
  const ignoreWhitespaceRef = useRef(ignoreTrimWhitespace);
  const hideUnchangedRef = useRef(hideUnchangedRegions);
  const [dropping, setDropping] = useState(false);
  const [ready, setReady] = useState(false);
  const compact = useMediaQuery('(max-width: 991px), (pointer: coarse)');
  const showCodeGlance = useMediaQuery('(min-width: 992px)');
  const compactRef = useRef(compact);
  const showCodeGlanceRef = useRef(showCodeGlance);

  originalRef.current = original;
  modifiedRef.current = modified;
  languageRef.current = language;
  themeRef.current = theme;
  onOriginalChangeRef.current = onOriginalChange;
  onModifiedChangeRef.current = onModifiedChange;
  onDropFilesRef.current = onDropFiles;
  ignoreWhitespaceRef.current = ignoreTrimWhitespace;
  hideUnchangedRef.current = hideUnchangedRegions;
  compactRef.current = compact;
  showCodeGlanceRef.current = showCodeGlance;

  useEffect(() => {
    if (!monaco || !hostRef.current) {
      return;
    }

    defineMonacoTheme(monaco, themeRef.current);
    registerJson5Language(monaco);
    monaco.editor.setTheme(MONACO_THEME_NAME);

    const diff = monaco.editor.createDiffEditor(hostRef.current, {
      ...diffOptions(
        compactRef.current,
        showCodeGlanceRef.current,
        themeRef.current.tokens.fontMono,
        ignoreWhitespaceRef.current,
        hideUnchangedRef.current,
      ),
      theme: MONACO_THEME_NAME,
    });
    const originalModel = monaco.editor.createModel(
      originalRef.current,
      languageRef.current,
    );
    const modifiedModel = monaco.editor.createModel(
      modifiedRef.current,
      languageRef.current,
    );

    originalModel.updateOptions({ tabSize: 2 });
    modifiedModel.updateOptions({ tabSize: 2 });
    diff.setModel({ original: originalModel, modified: modifiedModel });
    diffRef.current = diff;
    monacoRef.current = monaco;

    const originalEditor = diff.getOriginalEditor();
    const modifiedEditor = diff.getModifiedEditor();
    const originalSub = originalEditor.onDidChangeModelContent(() => {
      onOriginalChangeRef.current(originalEditor.getValue());
    });
    const modifiedSub = modifiedEditor.onDidChangeModelContent(() => {
      onModifiedChangeRef.current(modifiedEditor.getValue());
    });

    const frame = window.requestAnimationFrame(() => {
      diff.layout();
    });

    setReady(true);

    return () => {
      window.cancelAnimationFrame(frame);
      setReady(false);
      originalSub.dispose();
      modifiedSub.dispose();
      diff.dispose();
      originalModel.dispose();
      modifiedModel.dispose();
      diffRef.current = null;
    };
  }, [monaco]);

  useEffect(() => {
    const instance = monacoRef.current;

    if (!instance) {
      return;
    }

    defineMonacoTheme(instance, theme);
    instance.editor.setTheme(MONACO_THEME_NAME);
  }, [theme]);

  useEffect(() => {
    const model = diffRef.current?.getModel()?.original;

    if (!model || model.getValue() === original) {
      return;
    }

    model.setValue(original);
  }, [original]);

  useEffect(() => {
    const model = diffRef.current?.getModel()?.modified;

    if (!model || model.getValue() === modified) {
      return;
    }

    model.setValue(modified);
  }, [modified]);

  useEffect(() => {
    const instance = monacoRef.current;
    const model = diffRef.current?.getModel();

    if (!instance || !model) {
      return;
    }

    instance.editor.setModelLanguage(model.original, language);
    instance.editor.setModelLanguage(model.modified, language);
  }, [language]);

  useEffect(() => {
    diffRef.current?.updateOptions(
      diffOptions(
        compact,
        showCodeGlance,
        theme.tokens.fontMono,
        ignoreTrimWhitespace,
        hideUnchangedRegions,
      ),
    );
  }, [
    compact,
    hideUnchangedRegions,
    ignoreTrimWhitespace,
    showCodeGlance,
    theme.tokens.fontMono,
  ]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const observer = new ResizeObserver(() => {
      diffRef.current?.layout();
    });

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`diff-editor ${dropping ? 'is-dropping' : ''}`.trim()}
      onDragEnter={(event) => {
        if (!hasFiles(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        setDropping(true);
      }}
      onDragOver={(event) => {
        if (!hasFiles(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setDropping(true);
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;

        if (next instanceof Node && event.currentTarget.contains(next)) {
          return;
        }

        setDropping(false);
      }}
      onDrop={(event) => {
        if (!hasFiles(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        setDropping(false);
        const files = [...event.dataTransfer.files];

        onDropFilesRef.current(files, sideFromPoint(diffRef.current, event));
      }}
    >
      <div className="diff-editor__host" ref={hostRef} />
      {ready ? null : (
        <div className="code-editor__loading">loading editor...</div>
      )}
    </div>
  );
}

function hasFiles(transfer: DataTransfer | null): transfer is DataTransfer {
  return Boolean(transfer?.types.includes('Files'));
}

function sideFromPoint(
  diff: editor.IStandaloneDiffEditor | null,
  event: { clientX: number; currentTarget: EventTarget },
): DiffSide {
  const originalNode = diff?.getOriginalEditor().getDomNode();

  if (originalNode) {
    return event.clientX <= originalNode.getBoundingClientRect().right
      ? 'original'
      : 'modified';
  }

  if (!(event.currentTarget instanceof HTMLElement)) {
    return 'original';
  }

  const bounds = event.currentTarget.getBoundingClientRect();

  return event.clientX < bounds.left + bounds.width / 2
    ? 'original'
    : 'modified';
}

function diffOptions(
  compact: boolean,
  showCodeGlance: boolean,
  fontFamily: string,
  ignoreTrimWhitespace: boolean,
  hideUnchangedRegions: boolean,
): editor.IDiffEditorConstructionOptions {
  return {
    renderSideBySide: true,
    useInlineViewWhenSpaceIsLimited: false,
    enableSplitViewResizing: true,
    splitViewDefaultRatio: 0.5,
    originalEditable: true,
    readOnly: false,
    renderIndicators: true,
    renderMarginRevertIcon: true,
    renderOverviewRuler: true,
    ignoreTrimWhitespace,
    diffAlgorithm: 'advanced',
    diffWordWrap: 'off',
    hideUnchangedRegions: {
      enabled: hideUnchangedRegions,
      contextLineCount: 3,
      minimumLineCount: 3,
      revealLineCount: 20,
    },
    experimental: {
      showMoves: true,
    },
    originalAriaLabel: 'Original text',
    modifiedAriaLabel: 'Modified text',
    fontFamily,
    fontSize: compact ? 16 : 13,
    lineHeight: compact ? 22 : 20,
    minimap: codeGlanceMinimap(showCodeGlance),
    wordWrap: 'off',
    automaticLayout: false,
    scrollBeyondLastLine: false,
    mouseWheelZoom: false,
    contextmenu: !compact,
    folding: !compact,
    lineNumbers: compact ? 'off' : 'on',
    lineDecorationsWidth: compact ? 4 : 8,
    lineNumbersMinChars: compact ? 2 : 3,
    glyphMargin: true,
    renderLineHighlight: 'line',
    overviewRulerLanes: 3,
    overviewRulerBorder: false,
    padding: { top: 4, bottom: 4 },
    fixedOverflowWidgets: true,
    scrollbar: {
      verticalScrollbarSize: compact ? 8 : 10,
      horizontalScrollbarSize: compact ? 8 : 10,
      alwaysConsumeMouseWheel: false,
    },
    smoothScrolling: true,
    cursorBlinking: 'blink',
  };
}
