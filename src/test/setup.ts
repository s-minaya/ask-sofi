import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { installMatchMedia, resetMediaQueries } from './matchMedia'
import { server } from './msw'

installMatchMedia()

// jsdom no implementa el desplazamiento de la ventana; los cambios de pantalla lo piden.
window.scrollTo = () => {}

// Vitest no expone globales; el cleanup automático de Testing Library
// se registra aquí para vaciar el DOM entre tests.
afterEach(() => {
  cleanup()
  resetMediaQueries()
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
})

// MSW intercepta las peticiones HTTP de todos los tests.
// Los requests no manejados fallan para que ningún test dependa de red real.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
