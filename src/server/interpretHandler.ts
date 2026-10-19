import type { InputLimits } from '../domain/analysis/analysisInput'
import type { PolicyConfig } from '../domain/analysis/analysisPolicy'
import type {
  AnalysisErrorCode,
  AnalysisOutcome,
} from '../domain/analysis/analysisResult'
import type { DecisionProvider } from '../domain/analysis/decisionProvider'
import { interpretMessage } from '../domain/analysis/interpretMessage'
import { selectAuthorizedProfile } from '../domain/analysis/profileSelection'
import {
  AREA_ANSWERS,
  PROFILE_AREAS,
  type ProfileAnswers,
} from '../domain/partner-profile/partnerProfile'
import {
  withEnglishPreparation,
  type EnglishPreparer,
} from '../infrastructure/language/englishPreparation'

// Todo llega inyectado: el manejador no sabe de credenciales, de entorno ni de
// qué proveedor hay detrás (006-plan §2). `provider` es el adaptador real de Jev
// en producción y el fake en las pruebas.
export type InterpretHandlerDependencies = {
  provider: DecisionProvider
  preparer: EnglishPreparer
  policy: PolicyConfig
  limits?: InputLimits
}

// El estado HTTP es orientativo: el cliente decide por el cuerpo (tech-stack §29).
const STATUS: Record<AnalysisErrorCode, number> = {
  invalid_input: 400,
  processing_unavailable: 503,
  invalid_provider_response: 502,
  safety_evaluation_unavailable: 502,
}

const HEADERS = {
  'Content-Type': 'application/json',
  // Cada respuesta es de una consulta privada: nada se cachea.
  'Cache-Control': 'no-store',
}

const json = (
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS, ...extra },
  })

const failure = (code: AnalysisErrorCode, retryable: boolean) =>
  json({ ok: false, error: { code, retryable } }, STATUS[code])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// El servidor no confía en la minimización del cliente (006-spec §4). Solo
// minimiza cuando el expediente es válido según 004 (`AREA_ANSWERS`): cualquier
// clave desconocida (las notas, por ejemplo) o valor inválido sigue hasta
// `parseAnalysisInput`, que es el único esquema y lo rechaza. `answerKind()` solo
// clasifica valores válidos: sin esta comprobación previa, un «depends» en un
// área que no lo admite (messageStyle) se descartaría como si fuera un «Depende»
// real. Nada se descarta en silencio salvo «Depende» y «No lo sé» válidos.
function minimized(body: unknown): unknown {
  if (!isRecord(body) || !isRecord(body.profile)) return body
  const areas: readonly string[] = PROFILE_AREAS
  if (!Object.keys(body.profile).every((key) => areas.includes(key)))
    return body
  const valid = PROFILE_AREAS.every((area) => {
    const answer = (body.profile as Record<string, unknown>)[area]
    return (
      answer === undefined ||
      (AREA_ANSWERS[area] as readonly unknown[]).includes(answer)
    )
  })
  if (!valid) return body

  const profile = selectAuthorizedProfile(
    { answers: body.profile as ProfileAnswers, notes: '' },
    true,
  )
  return { ...body, profile }
}

function toResponse(
  outcome: AnalysisOutcome,
  preparation: ReturnType<typeof withEnglishPreparation>['preparation'],
) {
  if (!outcome.ok) return failure(outcome.error.code, outcome.error.retryable)

  const { result } = outcome
  return json(
    {
      ok: true,
      result: {
        ...result,
        meta: {
          ...result.meta,
          ...(preparation === undefined
            ? {}
            : { languagePreparation: preparation }),
        },
      },
    },
    200,
  )
}

// POST /api/interpret como Request → Response con APIs web estándar. La
// protección contra abuso y el límite de tamaño del cuerpo son de `013`. No
// escribe en consola: la observabilidad operativa es de `013` y `017`.
export function createInterpretHandler(
  dependencies: InterpretHandlerDependencies | undefined,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== 'POST')
      return json(
        { ok: false, error: { code: 'invalid_input', retryable: false } },
        405,
        { Allow: 'POST' },
      )

    // Composición incompleta (sin credencial, traductor o política): falla
    // cerrado. Nunca usa el fake ni otro proveedor (006-plan §3.1).
    if (dependencies === undefined)
      return failure('processing_unavailable', false)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return failure('invalid_input', false)
    }

    // Una instancia por petición: guarda lo que hizo con el idioma.
    const provider = withEnglishPreparation(
      dependencies.preparer,
      dependencies.provider,
    )
    try {
      const outcome = await interpretMessage(minimized(body), {
        provider,
        policy: dependencies.policy,
        limits: dependencies.limits,
      })
      return toResponse(outcome, provider.preparation)
    } catch {
      // Causa desconocida: prudente, y sin el texto de la excepción.
      return failure('processing_unavailable', false)
    }
  }
}
