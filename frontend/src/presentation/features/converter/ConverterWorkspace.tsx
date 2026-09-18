/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Imports from app
 */
import { converterRegistry, historyStore } from '@app/composition';

/**
 * Imports from application
 */
import { convertText } from '@application/convert-text';

/**
 * Imports from domain
 */
import type { ConverterId } from '@domain/converter/types';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { HistorySelect } from '@presentation/components/HistorySelect';
import { CodeEditor } from '@presentation/editors/CodeEditor';
import { CONVERT_SAMPLES } from '@presentation/fixtures/samples';
import { useInputHistory } from '@presentation/hooks/useInputHistory';
import { useAppDispatch, useAppSelector } from '@presentation/store/hooks';
import {
  clearResult,
  setError,
  setOutput,
  setSource,
} from '@presentation/store/workspace.slice';
import {
  dispatchTuiCommand,
  TUI_COMMAND_EVENT,
  type TuiCommand,
} from '@presentation/tui/commands';

interface ConverterWorkspaceProps {
  converterId: ConverterId;
}

interface ConverterFormValues {
  source: string;
}

/**
 * Рабочая область конвертера: ввод, преобразование, вывод и история
 *
 * @param converterId Идентификатор активного конвертера
 */
export function ConverterWorkspace({ converterId }: ConverterWorkspaceProps) {
  const dispatch = useAppDispatch();
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<ConverterFormValues>>(null);
  const converter = converterRegistry.get(converterId);
  const sample = CONVERT_SAMPLES[converterId] ?? '';
  const historyScope = `converter:${converterId}` as const;
  const { entries, remember } = useInputHistory(historyScope);

  const initialValues = useMemo<ConverterFormValues>(() => {
    const stored = historyStore.latest(historyScope);

    return { source: stored?.source ?? sample };
  }, [historyScope, sample]);

  useEffect(() => {
    const stored = historyStore.latest(historyScope);

    dispatch(clearResult());
    dispatch(setSource(stored?.source ?? sample));

    if (stored?.output) {
      dispatch(setOutput(stored.output));
    }
  }, [dispatch, historyScope, sample]);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (command === 'convert' || command === 'format') {
        await formikRef.current?.submitForm();

        return;
      }

      if (command === 'sample') {
        await formikRef.current?.setFieldValue('source', sample);
        dispatch(setSource(sample));

        return;
      }

      if (command === 'copy' && output) {
        await navigator.clipboard.writeText(output);
      }
    };

    const onCommand = (event: Event) => {
      void run((event as CustomEvent<TuiCommand>).detail);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        void run('convert');
      }

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
  }, [dispatch, output, sample]);

  if (!converter) {
    return <p className="term-error">Unknown converter.</p>;
  }

  return (
    <Formik
      innerRef={formikRef}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={(values) => {
        dispatch(setSource(values.source));

        const result = convertText(
          converterRegistry,
          converterId,
          values.source,
          {},
        );

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
              hint="Markdown"
              fill
              actions={
                <HistorySelect
                  entries={entries}
                  currentSource={values.source}
                  onSelect={(entry) => {
                    void setFieldValue('source', entry.source);
                    dispatch(setSource(entry.source));

                    if (entry.output) {
                      dispatch(setOutput(entry.output));
                    } else {
                      dispatch(clearResult());
                    }
                  }}
                />
              }
            >
              <CodeEditor
                value={values.source}
                language="markdown"
                ariaLabel="Markdown input"
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
                &quot;Convert&quot;
              </button>
              <span
                className="formatter-workspace__gutter-arrow"
                aria-hidden="true"
              >
                {'->'}
              </span>
            </div>

            <AsciiFrame
              title={error ? 'Error' : 'Output'}
              hint={error ? undefined : 'Jira Markup'}
              fill
              actions={
                <button
                  type="button"
                  className="tui-inline-cmd"
                  disabled={!output || Boolean(error)}
                  onClick={() => dispatchTuiCommand('copy')}
                >
                  &quot;Copy&quot;
                </button>
              }
            >
              <div className="formatter-workspace__output">
                <CodeEditor
                  value={error ?? output}
                  language="plaintext"
                  ariaLabel="Jira markup output"
                  readOnly
                />
                {!output && !error ? (
                  <p className="formatter-workspace__empty">
                    Converted text will appear here after you press Convert.
                  </p>
                ) : null}
              </div>
            </AsciiFrame>
          </div>
        </Form>
      )}
    </Formik>
  );
}
