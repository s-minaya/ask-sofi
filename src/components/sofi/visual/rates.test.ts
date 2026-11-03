import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PRODUCTION_RATES,
  clearSessionRates,
  rateFor,
  setSessionRate,
  subscribeToRates,
} from './rates'
import { SOFI_ANIMATION_IDS } from './types'

// Spec 008 §8 (D-7): un factor por recurso, 1× por defecto, en un único lugar. Es un
// factor sobre la línea de tiempo del parcial, nunca una duración.
afterEach(clearSessionRates)

describe('rateFor', () => {
  it('es 1× para todos los recursos mientras nadie lo cambie', () => {
    for (const id of SOFI_ANIMATION_IDS) expect(rateFor(id)).toBe(1)
  })

  it('el factor de producción vive en una sola tabla de factores válidos', () => {
    for (const [id, rate] of Object.entries(PRODUCTION_RATES)) {
      expect(SOFI_ANIMATION_IDS).toContain(id)
      expect(Number.isFinite(rate) && rate > 0).toBe(true)
    }
  })
})

describe('sobrescritura de sesión (la usa el Lab)', () => {
  it('cambia solo el recurso indicado y se puede deshacer', () => {
    setSessionRate('sofing', 0.25)

    expect(rateFor('sofing')).toBe(0.25)
    expect(rateFor('rolling')).toBe(1)

    clearSessionRates()
    expect(rateFor('sofing')).toBe(1)
  })

  it('no toca el factor de producción ni persiste nada', () => {
    const before = JSON.stringify(PRODUCTION_RATES)

    setSessionRate('talking', 2)

    expect(JSON.stringify(PRODUCTION_RATES)).toBe(before)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el factor %s y conserva el anterior',
    (rate) => {
      setSessionRate('sofing', 2)

      expect(() => setSessionRate('sofing', rate)).toThrow(RangeError)
      expect(rateFor('sofing')).toBe(2)
    },
  )
})

// `SofiSprite` se entera del cambio por aquí, no volviendo a pintar desde fuera.
describe('suscripción a los cambios', () => {
  it('avisa al fijar y al deshacer, y no a quien se dio de baja ni ante un factor inválido', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToRates(listener)

    setSessionRate('sofing', 2)
    expect(listener).toHaveBeenCalledTimes(1)
    clearSessionRates()
    expect(listener).toHaveBeenCalledTimes(2)

    expect(() => setSessionRate('sofing', 0)).toThrow(RangeError)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    setSessionRate('sofing', 3)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
