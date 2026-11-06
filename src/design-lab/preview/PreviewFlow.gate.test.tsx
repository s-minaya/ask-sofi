import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../../app/providers/MotionPreference'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { clearSessionRates, rateFor } from '../../components/sofi/visual/rates'
import { READY_COPY } from '../../components/sofi/ProcessingState/ProcessingState'
import { fakeAudio } from '../../test/fakeAudio'
import { setMediaQuery } from '../../test/matchMedia'
import { LEAD } from '../fixtures'
import { PreviewFlow } from './PreviewFlow'
import type { PreviewCommand, PreviewState } from './previewProtocol'
import {
  DEFAULT_TUNING,
  SIMULATED_LATENCY_MS,
  SIMULATED_SUBMIT_MS,
  type Scenario,
} from './scenarios'

// T065: la Preview con los recursos reales y `presentationGate`. Sigue siendo un prototipo: no
// fija el flujo de resultados de 007. Solo se simula el dibujo del sprite, para controlar el fin
// del primer ciclo y de la pasada a mano; jsdom no tiene animaciones.

const sprites = vi.hoisted(() => ({ rendered: [] as string[] }))

vi.mock('../../components/sofi/SofiSprite/SofiSprite', () => ({
  SofiSprite: ({
    animation,
    onFirstCycle,
    onEnd,
  }: {
    animation: string
    onFirstCycle?: () => void
    onEnd?: () => void
  }) => {
    sprites.rendered.push(animation)
    return (
      <span data-sprite={animation}>
        <button type="button" data-cycle onClick={onFirstCycle} />
        <button type="button" data-end onClick={onEnd} />
      </span>
    )
  },
}))

// Cada vez que React pinta «Procesando», qué dice de su resultado: `true` es «ya la tengo» y `false`,
// que la operación sigue pendiente. Un MutationObserver no vale para esto: dos commits seguidos
// dentro de un mismo `act` se ven como uno solo, y es justo el fotograma intermedio lo que se busca.
const processing = vi.hoisted(() => ({ renders: [] as boolean[] }))

vi.mock(
  '../../components/sofi/ProcessingState/ProcessingState',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('../../components/sofi/ProcessingState/ProcessingState')
      >()
    return {
      ...original,
      ProcessingState: (
        props: Parameters<typeof original.ProcessingState>[0],
      ) => {
        processing.renders.push(props.resultReady === true)
        return <original.ProcessingState {...props} />
      },
    }
  },
)

function renderFlow(
  scenario: Scenario,
  {
    motion = 'full',
    strict = false,
  }: { motion?: MotionPreference; strict?: boolean } = {},
) {
  const tree = (value: MotionPreference) => (
    <ThemeProvider>
      <SoundProvider createAudio={() => fakeAudio()}>
        <MotionPreferenceProvider value={value}>
          <PreviewFlow initialScenario={scenario} />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
  const wrap = (value: MotionPreference) =>
    strict ? <StrictMode>{tree(value)}</StrictMode> : tree(value)
  const view = render(wrap(motion))
  // Activar o quitar el movimiento reducido con la lectura en marcha, como el selector del Lab.
  const setMotion = (value: MotionPreference) => view.rerender(wrap(value))
  return Object.assign(view, { setMotion })
}

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const command = (value: PreviewCommand) =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'ask-sofi:preview-command', command: value },
        origin: window.location.origin,
      }),
    )
  })

const sprite = () =>
  document.querySelector('[data-sprite]')?.getAttribute('data-sprite') ?? null
const click = (selector: string) =>
  act(() => void fireEvent.click(document.querySelector(selector)!))

let states: PreviewState[]
beforeEach(() => {
  vi.useFakeTimers()
  sprites.rendered = []
  processing.renders = []
  states = []
  vi.spyOn(window, 'postMessage').mockImplementation((message: unknown) => {
    const data = message as { type?: string; state?: PreviewState }
    if (data?.type === 'ask-sofi:preview-state' && data.state)
      states.push(data.state)
  })
})
afterEach(() => {
  cleanup()
  clearSessionRates()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const lastState = () => states.at(-1)!

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Empezar/ }))
  fireEvent.click(screen.getByRole('button', { name: /Leer entre líneas/ }))
  advance(SIMULATED_SUBMIT_MS)
}
const reading = () => screen.queryByRole('heading', { name: LEAD.title })
// Todavía sin presentar el resultado: la operación pendiente o el resultado ya recibido que espera.
const stillReading = () =>
  screen.queryByText('Sofi está leyendo tu mensaje.') !== null ||
  screen.queryByText(READY_COPY.status) !== null

