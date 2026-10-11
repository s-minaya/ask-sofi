import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { SofiPortrait, type SofiExpression } from '../SofiPortrait/SofiPortrait'
import styles from './SofiStage.module.scss'

type SofiStageProps = {
  expression: SofiExpression
  // Describe la expresión de Sofi en esta pantalla.
  alt: string
  label?: string
  labelledBy?: string
  className?: string
  children: ReactNode
}

// Donde Sofi lee, responde o pide contexto.
export function SofiStage({
  expression,
  alt,
  label,
  labelledBy,
  className,
  children,
}: SofiStageProps) {
  return (
    <section
      className={cx(styles.stage, className)}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
    >
      <div className={styles.sofi}>
        <SofiPortrait size={384} expression={expression} alt={alt} outline />
      </div>
      <div className={styles.dialog}>{children}</div>
    </section>
  )
}
