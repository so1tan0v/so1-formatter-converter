/**
 * Imports from packages
 */
import { Field, useFormikContext } from 'formik';
import type { ReactNode } from 'react';

/**
 * Imports from presentation
 */
import { useLocale } from '@presentation/i18n/useLocale';

/**
 * Imports from domain
 */
import {
  HTML_SCRIPT_INDENTS,
  HTML_TEMPLATING,
  HTML_WRAP_ATTRIBUTES,
  JSON_KEY_CASES,
  OUTPUT_MODES,
  SQL_KEYWORD_CASES,
  XML_OUTPUT_MODES,
  XML_WRAP_ATTRIBUTES,
} from '@domain/formatter/types';
import type { FormatterId, HtmlTemplating } from '@domain/formatter/types';
import { INDENT_STYLES, type IndentStyle } from '@domain/shared/indent';

interface FormatterOptionsFieldsProps {
  formatterId: FormatterId;
  advanced: boolean;
}

const KEYWORD_CASE_LABELS: Record<(typeof SQL_KEYWORD_CASES)[number], string> =
  {
    upper: 'opt.upper',
    lower: 'opt.lower',
    preserve: 'opt.asIs',
  };

const JSON_KEY_CASE_LABELS: Record<(typeof JSON_KEY_CASES)[number], string> = {
  'as-is': 'opt.asIs',
  snake: 'snake_case',
  camel: 'camelCase',
  pascal: 'CamelCase',
};

const MODE_LABELS: Record<(typeof OUTPUT_MODES)[number], string> = {
  pretty: 'opt.pretty',
  compact: 'opt.oneLine',
  escaped: 'opt.escaped',
};

const WRAP_ATTRIBUTE_LABELS: Record<
  (typeof HTML_WRAP_ATTRIBUTES)[number],
  string
> = {
  auto: 'opt.auto',
  force: 'opt.eachAttribute',
  'force-aligned': 'opt.aligned',
  'force-expand-multiline': 'opt.expandMultiline',
  'aligned-multiple': 'opt.alignMultiple',
  preserve: 'opt.preserve',
  'preserve-aligned': 'opt.preserveAligned',
};

const SCRIPT_INDENT_LABELS: Record<
  (typeof HTML_SCRIPT_INDENTS)[number],
  string
> = {
  normal: 'opt.normal',
  keep: 'opt.keep',
  separate: 'opt.separate',
};

const INDENT_KEYS: Record<IndentStyle, string> = {
  '1-space': 'indent.1',
  '2-space': 'indent.2',
  '3-space': 'indent.3',
  '4-space': 'indent.4',
  tab: 'indent.tab',
};

/**
 * Поля настроек форматирования для выбранного типа
 *
 * @param formatterId Идентификатор активного форматтера
 * @param advanced Показывать редкие настройки
 */
