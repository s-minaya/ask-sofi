import type { MotionPreference } from '../../infrastructure/storage/preferencesStorage'

export type { MotionPreference }

// Una elección explícita se escribe en <html>; «Sistema» la quita y deja que
// prefers-reduced-motion decida desde CSS, también en vivo. Un único ámbito por documento.
export function applyMotionPreference(
  preference: MotionPreference,
  root = document.documentElement,
) {
  if (preference === 'system') delete root.dataset.motion
  else root.dataset.motion = preference
}

// Estado efectivo (plan 008 §4.1): «full» anima aunque el sistema pida reducir y
// «reduce» reduce aunque no lo pida; «system» sigue al sistema.
export function isReducedMotion(
  preference: MotionPreference,
  systemReduces: boolean,
): boolean {
  if (preference === 'system') return systemReduces
  return preference === 'reduce'
}
