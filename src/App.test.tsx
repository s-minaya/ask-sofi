import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEYS } from './infrastructure/storage/storageKeys'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('muestra el encabezado principal del producto', () => {
    render(<App />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ask Sofi' }),
    ).toBeInTheDocument()
  })

  it('elegir «Con sonido» se conserva pero no descarga ni prepara el audio', async () => {
    // Un navegador con Web Audio: sin diferir, «Empezar» llegaría a pedir el MP3.
    class FakeAudioContext {
      state = 'running'
      currentTime = 0
      destination = {}
      resume = async () => {}
      close = async () => {}
      decodeAudioData = async () => ({ duration: 21 })
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(new ArrayBuffer(8)))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'Con sonido' }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))

    // El sonido queda activo y recordado...
    expect(
      screen.getByRole('button', { name: 'Sonido de Sofi' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.preferences) ?? 'null',
      ).data.sound,
    ).toBe('on')
    // ...pero ningún componente reproduce aún la voz: no hay descarga del MP3.
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/no está disponible|ha bloqueado el sonido/),
    ).toBeNull()
  })
})
