import { describe, expect, it } from 'vitest'
import {
  parseDecisionPayload,
  type DecisionRequest,
} from '../../domain/analysis/decisionProvider'
import {
  createFakeDecisionProvider,
  FAKE_SCENARIOS,
  type FakeScenarioName,
} from './fakeDecisionProvider'

const request = (message: string, context?: string): DecisionRequest => ({
  assessment: { message, ...(context ? { context } : {}) },
  readings: { message, ...(context ? { context } : {}) },
})

const names = Object.keys(FAKE_SCENARIOS) as FakeScenarioName[]

describe('createFakeDecisionProvider', () => {
  it('devuelve siempre el mismo escenario, sea cual sea el texto', async () => {
    const provider = createFakeDecisionProvider('two-high-signals')

    const first = await provider.evaluate(request('Vale.'))
    const second = await provider.evaluate(
      request('Me hacía ilusión verte, pero bueno…', 'Cancelé la cena.'),
    )

    expect(second).toEqual(first)
  })

  it('se identifica como fake, sin alias ni versión observada', async () => {
    const reply = await createFakeDecisionProvider('two-high-signals').evaluate(
      request('Vale.'),
    )

    expect(reply).toMatchObject({ ok: true, provenance: { id: 'fake' } })
    if (reply.ok) {
      expect(reply.provenance).not.toHaveProperty('alias')
      expect(reply.provenance).not.toHaveProperty('observedVersion')
    }
  })

  it('cada llamada recibe una copia: modificar una respuesta no altera las siguientes', async () => {
    const provider = createFakeDecisionProvider('two-high-signals')

    const first = await provider.evaluate(request('a'))
    if (first.ok) (first.payload as { safety: number }).safety = 0.99
    const second = await provider.evaluate(request('a'))

    expect(second.ok && (second.payload as { safety: number }).safety).toBe(
      0.02,
    )
  })

  it('registra las peticiones recibidas para poder comprobarlas', async () => {
    const provider = createFakeDecisionProvider('two-high-signals')

    await provider.evaluate(request('uno'))
    await provider.evaluate(request('dos', 'contexto'))

    expect(provider.requests).toEqual([
      request('uno'),
      request('dos', 'contexto'),
    ])
  })

  it('no hace nada asíncrono real: resuelve sin red', async () => {
    await expect(
      createFakeDecisionProvider('provider-unavailable').evaluate(request('a')),
    ).resolves.toEqual({ ok: false, retryable: true })
  })
})

describe('escenarios', () => {
  const payloadOf = (name: FakeScenarioName) => {
    const reply = FAKE_SCENARIOS[name]
    if (!reply.ok) throw new Error(`${name} no tiene respuesta`)
    return reply.payload
  }

  it('cubre respuestas válidas, ausencias, rechazos, valores inválidos y fallos', () => {
    expect(names).toEqual(
      expect.arrayContaining([
        'two-high-signals',
        'explicit-zero',
        'safety-absent',
        'safety-rejected',
        'invalid-nan',
        'invalid-infinity',
        'invalid-negative',
        'invalid-above-one',
        'provider-unavailable',
        'provider-refused',
      ]),
    )
  })

  it('los escenarios de valores inválidos lo son de verdad', () => {
    for (const name of names.filter((n) => n.startsWith('invalid-')))
      expect(parseDecisionPayload(payloadOf(name)).ok, name).toBe(false)
  })

  it('el resto de respuestas cumple el contrato', () => {
    const failures = names.filter((n) => FAKE_SCENARIOS[n].ok === false)
    const invalid = names.filter((n) => n.startsWith('invalid-'))

    for (const name of names) {
      if (failures.includes(name) || invalid.includes(name)) continue
      expect(parseDecisionPayload(payloadOf(name)).ok, name).toBe(true)
    }
  })

  it('los fallos distinguen lo reintentable de lo que no lo es', () => {
    expect(FAKE_SCENARIOS['provider-unavailable']).toEqual({
      ok: false,
      retryable: true,
    })
    expect(FAKE_SCENARIOS['provider-refused']).toEqual({
      ok: false,
      retryable: false,
    })
  })

  it('las ausencias y los rechazos son lo que dicen ser', () => {
    const parsed = (name: FakeScenarioName) => {
      const check = parseDecisionPayload(payloadOf(name))
      if (!check.ok) throw new Error(name)
      return check.estimates
    }

    expect(parsed('safety-absent').safety).toBeUndefined()
    expect(parsed('safety-rejected').safety).toBe('rejected')
    expect(parsed('sufficiency-absent').sufficiency).toBeUndefined()
    expect(parsed('sufficiency-rejected').sufficiency).toBe('rejected')
    expect(parsed('no-readings').signals).toEqual({})
    expect(parsed('explicit-zero').signals.sarcastic_tone).toBe(0)
  })
})
