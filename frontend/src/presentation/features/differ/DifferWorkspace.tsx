/**
 * Imports from packages
 */
import { useEffect, useState } from 'react';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { useAppDispatch } from '@presentation/store/hooks';
import { setSource } from '@presentation/store/workspace.slice';
import { FileDownloadButton } from '@presentation/components/FileDownloadButton';
import { FileOpenButton } from '@presentation/components/FileOpenButton';
import { DiffCodeEditor } from '@presentation/editors/DiffCodeEditor';
import type { DiffSide } from '@presentation/editors/DiffCodeEditor';
import {
  DIFFER_SAMPLE_MODIFIED,
  DIFFER_SAMPLE_ORIGINAL,
} from '@presentation/fixtures/samples';
import { TUI_COMMAND_EVENT, type TuiCommand } from '@presentation/tui/commands';

/**
 * Imports from relative
 */
import { DIFFER_DRAFT_KEY, parseDifferDraft } from './differ-draft';
import type { DifferDraft } from './differ-draft';
import {
  DIFFER_LANGUAGE_LABELS,
  DIFFER_LANGUAGES,
  languageFromFileName,
} from './languages';
import type { DifferLanguage } from './languages';

const SAMPLE_DRAFT: DifferDraft = {
  original: DIFFER_SAMPLE_ORIGINAL,
  modified: DIFFER_SAMPLE_MODIFIED,
  language: 'json',
  originalName: 'original.json',
  modifiedName: 'modified.json',
};

/**
 * Сравнение двух текстов или файлов бок о бок
 */
export function DifferWorkspace() {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<DifferDraft>(readDraft);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [collapseUnchanged, setCollapseUnchanged] = useState(false);

  useEffect(() => {
    dispatch(setSource(draft.original));
  }, [dispatch, draft.original]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DIFFER_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        return;
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (command === 'sample') {
        setDraft(SAMPLE_DRAFT);

        return;
      }

      if (command === 'copy' && draft.modified) {
        await navigator.clipboard.writeText(draft.modified);
      }
    };

    const onCommand = (event: Event) => {
      void run((event as CustomEvent<TuiCommand>).detail);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F3') {
        event.preventDefault();
        void run('sample');
      }

      if (event.key === 'F4') {
        event.preventDefault();
        void run('copy');
      }
    };

    document.addEventListener(TUI_COMMAND_EVENT, onCommand);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener(TUI_COMMAND_EVENT, onCommand);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [draft.modified]);

  const applyLoaded = (loaded: LoadedFile[], side: DiffSide) => {
    const [first, second] = loaded;

    if (!first) {
      return;
    }

    if (second) {
      setDraft((current) => ({
        ...current,
        original: first.text,
        originalName: first.name,
        modified: second.text,
        modifiedName: second.name,
        language: second.language ?? first.language ?? current.language,
      }));

      return;
    }

    setDraft((current) =>
      side === 'original'
        ? {
            ...current,
            original: first.text,
            originalName: first.name,
            language: first.language ?? current.language,
          }
        : {
            ...current,
            modified: first.text,
            modifiedName: first.name,
            language: first.language ?? current.language,
          },
    );
  };

  return (
    <div className="differ-workspace">
      <AsciiFrame title="Settings" hint="side by side">
        <div className="tui-fields">
          <label className="tui-field" htmlFor="differ-language">
            <span className="tui-field__name">Language</span>
            <select
              id="differ-language"
              className="tui-select"
              value={draft.language}
              onChange={(event) => {
                const next = event.target.value;

                if (!DIFFER_LANGUAGES.some((language) => language === next)) {
                  return;
                }

                setDraft((current) => ({
                  ...current,
                  language: next as DifferLanguage,
                }));
              }}
            >
              {DIFFER_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {DIFFER_LANGUAGE_LABELS[language]}
                </option>
              ))}
            </select>
          </label>
          <label className="tui-check">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(event) => setIgnoreWhitespace(event.target.checked)}
            />
            Ignore whitespace
          </label>
          <label className="tui-check">
            <input
              type="checkbox"
              checked={collapseUnchanged}
              onChange={(event) => setCollapseUnchanged(event.target.checked)}
            />
            Collapse unchanged
          </label>
          <button
            type="button"
            className="tui-inline-cmd"
            onClick={() => {
              setDraft((current) => ({
                ...current,
                original: current.modified,
                modified: current.original,
                originalName: current.modifiedName,
                modifiedName: current.originalName,
              }));
            }}
          >
            &quot;Swap&quot;
          </button>
        </div>
      </AsciiFrame>

      <AsciiFrame title="Diff" fill>
        <div className="differ-sides">
          <div className="differ-side">
            <span className="differ-side__role">Original</span>
            <span className="differ-side__name" title={draft.originalName}>
              {draft.originalName}
            </span>
            <FileOpenButton
              onLoad={(text, fileName) => {
                applyLoaded(
                  [
                    {
                      name: fileName,
                      text,
                      language: languageFromFileName(fileName),
                    },
                  ],
                  'original',
                );
              }}
            />
            <FileDownloadButton
              fileName={draft.originalName}
              text={draft.original}
            />
          </div>
          <div className="differ-side">
            <span className="differ-side__role">Modified</span>
            <span className="differ-side__name" title={draft.modifiedName}>
              {draft.modifiedName}
            </span>
            <FileOpenButton
              onLoad={(text, fileName) => {
                applyLoaded(
                  [
                    {
                      name: fileName,
                      text,
                      language: languageFromFileName(fileName),
                    },
                  ],
                  'modified',
                );
              }}
            />
            <FileDownloadButton
              fileName={draft.modifiedName}
              text={draft.modified}
            />
          </div>
        </div>
        <DiffCodeEditor
          original={draft.original}
          modified={draft.modified}
          language={draft.language}
          ignoreTrimWhitespace={ignoreWhitespace}
          hideUnchangedRegions={collapseUnchanged}
          onOriginalChange={(original) => {
            setDraft((current) =>
              current.original === original
                ? current
                : { ...current, original },
            );
          }}
          onModifiedChange={(modified) => {
            setDraft((current) =>
              current.modified === modified
                ? current
                : { ...current, modified },
            );
          }}
          onDropFiles={(files, side) => {
            void loadFiles(files).then((loaded) => {
              applyLoaded(loaded, side);
            });
          }}
        />
      </AsciiFrame>
    </div>
  );
}

interface LoadedFile {
  name: string;
  text: string;
  language: DifferLanguage | null;
}

function readDraft(): DifferDraft {
  try {
    return (
      parseDifferDraft(window.localStorage.getItem(DIFFER_DRAFT_KEY)) ??
      SAMPLE_DRAFT
    );
  } catch {
    return SAMPLE_DRAFT;
  }
}

async function loadFiles(files: File[]): Promise<LoadedFile[]> {
  return Promise.all(
    files.slice(0, 2).map(async (file) => ({
      name: file.name,
      text: await file.text(),
      language: languageFromFileName(file.name),
    })),
  );
}
