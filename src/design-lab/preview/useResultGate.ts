import { useEffect, useEffectEvent } from 'react'
import {
  presentationGate,
  type PresentationKind,
} from '../../components/sofi/visual/presentationGate'

// Por qué se presentó el resultado: lo que la Preview enseña en su mesa.
export type GateReason = 'inmediato' | 'ciclo' | 'límite' | 'reducido'

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

    const decision = presentationGate({
      kind,
      firstCycleEnded,
      elapsedMs: Date.now() - arrivedAt,
      limitMs,
      reducedMotion,
    })
    if (!decision.present) {
      const timer = window.setTimeout(() => present('límite'), decision.waitMs)
      return () => window.clearTimeout(timer)
    }

    // ¿Habría esperado sin el ciclo, el movimiento ni el límite? Se le pregunta a la propia
    // función, sin repetir qué tipos pueden esperar.
    const wouldWait = !presentationGate({
      kind,
      firstCycleEnded: false,
      elapsedMs: 0,
      limitMs: Infinity,
      reducedMotion: false,
    }).present
    present(
      !wouldWait
        ? 'inmediato'
        : reducedMotion
          ? 'reducido'
          : firstCycleEnded
            ? 'ciclo'
            : 'límite',
    )
  }, [kind, arrivedAt, firstCycleEnded, limitMs, reducedMotion])
}
