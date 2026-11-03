import type { SofiFrame } from '../../components/sofi/SofiPortrait/SofiPortrait'
import { SOFI_STATICS } from '../../components/sofi/visual/registry'
import type { SofiMood } from './sofiGuide'

// Cómo se ve cada estado de Sofi: correspondencia estados del expediente → imágenes. Las
// rutas viven en el registro de la capa visual (`SOFI_STATICS`, 008); cuando lleguen los
// spritesheets definitivos se cambia esta tabla, no el cuestionario.
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
  inviting: image(SOFI_STATICS['sofi-peek'], 'blink', 0.875),
  asking: { kind: 'sprite', frame: 'blink' },
  waiting: { kind: 'sprite', frame: 'blink' },
  acknowledging: image(SOFI_STATICS['sofi-smug'], 'blink'),
  uncertain: image(SOFI_STATICS['sofi-thinking'], 1),
  saved: image(SOFI_STATICS['sofi-approved'], 'blink'),
  validationError: image(SOFI_STATICS['sofi-surprised'], 2),
  deleting: image(SOFI_STATICS['sofi-thinking'], 1),
  deleted: image(SOFI_STATICS['sofi-neutral'], 'blink'),
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
