import { useState } from 'react'
import { className as blinkClass } from '../../components/sofi/sprites/sofi-blink'
import type { Ambient, GagId } from '../../components/sofi/visual/ambient'
import { cx } from '../../utils/cx'
import { BADGE_BACKGROUND, BADGE_CROP, BADGE_SPRITE } from '../gagBadge'
import { useLabGags } from '../useLabGags'
import styles from './GagsSpec.module.scss'

type GagBadgeProps = {
  // Las causas de pausa compartidas con los demás gags de la escena.
  ambient: Ambient
  // Cuáles de los tres están montados; el resto no existe (ni controlador ni capas ni tiras).
  gags: Readonly<Record<GagId, boolean>>
  // Solo se pasa al controlador de `are-u-still-here`.
  idleAfter: number
}

// La insignia de la consulta en una columna, tal cual está (alternativa A1), con los tres gags
// reales sobre el MISMO anfitrión, como en producción (plan 008 §6: un solo elemento de
// `sofi-blink`, sin hijos de React, al que cada controlador añade sus capas).
//
// Dos diferencias con la insignia de `ConsultationScreen`, ambas deliberadas:
// - el recuadro NO recorta (`overflow` visible): los efectos de los gags (el «?» de `poking`, la
//   alerta de `i-see-you`, los Zzz) pueden sobresalir de ella;
// - `poking` se esconde tras el borde inferior de la propia insignia: ver `.host`.
export function GagBadge({ ambient, gags, idleAfter }: GagBadgeProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  // Escena tranquila: la insignia no tiene otra cosa que hacer. Cada gag se monta solo si está
  // marcado; con movimiento reducido, en su versión reducida (aprobada, plan §6).
  const gagClasses = useLabGags(host, { ambient, gags, idleAfter })

  return (
    <span
      className={styles.badge}
      style={{
        width: BADGE_CROP.width,
        height: BADGE_CROP.height,
        background: BADGE_BACKGROUND,
      }}
    >
      <span
        ref={setHost}
        aria-hidden="true"
        className={cx(blinkClass, styles.host, ...gagClasses)}
        style={{
          width: BADGE_SPRITE,
          height: BADGE_SPRITE,
          margin: `${-BADGE_CROP.offsetY}px 0 0 ${-BADGE_CROP.offsetX}px`,
        }}
      />
    </span>
  )
}
