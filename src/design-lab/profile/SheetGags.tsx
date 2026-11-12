import { useEffect, useLayoutEffect, useReducer, useState } from 'react'
import { className as blinkClass } from '../../components/sofi/sprites/sofi-blink'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { createAmbient } from '../../components/sofi/visual/ambient'
import type { SofiMood } from '../../features/partner-profile/sofiGuide'
import {
  isCalmMood,
  trackGagTargets,
  watchControlFocus,
  type GagsFrameConfig,
  type GagsFrameStatus,
} from '../gagProfile'
import { createGagLog, gagReducer } from '../gagLog'
import { observeAmbient } from '../observeAmbient'
import { useLabGags } from '../useLabGags'
import styles from './GagsProfile.module.scss'

// El escenario de Sofi en el expediente (`ProfileSheet`) y su retrato: lo que ya existe y no se
// toca. El Lab los localiza en el DOM.
const STAGE_SELECTOR = 'section[aria-label="La pregunta de Sofi"]'

type SheetGagsProps = {
  mood: SofiMood
  config: GagsFrameConfig
  // Para contarle a la página del Lab cómo está la escena.
  onStatus?: (status: Omit<GagsFrameStatus, 'frame'>) => void
}

// Los tres gags sobre el retrato del cuestionario, sin modificar `ProfileSheet` ni `SofiPortrait`
// (producción): el Lab encuentra el retrato en el DOM y le añade las clases de los gags. Es solo
// una técnica de prototipo; en producción el retrato daría su anfitrión a los controladores
// (008-verification §27.4.3).
//
// Estados permitidos (spec §5): el retrato solo es el elemento de `sofi-blink` con Sofi
// preguntando o esperando; los gags solo viven con Sofi esperando la respuesta (`waiting`).
// Cualquier otro estado los desmonta del todo: ni controladores ni capas ni tiras ni escuchas. Con
// el foco en un control de la ficha siguen montados, pero en reposo y suspendidos.
export function SheetGags({ mood, config, onStatus }: SheetGagsProps) {
  const [log, report] = useReducer(gagReducer, undefined, createGagLog)
  const [{ ambient, resetAll }] = useState(() =>
    trackGagTargets(observeAmbient(createAmbient(), report)),
  )
  const [host, setHost] = useState<HTMLElement | null>(null)

  // El retrato cambia de elemento cuando Sofi pasa de la imagen estática de una reacción al
  // sprite, y viceversa: se vuelve a buscar con cada cambio del escenario.
  useEffect(() => {
    const find = () => {
      const found = document.querySelector<HTMLElement>(
        `${STAGE_SELECTOR} [role="img"]`,
      )
      setHost(found?.classList.contains(blinkClass) ? found : null)
    }
    find()
    const stage = document.querySelector(STAGE_SELECTOR)
    if (!stage) return
    const observer = new MutationObserver(find)
    observer.observe(stage, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [mood])

  // Con movimiento reducido los gags siguen, en su versión reducida (aprobada, plan §6): la escena
  // tranquila no depende del modo de movimiento; cada adaptador monta solo en el suyo.
  const reduced = useReducedMotion()
  const calm = isCalmMood(mood) && host !== null
  const gagClasses = useLabGags(host, {
    ambient,
    gags: {
      poking: calm && config.gags.poking,
      'i-see-you': calm && config.gags['i-see-you'],
      'are-u-still-here': calm && config.gags['are-u-still-here'],
    },
    idleAfter: config.idle,
  })

  // Clases del Lab y de los gags en el retrato y en su escenario. React no las conoce: si vuelve
  // a escribir el `class` del retrato, se reponen en el siguiente commit (sin dependencias).
  // La zona sensible (`styles.host`) solo con algún gag montado: su `::after` se coloca respecto al
  // anfitrión gracias al `position: relative` que le dan los parciales de los gags. Sin ninguno
  // (todos desmarcados o mientras cargan las tiras), quedaría colocado
  // respecto al escenario y, ampliado ×3, taparía «Volver a la consulta»: las acciones del
  // formulario siempre prevalecen (spec §5).
  const hostClasses = gagClasses.length ? [styles.host, ...gagClasses] : []
  useLayoutEffect(() => {
    const stage = host?.closest(STAGE_SELECTOR) ?? null
    host?.classList.add(...hostClasses)
    stage?.classList.add(styles.stage)
    stage?.classList.toggle(styles.showHit, config.showHit)
    return () => {
      host?.classList.remove(...hostClasses)
      stage?.classList.remove(styles.stage, styles.showHit)
    }
  })

  // Foco en un control de la ficha → causa de pausa `interaction` y, al entrar, todos los gags al
  // reposo (spec §5). Primero la pausa y después el `reset()`: el gag activo, al volver al reposo,
  // libera a los demás (`deactivate`), y con la causa ya puesta ninguno se reanuda ni un instante.
  // Al perder el foco solo se quita la causa: no queda nada pendiente que continuar.
  const [interacting, setInteracting] = useState(false)
  useEffect(() => {
    const stop = watchControlFocus(
      document,
      (element) => element.closest('main') !== null,
      (holds) => {
        setInteracting(holds)
        ambient.setCause('interaction', holds)
        if (holds) resetAll()
      },
    )
    return () => {
      stop()
      ambient.setCause('interaction', false)
    }
  }, [ambient, resetAll])

  // Página no visible → causa `hidden`.
  useEffect(() => {
    const update = () => ambient.setCause('hidden', document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      document.removeEventListener('visibilitychange', update)
      ambient.setCause('hidden', false)
    }
  }, [ambient])

  useEffect(() => {
    onStatus?.({
      mood,
      sprite: host !== null,
      calm,
      interaction: interacting,
      reduced,
      active: log.active,
    })
  }, [onStatus, mood, host, calm, interacting, reduced, log.active])

  return null
}
