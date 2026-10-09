/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Imports from app
 */
import {
  formatterRegistry,
  historyStore,
  viewerRegistry,
} from '@app/composition';

/**
 * Imports from application
 */
import { viewText } from '@application/view-text';

/**
 * Imports from domain
 */
import { FORMATTER_IDS, type FormatterId } from '@domain/formatter/types';
import type { ViewerId } from '@domain/viewer/types';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { FileDownloadButton } from '@presentation/components/FileDownloadButton';
import { FileOpenButton } from '@presentation/components/FileOpenButton';
import { HistorySelect } from '@presentation/components/HistorySelect';
import { CodeEditor } from '@presentation/editors/CodeEditor';
import {
  formatWithSavedOptions,
  readFastFormatterId,
  readViewerHandoff,
  writeFastFormatterId,
} from '@presentation/features/transfer/tool-transfer';
import { fileNameFor } from '@presentation/files/text-file';
import { VIEW_SAMPLES } from '@presentation/fixtures/samples';
import { DebouncedSubmit } from '@presentation/forms/DebouncedSubmit';
import { useInputHistory } from '@presentation/hooks/useInputHistory';
import { useAppDispatch, useAppSelector } from '@presentation/store/hooks';
import {
  clearResult,
  setError,
  setOutput,
  setSource,
} from '@presentation/store/workspace.slice';
import { TUI_COMMAND_EVENT, type TuiCommand } from '@presentation/tui/commands';

interface ViewerWorkspaceProps {
  viewerId: ViewerId;
}

interface ViewerFormValues {
  source: string;
}

/**
 * Рабочая область просмотрщика: исходный текст и предпросмотр
 *
 * @param viewerId Идентификатор активного просмотрщика
 */
