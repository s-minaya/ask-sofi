import { useId, type ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './OptionGroup.module.scss'

export type OptionGroupOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

export type OptionGroupProps<T extends string> = {
  legend: ReactNode
  options: ReadonlyArray<OptionGroupOption<T>>
  // Sin valor no hay ninguna opción marcada: «sin responder» es un estado propio.
  value: T | undefined
  onChange: (value: T) => void
  // Las opciones se reparten todo el ancho.
  fill?: boolean
  // Rejilla de columnas iguales para textos largos que no caben en una píldora:
  // una opción por fila en estrecho y varias columnas cuando hay sitio.
  grid?: boolean
  className?: string
}

type OptionPillProps = {
  name: string
  value: string
  label: string
  icon?: ReactNode
  checked: boolean
  disabled?: boolean
  onChange?: () => void
  className?: string
  'data-force-state'?: 'hover' | 'focus'
}

// Opción tipo píldora sobre un radio nativo.
export function OptionPill({
  name,
  value,
  label,
  icon,
  checked,
  disabled,
  onChange,
  className,
  ...rest
}: OptionPillProps) {
  return (
    <label className={cx(styles.option, className)} {...rest}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.()}
      />
      {icon}
      {label}
    </label>
  )
}

// Radios nativos dentro de un fieldset: el teclado y los lectores ya saben usarlos.
export function OptionGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  fill = false,
  grid = false,
  className,
}: OptionGroupProps<T>) {
  const name = useId()
  return (
    <fieldset
      className={cx(fill && styles.fill, grid && styles.grid, className)}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <OptionPill
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            icon={option.icon}
            checked={option.value === value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}
