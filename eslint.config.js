const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    rules: {
      // SDK 57 turns the React Compiler rules on as errors. They flag existing
      // setState-in-effect, ref, useCallback, and Date.now patterns across the app.
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: ['android/**', 'ios/**', 'dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.{test,spec}.{js,jsx}', 'jest.setup.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'import/first': 'off',
    },
  },
]);
