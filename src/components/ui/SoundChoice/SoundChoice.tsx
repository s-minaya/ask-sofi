import { SoundOffIcon, SoundOnIcon } from '../icons/icons'
import { OptionGroup, type OptionGroupOption } from '../OptionGroup/OptionGroup'

export type SoundChoiceValue = 'off' | 'on'

const OPTIONS: ReadonlyArray<OptionGroupOption<SoundChoiceValue>> = [
  { value: 'off', label: 'Sin sonido', icon: <SoundOffIcon size={18} /> },
  { value: 'on', label: 'Con sonido', icon: <SoundOnIcon size={18} /> },
]

type SoundChoiceProps = {
  value: SoundChoiceValue
  onChange: (value: SoundChoiceValue) => void
  fill?: boolean
  className?: string
}

// La elección de sonido antes de entrar. Elegir no reproduce nada:
// el audio se prepara al pulsar «Empezar».
export function SoundChoice({
  value,
  onChange,
  fill,
  className,
}: SoundChoiceProps) {
  return (
    <OptionGroup
      legend="Antes de entrar: ¿con sonido?"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      fill={fill}
      className={className}
    />
  )
}
