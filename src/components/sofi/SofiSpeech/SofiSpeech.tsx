import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { SpeechVoice } from '../../../app/providers/sound'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useSound } from '../../../hooks/useSound'
import { cx } from '../../../utils/cx'
import { TextLink } from '../../ui/TextLink/TextLink'
import {
  SofiDialog,
  SofiDialogText,
  type SofiDialogSize,
} from '../SofiDialog/SofiDialog'
import { SoundNotice } from '../SoundNotice/SoundNotice'
import styles from './SofiSpeech.module.scss'
import {
  DEFAULT_SPEECH_TIMING,
  REDUCED_MOTION_FRAGMENT_MS,
  type SpeechState,
  type SpeechTiming,
} from './speechTimeline'
import { useSpeechTimeline } from './useSpeechTimeline'

export type { SpeechState }

// Cursor de escritura, para muestras estáticas del diálogo.
export function SpeechCaret() {
  return <span className={styles.caret} aria-hidden="true" />
}

type SofiSpeechProps = {
  text: string
  timing?: Partial<SpeechTiming>
  size?: SofiDialogSize
  // Lo que aparece al terminar de escribir («Ver las versiones»).
  doneAction?: ReactNode
  // Contenido del bocadillo bajo el texto (p. ej. unas respuestas): siempre
  // activo, también mientras Sofi escribe.
  body?: ReactNode
  // Estado de presentación para sincronizar futuras animaciones (008) sin conocer sus assets.
  onStateChange?: (state: SpeechState) => void
  // Cambiarlo vuelve a escribir el texto desde el principio.
  playToken?: number
  // Si es false, empieza con el texto completo hasta que playToken cambie.
  autoplay?: boolean
  // Revelado desde fuera (por ejemplo, un «Ver todo» del Design Lab).
  revealed?: boolean
  // Anuncia el texto completo una sola vez, al aparecer.
  announce?: boolean
  className?: string
  dialogClassName?: string
}

export function SofiSpeech({
  text,
  timing,
  size = 'lg',
  doneAction,
  body,
  onStateChange,
  playToken = 0,
  autoplay = true,
  revealed = false,
  announce = true,
  className,
  dialogClassName,
}: SofiSpeechProps) {
  const sound = useSound()
  const reducedMotion = useReducedMotion()
  const nameId = useId()
  return (
    <div className={cx(styles.speech, className)}>
      {/* Una instancia por texto y reproducción: al cambiar, la anterior se cancela limpia. */}
      <SpeechDialog
        key={`${playToken}:${text}`}
        text={text}
        timing={{ ...DEFAULT_SPEECH_TIMING, ...timing }}
        size={size}
        doneAction={doneAction}
        body={body}
        onStateChange={onStateChange}
        autoplay={autoplay || playToken > 0}
        revealedFromOutside={revealed}
        reducedMotion={reducedMotion}
        voice={sound.voice}
        announce={announce}
        nameId={nameId}
        className={dialogClassName}
      />
      <SoundNotice />
    </div>
  )
}

type SpeechDialogProps = {
  text: string
  timing: SpeechTiming
  size: SofiDialogSize
  doneAction?: ReactNode
  body?: ReactNode
  onStateChange?: (state: SpeechState) => void
  autoplay: boolean
  revealedFromOutside: boolean
  reducedMotion: boolean
  voice: SpeechVoice
  announce: boolean
  nameId: string
  className?: string
}

function SpeechDialog({
  text,
  timing,
  size,
  doneAction,
  body,
  onStateChange,
  autoplay,
  revealedFromOutside,
  reducedMotion,
  voice,
  announce,
  nameId,
  className,
}: SpeechDialogProps) {
  const [revealed, setRevealed] = useState(!autoplay)
  const [focusDone, setFocusDone] = useState(false)
  const footRef = useRef<HTMLSpanElement>(null)
  const liveRef = useRef<HTMLParagraphElement>(null)
  const voiceRef = useRef(voice)

  const step = useSpeechTimeline({
    text,
    timing,
    skip: reducedMotion || revealed || revealedFromOutside,
    onStep: (next) => onStateChange?.({ ...next, length: text.length }),
    onVoice: (speaking) => (speaking ? voice.start() : voice.stop()),
  })

  useEffect(() => {
    voiceRef.current = voice
  })

  // Con movimiento reducido no hay escritura con la que sincronizar la voz:
  // un único fragmento breve acompaña la aparición del texto.
  useEffect(() => {
    if (reducedMotion && autoplay)
      voiceRef.current.fragment(REDUCED_MOTION_FRAGMENT_MS)
  }, [reducedMotion, autoplay])

  // El texto completo se anuncia una vez, al aparecer, y no letra a letra.
  useEffect(() => {
    if (announce && liveRef.current) liveRef.current.textContent = text
  }, [announce, text])

  // «Ver todo» desaparece al completarse: el foco pasa a la acción que lo sustituye.
  useEffect(() => {
    if (!focusDone) return
    // Solo una acción que pueda recibirlo: una inactiva (inert) queda fuera.
    const action = [
      ...(footRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []),
    ].find((element) => !element.closest('[inert]'))
    action?.focus()
  }, [focusDone])

  const typing = step.status !== 'done'

  const revealAll = () => {
    voice.stop()
    setRevealed(true)
    setFocusDone(true)
  }

  const foot = typing ? (
    // La acción final ya ocupa su sitio, invisible e inactiva: al terminar
    // de escribir el pie no crece (también con el texto ampliado).
    <span className={styles.footSlot}>
      <span className={styles.footLayer}>
        <TextLink onClick={revealAll}>Ver todo</TextLink>
      </span>
      {doneAction && (
        <span
          className={styles.footLayer}
          style={{ visibility: 'hidden' }}
          inert
        >
          {doneAction}
        </span>
      )}
    </span>
  ) : doneAction ? (
    <span ref={footRef} style={{ display: 'contents' }}>
      {doneAction}
    </span>
  ) : undefined

  const typed = (
    <div className={styles.type}>
      <SofiDialogText className={styles.ghost} aria-hidden>
        {text}
      </SofiDialogText>
      <SofiDialogText aria-hidden>
        {text.slice(0, step.index)}
        {(step.status === 'typing' || step.status === 'pause') && (
          <span className={styles.caret} />
        )}
      </SofiDialogText>
    </div>
  )

  return (
    <SofiDialog
      size={size}
      nameId={nameId}
      className={className}
      // Con contenido bajo el texto, el pie va entre los dos: «Ver todo» y lo que
      // aparece al terminar quedan junto a lo que se escribe.
      footer={body ? undefined : foot}
    >
      {body ? (
        <>
          {typed}
          {foot && <div className={styles.foot}>{foot}</div>}
          <div className={styles.body}>{body}</div>
        </>
      ) : (
        typed
      )}
      {/* Siempre en la misma posición: si el contenido entra o sale del
          bocadillo (al cruzar un umbral de pantalla), la región se conserva con
          su texto y no se vuelve a anunciar. */}
      <p
        ref={liveRef}
        className={styles.srOnly}
        aria-live={announce ? 'polite' : undefined}
      >
        {announce ? null : text}
      </p>
    </SofiDialog>
  )
}
