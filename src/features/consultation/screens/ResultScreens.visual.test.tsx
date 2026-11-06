import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SofiPortrait } from '../../../components/sofi/SofiPortrait/SofiPortrait'
import { SofiStage } from '../../../components/sofi/SofiStage/SofiStage'
import { SoundProvider } from '../../../app/providers/SoundProvider'
import { fakeAudio } from '../../../test/fakeAudio'
import {
  ErrorScreen,
  NeedsContextScreen,
  ProcessingScreen,
  ReadingScreen,
  type ReadingView,
} from './ResultScreens'

// T065: la Preview pinta los recursos reales con las pantallas de siempre. Las pantallas aceptan,
// de forma opcional, qué recurso pintar y avisos del primer ciclo, del fin de la pasada y del habla;
// sin ellas se ven exactamente igual que hasta ahora. Aquí solo se simula el dibujo del sprite.

type SpriteProps = {
  animation: string
  onFirstCycle?: () => void
  onEnd?: () => void
}
const sprites = vi.hoisted(() => ({ rendered: [] as SpriteProps[] }))

vi.mock('../../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: (props: SpriteProps) => {
    sprites.rendered.push(props)
    return <span data-sprite={props.animation} />
  },
}))

const lastSprite = () => sprites.rendered.at(-1)
const painted = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-sprite]')].map((element) =>
    element.getAttribute('data-sprite'),
  )

