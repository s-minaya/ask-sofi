import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PresentationKind } from '../../components/sofi/visual/presentationGate'
import { useResultGate, type GateReason } from './useResultGate'

// T065: lo que hace la Preview con `presentationGate`. El hook solo programa y vuelve a preguntar:
// la decisión (qué espera y qué no) es de la función pura. La operación nunca se retrasa: esto
// solo decide cuándo se enseña su resultado.

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

type Props = {
  kind: PresentationKind | null
  arrivedAt: number | null
  firstCycleEnded: boolean
  limitMs: number
  reducedMotion: boolean
}

function setup(initial: Partial<Props> = {}) {
  const present = vi.fn<(reason: GateReason) => void>()
  let current: Props = {
    kind: null,
    arrivedAt: null,
    firstCycleEnded: false,
    limitMs: 3000,
    reducedMotion: false,
    ...initial,
  }
  const view = renderHook(
    (props: Props) => useResultGate({ ...props, onPresent: present }),
    { initialProps: current },
  )
  return {
    present,
    rerender(patch: Partial<Props>) {
      current = { ...current, ...patch }
      view.rerender(current)
    },
    unmount: view.unmount,
  }
}
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

describe('useResultGate', () => {
  it('sin resultado no hace nada', () => {
    const { present } = setup()
    advance(60_000)
    expect(present).not.toHaveBeenCalled()
  })

  it.each(['interpreted', 'needs_context'] as const)(
    'un resultado no crítico (%s) espera al límite si el ciclo no termina',
    (kind) => {
      const { present } = setup({ kind, arrivedAt: Date.now() })
      expect(present).not.toHaveBeenCalled()
      advance(2999)
      expect(present).not.toHaveBeenCalled()
      advance(2)
      expect(present).toHaveBeenCalledTimes(1)
      expect(present).toHaveBeenCalledWith('límite')
    },
  )

  it('si el primer ciclo termina antes del límite, se presenta en ese momento, una sola vez', () => {
    const { present, rerender } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
    })
    advance(1200)
    rerender({ firstCycleEnded: true })
    expect(present).toHaveBeenCalledTimes(1)
    expect(present).toHaveBeenCalledWith('ciclo')
    // El temporizador del límite ya no cuenta.
    advance(10_000)
    expect(present).toHaveBeenCalledTimes(1)
  })

  it('si el ciclo ya había terminado cuando llega el resultado, se presenta en el acto', () => {
    const { present } = setup({
      kind: 'needs_context',
      arrivedAt: Date.now(),
      firstCycleEnded: true,
    })
    expect(present).toHaveBeenCalledWith('ciclo')
  })

  it.each([
    'error',
    'safety_concern',
    'safety_evaluation_unavailable',
    'privacy',
    'deletion',
    'cancelled',
    'quick_exit',
  ] as const)('«%s» se presenta en el acto, sin esperar al ciclo', (kind) => {
    const { present } = setup({ kind, arrivedAt: Date.now() })
    expect(present).toHaveBeenCalledTimes(1)
    expect(present).toHaveBeenCalledWith('inmediato')
  })

  it('con movimiento reducido no espera nada, tampoco un resultado no crítico', () => {
    const { present } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
      reducedMotion: true,
    })
    expect(present).toHaveBeenCalledWith('reducido')
  })

  it('con el límite a cero se presenta en el acto', () => {
    const { present } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
      limitMs: 0,
    })
    expect(present).toHaveBeenCalledWith('límite')
  })

  it('cambiar el límite a mitad de la espera se aplica sobre lo ya transcurrido', () => {
    const { present, rerender } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
      limitMs: 8000,
    })
    advance(2000)
    rerender({ limitMs: 3000 })
    advance(900)
    expect(present).not.toHaveBeenCalled()
    advance(200)
    expect(present).toHaveBeenCalledWith('límite')
    expect(present).toHaveBeenCalledTimes(1)
  })

  it('alargar el límite a mitad de la espera también', () => {
    const { present, rerender } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
      limitMs: 3000,
    })
    advance(2000)
    rerender({ limitMs: 6000 })
    advance(3900)
    expect(present).not.toHaveBeenCalled()
    advance(200)
    expect(present).toHaveBeenCalledTimes(1)
  })

  it('si se quita el resultado (cancelar, otro escenario) no se presenta nada después', () => {
    const { present, rerender } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
    })
    advance(1000)
    rerender({ kind: null, arrivedAt: null })
    advance(60_000)
    expect(present).not.toHaveBeenCalled()
  })

  it('al desmontar a mitad de la espera no queda temporizador ni se presenta', () => {
    const before = vi.getTimerCount()
    const { present, unmount } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
    })
    expect(vi.getTimerCount()).toBeGreaterThan(before)
    unmount()
    expect(vi.getTimerCount()).toBe(before)
    advance(60_000)
    expect(present).not.toHaveBeenCalled()
  })

  it('un resultado nuevo (otra llegada) vuelve a empezar la espera', () => {
    const { present, rerender } = setup({
      kind: 'interpreted',
      arrivedAt: Date.now(),
    })
    advance(3100)
    expect(present).toHaveBeenCalledTimes(1)
    rerender({ kind: null, arrivedAt: null })
    rerender({ kind: 'needs_context', arrivedAt: Date.now() })
    advance(1000)
    expect(present).toHaveBeenCalledTimes(1)
    advance(2100)
    expect(present).toHaveBeenCalledTimes(2)
  })
})
