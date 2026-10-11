import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import { ErrorPixelIcon } from '../icons/icons'
import styles from './FieldMessage.module.scss'

type FieldMessageProps = {
  id: string
  children: ReactNode
  // Solo los errores que aparecen tras una acción se anuncian al momento.
  announce?: boolean
  className?: string
}

export function FieldMessage({
  id,
  children,
  announce = false,
  className,
}: FieldMessageProps) {
  return (
    <p
      id={id}
      className={cx(styles.error, className)}
      role={announce ? 'alert' : undefined}
    >
      <ErrorPixelIcon />
      {children}
    </p>
  )
}
