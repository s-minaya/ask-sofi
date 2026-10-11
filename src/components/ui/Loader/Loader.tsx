import { cx } from '../../../utils/cx'
import styles from './Loader.module.scss'

// Decorativo: el estado lo anuncia un texto con role="status" junto a él.
export function Loader({ className }: { className?: string }) {
  return (
    <div className={cx(styles.loader, className)} aria-hidden="true">
      <i />
    </div>
  )
}
