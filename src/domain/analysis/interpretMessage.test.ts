import { describe, expect, it } from 'vitest'
import {
  createFakeDecisionProvider,
  FAKE_SCENARIOS,
  type FakeScenarioName,
} from '../../infrastructure/ai/fakeDecisionProvider'
import {
  STRICT_TEST_POLICY_CONFIG,
  TEST_POLICY_CONFIG,
} from '../../test/analysisFixtures'
import type { PolicyConfig } from './analysisPolicy'
import type { AnalysisOutcome } from './analysisResult'
import type { DecisionProvider } from './decisionProvider'
import { interpretMessage } from './interpretMessage'
import { selectAuthorizedProfile } from './profileSelection'
import type { PartnerProfile } from '../partner-profile/partnerProfile'

const MESSAGE = 'Me hacía ilusión verte, pero bueno…'

const run = async (
  raw: unknown,
  scenario: FakeScenarioName,
  policy: PolicyConfig = TEST_POLICY_CONFIG,
) => {
  const provider = createFakeDecisionProvider(scenario)
  const outcome = await interpretMessage(raw, { provider, policy })
  return { outcome, provider }
}

const resultOf = (outcome: AnalysisOutcome) => {
  if (!outcome.ok) throw new Error(`error inesperado: ${outcome.error.code}`)
  return outcome.result
}
const errorOf = (outcome: AnalysisOutcome) => {
  if (outcome.ok)
    throw new Error(`resultado inesperado: ${outcome.result.status}`)
  return outcome.error
}

