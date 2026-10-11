import { useId, type ReactNode, type Ref } from 'react'
import { Counter } from '../../ui/Counter/Counter'
import { FieldMessage } from '../../ui/FieldMessage/FieldMessage'
import { cx } from '../../../utils/cx'
import styles from './MessageBubble.module.scss'

// Cola pixel de la burbuja. Exportada para el catálogo de iconos del Design Lab.
export function BubbleTail({ className }: { className?: string }) {
  return (
    <svg
      className={cx(styles.tail, className)}
      viewBox="0 0 6 5"
      shapeRendering="crispEdges"
      aria-hidden
      focusable={false}
    >
      <path className={styles.tailEdge} d="M0 0h6v1H5v1H4v1H3v1H2v1H0z" />
      <path className={styles.tailPaper} d="M1 0h4v1H4v1H3v1H2v1H1z" />
    </svg>
  )
}

type BubbleFrameProps = {
  tone?: 'default' | 'invalid' | 'disabled'
  // Solo para muestras del Design Lab: dibuja el foco sin tenerlo.
  forceFocus?: boolean
  className?: string
  paperClassName?: string
  children: ReactNode
}

// Marco de burbuja pixel con su cola: el borde se tiñe de cereza o de gris según el estado.
export function BubbleFrame({
  tone = 'default',
  forceFocus,
  className,
  paperClassName,
  children,
}: BubbleFrameProps) {
  return (
    <div
      className={cx(
        styles.wrap,
        styles.input,
        tone === 'invalid' && styles.invalid,
        tone === 'disabled' && styles.disabled,
        className,
      )}
      data-force-state={forceFocus ? 'focus' : undefined}
    >
      <div className={styles.edge}>
        <div className={cx(styles.paper, paperClassName)}>{children}</div>
      </div>
      <BubbleTail />
    </div>
  )
}

type MessageBubbleProps = {
  message: string
  size?: 'md' | 'lg'
  className?: string
}

// El mensaje recibido, citado tal cual para saber qué se está leyendo.
export function MessageBubble({
  message,
  size = 'md',
  className,
}: MessageBubbleProps) {
  return (
    <div
      className={cx(
        styles.quote,
        size === 'lg' && styles.quoteLarge,
        className,
      )}
    >
      <div className={styles.edge}>
        <p className={styles.paper}>{message}</p>
      </div>
      <BubbleTail />
    </div>
  )
}

type MessageInputProps = {
  id?: string
  label: ReactNode
  help?: ReactNode
  // La etiqueta hace de titular del paso: así se puede navegar por titulares.
  headingLevel?: 2 | 3
  headingRef?: Ref<HTMLHeadingElement>
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: ReactNode
  // Mientras Sofi lee, el mensaje queda de solo lectura.
  disabled?: boolean
  className?: string
}

// Un TextArea con piel de burbuja de chat pixel.
export function MessageInput({
  id,
  label,
  help,
  headingLevel = 2,
  headingRef,
  value,
  onChange,
  placeholder = 'Pega aquí el mensaje, con sus puntos y sus emojis',
  error,
  disabled = false,
  className,
}: MessageInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const describedBy = [help ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx(styles.field, className)}>
      <Heading
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className={styles.label}
      >
        <label htmlFor={inputId}>{label}</label>
      </Heading>
      {help && (
        <p id={helpId} className={styles.help}>
          {help}
        </p>
      )}
      <BubbleFrame tone={error ? 'invalid' : disabled ? 'disabled' : 'default'}>
        <textarea
          id={inputId}
          className={styles.textarea}
          rows={2}
          placeholder={placeholder}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <p className={styles.meta}>
          <Counter count={value.length} />
        </p>
      </BubbleFrame>
      {error && (
        <FieldMessage id={errorId} announce className={styles.error}>
          {error}
        </FieldMessage>
      )}
    </div>
  )
}
