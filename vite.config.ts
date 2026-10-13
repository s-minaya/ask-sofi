import react from '@vitejs/plugin-react'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'

// public/ se copia entero al build: el worker de MSW solo sirve en desarrollo
// (main.tsx lo arranca únicamente con import.meta.env.DEV) y no debe publicarse.
function dropMswWorker(): Plugin {
  let target = ''
  return {
    name: 'ask-sofi:drop-msw-worker',
    apply: 'build',
    configResolved(config) {
      target = resolve(config.root, config.build.outDir, 'mockServiceWorker.js')
    },
    closeBundle() {
      rmSync(target, { force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ compiler: true }), dropMswWorker()],
  css: {
    preprocessorOptions: {
      scss: {
        // Permite `@use 'utilities' as u;` desde cualquier CSS Module sin rutas relativas largas.
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
      },
    },
  },
  server: {
    // Pre-transforma al arrancar la aplicación y el Design Lab: el primer cliente
    // no paga la carga en frío (3–4 s) mientras varias pruebas piden páginas a la vez.
    warmup: {
      clientFiles: ['./src/main.tsx', './src/design-lab/**/*.tsx'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Las comprobaciones en navegador real son de Playwright (npm run test:a11y).
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Cada fichero crea su propio jsdom (~2 s) y la suite es de memoria, no de CPU:
    // con 7 hilos en un portátil de 8 GB el test más lento pasaba de 1 s a 2,5–4 s
    // y alguno superó los 5 s. Con 3 hilos la suite tarda lo mismo (~100 s) y el
    // más lento queda en ~1,2 s. En CI se usan los hilos por defecto.
    maxWorkers: process.env.CI ? undefined : 3,
    // Los tests de contrato leen los tokens SCSS como texto; el resto del CSS se sigue omitiendo.
    css: { include: [/\.scss\?raw$/] },
  },
})
