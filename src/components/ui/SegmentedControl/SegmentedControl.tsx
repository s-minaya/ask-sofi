import type { ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './SegmentedControl.module.scss'

export type SegmentOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

export type SegmentedControlProps<T extends string> = {
  // Nombre del grupo: visible fuera (labelledBy) o solo para lectores (label).
  label?: string
  labelledBy?: string
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  display?: 'text' | 'icon' | 'responsive'
  nowrap?: boolean
  className?: string
}

// Botones con aria-pressed dentro de un grupo con nombre.
export function SegmentedControl<T extends string>({
  label,
  labelledBy,
  options,
  value,
  onChange,
  display = 'text',
  nowrap = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cx(
        styles.group,
        nowrap && styles.nowrap,
        display === 'icon' && styles.iconOnly,
        display === 'text' && styles.textOnly,
        display === 'responsive' && styles.responsive,
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <span className={styles.icon}>{option.icon}</span>}
          <span className={styles.text}>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
