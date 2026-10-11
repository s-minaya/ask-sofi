import type { CSSProperties, ReactNode } from 'react'
import { MoreIcon } from '../../ui/icons/icons'
import { cx } from '../../../utils/cx'
import styles from './SofiDialog.module.scss'

export type SofiDialogSize = 'lg' | 'md' | 'sm'

type SofiDialogProps = {
  size?: SofiDialogSize
  name?: string
  // Si se da, el diálogo toma su nombre de la pestaña («Sofi»).
  nameId?: string
  more?: boolean
  footer?: ReactNode
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function SofiDialog({
  size = 'lg',
  name = 'Sofi',
  nameId,
  more = false,
  footer,
  className,
  style,
  children,
}: SofiDialogProps) {
  return (
    <figure
      className={cx(
        styles.dialog,
        size === 'md' && styles.md,
        size === 'sm' && styles.sm,
        className,
      )}
      style={style}
      aria-labelledby={nameId}
    >
      <figcaption className={styles.name}>
        {nameId ? <span id={nameId}>{name}</span> : name}
      </figcaption>
      {children}
      {footer && <div className={styles.foot}>{footer}</div>}
      {more && <MoreIcon className={styles.more} />}
    </figure>
  )
}

type SofiDialogTextProps = {
  as?: 'p' | 'blockquote'
  className?: string
  'aria-hidden'?: boolean
  children: ReactNode
}

// Lo que dice Sofi, con el cuerpo de letra del diálogo.
export function SofiDialogText({
  as: Element = 'p',
  className,
  children,
  ...rest
}: SofiDialogTextProps) {
  return (
    <Element className={cx(styles.text, className)} {...rest}>
      {children}
    </Element>
  )
}
