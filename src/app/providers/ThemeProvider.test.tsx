import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useTheme } from '../../hooks/useTheme'
import {
  LEGACY_THEME_KEY,
  STORAGE_KEYS,
} from '../../infrastructure/storage/storageKeys'
import { clearUserData } from '../../infrastructure/storage/userData'
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

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

describe('ThemeProvider', () => {
  it('sigue al sistema por defecto, también cuando cambia en vivo', () => {
    setMediaQuery(DARK_QUERY, false)
    renderProbe()

    expect(screen.getByText('system → light')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBeUndefined()

    act(() => setMediaQuery(DARK_QUERY, true))
    expect(screen.getByText('system → dark')).toBeInTheDocument()
  })

  it('da prioridad a una elección explícita y la conserva', async () => {
    setMediaQuery(DARK_QUERY, false)
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'Oscuro' }))

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(STORAGE_KEYS.preferences)).toContain(
      '"theme":"dark"',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sistema' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('arranca con la preferencia guardada', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({ version: 1, data: { theme: 'dark', sound: 'off' } }),
    )
    renderProbe()

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
  })

  it('recupera el tema que la feature 002 dejó guardado', () => {
    window.localStorage.setItem(
      LEGACY_THEME_KEY,
      JSON.stringify({ version: 1, data: 'dark' }),
    )
    renderProbe()

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
  })

  it('conserva la elección tras recargar', async () => {
    const first = renderProbe()
    await userEvent.click(screen.getByRole('button', { name: 'Oscuro' }))
    first.unmount()

    renderProbe()

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
  })

  it('sigue funcionando con el almacenamiento bloqueado', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    renderProbe()

    await userEvent.click(screen.getByRole('button', { name: 'Oscuro' }))

    expect(screen.getByText('dark → dark')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
    setItem.mockRestore()
  })

  it('vuelve al tema del sistema cuando se borran los datos', async () => {
    setMediaQuery(DARK_QUERY, false)
    renderProbe()
    await userEvent.click(screen.getByRole('button', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    act(() => clearUserData())

    expect(screen.getByText('system → light')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
