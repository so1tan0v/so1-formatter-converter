/**
 * Imports from packages
 */
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const paddingLineBetweenStatements = [
  'error',
  {
    blankLine: 'always',
    prev: ['const', 'let', 'var'],
    next: '*',
  },
  {
    blankLine: 'any',
    prev: ['const', 'let', 'var'],
    next: ['const', 'let', 'var'],
  },
  {
    blankLine: 'always',
    prev: '*',
    next: ['return', 'break', 'continue', 'throw'],
  },
  {
    blankLine: 'always',
    prev: '*',
    next: 'block-like',
  },
  {
    blankLine: 'always',
    prev: 'block-like',
    next: '*',
  },
  {
    blankLine: 'always',
    prev: '*',
    next: ['if', 'for', 'while', 'do', 'switch', 'try'],
  },
  {
    blankLine: 'always',
    prev: ['if', 'for', 'while', 'do', 'switch', 'try'],
    next: '*',
  },
  {
    blankLine: 'always',
    prev: '*',
    next: ['function', 'class'],
  },
  {
    blankLine: 'always',
    prev: ['function', 'class'],
    next: '*',
  },
  {
    blankLine: 'always',
    prev: '*',
    next: 'export',
  },
  {
    blankLine: 'any',
    prev: 'export',
    next: 'export',
  },
  {
    blankLine: 'always',
    prev: '*',
    next: ['interface', 'type'],
  },
  {
    blankLine: 'always',
    prev: ['interface', 'type'],
    next: '*',
  },
  {
    blankLine: 'any',
    prev: ['interface', 'type'],
    next: ['interface', 'type'],
  },
];

export default defineConfig(
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  eslintConfigPrettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/padding-line-between-statements':
        paddingLineBetweenStatements,
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true },
      ],
    },
  },
);
