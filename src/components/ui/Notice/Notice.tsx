import { useId, type ReactNode, type Ref } from 'react'
import { cx } from '../../../utils/cx'
import styles from './Notice.module.scss'

export type NoticeTone =
  'attention' | 'info' | 'soft' | 'pink' | 'ink' | 'danger'

type NoticeProps = {
  tone: NoticeTone
  kicker?: ReactNode
  title: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4'
  titleClassName?: string
  titleId?: string
  // Para llevar el foco al titular cuando el aviso aparece tras una acción.
  titleRef?: Ref<HTMLHeadingElement>
  // Un error tras una acción se inserta con role="alert"; un aviso que no interrumpe, con "status".
  role?: 'alert' | 'status'
  className?: string
  children?: ReactNode
}

export function Notice({
  tone,
  kicker,
  title,
  titleAs: Title = 'h3',
  titleClassName,
  titleId,
  titleRef,
  role,
  className,
  children,
}: NoticeProps) {
  const autoId = useId()
  const headingId = titleId ?? autoId
  return (
    <section
      className={cx(styles.notice, styles[tone], className)}
      aria-labelledby={headingId}
      role={role}
    >
      {kicker && <p className={styles.kicker}>{kicker}</p>}
      <Title
        ref={titleRef}
        id={headingId}
        className={cx(styles.title, titleClassName)}
        tabIndex={titleRef ? -1 : undefined}
      >
        {title}
      </Title>
      {children}
    </section>
  )
}

export function NoticeText({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <p className={cx(styles.text, className)}>{children}</p>
}

export function NoticeRows({
  items,
  className,
}: {
  items: ReadonlyArray<ReactNode>
  className?: string
}) {
  return (
    <ul className={cx(styles.rows, className)}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

export function NoticeActions({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cx(styles.actions, className)}>{children}</div>
}

type InlineNoticeProps = {
  tone?: 'attention' | 'plain'
  icon?: ReactNode
  role?: 'status' | 'alert'
  className?: string
  children: ReactNode
}

export function InlineNotice({
  tone = 'attention',
  icon,
  role,
  className,
  children,
}: InlineNoticeProps) {
  return (
    <div
      className={cx(
        styles.inline,
        tone === 'plain' && styles.inlinePlain,
        className,
      )}
      role={role}
    >
      {icon}
      {children}
    </div>
  )
}
