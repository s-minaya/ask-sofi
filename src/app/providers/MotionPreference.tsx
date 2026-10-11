import { createContext, type ReactNode } from 'react'

export type MotionPreference = 'system' | 'reduce'

// Permite forzar el movimiento reducido en una zona de la interfaz (Design Lab)
// y, en el futuro, una preferencia propia del usuario. Por defecto manda el sistema.
export const MotionPreferenceContext = createContext<MotionPreference>('system')

type MotionPreferenceProviderProps = {
  value: MotionPreference
  children: ReactNode
}

export function MotionPreferenceProvider({
  value,
  children,
}: MotionPreferenceProviderProps) {
  return (
    <MotionPreferenceContext value={value}>
      {/* data-motion activa la alternativa reducida de las animaciones CSS de esta zona. */}
      <div data-motion={value === 'reduce' ? 'reduce' : undefined}>
        {children}
      </div>
    </MotionPreferenceContext>
  )
}
