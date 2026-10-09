/**
 * Imports from packages
 */
import { Field, useFormikContext } from 'formik';
import type { ReactNode } from 'react';

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
import { INDENT_STYLE_LABELS, INDENT_STYLES } from '@domain/shared/indent';

interface FormatterOptionsFieldsProps {
  formatterId: FormatterId;
  advanced: boolean;
}

const KEYWORD_CASE_LABELS: Record<(typeof SQL_KEYWORD_CASES)[number], string> =
  {
    upper: 'Upper',
    lower: 'Lower',
    preserve: 'As is',
  };

const JSON_KEY_CASE_LABELS: Record<(typeof JSON_KEY_CASES)[number], string> = {
  'as-is': 'As is',
  snake: 'snake_case',
  camel: 'camelCase',
  pascal: 'CamelCase',
};

const MODE_LABELS: Record<(typeof OUTPUT_MODES)[number], string> = {
  pretty: 'Pretty',
  compact: 'One line',
  escaped: 'Escaped string',
};

const WRAP_ATTRIBUTE_LABELS: Record<
  (typeof HTML_WRAP_ATTRIBUTES)[number],
  string
> = {
  auto: 'Auto',
  force: 'Each attribute',
  'force-aligned': 'Aligned',
  'force-expand-multiline': 'Expand multiline',
  'aligned-multiple': 'Align multiple',
  preserve: 'Preserve',
  'preserve-aligned': 'Preserve aligned',
};

const SCRIPT_INDENT_LABELS: Record<
  (typeof HTML_SCRIPT_INDENTS)[number],
  string
