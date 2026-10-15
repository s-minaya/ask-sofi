import type {
  AffectedPersonType,
  SignalId,
  SignalKind,
  SufficiencyLevel,
} from './signalCatalog'

export const SCHEMA_VERSION = 1

// La estimación es el apoyo del modelo a un enunciado concreto: no se
// normaliza ni se reparte, y no es una probabilidad de lo que siente nadie.
export type SignalEstimate = {
  id: SignalId
  kind: SignalKind
  estimate: number
}

export type InterpretedBody = {
  status: 'interpreted'
  // Puede estar vacío: cero señales comunicables es un resultado válido.
  signals: SignalEstimate[]
  // Cualquier otro estado de seguridad no llega a `interpreted`. Tampoco significa
  // «seguro»: significa que la evaluación terminó sin indicios en su alcance.
  safety: 'no_concern_detected'
}

export type NeedsContextBody = {
  status: 'needs_context'
  sufficiency: SufficiencyLevel
  missingInformation?: string
  preservedSignals?: SignalEstimate[]
}

// Ni señales ni estimaciones sentimentales. Los recursos de ayuda son de 007.
export type SafetyConcernBody = {
  status: 'safety_concern'
  affectedPersonTypes: AffectedPersonType[]
}

export type AnalysisResultBody =
  InterpretedBody | NeedsContextBody | SafetyConcernBody

// Sin mensaje, contexto ni expediente: son metadatos, no contenido.
export type AnalysisMeta = {
  schemaVersion: number
  taxonomyVersion: number
  policyVersion: string
  profileUsed: boolean
  provider: { id: string; alias?: string; observedVersion: string }
}

export type AnalysisResult = AnalysisResultBody & { meta: AnalysisMeta }

export type AnalysisErrorCode =
  | 'invalid_input'
  | 'processing_unavailable'
  | 'invalid_provider_response'
  | 'safety_evaluation_unavailable'

// Canal separado del resultado. Nunca lleva texto de una excepción ni del proveedor.
// `retryable` solo indica si tiene sentido ofrecer «Reintentar»: no autoriza gasto.
export type AnalysisError = { code: AnalysisErrorCode; retryable: boolean }

export type AnalysisOutcome =
  { ok: true; result: AnalysisResult } | { ok: false; error: AnalysisError }
