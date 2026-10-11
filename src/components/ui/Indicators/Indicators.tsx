import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { LiveSquareIcon } from '../icons/icons'
import { Tag } from '../Tag/Tag'
import styles from './Indicators.module.scss'

// Sofi atenta: el cuadrado es decorativo, el estado lo dice el texto.
export function LiveIndicator({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cx(styles.live, className)}>
      <Tag>{children}</Tag>
      <LiveSquareIcon className={styles.blink} />
    </p>
  )
}

type HintListProps = {
  label: string
  hints: ReadonlyArray<string>
  className?: string
}

export function HintList({ label, hints, className }: HintListProps) {
  return (
    <ul className={cx(styles.hints, className)} aria-label={label}>
      {hints.map((hint) => (
        <li key={hint} className={styles.hint}>
          {hint}
        </li>
      ))}
    </ul>
  )
}

type ClueListProps = {
  clues: ReadonlyArray<string>
  label?: string
  className?: string
}

export function ClueList({
  clues,
  label = 'Pistas',
  className,
}: ClueListProps) {
  return (
    <p className={cx(styles.clues, className)}>
      <span className={styles.cluesLabel}>{label}</span>
      {clues.map((clue) => (
        <span key={clue} className={styles.clue}>
          {clue}
        </span>
      ))}
    </p>
  )
}

type PipsProps = {
  filled: number
  total?: number
}

// Los cuadritos solo ayudan a escanear: el nivel se lee en el texto.
export function Pips({ filled, total = 3 }: PipsProps) {
  return (
    <span className={styles.pips} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <i key={index} className={index < filled ? styles.pipOn : undefined} />
      ))}
    </span>
  )
}

type BadgeProps = {
  tone?: 'plain' | 'fill' | 'warn'
  pips?: PipsProps
  as?: 'span' | 'li'
  className?: string
  children: ReactNode
}

export function Badge({
  tone = 'plain',
  pips,
  as: Element = 'span',
  className,
  children,
}: BadgeProps) {
  return (
    <Element
      className={cx(
        styles.badge,
        tone === 'fill' && styles.badgeFill,
        tone === 'warn' && styles.badgeWarn,
        className,
      )}
    >
      {pips && <Pips {...pips} />}
      {children}
    </Element>
  )
}
