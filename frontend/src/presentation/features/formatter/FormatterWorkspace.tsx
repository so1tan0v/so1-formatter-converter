/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Imports from app
 */
import { formatterRegistry, historyStore } from '@app/composition';

/**
 * Imports from application
 */
import { formatText } from '@application/format-text';

/**
 * Imports from infrastructure
 */
import { trackAction } from '@infrastructure/analytics/metrics';

/**
 * Imports from domain
 */
import { defaultOptionsFor, type FormatterId } from '@domain/formatter/types';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { FileDownloadButton } from '@presentation/components/FileDownloadButton';
import { FileOpenButton } from '@presentation/components/FileOpenButton';
import { HistorySelect } from '@presentation/components/HistorySelect';
import { CodeEditor } from '@presentation/editors/CodeEditor';
import {
  inputLanguageFor,
  outputLanguageFor,
} from '@presentation/editors/languages';
import { writeDifferDraft } from '@presentation/features/differ/differ-draft';
import { locateError } from '@presentation/features/formatter/error-location';
import { FormatterOptionsFields } from '@presentation/features/formatter/FormatterOptionsFields';
import { formatterHasAdvancedOptions } from '@presentation/features/formatter/formatter-groups';
import {
  optionDefaults,
  toFormatterOptions,
} from '@presentation/features/formatter/formatter-form';
import type { FormatterFormValues } from '@presentation/features/formatter/formatter-form';
import {
  clearFormatterOptions,
  loadFormatterOptions,
  saveFormatterOptions,
} from '@presentation/features/formatter/formatter-options';
import { useFormattedInputSync } from '@presentation/features/formatter/useFormattedInputSync';
import {
  preservedViewerOutput,
  readFormatterHandoff,
  replaceDifferSide,
} from '@presentation/features/transfer/tool-transfer';
import { fileNameFor } from '@presentation/files/text-file';
import { SAMPLE_SOURCES } from '@presentation/fixtures/samples';
import { DebouncedSubmit } from '@presentation/forms/DebouncedSubmit';
import { useInputHistory } from '@presentation/hooks/useInputHistory';
import { useLocale } from '@presentation/i18n/useLocale';
import { usePanelOpen } from '@presentation/hooks/usePanelOpen';
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

interface FormatterWorkspaceProps {
  formatterId: FormatterId;
}

/**
 * Рабочая область форматтера: ввод, настройки, вывод и история
 *
 * @param formatterId Идентификатор активного форматтера
 */
