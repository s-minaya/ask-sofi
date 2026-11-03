import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PROVISIONAL_RETENTION_LIMIT_MS,
  presentationGate,
  type GateInput,
  type PresentationKind,
} from './presentationGate'

// Catálogo §6.4: solo un resultado no crítico puede esperar al final del primer ciclo.
const LIMIT = 3000

const arriving = (patch: Partial<GateInput> = {}): GateInput => ({
  kind: 'interpreted',
  firstCycleEnded: false,
  elapsedMs: 0,
  limitMs: LIMIT,
  reducedMotion: false,
  ...patch,
})

const NON_CRITICAL: PresentationKind[] = ['interpreted', 'needs_context']

// «Nunca esperan, y se muestran en cuanto se conocen».
const NEVER_WAIT: PresentationKind[] = [
  'error',
  'safety_concern',
  'safety_evaluation_unavailable',
  'privacy',
  'deletion',
  'cancelled',
  'quick_exit',
]

describe('presentationGate', () => {
  describe.each(NON_CRITICAL)('resultado no crítico: %s', (kind) => {
    it('espera al final del primer ciclo y dice cuánto queda hasta el límite', () => {
      expect(presentationGate(arriving({ kind, elapsedMs: 1000 }))).toEqual({
        present: false,
        waitMs: LIMIT - 1000,
      })
    })

    it('se presenta en cuanto termina el primer ciclo', () => {
      expect(
        presentationGate(arriving({ kind, firstCycleEnded: true })),
      ).toEqual({ present: true })
    })

    it('se presenta al alcanzar el límite, aunque el ciclo siga en marcha', () => {
      expect(
        presentationGate(arriving({ kind, elapsedMs: LIMIT - 1 })),
      ).toEqual({ present: false, waitMs: 1 })
      expect(presentationGate(arriving({ kind, elapsedMs: LIMIT }))).toEqual({
        present: true,
      })
      expect(
        presentationGate(arriving({ kind, elapsedMs: LIMIT + 5000 })),
      ).toEqual({ present: true })
    })

    it('con movimiento reducido se presenta en el acto', () => {
      expect(presentationGate(arriving({ kind, reducedMotion: true }))).toEqual(
        {
          present: true,
        },
      )
    })
  })

  it.each(NEVER_WAIT)(
    '«%s» se presenta en el acto, sin esperar al ciclo',
    (kind) => {
      expect(presentationGate(arriving({ kind }))).toEqual({ present: true })
    },
  )

  it('la espera nunca supera el límite y un límite nulo o inválido no retiene', () => {
    for (const elapsedMs of [0, 1, 999, 2999]) {
      const decision = presentationGate(arriving({ elapsedMs }))
      expect(decision.present).toBe(false)
      if (!decision.present) expect(decision.waitMs).toBeLessThanOrEqual(LIMIT)
    }
    for (const limitMs of [0, -1, Number.NaN]) {
      expect(presentationGate(arriving({ limitMs }))).toEqual({ present: true })
    }
  })

  it('el límite experimental aprobado es de 3000 ms, hasta que AV2 lo fije', () => {
    expect(PROVISIONAL_RETENTION_LIMIT_MS).toBe(3000)
  })

  describe('con reloj falso', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    // La operación termina cuando termina; el gate solo decide cuándo se enseña su resultado.
    it('un resultado que llega pronto se enseña al límite, sin tocar la operación', () => {
      const shown = vi.fn()
      const arrivedAt = Date.now()

      const decide = () =>
        presentationGate(
          arriving({ elapsedMs: Date.now() - arrivedAt, limitMs: LIMIT }),
        )
      const first = decide()
      expect(first.present).toBe(false)
      if (!first.present) setTimeout(shown, first.waitMs)

      vi.advanceTimersByTime(LIMIT - 1)
      expect(shown).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)

      expect(shown).toHaveBeenCalledOnce()
      expect(decide()).toEqual({ present: true })
    })
  })
})
