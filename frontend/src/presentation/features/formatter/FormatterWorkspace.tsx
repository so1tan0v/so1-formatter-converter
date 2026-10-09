/**
 * Imports from packages
 */
import { Form, Formik, type FormikProps } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Imports from app
 */
import { formatterRegistry, historyStore } from '@app/composition';

/**
 * Imports from application
 */
import { formatText } from '@application/format-text';

/**
 * Imports from domain
 */
import {
  DEFAULT_HTML_OPTIONS,
  defaultOptionsFor,
  type FormatterId,
  type FormatterOptionsMap,
  type HtmlScriptIndent,
  type HtmlTemplating,
  type HtmlWrapAttributes,
  type JsonKeyCase,
  type OutputMode,
  type SqlKeywordCase,
  type YamlNullStyle,
  type YamlQuoting,
} from '@domain/formatter/types';
import type { IndentStyle } from '@domain/shared/indent';

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
import { FormatterOptionsFields } from '@presentation/features/formatter/FormatterOptionsFields';
import { useFormattedInputSync } from '@presentation/features/formatter/useFormattedInputSync';
import { fileNameFor } from '@presentation/files/text-file';
import { SAMPLE_SOURCES } from '@presentation/fixtures/samples';
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

interface FormatterWorkspaceProps {
  formatterId: FormatterId;
}

interface FormatterFormValues {
  source: string;
  indent: IndentStyle;
  mode: OutputMode;
  keyCase: JsonKeyCase;
  sortKeys: boolean;
  dropNulls: boolean;
  escapeUnicode: boolean;
  trailingNewline: boolean;
  quoting: YamlQuoting;
  forceQuotes: boolean;
  documentStart: boolean;
  documentEnd: boolean;
  lineWidth: number;
  nullStyle: YamlNullStyle;
  keywordCase: SqlKeywordCase;
  wrapAttributes: HtmlWrapAttributes;
  wrapAttributesMin: number;
  wrapLineLength: number;
  indentInnerHtml: boolean;
  indentHead: boolean;
  indentBody: boolean;
  preserveNewlines: boolean;
  maxPreserveNewlines: number;
  endWithNewline: boolean;
  indentScripts: HtmlScriptIndent;
  extraLiners: boolean;
  indentHandlebars: boolean;
  inlineCustomElements: boolean;
  templating: HtmlTemplating;
  formatPre: boolean;
}

/**
 * Рабочая область форматтера: ввод, настройки, вывод и история
 *
 * @param formatterId Идентификатор активного форматтера
 */
