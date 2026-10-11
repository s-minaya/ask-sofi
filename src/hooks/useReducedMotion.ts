import { useContext } from 'react'
import { MotionPreferenceContext } from '../app/providers/MotionPreference'
import { useMediaQuery } from './useMediaQuery'

// Movimiento reducido por preferencia del sistema o forzado en la zona actual.
export function useReducedMotion(): boolean {
  const forced = useContext(MotionPreferenceContext)
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  return forced === 'reduce' || system
}
