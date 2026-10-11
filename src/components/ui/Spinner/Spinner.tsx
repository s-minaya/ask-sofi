import { cx } from '../../../utils/cx'
import styles from './Spinner.module.scss'

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cx(styles.spinner, className)} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}
