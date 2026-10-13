import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SoundProvider } from '../../../app/providers/SoundProvider'
import { useSound } from '../../../hooks/useSound'
import { fakeAudio } from '../../../test/fakeAudio'
import { SoundNotice } from './SoundNotice'

function EnableSound() {
  const sound = useSound()
  return (
    <button type="button" onClick={sound.enable}>
      Con sonido
    </button>
  )
}

function setup(prepared: Parameters<typeof fakeAudio>[0] = 'ready') {
  const audio = fakeAudio(prepared)
  render(
    <SoundProvider createAudio={() => audio}>
      <EnableSound />
      <SoundNotice />
    </SoundProvider>,
  )
  return {
    audio,
    enable: () =>
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
      }),
  }
}

describe('SoundNotice', () => {
  it('sin sonido activado no pinta nada', () => {
    const { audio } = setup('blocked')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(audio.prepare).not.toHaveBeenCalled()
  })

  it('con el sonido listo no avisa de nada', () => {
    const view = setup()

    view.enable()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('si el navegador lo bloquea, avisa y ofrece reintentar o seguir en silencio', () => {
    const view = setup('blocked')
    view.enable()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu navegador ha bloqueado el sonido.',
    )

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Activar sonido' }))
    })
    expect(view.audio.prepare).toHaveBeenCalledTimes(2)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Seguir sin sonido' }))
    })
    expect(
      screen.queryByText('Tu navegador ha bloqueado el sonido.'),
    ).not.toBeInTheDocument()
  })

  it('si no está disponible, lo dice sin pedir nada', () => {
    const view = setup('unavailable')

    view.enable()

    expect(screen.getByRole('status')).toHaveTextContent(
      'El sonido no está disponible. Sofi seguirá escribiendo en silencio.',
    )
    expect(within(screen.getByRole('status')).queryByRole('button')).toBeNull()
  })
})
