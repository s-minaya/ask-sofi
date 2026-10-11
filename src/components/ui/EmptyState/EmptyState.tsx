import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './EmptyState.module.scss'

type EmptyStateProps = {
  title: ReactNode
  text?: ReactNode
  illustration?: ReactNode
  action?: ReactNode
  titleAs?: 'h2' | 'h3' | 'p'
  className?: string
}

export function EmptyState({
  title,
  text,
  illustration,
  action,
  titleAs: Title = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)}>
      {illustration}
      <div className={styles.copy}>
        <Title className={styles.title}>{title}</Title>
        {text && <p className={styles.text}>{text}</p>}
      </div>
      {action}
    </div>
  )
}
