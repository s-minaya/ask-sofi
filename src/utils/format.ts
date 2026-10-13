// Espacio fino que no se parte (U+202F): separa la cifra del signo % en texto corrido.
export const NARROW_NBSP = String.fromCharCode(0x202f)

// Contador informativo, en singular cuando toca.
export function formatCharacterCount(count: number): string {
  return count === 1 ? '1 carácter' : `${count} caracteres`
}

// Con máximo, el plural lo pide el límite: «1 de 500 caracteres».
export function formatCharacterLimit(count: number, max: number): string {
  return `${count} de ${max} caracteres`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}${NARROW_NBSP}%`
}
