import { gatewayBodies } from '../../../src/infrastructure/ai/jevDecisionProvider.ts'
import type { PlanEntry } from './plan.ts'

// 0,042 $ por millón de tokens de entrada; la salida no se cobra (jev.md §4.3,
// verificado el 2026-10-14). Si el precio cambia, se actualiza allí y aquí.
export const INPUT_PRICE_USD_PER_MILLION_TOKENS = 0.042

// Estimación gruesa **[I]**: no se conoce el tokenizador de Jev. Cuatro
// caracteres por token es la regla habitual; el coste real lo devuelve la
// respuesta y es el que cuenta contra el tope.
const CHARS_PER_TOKEN = 4

export type Estimate = {
  analyses: number
  // Tope: con expediente la segunda petición solo se envía si hace falta.
  maxRequests: number
  estimatedTokens: number
  estimatedCostUsd: number
}

export const tokensOf = (body: unknown) =>
  Math.ceil(JSON.stringify(body).length / CHARS_PER_TOKEN)

export const costOfTokens = (tokens: number) =>
  (tokens * INPUT_PRICE_USD_PER_MILLION_TOKENS) / 1_000_000

export function estimatePlan(plan: readonly PlanEntry[]): Estimate {
  let maxRequests = 0
  let estimatedTokens = 0
  for (const { request } of plan) {
    const { first, readings } = gatewayBodies(request)
    maxRequests += readings === undefined ? 1 : 2
    estimatedTokens +=
      tokensOf(first) + (readings === undefined ? 0 : tokensOf(readings))
  }
  return {
    analyses: plan.length,
    maxRequests,
    estimatedTokens,
    estimatedCostUsd: costOfTokens(estimatedTokens),
  }
}
