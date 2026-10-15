import { describe, expect, it } from 'vitest'
import {
  estimates,
  STRICT_TEST_POLICY_CONFIG,
  TEST_POLICY_CONFIG,
} from '../../test/analysisFixtures'
import { analysisPolicy, type PolicyConfig } from './analysisPolicy'
import type { DecisionEstimates } from './decisionProvider'

const normal = { omittedContentOnly: false }
const decide = (
  input: DecisionEstimates,
  config: PolicyConfig = TEST_POLICY_CONFIG,
  facts = normal,
) => analysisPolicy(input, facts, config)

const bodyOf = (decision: ReturnType<typeof decide>) => {
  if (!decision.ok) throw new Error(`error inesperado: ${decision.error.code}`)
  return decision.body
}
const errorOf = (decision: ReturnType<typeof decide>) => {
  if (decision.ok)
    throw new Error(`resultado inesperado: ${decision.body.status}`)
  return decision.error
}

describe('analysisPolicy', () => {
  describe('1. seguridad con indicios', () => {
    it('da safety_concern con los tipos de persona afectada, sin señales', () => {
      const body = bodyOf(
        decide(
          estimates({
            safety: 0.9,
            affected: { user_at_risk_from_other: 0.8 },
            signals: { expressing_annoyance: 0.9 },
          }),
        ),
      )

      expect(body).toEqual({
        status: 'safety_concern',
        affectedPersonTypes: ['user_at_risk_from_other'],
      })
    })

    it('admite varios tipos afectados, en el orden del vocabulario', () => {
      const body = bodyOf(
        decide(
          estimates({
            safety: 0.9,
            affected: {
              user_at_risk_of_self_harm: 0.7,
              user_at_risk_from_other: 0.6,
              other_at_risk_of_self_harm: 0.2,
            },
          }),
        ),
      )

      expect(body).toEqual({
        status: 'safety_concern',
        affectedPersonTypes: [
          'user_at_risk_from_other',
          'user_at_risk_of_self_harm',
        ],
      })
    })

    it('sin ningún tipo evaluado o por encima del umbral, el afectado es no determinado', () => {
      const unevaluated = bodyOf(
        decide(estimates({ safety: 0.9, affected: {} })),
      )
      const weak = bodyOf(
        decide(
          estimates({
            safety: 0.9,
            affected: { user_at_risk_from_other: 0.1 },
          }),
        ),
      )

      expect(unevaluated).toEqual({
        status: 'safety_concern',
        affectedPersonTypes: ['undetermined'],
      })
      expect(weak).toEqual(unevaluated)
    })

    it('prevalece aunque falten las demás estimaciones', () => {
      const body = bodyOf(
        decide({
          signals: {},
          safety: 0.9,
          affected: {},
          sufficiency: undefined,
        }),
      )

      expect(body.status).toBe('safety_concern')
    })

    it('prevalece aunque la suficiencia no se haya evaluado o se haya rechazado', () => {
      expect(
        bodyOf(decide(estimates({ safety: 0.9, sufficiency: undefined })))
          .status,
      ).toBe('safety_concern')
      expect(
        bodyOf(decide(estimates({ safety: 0.9, sufficiency: 'rejected' })))
          .status,
      ).toBe('safety_concern')
    })

    it('prevalece sobre el marcador de contenido omitido', () => {
      const body = bodyOf(
        decide(estimates({ safety: 0.9 }), TEST_POLICY_CONFIG, {
          omittedContentOnly: true,
        }),
      )

      expect(body.status).toBe('safety_concern')
    })

    it('el umbral es inclusivo', () => {
      expect(bodyOf(decide(estimates({ safety: 0.5 }))).status).toBe(
        'safety_concern',
      )
      expect(bodyOf(decide(estimates({ safety: 0.49 }))).status).toBe(
        'interpreted',
      )
    })
  })

  describe('2. seguridad no evaluada', () => {
    it('una ausencia da safety_evaluation_unavailable no reintentable', () => {
      expect(errorOf(decide(estimates({ safety: undefined })))).toEqual({
        code: 'safety_evaluation_unavailable',
        retryable: false,
      })
    })

    it('un rechazo da safety_evaluation_unavailable no reintentable', () => {
      expect(errorOf(decide(estimates({ safety: 'rejected' })))).toEqual({
        code: 'safety_evaluation_unavailable',
        retryable: false,
      })
    })

    it('nunca produce interpreted, needs_context ni safety_concern, aunque las lecturas sean buenas', () => {
      const decision = decide(
        estimates({
          safety: undefined,
          signals: { expressing_disappointment: 0.95, setting_boundary: 0.9 },
        }),
      )

      expect(decision.ok).toBe(false)
    })

    it('tiene prioridad sobre una suficiencia no evaluada', () => {
      const error = errorOf(
        decide(estimates({ safety: 'rejected', sufficiency: undefined })),
      )

      expect(error.code).toBe('safety_evaluation_unavailable')
    })

    it('tiene prioridad sobre el marcador de contenido omitido', () => {
      const error = errorOf(
        decide(estimates({ safety: undefined }), TEST_POLICY_CONFIG, {
          omittedContentOnly: true,
        }),
      )

      expect(error.code).toBe('safety_evaluation_unavailable')
    })
  })

  describe('3. marcador de contenido omitido', () => {
    const omitted = { omittedContentOnly: true }

    it('da needs_context con suficiencia insuficiente, nunca interpreted', () => {
      const body = bodyOf(
        decide(
          estimates({ signals: { literal_meaning: 0.9 }, sufficiency: 0.95 }),
          TEST_POLICY_CONFIG,
          omitted,
        ),
      )

      expect(body).toEqual({
        status: 'needs_context',
        sufficiency: 'insufficient',
      })
    })

    it('no conserva como límite lo que el proveedor lea en el marcador', () => {
      const body = bodyOf(
        decide(
          estimates({ signals: { setting_boundary: 0.95 } }),
          TEST_POLICY_CONFIG,
          omitted,
        ),
      )

      expect(body).not.toHaveProperty('preservedSignals')
    })

    it('si la suficiencia no se evaluó, da error técnico aunque haya un marcador', () => {
      expect(
        errorOf(
          decide(
            estimates({ sufficiency: undefined }),
            TEST_POLICY_CONFIG,
            omitted,
          ),
        ),
      ).toEqual({ code: 'processing_unavailable', retryable: false })
    })

    it('un rechazo de suficiencia da error aunque haya un marcador', () => {
      expect(
        errorOf(
          decide(
            estimates({ sufficiency: 'rejected' }),
            TEST_POLICY_CONFIG,
            omitted,
          ),
        ),
      ).toEqual({ code: 'processing_unavailable', retryable: false })
    })
  })

  describe('4. suficiencia no evaluada', () => {
    it('una ausencia da un error técnico no reintentable', () => {
      expect(errorOf(decide(estimates({ sufficiency: undefined })))).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
    })

    it('un rechazo da un error técnico no reintentable', () => {
      expect(errorOf(decide(estimates({ sufficiency: 'rejected' })))).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
    })

    it('no se convierte en needs_context', () => {
      expect(decide(estimates({ sufficiency: undefined })).ok).toBe(false)
    })
  })

  describe('5. contexto insuficiente', () => {
    it('«Vale.» sin contexto da needs_context sin error técnico', () => {
      const body = bodyOf(
        decide(
          estimates({ signals: { literal_meaning: 0.4 }, sufficiency: 0.1 }),
        ),
      )

      expect(body).toEqual({
        status: 'needs_context',
        sufficiency: 'insufficient',
      })
    })

    it('un límite explícito con suficiencia insuficiente se conserva', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: { setting_boundary: 0.9, inviting_initiative: 0.7 },
            sufficiency: 0.1,
          }),
        ),
      )

      expect(body).toEqual({
        status: 'needs_context',
        sufficiency: 'insufficient',
        preservedSignals: [
          { id: 'setting_boundary', kind: 'reading', estimate: 0.9 },
        ],
      })
    })

    it('conserva el límite y la petición de espacio, en el orden del catálogo, y solo ellos', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: {
              setting_boundary: 0.8,
              requesting_space: 0.7,
              literal_meaning: 0.9,
            },
            sufficiency: 0.1,
          }),
        ),
      )

      expect(body).toMatchObject({
        status: 'needs_context',
        preservedSignals: [
          { id: 'requesting_space', kind: 'reading', estimate: 0.7 },
          { id: 'setting_boundary', kind: 'reading', estimate: 0.8 },
        ],
      })
    })

    it('un límite por debajo del umbral no se conserva', () => {
      const body = bodyOf(
        decide(
          estimates({ signals: { setting_boundary: 0.2 }, sufficiency: 0.1 }),
        ),
      )

      expect(body).not.toHaveProperty('preservedSignals')
    })

    it('no exige haber evaluado ninguna lectura', () => {
      const body = bodyOf(decide(estimates({ signals: {}, sufficiency: 0.1 })))

      expect(body.status).toBe('needs_context')
    })

    it('pasa la indicación de qué falta cuando el proveedor la da', () => {
      const body = bodyOf(
        decide(
          estimates({ sufficiency: 0.1, missingInformation: 'lo propuesto' }),
        ),
      )

      expect(body).toMatchObject({
        status: 'needs_context',
        missingInformation: 'lo propuesto',
      })
    })

    it('los cortes de nivel son: < insufficientBelow, ≥ sufficientFrom y partial entre ambos', () => {
      const level = (sufficiency: number, config = TEST_POLICY_CONFIG) =>
        bodyOf(
          decide(estimates({ sufficiency }), {
            ...config,
            sufficiency: {
              ...config.sufficiency,
              requestContextWhenPartial: true,
            },
          }),
        )

      expect(level(0.29)).toMatchObject({ sufficiency: 'insufficient' })
      expect(level(0.3)).toMatchObject({ sufficiency: 'partial' })
      expect(level(0.59)).toMatchObject({ sufficiency: 'partial' })
      expect(level(0.6).status).toBe('interpreted')
    })

    it('partial interpreta o pide contexto según la configuración', () => {
      const partial = estimates({ sufficiency: 0.45 })

      expect(bodyOf(decide(partial)).status).toBe('interpreted')
      expect(
        bodyOf(
          decide(partial, {
            ...TEST_POLICY_CONFIG,
            sufficiency: {
              ...TEST_POLICY_CONFIG.sufficiency,
              requestContextWhenPartial: true,
            },
          }),
        ),
      ).toEqual({ status: 'needs_context', sufficiency: 'partial' })
    })
  })

  describe('6. ninguna lectura evaluada', () => {
    it('con contexto suficiente no es un interpreted vacío sino un error técnico', () => {
      expect(errorOf(decide(estimates({ signals: {} })))).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
    })
  })

  describe('7. interpretación', () => {
    it('conserva dos señales altas sin repartirlas ni elegir ganadora', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: {
              expressing_disappointment: 0.81,
              inviting_initiative: 0.65,
            },
          }),
        ),
      )

      expect(body).toEqual({
        status: 'interpreted',
        safety: 'no_concern_detected',
        signals: [
          { id: 'inviting_initiative', kind: 'reading', estimate: 0.65 },
          { id: 'expressing_disappointment', kind: 'reading', estimate: 0.81 },
        ],
      })
    })

    it('conserva a la vez una lectura y una pista que parecen en tensión', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: { literal_meaning: 0.83, sarcastic_tone: 0.78 },
          }),
        ),
      )

      expect(body).toMatchObject({
        status: 'interpreted',
        signals: [
          { id: 'literal_meaning', kind: 'reading', estimate: 0.83 },
          { id: 'sarcastic_tone', kind: 'cue', estimate: 0.78 },
        ],
      })
    })

    it('sin ninguna señal comunicable, pero con la evaluación completa, es interpreted con cero señales', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: { literal_meaning: 0.2, sarcastic_tone: 0.1 },
            sufficiency: 0.9,
          }),
        ),
      )

      expect(body).toEqual({
        status: 'interpreted',
        safety: 'no_concern_detected',
        signals: [],
      })
    })

    it('un 0 explícito no es lo mismo que una señal ausente', () => {
      const permissive: PolicyConfig = {
        ...TEST_POLICY_CONFIG,
        signals: { communicableAt: 0 },
      }

      const body = bodyOf(
        decide(estimates({ signals: { sarcastic_tone: 0 } }), permissive),
      )

      expect(body).toMatchObject({
        signals: [{ id: 'sarcastic_tone', kind: 'cue', estimate: 0 }],
      })
    })

    it('el umbral de señal comunicable es inclusivo', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: { literal_meaning: 0.5, playful_teasing: 0.49 },
          }),
        ),
      )

      expect(body).toMatchObject({
        signals: [{ id: 'literal_meaning', kind: 'reading', estimate: 0.5 }],
      })
    })

    it('no incluye confianza global ni modifica las estimaciones', () => {
      const body = bodyOf(
        decide(
          estimates({
            signals: { literal_meaning: 0.71, setting_boundary: 0.9 },
          }),
        ),
      )

      expect(body).not.toHaveProperty('confidence')
      expect(body).toMatchObject({
        signals: [
          { id: 'literal_meaning', estimate: 0.71 },
          { id: 'setting_boundary', estimate: 0.9 },
        ],
      })
    })
  })

  describe('parámetros', () => {
    const input = estimates({
      signals: { literal_meaning: 0.6, sarcastic_tone: 0.95 },
      sufficiency: 0.8,
    })

    it('dos configuraciones distintas dan salidas distintas con las mismas estimaciones', () => {
      const lenient = bodyOf(decide(input, TEST_POLICY_CONFIG))
      const strict = bodyOf(decide(input, STRICT_TEST_POLICY_CONFIG))

      expect(lenient).toMatchObject({
        status: 'interpreted',
        signals: [{ id: 'literal_meaning' }, { id: 'sarcastic_tone' }],
      })
      expect(strict).toMatchObject({
        status: 'needs_context',
        sufficiency: 'partial',
      })
    })

    it('la seguridad también depende de su parámetro', () => {
      const borderline = estimates({ safety: 0.3 })

      expect(bodyOf(decide(borderline, TEST_POLICY_CONFIG)).status).toBe(
        'interpreted',
      )
      expect(bodyOf(decide(borderline, STRICT_TEST_POLICY_CONFIG)).status).toBe(
        'safety_concern',
      )
    })
  })

  it('es pura: no modifica las estimaciones recibidas', () => {
    const input = estimates({
      signals: { setting_boundary: 0.9, literal_meaning: 0.4 },
      sufficiency: 0.1,
    })
    const before = structuredClone(input)

    decide(input)

    expect(input).toEqual(before)
  })
})
