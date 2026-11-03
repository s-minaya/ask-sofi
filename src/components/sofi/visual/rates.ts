import type { SofiAnimationId } from './types'

// Velocidad de reproducción de cada animación (spec 008 §8; D-7): un factor sobre la
// línea de tiempo del parcial, que sigue siendo la única fuente de duraciones. Aquí no
// hay ninguna: 1 es la velocidad del parcial, 0,5 la mitad y 2 el doble.

// Único lugar de la velocidad de producción. Los valores definitivos se aprueban en el
// Lab (AV3, T082); mientras tanto, todos van a 1×.
export const PRODUCTION_RATES: Readonly<
  Partial<Record<SofiAnimationId, number>>
> = {}

// Sobrescritura solo de sesión, en memoria: el Lab la usa para probar velocidades.
// No es una preferencia pública y no se guarda.
const session = new Map<SofiAnimationId, number>()

export function rateFor(id: SofiAnimationId): number {
  return session.get(id) ?? PRODUCTION_RATES[id] ?? 1
}

export function setSessionRate(id: SofiAnimationId, rate: number): void {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(
      `La velocidad de ${id} debe ser un factor positivo: ${rate}`,
    )
  }
  session.set(id, rate)
}

export function clearSessionRates(): void {
  session.clear()
}