export function FormatterWorkspace({ formatterId }: FormatterWorkspaceProps) {
  const dispatch = useAppDispatch();
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const formikRef = useRef<FormikProps<FormatterFormValues>>(null);
  const [openedName, setOpenedName] = useState<string | null>(null);
  const formatter = formatterRegistry.get(formatterId);
  const historyScope = `formatter:${formatterId}` as const;
  const { entries, remember } = useInputHistory(historyScope);

  const initialValues = useMemo<FormatterFormValues>(() => {
    const stored = historyStore.latest(historyScope);

    return {
      source: stored?.source ?? SAMPLE_SOURCES[formatterId],
      ...optionDefaults(defaultOptionsFor(formatterId)),
    };
  }, [formatterId, historyScope]);

  useEffect(() => {
    const stored = historyStore.latest(historyScope);

    dispatch(clearResult());
    dispatch(setSource(stored?.source ?? SAMPLE_SOURCES[formatterId]));
    setOpenedName(null);

    if (stored?.output) {
      dispatch(setOutput(stored.output));
    }
  }, [dispatch, formatterId, historyScope]);

  useEffect(() => {
    const run = async (command: TuiCommand) => {
      if (command === 'format') {
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
      void formikRef.current?.setFieldValue('source', next);
      dispatch(setSource(next));
      dispatch(setOutput(next));
    },
  );

  if (!formatter) {
    return <p className="term-error">Unknown formatter.</p>;
  }

  return (
    <Formik
      innerRef={formikRef}
      enableReinitialize
      initialValues={initialValues}
      onSubmit={(values) => {
        dispatch(setSource(values.source));

        const result = formatText(
          formatterRegistry,
          formatterId,
          values.source,
          toFormatterOptions(formatterId, values),
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
          <AsciiFrame title="Settings" hint={formatter.label}>
            <div className="tui-options">
              <FormatterOptionsFields formatterId={formatterId} />
            </div>
          </AsciiFrame>

          <div className="formatter-workspace__panes">
            <AsciiFrame
              title="Input"
              fill
              actions={
                <>
                  <FileOpenButton
                    onLoad={(text, fileName) => {
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
                ariaLabel={`${formatter.label} input`}
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
                &quot;Format&quot;
              </button>
              <span
                className="formatter-workspace__gutter-arrow"
                aria-hidden="true"
              >
                {'->'}
              </span>
            </div>

            <AsciiFrame
              title={error ? 'Error' : 'Formatted'}
              fill
              actions={
                <>
                  <FileDownloadButton
                    fileName={fileNameFor(openedName, 'formatted', formatterId)}
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
                  language={outputLanguageFor(formatterId, Boolean(error))}
                  ariaLabel={`${formatter.label} formatted`}
                  readOnly={Boolean(error)}
                  onChange={syncFormattedEdit}
                />
                {!output && !error ? (
                  <p className="formatter-workspace__empty">
                    Formatted text will appear here after you press Format.
                    Edits in this pane update Input.
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

function optionDefaults(
  options: FormatterOptionsMap[FormatterId],
): Omit<FormatterFormValues, 'source'> {
  const jsonLike =
    'mode' in options
      ? options
      : {
          indent: options.indent,
          mode: 'pretty' as const,
        };

  const html = 'wrapAttributes' in options ? options : DEFAULT_HTML_OPTIONS;

  return {
    indent: jsonLike.indent,
    mode: jsonLike.mode,
    keyCase: 'keyCase' in options ? options.keyCase : 'as-is',
    sortKeys: 'sortKeys' in options ? options.sortKeys : false,
    dropNulls: 'dropNulls' in options ? options.dropNulls : false,
    escapeUnicode: 'escapeUnicode' in options ? options.escapeUnicode : false,
    trailingNewline:
      'trailingNewline' in options ? options.trailingNewline : false,
    quoting: 'quoting' in options ? options.quoting : 'auto',
    forceQuotes: 'forceQuotes' in options ? options.forceQuotes : false,
    documentStart: 'documentStart' in options ? options.documentStart : false,
    documentEnd: 'documentEnd' in options ? options.documentEnd : false,
    lineWidth: 'lineWidth' in options ? options.lineWidth : 80,
    nullStyle: 'nullStyle' in options ? options.nullStyle : 'null',
    keywordCase: 'keywordCase' in options ? options.keywordCase : 'upper',
    wrapAttributes: html.wrapAttributes,
    wrapAttributesMin: html.wrapAttributesMin,
    wrapLineLength: html.wrapLineLength,
    indentInnerHtml: html.indentInnerHtml,
    indentHead: html.indentHead,
    indentBody: html.indentBody,
    preserveNewlines: html.preserveNewlines,
    maxPreserveNewlines: html.maxPreserveNewlines,
    endWithNewline: html.endWithNewline,
    indentScripts: html.indentScripts,
    extraLiners: html.extraLiners,
    indentHandlebars: html.indentHandlebars,
    inlineCustomElements: html.inlineCustomElements,
    templating: html.templating,
    formatPre: html.formatPre,
  };
}

function toFormatterOptions(
  id: FormatterId,
  values: FormatterFormValues,
): FormatterOptionsMap[typeof id] {
  if (id === 'json') {
    return {
      indent: values.indent,
      mode: values.mode,
      keyCase: values.keyCase,
      sortKeys: values.sortKeys,
      dropNulls: values.dropNulls,
      escapeUnicode: values.escapeUnicode,
      trailingNewline: values.trailingNewline,
    };
  }

  if (id === 'sql') {
    return {
      indent: values.indent,
      keywordCase: values.keywordCase,
    };
  }

  if (id === 'html') {
    return {
      indent: values.indent,
      wrapAttributes: values.wrapAttributes,
      wrapAttributesMin: Number(values.wrapAttributesMin),
      wrapLineLength: Number(values.wrapLineLength),
      indentInnerHtml: values.indentInnerHtml,
      indentHead: values.indentHead,
      indentBody: values.indentBody,
      preserveNewlines: values.preserveNewlines,
      maxPreserveNewlines: Number(values.maxPreserveNewlines),
      endWithNewline: values.endWithNewline,
      indentScripts: values.indentScripts,
      extraLiners: values.extraLiners,
      indentHandlebars: values.indentHandlebars,
      inlineCustomElements: values.inlineCustomElements,
      templating: values.templating,
      formatPre: values.formatPre,
    };
  }

  return {
    indent: values.indent,
    mode: values.mode,
    sortKeys: values.sortKeys,
    keyCase: values.keyCase,
    quoting: values.quoting,
    forceQuotes: values.forceQuotes,
    documentStart: values.documentStart,
    documentEnd: values.documentEnd,
    lineWidth: Number(values.lineWidth) || 80,
    nullStyle: values.nullStyle,
  };
}
