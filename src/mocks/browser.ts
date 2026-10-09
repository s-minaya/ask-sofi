import { setupWorker } from 'msw/browser'
import { pingHandler } from './handlers'

// Worker del navegador para mockear la frontera HTTP en desarrollo.
export const worker = setupWorker(pingHandler)
