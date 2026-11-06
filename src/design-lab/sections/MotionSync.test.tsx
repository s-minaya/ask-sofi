import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../../app/providers/MotionPreference'
import { MotionSection } from './MotionSection'

// T063: 4.3 pinta el recurso real `talking` conectado a `SofiSpeech.onSpeakingChange`, con el
// Lab completo (sin sustituir `SofiSpeech` ni el estado de 4.1). Solo se simulan el dibujo del
// sprite, que necesita módulos y tiras, y el audio, que ya es simulado en el Lab.

const rendered = vi.hoisted(() => ({ slot: [] as boolean[] }))

vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({ animation }: { animation: string }) => (
    <span data-sprite={animation} />
  ),
}))

// Cuenta cada vez que React vuelve a pintar el hueco, para comprobar que no es por carácter.
vi.mock('./SyncSlot', async (importOriginal) => {
  const original = await importOriginal<typeof import('./SyncSlot')>()
  return {
    SyncSlot: (props: { speaking: boolean }) => {
      rendered.slot.push(props.speaking)
      return <original.SyncSlot {...props} />
    },
  }
})

beforeEach(() => {
  rendered.slot = []
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const sync = () => document.getElementById('m-sync') as HTMLElement
const slotSprite = () =>
  sync().querySelector('[data-sprite]')?.getAttribute('data-sprite')
// «Hablando» de 4.1, que sale de `onStateChange`: el hueco debe coincidir con él.
const readout41 = (name: string) =>
  within(document.getElementById('m-speech') as HTMLElement).getByText(name)
    .nextElementSibling?.textContent
const speaking41 = () => readout41('Hablando')

function open(motion: MotionPreference = 'full', strict = false) {
  const tree = (
    <MotionPreferenceProvider value={motion}>
      <MotionSection />
    </MotionPreferenceProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

// Un texto propio y corto, con pausas: lo bastante largo para contar letras y barato de recorrer.
const SHORT = 'Hola, ya lo veo. Dime más, por favor. Vale.'
function useShortText() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }))
  })
  act(() => {
    fireEvent.change(screen.getByLabelText('Tu texto'), {
      target: { value: SHORT },
    })
  })
}

const play = () =>
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Reproducir' }))
  })
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

// Avanza de temporizador en temporizador (un paso por letra) hasta que Sofi termina y devuelve
// lo que vio el hueco en cada paso. Más fino que el tiempo y mucho más barato con el Lab entero.
function runToEnd(limit = 2000) {
  const seen: string[] = []
  for (let step = 0; step < limit; step++) {
    act(() => vi.advanceTimersToNextTimer())
    const sprite = slotSprite() ?? '—'
    // El hueco y la lectura de 4.1 cuentan lo mismo, siempre.
    expect(speaking41() === 'sí').toBe(sprite === 'talking')
    if (seen.at(-1) !== sprite) seen.push(sprite)
    if (readout41('Estado') === 'completo') break
  }
  return seen
}

