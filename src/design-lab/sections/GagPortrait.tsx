import { useState } from 'react'
import { SofiPortrait } from '../../components/sofi/SofiPortrait/SofiPortrait'
import type { Ambient, GagId } from '../../components/sofi/visual/ambient'
import { cx } from '../../utils/cx'
import { useLabGags } from '../useLabGags'
import styles from './GagsWideSpec.module.scss'

type GagPortraitProps = {
  // Las causas de pausa compartidas con los demás gags de la escena.
  ambient: Ambient
  // Cuáles de los tres están montados; el resto no existe (ni controlador ni capas ni tiras).
  gags: Readonly<Record<GagId, boolean>>
  // Solo se pasa al controlador de `are-u-still-here`.
  idleAfter: number
}

// El retrato grande de la consulta a dos columnas (`ConsultationScreen`, `listenBig`), con los tres
// gags reales sobre él. NO es otra Sofi: se pinta el mismo `SofiPortrait` de producción, con las
// mismas props, y el anfitrión de los controladores es el elemento de `sofi-blink` que ese
// componente ya renderiza. Como el componente no expone su elemento (y no se toca), se localiza
// desde un envoltorio sin caja propia; el plan (§6) pide un anfitrión sin hijos de React, y este
// los cumple: el controlador añade las capas y React no pinta ninguna.
export function GagPortrait({ ambient, gags, idleAfter }: GagPortraitProps) {
  const [wrapper, setWrapper] = useState<HTMLElement | null>(null)
  const first = wrapper?.firstElementChild
  const host = first instanceof HTMLElement ? first : null
  // Con movimiento reducido, los gags en su versión reducida (aprobada, plan §6).
  const gagClasses = useLabGags(host, { ambient, gags, idleAfter })

  return (
    <span ref={setWrapper} className={styles.wrapper}>
      <SofiPortrait
        size={384}
        expression="attentive"
        outline
        alt="Sofi, atenta a lo que le cuentas"
        className={cx(styles.host, ...gagClasses)}
      />
    </span>
  )
}
