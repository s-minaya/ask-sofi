import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fakeAudio } from '../test/fakeAudio'
import { AppShell } from './AppShell'
import { SoundProvider } from './providers/SoundProvider'
import { ThemeProvider } from './providers/ThemeProvider'

function renderApp(audio = fakeAudio()) {
  render(
    <ThemeProvider>
      <SoundProvider createAudio={() => audio}>
        <AppShell />
      </SoundProvider>
    </ThemeProvider>,
  )
  return audio
}

const startButton = () => screen.getByRole('button', { name: /Empezar/ })
const soundToggle = () => screen.getByRole('button', { name: 'Sonido de Sofi' })

describe('AppShell', () => {
  it('opens on the landing, silent by default and without touching the audio', () => {
    const audio = renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ask Sofi' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Qué ha querido decir con/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Sin sonido' })).toBeChecked()
    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('does not prepare the audio when sound is merely chosen', async () => {
    const user = userEvent.setup()
    const audio = renderApp()

    await user.click(screen.getByRole('radio', { name: 'Con sonido' }))

    expect(screen.getByRole('radio', { name: 'Con sonido' })).toBeChecked()
    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('enters without sound, never prepares the audio and moves focus to the first step', async () => {
    const user = userEvent.setup()
    const audio = renderApp()

    await user.click(startButton())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tu consulta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Pégalo tal cual te llegó' }),
    ).toHaveFocus()
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'false')
    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('prepares the audio once, inside the very click on «Empezar», when sound was chosen', () => {
    const audio = renderApp()

    fireEvent.click(screen.getByRole('radio', { name: 'Con sonido' }))
    expect(audio.prepare).not.toHaveBeenCalled()
    fireEvent.click(startButton())

    // Síncrono dentro del gesto: es lo que permite al navegador dejar sonar el audio.
    expect(audio.prepare).toHaveBeenCalledTimes(1)
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the consultation usable when the browser blocks the audio', async () => {
    const user = userEvent.setup()
    const audio = renderApp(fakeAudio('blocked'))

    await user.click(screen.getByRole('radio', { name: 'Con sonido' }))
    await user.click(startButton())
    const message = screen.getByRole('textbox', {
      name: 'Pégalo tal cual te llegó',
    })
    await user.type(message, 'Vale.')

    expect(audio.getStatus()).toBe('blocked')
    expect(message).toHaveValue('Vale.')
  })

  it('switches the sound from the header, preparing it only when it is turned on', async () => {
    const user = userEvent.setup()
    const audio = renderApp()
    await user.click(startButton())

    await user.click(soundToggle())
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'true')
    expect(audio.prepare).toHaveBeenCalledTimes(1)

    await user.click(soundToggle())
    expect(soundToggle()).toHaveAttribute('aria-pressed', 'false')
    expect(audio.disable).toHaveBeenCalled()
  })

  it('goes back to the landing from the logo and moves focus to its headline', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())

    await user.click(
      screen.getByRole('button', { name: 'Ask Sofi, volver a portada' }),
    )

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Qué ha querido decir con/,
      }),
    ).toHaveFocus()
  })

  it('asks for the message and, once written, says that nothing has been sent', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(startButton())

    await user.click(screen.getByRole('button', { name: /Leer entre líneas/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Pega el mensaje para que pueda leerlo.',
    )

    await user.type(
      screen.getByRole('textbox', { name: 'Pégalo tal cual te llegó' }),
      'Vale.',
    )
    await user.click(screen.getByRole('button', { name: /Leer entre líneas/ }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sofi todavía está calentando motores',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Esta es una demostración. Tu mensaje no se ha enviado ni analizado.',
    )
  })
})
