import { createContext, useEffect, type ReactNode } from 'react'
import { applyMotionPreference, type MotionPreference } from './motion'

export type { MotionPreference }

// Permite forzar el movimiento en el documento (Design Lab, vista previa) o aplicar
// una preferencia propia del usuario. Por defecto manda el sistema.
export const MotionPreferenceContext = createContext<MotionPreference>('system')

type MotionPreferenceProviderProps = {
  value: MotionPreference
  children: ReactNode
}

export function MotionPreferenceProvider({
  value,
  children,
}: MotionPreferenceProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.motion
    // data-motion va en <html>: un único ámbito por documento, sin proveedores anidados.
    applyMotionPreference(value, root)
    return () => {
      // Se devuelve lo que había (p. ej. la preferencia aplicada al arrancar).
      if (previous === undefined) delete root.dataset.motion
      else root.dataset.motion = previous
    }
  }, [value])

  return (
    <MotionPreferenceContext value={value}>{children}</MotionPreferenceContext>
  )
}
