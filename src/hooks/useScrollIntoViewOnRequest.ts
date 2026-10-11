import { useEffect, useRef, type RefObject } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { useStackedLayout } from './useStackedLayout'

type ScrollRequest = {
  // Cada petición del usuario (p. ej. pedir la lectura) incrementa el contador.
  request: number
  // El destino puede aparecer después de la petición (contenido dinámico).
  available: boolean
}

// Lleva la vista al destino una sola vez por petición y solo cuando la
// interfaz se muestra en una columna: a varias columnas el contenido ya está
// a la vista y no se fuerza ningún desplazamiento.
export function useScrollIntoViewOnRequest(
  target: RefObject<HTMLElement | null>,
  { request, available }: ScrollRequest,
) {
  const stacked = useStackedLayout()
  const reducedMotion = useReducedMotion()
  // Cambiar de tamaño o de preferencia no es una petición: se leen al ejecutar.
  const latest = useRef({ stacked, reducedMotion })
  const handled = useRef(0)

  useEffect(() => {
    latest.current = { stacked, reducedMotion }
  })

  useEffect(() => {
    if (request === 0 || !available || handled.current === request) return
    const element = target.current
    if (!element) return
    handled.current = request
    if (!latest.current.stacked) return
    element.scrollIntoView({
      block: 'start',
      // Con movimiento reducido el salto es inmediato, sin animación.
      behavior: latest.current.reducedMotion ? 'auto' : 'smooth',
    })
  }, [request, available, target])
}
