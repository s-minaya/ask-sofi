import type { AnchorHTMLAttributes } from 'react'
import { cx } from '../../../utils/cx'
import styles from './SkipLink.module.scss'

type SkipLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export function SkipLink({
  href,
  className,
  children = 'Saltar al contenido',
  ...rest
}: SkipLinkProps) {
  return (
    <a {...rest} href={href} className={cx(styles.skip, className)}>
      {children}
    </a>
  )
}
