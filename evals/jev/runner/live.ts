import {
  createJevDecisionProvider,
  gatewayBodies,
  JEV_MODEL,
} from '../../../src/infrastructure/ai/jevDecisionProvider.ts'
import { INSTRUCTION_VERSION } from '../../../src/infrastructure/ai/jevQuestions.ts'
import { costOfTokens, tokensOf } from './estimate.ts'
import type { Arm, PlanEntry } from './plan.ts'

export type LiveOptions = {
  apiKey: string
  maxRequests: number
  maxCostUsd: number
  fetch?: typeof fetch
  now?: () => Date
}

type RawAnswer = { type?: string; name?: string } & Record<string, unknown>

// Una petición HTTP a la pasarela. Los errores de la pasarela no guardan su
// cuerpo: es texto del proveedor.
export type Exchange = {
  status: number
  latencyMs: number
  respondedModel?: string
  // Lo que informa la respuesta; si no lo da, solo hay `estimatedCostUsd`.
  reportedCostUsd?: number
  estimatedCostUsd: number
  answers: RawAnswer[]
}

export type Entry = {
  key: string
  fixtureId: string
  arm: Arm
  repetition: number
  exchanges: Exchange[]
}

export type Halt =
  'max_requests' | 'max_cost' | 'status_401' | 'status_402' | 'status_403'

export type Report = {
  startedAt: string
  finishedAt: string
  requestedModel: string
  respondedModels: string[]
  // La versión no se puede observar a través de AI Gateway (jev.md §1, E8).
  observedVersion: 'unknown'
  instructionVersion: string
  // Los experimentos con inglés de referencia no pasan por ningún preparador.
  preparer: null
  routing: { only: string[]; disallowPromptTraining: boolean }
  limits: { maxRequests: number; maxCostUsd: number }
  requests: number
  costUsd: number
  costSource: 'reported' | 'estimated' | 'mixed'
  halted?: Halt
  entries: Entry[]
}

const STOP_STATUSES: readonly number[] = [401, 402, 403]

function costOf(raw: unknown): number | undefined {
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

// Ejecución real, secuencial y con topes (006-plan §5.1). Nunca reintenta y se
// detiene ante el primer 401, 402 o 403. Pide siempre las lecturas con expediente:
// los experimentos las miden y no dependen de umbrales que todavía no existen.
// Solo se llama desde la línea de órdenes, con `--live` y la autorización de G2.
export async function runLive(
  plan: readonly PlanEntry[],
  options: LiveOptions,
): Promise<Report> {
  if (options.apiKey.trim() === '')
    throw new Error('Falta la credencial dedicada.')
  if (!(options.maxRequests > 0) || !(options.maxCostUsd > 0))
    throw new Error(
      'Los topes de peticiones y de coste deben ser mayores que 0.',
    )

  const now = options.now ?? (() => new Date())
  const send = options.fetch ?? fetch
  const startedAt = now()
  let current: Exchange[] = []

  // Registra lo que pasa por la red sin alterarlo: el adaptador sigue siendo el
  // que interpreta la respuesta.
  const recording: typeof fetch = async (input, init) => {
    const began = performance.now()
    const response = await send(input, init)
    const latencyMs = Math.round(performance.now() - began)
    const exchange: Exchange = {
      status: response.status,
      latencyMs,
      estimatedCostUsd: costOfTokens(tokensOf(String(init?.body ?? ''))),
      answers: [],
    }
    if (response.ok) {
      try {
        const envelope = (await response.clone().json()) as Record<
          string,
          unknown
        >
        if (typeof envelope.model === 'string')
          exchange.respondedModel = envelope.model
        if (Array.isArray(envelope.answers))
          exchange.answers = envelope.answers as RawAnswer[]
        const metadata = envelope.provider_metadata as
          { gateway?: { cost?: unknown } } | undefined
        const reported = costOf(metadata?.gateway?.cost)
        if (reported !== undefined) exchange.reportedCostUsd = reported
      } catch {
        // Cuerpo ilegible: queda registrado solo el estado.
      }
    }
    current.push(exchange)
    return response
  }

  const provider = createJevDecisionProvider({
    apiKey: options.apiKey,
    readings: { mode: 'always' },
    fetch: recording,
  })

  const entries: Entry[] = []
  let requests = 0
  let costUsd = 0
  let halted: Halt | undefined

  for (const item of plan) {
    // Con expediente se cuentan las dos peticiones antes de enviar la primera.
    const worst = gatewayBodies(item.request).readings === undefined ? 1 : 2
    if (requests + worst > options.maxRequests) {
      halted = 'max_requests'
      break
    }
    if (costUsd >= options.maxCostUsd) {
      halted = 'max_cost'
      break
    }

    current = []
    await provider.evaluate(item.request)
    entries.push({
      key: item.key,
      fixtureId: item.fixtureId,
      arm: item.arm,
      repetition: item.repetition,
      exchanges: current,
    })
    requests += current.length
    costUsd += current.reduce(
      (sum, exchange) =>
        sum + (exchange.reportedCostUsd ?? exchange.estimatedCostUsd),
      0,
    )

    const stop = current.find((exchange) =>
      STOP_STATUSES.includes(exchange.status),
    )
    if (stop !== undefined) {
      halted = `status_${stop.status}` as Halt
      break
    }
  }

  const exchanges = entries.flatMap((entry) => entry.exchanges)
  const reported = exchanges.filter(
    (exchange) => exchange.reportedCostUsd !== undefined,
  ).length
  const first = plan[0] && gatewayBodies(plan[0].request).first

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: now().toISOString(),
    requestedModel: JEV_MODEL,
    respondedModels: [
      ...new Set(exchanges.flatMap((e) => e.respondedModel ?? [])),
    ].sort(),
    observedVersion: 'unknown',
    instructionVersion: INSTRUCTION_VERSION,
    preparer: null,
    routing: first?.providerOptions.gateway ?? {
      only: ['typesafe-ai'],
      disallowPromptTraining: true,
    },
    limits: {
      maxRequests: options.maxRequests,
      maxCostUsd: options.maxCostUsd,
    },
    requests,
    costUsd,
    costSource:
      reported === 0
        ? 'estimated'
        : reported === exchanges.length
          ? 'reported'
          : 'mixed',
    ...(halted === undefined ? {} : { halted }),
    entries,
  }
}
