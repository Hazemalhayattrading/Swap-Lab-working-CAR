// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'public/',
      'assets-raw/',
      'test-results/',
      'playwright-report/',
      '.claude/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/sim/**'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.ts', 'e2e/**/*.ts', '*.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // CLAUDE.md: src/sim/ is pure. No DOM, no Three.js, so it can run in a worker
    // and in Node-based calibration tests unchanged. It may only import from
    // itself and from src/data/.
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['three', 'three/*'], message: 'src/sim/ must not depend on Three.js.' },
            {
              group: ['../*', '!../data', '../*/**', '!../data/**', '../../**'],
              message: 'src/sim/ may only import from src/sim/ and src/data/.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'No dynamic imports in src/sim/: keep the simulation a pure, static module graph.',
        },
      ],
      // Every browser global that isn't also a plain JavaScript built-in.
      'no-restricted-globals': [
        'error',
        ...Object.keys(globals.browser).filter((name) => !(name in globals.es2021)),
      ],
      'no-restricted-properties': [
        'error',
        ...['document', 'window', 'navigator', 'localStorage', 'sessionStorage', 'location'].map(
          (property) => ({ object: 'globalThis', property, message: 'src/sim/ has no DOM.' }),
        ),
      ],
    },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
