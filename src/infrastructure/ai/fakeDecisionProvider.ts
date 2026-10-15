import type {
  DecisionProvider,
  DecisionReply,
  DecisionRequest,
} from '../../domain/analysis/decisionProvider'

// Procedencia declarada: el fake nunca finge un alias ni una versión observada.
const valid = (payload: unknown): DecisionReply => ({
  ok: true,
  payload,
  provenance: { id: 'fake' },
})

// Escenarios predefinidos y deterministas (005-spec §8). No interpretan texto:
// los números están elegidos para las configuraciones de prueba de src/test.
export const FAKE_SCENARIOS = {
  // Respuestas válidas
  'two-high-signals': valid({
    signals: { expressing_disappointment: 0.81, inviting_initiative: 0.65 },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'literal-and-sarcastic': valid({
    signals: { literal_meaning: 0.83, sarcastic_tone: 0.78 },
    safety: 0.03,
    sufficiency: 0.8,
  }),
  'nothing-communicable': valid({
    signals: { literal_meaning: 0.2, sarcastic_tone: 0.1 },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'explicit-zero': valid({
    signals: { literal_meaning: 0.7, sarcastic_tone: 0 },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'context-needed': valid({
    signals: { literal_meaning: 0.4 },
    safety: 0.02,
    sufficiency: 0.1,
  }),
  'boundary-without-context': valid({
    signals: { setting_boundary: 0.9, inviting_initiative: 0.7 },
    safety: 0.02,
    sufficiency: 0.1,
  }),
  'safety-concern': valid({
    signals: { expressing_annoyance: 0.9 },
    safety: 0.95,
    affected: { user_at_risk_from_other: 0.9 },
    sufficiency: 0.8,
  }),
  'safety-concern-only': valid({
    safety: 0.95,
    affected: { user_at_risk_from_other: 0.9 },
  }),

  // Ausencias y rechazos
  'safety-absent': valid({
    signals: { literal_meaning: 0.9 },
    sufficiency: 0.9,
  }),
  'safety-rejected': valid({
    signals: { literal_meaning: 0.9 },
    safety: 'rejected',
    sufficiency: 0.9,
  }),
  'sufficiency-absent': valid({
    signals: { literal_meaning: 0.9 },
    safety: 0.02,
  }),
  'sufficiency-rejected': valid({
    signals: { literal_meaning: 0.9 },
    safety: 0.02,
    sufficiency: 'rejected',
  }),
  'no-readings': valid({ safety: 0.02, sufficiency: 0.9 }),

  // Valores inválidos: invalidan toda la respuesta
  'invalid-nan': valid({
    signals: { literal_meaning: Number.NaN },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'invalid-infinity': valid({
    signals: { literal_meaning: Number.POSITIVE_INFINITY },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'invalid-negative': valid({
    signals: { literal_meaning: -0.1 },
    safety: 0.02,
    sufficiency: 0.9,
  }),
  'invalid-above-one': valid({
    signals: { literal_meaning: 1.1 },
    safety: 0.02,
    sufficiency: 0.9,
  }),

  // Fallos de toda la llamada
  'provider-unavailable': { ok: false, retryable: true },
  'provider-refused': { ok: false, retryable: false },
} as const satisfies Record<string, DecisionReply>

export type FakeScenarioName = keyof typeof FAKE_SCENARIOS

export type FakeDecisionProvider = DecisionProvider & {
  // Lo recibido, para comprobar en tests qué datos viajaron a cada parte.
  readonly requests: readonly DecisionRequest[]
}

export function createFakeDecisionProvider(
  scenario: FakeScenarioName,
): FakeDecisionProvider {
  const requests: DecisionRequest[] = []
  return {
    requests,
    // Copias en ambos sentidos: ni el test ni el núcleo pueden alterar el escenario.
    evaluate: async (request) => {
      requests.push(structuredClone(request))
      return structuredClone<DecisionReply>(FAKE_SCENARIOS[scenario])
    },
  }
}
