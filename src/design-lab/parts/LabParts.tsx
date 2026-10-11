import { useId, type CSSProperties, type ReactNode } from 'react'
import {
  SegmentedControl,
  type SegmentOption,
} from '../../components/ui/SegmentedControl/SegmentedControl'
import { KickerRow } from '../../components/ui/Tag/Tag'
import { cx } from '../../utils/cx'
import { rem } from '../../utils/rem'
import styles from './LabParts.module.scss'

type JumpLink = {
  href: string
  num: string
  label: string
  onClick?: () => void
}

type LabMastProps = {
  tag: string
  kicker: string
  title: string
  deck: ReactNode
  jumps?: ReadonlyArray<JumpLink>
  aside?: ReactNode
  titleId: string
}

export function LabMast({
  tag,
  kicker,
  title,
  deck,
  jumps,
  aside,
  titleId,
}: LabMastProps) {
  return (
    <section className={cx(styles.mast, styles.wrap)} aria-labelledby={titleId}>
      <div>
        <KickerRow tag={tag} kicker={kicker} />
        <h1 id={titleId} className={styles.h1}>
          {title}
        </h1>
        <p className={styles.deck}>{deck}</p>
        {jumps && (
          <nav className={styles.jumps} aria-label="En esta sección">
            {jumps.map((jump) => (
              <a key={jump.href} className={styles.jump} href={jump.href}>
                <b>{jump.num}</b> {jump.label}
              </a>
            ))}
          </nav>
        )}
      </div>
      {aside}
    </section>
  )
}

type LabSpecProps = {
  id: string
  kicker: string
  title: string
  desc?: ReactNode
  codes?: ReactNode
  children: ReactNode
}

// Ficha de laboratorio: antetítulo, nombre, descripción y el código que la implementa.
export function LabSpec({
  id,
  kicker,
  title,
  desc,
  codes,
  children,
}: LabSpecProps) {
  const headingId = `${id}-h`
  return (
    <section
      id={id}
      className={cx(styles.spec, styles.wrap)}
      aria-labelledby={headingId}
    >
      <div className={styles.specHead}>
        <div>
          <p className={styles.specKicker}>{kicker}</p>
          <h2 id={headingId} className={styles.specTitle}>
            {title}
          </h2>
          {desc && <p className={styles.specDesc}>{desc}</p>}
        </div>
        {codes && <div className={styles.codes}>{codes}</div>}
      </div>
      {children}
    </section>
  )
}

export function LabJumpLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a className={styles.jump} href={href} style={{ minHeight: '1.75rem' }}>
      {children}
    </a>
  )
}

export function LabCode({ children }: { children: ReactNode }) {
  return <span className={styles.code}>{children}</span>
}

export function LabCodes({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={cx(styles.codes, className)}>{children}</p>
}

export function LabProv({ children }: { children: ReactNode }) {
  return <span className={styles.prov}>{children}</span>
}

type LabCapProps = {
  children: ReactNode
  as?: 'span' | 'h3'
  style?: CSSProperties
}

export function LabCap({ children, as: Element = 'span', style }: LabCapProps) {
  return (
    <Element className={styles.cap} style={style}>
      {children}
    </Element>
  )
}

export function LabNote({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <p className={cx(styles.note, className)} style={style}>
      {children}
    </p>
  )
}

export function LabSub({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <h3 className={styles.sub} style={style}>
      {children}
    </h3>
  )
}

export function LabRow({
  children,
  style,
  className,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={cx(styles.row, className)} style={style}>
      {children}
    </div>
  )
}

export function LabUses({
  items,
  style,
}: {
  items: ReadonlyArray<ReactNode>
  style?: CSSProperties
}) {
  return (
    <ul className={styles.uses} style={style}>
      {items.map((item, index) => (
        // Un único hijo por fila: así un código en línea no salta a otra celda de la rejilla.
        <li key={index}>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function LabSplit({ children }: { children: ReactNode }) {
  return <div className={styles.split}>{children}</div>
}

export function LabPanel({ children }: { children: ReactNode }) {
  return <div className={styles.panel}>{children}</div>
}

type LabStageProps = {
  plain?: boolean
  dots?: boolean
  maxWidth?: string
  className?: string
  style?: CSSProperties
  innerClassName?: string
  innerStyle?: CSSProperties
  children: ReactNode
}

export function LabStage({
  plain,
  dots,
  maxWidth,
  className,
  style,
  innerClassName,
  innerStyle,
  children,
}: LabStageProps) {
  return (
    <div
      className={cx(
        styles.stage,
        plain && styles.stagePlain,
        dots && styles.stageDots,
        className,
      )}
      style={style}
    >
      <div
        className={cx(styles.stageInner, innerClassName)}
        style={{ maxWidth, ...innerStyle }}
      >
        {children}
      </div>
    </div>
  )
}

type LabGridProps = {
  as?: 'ul' | 'div'
  min?: number
  cellPadding?: string
  cellBackground?: string
  // Muestras de estados forzados: ni se enfocan ni se anuncian.
  inert?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function LabGrid({
  as: Element = 'div',
  min,
  cellPadding,
  cellBackground,
  inert,
  className,
  style,
  children,
}: LabGridProps) {
  const vars = {
    ...(min ? { '--lab-cell-min': rem(min) } : {}),
    ...(cellPadding ? { '--lab-cell-padding': cellPadding } : {}),
    ...(cellBackground ? { '--lab-cell-bg': cellBackground } : {}),
    ...style,
  } as CSSProperties
  return (
    <Element className={cx(styles.grid, className)} style={vars} inert={inert}>
      {children}
    </Element>
  )
}

export function LabPlaceholder({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className={styles.placeholder} style={style}>
      {children}
    </div>
  )
}

export function LabToolbar({ children }: { children: ReactNode }) {
  return <div className={cx(styles.toolbar, styles.wrap)}>{children}</div>
}

type LabChoiceProps<T extends string> = {
  label: string
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  stacked?: boolean
  hint?: ReactNode
}

// Selector segmentado con su etiqueta visible, para los controles del laboratorio.
export function LabChoice<T extends string>({
  label,
  options,
  value,
  onChange,
  stacked,
  hint,
}: LabChoiceProps<T>) {
  const labelId = useId()
  return (
    <div className={cx(styles.group, stacked && styles.groupStacked)}>
      <span id={labelId} className={styles.groupLabel}>
        {label}
      </span>
      <SegmentedControl
        labelledBy={labelId}
        options={options}
        value={value}
        onChange={onChange}
      />
      {hint && <span className={styles.groupHint}>{hint}</span>}
    </div>
  )
}

export function LabGroupLabel({
  id,
  children,
}: {
  id?: string
  children: ReactNode
}) {
  return (
    <span id={id} className={styles.groupLabel}>
      {children}
    </span>
  )
}

type LabRangeProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

export function LabRange({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: LabRangeProps) {
  const id = useId()
  return (
    <div className={styles.field}>
      <div className={styles.fieldTop}>
        <label className={styles.fieldLabel} htmlFor={id}>
          {label}
        </label>
        <output className={styles.fieldValue} htmlFor={id}>
          {display}
        </output>
      </div>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export function LabCheck({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

export function LabReadout({
  rows,
}: {
  rows: ReadonlyArray<[string, ReactNode]>
}) {
  return (
    <dl className={styles.readout}>
      {rows.map(([term, value]) => (
        <div key={term} style={{ display: 'contents' }}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
