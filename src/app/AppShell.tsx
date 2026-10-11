import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '../components/layout/SiteHeader/SiteHeader'
import type { SoundChoiceValue } from '../components/ui/SoundChoice/SoundChoice'
import { SkipLink } from '../components/ui/SkipLink/SkipLink'
import { ProvisionalConsultation } from '../features/consultation/ProvisionalConsultation'
import { Landing } from '../features/landing/Landing'
import { useSound } from '../hooks/useSound'
import {
  readSessionScreen,
  saveSessionScreen,
  type SessionScreen,
} from '../infrastructure/storage/sessionScreenStorage'
import { subscribeToUserDataCleared } from '../infrastructure/storage/userData'
import styles from './AppShell.module.scss'

const MAIN_ID = 'contenido'

// Dos vistas, sin router: la portada da acceso a la consulta y el logo vuelve a la portada.
export function AppShell() {
  const sound = useSound()
  const [screen, setScreen] = useState<SessionScreen>(readSessionScreen)
  // Cada cambio de pantalla pide llevar el foco a su titular; la carga inicial no.
  const [focusRequest, setFocusRequest] = useState(0)
  const landingHeading = useRef<HTMLHeadingElement>(null)
  const consultationHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusRequest === 0) return
    const heading =
      screen === 'landing'
        ? landingHeading.current
        : consultationHeading.current
    heading?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [focusRequest, screen])

  // Borrar todos los datos devuelve la aplicación a su estado inicial.
  useEffect(() => subscribeToUserDataCleared(() => setScreen('landing')), [])

  const go = (next: SessionScreen) => {
    setScreen(next)
    saveSessionScreen(next)
    setFocusRequest((request) => request + 1)
  }

  const start = (choice: SoundChoiceValue) => {
    // Dentro del gesto de «Empezar»: aquí es donde el navegador deja preparar el audio.
    if (choice === 'on') sound.enable()
    else sound.disable()
    go('consultation')
  }

  return (
    <div className={styles.app}>
      <SkipLink href={`#${MAIN_ID}`} />
      {screen === 'landing' ? (
        <Landing
          onStart={start}
          initialSound={sound.preference}
          headingRef={landingHeading}
          mainId={MAIN_ID}
        />
      ) : (
        <>
          <SiteHeader
            onHome={() => go('landing')}
            tag="En directo"
            kicker="El consultorio de Sofi"
            soundEnabled={sound.enabled}
            onToggleSound={sound.toggle}
          />
          <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
            <h1 className={styles.srOnly}>Tu consulta</h1>
            <ProvisionalConsultation headingRef={consultationHeading} />
          </main>
        </>
      )}
    </div>
  )
}