> = {
  normal: 'Normal',
  keep: 'Keep',
  separate: 'Separate',
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
  return (
    <div className="tui-option-groups">
      <OptionGroup title="Layout">
        <label className="tui-field" htmlFor="indent">
          <span className="tui-field__name">Indent</span>
          <Field as="select" id="indent" name="indent" className="tui-select">
            {INDENT_STYLES.map((style) => (
              <option key={style} value={style}>
                {INDENT_STYLE_LABELS[style]}
              </option>
            ))}
          </Field>
        </label>
        {formatterId === 'json' ||
        formatterId === 'yaml' ||
        formatterId === 'xml' ? (
          <label className="tui-field" htmlFor="mode">
            <span className="tui-field__name">Style</span>
            <Field as="select" id="mode" name="mode" className="tui-select">
              {(formatterId === 'xml' ? XML_OUTPUT_MODES : OUTPUT_MODES).map(
                (mode) => (
                  <option key={mode} value={mode}>
                    {MODE_LABELS[mode]}
                  </option>
                ),
              )}
            </Field>
          </label>
        ) : null}
      </OptionGroup>

      {formatterId === 'json' || formatterId === 'yaml' ? (
        <OptionGroup title="Keys">
          <KeyCaseField />
          {formatterId === 'json' ? (
            <label className="tui-field" htmlFor="query">
              <span className="tui-field__name">Path</span>
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
        <OptionGroup title="SQL">
          <SqlExtraFields />
        </OptionGroup>
      ) : null}

      {formatterId === 'html' ? (
        <OptionGroup title="Markup">
          <HtmlAttributeField />
        </OptionGroup>
      ) : null}

      {formatterId === 'xml' ? (
        <OptionGroup title="Markup">
          <XmlAttributeField />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'json' ? (
        <OptionGroup title="More">
          <JsonAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'yaml' ? (
        <OptionGroup title="More">
          <YamlAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'html' ? (
        <OptionGroup title="More">
          <HtmlAdvancedFields />
        </OptionGroup>
      ) : null}

      {advanced && formatterId === 'xml' ? (
        <OptionGroup title="More">
          <label className="tui-check">
            <Field type="checkbox" name="endWithNewline" />
            <span>End with newline</span>
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
  return (
    <label className="tui-field" htmlFor="wrapAttributes">
      <span className="tui-field__name">Attributes</span>
      <Field
        as="select"
        id="wrapAttributes"
        name="wrapAttributes"
        className="tui-select"
      >
        {XML_WRAP_ATTRIBUTES.map((value) => (
          <option key={value} value={value}>
            {WRAP_ATTRIBUTE_LABELS[value]}
          </option>
        ))}
      </Field>
    </label>
  );
}

function HtmlAttributeField() {
  return (
    <label className="tui-field" htmlFor="wrapAttributes">
      <span className="tui-field__name">Attributes</span>
      <Field
        as="select"
        id="wrapAttributes"
        name="wrapAttributes"
        className="tui-select"
      >
        {HTML_WRAP_ATTRIBUTES.map((value) => (
          <option key={value} value={value}>
            {WRAP_ATTRIBUTE_LABELS[value]}
          </option>
        ))}
      </Field>
    </label>
  );
}

function HtmlAdvancedFields() {
  const { values } = useFormikContext<{ templating: HtmlTemplating }>();
  const templatesOff = values.templating === 'none';

  return (
    <>
      <label className="tui-field" htmlFor="wrapAttributesMin">
        <span className="tui-field__name">Min attributes</span>
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
        <span className="tui-field__name">Line width</span>
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
        <span className="tui-field__name">Scripts</span>
        <Field
          as="select"
          id="indentScripts"
          name="indentScripts"
          className="tui-select"
        >
          {HTML_SCRIPT_INDENTS.map((value) => (
            <option key={value} value={value}>
              {SCRIPT_INDENT_LABELS[value]}
            </option>
          ))}
        </Field>
      </label>
      <label className="tui-field" htmlFor="templating">
        <span className="tui-field__name">Templates</span>
        <Field
          as="select"
          id="templating"
          name="templating"
          className="tui-select"
        >
          {HTML_TEMPLATING.map((value) => (
            <option key={value} value={value}>
              {value === 'auto' ? 'Auto' : 'Off'}
            </option>
          ))}
        </Field>
      </label>
      <label className="tui-field" htmlFor="maxPreserveNewlines">
        <span className="tui-field__name">Max blank lines</span>
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
        <span>Indent contents</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="indentHead" />
        <span>Indent head</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="indentBody" />
        <span>Indent body</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="preserveNewlines" />
        <span>Keep newlines</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="endWithNewline" />
        <span>End with newline</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="extraLiners" />
        <span>Blank line before blocks</span>
      </label>
      <label className="tui-check">
        <Field
          type="checkbox"
          name="indentHandlebars"
          disabled={templatesOff}
        />
        <span>Indent Handlebars</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="inlineCustomElements" />
        <span>Inline custom elements</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="formatPre" />
        <span>Format pre</span>
      </label>
    </>
  );
}

function SqlExtraFields() {
  return (
    <label className="tui-field" htmlFor="keywordCase">
      <span className="tui-field__name">Keywords</span>
      <Field
        as="select"
        id="keywordCase"
        name="keywordCase"
        className="tui-select"
      >
        {SQL_KEYWORD_CASES.map((value) => (
          <option key={value} value={value}>
            {KEYWORD_CASE_LABELS[value]}
          </option>
        ))}
      </Field>
    </label>
  );
}

function KeyCaseField() {
  return (
    <label className="tui-field" htmlFor="keyCase">
      <span className="tui-field__name">Keys</span>
      <Field as="select" id="keyCase" name="keyCase" className="tui-select">
        {JSON_KEY_CASES.map((value) => (
          <option key={value} value={value}>
            {JSON_KEY_CASE_LABELS[value]}
          </option>
        ))}
      </Field>
    </label>
  );
}

function JsonAdvancedFields() {
  return (
    <>
      <label className="tui-check">
        <Field type="checkbox" name="sortKeys" />
        <span>Sort keys</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="dropNulls" />
        <span>Drop null</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="escapeUnicode" />
        <span>Escape unicode</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="trailingNewline" />
        <span>End with newline</span>
      </label>
    </>
  );
}

function YamlAdvancedFields() {
  return (
    <>
      <label className="tui-field" htmlFor="quoting">
        <span className="tui-field__name">Quotes</span>
        <Field as="select" id="quoting" name="quoting" className="tui-select">
          <option value="auto">auto</option>
          <option value="single">single</option>
          <option value="double">double</option>
        </Field>
      </label>
      <label className="tui-field" htmlFor="nullStyle">
        <span className="tui-field__name">Null</span>
        <Field
          as="select"
          id="nullStyle"
          name="nullStyle"
          className="tui-select"
        >
          <option value="null">null</option>
          <option value="tilde">~</option>
          <option value="empty">empty</option>
        </Field>
      </label>
      <label className="tui-field" htmlFor="lineWidth">
        <span className="tui-field__name">Line width</span>
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
        <span>Sort keys</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="forceQuotes" />
        <span>Force quotes</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="documentStart" />
        <span>Start with ---</span>
      </label>
      <label className="tui-check">
        <Field type="checkbox" name="documentEnd" />
        <span>End with ...</span>
      </label>
    </>
  );
}
