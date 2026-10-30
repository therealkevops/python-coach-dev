// ESLint flat config: recommended JavaScript rules and React hooks rules, with browser globals
// for the app and Node globals for tests and scripts.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', args: 'after-used', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['tests/**', '*.config.js', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
];
