import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../components/sofi/visual/types'

// T069 · comparación de las poses con movimiento reducido (catálogo §7.2; plan §4.4). La pose
// la pinta el propio parcial (D-2): estos textos solo la describen para revisarla, y lo que
// pide el catálogo resume su ficha («Reducido»), que sigue siendo la fuente. Las 10 del parcial
// se aprobaron con AV4 el 2026-11-16 (plan §11.7); producción las fija en T083.

// - `partial`: la del parcial, aprobada con AV4 (plan §11.7).
// - `catalog`: la fija el catálogo (ficha 015); no se propone nada.
// - `gag`: su versión reducida ya está aprobada (catálogo §7.2; plan §6); en reposo se ve el
//   de `sofi-blink`, y sus poses fijas se prueban en 4.7–4.9.
export type PoseStatus = 'partial' | 'catalog' | 'gag'

export type ReducedPoseInfo = {
  status: PoseStatus
  // Qué pide la ficha del catálogo para «Reducido».
  catalog: string
  // Qué fija el parcial con movimiento reducido (fotogramas de su tira principal, desde 0).
  partial: string
}

export const REDUCED_POSES: Record<SofiAnimationId, ReducedPoseInfo> = {
  'sofi-blink': {
    status: 'partial',
    catalog: 'F0 estable, ojos abiertos; sin parpadeo',
    partial: 'F0, ojos abiertos',
  },
  sofing: {
    status: 'partial',
    catalog: 'Pose estática apropiada del propio sprite, sin tecleo ni rayos',
    partial: 'F0, ante el portátil, en reposo; sin rayos',
  },
  rolling: {
    status: 'partial',
    catalog: 'Fotograma de reposo apropiado, sin giro ni órbitas',
    partial: 'F0, reposo; sin giro, arcos ni estrellas',
  },
  talking: {
    status: 'partial',
    catalog: 'Expresión estable con la boca cerrada',
    partial: 'F0, mirando al frente, con la boca cerrada',
  },
  favoriting: {
    status: 'partial',
    catalog: 'Pose con sello o indicación estática de favorito guardado',
    partial: 'F2, gafas puestas con brillo, y el sello con sus marcas',
  },
  poking: {
    status: 'gag',
    catalog: 'Reacción estática aprobada (ficha 006)',
    partial: 'Reposo de sofi-blink; las poses fijas, en la reacción',
  },
  'are-u-still-here': {
    status: 'gag',
    catalog: 'Reacción estática aprobada (ficha 008)',
    partial: 'Reposo de sofi-blink; las poses fijas, en la reacción',
  },
  'i-see-you': {
    status: 'gag',
    catalog: 'Reacción estática aprobada (ficha 009)',
    partial: 'Reposo de sofi-blink; las poses fijas, en la reacción',
  },
  'needs-context': {
    status: 'partial',
    catalog: 'Fotograma estable de curiosidad (propone F3); interrogante fijo',
    partial: 'F3, dedo en los labios y sonrisa pícara, con la interrogación',
  },
  error: {
    status: 'partial',
    catalog: 'Fotograma sin glitch ni destellos',
    partial: 'F1, recuperación avergonzada; sin glitch',
  },
  eureka: {
    status: 'partial',
    catalog: 'Pose de descubrimiento estable, sin salto ni destello animado',
    partial: 'F1, ¡eureka!, con la chispa fija',
  },
  suspicious: {
    status: 'partial',
    catalog: 'Pose fija, sin gesto de transición',
    partial: 'F1, «mmm, interesante», con la sonrisa cómplice',
  },
  uncertain: {
    status: 'partial',
    catalog: 'La pose empática estable, sin encogimientos animados',
    partial: 'F2, encogimiento de hombros con las palmas hacia arriba',
  },
  'memory-wipe': {
    status: 'catalog',
    catalog: 'Sofi aterrorizada con su cartel (ficha 015)',
    partial: 'F1, pánico, con el cartel',
  },
}

export const STATUS_LABEL: Record<PoseStatus, string> = {
  partial: 'Aprobada: la del parcial (D-2) · AV4, 2026-11-16',
  catalog: 'Fijada por el catálogo (ficha 015)',
  gag: 'Versión reducida aprobada (2026-11-12)',
}

// Las de `partial` eran las que podían desviarse, y solo a un fotograma existente (plan §4.4).
// AV4 las aprobó sin desviaciones.
export const PROPOSABLE = SOFI_ANIMATION_IDS.filter(
  (id) => REDUCED_POSES[id].status === 'partial',
)

// Número de fotogramas de una tira principal, leído de la propia imagen: cada fotograma es un
// cuadrado de la altura de la tira. Nada se copia del parcial.
export function framesOfStrip(width: number, height: number): number | null {
  if (!(width > 0) || !(height > 0)) return null
  const frames = width / height
  return Number.isInteger(frames) ? frames : null
}

// Ruta de la tira principal de un recurso entre las que expone su módulo dueño.
export function mainStripOf(
  id: SofiAnimationId,
  strips: Readonly<Record<string, string>>,
): string | undefined {
  return strips[`/src/styles/sprites/${id}.webp`]
}
