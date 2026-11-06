import type { Ref } from 'react'
import { Loader } from '../../ui/Loader/Loader'
import { TextLink } from '../../ui/TextLink/TextLink'
import { cx } from '../../../utils/cx'
import { formatCharacterCount } from '../../../utils/format'
import { MessageBubble } from '../MessageBubble/MessageBubble'
import styles from './ProcessingState.module.scss'

// Umbral provisional del aviso de carga lenta: se revisará con latencias reales.
export const PROVISIONAL_SLOW_THRESHOLD_MS = 6000

// Lo que dice Sofi mientras lee. El aviso de carga lenta es provisional.
export const PROCESSING_LINES = {
  normal:
    'Dame un segundo, que esto tiene miga: estoy mirando cada punto y cada coma.',
  slow: 'Está tardando más de lo normal. Puedes esperar o cancelar: tu mensaje no se pierde.',
} as const

// Cuando el resultado ya llegó pero aún no se presenta (retención del primer ciclo, catálogo
// §6.4), la operación ha terminado: lo pendiente es solo enseñarlo. Ninguna parte de la pantalla
// puede decir que Sofi sigue procesando. Copy provisional: la etiqueta de actividad definitiva y su
// texto son de T068/AV1.
export const READY_COPY = {
  title: 'Ya tengo tu lectura',
  status: 'Ya la he leído: ahora te la enseño.',
  // Rótulo sobre el mensaje, donde antes decía «Sofi está leyendo».
  kicker: 'Lectura lista',
  // Nombre accesible del escenario de Sofi y lo que dice en el diálogo.
  stageLabel: 'Sofi tiene tu lectura',
  line: 'Ya está. Dame un segundo y te lo cuento.',
} as const

export function contextSummary(context: string): string {
  return context.trim()
    ? `Con contexto · ${formatCharacterCount(context.length)}`
    : 'Sin contexto'
}

type ProcessingStateProps = {
  message: string
  context: string
  slow?: boolean
  // El resultado ya llegó y solo falta presentarlo: no se afirma que se siga procesando.
  resultReady?: boolean
  onCancel: () => void
  titleAs?: 'h1' | 'h2'
  titleRef?: Ref<HTMLHeadingElement>
  className?: string
}

// Mientras Sofi lee: qué está pasando, la barra de celdas y la salida.
export function ProcessingState({
  message,
  context,
  slow = false,
  resultReady = false,
  onCancel,
  titleAs: Title = 'h1',
  titleRef,
  className,
}: ProcessingStateProps) {
  return (
    <div className={cx(styles.state, className)}>
      <div className={styles.main}>
        <Title
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className={styles.title}
        >
          {resultReady ? READY_COPY.title : 'Leyendo entre líneas…'}
        </Title>
        {/* Un único estado anunciado; si tarda, se anuncia una vez el aviso de carga lenta. Con el
            resultado ya recibido manda este: lo que llegó no tarda. */}
        <p role="status" className={styles.status}>
          {resultReady
            ? READY_COPY.status
            : slow
              ? 'Está tardando más de lo normal. Tu mensaje no se pierde.'
              : 'Sofi está leyendo tu mensaje.'}
        </p>
        {/* La barra de actividad dejaría de ser verdad: no hay nada procesándose. */}
        {!resultReady && <Loader className={styles.loader} />}
      </div>
      <div className={styles.reading}>
        <p className={styles.kicker}>
          {resultReady ? READY_COPY.kicker : 'Sofi está leyendo'}
        </p>
        <MessageBubble message={message} />
        <p className={styles.summary}>{contextSummary(context)}</p>
        <p className={styles.cancel}>
          <TextLink onClick={onCancel}>Cancelar</TextLink>
        </p>
      </div>
    </div>
  )
}
