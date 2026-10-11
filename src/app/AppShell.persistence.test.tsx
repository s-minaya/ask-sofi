import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../infrastructure/storage/storageKeys'
import { clearUserData } from '../infrastructure/storage/userData'
import { fakeAudio } from '../test/fakeAudio'
import { AppShell } from './AppShell'
import { SoundProvider } from './providers/SoundProvider'
import { ThemeProvider } from './providers/ThemeProvider'

// La aplicación real: el sonido recuerda la elección entre visitas.
function renderApp(audio = fakeAudio()) {
  return {
    audio,
    ...render(
      <ThemeProvider>
        <SoundProvider createAudio={() => audio} persist>
          <AppShell />
        </SoundProvider>
      </ThemeProvider>,
    ),
  }
}

// Una visita nueva: otra pestaña no hereda la sesión de la anterior.
const newSession = () => window.sessionStorage.clear()

const startButton = () => screen.getByRole('button', { name: /Empezar/ })
const soundToggle = () => screen.getByRole('button', { name: 'Sonido de Sofi' })
const homeButton = () =>
  screen.getByRole('button', { name: 'Ask Sofi, volver a portada' })
const message = () =>
  screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
const context = () =>
  screen.getByRole('textbox', { name: 'Y ahora, el salseo' })
const onLanding = () =>
  screen.queryByRole('radio', { name: 'Sin sonido' }) !== null

const storedPreferences = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEYS.preferences) ?? 'null')

describe('AppShell · preferencias persistentes', () => {
  it('empieza en silencio y no guarda nada mientras no se decide', () => {
    renderApp()

    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeChecked()
    expect(window.localStorage.length).toBe(0)
  })

  it('recuerda «Con sonido» en la siguiente visita sin preparar el audio', () => {
    const first = renderApp()
    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    fireEvent.click(startButton())
    expect(storedPreferences().data.sound).toBe('on')
    first.unmount()
    newSession()

    const second = renderApp()

    expect(screen.getByRole('radio', { name: 'Con sonido' })).toBeChecked()
    // Preseleccionar no es un gesto: el audio sigue sin prepararse hasta «Empezar».
    expect(second.audio.prepare).not.toHaveBeenCalled()
    fireEvent.click(startButton())
    expect(second.audio.prepare).toHaveBeenCalledTimes(1)
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'true')
  })

  it('el interruptor de la cabecera también se recuerda', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    await user.click(soundToggle())
    expect(storedPreferences().data.sound).toBe('on')
    await user.click(soundToggle())
    expect(storedPreferences().data.sound).toBe('off')
    first.unmount()
    newSession()

    renderApp()

    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeChecked()
  })

  it('guardar el sonido no pierde el tema elegido', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Oscuro' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    fireEvent.click(startButton())

    expect(storedPreferences().data).toEqual({ theme: 'dark', sound: 'on' })
  })

  it('con el almacenamiento bloqueado la aplicación sigue funcionando', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    const { audio } = renderApp()

    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    fireEvent.click(startButton())

    expect(audio.prepare).toHaveBeenCalledTimes(1)
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'true')
    setItem.mockRestore()
  })

  it('borrar los datos devuelve sonido, tema y pantalla al estado inicial', async () => {
    const user = userEvent.setup()
    const { audio } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Oscuro' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    fireEvent.click(startButton())
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.dataset.theme).toBe('dark')

    act(() => clearUserData())

    // El estado inicial es la portada, en silencio y con el tema del sistema.
    expect(onLanding()).toBe(true)
    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeChecked()
    expect(audio.disable).toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })
})

describe('AppShell · consulta activa', () => {
  it('al recargar con la consulta activa vuelve directamente a ella, con sus textos', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')
    await user.type(context(), 'Ayer discutimos')
    first.unmount()

    renderApp()

    expect(onLanding()).toBe(false)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tu consulta' }),
    ).toBeInTheDocument()
    expect(message()).toHaveValue('Vale.')
    expect(context()).toHaveValue('Ayer discutimos')
  })

  it('una carga directa a la consulta no mueve el foco ni el desplazamiento', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    first.unmount()
    const scroll = vi.spyOn(window, 'scrollTo')

    renderApp()

    expect(scroll).not.toHaveBeenCalled()
    expect(document.body).toHaveFocus()
    scroll.mockRestore()
  })

  it('«Borrar todo» vacía la consulta y se queda en ella, también al recargar', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')

    await user.click(screen.getByRole('button', { name: 'Borrar todo' }))
    expect(message()).toHaveValue('')
    first.unmount()
    renderApp()

    expect(onLanding()).toBe(false)
    expect(message()).toHaveValue('')
  })

  it('volver a la portada la deja como pantalla activa al recargar', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')
    await user.click(homeButton())
    first.unmount()

    renderApp()

    expect(onLanding()).toBe(true)
  })

  it('«Empezar» retoma el borrador que quedó al volver a la portada', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')

    await user.click(homeButton())
    await user.click(startButton())

    expect(message()).toHaveValue('Vale.')
  })

  it('el borrado completo de datos devuelve la portada sin restos de la consulta', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')

    act(() => clearUserData())
    expect(onLanding()).toBe(true)
    await user.click(startButton())

    expect(message()).toHaveValue('')
    expect(
      window.sessionStorage.getItem(STORAGE_KEYS.consultationDraft),
    ).toBeNull()
  })

  it('con sessionStorage corrupto arranca en la portada', () => {
    window.sessionStorage.setItem(STORAGE_KEYS.sessionScreen, '{roto')

    renderApp()

    expect(onLanding()).toBe(true)
  })
})
