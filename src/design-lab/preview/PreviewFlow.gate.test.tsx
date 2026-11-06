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

function renderFlow(
  scenario: Scenario,
  {
    motion = 'full',
    strict = false,
  }: { motion?: MotionPreference; strict?: boolean } = {},
) {
  const tree = (
    <ThemeProvider>
      <SoundProvider createAudio={() => fakeAudio()}>
        <MotionPreferenceProvider value={motion}>
          <PreviewFlow initialScenario={scenario} />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
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
const stillReading = () =>
  screen.queryByText('Sofi está leyendo tu mensaje.') !== null

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