describe('Preview · recursos reales', () => {
  it('«Procesando» pinta sofing', () => {
    renderFlow('success')
    submit()
    expect(sprite()).toBe('sofing')
  })

  it('«Carga» se queda con sofing y no presenta nada nunca', () => {
    renderFlow('loading')
    submit()
    advance(120_000)
    expect(sprite()).toBe('sofing')
    // Sigue leyendo (con el aviso de espera larga) y nunca presenta un resultado.
    expect(
      screen.getByRole('heading', { name: 'Leyendo entre líneas…' }),
    ).toBeInTheDocument()
    expect(lastState().gate).toBe('none')
  })

  it('el error pinta error, y al terminar su pasada queda el reposo', () => {
    renderFlow('error')
    submit()
    advance(SIMULATED_LATENCY_MS)
    expect(sprite()).toBe('error')
    click('[data-end]')
    expect(sprite()).toBeNull()
  })

  it('falta de contexto pinta needs-context y, terminada su pasada, el reposo', () => {
    renderFlow('needs')
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs)
    expect(sprite()).toBe('needs-context')
    click('[data-end]')
    expect(sprite()).toBeNull()
  })

  it('la lectura pinta talking mientras habla, y vuelve al reposo en cada pausa y al terminar', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs)
    expect(reading()).toBeInTheDocument()
    const seen = new Set<string | null>()
    for (let i = 0; i < 400; i++) {
      advance(25)
      seen.add(sprite())
    }
    expect(seen).toContain('talking')
    expect(seen).toContain(null)
    expect(sprite()).toBeNull()
  })

  it('no pinta eureka ni suspicious: su regla es de 006 y la Preview no la anticipa', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs + 30_000)
    expect(sprites.rendered).not.toContain('eureka')
    expect(sprites.rendered).not.toContain('suspicious')
  })
})

describe('Preview · presentationGate', () => {
  it.each(['success', 'needs'] as const)(
    '%s: el resultado llega a su hora y se presenta al llegar el límite',
    (scenario) => {
      renderFlow(scenario)
      submit()
      advance(SIMULATED_LATENCY_MS)
      // La operación terminó: lo único que se retiene es su presentación.
      expect(stillReading()).toBe(true)
      expect(lastState().gate).toBe('held')

      advance(DEFAULT_TUNING.limitMs - 100)
      expect(stillReading()).toBe(true)
      advance(200)
      expect(stillReading()).toBe(false)
      expect(lastState().gate).toBe('límite')
    },
  )

  it('el fin del primer ciclo presenta el resultado en el acto', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS)
    advance(500)
    click('[data-cycle]')
    expect(reading()).toBeInTheDocument()
    expect(lastState().gate).toBe('ciclo')
  })

  it('si el ciclo terminó antes de llegar el resultado, no espera nada', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS - 500)
    click('[data-cycle]')
    expect(stillReading()).toBe(true)
    advance(500)
    expect(reading()).toBeInTheDocument()
    expect(lastState().gate).toBe('ciclo')
  })

  it('un error se presenta en cuanto llega, sin esperar al ciclo ni al límite', () => {
    renderFlow('error')
    submit()
    advance(SIMULATED_LATENCY_MS)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(lastState().gate).toBe('inmediato')
  })

  it('con movimiento reducido no espera: ni un resultado no crítico', () => {
    renderFlow('success', { motion: 'reduce' })
    submit()
    advance(SIMULATED_LATENCY_MS)
    expect(reading()).toBeInTheDocument()
    expect(lastState().gate).toBe('reducido')
  })

  it('«full» con el sistema pidiendo reducir sí retiene (el movimiento es completo)', () => {
    act(() => setMediaQuery('(prefers-reduced-motion: reduce)', true))
    renderFlow('success', { motion: 'full' })
    submit()
    advance(SIMULATED_LATENCY_MS)
    expect(stillReading()).toBe(true)
  })

  it('cancelar durante la retención vuelve a la consulta al instante y no presenta nada después', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByRole('button', { name: /Leer entre líneas/ }),
    ).toHaveFocus()
    advance(120_000)
    expect(reading()).toBeNull()
    expect(
      screen.getByRole('button', { name: /Leer entre líneas/ }),
    ).toBeInTheDocument()
    expect(lastState().gate).toBe('none')
  })

  it('la retención no retrasa lo funcional: «Cancelar» funciona a cualquier hora de la espera', () => {
    renderFlow('success')
    submit()
    // Antes de que llegue el resultado y durante la retención.
    advance(SIMULATED_LATENCY_MS / 2)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
    advance(SIMULATED_LATENCY_MS)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })

  it('cambiar de escenario a mitad de la retención la descarta', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    command({ kind: 'scenario', scenario: 'error' })
    advance(120_000)
    expect(reading()).toBeNull()
  })

  it('al desmontar a mitad de la retención no queda ningún temporizador', () => {
    const before = vi.getTimerCount()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    view.unmount()
    act(() => void vi.runOnlyPendingTimers())
    expect(vi.getTimerCount()).toBe(before)
    expect(errors).not.toHaveBeenCalled()
  })

  it('con StrictMode presenta una sola vez', () => {
    renderFlow('success', { strict: true })
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs + 100)
    expect(reading()).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: LEAD.title })).toHaveLength(1)
  })
})

