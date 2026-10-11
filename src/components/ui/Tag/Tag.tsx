import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './Tag.module.scss'

export type TagTone = 'ink' | 'pink' | 'butter' | 'lilac' | 'cherry' | 'outline'

type TagProps = {
  tone?: TagTone
  className?: string
  children: ReactNode
}

export function Tag({ tone = 'ink', className, children }: TagProps) {
  return (
    <span className={cx(styles.tag, tone !== 'ink' && styles[tone], className)}>
      {children}
    </span>
  )
}

type KickerProps = {
  as?: 'p' | 'span'
  id?: string
  className?: string
  children: ReactNode
}

export function Kicker({
  as: Element = 'span',
  id,
  className,
  children,
}: KickerProps) {
  return (
    <Element id={id} className={cx(styles.kicker, className)}>
      {children}
    </Element>
  )
}

type KickerRowProps = {
  tag?: ReactNode
  tagTone?: TagTone
  kicker?: ReactNode
  className?: string
  children?: ReactNode
}

// Etiqueta + antetítulo en una línea, como en la portada de una revista.
export function KickerRow({
  tag,
  tagTone,
  kicker,
  className,
  children,
}: KickerRowProps) {
  return (
    <p className={cx(styles.row, className)}>
      {tag && <Tag tone={tagTone}>{tag}</Tag>}
      {kicker && <Kicker>{kicker}</Kicker>}
      {children}
    </p>
  )
}

// «Paso 1 · El mensaje»: el número del paso y lo que se pide en él.
export function StepTag({
  step,
  label,
  className,
}: {
  step: number
  label: ReactNode
  className?: string
}) {
  return <KickerRow tag={`Paso ${step}`} kicker={label} className={className} />
}
