import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals/global.scss'
import App from './App.tsx'
import { applyThemePreference } from './app/providers/theme'
import { readThemePreference } from './infrastructure/storage/themePreferenceStorage'

async function bootstrap() {
  // El tema guardado se aplica antes del primer render para no mostrar el contrario.
  applyThemePreference(readThemePreference())

  // MSW sólo se activa en desarrollo; en producción el chunk no se carga.
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  const root = createRoot(document.getElementById('root')!)

  // El Design Lab solo existe en desarrollo: en el build público esta rama
  // desaparece junto con su import dinámico.
  if (
    import.meta.env.DEV &&
    window.location.pathname.startsWith('/design-lab')
  ) {
    const { DesignLabRoot } = await import('./design-lab/DesignLabRoot')
    root.render(
      <StrictMode>
        <DesignLabRoot />
      </StrictMode>,
    )
    return
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
