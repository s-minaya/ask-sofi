import { createContext, useContext } from 'react'
import type { MotionPreference } from '../app/providers/MotionPreference'

// El selector global del Lab (cabecera del Design Lab) y quien quiera moverlo desde una ficha
// (el prototipo de T071). Es estado del Lab: nunca una preferencia pública ni almacenamiento.
export type LabMotion = {
  motion: MotionPreference
  setMotion: (value: MotionPreference) => void
}

export const LabMotionContext = createContext<LabMotion | null>(null)

export function useLabMotion(): LabMotion | null {
  return useContext(LabMotionContext)
}
