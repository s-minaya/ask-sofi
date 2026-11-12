import { useSofiController } from '../components/sofi/useSofiController'
import type { Ambient, GagId } from '../components/sofi/visual/ambient'
import { useReducedGag } from './useReducedGag'

// Los tres gags de un anfitrión del Lab (4.7, 4.8 y 4.9): con movimiento completo, el adaptador de
// producción; con movimiento reducido, la versión reducida aprobada (`useReducedGag`, plan §6).
// Cada uno devuelve `undefined` en el modo que no es el suyo, así que nunca conviven.
export function useLabGags(
  host: HTMLElement | null,
  {
    ambient,
    gags,
    idleAfter,
  }: {
    ambient: Ambient
    // Qué gags pueden montarse ahora (marcados y con la escena tranquila).
    gags: Readonly<Record<GagId, boolean>>
    idleAfter: number
  },
): string[] {
  const options = (kind: GagId) => ({ ambient, calm: gags[kind], idleAfter })
  const classes = [
    useSofiController('poking', host, options('poking')),
    useSofiController('i-see-you', host, options('i-see-you')),
    useSofiController('are-u-still-here', host, options('are-u-still-here')),
    useReducedGag('poking', host, options('poking')),
    useReducedGag('i-see-you', host, options('i-see-you')),
    useReducedGag('are-u-still-here', host, options('are-u-still-here')),
  ]
  return classes.filter((name): name is string => Boolean(name))
}
