// Espacio fino que no se parte (U+202F): separa la cifra del signo % en texto corrido.
export const NARROW_NBSP = String.fromCharCode(0x202f)

// Contador informativo, en singular cuando toca.
export function formatCharacterCount(count: number): string {
  return count === 1 ? '1 carácter' : `${count} caracteres`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}${NARROW_NBSP}%`
}
