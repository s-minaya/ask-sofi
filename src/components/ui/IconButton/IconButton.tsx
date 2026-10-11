import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './IconButton.module.scss'

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> & {
  // Siempre lleva nombre accesible: el icono es decorativo.
  label: string
  // Solo si es un interruptor: se anuncia con aria-pressed.
  pressed?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  pressed,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx(styles.button, className)}
      aria-label={label}
      aria-pressed={pressed}
    >
      {children}
    </button>
  )
}
