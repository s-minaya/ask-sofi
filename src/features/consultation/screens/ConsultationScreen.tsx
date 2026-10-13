import { useEffect, useRef, type ReactNode, type Ref } from 'react'
import { ContextInput } from '../../../components/sofi/ContextInput/ContextInput'
import { MessageInput } from '../../../components/sofi/MessageBubble/MessageBubble'
import {
  SofiDialog,
  SofiDialogText,
} from '../../../components/sofi/SofiDialog/SofiDialog'
import { SofiPortrait } from '../../../components/sofi/SofiPortrait/SofiPortrait'
import { Button } from '../../../components/ui/Button/Button'
import { LockIcon } from '../../../components/ui/icons/icons'
import { LiveIndicator } from '../../../components/ui/Indicators/Indicators'
import { StepTag, Tag } from '../../../components/ui/Tag/Tag'
import { TextLink } from '../../../components/ui/TextLink/TextLink'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useStackedLayout } from '../../../hooks/useStackedLayout'
import { cx } from '../../../utils/cx'
import { INVITATION_COPY, MOOD_ALT } from '../../partner-profile/profileCopy'
import { visualFor } from '../../partner-profile/sofiVisuals'
import styles from './ConsultationScreen.module.scss'

// En una columna el diálogo es compacto (junto a la insignia) y usa la variante
// corta del Design Lab; a dos columnas, el texto completo.
const LISTEN_TEXT =
  'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente? Pégalo tal cual, que aquí cada punto cuenta.'
const LISTEN_TEXT_SHORT =
  'A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente?'
// Lo que Sofi hace según el momento: escucha el mensaje, o pide contexto.
const LISTENING_LABEL = 'Sofi está escuchando'

type ConsultationScreenProps = {
  message: string
  context: string
  onMessageChange: (value: string) => void
  onContextChange: (value: string) => void
  onSubmit: () => void
  onClear: () => void
  // El error aparece al enviar sin mensaje.
  messageError?: boolean
  // Mientras sale la petición: el botón espera y los campos son de solo lectura.
  submitting?: boolean
  headingRef?: Ref<HTMLHeadingElement>
  submitRef?: Ref<HTMLButtonElement>
  // Hueco para un aviso tras la acción principal.
  after?: ReactNode
  // Primera visita: Sofi abre la consulta con la invitación al expediente. Se
  // asoma sobre su propio bocadillo y sustituye al retrato: es la misma Sofi.
  invitation?: { onOpen: () => void; onDismiss: () => void }
  // Acceso permanente al expediente, en el pie del diálogo de Sofi.
  profileAccess?: { saved: boolean; onOpen: () => void }
}

