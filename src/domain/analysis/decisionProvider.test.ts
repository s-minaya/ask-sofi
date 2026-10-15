import { describe, expect, it } from 'vitest'
import { parseDecisionPayload } from './decisionProvider'

const estimatesOf = (payload: unknown) => {
  const parsed = parseDecisionPayload(payload)
  if (!parsed.ok) throw new Error('la respuesta debería ser válida')
  return parsed.estimates
}

const isInvalid = (payload: unknown) =>
  parseDecisionPayload(payload).ok === false

describe('parseDecisionPayload', () => {
  describe('respuestas válidas', () => {
    it('una respuesta vacía no evalúa nada: todo queda ausente', () => {
      expect(estimatesOf({})).toEqual({
        signals: {},
        safety: undefined,
        affected: {},
        sufficiency: undefined,
      })
    })

    it('conserva las estimaciones tal como llegan, sin normalizarlas', () => {
      const estimates = estimatesOf({
        signals: { expressing_disappointment: 0.81, inviting_initiative: 0.65 },
        safety: 0.02,
        sufficiency: 0.9,
      })

      expect(estimates.signals).toEqual({
        expressing_disappointment: 0.81,
        inviting_initiative: 0.65,
      })
      expect(estimates.safety).toBe(0.02)
      expect(estimates.sufficiency).toBe(0.9)
    })

    it('un 0 explícito es un dato válido', () => {
      const { signals } = estimatesOf({ signals: { sarcastic_tone: 0 } })

      expect(signals.sarcastic_tone).toBe(0)
      expect('sarcastic_tone' in signals).toBe(true)
    })

    it('una señal ausente sigue ausente: no se convierte en 0 ni en una media', () => {
      const { signals } = estimatesOf({
        signals: { literal_meaning: 0.7 },
      })

      expect(Object.keys(signals)).toEqual(['literal_meaning'])
      expect(signals.sarcastic_tone).toBeUndefined()
    })

    it('admite los extremos del rango', () => {
      const { signals } = estimatesOf({
        signals: { literal_meaning: 0, setting_boundary: 1 },
      })

      expect(signals).toEqual({ literal_meaning: 0, setting_boundary: 1 })
    })

    it('un rechazo de seguridad o de suficiencia se distingue de una ausencia', () => {
      expect(estimatesOf({ safety: 'rejected' }).safety).toBe('rejected')
      expect(estimatesOf({ sufficiency: 'rejected' }).sufficiency).toBe(
        'rejected',
      )
      expect(estimatesOf({}).safety).toBeUndefined()
    })

    it('recoge a quién afecta el riesgo', () => {
      const { affected } = estimatesOf({
        affected: { user_at_risk_from_other: 0.9, undetermined: 0.1 },
      })

      expect(affected).toEqual({
        user_at_risk_from_other: 0.9,
        undetermined: 0.1,
      })
    })

    it('pasa tal cual la indicación opcional de qué falta', () => {
      expect(
        estimatesOf({ missingInformation: 'lo que se propuso' })
          .missingInformation,
      ).toBe('lo que se propuso')
    })
  })

  describe('valores inválidos: invalidan toda la respuesta, no se corrigen', () => {
    it.each([
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
      ['-Infinity', Number.NEGATIVE_INFINITY],
      ['un negativo', -0.1],
      ['un valor mayor que 1', 1.1],
    ])('%s en una señal', (_, value) => {
      expect(isInvalid({ signals: { literal_meaning: value } })).toBe(true)
    })

    it.each([
      ['seguridad', { safety: Number.NaN }],
      ['seguridad', { safety: 1.1 }],
      ['suficiencia', { sufficiency: -0.1 }],
      ['suficiencia', { sufficiency: Number.POSITIVE_INFINITY }],
      ['persona afectada', { affected: { undetermined: 2 } }],
    ])('un valor fuera de rango en %s', (_, payload) => {
      expect(isInvalid(payload)).toBe(true)
    })

    it('un valor inválido no se salva por que las demás señales sean buenas', () => {
      expect(
        isInvalid({
          signals: { literal_meaning: 0.8, sarcastic_tone: Number.NaN },
        }),
      ).toBe(true)
    })
  })

  describe('forma incorrecta', () => {
    it.each([
      ['un texto numérico', { signals: { literal_meaning: '0.5' } }],
      ['un booleano', { signals: { literal_meaning: true } }],
      [
        'null: la ausencia es la clave ausente',
        { signals: { literal_meaning: null } },
      ],
      ['un rechazo en una señal', { signals: { literal_meaning: 'rejected' } }],
      ['una señal desconocida', { signals: { unclear: 0.5 } }],
      ['una persona afectada desconocida', { affected: { bystander: 0.5 } }],
      [
        'un rechazo en el riesgo afectado',
        { affected: { undetermined: 'rejected' } },
      ],
      ['seguridad con otro texto', { safety: 'maybe' }],
      ['señales que no son un objeto', { signals: [0.5] }],
      ['una confianza global', { confidence: 0.9 }],
      ['una indicación vacía', { missingInformation: '' }],
      ['una indicación que no es texto', { missingInformation: 3 }],
    ])('rechaza %s', (_, payload) => {
      expect(isInvalid(payload)).toBe(true)
    })

    it.each([[null], [undefined], ['texto'], [42], [[]]])(
      'rechaza una respuesta que no es un objeto (%j)',
      (payload) => {
        expect(isInvalid(payload)).toBe(true)
      },
    )
  })
})
