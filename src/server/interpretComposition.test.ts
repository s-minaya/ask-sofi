import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { AnalysisOutcome } from '../domain/analysis/analysisResult'
import { interpretMessage } from '../domain/analysis/interpretMessage'
import { createJevDecisionProvider } from '../infrastructure/ai/jevDecisionProvider'
import { SIGNAL_QUESTIONS } from '../infrastructure/ai/jevQuestions'
import {
  withEnglishPreparation,
  type EnglishPreparer,
} from '../infrastructure/language/englishPreparation'
import { TEST_POLICY_CONFIG } from '../test/analysisFixtures'
import {
  AFFECTED,
  API_KEY,
  gateway,
  SAFETY,
  SUFFICIENCY,
  withOverrides,
  type Override,
} from '../test/jevGateway'

// Cadena real salvo la red: el decorador de idioma, el adaptador de Jev y el
// núcleo, con la pasarela simulada por MSW (006-plan §7).
const english: EnglishPreparer = {
  prepare: async ({ message, context }) => ({
    ok: true,
    message,
    ...(context === undefined ? {} : { context }),
    provenance: {
      service: 'fake-translator',
      result: 'already_english',
      version: 'v1',
    },
  }),
}

const analyze = (raw: unknown): Promise<AnalysisOutcome> =>
  interpretMessage(raw, {
    provider: withEnglishPreparation(
      english,
      createJevDecisionProvider({
        apiKey: API_KEY,
        readings: { mode: 'when-needed', policy: TEST_POLICY_CONFIG },
      }),
    ),
    policy: TEST_POLICY_CONFIG,
  })

const PROFILE = { directness: 'drops-hints' } as const
const BOUNDARY = SIGNAL_QUESTIONS.setting_boundary.key
const resultOf = (outcome: AnalysisOutcome) => {
  if (!outcome.ok) throw new Error(`error inesperado: ${outcome.error.code}`)
  return outcome.result
}
const errorOf = (outcome: AnalysisOutcome) => {
  if (outcome.ok)
    throw new Error(`resultado inesperado: ${outcome.result.status}`)
  return outcome.error
}

describe('composición: decorador, adaptador de Jev y núcleo', () => {
  describe('seguridad', () => {
    it('un rechazo de la pregunta de seguridad acaba en safety_evaluation_unavailable', async () => {
      gateway(withOverrides({ [SAFETY]: 'refusal' }))

      const outcome = await analyze({ message: 'Si me dejas, te haré daño' })

      expect(errorOf(outcome)).toEqual({
        code: 'safety_evaluation_unavailable',
        retryable: false,
      })
    })

    it('un rechazo de seguridad nunca equivale a «sin riesgo»: no hay resultado', async () => {
      gateway(withOverrides({ [SAFETY]: 'refusal' }))

      const outcome = await analyze({ message: 'Vale.' })

      expect(outcome.ok).toBe(false)
    })

    it('con expediente e indicios en A, B no se envía y el resultado es safety_concern', async () => {
      const received = gateway(
        withOverrides({ [SAFETY]: 0.95, [AFFECTED[0]]: 0.9 }),
      )

      const outcome = await analyze({
        message: 'Si me dejas…',
        profile: PROFILE,
      })

      expect(received).toHaveLength(1)
      expect(resultOf(outcome)).toMatchObject({
        status: 'safety_concern',
        affectedPersonTypes: ['user_at_risk_from_other'],
        meta: { profileUsed: true },
      })
    })
  })

  describe('needs_context completo (decisión 6)', () => {
    it('con expediente y contexto insuficiente, B se envía y el límite explícito se conserva', async () => {
      const received = gateway((sent, index) =>
        withOverrides(
          index === 0 ? { [SUFFICIENCY]: 0.1 } : { [BOUNDARY]: 0.9 },
        )(sent),
      )

      const outcome = await analyze({
        message: 'No quiero que vengas hoy',
        profile: PROFILE,
      })

      expect(received).toHaveLength(2)
      expect(resultOf(outcome)).toMatchObject({
        status: 'needs_context',
        sufficiency: 'insufficient',
        preservedSignals: [{ id: 'setting_boundary', estimate: 0.9 }],
      })
    })

    it('sin expediente, la misma consulta conserva el límite con una sola petición', async () => {
      const received = gateway(
        withOverrides({ [SUFFICIENCY]: 0.1, [BOUNDARY]: 0.9 }),
      )

      const outcome = await analyze({ message: 'No quiero que vengas hoy' })

      expect(received).toHaveLength(1)
      expect(resultOf(outcome)).toMatchObject({
        status: 'needs_context',
        preservedSignals: [{ id: 'setting_boundary' }],
      })
    })

    it('si B falla, error técnico: nunca un needs_context sin los límites explícitos', async () => {
      gateway((sent, index) =>
        index === 0
          ? withOverrides({ [SUFFICIENCY]: 0.1 })(sent)
          : new HttpResponse(null, { status: 503 }),
      )

      const outcome = await analyze({
        message: 'No quiero que vengas hoy',
        profile: PROFILE,
      })

      expect(errorOf(outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: true,
      })
    })

    it('si B falla con contexto suficiente tampoco hay un resultado a medias', async () => {
      gateway((sent, index) =>
        index === 0
          ? withOverrides({})(sent)
          : new HttpResponse(null, { status: 429 }),
      )

      const outcome = await analyze({ message: 'Vale.', profile: PROFILE })

      expect(errorOf(outcome).code).toBe('processing_unavailable')
    })
  })

  describe('resultado completo', () => {
    it('con expediente y contexto suficiente une A y B en un resultado interpretado', async () => {
      const overrides: Record<string, Override> = {
        [SIGNAL_QUESTIONS.expressing_disappointment.key]: 0.81,
      }
      gateway((sent, index) =>
        withOverrides(index === 0 ? {} : overrides)(sent),
      )

      const outcome = await analyze({
        message: 'Me hacía ilusión verte, pero bueno…',
        profile: PROFILE,
      })

      expect(resultOf(outcome)).toMatchObject({
        status: 'interpreted',
        signals: [{ id: 'expressing_disappointment', estimate: 0.81 }],
        meta: {
          profileUsed: true,
          provider: {
            id: 'jev',
            alias: 'typesafe-ai/jev',
            respondedModel: 'typesafe-ai/jev',
            observedVersion: 'unknown',
            instructionVersion: expect.any(String),
          },
        },
      })
    })

    it('una respuesta con un valor inválido invalida todo el análisis', async () => {
      gateway(withOverrides({ [SIGNAL_QUESTIONS.literal_meaning.key]: 1.4 }))

      const outcome = await analyze({ message: 'Vale.' })

      expect(errorOf(outcome)).toEqual({
        code: 'invalid_provider_response',
        retryable: false,
      })
    })

    it('un 429 de la pasarela es un error reintentable, sin texto del proveedor', async () => {
      gateway(() =>
        HttpResponse.json({ error: { message: 'secreto' } }, { status: 429 }),
      )

      const outcome = await analyze({ message: 'Vale.' })

      expect(errorOf(outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: true,
      })
      expect(JSON.stringify(outcome)).not.toContain('secreto')
    })
  })
})
