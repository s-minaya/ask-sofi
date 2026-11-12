import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'

// Prototipo de T066 (gags en la insignia de la consulta móvil). La ubicación y la inactividad están
// aprobadas (AV6: spec §5, plan §6), y la versión reducida también (2026-11-12, plan §6).

// --- Insignia (alternativa A1: se mantiene la actual) ---

// Es la de `ConsultationScreen` (`listenBadge`): Sofi entera dentro del recuadro, con el busto
// apoyado en su borde inferior (`art-direction/README.md`, decisión 5). Se copia porque
// producción no la exporta y este prototipo no la toca; `gagBadge.contract.test.tsx` la compara
// con la pantalla real, así que una divergencia salta en las pruebas.
export const BADGE_SPRITE = 128
export const BADGE_CROP = {
  width: 100,
  height: 130,
  offsetX: 16,
  offsetY: 3,
} as const
export const BADGE_BACKGROUND = 'var(--tone-pink-soft)'

// --- Inactividad de `are-u-still-here` ---

// El valor aprobado es el del plan (§6): 150 000 ms, dentro de los 2–3 minutos de la spec (§5).
// Para verlo sin esperar, el rango baja hasta segundos.
export const IDLE_DEFAULT_MS = STILL_HERE_IDLE_MS
export const IDLE_MIN_MS = 5_000
export const IDLE_MAX_MS = 180_000
export const IDLE_STEP_MS = 5_000
export const SPEC_IDLE_MIN_MS = 120_000
export const SPEC_IDLE_MAX_MS = 180_000

export function formatIdle(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  if (minutes === 0) return `${seconds} s`
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`
}

// `spec`: cabe en la horquilla de 2 a 3 minutos. `demo`: solo sirve para ver la secuencia.
export function idleVerdict(ms: number): 'spec' | 'demo' {
  return ms >= SPEC_IDLE_MIN_MS && ms <= SPEC_IDLE_MAX_MS ? 'spec' : 'demo'
}
