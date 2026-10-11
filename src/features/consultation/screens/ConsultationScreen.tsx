import type { ReactNode, Ref } from 'react'
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
import { StepTag } from '../../../components/ui/Tag/Tag'
import { TextLink } from '../../../components/ui/TextLink/TextLink'
import styles from './ConsultationScreen.module.scss'

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
}: ConsultationScreenProps) {
  return (
    <div className={styles.work}>
      <aside className={styles.listen} aria-label="Sofi te escucha">
        <div className={styles.listenDots} aria-hidden="true" />
        <LiveIndicator className={styles.listenTag}>
          Sofi está escuchando
        </LiveIndicator>
        <SofiPortrait
          size={384}
          expression="attentive"
          outline
          alt="Sofi, atenta a lo que le cuentas"
          className={styles.listenBig}
        />
        <SofiPortrait
          size={192}
          expression="attentive"
          className={styles.listenBadge}
          crop={{
            width: 92,
            height: 92,
            offsetX: 50,
            offsetY: 36,
            background: 'var(--tone-pink-soft)',
            frame: 'sticker',
          }}
        />
        <SofiDialog more className={styles.listenDialog}>
          <SofiDialogText as="blockquote">
            A ver, cuéntamelo todo. ¿Qué te ha escrito exactamente? Pégalo tal
            cual, que aquí cada punto cuenta.
          </SofiDialogText>
        </SofiDialog>
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
