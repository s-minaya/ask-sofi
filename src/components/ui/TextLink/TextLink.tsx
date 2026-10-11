import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'
import { cx } from '../../../utils/cx'
import { MoreIcon } from '../icons/icons'
import styles from './TextLink.module.scss'

type CommonProps = {
  size?: 'md' | 'sm'
  // Cursor pixel que invita a seguir leyendo («Ver las versiones»).
  continues?: boolean
  children: ReactNode
}

type AsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

export type TextLinkProps = AsLink | AsButton

// Un enlace si navega, un botón si actúa: el elemento nativo correcto en cada caso.
export function TextLink({
  size = 'md',
  continues = false,
  className,
  children,
  ...props
}: TextLinkProps) {
  const classes = cx(styles.link, size === 'sm' && styles.sm, className)
  const content = (
    <>
      {children}
      {continues && <MoreIcon className={styles.trail} />}
    </>
  )

  if (props.href !== undefined) {
    return (
      <a {...props} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" {...props} className={classes}>
      {content}
    </button>
  )
}
