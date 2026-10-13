import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../infrastructure/storage/storageKeys'
import { clearUserData } from '../infrastructure/storage/userData'
import { fakeAudio } from '../test/fakeAudio'
import { AppShell } from './AppShell'
import { MotionPreferenceProvider } from './providers/MotionPreference'
import { SoundProvider } from './providers/SoundProvider'
import { ThemeProvider } from './providers/ThemeProvider'

// El expediente es una vista más de la aplicación (004-plan §4): se abre desde
// la invitación o desde el acceso permanente, y la consulta no se pierde.
function renderApp(audio = fakeAudio()) {
  return {
    audio,
    ...render(
      <ThemeProvider>
        <MotionPreferenceProvider value="reduce">
          <SoundProvider createAudio={() => audio} persist deferAudio>
            <AppShell />
          </SoundProvider>
        </MotionPreferenceProvider>
      </ThemeProvider>,
    ),
  }
}

const startButton = () => screen.getByRole('button', { name: /Empezar/ })
const openProfile = () =>
  screen.getByRole('button', {
    name: /^(Responder preguntas|Abrir expediente|Editar expediente)$/,
  })
const message = () =>
  screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' })
const sheetHeading = () =>
  screen.getByRole('heading', { level: 1, name: 'Expediente de tu pareja' })

describe('AppShell · expediente', () => {
  it('se abre desde la consulta y lleva el foco a su titular', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())

    await user.click(openProfile())

    expect(sheetHeading()).toHaveFocus()
    expect(
      screen.queryByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Las seis áreas' }),
    ).toBeVisible()
  })

  it('«Volver a la consulta» la recupera tal como estaba', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.type(message(), 'Vale.')

    await user.click(openProfile())
    await user.click(
      screen.getByRole('button', { name: /Volver a la consulta/ }),
    )

    expect(
      screen.getByRole('heading', { name: 'Pégalo tal cual te llegó' }),
    ).toHaveFocus()
    expect(message()).toHaveValue('Vale.')
  })

  it('el acceso permanente sigue ahí al volver, sin invitación', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.click(openProfile())
    await user.click(
      screen.getByRole('button', { name: /Volver a la consulta/ }),
    )

    expect(
      screen.queryByText(/me das un poco de contexto/),
    ).not.toBeInTheDocument()
    expect(openProfile()).toBeVisible()
  })

  it('al abrirlo con sonido, prepara el audio dentro del gesto', async () => {
    const audio = fakeAudio()
    renderApp(audio)
    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    fireEvent.click(startButton())
    // Con el audio diferido, entrar en la consulta no lo descarga.
    expect(audio.prepare).not.toHaveBeenCalled()

    fireEvent.click(openProfile())

    expect(audio.prepare).toHaveBeenCalledTimes(1)
  })

  it('activar el sonido desde la cabecera dentro del expediente lo prepara en ese gesto', async () => {
    const audio = fakeAudio()
    renderApp(audio)
    fireEvent.click(startButton())
    fireEvent.click(openProfile())
    expect(audio.prepare).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sonido de Sofi' }))

    expect(audio.prepare).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Sonido de Sofi' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('en la consulta, activar el sonido sigue sin descargar el audio', async () => {
    const audio = fakeAudio()
    renderApp(audio)
    fireEvent.click(startButton())

    fireEvent.click(screen.getByRole('button', { name: 'Sonido de Sofi' }))

    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('sin sonido, abrirlo nunca prepara el audio', async () => {
    const user = userEvent.setup()
    const audio = renderApp().audio
    await user.click(startButton())

    await user.click(openProfile())

    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('una recarga durante la edición devuelve a la consulta', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(startButton())
    await user.click(openProfile())
    expect(window.sessionStorage.getItem(STORAGE_KEYS.sessionScreen)).toContain(
      'consultation',
    )
    first.unmount()

    renderApp()

    expect(message()).toBeInTheDocument()
  })

  it('el logo vuelve a la portada también desde el expediente', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.click(openProfile())

    await user.click(
      screen.getByRole('button', { name: 'Ask Sofi, volver a portada' }),
    )

    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeVisible()
  })

  it('borrar todos los datos con el expediente abierto devuelve a la portada', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())
    await user.click(openProfile())

    act(() => clearUserData())

    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeVisible()
  })
})
