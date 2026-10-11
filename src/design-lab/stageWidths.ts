export const STAGE_WIDTHS = [
  { value: '320', label: '320 px' },
  { value: '390', label: '390 px' },
  { value: '768', label: '768 px' },
  { value: 'full', label: 'Completo' },
] as const

export type StageWidth = (typeof STAGE_WIDTHS)[number]['value']

// Ancho máximo del escenario donde se colocan los ejemplares vivos.
export function stageMaxWidth(width: StageWidth): string | undefined {
  return width === 'full' ? undefined : `${width}px`
}
