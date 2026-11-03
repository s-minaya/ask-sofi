import { useContext, useSyncExternalStore } from 'react'
import { MotionPreferenceContext } from '../app/providers/MotionPreference'
import {
  heldReducedMotion,
  isReducedMotion,
  subscribeToMotionHold,
} from '../app/providers/motion'
import { useMediaQuery } from './useMediaQuery'

// Estado efectivo de movimiento reducido: preferencia del documento y sistema (plan 008 §4.1).
// Durante una reacción retenida (`holdMotion`, plan §5.2) manda el modo con el que empezó.
export function useReducedMotion(): boolean {
  const preference = useContext(MotionPreferenceContext)
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  const held = useSyncExternalStore(
    subscribeToMotionHold,
    heldReducedMotion,
    () => undefined,
  )
  return held ?? isReducedMotion(preference, system)
}
