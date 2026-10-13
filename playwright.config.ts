import { defineConfig, devices } from '@playwright/test'

// Puerto propio de las pruebas: distinto del 5173 de `npm run dev`, para no
// chocar con un servidor que alguien tenga abierto para revisar la aplicación.
const PORT = Number(process.env.E2E_PORT ?? 5199)
const ORIGIN = `http://localhost:${PORT}`

// Comprobaciones en un navegador real: accesibilidad automática (axe) y teclado.
// Usan el servidor de desarrollo porque el Design Lab y la Experience Preview solo existen ahí.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Siempre un servidor recién arrancado desde este proyecto: no se reutiliza
    // ninguno (uno antiguo sirve módulos obsoletos y uno ajeno no es este código).
    // Si el puerto está ocupado, falla en lugar de conectarse a otro proceso.
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: false,
  },
})
