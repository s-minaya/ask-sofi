import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '../components/layout/SiteHeader/SiteHeader'
import type { SoundChoiceValue } from '../components/ui/SoundChoice/SoundChoice'
import { SkipLink } from '../components/ui/SkipLink/SkipLink'
import { ProvisionalConsultation } from '../features/consultation/ProvisionalConsultation'
import { Landing } from '../features/landing/Landing'
import { ProfileScreen } from '../features/partner-profile/ProfileScreen'
import { useSound } from '../hooks/useSound'
import {
  readSessionScreen,
  saveSessionScreen,
  type SessionScreen,
} from '../infrastructure/storage/sessionScreenStorage'
import { subscribeToUserDataCleared } from '../infrastructure/storage/userData'
import styles from './AppShell.module.scss'

const MAIN_ID = 'contenido'

// El expediente se abre desde la consulta y no se recuerda entre recargas: su
// borrador vive en memoria, así que una recarga vuelve a la consulta.
type Screen = SessionScreen | 'profile'

// Tres vistas, sin router: la portada da acceso a la consulta, la consulta al
// expediente y el logo vuelve a la portada.
export function AppShell() {
  const sound = useSound()
  const [screen, setScreen] = useState<Screen>(readSessionScreen)
  // Cada cambio de pantalla pide llevar el foco a su titular; la carga inicial no.
  const [focusRequest, setFocusRequest] = useState(0)
  const landingHeading = useRef<HTMLHeadingElement>(null)
  const consultationHeading = useRef<HTMLHeadingElement>(null)
  const profileHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusRequest === 0) return
    const heading = {
      landing: landingHeading,
      consultation: consultationHeading,
      profile: profileHeading,
    }[screen].current
    heading?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [focusRequest, screen])

  // Borrar todos los datos devuelve la aplicación a su estado inicial.
  useEffect(() => subscribeToUserDataCleared(() => setScreen('landing')), [])

  const go = (next: Screen) => {
    setScreen(next)
    // Mientras se edita el expediente, la sesión sigue siendo la de la consulta.
    saveSessionScreen(next === 'profile' ? 'consultation' : next)
    setFocusRequest((request) => request + 1)
  }

  // En la consulta, activar el sonido no descarga el audio (aún nada lo usa); en
  // el expediente sí suena la pregunta de Sofi, así que el gesto lo prepara.
  const toggleSound = () =>
    screen === 'profile' && !sound.enabled ? sound.unlock() : sound.toggle()

  const openProfile = () => {
    // Dentro del gesto: con el audio diferido, es lo que deja sonar la pregunta de Sofi.
    if (sound.enabled) sound.unlock()
    go('profile')
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
            tag={screen === 'profile' ? 'Expediente' : 'En directo'}
            kicker="El consultorio de Sofi"
            soundEnabled={sound.enabled}
            onToggleSound={toggleSound}
          />
          <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
            {screen === 'profile' ? (
              <ProfileScreen
                onBack={() => go('consultation')}
                headingRef={profileHeading}
              />
            ) : (
              <>
                <h1 className={styles.srOnly}>Tu consulta</h1>
                <ProvisionalConsultation
                  headingRef={consultationHeading}
                  onOpenProfile={openProfile}
                />
              </>
            )}
          </main>
        </>
      )}
    </div>
  )
}
