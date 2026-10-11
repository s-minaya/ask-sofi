import type { CSSProperties, ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { rem } from '../../../utils/rem'
import styles from './Burst.module.scss'

type BurstProps = {
  kicker: ReactNode
  // Sin texto principal, el estallido solo lleva el antetítulo (muestras de inclinación).
  children?: ReactNode
  tone?: 'butter' | 'pink' | 'lilac'
  // Medidas de diseño en px, que se emiten en rem; si no se dan, las fija el CSS de quien lo coloca.
  size?: number
  rotate?: number
  kickerSize?: number
  mainSize?: number
  // 900 para cifras y palabras sueltas; 700 para apartes entre paréntesis.
  mainWeight?: 700 | 900
  mainGap?: number
  className?: string
}

export function Burst({
  kicker,
  children,
  tone = 'butter',
  size,
  rotate,
  kickerSize,
  mainSize,
  mainWeight,
  mainGap,
  className,
}: BurstProps) {
  const style: Record<string, string | number> = {}
  if (size !== undefined) style['--burst-size'] = rem(size)
  if (rotate !== undefined) style['--burst-rotate'] = `${rotate}deg`
  if (kickerSize !== undefined) style['--burst-kicker-size'] = rem(kickerSize)
  if (mainSize !== undefined) style['--burst-main-size'] = rem(mainSize)
  if (mainWeight !== undefined) style['--burst-main-weight'] = mainWeight
  if (mainGap !== undefined) style['--burst-main-gap'] = rem(mainGap)

  return (
    <div
      className={cx(styles.burst, tone !== 'butter' && styles[tone], className)}
      style={style as CSSProperties}
    >
      <p className={styles.content}>
        <span className={styles.kicker}>{kicker}</span>
        {children != null && <span className={styles.main}>{children}</span>}
      </p>
    </div>
  )
}