describe('Preview · ajustes de la mesa', () => {
  const tune = (patch: Partial<typeof DEFAULT_TUNING>) =>
    command({ kind: 'tuning', tuning: { ...DEFAULT_TUNING, ...patch } })

  it('un límite menor presenta antes', () => {
    renderFlow('success')
    tune({ limitMs: 500 })
    submit()
    advance(SIMULATED_LATENCY_MS + 400)
    expect(stillReading()).toBe(true)
    advance(200)
    expect(reading()).toBeInTheDocument()
  })

  it('un límite de cero presenta al llegar', () => {
    renderFlow('success')
    tune({ limitMs: 0 })
    submit()
    advance(SIMULATED_LATENCY_MS)
    expect(reading()).toBeInTheDocument()
    expect(lastState().gate).toBe('límite')
  })

  it('la latencia simulada llega a la lectura sin tocar el límite', () => {
    renderFlow('success')
    tune({ latencyMs: 400 })
    submit()
    advance(400)
    expect(lastState().gate).toBe('held')
    advance(DEFAULT_TUNING.limitMs + 100)
    expect(reading()).toBeInTheDocument()
  })

  it('la velocidad acelerada llega a sofing por la vía de producción y se limpia al salir', () => {
    const view = renderFlow('success')
    expect(rateFor('sofing')).toBe(1)
    tune({ rate: 4 })
    expect(rateFor('sofing')).toBe(4)
    // Solo sofing: ningún otro recurso cambia de velocidad.
    expect(rateFor('poking')).toBe(1)
    view.unmount()
    expect(rateFor('sofing')).toBe(1)
  })

  it('un ajuste inválido se ignora en lugar de romper la lectura', () => {
    renderFlow('success')
    tune({ rate: 0, limitMs: -5, latencyMs: Number.NaN })
    tune({ rate: Infinity, limitMs: Infinity, latencyMs: Infinity })
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs + 100)
    expect(reading()).toBeInTheDocument()
    expect(rateFor('sofing')).toBe(1)
  })
})

