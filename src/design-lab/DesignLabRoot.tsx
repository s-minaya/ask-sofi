import { lazy, Suspense } from 'react'
import { SoundProvider } from '../app/providers/SoundProvider'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { SiteHeader } from '../components/layout/SiteHeader/SiteHeader'
import { useSound } from '../hooks/useSound'
import { DesignLab } from './DesignLab'

// La app simulada solo se carga dentro del iframe de la Experience Preview.
const PreviewFrameRoot = lazy(() => import('./preview/PreviewFrameRoot'))
// Composiciones del expediente (004), cada una en su propio iframe.
const ProfileFrameRoot = lazy(() => import('./profile/ProfileFrameRoot'))

// Cabecera sola, para verla dentro de un iframe estrecho con sus media queries reales.
function HeaderFrame() {
  const sound = useSound()
  return (
    <SiteHeader
      onHome={() => {}}
      tag="En directo"
      kicker="El consultorio de Sofi"
      soundEnabled={sound.enabled}
      onToggleSound={sound.toggle}
    />
  )
}

export function DesignLabRoot() {
  const frame = new URLSearchParams(window.location.search).get('frame')

  if (frame === 'profile') {
    return (
      <Suspense fallback={null}>
        <ProfileFrameRoot />
      </Suspense>
    )
  }

  if (frame === 'preview') {
    return (
      <Suspense fallback={null}>
        <PreviewFrameRoot />
      </Suspense>
    )
  }

  return (
    <ThemeProvider>
      {frame === 'header' ? (
        <SoundProvider>
          <HeaderFrame />
        </SoundProvider>
      ) : (
        <DesignLab />
      )}
    </ThemeProvider>
  )
}
