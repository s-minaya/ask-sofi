import { useEffect, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  readThemePreference,
  saveThemePreference,
  subscribeToThemePreference,
} from '../../infrastructure/storage/themePreferenceStorage'
import {
  applyThemePreference,
  ThemeContext,
  type ThemePreference,
} from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readThemePreference)
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)')
    ? 'dark'
    : 'light'
  const resolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    applyThemePreference(preference)
  }, [preference])

  useEffect(() => subscribeToThemePreference(setPreferenceState), [])

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next)
    saveThemePreference(next)
  }

  return (
    <ThemeContext
      value={{ preference, resolvedTheme, systemTheme, setPreference }}
    >
      {children}
    </ThemeContext>
  )
}
