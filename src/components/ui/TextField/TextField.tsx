import { useId, type ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { Counter } from '../Counter/Counter'
import { FieldMessage } from '../FieldMessage/FieldMessage'
import styles from './TextField.module.scss'

type FieldProps = {
  label: ReactNode
  help?: ReactNode
  // El error aparece al enviar, no mientras se escribe, y se va en cuanto el campo es válido.
  error?: ReactNode
  showCount?: boolean
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  className?: string
  // Solo para muestras del Design Lab: fuerza el aspecto de hover o foco.
  forceState?: 'hover' | 'focus'
}

type ControlProps = {
  id: string
  className: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'data-force-state'?: 'hover' | 'focus'
}

type FieldFrameProps = FieldProps & {
  renderControl: (props: ControlProps) => ReactNode
}

function FieldFrame({
  label,
  help,
  error,
  showCount = false,
  value,
  id,
  className,
  forceState,
  renderControl,
}: FieldFrameProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  const helpId = `${controlId}-help`
  const errorId = `${controlId}-error`
  const describedBy = [help ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={controlId} className={styles.label}>
        {label}
      </label>
      {help && (
        <p id={helpId} className={styles.help}>
          {help}
        </p>
      )}
      {renderControl({
        id: controlId,
        className: styles.control,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'data-force-state': forceState,
      })}
      {(error || showCount) && (
        <div className={styles.footer}>
          {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
          {showCount && (
            <Counter count={value.length} className={styles.count} />
          )}
        </div>
      )}
    </div>
  )
}

export function TextField(props: FieldProps) {
  const { value, onChange, disabled, placeholder } = props
  return (
    <FieldFrame
      {...props}
      renderControl={(control) => (
        <input
          {...control}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    />
  )
}

export function TextArea({
  rows = 3,
  ...props
}: FieldProps & { rows?: number }) {
  const { value, onChange, disabled, placeholder } = props
  return (
    <FieldFrame
      {...props}
      renderControl={(control) => (
        <textarea
          {...control}
          rows={rows}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    />
  )
}
