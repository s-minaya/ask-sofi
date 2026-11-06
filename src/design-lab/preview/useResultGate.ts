import { useEffect, useEffectEvent } from 'react'
import {
  presentationGate,
  type PresentationKind,
} from '../../components/sofi/visual/presentationGate'

// Por qué se presentó el resultado: lo que la Preview enseña en su mesa.
export type GateReason = 'inmediato' | 'ciclo' | 'límite' | 'reducido'

export type GateDecision =
  | { present: true; reason: GateReason }
  // `waitMs` es lo que falta hasta el límite.
  | { present: false; waitMs: number }

type GateInput = {
  kind: PresentationKind
  firstCycleEnded: boolean
  elapsedMs: number
  limitMs: number
  reducedMotion: boolean
}

// `presentationGate` más el porqué de presentar. Es lo único que decide: ni el hook ni la Preview
// repiten qué tipos esperan ni cuándo. El motivo se averigua preguntándole a la propia función si
// habría esperado sin el ciclo, el movimiento ni el límite.
export function decideGate(input: GateInput): GateDecision {
  const decision = presentationGate(input)
  if (!decision.present) return decision

  const wouldWait = !presentationGate({
    kind: input.kind,
    firstCycleEnded: false,
    elapsedMs: 0,
    limitMs: Infinity,
    reducedMotion: false,
  }).present
  return {
    present: true,
    reason: !wouldWait
      ? 'inmediato'
      : input.reducedMotion
        ? 'reducido'
        : input.firstCycleEnded
          ? 'ciclo'
          : 'límite',
  }
}

type ResultGateOptions = {
  // Tipo del resultado que ha llegado; `null` mientras no hay resultado que presentar.
  kind: PresentationKind | null
  // Cuándo llegó (`Date.now()`). La operación empezó antes y nunca se retrasó.
  arrivedAt: number | null
  // El primer ciclo de la animación de espera ya terminó (`SofiSprite.onFirstCycle`).
  firstCycleEnded: boolean
  limitMs: number
  reducedMotion: boolean
  onPresent: (reason: GateReason) => void
}

// Consume `presentationGate` (catálogo §6.4): programa un solo temporizador con lo que falta hasta
// el límite y vuelve a preguntar cuando cambia el ciclo, el límite o el movimiento. La decisión
// (qué espera y qué no) es de la función pura. Se prueba el hook, no se copia la regla. Con
// StrictMode el efecto puede avisar dos veces: quien lo consume debe ignorar el segundo aviso.
export function useResultGate({
  kind,
  arrivedAt,
  firstCycleEnded,
  limitMs,
  reducedMotion,
  onPresent,
}: ResultGateOptions) {
  const present = useEffectEvent(onPresent)

  useEffect(() => {
    if (kind === null || arrivedAt === null) return

    const decision = decideGate({
      kind,
      firstCycleEnded,
      elapsedMs: Date.now() - arrivedAt,
      limitMs,
      reducedMotion,
    })
    if (decision.present) {
      present(decision.reason)
      return
    }
    const timer = window.setTimeout(() => present('límite'), decision.waitMs)
    return () => window.clearTimeout(timer)
  }, [kind, arrivedAt, firstCycleEnded, limitMs, reducedMotion])
}
