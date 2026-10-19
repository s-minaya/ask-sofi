// Pasarela simulada de AI Gateway para los tests del adaptador de Jev y de la
// composición del servidor. Nada llega a la red real (MSW, onUnhandledRequest: error).
import { http, HttpResponse } from 'msw'
import { SIGNAL_IDS } from '../domain/analysis/signalCatalog'
import {
  AFFECTED_QUESTIONS,
  SAFETY_QUESTION,
  SIGNAL_QUESTIONS,
  SUFFICIENCY_QUESTION,
} from '../infrastructure/ai/jevQuestions'
import { server } from './msw'

export const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/decisions'
export const API_KEY = 'test-key-not-real'

export type SentQuestion = { type: string; name: string; instructions: string }
export type Sent = {
  headers: Headers
  body: {
    model: string
    input: string
    questions: SentQuestion[]
    providerOptions: { gateway: Record<string, unknown> }
  }
}

export const SAFETY = SAFETY_QUESTION.key
export const SUFFICIENCY = SUFFICIENCY_QUESTION.key
export const AFFECTED = Object.values(AFFECTED_QUESTIONS).map(({ key }) => key)
export const READINGS = SIGNAL_IDS.map((id) => SIGNAL_QUESTIONS[id].key)

// Respuesta por pregunta: un número (probabilidad), 'refusal', 'omit' (la
// pregunta no aparece en la respuesta) o un objeto que se devuelve tal cual.
export type Override = number | 'refusal' | 'omit' | Record<string, unknown>

function defaultProbability(name: string): number {
  if (name === SAFETY) return 0.02
  if (name === SUFFICIENCY) return 0.9
  if (AFFECTED.includes(name)) return 0.01
  return 0.2
}

export function answersFor(
  questions: SentQuestion[],
  overrides: Record<string, Override>,
) {
  return questions.flatMap(({ name }) => {
    const override = overrides[name] ?? defaultProbability(name)
    if (override === 'omit') return []
    if (override === 'refusal') return [{ type: 'refusal', name }]
    if (typeof override === 'object') return [override]
    return [{ type: 'predicate', name, probability: override }]
  })
}

// Registra lo que recibe la pasarela y responde según `respond`.
export function gateway(
  respond: (sent: Sent, index: number) => Response | Promise<Response> = ({
    body,
  }) =>
    HttpResponse.json({
      model: 'typesafe-ai/jev',
      answers: answersFor(body.questions, {}),
      usage: { input_tokens: 96, output_tokens: 0, total_tokens: 96 },
    }),
) {
  const received: Sent[] = []
  server.use(
    http.post(GATEWAY_URL, async ({ request }) => {
      const sent = {
        headers: request.headers,
        body: (await request.json()) as Sent['body'],
      }
      received.push(sent)
      return respond(sent, received.length - 1)
    }),
  )
  return received
}

export const withOverrides =
  (overrides: Record<string, Override>) => (sent: Sent) =>
    HttpResponse.json({
      model: 'typesafe-ai/jev',
      answers: answersFor(sent.body.questions, overrides),
    })