// Corrección de T065: operación pendiente y presentación pendiente son cosas distintas. Mientras el
// resultado ya recibido espera, la Preview no dice que Sofi sigue leyendo; y no lo dice nunca para
// lo que se presenta en el acto (un error no parpadea con «ya la tengo»).
describe('Preview · operación pendiente frente a presentación pendiente', () => {
  const pendingText = () => screen.queryByText('Sofi está leyendo tu mensaje.')
  const readyText = () => screen.queryByText(READY_COPY.status)
  // Todo lo que el lector o la vista dicen de «leer»: textos y nombres accesibles.
  const claimsProcessing = () =>
    [...document.querySelectorAll<HTMLElement>('body *')].filter(
      (element) =>
        /leyendo/i.test(element.getAttribute('aria-label') ?? '') ||
        (element.children.length === 0 &&
          /leyendo|tardando/i.test(element.textContent ?? '')),
    )

  // Todo texto que haya llegado a pintarse, aunque sea un solo fotograma.
  function recordTexts() {
    const seen = new Set<string>()
    const record = () => {
      if (document.body.textContent?.includes(READY_COPY.status))
        seen.add('ready')
    }
    const observer = new MutationObserver(record)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return { seen, stop: () => observer.disconnect() }
  }

  it('antes de llegar el resultado, la operación sigue pendiente y lo dice', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS / 2)
    expect(pendingText()).toBeInTheDocument()
    expect(readyText()).toBeNull()
  })

  it('con el resultado recibido y por presentar, no afirma que Sofi sigue procesando', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    expect(lastState().gate).toBe('held')

    expect(readyText()).toBeInTheDocument()
    expect(pendingText()).toBeNull()
    expect(claimsProcessing()).toEqual([])
    // Sin la barra de actividad: nada se está procesando.
    expect(document.querySelector('[class*="loader"]')).toBeNull()
    // Un solo estado anunciado (el del sonido, si lo hubiera, no cuenta aquí).
    expect(
      screen
        .getAllByRole('status')
        .filter((node) => node.textContent === READY_COPY.status),
    ).toHaveLength(1)
  })

  it('el titular y el rótulo de la cabecera tampoco lo dicen', () => {
    renderFlow('needs')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    expect(
      screen.getByRole('heading', { level: 1, name: READY_COPY.title }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(READY_COPY.kicker).length).toBeGreaterThan(0)
    expect(screen.queryByText('Sofi está leyendo')).toBeNull()
  })

  it('al presentarse el resultado desaparece el aviso, y la lectura no lo arrastra', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + DEFAULT_TUNING.limitMs + 100)
    expect(reading()).toBeInTheDocument()
    expect(readyText()).toBeNull()
  })

  it('«Cancelar» sigue funcionando durante la presentación pendiente', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(
      screen.getByRole('button', { name: /Leer entre líneas/ }),
    ).toBeInTheDocument()
    expect(readyText()).toBeNull()
  })

  it.each([
    ['un error', 'error', {}],
    ['el movimiento reducido', 'success', { motion: 'reduce' as const }],
  ] as const)(
    '%s se presenta en el acto y nunca enseña «ya la tengo»',
    (_name, scenario, options) => {
      const recorder = recordTexts()
      renderFlow(scenario, options)
      submit()
      advance(SIMULATED_LATENCY_MS + 100)
      recorder.stop()
      expect(recorder.seen.size).toBe(0)
      expect(readyText()).toBeNull()
      expect(states.map((state) => state.gate)).not.toContain('held')
    },
  )

  it('con el límite a cero tampoco hay un fotograma de «ya la tengo»', () => {
    renderFlow('success')
    command({
      kind: 'tuning',
      tuning: { ...DEFAULT_TUNING, limitMs: 0 },
    })
    const recorder = recordTexts()
    submit()
    advance(SIMULATED_LATENCY_MS + 100)
    recorder.stop()
    expect(recorder.seen.size).toBe(0)
    expect(reading()).toBeInTheDocument()
  })

  it('«Carga» no tiene resultado: sigue leyendo, y su aviso de espera larga se mantiene', () => {
    renderFlow('loading')
    submit()
    advance(120_000)
    expect(readyText()).toBeNull()
    expect(
      screen.getByText(
        'Está tardando más de lo normal. Tu mensaje no se pierde.',
      ),
    ).toBeInTheDocument()
  })

  it('si la retención se descarta (otro escenario) no queda el copy de «ya la tengo»', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    command({ kind: 'scenario', scenario: 'loading' })
    expect(readyText()).toBeNull()
  })
})

