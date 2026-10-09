import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals/global.scss'
import App from './App.tsx'

async function bootstrap() {
  // MSW sólo se activa en desarrollo; en producción el chunk no se carga.
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
