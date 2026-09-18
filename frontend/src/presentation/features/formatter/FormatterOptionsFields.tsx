import { Field } from 'formik';

import { INDENT_STYLE_LABELS, INDENT_STYLES } from '@domain/shared/indent';
import type { FormatterId } from '@domain/formatter/types';
import { OUTPUT_MODES, SQL_KEYWORD_CASES } from '@domain/formatter/types';

interface FormatterOptionsFieldsProps {
  formatterId: FormatterId;
}

const KEYWORD_CASE_LABELS: Record<(typeof SQL_KEYWORD_CASES)[number], string> = {
  upper: 'Upper',
  lower: 'Lower',
  preserve: 'As is',
};

const MODE_LABELS: Record<(typeof OUTPUT_MODES)[number], string> = {
  pretty: 'Pretty',
  compact: 'One line',
  escaped: 'Escaped string',
};

export function FormatterOptionsFields({
  formatterId,
}: FormatterOptionsFieldsProps) {
  return (
    <div className="tui-fields">
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

      {formatterId !== 'sql' ? (
        <label className="tui-field" htmlFor="mode">
          <span className="tui-field__name">Style</span>
          <Field as="select" id="mode" name="mode" className="tui-select">
            {OUTPUT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </option>
            ))}
          </Field>
        </label>
      ) : null}

      {formatterId === 'json' ? <JsonExtraFields /> : null}

      {formatterId === 'yaml' ? <YamlExtraFields /> : null}

      {formatterId === 'sql' ? <SqlExtraFields /> : null}
    </div>
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

function JsonExtraFields() {
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

function YamlExtraFields() {
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
