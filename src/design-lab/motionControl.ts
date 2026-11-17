import type { MotionPreference } from '../infrastructure/storage/preferencesStorage'

// T071 · prototipo del control de la preferencia de movimiento (spec 008 §7; plan §9, punto 7).
// Solo datos del Lab: el control definitivo es de T089–T090. Aprobado con AV7 el 2026-11-17
// (cabecera global, orden y etiquetas sin iconos, acento en «Completo», explicación
// desplegable): plan 008 §11.9.

// Orden y etiquetas aprobados: Reducido → Completo → Sistema. No se cambian.
export const MOTION_CONTROL_OPTIONS = [
  { value: 'reduce', label: 'Reducido' },
  { value: 'full', label: 'Completo' },
  { value: 'system', label: 'Sistema' },
] as const satisfies ReadonlyArray<{ value: MotionPreference; label: string }>

// El valor predeterminado: sigue al sistema.
export const MOTION_CONTROL_DEFAULT: MotionPreference = 'system'

// Enlace y texto de la explicación desplegable, aprobados tal cual.
export const WHY_FULL_LINK = '¿Por qué Completo?'
export const WHY_FULL_TEXT = [
  'La experiencia visual de Ask Sofi se disfruta mejor con todas las animaciones activadas.',
  '“Completo” reproduce todas las animaciones, incluso cuando tu dispositivo tiene activada la reducción de movimiento.',
] as const

// Lo que se ve con cada preferencia, para el lector de la ficha.
export function effectiveMotionLabel(
  preference: MotionPreference,
  systemReduced: boolean,
): string {
  if (preference === 'reduce') return 'Reducido, por elección'
  if (preference === 'full') return 'Completo, por elección'
  return systemReduced ? 'Reducido, por el sistema' : 'Completo, por el sistema'
}