// Caso límite de la corrección anterior: un resultado retenido que deja de esperar (fin del primer
// ciclo, límite a cero, movimiento reducido) no debe pasar por «Sofi sigue leyendo» ni un
// fotograma entre «ya la tengo» y la lectura. Y lo que ya se presenta en el acto no pasa por
// «ya la tengo». Se mira cada render de «Procesando» y cada estado que la Preview comunica.
describe('Preview · transiciones de la retención, sin estados intermedios', () => {
  // La secuencia de lo que dijo «Procesando», sin repetidos seguidos: false = pendiente, true = lista.
  const said = () =>
    processing.renders.filter(
      (value, index, all) => index === 0 || value !== all[index - 1],
    )
  const gates = () =>
    states
      .map((state) => state.gate)
      .filter((value, index, all) => index === 0 || value !== all[index - 1])

  function holdResult(scenario: Scenario = 'success', options = {}) {
    const view = renderFlow(scenario, options)
    submit()
    advance(SIMULATED_LATENCY_MS + 500)
    expect(lastState().gate).toBe('held')
    return view
  }

  it('al terminar el primer ciclo pasa de «lista» a la lectura sin volver a «leyendo»', () => {
    holdResult()
    click('[data-cycle]')
    expect(reading()).toBeInTheDocument()

    // Pendiente → lista, y nunca de vuelta a pendiente.
    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'ciclo'])
  })

  it('al bajar el límite a cero a mitad de la espera, igual', () => {
    holdResult()
    command({ kind: 'tuning', tuning: { ...DEFAULT_TUNING, limitMs: 0 } })
    expect(reading()).toBeInTheDocument()

    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'límite'])
  })

  it('al activar el movimiento reducido a mitad de la espera, igual', () => {
    const view = holdResult()
    act(() => view.setMotion('reduce'))
    expect(reading()).toBeInTheDocument()

    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'reducido'])
  })

  it('con falta de contexto ocurre lo mismo al terminar el ciclo', () => {
    holdResult('needs')
    click('[data-cycle]')
    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'ciclo'])
  })

  it('cuando se agota el límite tampoco vuelve a «leyendo»', () => {
    holdResult()
    advance(DEFAULT_TUNING.limitMs)
    expect(reading()).toBeInTheDocument()
    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'límite'])
  })

  it.each([
    ['un error', 'error', {}, 'inmediato'],
    [
      'el movimiento reducido desde el principio',
      'success',
      { motion: 'reduce' as const },
      'reducido',
    ],
  ] as const)(
    '%s se presenta en el acto: ni un render de «ya la tengo» ni de «leyendo» tras llegar',
    (_name, scenario, options, reason) => {
      renderFlow(scenario, options)
      submit()
      advance(SIMULATED_LATENCY_MS - 1)
      const before = processing.renders.length
      advance(1)
      // Al llegar, «Procesando» no vuelve a pintarse con otro mensaje (ni «ya la tengo» ni «leyendo»).
      expect(processing.renders).toHaveLength(before)
      expect(reading() ?? screen.queryByRole('alert')).not.toBeNull()
      advance(100)
      // Solo el «leyendo» de mientras la operación estaba pendiente.
      expect(said()).toEqual([false])
      expect(processing.renders).not.toContain(true)
      expect(gates()).toEqual(['none', reason])
    },
  )

  it('con el límite a cero desde el principio, igual: se presenta al llegar', () => {
    renderFlow('success')
    command({ kind: 'tuning', tuning: { ...DEFAULT_TUNING, limitMs: 0 } })
    submit()
    advance(SIMULATED_LATENCY_MS - 1)
    const before = processing.renders.length
    advance(1)
    expect(processing.renders).toHaveLength(before)
    expect(reading()).toBeInTheDocument()
    expect(said()).toEqual([false])
    expect(gates()).toEqual(['none', 'límite'])
  })

  it('si el ciclo ya había terminado cuando llega el resultado, se presenta al llegar', () => {
    renderFlow('success')
    submit()
    advance(SIMULATED_LATENCY_MS - 500)
    click('[data-cycle]')
    advance(499)
    const before = processing.renders.length
    advance(1)
    expect(processing.renders).toHaveLength(before)
    expect(reading()).toBeInTheDocument()
    expect(said()).toEqual([false])
    expect(gates()).toEqual(['none', 'ciclo'])
  })

  it('con StrictMode las transiciones siguen sin estados intermedios', () => {
    holdResult('success', { strict: true })
    click('[data-cycle]')
    expect(reading()).toBeInTheDocument()
    expect(said()).toEqual([false, true])
    expect(gates()).toEqual(['none', 'held', 'ciclo'])
  })
})