beforeEach(() => {
  sprites.rendered = []
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SofiPortrait · recurso con avisos', () => {
  it('pasa el primer ciclo y el fin de la pasada al sprite', () => {
    const onFirstCycle = vi.fn()
    const onEnd = vi.fn()
    render(
      <SofiPortrait
        size={192}
        animation="sofing"
        onFirstCycle={onFirstCycle}
        onEnd={onEnd}
      />,
    )
    lastSprite()?.onFirstCycle?.()
    lastSprite()?.onEnd?.()
    expect(onFirstCycle).toHaveBeenCalledTimes(1)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('con el parpadeo por defecto no hay sprite ni avisos: se ve igual que antes', () => {
    const { container } = render(<SofiPortrait size={192} expression="oops" />)
    expect(painted(container)).toEqual([])
  })
})

describe('SofiStage · recurso opcional', () => {
  it('sin `visual` conserva la expresión provisional', () => {
    const { container } = render(
      <SofiStage expression="thinking" alt="Sofi, concentrada" label="Sofi">
        <p>Texto</p>
      </SofiStage>,
    )
    expect(painted(container)).toEqual([])
  })

  it('con `visual` pinta ese recurso y le pasa los avisos', () => {
    const onEnd = vi.fn()
    const { container } = render(
      <SofiStage
        expression="thinking"
        alt="Sofi, concentrada"
        label="Sofi"
        visual={{ animation: 'sofing', onEnd }}
      >
        <p>Texto</p>
      </SofiStage>,
    )
    expect(painted(container)).toEqual(['sofing'])
    lastSprite()?.onEnd?.()
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})

const noop = () => {}
const READING: ReadingView = {
  speech: 'Ya, sí. Vale.',
  lead: { id: 'a', title: 'Una', explanation: 'Dos', percentage: 60 },
  leadTone: 'clear',
  others: [{ id: 'b', title: 'Otra', explanation: 'Tres', percentage: 40 }],
  confidence: 'medium',
  context: 'sufficient',
  missing: [],
  advice: { title: 'Consejo', text: 'Texto' },
}

function inSound(node: React.ReactNode) {
  return <SoundProvider createAudio={() => fakeAudio()}>{node}</SoundProvider>
}

describe('pantallas de la Preview con recursos reales', () => {
  it('Procesando: pinta el recurso pedido y avisa del primer ciclo', () => {
    const onFirstCycle = vi.fn()
    const { container } = render(
      <ProcessingScreen
        message="Hola"
        context=""
        slow={false}
        onCancel={noop}
        visual={{ animation: 'sofing', onFirstCycle }}
      />,
    )
    expect(painted(container)).toEqual(['sofing'])
    lastSprite()?.onFirstCycle?.()
    expect(onFirstCycle).toHaveBeenCalledTimes(1)
  })

  it('Procesando sin `visual`: sigue con su expresión de siempre', () => {
    const { container } = render(
      <ProcessingScreen
        message="Hola"
        context=""
        slow={false}
        onCancel={noop}
      />,
    )
    expect(painted(container)).toEqual([])
  })

  it('Falta de contexto: recurso, fin de pasada y habla', () => {
    const onEnd = vi.fn()
    const onSpeakingChange = vi.fn()
    const { container } = render(
      inSound(
        <NeedsContextScreen
          speech="Ya, sí. Vale."
          message="Hola"
          questions={['¿Qué pasó?']}
          context=""
          onContextChange={noop}
          onReread={noop}
          contextError={false}
          visual={{ animation: 'needs-context', onEnd }}
          onSpeakingChange={onSpeakingChange}
        />,
      ),
    )
    expect(painted(container)).toEqual(['needs-context'])
    lastSprite()?.onEnd?.()
    expect(onEnd).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(2000))
    expect(onSpeakingChange).toHaveBeenCalledWith(true)
  })

  it('Lectura: recurso y habla; el habla solo avisa al cambiar, no por letra', () => {
    const onSpeakingChange = vi.fn()
    const { container } = render(
      inSound(
        <ReadingScreen
          message="Hola"
          reading={READING}
          onAddContext={noop}
          onNewQuery={noop}
          onEdit={noop}
          visual={{ animation: 'talking' }}
          onSpeakingChange={onSpeakingChange}
        />,
      ),
    )
    expect(painted(container)).toEqual(['talking'])
    act(() => vi.advanceTimersByTime(2000))
    expect(onSpeakingChange.mock.calls.map(([value]) => value)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ])
  })

  it('Error: recurso y fin de pasada, con el recorte y el marco de siempre', () => {
    const onEnd = vi.fn()
    const { container } = render(
      <ErrorScreen
        message="Hola"
        context=""
        onRetry={noop}
        onEdit={noop}
        visual={{ animation: 'error', onEnd }}
      />,
    )
    expect(painted(container)).toEqual(['error'])
    lastSprite()?.onEnd?.()
    expect(onEnd).toHaveBeenCalledTimes(1)
    // El marco de pegatina sigue ahí: el diseño no cambia.
    expect(container.querySelector('[class*="cropSticker"]')).not.toBeNull()
  })

  it('Error sin `visual`: conserva la pose «ups» provisional', () => {
    const { container } = render(
      <ErrorScreen message="Hola" context="" onRetry={noop} onEdit={noop} />,
    )
    expect(painted(container)).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
  })
})

// Con un recurso real, la pose provisional (F1, F2) deja de mandar: al terminar la pasada única
// queda el reposo del contrato (sofi-blink), no una expresión fija inventada.
describe('el reposo con recurso real no arrastra la expresión provisional', () => {
  const frames = (container: HTMLElement) =>
    container.querySelectorAll('[class*="frame1"], [class*="frame2"]').length

  it('Falta de contexto: sin `visual` F1; con `visual` en reposo, ningún fotograma fijo', () => {
    const props = {
      speech: 'Ya.',
      message: 'Hola',
      questions: ['¿Qué pasó?'],
      context: '',
      onContextChange: noop,
      onReread: noop,
      contextError: false,
    }
    const control = render(inSound(<NeedsContextScreen {...props} />))
    expect(frames(control.container)).toBeGreaterThan(0)
    cleanup()
    const real = render(
      inSound(
        <NeedsContextScreen {...props} visual={{ animation: 'sofi-blink' }} />,
      ),
    )
    expect(frames(real.container)).toBe(0)
  })

  it('Procesando y Error: igual', () => {
    const processing = render(
      <ProcessingScreen
        message="Hola"
        context=""
        slow={false}
        onCancel={noop}
        visual={{ animation: 'sofi-blink' }}
      />,
    )
    expect(frames(processing.container)).toBe(0)
    cleanup()
    const error = render(
      <ErrorScreen
        message="Hola"
        context=""
        onRetry={noop}
        onEdit={noop}
        visual={{ animation: 'sofi-blink' }}
      />,
    )
    expect(frames(error.container)).toBe(0)
  })
})
