import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { SofiPortrait, type SofiExpression } from '../SofiPortrait/SofiPortrait'
import type { SofiVisualProps } from '../types'
import styles from './SofiStage.module.scss'

type SofiStageProps = {
  expression: SofiExpression
  // Describe la expresión de Sofi en esta pantalla.
  alt: string
  label?: string
  labelledBy?: string
  // Recurso real en lugar de la expresión provisional (opcional).
  visual?: SofiVisualProps
  className?: string
  children: ReactNode
}

// Donde Sofi lee, responde o pide contexto.
export function SofiStage({
  expression,
  alt,
  label,
  labelledBy,
  visual,
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
        <SofiPortrait
          size={384}
          // Con un recurso real, la expresión provisional (F1, F2) no manda: en reposo, el parpadeo.
          expression={visual ? 'attentive' : expression}
          alt={alt}
          outline
          {...visual}
        />
      </div>
      <div className={styles.dialog}>{children}</div>
    </section>
  )
}
