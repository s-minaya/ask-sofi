import {
  isOmittedContentMarker,
  parseAnalysisInput,
  type InputLimits,
} from './analysisInput'
import { analysisPolicy, type PolicyConfig } from './analysisPolicy'
import {
  SCHEMA_VERSION,
  type AnalysisErrorCode,
  type AnalysisOutcome,
} from './analysisResult'
import {
  parseDecisionPayload,
  type DecisionProvider,
  type DecisionReply,
  type DecisionRequest,
} from './decisionProvider'
import { hasAnswers } from './profileSelection'
import { TAXONOMY_VERSION } from './signalCatalog'

export type InterpretDependencies = {
  provider: DecisionProvider
  policy: PolicyConfig
  limits?: InputLimits
}

const failure = (
  code: AnalysisErrorCode,
  retryable: boolean,
): AnalysisOutcome => ({ ok: false, error: { code, retryable } })

// Única implementación del análisis: la comparten la API web y el MCP, y funciona
// sin redactor. No sabe de idiomas, de traducción ni de qué proveedor hay detrás.
export async function interpretMessage(
  raw: unknown,
  deps: InterpretDependencies,
): Promise<AnalysisOutcome> {
  const checked = parseAnalysisInput(raw, deps.limits)
  if (!checked.ok) return failure('invalid_input', false)

  const { message, context, profile } = checked.input
  const profileUsed = hasAnswers(profile)
  const text = context === undefined ? { message } : { message, context }

  // El expediente solo acompaña a las lecturas y solo si hay algo concreto que
  // enviar. Seguridad y suficiencia nunca lo reciben (005-spec §3, §5).
  const request: DecisionRequest = {
    assessment: { ...text },
    readings: profileUsed ? { ...text, profile } : { ...text },
  }

  let reply: DecisionReply
  try {
    reply = await deps.provider.evaluate(request)
  } catch {
    // Causa desconocida: no asumir transitorio. Prudente → retryable: false.
    // El flujo no depende del texto de una excepción (005-spec §7).
    return failure('processing_unavailable', false)
  }
  if (!reply.ok) return failure('processing_unavailable', reply.retryable)

  const parsed = parseDecisionPayload(reply.payload)
  // Causa desconocida: puede ser un problema persistente del proveedor → retryable: false.
  if (!parsed.ok) return failure('invalid_provider_response', false)

  const decision = analysisPolicy(
    parsed.estimates,
    { omittedContentOnly: isOmittedContentMarker(message) },
    deps.policy,
  )
  if (!decision.ok) return { ok: false, error: decision.error }

  const { id, alias, observedVersion, respondedModel, instructionVersion } =
    reply.provenance
  return {
    ok: true,
    result: {
      ...decision.body,
      meta: {
        schemaVersion: SCHEMA_VERSION,
        taxonomyVersion: TAXONOMY_VERSION,
        policyVersion: deps.policy.policyVersion,
        profileUsed,
        // Una versión que no se observó no se declara.
        provider: {
          id,
          ...(alias === undefined ? {} : { alias }),
          observedVersion: observedVersion ?? 'unknown',
          ...(respondedModel === undefined ? {} : { respondedModel }),
          ...(instructionVersion === undefined ? {} : { instructionVersion }),
        },
      },
    },
  }
}
