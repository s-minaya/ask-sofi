import * as z from 'zod/mini'
import type { ProfileAnswers } from '../partner-profile/partnerProfile'
import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_IDS,
  type AffectedPersonType,
  type SignalId,
} from './signalCatalog'

// Procedencia que declara el proveedor. La versión solo se informa si se observó
// de verdad; el núcleo la sustituye por 'unknown' en los metadatos. El modelo que
// respondió y la versión de las instrucciones son opcionales: un proveedor
// genérico, como el fake, no los declara.
export type ProviderProvenance = {
  id: string
  alias?: string
  observedVersion?: string
  respondedModel?: string
  instructionVersion?: string
}

// Seguridad y suficiencia no tienen campo para el expediente: solo las lecturas
// pueden recibirlo (005-spec §3). Así un test comprueba qué recibió cada parte.
export type DecisionRequest = {
  assessment: { message: string; context?: string }
  readings: { message: string; context?: string; profile?: ProfileAnswers }
}

export type DecisionReply =
  | { ok: true; payload: unknown; provenance: ProviderProvenance }
  // Fallo de toda la llamada. Los adaptadores traducen aquí 402, 429, tiempos de espera…
  | { ok: false; retryable: boolean }

export interface DecisionProvider {
  evaluate(request: DecisionRequest): Promise<DecisionReply>
}

// Estimaciones ya validadas. Ausente significa «no evaluada»: nunca 0.
// 'rejected' solo existe en seguridad y suficiencia, porque cambia `retryable`.
export type DecisionEstimates = {
  signals: Partial<Record<SignalId, number>>
  safety: number | 'rejected' | undefined
  affected: Partial<Record<AffectedPersonType, number>>
  sufficiency: number | 'rejected' | undefined
  missingInformation?: string
}

export type PayloadCheck =
  { ok: true; estimates: DecisionEstimates } | { ok: false }

// z.number() ya rechaza NaN e infinitos; los extremos del rango se comprueban aquí.
const estimate = z.number().check(z.gte(0), z.lte(1))
const rejectable = z.union([estimate, z.literal('rejected')])

const estimatesOf = (keys: readonly string[]) =>
  z.strictObject(
    Object.fromEntries(keys.map((key) => [key, z.optional(estimate)])),
  )

// Estricto: un ID desconocido o un campo como `confidence` invalida la respuesta.
const payloadSchema = z.strictObject({
  signals: z.optional(estimatesOf(SIGNAL_IDS)),
  safety: z.optional(rejectable),
  affected: z.optional(estimatesOf(AFFECTED_PERSON_TYPES)),
  sufficiency: z.optional(rejectable),
  missingInformation: z.optional(z.string().check(z.minLength(1))),
})

function definedOnly<K extends string>(
  record: Record<string, number | undefined> | undefined,
): Partial<Record<K, number>> {
  const result: Partial<Record<K, number>> = {}
  for (const [key, value] of Object.entries(record ?? {}))
    if (value !== undefined) result[key as K] = value
  return result
}

// La respuesta del proveedor es un dato no confiable (tech-stack §63): un solo
// valor inválido la invalida entera; no se corrige ni se recorta.
export function parseDecisionPayload(payload: unknown): PayloadCheck {
  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) return { ok: false }

  const { signals, safety, affected, sufficiency, missingInformation } =
    parsed.data
  const estimates: DecisionEstimates = {
    signals: definedOnly<SignalId>(signals),
    safety,
    affected: definedOnly<AffectedPersonType>(affected),
    sufficiency,
  }
  if (missingInformation !== undefined)
    estimates.missingInformation = missingInformation
  return { ok: true, estimates }
}
