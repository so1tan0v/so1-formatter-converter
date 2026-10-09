/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
import type { ConverterFormat, ConverterId } from '@domain/converter/types';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { FileDownloadButton } from '@presentation/components/FileDownloadButton';
import { FileOpenButton } from '@presentation/components/FileOpenButton';
import { HistorySelect } from '@presentation/components/HistorySelect';
import { CodeEditor } from '@presentation/editors/CodeEditor';
import { languageForFormat } from '@presentation/editors/languages';
import {
  oppositeConverter,
  readConverterHandoff,
} from '@presentation/features/converter/pairs';
import { fileNameFor } from '@presentation/files/text-file';
import { CONVERT_SAMPLES } from '@presentation/fixtures/samples';
import { DebouncedSubmit } from '@presentation/forms/DebouncedSubmit';
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
  const navigate = useNavigate();
  const location = useLocation();
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<ConverterFormValues>>(null);
  const rememberNext = useRef(false);
  const [openedName, setOpenedName] = useState<string | null>(null);
  const converter = converterRegistry.get(converterId);
  const sample = CONVERT_SAMPLES[converterId] ?? '';
  const historyScope = `converter:${converterId}` as const;
  const { entries, remember } = useInputHistory(historyScope);
  const handed = readConverterHandoff(location.state, converterId);

  const initialValues = useMemo<ConverterFormValues>(() => {
    if (handed !== null) {
      return { source: handed };
    }

    const stored = historyStore.latest(historyScope);

    return { source: stored?.source ?? sample };
  }, [handed, historyScope, sample]);

  useEffect(() => {
    const stored = historyStore.latest(historyScope);
    const source = handed ?? stored?.source ?? sample;

    dispatch(clearResult());
    dispatch(setSource(source));
    setOpenedName(null);

    if (handed === null && stored?.output) {
      dispatch(setOutput(stored.output));
    }
  }, [dispatch, handed, historyScope, sample]);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (command === 'convert' || command === 'format') {
        rememberNext.current = true;
        await formikRef.current?.submitForm();

        return;
      }

      if (command === 'sample') {
        await formikRef.current?.setFieldValue('source', sample);
        dispatch(setSource(sample));
        setOpenedName(null);

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

  const inputLanguage = languageForFormat(converter.sourceFormat, 'input');
  const outputLanguage = error
    ? 'plaintext'
    : languageForFormat(converter.targetFormat, 'output');

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

        const result = convertText(
          converterRegistry,
          converterId,
          values.source,
          {},
        );

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
              hint={converter.sourceLabel}
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
                      extensionFor(converter.sourceFormat),
                    )}
                    text={values.source}
                  />
                  <HistorySelect
                    entries={entries}
                    currentSource={values.source}
                    onSelect={(entry) => {
                      void setFieldValue('source', entry.source);
                      dispatch(setSource(entry.source));
                      setOpenedName(null);

                      if (entry.output) {
                        dispatch(setOutput(entry.output));
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
                language={inputLanguage}
                ariaLabel={`${converter.sourceLabel} input`}
                onChange={(next) => {
                  void setFieldValue('source', next);
                  dispatch(setSource(next));
                }}
              />
            </AsciiFrame>

            <div className="formatter-workspace__gutter">
              <button
                type="button"
                className="tui-inline-cmd tui-inline-cmd--block"
                onClick={() => {
                  const next = oppositeConverter(converterId);

                  if (!next) {
                    return;
                  }

                  navigate(
                    { pathname: `/converter/${next}`, search: location.search },
                    {
                      state: {
                        converterId: next,
                        source: output && !error ? output : values.source,
                      },
                    },
                  );
                }}
              >
                &quot;Swap&quot;
              </button>
              <button
                type="submit"
                className="tui-inline-cmd tui-inline-cmd--block"
                onClick={() => {
                  rememberNext.current = true;
                }}
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
              hint={error ? undefined : converter.targetLabel}
              fill
              actions={
                <>
                  <FileDownloadButton
                    fileName={fileNameFor(
                      openedName,
                      'output',
                      extensionFor(converter.targetFormat),
                    )}
                    text={output}
                    disabled={Boolean(error)}
                  />
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    disabled={!output || Boolean(error)}
                    onClick={() => dispatchTuiCommand('copy')}
                  >
                    &quot;Copy&quot;
                  </button>
                </>
              }
            >
              <div className="formatter-workspace__output">
                <CodeEditor
                  value={error ?? output}
                  language={outputLanguage}
                  ariaLabel={`${converter.targetLabel} output`}
                  readOnly
                />
                {!output && !error ? (
                  <p className="formatter-workspace__empty">
                    Conversion follows the text.
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

function extensionFor(format: ConverterFormat): string {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'plaintext':
      return 'txt';
    default:
      return format;
  }
}
