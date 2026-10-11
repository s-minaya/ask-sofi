import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '../app/providers/theme'

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme necesita un ThemeProvider por encima.')
  return value
}