export function ConsultationScreen({
  message,
  context,
  onMessageChange,
  onContextChange,
  onSubmit,
  onClear,
  messageError = false,
  submitting = false,
  headingRef,
  submitRef,
  after,
  invitation,
  profileAccess,
}: ConsultationScreenProps) {
  const stacked = useStackedLayout()
  const reducedMotion = useReducedMotion()
  const peek = visualFor('inviting', { reducedMotion })
  const ledge = peek.kind === 'image' ? (peek.ledge ?? 1) : 1
  const listenRef = useRef<HTMLSpanElement>(null)
  const wasInviting = useRef(Boolean(invitation))
  const listenLabel = invitation ? INVITATION_COPY.label : LISTENING_LABEL

  // «Ahora no» retira la invitación con el foco dentro: pasa a lo que Sofi dice
  // a continuación, y no se pierde en el documento.
  useEffect(() => {
    if (wasInviting.current && !invitation) listenRef.current?.focus()
    wasInviting.current = Boolean(invitation)
  }, [invitation])

  return (
    <div className={styles.work}>
      <aside
        className={cx(styles.listen, invitation && styles.listenInviting)}
        aria-label={listenLabel}
      >
        <div className={styles.listenDots} aria-hidden="true" />
        <LiveIndicator className={styles.listenTag}>
          {listenLabel}
        </LiveIndicator>
        {invitation ? (
          <div
            className={styles.invite}
            style={{ paddingTop: `calc(var(--peek-size) * ${ledge})` }}
          >
            <SofiPortrait
              size={384}
              image={peek.kind === 'image' ? peek.src : undefined}
              frame={peek.kind === 'image' ? peek.fallback : peek.frame}
              alt={MOOD_ALT.inviting}
              outline
              className={styles.peek}
              style={{ width: 'var(--peek-size)', height: 'var(--peek-size)' }}
            />
            <SofiDialog
              className={cx(styles.listenDialog, styles.inviteDialog)}
            >
              <SofiDialogText className={styles.lead}>
                {INVITATION_COPY.lead}
              </SofiDialogText>
              <SofiDialogText className={styles.leadText}>
                {INVITATION_COPY.text}
              </SofiDialogText>
              <div className={styles.inviteActions}>
                <Button size="sm" onClick={invitation.onOpen}>
                  {INVITATION_COPY.open}
                </Button>
                <TextLink size="sm" onClick={invitation.onDismiss}>
                  {INVITATION_COPY.dismiss}
                </TextLink>
              </div>
            </SofiDialog>
          </div>
        ) : (
          <>
            <SofiPortrait
              size={384}
              expression="attentive"
              outline
              alt="Sofi, atenta a lo que le cuentas"
              className={styles.listenBig}
            />
            {/* Sofi entera, con el busto apoyado en el borde inferior: a un tercio
                del sprite, su silueta (x 49–333, y 22–383 de 384) cabe sin recortes. */}
            <SofiPortrait
              size={128}
              expression="attentive"
              className={styles.listenBadge}
              crop={{
                width: 100,
                height: 130,
                offsetX: 16,
                offsetY: 3,
                background: 'var(--tone-pink-soft)',
                frame: 'sticker',
              }}
            />
            <SofiDialog
              more={!profileAccess}
              className={styles.listenDialog}
              footer={
                profileAccess && (
                  <span className={styles.access}>
                    <Tag tone="lilac">{INVITATION_COPY.tag}</Tag>
                    <TextLink
                      size="sm"
                      continues
                      onClick={profileAccess.onOpen}
                    >
                      {profileAccess.saved
                        ? INVITATION_COPY.openSaved
                        : INVITATION_COPY.openEmpty}
                    </TextLink>
                  </span>
                )
              }
            >
              <SofiDialogText as="blockquote">
                <span
                  ref={listenRef}
                  tabIndex={-1}
                  className={styles.listenText}
                >
                  {stacked ? LISTEN_TEXT_SHORT : LISTEN_TEXT}
                </span>
              </SofiDialogText>
            </SofiDialog>
          </>
        )}
      </aside>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <section className={styles.step}>
          <StepTag step={1} label="El mensaje" />
          <MessageInput
            id="consulta-mensaje"
            label="Pégalo tal cual te llegó"
            help="Con sus puntos, sus mayúsculas y sus emojis: aquí todo es una pista."
            headingRef={headingRef}
            value={message}
            onChange={onMessageChange}
            error={
              messageError
                ? 'Pega el mensaje para que pueda leerlo.'
                : undefined
            }
            disabled={submitting}
          />
        </section>
        <section className={styles.step}>
          <StepTag step={2} label="El contexto · opcional, pero clave" />
          <ContextInput
            id="consulta-contexto"
            label="Y ahora, el salseo"
            help="¿Qué pasó antes del mensaje? ¿Cómo suele escribirte? Cuantos más detalles, mejor lectura."
            value={context}
            onChange={onContextChange}
            disabled={submitting}
          />
        </section>
        <p className={styles.privacy}>
          <LockIcon size={16} />
          <span>
            Al pedir la lectura, el mensaje y el contexto se envían de forma
            temporal para procesarse. No se guardan en ningún servidor.
          </span>
        </p>
        <div className={styles.ctabar}>
          <Button
            ref={submitRef}
            type="submit"
            size="lg"
            arrow
            loading={submitting}
            loadingLabel="Enviando…"
          >
            Leer entre líneas
          </Button>
          <TextLink onClick={onClear}>Borrar todo</TextLink>
        </div>
        {after && <div className={styles.preview}>{after}</div>}
      </form>
    </div>
  )
}
