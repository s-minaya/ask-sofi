import type { DecisionEstimates } from './decisionProvider'
import type {
  AnalysisError,
  AnalysisErrorCode,
  AnalysisResultBody,
  NeedsContextBody,
  SignalEstimate,
} from './analysisResult'
import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_CATALOG,
  type AffectedPersonType,
  type SufficiencyLevel,
} from './signalCatalog'

// Parámetros que la política necesita. La feature 005 no fija valores productivos:
// los propone 006 (E2/E3) y los revisan 011 y 012. Todos son umbrales inclusivos.
export type PolicyConfig = {
  policyVersion: string
  safety: {
    // Estimación de seguridad a partir de la cual hay indicios de riesgo.
    concernAt: number
    // Estimación a partir de la cual se nombra un tipo de persona afectada.
    affectedTypeAt: number
  }
  sufficiency: {
    // Por debajo, el contexto es insuficiente.
    insufficientBelow: number
    // A partir de aquí, suficiente; entre ambos, parcial.
    sufficientFrom: number
    // Si un contexto parcial también pide más contexto.
    requestContextWhenPartial: boolean
  }
  signals: {
    // Estimación a partir de la cual una señal se puede comunicar.
    communicableAt: number
  }
}

export type PolicyFacts = {
  // El mensaje objetivo es solo un marcador de contenido omitido, no texto de la pareja.
  omittedContentOnly: boolean
}

export type PolicyDecision =
  { ok: true; body: AnalysisResultBody } | { ok: false; error: AnalysisError }

const fail = (code: AnalysisErrorCode, retryable: boolean): PolicyDecision => ({
  ok: false,
  error: { code, retryable },
})

// Un límite o una petición de espacio se reconocen sin saber por qué existen
// (005-spec §4 punto 3), por eso sobreviven a la falta de contexto.
const PRESERVED_WITHOUT_CONTEXT: ReadonlySet<string> = new Set([
  'setting_boundary',
  'requesting_space',
])

function communicableSignals(
  signals: DecisionEstimates['signals'],
  threshold: number,
): SignalEstimate[] {
  return SIGNAL_CATALOG.flatMap(({ id, kind }) => {
    const estimate = signals[id]
    return estimate !== undefined && estimate >= threshold
      ? [{ id, kind, estimate }]
      : []
  })
}

function affectedTypes(
  affected: DecisionEstimates['affected'],
  threshold: number,
): AffectedPersonType[] {
  const named = AFFECTED_PERSON_TYPES.filter((type) => {
    const estimate = affected[type]
    return estimate !== undefined && estimate >= threshold
  })
  return named.length > 0 ? named : ['undetermined']
}

function sufficiencyLevel(
  estimate: number,
  config: PolicyConfig['sufficiency'],
): SufficiencyLevel {
  if (estimate < config.insufficientBelow) return 'insufficient'
  if (estimate >= config.sufficientFrom) return 'sufficient'
  return 'partial'
}

// Pasos 1–4 de la política: no miran las señales. Si alguno decide, las lecturas
// no pueden cambiar la salida (005-plan §3.6). Si ninguno decide, devuelve la
// suficiencia, que esos pasos ya comprobaron que es un número.
type WithoutReadings =
  { decided: PolicyDecision } | { decided?: undefined; sufficiency: number }

function decideWithoutReadings(
  estimates: DecisionEstimates,
  facts: PolicyFacts,
  config: PolicyConfig,
): WithoutReadings {
  const { safety, sufficiency } = estimates

  // 1. Con indicios de riesgo, la seguridad prevalece sobre cualquier otra salida,
  // aunque falten las demás estimaciones.
  if (typeof safety === 'number' && safety >= config.safety.concernAt) {
    return {
      decided: {
        ok: true,
        body: {
          status: 'safety_concern',
          affectedPersonTypes: affectedTypes(
            estimates.affected,
            config.safety.affectedTypeAt,
          ),
        },
      },
    }
  }

  // 2. Una seguridad sin evaluar no es «sin riesgo»: es un error, nunca un resultado.
  // Causa desconocida (ausencia) y rechazo explícito: ambos dan retryable false.
  if (typeof safety !== 'number')
    return { decided: fail('safety_evaluation_unavailable', false) }

  // 3. Sin suficiencia evaluada no se puede saber si hay base para interpretar.
  // Causa desconocida (ausencia) y rechazo explícito: ambos dan retryable false.
  if (typeof sufficiency !== 'number')
    return { decided: fail('processing_unavailable', false) }

  // 4. Un marcador no es texto de la pareja: el dominio ya sabe que falta contenido.
  // Solo llega aquí si la suficiencia se evaluó correctamente (paso 3 superado).
  if (facts.omittedContentOnly) {
    return {
      decided: {
        ok: true,
        body: { status: 'needs_context', sufficiency: 'insufficient' },
      },
    }
  }

  return { sufficiency }
}

// Un adaptador que pide las lecturas en una petición aparte las pide solo si
// pueden cambiar la salida. Comparte código con la política: no copia sus reglas.
export function readingsNeeded(
  estimates: DecisionEstimates,
  facts: PolicyFacts,
  config: PolicyConfig,
): boolean {
  return decideWithoutReadings(estimates, facts, config).decided === undefined
}

// Función pura: sin I/O ni conocimiento del proveedor. El orden de los pasos es
// la precedencia de 005-spec §4, con el marcador omitido y las lecturas ausentes
// colocados según 005-plan §3.6.
export function analysisPolicy(
  estimates: DecisionEstimates,
  facts: PolicyFacts,
  config: PolicyConfig,
): PolicyDecision {
  const early = decideWithoutReadings(estimates, facts, config)
  if (early.decided !== undefined) return early.decided

  const level = sufficiencyLevel(early.sufficiency, config.sufficiency)
  const communicable = communicableSignals(
    estimates.signals,
    config.signals.communicableAt,
  )

  // 5. Faltan hechos: se pide contexto sin ocultar lo explícito.
  if (
    level === 'insufficient' ||
    (level === 'partial' && config.sufficiency.requestContextWhenPartial)
  ) {
    const body: NeedsContextBody = {
      status: 'needs_context',
      sufficiency: level,
    }
    if (estimates.missingInformation !== undefined)
      body.missingInformation = estimates.missingInformation
    const preserved = communicable.filter(({ id }) =>
      PRESERVED_WITHOUT_CONTEXT.has(id),
    )
    if (preserved.length > 0) body.preservedSignals = preserved
    return { ok: true, body }
  }

  // 6. Cero comunicables es válido solo si la evaluación se completó: si no se
  // evaluó ninguna lectura, presentarlo como «sin señales» sería mentir.
  // Causa desconocida: actuar con prudencia (retryable: false).
  if (Object.keys(estimates.signals).length === 0)
    return fail('processing_unavailable', false)

  // 7. Todas las que la política autoriza, sin ganadora, sin reparto y sin confianza global.
  return {
    ok: true,
    body: {
      status: 'interpreted',
      signals: communicable,
      safety: 'no_concern_detected',
    },
  }
}
