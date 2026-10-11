import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useTheme } from '../../hooks/useTheme'
import { THEME_STORAGE_KEY } from '../../infrastructure/storage/themePreferenceStorage'
import { setMediaQuery } from '../../test/matchMedia'
import { ThemeProvider } from './ThemeProvider'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function Probe() {
  const { preference, resolvedTheme, setPreference } = useTheme()
  return (
    <div>
      <p>
        {preference} → {resolvedTheme}
      </p>
      <button type="button" onClick={() => setPreference('dark')}>
        Oscuro
      </button>
      <button type="button" onClick={() => setPreference('system')}>
        Sistema
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('sigue al sistema por defecto, también cuando cambia en vivo', () => {
    setMediaQuery(DARK_QUERY, false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('system → light')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBeUndefined()

    act(() => setMediaQuery(DARK_QUERY, true))
    expect(screen.getByText('system → dark')).toBeInTheDocument()
  })

  it('da prioridad a una elección explícita y la conserva', async () => {
    setMediaQuery(DARK_QUERY, false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Oscuro' }))

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toContain('"dark"')

    await userEvent.click(screen.getByRole('button', { name: 'Sistema' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('arranca con la preferencia guardada', () => {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ version: 1, data: 'dark' }),
    )
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
  })
})
