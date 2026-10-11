import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from '../../../utils/cx'
import { Spinner } from '../Spinner/Spinner'
import styles from './Button.module.scss'

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled'
> & {
  variant?: 'primary' | 'secondary'
  size?: 'lg' | 'md' | 'sm'
  block?: boolean
  // Todo el ancho solo cuando la interfaz está en su versión compacta.
  fluid?: boolean
  // Mantiene el ancho, cambia el texto y se anuncia con aria-busy.
  loading?: boolean
  loadingLabel?: ReactNode
  // aria-disabled en lugar de disabled: el botón sigue siendo descubrible con teclado.
  disabled?: boolean
  icon?: ReactNode
  arrow?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  fluid = false,
  loading = false,
  loadingLabel,
  disabled = false,
  icon,
  arrow = false,
  type = 'button',
  className,
  children,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const inert = loading || disabled

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inert) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={cx(
        styles.button,
        size === 'lg' && styles.lg,
        size === 'sm' && styles.sm,
        variant === 'secondary' && styles.secondary,
        block && styles.block,
        fluid && styles.fluid,
        className,
      )}
      aria-busy={loading || undefined}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
          {arrow && (
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          )}
        </>
      )}
    </button>
  )
}