export function ViewerWorkspace({ viewerId }: ViewerWorkspaceProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<ViewerFormValues>>(null);
  const rememberNext = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [overlayHost, setOverlayHost] = useState<Element | null>(null);
  const [openedName, setOpenedName] = useState<string | null>(null);
  const [fastFormatterId, setFastFormatterId] = useState(readFastFormatterId);
  const viewer = viewerRegistry.get(viewerId);
  const handedSource = useMemo(
    () => readViewerHandoff(location.state, viewerId),
    [location.state, viewerId],
  );
  const sample = VIEW_SAMPLES[viewerId] ?? '';
  const historyScope = `viewer:${viewerId}` as const;
  const { entries, remember } = useInputHistory(historyScope);

  const initialValues = useMemo<ViewerFormValues>(() => {
    const stored = historyStore.latest(historyScope);

    return { source: handedSource ?? stored?.source ?? sample };
  }, [handedSource, historyScope, sample]);

  const publishPreview = useCallback(
    (source: string) => {
      const result = viewText(viewerRegistry, viewerId, source);

      if (result.ok) {
        dispatch(setOutput(result.value));

        return;
      }

      dispatch(setError(result.error));
    },
    [dispatch, viewerId],
  );

  useEffect(() => {
    const stored = historyStore.latest(historyScope);

    dispatch(clearResult());
    const source = handedSource ?? stored?.source ?? sample;

    dispatch(setSource(source));
    setOpenedName(null);

    if (handedSource === null && stored?.output) {
      publishPreview(stored.source);
    }
  }, [dispatch, handedSource, historyScope, publishPreview, sample]);

  useEffect(() => {
    setOverlayHost(document.querySelector('.term-screen'));
  }, []);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (
        command === 'render' ||
        command === 'format' ||
        command === 'convert'
      ) {
        rememberNext.current = true;
        await formikRef.current?.submitForm();

        return;
      }

      if (command === 'copy' && output && !error) {
        await navigator.clipboard.writeText(output);
      }

      if (command === 'sample') {
        await formikRef.current?.setFieldValue('source', sample);
        dispatch(setSource(sample));
        setOpenedName(null);
      }
    };

    const onCommand = (event: Event) => {
      void run((event as CustomEvent<TuiCommand>).detail);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'F2' ||
        ((event.ctrlKey || event.metaKey) && event.key === 'Enter')
      ) {
        event.preventDefault();
        void run('render');
      }

      if (event.key === 'F3') {
        event.preventDefault();
        void run('sample');
      }

      if (event.key === 'F4') {
        event.preventDefault();
        void run('copy');
      }

      if (event.key === 'Escape' && fullscreen) {
        event.preventDefault();
        setFullscreen(false);
      }
    };

    document.addEventListener(TUI_COMMAND_EVENT, onCommand);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener(TUI_COMMAND_EVENT, onCommand);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dispatch, error, output, sample, fullscreen]);

  if (!viewer) {
    return <p className="term-error">Unknown viewer.</p>;
  }

  return (
    <Formik
      innerRef={formikRef}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={(values) => {
        const shouldRemember = rememberNext.current;

        rememberNext.current = false;
        dispatch(setSource(values.source));

        if (!values.source.trim()) {
          dispatch(clearResult());

          return;
        }

        const result = viewText(viewerRegistry, viewerId, values.source);

        if (result.ok) {
          dispatch(setOutput(result.value));

          if (shouldRemember) {
            remember(values.source, result.value);
          }

          return;
        }

        dispatch(setError(result.error));
      }}
    >
      {({ values, setFieldValue }) => (
        <Form className="formatter-workspace">
          <DebouncedSubmit signature={values.source} />
          <div className="formatter-workspace__panes">
            <AsciiFrame
              title="Input"
              hint={viewer.sourceLabel}
              fill
              actions={
                <>
                  <FileOpenButton
                    onLoad={(text, fileName) => {
                      rememberNext.current = true;
                      void setFieldValue('source', text);
                      dispatch(setSource(text));
                      dispatch(clearResult());
                      setOpenedName(fileName);
                    }}
                  />
                  <FileDownloadButton
                    fileName={fileNameFor(
                      openedName,
                      'input',
                      viewerSourceExtension(viewerId),
                    )}
                    text={values.source}
                  />
                  <select
                    id="viewer-formatter"
                    className="tui-select tui-select--formatter"
                    aria-label="Formatter"
                    value={fastFormatterId}
                    onChange={(event) => {
                      const next = event.target.value;

                      if (!FORMATTER_IDS.some((id) => id === next)) {
                        return;
                      }

                      const formatterId = next as FormatterId;

                      setFastFormatterId(formatterId);
                      writeFastFormatterId(formatterId);
                    }}
                  >
                    {FORMATTER_IDS.map((id) => (
                      <option key={id} value={id}>
                        {id.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    disabled={!values.source.trim()}
                    onClick={() => {
                      const result = formatWithSavedOptions(
                        formatterRegistry,
                        fastFormatterId,
                        values.source,
                      );

                      if (!result.ok) {
                        dispatch(setError(result.error));

                        return;
                      }

                      void setFieldValue('source', result.value);
                      dispatch(setSource(result.value));
                      dispatch(clearResult());
                    }}
                  >
                    &quot;Fast&quot;
                  </button>
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    disabled={!values.source.trim()}
                    onClick={() => {
                      navigate(`/formatter/${fastFormatterId}`, {
                        state: {
                          formatterHandoff: {
                            formatterId: fastFormatterId,
                            source: values.source,
                            from: { tool: 'viewer', viewerId },
                          },
                        },
                      });
                    }}
                  >
                    &quot;Formatter&quot;
                  </button>
                  <HistorySelect
                    entries={entries}
                    currentSource={values.source}
                    onSelect={(entry) => {
                      void setFieldValue('source', entry.source);
                      dispatch(setSource(entry.source));
                      setOpenedName(null);

                      if (entry.output) {
                        publishPreview(entry.source);
                      } else {
                        dispatch(clearResult());
                      }
                    }}
                  />
                </>
              }
            >
              <CodeEditor
                value={values.source}
                language={viewer.editorLanguage}
                ariaLabel={`${viewer.label} input`}
                onChange={(next) => {
                  void setFieldValue('source', next);
                  dispatch(setSource(next));
                }}
              />
            </AsciiFrame>

            <div className="formatter-workspace__gutter">
              <button
                type="submit"
                className="tui-inline-cmd tui-inline-cmd--block"
                onClick={() => {
                  rememberNext.current = true;
                }}
              >
                &quot;Render&quot;
              </button>
              <span
                className="formatter-workspace__gutter-arrow"
                aria-hidden="true"
              >
                {'->'}
              </span>
            </div>

            <AsciiFrame
              title={error ? 'Error' : 'Preview'}
              hint={error ? undefined : viewer.label}
              fill
              actions={
                <>
                  <FileDownloadButton
                    fileName={fileNameFor(openedName, 'preview', 'html')}
                    text={output}
                    disabled={Boolean(error)}
                  />
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    disabled={!output || Boolean(error)}
                    onClick={() => setFullscreen(true)}
                  >
                    &quot;Fullscreen&quot;
                  </button>
                </>
              }
            >
              <div className="formatter-workspace__output">
                {error ? (
                  <p className="term-error" role="alert">
                    {error}
                  </p>
                ) : output ? (
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                ) : (
                  <p className="formatter-workspace__empty">
                    Preview will appear here after you press Render.
                  </p>
                )}
              </div>
            </AsciiFrame>
          </div>
          {fullscreen && output && overlayHost
            ? createPortal(
                <div
                  className="markdown-preview-fullscreen"
                  role="dialog"
                  aria-label="Markdown preview"
                >
                  <header className="markdown-preview-fullscreen__bar">
                    <span className="markdown-preview-fullscreen__title">
                      Preview — {viewer.label}
                    </span>
                    <button
                      type="button"
                      className="tui-inline-cmd"
                      onClick={() => setFullscreen(false)}
                    >
                      &quot;Exit&quot;
                    </button>
                  </header>
                  <div
                    className="markdown-preview markdown-preview--expanded"
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                </div>,
                overlayHost,
              )
            : null}
        </Form>
      )}
    </Formik>
  );
}

function viewerSourceExtension(viewerId: ViewerId): string {
  return viewerId === 'markdown' ? 'md' : 'jira';
}
