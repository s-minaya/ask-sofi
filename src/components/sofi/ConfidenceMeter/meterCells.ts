export const METER_CELLS = 20

// Cada celda vale 5 %; se redondea a la más cercana y la cifra exacta va escrita al lado.
export function meterCells(percentage: number): number {
  const clamped = Math.min(100, Math.max(0, percentage))
  return Math.round(clamped / (100 / METER_CELLS))
}
