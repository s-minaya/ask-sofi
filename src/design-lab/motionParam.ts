import {
  MOTION_PREFERENCES,
  type MotionPreference,
} from '../infrastructure/storage/preferencesStorage'

// El selector global del Lab llega a los marcos (Preview, Perfil) por la URL. Se lee contra la
// lista de la preferencia, no contra un valor suelto: así `full` no se pierde en silencio y un
// valor desconocido deja el movimiento en manos del sistema.
export function motionFromParam(value: string | null): MotionPreference {
  return (MOTION_PREFERENCES as readonly string[]).includes(value ?? '')
    ? (value as MotionPreference)
    : 'system'
}