describe('interpretMessage', () => {
  describe('resultado', () => {
    it('interpreta con varias señales independientes, sin reparto ni confianza global', async () => {
      const { outcome } = await run({ message: MESSAGE }, 'two-high-signals')
      const result = resultOf(outcome)

      expect(result).toMatchObject({
        status: 'interpreted',
        safety: 'no_concern_detected',
        signals: [
          { id: 'inviting_initiative', kind: 'reading', estimate: 0.65 },
          { id: 'expressing_disappointment', kind: 'reading', estimate: 0.81 },
        ],
      })
      expect(result).not.toHaveProperty('confidence')
      expect(result).not.toHaveProperty('meta.confidence')
    })

    it('«Vale.» sin contexto es needs_context válido, no un error', async () => {
      const { outcome } = await run({ message: 'Vale.' }, 'context-needed')

      expect(outcome.ok).toBe(true)
      expect(resultOf(outcome)).toMatchObject({
        status: 'needs_context',
        sufficiency: 'insufficient',
      })
    })

    it('un límite explícito se conserva aunque falte contexto', async () => {
      const { outcome } = await run(
        { message: 'No quiero que vengas hoy' },
        'boundary-without-context',
      )

      expect(resultOf(outcome)).toMatchObject({
        status: 'needs_context',
        preservedSignals: [{ id: 'setting_boundary', estimate: 0.9 }],
      })
    })

    it('sin señales comunicables y con la evaluación completa es interpreted con cero señales', async () => {
      const { outcome } = await run({ message: 'Ok' }, 'nothing-communicable')

      expect(resultOf(outcome)).toMatchObject({
        status: 'interpreted',
        signals: [],
      })
    })

    it('los indicios de riesgo dan safety_concern, sin señales', async () => {
      const { outcome } = await run(
        { message: 'Si me dejas…' },
        'safety-concern',
      )
      const result = resultOf(outcome)

      expect(result).toMatchObject({
        status: 'safety_concern',
        affectedPersonTypes: ['user_at_risk_from_other'],
      })
      expect(result).not.toHaveProperty('signals')
    })

    it('safety_concern prevalece aunque falten las demás estimaciones', async () => {
      const { outcome } = await run({ message: 'x' }, 'safety-concern-only')

      expect(resultOf(outcome).status).toBe('safety_concern')
    })

    it('un mensaje que solo es un marcador omitido nunca es interpreted', async () => {
      const { outcome, provider } = await run(
        { message: 'Audio omitido' },
        'two-high-signals',
      )

      expect(resultOf(outcome)).toEqual(
        expect.objectContaining({
          status: 'needs_context',
          sufficiency: 'insufficient',
        }),
      )
      expect(provider.requests).toHaveLength(1)
    })

    it('el marcador omitido no oculta un riesgo que haya en el contexto', async () => {
      const { outcome } = await run(
        { message: 'Audio omitido', context: 'Antes me amenazó.' },
        'safety-concern',
      )

      expect(resultOf(outcome).status).toBe('safety_concern')
    })

    it('el marcador omitido no sustituye a una seguridad no evaluada', async () => {
      const { outcome } = await run(
        { message: 'Audio omitido' },
        'safety-absent',
      )

      expect(errorOf(outcome).code).toBe('safety_evaluation_unavailable')
    })

    it('el marcador omitido no convierte un fallo de suficiencia en needs_context', async () => {
      const { outcome } = await run(
        { message: 'Audio omitido' },
        'sufficiency-absent',
      )

      expect(errorOf(outcome).code).toBe('processing_unavailable')
    })
  })

  describe('metadatos', () => {
    it('lleva las versiones, profileUsed y la procedencia del fake', async () => {
      const { outcome } = await run({ message: MESSAGE }, 'two-high-signals')

      expect(resultOf(outcome).meta).toEqual({
        schemaVersion: 1,
        taxonomyVersion: 1,
        policyVersion: 'test-a',
        profileUsed: false,
        provider: { id: 'fake', observedVersion: 'unknown' },
      })
    })

    it('policyVersion refleja la configuración que se aplicó', async () => {
      const { outcome } = await run(
        { message: MESSAGE },
        'two-high-signals',
        STRICT_TEST_POLICY_CONFIG,
      )

      expect(resultOf(outcome).meta.policyVersion).toBe('test-b')
    })

    it('dos configuraciones distintas dan resultados distintos con la misma respuesta', async () => {
      const lenient = resultOf(
        (await run({ message: MESSAGE }, 'literal-and-sarcastic')).outcome,
      )
      const strict = resultOf(
        (
          await run(
            { message: MESSAGE },
            'literal-and-sarcastic',
            STRICT_TEST_POLICY_CONFIG,
          )
        ).outcome,
      )

      expect(lenient.status).toBe('interpreted')
      expect(strict.status).toBe('needs_context')
    })

    it('declara la versión y el alias solo si el proveedor los observó', async () => {
      const provider: DecisionProvider = {
        evaluate: async () => ({
          ok: true,
          payload: {
            signals: { literal_meaning: 0.7 },
            safety: 0.01,
            sufficiency: 0.9,
          },
          provenance: {
            id: 'jev',
            alias: 'vendor/model',
            observedVersion: '1.2.3',
          },
        }),
      }

      const outcome = await interpretMessage(
        { message: 'a' },
        { provider, policy: TEST_POLICY_CONFIG },
      )

      expect(resultOf(outcome).meta.provider).toEqual({
        id: 'jev',
        alias: 'vendor/model',
        observedVersion: '1.2.3',
      })
    })

    it('transmite el modelo que respondió y la versión de las instrucciones cuando el proveedor los declara', async () => {
      const provider: DecisionProvider = {
        evaluate: async () => ({
          ok: true,
          payload: {
            signals: { literal_meaning: 0.7 },
            safety: 0.01,
            sufficiency: 0.9,
          },
          provenance: {
            id: 'jev',
            alias: 'typesafe-ai/jev',
            respondedModel: 'typesafe-ai/jev',
            instructionVersion: '2026-10-a',
          },
        }),
      }

      const outcome = await interpretMessage(
        { message: 'a' },
        { provider, policy: TEST_POLICY_CONFIG },
      )

      expect(resultOf(outcome).meta.provider).toEqual({
        id: 'jev',
        alias: 'typesafe-ai/jev',
        // Sin versión observada, sigue siendo 'unknown': nada se inventa.
        observedVersion: 'unknown',
        respondedModel: 'typesafe-ai/jev',
        instructionVersion: '2026-10-a',
      })
    })

    it('el fake no declara modelo ni instrucciones: los campos no existen en los metadatos', async () => {
      const { outcome } = await run({ message: MESSAGE }, 'two-high-signals')
      const { provider } = resultOf(outcome).meta

      expect(provider).not.toHaveProperty('respondedModel')
      expect(provider).not.toHaveProperty('instructionVersion')
    })

    it('ni el resultado ni los metadatos contienen el mensaje, el contexto ni el expediente', async () => {
      const { outcome } = await run(
        {
          message: 'Mensaje secreto de la pareja',
          context: 'Contexto privado de la conversación',
          profile: { directness: 'drops-hints' },
        },
        'two-high-signals',
      )

      const serialized = JSON.stringify(resultOf(outcome))
      expect(serialized).not.toContain('Mensaje secreto')
      expect(serialized).not.toContain('Contexto privado')
      expect(serialized).not.toContain('drops-hints')
    })
  })

  describe('expediente', () => {
    it('sin expediente no envía ninguno y profileUsed es false', async () => {
      const { outcome, provider } = await run(
        { message: MESSAGE, context: 'Cancelé la cena.' },
        'two-high-signals',
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(false)
      expect(provider.requests).toEqual([
        {
          assessment: { message: MESSAGE, context: 'Cancelé la cena.' },
          readings: { message: MESSAGE, context: 'Cancelé la cena.' },
        },
      ])
    })

    it('con respuestas concretas, solo las lecturas reciben el expediente', async () => {
      const profile = { directness: 'drops-hints', sarcasm: 'often' } as const
      const { outcome, provider } = await run(
        { message: MESSAGE, profile },
        'two-high-signals',
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(true)
      const [request] = provider.requests
      expect(request.readings.profile).toEqual(profile)
      expect(request.assessment).toEqual({ message: MESSAGE })
      expect(request.assessment).not.toHaveProperty('profile')
    })

    it('un expediente autorizado sin respuestas concretas no se envía y profileUsed es false', async () => {
      const { outcome, provider } = await run(
        { message: MESSAGE, profile: {} },
        'two-high-signals',
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(false)
      expect(provider.requests[0].readings).not.toHaveProperty('profile')
    })

    it('hace una sola petición: no pide las lecturas con y sin expediente', async () => {
      const { provider } = await run(
        { message: MESSAGE, profile: { sarcasm: 'often' } },
        'two-high-signals',
      )

      expect(provider.requests).toHaveLength(1)
    })

    it('profileUsed también es verdadero en un safety_concern: el expediente viajó', async () => {
      const { outcome } = await run(
        { message: 'x', profile: { sarcasm: 'often' } },
        'safety-concern',
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(true)
    })

    it('no modifica la entrada recibida', async () => {
      const raw = {
        message: MESSAGE,
        context: 'c',
        profile: { conflict: 'talk-now' },
      }
      const before = structuredClone(raw)

      await run(raw, 'two-high-signals')

      expect(raw).toEqual(before)
    })
  })

  // El expediente llega al núcleo ya minimizado por selectAuthorizedProfile: aquí
  // se comprueba la cadena completa de 005-spec «Expediente».
  describe('expediente: de la selección al proveedor', () => {
    const local = (answers: PartnerProfile['answers']): PartnerProfile => ({
      answers,
      notes: 'Notas privadas que no deben salir',
    })
    const analyze = async (profile: PartnerProfile, authorized: boolean) => {
      const provider = createFakeDecisionProvider('two-high-signals')
      const outcome = await interpretMessage(
        {
          message: MESSAGE,
          profile: selectAuthorizedProfile(profile, authorized),
        },
        { provider, policy: TEST_POLICY_CONFIG },
      )
      return { outcome, provider }
    }

    it('autorizado, pero solo con «No lo sé», «Depende», áreas vacías o notas: no se envía nada', async () => {
      const { outcome, provider } = await analyze(
        local({ directness: 'unknown', sarcasm: 'depends' }),
        true,
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(false)
      expect(provider.requests[0].readings).not.toHaveProperty('profile')
    })

    it('con una respuesta concreta y otra desconocida, solo viaja la concreta y solo a las lecturas', async () => {
      const { outcome, provider } = await analyze(
        local({ sarcasm: 'often', personalSpace: 'unknown' }),
        true,
      )

      const [request] = provider.requests
      expect(resultOf(outcome).meta.profileUsed).toBe(true)
      expect(request.readings.profile).toEqual({ sarcasm: 'often' })
      expect(request.assessment).not.toHaveProperty('profile')
      expect(JSON.stringify(request)).not.toContain('Notas privadas')
    })

    it('sin autorización no se envía nada, aunque exista un expediente local', async () => {
      const { outcome, provider } = await analyze(
        local({ directness: 'drops-hints', sarcasm: 'often' }),
        false,
      )

      expect(resultOf(outcome).meta.profileUsed).toBe(false)
      expect(JSON.stringify(provider.requests)).not.toContain('drops-hints')
    })
  })

  describe('errores', () => {
    it.each([
      ['un mensaje vacío', { message: '   ' }],
      ['un mensaje demasiado largo', { message: 'a'.repeat(5000) }],
      ['una entrada que no es un objeto', 'Vale.'],
      [
        'un expediente sin minimizar',
        { message: 'a', profile: { sarcasm: 'unknown' } },
      ],
      ['las notas del expediente', { message: 'a', profile: { notes: 'x' } }],
    ])('rechaza %s sin llamar al proveedor', async (_, raw) => {
      const { outcome, provider } = await run(raw, 'two-high-signals')

      expect(errorOf(outcome)).toEqual({
        code: 'invalid_input',
        retryable: false,
      })
      expect(provider.requests).toHaveLength(0)
    })

    it('no trunca en silencio: un mensaje largo es un error, no un mensaje recortado', async () => {
      const { outcome, provider } = await run(
        { message: 'a'.repeat(2001) },
        'two-high-signals',
      )

      expect(outcome.ok).toBe(false)
      expect(provider.requests).toHaveLength(0)
    })

    it('un fallo del proveedor da un error con retryable', async () => {
      const retryable = await run({ message: 'a' }, 'provider-unavailable')
      const refused = await run({ message: 'a' }, 'provider-refused')

      expect(errorOf(retryable.outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: true,
      })
      expect(errorOf(refused.outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
    })

    it('una excepción del proveedor da un error que no filtra su texto', async () => {
      const provider: DecisionProvider = {
        evaluate: async () => {
          throw new Error('ECONNRESET sk-secreto')
        },
      }

      const outcome = await interpretMessage(
        { message: 'a' },
        { provider, policy: TEST_POLICY_CONFIG },
      )

      expect(errorOf(outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
      expect(JSON.stringify(outcome)).not.toContain('secreto')
    })

    it.each([
      'invalid-nan',
      'invalid-infinity',
      'invalid-negative',
      'invalid-above-one',
    ] as const)(
      'un valor inválido (%s) da invalid_provider_response',
      async (scenario) => {
        const { outcome } = await run({ message: 'a' }, scenario)

        expect(errorOf(outcome)).toEqual({
          code: 'invalid_provider_response',
          retryable: false,
        })
      },
    )

    it('la seguridad no evaluada da safety_evaluation_unavailable, no reintentable', async () => {
      const absent = await run({ message: 'a' }, 'safety-absent')
      const rejected = await run({ message: 'a' }, 'safety-rejected')

      expect(errorOf(absent.outcome)).toEqual({
        code: 'safety_evaluation_unavailable',
        retryable: false,
      })
      expect(errorOf(rejected.outcome)).toEqual({
        code: 'safety_evaluation_unavailable',
        retryable: false,
      })
    })

    it('la suficiencia no evaluada es un error técnico, no reintentable', async () => {
      const absent = await run({ message: 'a' }, 'sufficiency-absent')
      const rejected = await run({ message: 'a' }, 'sufficiency-rejected')

      expect(errorOf(absent.outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
      expect(errorOf(rejected.outcome)).toEqual({
        code: 'processing_unavailable',
        retryable: false,
      })
    })

    it('sin ninguna lectura evaluada no hay interpreted vacío sino un error técnico', async () => {
      const { outcome } = await run({ message: 'a' }, 'no-readings')

      expect(errorOf(outcome).code).toBe('processing_unavailable')
    })

    it('ningún error se presenta como un resultado', async () => {
      const failing: FakeScenarioName[] = [
        'provider-unavailable',
        'provider-refused',
        'invalid-nan',
        'safety-absent',
        'safety-rejected',
        'sufficiency-absent',
        'no-readings',
      ]

      for (const scenario of failing) {
        const { outcome } = await run({ message: 'a' }, scenario)
        expect(outcome.ok, scenario).toBe(false)
        expect(outcome).not.toHaveProperty('result')
      }
    })

    it('los errores solo llevan code y retryable', async () => {
      const { outcome } = await run({ message: 'a' }, 'safety-rejected')

      expect(Object.keys(errorOf(outcome)).sort()).toEqual([
        'code',
        'retryable',
      ])
    })
  })

  it('cubre todos los escenarios del fake con una salida definida', async () => {
    for (const scenario of Object.keys(FAKE_SCENARIOS) as FakeScenarioName[]) {
      const { outcome } = await run({ message: 'a' }, scenario)
      expect(typeof outcome.ok, scenario).toBe('boolean')
    }
  })
})
