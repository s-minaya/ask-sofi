import type { SofiAnimationId } from './visual/types'

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

// Qué recurso real pinta una pantalla y qué avisos devuelve (plan 008 §5.4). Opcional en todas:
// sin él, las pantallas conservan su expresión provisional y se ven como siempre. Quien lo pasa
// (hoy, la Experience Preview) decide el recurso con `selectVisual`; las pantallas no lo eligen.
export type SofiVisualProps = {
  animation: SofiAnimationId
  // Fin del primer ciclo del recurso (catálogo §6.4).
  onFirstCycle?: () => void
  // Fin de una pasada única: quien lo recibe consulta el estado actual, sin cola.
  onEnd?: () => void
}