describe('4.3 · el hueco del sprite', () => {
  it('ya no es el marcador provisional: es el recurso real, en reposo antes de hablar', () => {
    open()
    expect(slotSprite()).toBe('sofi-blink')
    expect(sync()).not.toHaveTextContent(/pendiente 008/i)
    expect(sync()).not.toHaveTextContent(/sprite «hablando» · 008/i)
  })

  it('habla, calla en cada pausa y termina en reposo, siempre de acuerdo con 4.1', () => {
    open()
    useShortText()
    play()
    const seen = runToEnd()

    // Empieza en reposo, habla, vuelve a reposo en una pausa y habla de nuevo.
    expect(seen.slice(0, 3)).toEqual(['sofi-blink', 'talking', 'sofi-blink'])
    expect(
      seen.filter((sprite) => sprite === 'talking').length,
    ).toBeGreaterThan(1)
    expect(seen.at(-1)).toBe('sofi-blink')
  })

  it('no se repinta por carácter: solo cuando cambia «hablando»', () => {
    open()
    useShortText()
    play()
    const typed = readout41('Progreso') ?? ''
    expect(typed).toMatch(/^0 \//)
    rendered.slot = []
    const seen = runToEnd()

    const length = Number(/\/ (\d+)/.exec(readout41('Progreso') ?? '')?.[1])
    // Decenas de caracteres, y el hueco solo se pinta al cambiar de recurso.
    expect(length).toBeGreaterThan(30)
    expect(rendered.slot.length).toBeLessThanOrEqual(seen.length)
  })
})

describe('4.3 · transiciones', () => {
  const speakNow = () => {
    play()
    // Pasado el retardo inicial y unas letras: habla.
    for (let i = 0; i < 200 && slotSprite() !== 'talking'; i++) tick(10)
    expect(slotSprite()).toBe('talking')
  }

  it('cambiar el texto a mitad cancela limpio: vuelve a reposo', () => {
    open()
    speakNow()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Falta contexto' }))
    })
    expect(slotSprite()).toBe('sofi-blink')
    expect(speaking41()).toBe('no')
  })

  it('volver a pulsar «Reproducir» a mitad reinicia y no se queda en talking', () => {
    open()
    speakNow()
    play()
    expect(slotSprite()).toBe('sofi-blink')
  })

  it.each(['el de la mesa', 'el del diálogo'] as const)(
    '«Ver todo» (%s) a mitad completa el texto y vuelve a reposo',
    (which) => {
      open()
      speakNow()
      // Solo los de 4.1: 4.6 tiene su propio «Ver todo» simulado.
      const buttons = within(
        document.getElementById('m-speech') as HTMLElement,
      ).getAllByText('Ver todo')
      act(() => {
        fireEvent.click(
          which === 'el de la mesa' ? buttons[0] : buttons.at(-1)!,
        )
      })
      expect(slotSprite()).toBe('sofi-blink')
      tick(3000)
      expect(slotSprite()).toBe('sofi-blink')
    },
  )

  it('cambiar la simulación de audio a mitad (se estrena el proveedor) vuelve a reposo', () => {
    open()
    speakNow()
    act(() => {
      fireEvent.click(
        screen.getByLabelText('Bloqueo del navegador en el primer intento'),
      )
    })
    expect(slotSprite()).toBe('sofi-blink')
  })
})

describe('4.3 · movimiento reducido', () => {
  it('con «reduce» el texto sale entero y el hueco no llega a hablar', () => {
    open('reduce')
    play()
    const seen = runToEnd()
    expect(seen).not.toContain('talking')
    expect(slotSprite()).toBe('sofi-blink')
  })

  it('activarlo a mitad de la escritura vuelve a reposo y no vuelve a hablar', () => {
    const view = open('full')
    play()
    for (let i = 0; i < 200 && slotSprite() !== 'talking'; i++) tick(10)
    expect(slotSprite()).toBe('talking')

    view.rerender(
      <MotionPreferenceProvider value="reduce">
        <MotionSection />
      </MotionPreferenceProvider>,
    )
    expect(slotSprite()).toBe('sofi-blink')
    tick(5000)
    expect(slotSprite()).toBe('sofi-blink')
  })

  it('«full» habla aunque el sistema pida reducir', async () => {
    const { setMediaQuery } = await import('../../test/matchMedia')
    act(() => setMediaQuery('(prefers-reduced-motion: reduce)', true))
    open('full')
    play()
    for (let i = 0; i < 200 && slotSprite() !== 'talking'; i++) tick(10)
    expect(slotSprite()).toBe('talking')
  })
})

describe.each([false, true])(
  '4.3 · al desmontar (StrictMode: %s)',
  (strict) => {
    it('a mitad de una frase no deja temporizadores ni avisos de React', () => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      // El resto del Lab también programa cosas: se compara con lo que había al empezar.
      const before = vi.getTimerCount()
      const view = open('full', strict)
      play()
      for (let i = 0; i < 200 && slotSprite() !== 'talking'; i++) tick(10)
      expect(slotSprite()).toBe('talking')

      view.unmount()
      act(() => vi.runOnlyPendingTimers())

      expect(vi.getTimerCount()).toBe(before)
      expect(errors).not.toHaveBeenCalled()
    })
  },
)
