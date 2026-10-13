import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPreferenceProvider } from '../../../app/providers/MotionPreference'
import { SoundProvider } from '../../../app/providers/SoundProvider'
import { useSound } from '../../../hooks/useSound'
import { fakeAudio } from '../../../test/fakeAudio'
import { TextLink } from '../../ui/TextLink/TextLink'
import { SofiSpeech, type SpeechState } from './SofiSpeech'

const TEXT = 'Ya, sí.'

function EnableSound() {
  const sound = useSound()
  return (
    <button type="button" onClick={sound.enable}>
      Con sonido
    </button>
  )
}

function visibleText() {
  // La capa animada es la segunda copia aria-hidden; la primera reserva el alto.
  return (
    document.querySelectorAll('figure [aria-hidden="true"]')[1]?.textContent ??
    ''
  )
}

describe('SofiSpeech', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('escribe el texto letra a letra tras el retardo inicial y respira en las pausas', () => {
    render(<SofiSpeech text={TEXT} />)

    expect(visibleText()).toBe('')
    act(() => vi.advanceTimersByTime(700))
    expect(visibleText()).toBe('Y')
    act(() => vi.advanceTimersByTime(28))
    expect(visibleText()).toBe('Ya')
    act(() => vi.advanceTimersByTime(28))
    expect(visibleText()).toBe('Ya,')
    // Tras la coma espera 170 ms.
    act(() => vi.advanceTimersByTime(100))
    expect(visibleText()).toBe('Ya,')
    act(() => vi.advanceTimersByTime(70))
    expect(visibleText()).toBe('Ya, ')
  })

  it('ofrece el texto completo a los lectores una sola vez y oculta las capas animadas', () => {
    render(<SofiSpeech text={TEXT} />)

    const announced = screen.getAllByText(TEXT, {
      ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
    })
    expect(announced).toHaveLength(1)
    expect(announced[0]).toHaveAttribute('aria-live', 'polite')
  })

  it('«Ver todo» completa el texto, corta la voz y deja el foco en la acción final', async () => {
    render(
      <SofiSpeech
        text={TEXT}
        doneAction={<TextLink href="#versiones">Ver las versiones</TextLink>}
      />,
    )
    act(() => vi.advanceTimersByTime(756))

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }))
    })

    expect(visibleText()).toBe(TEXT)
    expect(
      screen.queryByRole('button', { name: 'Ver todo' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver las versiones' }),
    ).toHaveFocus()
  })

  // Una acción final que aún no corresponde (inactiva) no puede recibir el foco:
  // se queda donde estaba, como si no hubiera acción.
  it('«Ver todo» no da el foco a una acción final inactiva', () => {
    render(
      <SofiSpeech
        text={TEXT}
        doneAction={
          <span inert>
            <TextLink href="#versiones">Ver las versiones</TextLink>
          </span>
        }
      />,
    )
    act(() => vi.advanceTimersByTime(756))

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Ver todo' }))
    })

    expect(document.activeElement?.closest('[inert]')).toBeNull()
  })

  it('mientras escribe reserva el hueco de la acción final, oculta e inactiva', () => {
    render(
      <SofiSpeech
        text={TEXT}
        doneAction={<TextLink href="#versiones">Ver las versiones</TextLink>}
      />,
    )
    act(() => vi.advanceTimersByTime(756))

    expect(screen.getByRole('button', { name: 'Ver todo' })).toBeVisible()
    expect(screen.getByText('Ver las versiones')).not.toBeVisible()
    expect(
      screen.queryByRole('link', { name: 'Ver las versiones' }),
    ).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(
      screen.getByRole('link', { name: 'Ver las versiones' }),
    ).toBeVisible()
  })

  it('el contenido del bocadillo bajo el texto se puede usar mientras escribe', () => {
    const chosen = vi.fn()
    render(
      <SofiSpeech
        text={TEXT}
        body={
          <button type="button" onClick={chosen}>
            Una respuesta
          </button>
        }
      />,
    )
    act(() => vi.advanceTimersByTime(756))

    const answer = screen.getByRole('button', { name: 'Una respuesta' })
    expect(answer.closest('figure')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Ver todo' })).toBeVisible()
    fireEvent.click(answer)
    expect(chosen).toHaveBeenCalledTimes(1)
  })

  it('con contenido bajo el texto, el pie va entre los dos: cerca de lo que se escribe', () => {
    render(
      <SofiSpeech
        text={TEXT}
        body={<button type="button">Una respuesta</button>}
      />,
    )
    act(() => vi.advanceTimersByTime(756))

    const skip = screen.getByRole('button', { name: 'Ver todo' })
    const answer = screen.getByRole('button', { name: 'Una respuesta' })
    expect(
      skip.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  // Al cruzar el umbral, las respuestas entran o salen del bocadillo sin que el
  // texto accesible se pierda ni se vuelva a escribir.
  it('el texto accesible sobrevive a que el contenido entre o salga del bocadillo', () => {
    const { rerender } = render(<SofiSpeech text={TEXT} />)
    const announced = () =>
      screen.getAllByText(TEXT, {
        ignore: '[aria-hidden="true"], [aria-hidden="true"] *',
      })

    rerender(
      <SofiSpeech text={TEXT} body={<button type="button">Una</button>} />,
    )
    expect(announced()).toHaveLength(1)
    expect(announced()[0]).toHaveAttribute('aria-live', 'polite')

    rerender(<SofiSpeech text={TEXT} />)
    expect(announced()).toHaveLength(1)
    expect(announced()[0]).toHaveAttribute('aria-live', 'polite')
  })

  it('cancela la escritura al desmontar sin dejar temporizadores', () => {
    const { unmount } = render(<SofiSpeech text={TEXT} />)
    act(() => vi.advanceTimersByTime(750))

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('solo se repinta el diálogo mientras escribe: la pantalla que lo contiene no', () => {
    const screenRendered = vi.fn()
    const siblingRendered = vi.fn()
    function Sibling() {
      siblingRendered()
      return <p>Las versiones</p>
    }
    function Screen() {
      screenRendered()
      return (
        <>
          <SofiSpeech text={TEXT} />
          <Sibling />
        </>
      )
    }
    render(<Screen />)

    act(() => vi.advanceTimersByTime(2000))

    expect(visibleText()).toBe(TEXT)
    expect(screenRendered).toHaveBeenCalledTimes(1)
    expect(siblingRendered).toHaveBeenCalledTimes(1)
  })

  it('al cambiar de texto empieza de cero y abandona el anterior', () => {
    const { rerender } = render(<SofiSpeech text="Primero." />)
    act(() => vi.advanceTimersByTime(800))

    rerender(<SofiSpeech text="Otra cosa." />)
    expect(visibleText()).toBe('')
    act(() => vi.advanceTimersByTime(700))
    expect(visibleText()).toBe('O')
  })

  it('con movimiento reducido aparece entero desde el principio', () => {
    render(
      <MotionPreferenceProvider value="reduce">
        <SofiSpeech text={TEXT} />
      </MotionPreferenceProvider>,
    )

    expect(visibleText()).toBe(TEXT)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('expone su estado para sincronizar futuras animaciones', () => {
    const states: SpeechState[] = []
    render(
      <SofiSpeech text={TEXT} onStateChange={(state) => states.push(state)} />,
    )

    act(() => vi.advanceTimersByTime(2000))

    expect(states.map((state) => state.speaking)).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
      false,
    ])
    expect(states.at(-1)).toEqual({
      index: TEXT.length,
      length: TEXT.length,
      status: 'done',
      speaking: false,
    })
  })
})

describe('SofiSpeech con sonido', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('la voz suena con las letras y calla en las pausas', async () => {
    const audio = fakeAudio()
    render(
      <SoundProvider createAudio={() => audio}>
        <EnableSound />
        <SofiSpeech text={TEXT} />
      </SoundProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
    })

    act(() => vi.advanceTimersByTime(700 + 28))
    expect(audio.startVoice).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(28))
    // «,»: pausa corta, la voz calla.
    expect(audio.stopVoice).toHaveBeenCalled()
  })

  it('si el sonido no está activado, nunca suena', () => {
    const audio = fakeAudio()
    render(
      <SoundProvider createAudio={() => audio}>
        <SofiSpeech text={TEXT} />
      </SoundProvider>,
    )

    act(() => vi.advanceTimersByTime(2000))
    expect(audio.startVoice).not.toHaveBeenCalled()
  })

  it('con movimiento reducido el sonido no se pierde: suena un único fragmento breve', async () => {
    const audio = fakeAudio()
    function Flow({ show }: { show: boolean }) {
      return (
        <SoundProvider createAudio={() => audio}>
          <EnableSound />
          <MotionPreferenceProvider value="reduce">
            {show && <SofiSpeech text={TEXT} />}
          </MotionPreferenceProvider>
        </SoundProvider>
      )
    }
    const { rerender } = render(<Flow show={false} />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
    })

    rerender(<Flow show />)

    expect(audio.playFragment).toHaveBeenCalledTimes(1)
    expect(audio.playFragment).toHaveBeenCalledWith(600)
    expect(audio.startVoice).not.toHaveBeenCalled()
  })

  it('movimiento reducido y sonido son independientes: sin sonido, reducir el movimiento no hace sonar nada', () => {
    const audio = fakeAudio()
    render(
      <SoundProvider createAudio={() => audio}>
        <MotionPreferenceProvider value="reduce">
          <SofiSpeech text={TEXT} />
        </MotionPreferenceProvider>
      </SoundProvider>,
    )

    expect(visibleText()).toBe(TEXT)
    expect(audio.prepare).not.toHaveBeenCalled()
    expect(audio.playFragment).not.toHaveBeenCalled()
    expect(audio.startVoice).not.toHaveBeenCalled()
  })

  it('si el navegador bloquea el sonido, avisa y el texto sigue escribiéndose', async () => {
    const audio = fakeAudio('blocked')
    render(
      <SoundProvider createAudio={() => audio}>
        <EnableSound />
        <SofiSpeech text={TEXT} />
      </SoundProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu navegador ha bloqueado el sonido.',
    )
    act(() => vi.advanceTimersByTime(2000))
    expect(visibleText()).toBe(TEXT)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Seguir sin sonido' }))
    })
    expect(
      screen.queryByText('Tu navegador ha bloqueado el sonido.'),
    ).not.toBeInTheDocument()
  })

  it('si el audio no está disponible, lo dice sin interrumpir', async () => {
    const audio = fakeAudio()
    audio.prepare = vi.fn(async () => {
      audio.set('unavailable')
      return false
    })
    render(
      <SoundProvider createAudio={() => audio}>
        <EnableSound />
        <SofiSpeech text={TEXT} />
      </SoundProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Con sonido' }))
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'El sonido no está disponible. Sofi seguirá escribiendo en silencio.',
    )
  })
})
