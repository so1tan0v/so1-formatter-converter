/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Imports from app
 */
import { historyStore, viewerRegistry } from '@app/composition';

/**
 * Imports from application
 */
import { viewText } from '@application/view-text';

/**
 * Imports from domain
 */
import type { ViewerId } from '@domain/viewer/types';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { HistorySelect } from '@presentation/components/HistorySelect';
import { CodeEditor } from '@presentation/editors/CodeEditor';
import { VIEW_SAMPLES } from '@presentation/fixtures/samples';
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
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<ViewerFormValues>>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [overlayHost, setOverlayHost] = useState<Element | null>(null);
  const viewer = viewerRegistry.get(viewerId);
  const sample = VIEW_SAMPLES[viewerId] ?? '';
  const historyScope = `viewer:${viewerId}` as const;
  const { entries, remember } = useInputHistory(historyScope);

  const initialValues = useMemo<ViewerFormValues>(() => {
    const stored = historyStore.latest(historyScope);

    return { source: stored?.source ?? sample };
  }, [historyScope, sample]);

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
    dispatch(setSource(stored?.source ?? sample));

    if (stored?.output) {
      publishPreview(stored.source);
    }
  }, [dispatch, historyScope, publishPreview, sample]);

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
        await formikRef.current?.submitForm();

        return;
      }

      if (command === 'sample') {
        await formikRef.current?.setFieldValue('source', sample);
        dispatch(setSource(sample));
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
  }, [dispatch, sample, fullscreen]);

  if (!viewer) {
    return <p className="term-error">Unknown viewer.</p>;
  }

  return (
    <Formik
      innerRef={formikRef}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={(values) => {
        dispatch(setSource(values.source));

        const result = viewText(viewerRegistry, viewerId, values.source);

        if (result.ok) {
          dispatch(setOutput(result.value));
          remember(values.source, result.value);

          return;
        }

        dispatch(setError(result.error));
      }}
    >
      {({ values, setFieldValue }) => (
        <Form className="formatter-workspace">
          <div className="formatter-workspace__panes">
            <AsciiFrame
              title="Input"
              hint={viewer.sourceLabel}
              fill
              actions={
                <HistorySelect
                  entries={entries}
                  currentSource={values.source}
                  onSelect={(entry) => {
                    void setFieldValue('source', entry.source);
                    dispatch(setSource(entry.source));

                    if (entry.output) {
                      publishPreview(entry.source);
                    } else {
                      dispatch(clearResult());
                    }
                  }}
                />
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
                <button
                  type="button"
                  className="tui-inline-cmd"
                  disabled={!output || Boolean(error)}
                  onClick={() => setFullscreen(true)}
                >
                  &quot;Fullscreen&quot;
                </button>
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
