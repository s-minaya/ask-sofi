import { isOmittedContentMarker } from '../../domain/analysis/analysisInput'
import {
  readingsNeeded,
  type PolicyConfig,
} from '../../domain/analysis/analysisPolicy'
import {
  parseDecisionPayload,
  type DecisionProvider,
  type DecisionReply,
  type DecisionRequest,
  type ProviderProvenance,
} from '../../domain/analysis/decisionProvider'
import { hasAnswers } from '../../domain/analysis/profileSelection'
import { SIGNAL_IDS } from '../../domain/analysis/signalCatalog'
import {
  PROFILE_AREAS,
  type ProfileAnswers,
} from '../../domain/partner-profile/partnerProfile'
import {
  AFFECTED_QUESTIONS,
  INSTRUCTION_VERSION,
  instructionsText,
  PROFILE_ABOUT,
  PROFILE_PHRASES,
  SAFETY_QUESTION,
  SIGNAL_QUESTIONS,
  SUFFICIENCY_QUESTION,
  type JevQuestion,
} from './jevQuestions'

// Alias de Jev en AI Gateway. Los IDs versionados dan 404 (jev.md §1): lo que
// responda lo dirá E8.
export const JEV_MODEL = 'typesafe-ai/jev'
const DECISIONS_URL = 'https://ai-gateway.vercel.sh/v1/decisions'
// Provisional (006-plan P3): el valor por defecto del SDK de TypeSafe.
const DEFAULT_TIMEOUT_MS = 10_000

// Cuándo se piden las lecturas con expediente. En producción, solo si pueden
// cambiar la salida (decisión 6), con la misma PolicyConfig que el núcleo: el
// adaptador no define ni copia ningún umbral. Los experimentos las piden siempre
// para medirlas, y por eso no necesitan umbrales que aún no existen.
export type ReadingsGate =
  { mode: 'when-needed'; policy: PolicyConfig } | { mode: 'always' }

export type JevProviderConfig = {
  apiKey: string
  readings: ReadingsGate
  fetch?: typeof fetch
  timeoutMs?: number
}

type Answer = Record<string, unknown>

// `answers` es null si la respuesta del proveedor no se puede leer.
type Asked =
  | { ok: true; answers: Map<string, Answer> | null; model: string | undefined }
  | { ok: false; retryable: boolean }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function readAnswers(envelope: unknown): Map<string, Answer> | null {
  if (!isRecord(envelope) || !Array.isArray(envelope.answers)) return null
  const answers = new Map<string, Answer>()
  for (const answer of envelope.answers)
    if (isRecord(answer) && typeof answer.name === 'string')
      answers.set(answer.name, answer)
  return answers
}

const ABSENT = Symbol('absent')

// El adaptador cambia la forma de la respuesta; no la valida ni la corrige.
// La única validación es `parseDecisionPayload` (006-plan §3.3).
function valueOf(answer: Answer | undefined, rejectable: boolean): unknown {
  if (answer === undefined) return ABSENT
  if (answer.type === 'refusal') return rejectable ? 'rejected' : ABSENT
  if (answer.type === 'predicate')
    return 'probability' in answer ? answer.probability : ABSENT
  // Cualquier otra forma, como los centinelas de un fallback: tal cual, para que
  // el núcleo invalide toda la respuesta.
  return answer
}

function collect(
  questions: Record<string, JevQuestion>,
  answers: Map<string, Answer>,
): Record<string, unknown> {
  const collected: Record<string, unknown> = {}
  for (const [id, question] of Object.entries(questions)) {
    const value = valueOf(answers.get(question.key), false)
    if (value !== ABSENT) collected[id] = value
  }
  return collected
}

function single(
  question: JevQuestion,
  answers: Map<string, Answer>,
): Record<string, unknown> {
  const value = valueOf(answers.get(question.key), true)
  return value === ABSENT ? {} : { value }
}

function assessmentPayload(answers: Map<string, Answer>) {
  const safety = single(SAFETY_QUESTION, answers)
  const sufficiency = single(SUFFICIENCY_QUESTION, answers)
  return {
    ...('value' in safety ? { safety: safety.value } : {}),
    affected: collect(AFFECTED_QUESTIONS, answers),
    ...('value' in sufficiency ? { sufficiency: sufficiency.value } : {}),
  }
}

const signalsPayload = (answers: Map<string, Answer>) => ({
  signals: collect(SIGNAL_QUESTIONS, answers),
})

const ASSESSMENT_QUESTIONS: JevQuestion[] = [
  SAFETY_QUESTION,
  ...Object.values(AFFECTED_QUESTIONS),
  SUFFICIENCY_QUESTION,
]
const READING_QUESTIONS: JevQuestion[] = SIGNAL_IDS.map(
  (id) => SIGNAL_QUESTIONS[id],
)

// jev.md §8.2: un objeto con el mensaje, la situación si la hay y, solo en las
// lecturas con expediente, las tendencias con su `about`. Las respuestas del
// expediente viajan como frases estables, nunca como valores codificados.
function stateOf(
  text: { message: string; context?: string },
  profile?: ProfileAnswers,
): Record<string, unknown> {
  const state: Record<string, unknown> = { partnerMessage: text.message }
  if (text.context !== undefined) state.currentSituation = text.context
  if (profile !== undefined) {
    const tendencies: Record<string, string> = { about: PROFILE_ABOUT }
    for (const area of PROFILE_AREAS) {
      const answer = profile[area]
      if (answer === undefined) continue
      const phrase = (PROFILE_PHRASES[area] as Record<string, string>)[answer]
      if (phrase !== undefined) tendencies[area] = phrase
    }
    state.reportedTendencies = tendencies
  }
  return state
}

