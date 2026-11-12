import { describe, expect, it } from 'vitest'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'
import {
  IDLE_DEFAULT_MS,
  IDLE_MAX_MS,
  IDLE_MIN_MS,
  IDLE_STEP_MS,
  SPEC_IDLE_MAX_MS,
  SPEC_IDLE_MIN_MS,
  formatIdle,
  idleVerdict,
} from './gagBadge'

// T066: la inactividad de `are-u-still-here` se ajusta en el Lab. El valor de partida es el del
// plan (§6), el mismo que usa el adaptador; la spec fija la horquilla de 2 a 3 minutos (§5).

describe('rango de la inactividad', () => {
  it('parte del valor aprobado del plan, que es el del adaptador', () => {
    expect(IDLE_DEFAULT_MS).toBe(STILL_HERE_IDLE_MS)
    expect(IDLE_DEFAULT_MS).toBe(150_000)
  })

  it('el valor de partida cae en el rango y en un paso exacto', () => {
    expect(IDLE_DEFAULT_MS).toBeGreaterThanOrEqual(IDLE_MIN_MS)
    expect(IDLE_DEFAULT_MS).toBeLessThanOrEqual(IDLE_MAX_MS)
    expect((IDLE_DEFAULT_MS - IDLE_MIN_MS) % IDLE_STEP_MS).toBe(0)
  })

  it('permite probar con segundos y llega a los extremos de la horquilla de la spec', () => {
    expect(IDLE_MIN_MS).toBeLessThanOrEqual(5_000)
    expect(IDLE_MIN_MS).toBeLessThan(SPEC_IDLE_MIN_MS)
    expect(IDLE_MAX_MS).toBeGreaterThanOrEqual(SPEC_IDLE_MAX_MS)
    for (const edge of [SPEC_IDLE_MIN_MS, SPEC_IDLE_MAX_MS])
      expect((edge - IDLE_MIN_MS) % IDLE_STEP_MS).toBe(0)
  })

  it('la horquilla de la spec son 2 y 3 minutos', () => {
    expect(SPEC_IDLE_MIN_MS).toBe(120_000)
    expect(SPEC_IDLE_MAX_MS).toBe(180_000)
  })
})

describe('formatIdle', () => {
  it.each([
    [5_000, '5 s'],
    [45_000, '45 s'],
    [60_000, '1 min'],
    [120_000, '2 min'],
    [150_000, '2 min 30 s'],
    [180_000, '3 min'],
  ])('%i ms se lee «%s»', (ms, text) => {
    expect(formatIdle(ms)).toBe(text)
  })
})

describe('idleVerdict', () => {
  it('dice si el valor cabe en la horquilla de la spec o es solo una demostración', () => {
    expect(idleVerdict(5_000)).toBe('demo')
    expect(idleVerdict(115_000)).toBe('demo')
    expect(idleVerdict(120_000)).toBe('spec')
    expect(idleVerdict(150_000)).toBe('spec')
    expect(idleVerdict(180_000)).toBe('spec')
  })
})
