import approved from '../../assets/sofi/sofi-approved.webp'
import neutral from '../../assets/sofi/sofi-neutral.webp'
import peek from '../../assets/sofi/sofi-peek.webp'
import smug from '../../assets/sofi/sofi-smug.webp'
import surprised from '../../assets/sofi/sofi-surprised.webp'
import thinking from '../../assets/sofi/sofi-thinking.webp'
import type { SofiFrame } from '../../components/sofi/SofiPortrait/SofiPortrait'
import type { SofiMood } from './sofiGuide'

// Cómo se ve cada estado de Sofi. Es el único sitio con rutas de imágenes:
// cuando lleguen los spritesheets definitivos (008) se cambia aquí, no en el cuestionario.
export type SofiVisual =
  // Spritesheet de parpadeo: bucle o un fotograma fijo.
  | { kind: 'sprite'; frame: SofiFrame }
  // Imagen estática provisional. Mientras carga o si falla, se ve `fallback`.
  | {
      kind: 'image'
      src: string
      fallback: SofiFrame
      // Altura relativa del borde de la interfaz sobre el que se apoya Sofi.
      ledge?: number
    }

const image = (
  src: string,
  fallback: SofiFrame,
  ledge?: number,
): SofiVisual => ({ kind: 'image', src, fallback, ...(ledge && { ledge }) })

// Correspondencia provisional aprobada (004-plan §6). Una imagen puede servir a varios estados.
export const SOFI_VISUALS: Record<SofiMood, SofiVisual> = {
  inviting: image(peek, 'blink', 0.875),
  asking: { kind: 'sprite', frame: 'blink' },
  waiting: { kind: 'sprite', frame: 'blink' },
  acknowledging: image(smug, 'blink'),
  uncertain: image(thinking, 1),
  saved: image(approved, 'blink'),
  validationError: image(surprised, 2),
  deleting: image(thinking, 1),
  deleted: image(neutral, 'blink'),
}

// Con movimiento reducido no hay bucles: el parpadeo se queda en su primer fotograma.
export function visualFor(
  mood: SofiMood,
  { reducedMotion }: { reducedMotion: boolean },
): SofiVisual {
  const visual = SOFI_VISUALS[mood]
  if (!reducedMotion) return visual
  if (visual.kind === 'sprite')
    return visual.frame === 'blink' ? { kind: 'sprite', frame: 0 } : visual
  return visual.fallback === 'blink' ? { ...visual, fallback: 0 } : visual
}