export type GatewayBody = {
  model: string
  input: string
  questions: { type: 'predicate'; name: string; instructions: string }[]
  providerOptions: {
    gateway: { only: string[]; disallowPromptTraining: boolean }
  }
}

function bodyOf(
  questions: JevQuestion[],
  state: Record<string, unknown>,
  withProfile: boolean,
): GatewayBody {
  return {
    model: JEV_MODEL,
    input: JSON.stringify(state),
    questions: questions.map((question) => ({
      type: 'predicate',
      name: question.key,
      instructions: instructionsText(question, { withProfile }),
    })),
    // Un único proveedor permitido, sin fallbacks y sin entrenamiento.
    // `zeroDataRetention` no existe en Hobby (006-plan §9.3).
    providerOptions: {
      gateway: { only: ['typesafe-ai'], disallowPromptTraining: true },
    },
  }
}

// Las peticiones que una evaluación puede enviar (006-plan §3.3). `readings`
// existe solo con expediente, y solo se envía si el resultado depende de ella:
// el máximo es, por tanto, un tope. Pura: el runner de evaluación cuenta con
// ella peticiones y tokens sin llamar a nadie.
export function gatewayBodies(request: DecisionRequest): {
  first: GatewayBody
  readings?: GatewayBody
} {
  const { profile } = request.readings
  if (!hasAnswers(profile))
    return {
      // Sin expediente, una sola petición: las lecturas comparten estado con la
      // seguridad y la suficiencia (el núcleo les da el mismo texto).
      first: bodyOf(
        [...ASSESSMENT_QUESTIONS, ...READING_QUESTIONS],
        stateOf(request.assessment),
        false,
      ),
    }
  return {
    first: bodyOf(ASSESSMENT_QUESTIONS, stateOf(request.assessment), false),
    readings: bodyOf(
      READING_QUESTIONS,
      stateOf(request.readings, profile),
      true,
    ),
  }
}

// `respondedModel` es un solo valor: solo es honesto si todas las respuestas que
// contribuyen al análisis lo observaron y coinciden. Si una no lo informa o
// difieren, no se atribuye el análisis entero a ninguno. La versión no se observa
// a través de la pasarela (jev.md §1), así que nunca se declara.
function provenanceOf(models: (string | undefined)[]): ProviderProvenance {
  const [first] = models
  const agreed = first !== undefined && models.every((model) => model === first)
  return {
    id: 'jev',
    alias: JEV_MODEL,
    ...(agreed ? { respondedModel: first } : {}),
    instructionVersion: INSTRUCTION_VERSION,
  }
}

export function createJevDecisionProvider(
  config: JevProviderConfig,
): DecisionProvider {
  const send = config.fetch ?? fetch
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS

  async function ask(body: GatewayBody): Promise<Asked> {
    const signal = AbortSignal.timeout(timeoutMs)
    let response: Response
    try {
      response = await send(DECISIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      })
    } catch {
      // Red o tiempo de espera: transitorio. Nunca se muestra el texto del error.
      return { ok: false, retryable: true }
    }

    if (!response.ok) {
      // El cuerpo del error es del proveedor: no se lee ni sale de aquí.
      // Se libera sin esperar: cancelar un cuerpo con datos pendientes no
      // termina de inmediato y aquí no aporta nada.
      void response.body?.cancel().catch(() => undefined)
      const transient = response.status === 429 || response.status >= 500
      return { ok: false, retryable: transient }
    }

    let envelope: unknown
    try {
      envelope = await response.json()
    } catch {
      // Cortada por el tiempo de espera es un fallo transitorio; un cuerpo que
      // no es JSON es una respuesta ilegible.
      if (signal.aborted) return { ok: false, retryable: true }
      return { ok: true, answers: null, model: undefined }
    }
    const model =
      isRecord(envelope) && typeof envelope.model === 'string'
        ? envelope.model
        : undefined
    return { ok: true, answers: readAnswers(envelope), model }
  }

  return {
    async evaluate(request: DecisionRequest): Promise<DecisionReply> {
      const bodies = gatewayBodies(request)
      const withProfile = bodies.readings !== undefined

      const first = await ask(bodies.first)
      if (!first.ok) return first

      // Solo A ha respondido hasta aquí; si llega B, la procedencia se recalcula.
      const reply = (payload: unknown, ...models: (string | undefined)[]) =>
        ({
          ok: true,
          payload,
          provenance: provenanceOf([first.model, ...models]),
        }) satisfies DecisionReply

      if (first.answers === null) return reply(null)
      const assessed = {
        ...assessmentPayload(first.answers),
        ...(withProfile ? {} : signalsPayload(first.answers)),
      }
      if (bodies.readings === undefined) return reply(assessed)

      // Decisión 6: las lecturas con expediente solo se piden si pueden cambiar la
      // salida. Si A no se puede leer, el núcleo lo rechazará sin ellas.
      if (config.readings.mode === 'when-needed') {
        const checked = parseDecisionPayload(assessed)
        if (
          !checked.ok ||
          !readingsNeeded(
            checked.estimates,
            {
              omittedContentOnly: isOmittedContentMarker(
                request.assessment.message,
              ),
            },
            config.readings.policy,
          )
        )
          return reply(assessed)
      }

      const second = await ask(bodies.readings)
      // Sin las lecturas no hay salida completa: error técnico, nunca A solo.
      if (!second.ok) return second
      if (second.answers === null) return reply(null, second.model)
      return reply(
        { ...assessed, ...signalsPayload(second.answers) },
        second.model,
      )
    },
  }
}
