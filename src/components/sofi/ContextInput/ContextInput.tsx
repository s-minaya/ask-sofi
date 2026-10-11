import { useId, type ReactNode } from 'react'
import { Counter } from '../../ui/Counter/Counter'
import { FieldMessage } from '../../ui/FieldMessage/FieldMessage'
import { ScissorsIcon } from '../../ui/icons/icons'
import { HintList } from '../../ui/Indicators/Indicators'
import { cx } from '../../../utils/cx'
import { rem } from '../../../utils/rem'
import styles from './ContextInput.module.scss'

const DEFAULT_HINTS = [
  '¿Qué pasó antes?',
  '¿Cómo suele escribirte?',
  '¿Es su tono de siempre?',
]

type CouponFrameProps = {
  disabled?: boolean
  // Solo para muestras del Design Lab: dibuja el foco sin tenerlo.
  forceFocus?: boolean
  // Sin hueco superior cuando el cupón va solo, sin titular encima.
  standalone?: boolean
  cutSize?: number
  className?: string
  children: ReactNode
  foot?: ReactNode
}

// El cupón de «Recorta y envía a Sofi», con su muesca y su pie de pistas.
export function CouponFrame({
  disabled,
  forceFocus,
  standalone,
  cutSize,
  className,
  children,
  foot,
}: CouponFrameProps) {
  return (
    <div
      className={cx(
        styles.coupon,
        standalone && styles.couponOnly,
        disabled && styles.disabled,
        className,
      )}
      data-force-state={forceFocus ? 'focus' : undefined}
    >
      <p
        className={styles.cut}
        style={cutSize ? { fontSize: rem(cutSize) } : undefined}
      >
        <ScissorsIcon size={standalone ? 14 : 16} />
        Recorta y envía a Sofi
      </p>
      {children}
      {foot && <div className={styles.foot}>{foot}</div>}
    </div>
  )
}

type ContextInputProps = {
  id?: string
  label: ReactNode
  // «outside»: titular del paso encima del cupón. «inside»: etiqueta dentro, como al pedir contexto.
  labelPlacement?: 'outside' | 'inside'
  headingLevel?: 2 | 3
  help?: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hints?: ReadonlyArray<string>
  showCount?: boolean
  rows?: number
  error?: ReactNode
  disabled?: boolean
  className?: string
}

// El contexto es opcional, pero es lo que hace que una lectura sea honesta.
export function ContextInput({
  id,
  label,
  labelPlacement = 'outside',
  headingLevel = 2,
  help,
  value,
  onChange,
  placeholder = 'Por ejemplo: le pregunté si le importaba que el viernes llegara tarde…',
  hints = DEFAULT_HINTS,
  showCount = true,
  rows = 5,
  error,
  disabled = false,
  className,
}: ContextInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const describedBy = [help ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')
  const inside = labelPlacement === 'inside'
  const hasFoot = hints.length > 0 || showCount

  return (
    <div className={cx(styles.field, className)}>
      {!inside && (
        <Heading className={styles.label}>
          <label htmlFor={inputId}>{label}</label>
        </Heading>
      )}
      {help && (
        <p id={helpId} className={styles.help}>
          {help}
        </p>
      )}
      <CouponFrame
        disabled={disabled}
        standalone={inside}
        foot={
          hasFoot ? (
            <>
              {hints.length > 0 && (
                <HintList label="Pistas para el contexto" hints={hints} />
              )}
              {showCount && <Counter count={value.length} />}
            </>
          ) : undefined
        }
      >
        {inside && (
          <label htmlFor={inputId} className={styles.innerLabel}>
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={styles.textarea}
          rows={rows}
          placeholder={placeholder}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </CouponFrame>
      {error && (
        <FieldMessage id={errorId} announce className={styles.error}>
          {error}
        </FieldMessage>
      )}
    </div>
  )
}
