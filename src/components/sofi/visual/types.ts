// Vocabulario de la capa visual de Sofi. Identificadores del catálogo §3; el 007 sigue
// reservado y no se reasigna.
export const SOFI_ANIMATION_IDS = [
  'sofi-blink',
  'sofing',
  'rolling',
  'talking',
  'favoriting',
  'poking',
  'are-u-still-here',
  'i-see-you',
  'needs-context',
  'error',
  'eureka',
  'suspicious',
  'uncertain',
  'memory-wipe',
] as const
export type SofiAnimationId = (typeof SOFI_ANIMATION_IDS)[number]

// Lo que la capa visual pide pintar. Las pantallas no conocen recursos: emiten estado
// y esta intención sale de `selectVisual`.
export type SofiIntent =
  | { kind: 'animation'; id: SofiAnimationId }
  // Representación sobria y estática, sin humor ni glitch (`safety_evaluation_unavailable`).
  | { kind: 'sober' }
  // Sin sprite (`safety_concern`, salida rápida).
  | { kind: 'none' }
