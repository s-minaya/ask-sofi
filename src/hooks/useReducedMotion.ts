import { useContext } from 'react'
import { MotionPreferenceContext } from '../app/providers/MotionPreference'
import { isReducedMotion } from '../app/providers/motion'
import { useMediaQuery } from './useMediaQuery'

// Estado efectivo de movimiento reducido: preferencia del documento y sistema (plan 008 §4.1).
export function useReducedMotion(): boolean {
  const preference = useContext(MotionPreferenceContext)
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  return isReducedMotion(preference, system)
}
