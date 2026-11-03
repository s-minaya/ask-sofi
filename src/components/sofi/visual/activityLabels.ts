// Etiquetas de actividad (spec 008 §4; D-8). Función pura: la etiqueta sale del estado
// real de la operación, no de la animación. Sin React ni temporizadores: quien la usa
// vuelve a preguntar con el tiempo transcurrido.

export type ActivityKind = 'analysis' | 'loading'

export type LabelCalendar = ReadonlyArray<{ fromMs: number; label: string }>

// Copy y ritmo provisionales: se aprueban en el Design Lab (AV1, T068). Cada calendario
// empieza en 0 y avanza.
export const PROVISIONAL_ACTIVITY_LABELS: Record<ActivityKind, LabelCalendar> =
  {
    analysis: [
      { fromMs: 0, label: 'sofing…' },
      { fromMs: 4000, label: 'cooking…' },
    ],
    loading: [{ fromMs: 0, label: 'rolling…' }],
  }

export type ActivityInput = {
  kind: ActivityKind
  // La operación real sigue en curso. Es el único dato que decide si hay actividad: que la
  // animación siga en su primer ciclo (catálogo §6.4) no lo es.
  pending: boolean
  // Tiempo desde que empezó la operación.
  elapsedMs: number
  // Estado efectivo de movimiento: con él la etiqueta decorativa permanece fija (D-20);
  // solo cambia con un cambio funcional (otra actividad o el fin de la operación).
  reducedMotion: boolean
}

// `null` = nada que indicar.
export function activityLabel(
  { kind, pending, elapsedMs, reducedMotion }: ActivityInput,
  calendars: Record<ActivityKind, LabelCalendar> = PROVISIONAL_ACTIVITY_LABELS,
): string | null {
  if (!pending) return null
  const calendar = calendars[kind]
  if (reducedMotion || !(elapsedMs >= 0)) return calendar[0].label
  let current = calendar[0]
  for (const entry of calendar) {
    if (entry.fromMs <= elapsedMs) current = entry
  }
  return current.label
}