export function FormatterWorkspace({ formatterId }: FormatterWorkspaceProps) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<FormatterFormValues>>(null);
  const rememberNext = useRef(false);
  const outputEdit = useRef(false);
  const [openedName, setOpenedName] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [caretToken, setCaretToken] = useState(0);
  const settings = usePanelOpen('formatter');
  const formatter = formatterRegistry.get(formatterId);
  const handed = useMemo(
    () => readFormatterHandoff(location.state, formatterId),
    [formatterId, location.state],
  );
  const historyScope = `formatter:${formatterId}` as const;
  const { entries, remember } = useInputHistory(historyScope);

  const initialValues = useMemo<FormatterFormValues>(() => {
    const stored = historyStore.latest(historyScope);

    return {
      source: handed?.source ?? stored?.source ?? SAMPLE_SOURCES[formatterId],
      ...loadFormatterOptions(formatterId),
    };
  }, [formatterId, handed, historyScope]);

  useEffect(() => {
    const stored = historyStore.latest(historyScope);

    dispatch(clearResult());
    dispatch(
      setSource(
        handed?.source ?? stored?.source ?? SAMPLE_SOURCES[formatterId],
      ),
    );
    setOpenedName(null);
    setAdvanced(false);

    if (!handed && stored?.output) {
      dispatch(setOutput(stored.output));
    }
  }, [dispatch, formatterId, handed, historyScope]);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (command === 'format') {
        rememberNext.current = true;
        await formikRef.current?.submitForm();

        return;
      }

      if (command === 'sample') {
        const sample = SAMPLE_SOURCES[formatterId];

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
        void run('format');
      }

      if (event.key === 'F3') {
        event.preventDefault();
        void run('sample');
      }

      if (event.key === 'F4') {
        event.preventDefault();
        void run('copy');
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void run('format');
      }
    };

    document.addEventListener(TUI_COMMAND_EVENT, onCommand);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener(TUI_COMMAND_EVENT, onCommand);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dispatch, formatterId, output]);

  const syncFormattedEdit = useFormattedInputSync(
    error ?? output,
    Boolean(error),
    (next) => {
      outputEdit.current = true;
      void formikRef.current?.setFieldValue('source', next);
      dispatch(setSource(next));
      dispatch(setOutput(next));
    },
  );

  if (!formatter) {
    return <p className="term-error">{t('unknownFormatter')}</p>;
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
        saveFormatterOptions(formatterId, values);

        if (!values.source.trim()) {
          dispatch(clearResult());

          return;
        }

        const result = formatText(
          formatterRegistry,
          formatterId,
          values.source,
          toFormatterOptions(formatterId, values),
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
      {({ values, setFieldValue, setValues }) => {
        const errorLine = error ? locateError(error, values.source) : null;

        return (
          <Form className="formatter-workspace">
            <DebouncedSubmit
              signature={JSON.stringify(values)}
              skip={outputEdit}
            />
            <AsciiFrame
              title={t('settings')}
              hint={formatter.label}
              collapsed={!settings.open}
              actions={
                <>
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    aria-expanded={settings.open}
                    onClick={() => settings.setOpen(!settings.open)}
                  >
                    {`"${settings.open ? t('hide') : t('show')}"`}
                  </button>
                  {formatterHasAdvancedOptions(formatterId) ? (
                    <button
                      type="button"
                      className={`tui-inline-cmd ${advanced ? 'is-active' : ''}`.trim()}
                      onClick={() => setAdvanced((current) => !current)}
                    >
                      {`"${t('options')}"`}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="tui-inline-cmd"
                    onClick={() => {
                      clearFormatterOptions(formatterId);
                      setAdvanced(false);
                      void setValues({
                        source: values.source,
                        ...optionDefaults(defaultOptionsFor(formatterId)),
                      });
                    }}
                  >
                    {`"${t('reset')}"`}
                  </button>
                </>
              }
            >
              <div className="tui-options">
                <FormatterOptionsFields
                  formatterId={formatterId}
                  advanced={advanced}
                />
              </div>
            </AsciiFrame>

            <div className="formatter-workspace__panes">
              <AsciiFrame
                title={t('input')}
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
                      fileName={fileNameFor(openedName, 'input', formatterId)}
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
                  language={inputLanguageFor(formatterId)}
                  ariaLabel={t('inputAria', { label: formatter.label })}
                  caret={
                    errorLine && caretToken > 0
                      ? { ...errorLine, token: caretToken }
                      : null
                  }
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
                    trackAction('format');
                  }}
                >
                  {`"${t('format')}"`}
                </button>
                <span
                  className="formatter-workspace__gutter-arrow"
                  aria-hidden="true"
                >
                  {'->'}
                </span>
              </div>

              <AsciiFrame
                title={error ? t('error') : t('formatted')}
                fill
                actions={
                  <>
                    {errorLine ? (
                      <button
                        type="button"
                        className="tui-inline-cmd"
                        onClick={() => setCaretToken(Date.now())}
                      >
                        {t('lineNumber', { line: errorLine.line })}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="tui-inline-cmd"
                      disabled={!output || Boolean(error)}
                      onClick={() => dispatchTuiCommand('copy')}
                    >
                      {`"${t('copy')}"`}
                    </button>
                    <FileDownloadButton
                      fileName={fileNameFor(
                        openedName,
                        'formatted',
                        formatterId,
                      )}
                      text={output}
                      disabled={Boolean(error)}
                    />
                    <button
                      type="button"
                      className="tui-inline-cmd"
                      disabled={!output || Boolean(error)}
                      onClick={() => {
                        const origin = handed?.from;

                        if (origin?.tool === 'differ') {
                          writeDifferDraft(
                            replaceDifferSide(
                              origin.draft,
                              origin.side,
                              output,
                            ),
                          );
                        } else {
                          writeDifferDraft({
                            original: values.source,
                            modified: output,
                            language: formatterId,
                            originalName: openedName ?? `input.${formatterId}`,
                            modifiedName: `formatted.${formatterId}`,
                          });
                        }

                        navigate('/differ');
                      }}
                    >
                      {`"${t('diff')}"`}
                    </button>
                    <button
                      type="button"
                      className="tui-inline-cmd"
                      disabled={!output || Boolean(error)}
                      onClick={() => {
                        const viewerId =
                          handed?.from.tool === 'viewer'
                            ? handed.from.viewerId
                            : 'markdown';
                        const scope = `viewer:${viewerId}` as const;

                        historyStore.remember(scope, {
                          source: output,
                          output: preservedViewerOutput(
                            historyStore.list(scope),
                            output,
                          ),
                        });
                        navigate(`/viewer/${viewerId}`, {
                          state: {
                            viewerHandoff: { viewerId, source: output },
                          },
                        });
                      }}
                    >
                      {`"${t('view')}"`}
                    </button>
                  </>
                }
              >
                <div className="formatter-workspace__output">
                  <CodeEditor
                    value={error ?? output}
                    language={outputLanguageFor(formatterId, Boolean(error))}
                    ariaLabel={t('formattedAria', { label: formatter.label })}
                    readOnly={Boolean(error)}
                    onChange={syncFormattedEdit}
                  />
                  {!output && !error ? (
                    <p className="formatter-workspace__empty">
                      {t('formattingFollows')}
                    </p>
                  ) : null}
                </div>
              </AsciiFrame>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
