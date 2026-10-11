import { cx } from '../../../utils/cx'
import { formatCharacterCount } from '../../../utils/format'
import styles from './Counter.module.scss'

type CounterProps = {
  count: number
  id?: string
  className?: string
}

// Informativo: no es una región viva, así no se anuncia en cada pulsación.
export function Counter({ count, id, className }: CounterProps) {
  return (
    <span id={id} className={cx(styles.counter, className)}>
      {formatCharacterCount(count)}
    </span>
  )
}
