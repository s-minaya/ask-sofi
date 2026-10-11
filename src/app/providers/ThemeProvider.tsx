import { useEffect, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  readPreferences,
  subscribeToPreferences,
  updatePreferences,
} from '../../infrastructure/storage/preferencesStorage'
import {
  applyThemePreference,
  ThemeContext,
  type ThemePreference,
} from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => readPreferences().theme,
  )
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)')
    ? 'dark'
    : 'light'
  const resolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    applyThemePreference(preference)
  }, [preference])

  // Cambios de otro documento y borrados de datos: el estado de React no
  // debe quedarse con un valor que el almacenamiento ya no tiene.
  useEffect(
    () => subscribeToPreferences(({ theme }) => setPreferenceState(theme)),
    [],
  )

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next)
    updatePreferences({ theme: next })
  }

  return (
    <ThemeContext
      value={{ preference, resolvedTheme, systemTheme, setPreference }}
    >
      {children}
    </ThemeContext>
  )
}
