import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ compiler: true })],
  css: {
    preprocessorOptions: {
      scss: {
        // Permite `@use 'utilities' as u;` desde cualquier CSS Module sin rutas relativas largas.
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Las comprobaciones en navegador real son de Playwright (npm run test:a11y).
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Los tests de contrato leen los tokens SCSS como texto; el resto del CSS se sigue omitiendo.
    css: { include: [/\.scss\?raw$/] },
  },
})