export function FormatterOptionsFields({
  formatterId,
  advanced,
}: FormatterOptionsFieldsProps) {
  const { t } = useLocale();

  return (
    <div className="tui-option-groups">
      <OptionGroup title={t('opt.layout')}>
        <label className="tui-field" htmlFor="indent">
          <span className="tui-field__name">{t('opt.indent')}</span>
          <Field as="select" id="indent" name="indent" className="tui-select">
            {INDENT_STYLES.map((style) => (
              <option key={style} value={style}>
                {t(INDENT_KEYS[style])}
              </option>
            ))}
          </Field>
        </label>
        {formatterId === 'json' ||
        formatterId === 'yaml' ||
        formatterId === 'xml' ? (
          <label className="tui-field" htmlFor="mode">
            <span className="tui-field__name">{t('opt.style')}</span>
            <Field as="select" id="mode" name="mode" className="tui-select">
              {(formatterId === 'xml' ? XML_OUTPUT_MODES : OUTPUT_MODES).map(
                (mode) => (
                  <option key={mode} value={mode}>
                    {t(MODE_LABELS[mode])}
                  </option>
                ),
              )}
            </Field>
          </label>
        ) : null}
      </OptionGroup>

      {formatterId === 'json' || formatterId === 'yaml' ? (
        <OptionGroup title={t('opt.keys')}>
          <KeyCaseField />
          {formatterId === 'json' ? (
            <label className="tui-field" htmlFor="query">
              <span className="tui-field__name">{t('opt.path')}</span>
              <Field
                id="query"
                name="query"
                className="tui-input"
                placeholder="user.name"
                spellCheck={false}
              />
            </label>
          ) : null}
        </OptionGroup>
      ) : null}

      {formatterId === 'sql' ? (
        <OptionGroup title={t('opt.sql')}>
          <SqlExtraFields />
        </OptionGroup>
      ) : null}

      {formatterId === 'html' ? (
        <OptionGroup title={t('opt.markup')}>
          <HtmlAttributeField />
        </OptionGroup>
      ) : null}

      {formatterId === 'xml' ? (
        <OptionGroup title={t('opt.markup')}>
          <XmlAttributeField />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'json' ? (
        <OptionGroup title={t('opt.more')}>
          <JsonAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'yaml' ? (
        <OptionGroup title={t('opt.more')}>
          <YamlAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'html' ? (
        <OptionGroup title={t('opt.more')}>
          <HtmlAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'xml' ? (
        <OptionGroup title={t('opt.more')}>
          <label className="tui-check">
            <Field type="checkbox" name="endWithNewline" />
            <span>{t('opt.endNewline')}</span>
          </label>
        </OptionGroup>
      ) : null}
    </div>
  );
}

function OptionGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="tui-option-group">
      <span className="tui-option-group__title">{title}</span>
      {children}
    </div>
  );
}

function XmlAttributeField() {
  const { t } = useLocale();

  return (
    <label className="tui-field" htmlFor="wrapAttributes">
      <span className="tui-field__name">{t('opt.attributes')}</span>
      <Field
        as="select"
        id="wrapAttributes"
        name="wrapAttributes"
        className="tui-select"
      >
        {XML_WRAP_ATTRIBUTES.map((value) => (
          <option key={value} value={value}>
            {t(WRAP_ATTRIBUTE_LABELS[value])}
          </option>
        ))}
      </Field>
    </label>
  );
}

function HtmlAttributeField() {
  const { t } = useLocale();

  return (
    <label className="tui-field" htmlFor="wrapAttributes">
      <span className="tui-field__name">{t('opt.attributes')}</span>
      <Field
        as="select"
        id="wrapAttributes"
        name="wrapAttributes"
        className="tui-select"
      >
        {HTML_WRAP_ATTRIBUTES.map((value) => (
          <option key={value} value={value}>
            {t(WRAP_ATTRIBUTE_LABELS[value])}
          </option>
        ))}
      </Field>
    </label>
  );
}

function HtmlAdvancedFields() {
  const { t } = useLocale();
  const { values } = useFormikContext<{ templating: HtmlTemplating }>();
  const templatesOff = values.templating === 'none';

  return (
    <>
      <label className="tui-field" htmlFor="wrapAttributesMin">
        <span className="tui-field__name">{t('opt.minAttributes')}</span>
        <Field
          id="wrapAttributesMin"
          name="wrapAttributesMin"
          type="number"
          min="1"
          max="20"
          className="tui-select tui-select--num"
        />
      </label>
      <label className="tui-field" htmlFor="wrapLineLength">
        <span className="tui-field__name">{t('opt.lineWidth')}</span>
        <Field
          id="wrapLineLength"
          name="wrapLineLength"
          type="number"
          min="0"
          max="400"
          className="tui-select tui-select--num"
        />
      </label>
      <label className="tui-field" htmlFor="indentScripts">
        <span className="tui-field__name">{t('opt.scripts')}</span>
        <Field
          as="select"
          id="indentScripts"
          name="indentScripts"
          className="tui-select"
        >
          {HTML_SCRIPT_INDENTS.map((value) => (
            <option key={value} value={value}>
              {t(SCRIPT_INDENT_LABELS[value])}
            </option>
          ))}
        </Field>
      </label>
      <label className="tui-field" htmlFor="templating">
        <span className="tui-field__name">{t('opt.templates')}</span>
        <Field
          as="select"
          id="templating"
          name="templating"
          className="tui-select"
        >
          {HTML_TEMPLATING.map((value) => (
            <option key={value} value={value}>
              {value === 'auto' ? t('opt.auto') : t('opt.off')}
            </option>
          ))}
        </Field>
      </label>
      <label className="tui-field" htmlFor="maxPreserveNewlines">
        <span className="tui-field__name">{t('opt.maxBlank')}</span>
        <Field
          id="maxPreserveNewlines"
          name="maxPreserveNewlines"
          type="number"
          min="0"
          max="20"
          className="tui-select tui-select--num"
        />
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="indentInnerHtml" />
        <span>{t('opt.indentContents')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="indentHead" />
        <span>{t('opt.indentHead')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="indentBody" />
        <span>{t('opt.indentBody')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="preserveNewlines" />
        <span>{t('opt.keepNewlines')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="endWithNewline" />
        <span>{t('opt.endNewline')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="extraLiners" />
        <span>{t('opt.blankBlocks')}</span>
      </label>
      <label className="tui-check">
        <Field
          type="checkbox"
          name="indentHandlebars"
          disabled={templatesOff}
        />
        <span>{t('opt.indentHandlebars')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="inlineCustomElements" />
        <span>{t('opt.inlineCustom')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="formatPre" />
        <span>{t('opt.formatPre')}</span>
      </label>
    </>
  );
}

function SqlExtraFields() {
  const { t } = useLocale();

  return (
    <label className="tui-field" htmlFor="keywordCase">
      <span className="tui-field__name">{t('opt.keywords')}</span>
      <Field
        as="select"
        id="keywordCase"
        name="keywordCase"
        className="tui-select"
      >
        {SQL_KEYWORD_CASES.map((value) => (
          <option key={value} value={value}>
            {t(KEYWORD_CASE_LABELS[value])}
          </option>
        ))}
      </Field>
    </label>
  );
}

function KeyCaseField() {
  const { t } = useLocale();

  return (
    <label className="tui-field" htmlFor="keyCase">
      <span className="tui-field__name">{t('opt.keys')}</span>
      <Field as="select" id="keyCase" name="keyCase" className="tui-select">
        {JSON_KEY_CASES.map((value) => (
          <option key={value} value={value}>
            {value === 'as-is'
              ? t(JSON_KEY_CASE_LABELS[value])
              : JSON_KEY_CASE_LABELS[value]}
          </option>
        ))}
      </Field>
    </label>
  );
}

function JsonAdvancedFields() {
  const { t } = useLocale();

  return (
    <>
      <label className="tui-check">
        <Field type="checkbox" name="sortKeys" />
        <span>{t('opt.sortKeys')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="dropNulls" />
        <span>{t('opt.dropNull')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="escapeUnicode" />
        <span>{t('opt.escapeUnicode')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="trailingNewline" />
        <span>{t('opt.endNewline')}</span>
      </label>
    </>
  );
}

function YamlAdvancedFields() {
  const { t } = useLocale();

  return (
    <>
      <label className="tui-field" htmlFor="quoting">
        <span className="tui-field__name">{t('opt.quotes')}</span>
        <Field as="select" id="quoting" name="quoting" className="tui-select">
          <option value="auto">{t('opt.auto')}</option>
          <option value="single">single</option>
          <option value="double">double</option>
        </Field>
      </label>
      <label className="tui-field" htmlFor="nullStyle">
        <span className="tui-field__name">{t('opt.null')}</span>
        <Field
          as="select"
          id="nullStyle"
          name="nullStyle"
          className="tui-select"
        >
          <option value="null">null</option>
          <option value="tilde">~</option>
          <option value="empty">{t('excel.empty')}</option>
        </Field>
      </label>
      <label className="tui-field" htmlFor="lineWidth">
        <span className="tui-field__name">{t('opt.lineWidth')}</span>
        <Field
          id="lineWidth"
          name="lineWidth"
          type="number"
          min="40"
          max="160"
          className="tui-select tui-select--num"
        />
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="sortKeys" />
        <span>{t('opt.sortKeys')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="forceQuotes" />
        <span>{t('opt.forceQuotes')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="documentStart" />
        <span>{t('opt.startDoc')}</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="documentEnd" />
        <span>{t('opt.endDoc')}</span>
      </label>
    </>
  );
}
