import { cx } from '../../../utils/cx'
import {
  formatCharacterCount,
  formatCharacterLimit,
} from '../../../utils/format'
import styles from './Counter.module.scss'

type CounterProps = {
  count: number
  // Límite fijado por la spec del campo: se muestra «x / max».
  max?: number
  id?: string
  className?: string
}

// Informativo: no es una región viva, así no se anuncia en cada pulsación.
export function Counter({ count, max, id, className }: CounterProps) {
  if (max === undefined)
    return (
      <span id={id} className={cx(styles.counter, className)}>
        {formatCharacterCount(count)}
      </span>
    )
  // «x / 500» se lee mal en voz alta: el lector recibe la frase entera.
  return (
    <span id={id} className={cx(styles.counter, className)}>
      <span aria-hidden="true">
        {count} / {max}
      </span>
      <span className={styles.srOnly}>{formatCharacterLimit(count, max)}</span>
    </span>
  )
}
