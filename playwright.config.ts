import { defineConfig, devices } from '@playwright/test'

// Puerto propio de las pruebas: distinto del 5173 de `npm run dev`, para no
// chocar con un servidor que alguien tenga abierto para revisar la aplicación.
const PORT = Number(process.env.E2E_PORT ?? 5199)
// IPv4 explícito en el servidor y en la URL: con `localhost`, Vite escucha solo en `::1`
// y cualquier intento por IPv4 al mismo puerto se rechaza. Los dos lados cambian juntos.
const HOST = '127.0.0.1'
const ORIGIN = `http://${HOST}:${PORT}`

// Las pruebas de movimiento (plan 008 §10, D-10) viven en `e2e/motion/` y son las únicas que
// también corren en Firefox y WebKit: ahí es donde los motores pueden diferir (media queries,
// Web Animations, `:where()`). El resto de E2E se queda solo en Chromium. Un archivo nuevo de
// movimiento entra en los tres motores con solo ponerlo en esa carpeta.
const MOTION_TESTS = '**/e2e/motion/**/*.spec.ts'

// Comprobaciones en un navegador real: accesibilidad automática (axe) y teclado.
// Usan el servidor de desarrollo porque el Design Lab y la Experience Preview solo existen ahí.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Con tres motores, cuatro navegadores a la vez no caben en un portátil de 8 GB: con 4
  // trabajadores, Firefox pasaba de 6-11 s por prueba a 17-28 s y algunas cargas del Design Lab
  // no llegaban a tiempo; con 2, las 39 repeticiones pasaron sin pasar de 11,5 s. En CI se usan
  // los trabajadores por defecto (como `maxWorkers` de Vitest en `vite.config.ts`).
  workers: process.env.CI ? undefined : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      testMatch: MOTION_TESTS,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      // Es el WebKit de Playwright, no Safari de macOS ni de iOS (eso es de 015).
      name: 'webkit',
      testMatch: MOTION_TESTS,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    // Siempre un servidor recién arrancado desde este proyecto: no se reutiliza
    // ninguno (uno antiguo sirve módulos obsoletos y uno ajeno no es este código).
    // Si el puerto está ocupado, falla en lugar de conectarse a otro proceso.
    command: `npm run dev -- --host ${HOST} --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: false,
  },
})
