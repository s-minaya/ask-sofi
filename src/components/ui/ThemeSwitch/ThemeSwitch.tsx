import { useTheme } from '../../../hooks/useTheme'
import type { ThemePreference } from '../../../infrastructure/storage/themePreferenceStorage'
import { MoonIcon, SunIcon, SystemIcon } from '../icons/icons'
import {
  SegmentedControl,
  type SegmentOption,
} from '../SegmentedControl/SegmentedControl'

const OPTIONS: ReadonlyArray<SegmentOption<ThemePreference>> = [
  { value: 'light', label: 'Claro', icon: <SunIcon size={18} /> },
  { value: 'dark', label: 'Oscuro', icon: <MoonIcon size={18} /> },
  { value: 'system', label: 'Sistema', icon: <SystemIcon size={18} /> },
]

type ThemeSwitchProps = {
  // Completo con texto, compacto con iconos o según el ancho de la cabecera.
  display?: 'text' | 'icon' | 'responsive'
  className?: string
}

// «Sistema» existe en todos los tamaños: en estrecho, como tercer icono.
export function ThemeSwitch({
  display = 'responsive',
  className,
}: ThemeSwitchProps) {
  const { preference, setPreference } = useTheme()
  return (
    <SegmentedControl
      label="Tema"
      options={OPTIONS}
      value={preference}
      onChange={setPreference}
      display={display}
      className={className}
    />
  )
}
