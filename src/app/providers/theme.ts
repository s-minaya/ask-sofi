import { createContext } from 'react'
import type { ThemePreference } from '../../infrastructure/storage/preferencesStorage'

export type { ThemePreference }
export type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

// Una elección explícita se escribe en <html>; «Sistema» la quita y deja
// que prefers-color-scheme decida desde CSS, también en vivo.
export function applyThemePreference(
  preference: ThemePreference,
  root = document.documentElement,
) {
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
}
