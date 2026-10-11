import { cx } from '../../../utils/cx'
import styles from './ConfidenceMeter.module.scss'
import { METER_CELLS, meterCells } from './meterCells'

type ConfidenceMeterProps = {
  percentage: number
  className?: string
}

// Decorativo: lo que se lee es el número escrito al lado.
export function ConfidenceMeter({
  percentage,
  className,
}: ConfidenceMeterProps) {
  const hidden = 100 - (meterCells(percentage) * 100) / METER_CELLS
  return (
    <div className={cx(styles.meter, className)} aria-hidden="true">
      <span style={{ clipPath: `inset(0 ${hidden}% 0 0)` }} />
    </div>
  )
}
