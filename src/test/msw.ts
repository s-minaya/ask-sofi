import { setupServer } from 'msw/node'
import { pingHandler } from '../mocks/handlers'

// Servidor para tests con handlers reutilizables.
export const server = setupServer(pingHandler)
