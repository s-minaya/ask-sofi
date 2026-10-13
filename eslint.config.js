import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

// Linting separado de formatting: Prettier se configurará en una task posterior.
export default tseslint.config(
  {
    ignores: [
      'dist',
      'public/mockServiceWorker.js',
      'playwright-report',
      'test-results',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
  },
  reactHooks.configs.flat['recommended-latest'],
  // El flat config del plugin aplica a todos los archivos; se limita a JSX.
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ['**/*.{jsx,tsx}'],
  },
  // Web Storage solo se toca desde la capa de persistencia (tech-stack §37).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/infrastructure/storage/**',
      'src/**/*.test.{ts,tsx}',
      'src/test/**',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['localStorage', 'sessionStorage'].map((name) => ({
          name,
          message: 'Usa la capa infrastructure/storage.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        ...['window', 'globalThis'].flatMap((object) =>
          ['localStorage', 'sessionStorage'].map((property) => ({
            object,
            property,
            message: 'Usa la capa infrastructure/storage.',
          })),
        ),
      ],
    },
  },
  {
    files: [
      'vite.config.ts',
      'eslint.config.js',
      'playwright.config.ts',
      'e2e/**/*.ts',
      'scripts/**/*.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
)
