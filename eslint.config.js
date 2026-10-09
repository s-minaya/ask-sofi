import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

// Linting separado de formatting: Prettier se configurará en una task posterior.
export default tseslint.config(
  { ignores: ['dist', 'public/mockServiceWorker.js'] },
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
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
