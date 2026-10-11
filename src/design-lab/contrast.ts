// Contraste WCAG 2.2 entre dos colores opacos (#rrggbb). El Design Lab calcula los
// ratios en lugar de copiarlos, para que la tabla no pueda desviarse de los tokens.

function linear(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Color no admitido: ${hex}`)
  const value = Number.parseInt(match[1], 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    linear,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastLevel = 'AAA' | 'AA'

// Texto normal: AA desde 4,5:1 y AAA desde 7:1. Se compara el valor exacto, no el redondeado.
export function contrastLevel(ratio: number): ContrastLevel | null {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return null
}

// «18,2:1»: un decimal y coma decimal, como el resto de la interfaz.
export function formatRatio(ratio: number): string {
  return `${(Math.round(ratio * 10) / 10).toFixed(1).replace('.', ',')}:1`
}
