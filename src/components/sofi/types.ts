// Datos de presentación que reciben los componentes de Sofi. No son el contrato
// del dominio: los prepara quien los usa (aquí, fixtures locales).
export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type ContextLevel = 'insufficient' | 'partial' | 'sufficient'

export type InterpretationView = {
  id: string
  title: string
  explanation: string
  // Apoyo relativo entre las versiones consideradas, de 0 a 100.
  percentage: number
  clues?: ReadonlyArray<string>
}

// «Reñido» cuando las dos primeras están igualadas. Lo decide quien prepara
// los datos: el umbral no se fija en 002.
export type LeadTone = 'clear' | 'close'
