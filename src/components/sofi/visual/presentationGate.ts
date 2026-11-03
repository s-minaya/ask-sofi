// Retención del primer ciclo de `sofing` (catálogo §6.4). Función pura: no conoce la
// operación, que empieza en el acto y nunca se retrasa; solo decide cuándo se enseña
// su resultado.

// Valor solo experimental hasta que se apruebe en el Design Lab (AV2, T082; plan 008
// §11.3). El primer ciclo de `sofing` dura 6440 ms a 1× (E5): este límite decide
// cuánto puede esperar un resultado rápido. La excepción es la del catálogo §6.4 y no
// se amplía: solo resultados no críticos.
export const PROVISIONAL_RETENTION_LIMIT_MS = 3000

export type PresentationKind =
  // Los únicos que pueden esperar.
  | 'interpreted'
  | 'needs_context'
  // Se muestran en cuanto se conocen.
  | 'error'
  | 'safety_concern'
  | 'safety_evaluation_unavailable'
  | 'privacy'
  | 'deletion'
  | 'cancelled'
  | 'quick_exit'

export type GateInput = {
  kind: PresentationKind
  // El primer ciclo de la animación de espera ya terminó.
  firstCycleEnded: boolean
  // Tiempo desde que llegó el resultado.
  elapsedMs: number
  limitMs: number
  // Estado efectivo de movimiento (plan §4.1).
  reducedMotion: boolean
}

export type GateDecision =
  | { present: true }
  // `waitMs` es lo que falta hasta el límite: quien lo consume programa un solo
  // temporizador y vuelve a preguntar, o presenta si el ciclo termina antes.
  | { present: false; waitMs: number }

export function presentationGate({
  kind,
  firstCycleEnded,
  elapsedMs,
  limitMs,
  reducedMotion,
}: GateInput): GateDecision {
  if (kind !== 'interpreted' && kind !== 'needs_context') {
    return { present: true }
  }
  if (reducedMotion || firstCycleEnded) return { present: true }
  // Ante un límite o un tiempo no válido (NaN) el resultado se enseña: en la duda no se retiene.
  const remaining = limitMs - elapsedMs
  return remaining > 0
    ? { present: false, waitMs: remaining }
    : { present: true }
}
