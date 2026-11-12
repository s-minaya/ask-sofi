import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { loadedClassOf, loadSprite } from './SofiSprite/loadSprite'
import type { Ambient, GagId } from './visual/ambient'
import { applyRate, rateFor, subscribeToRates } from './visual/rates'

// Adaptador de los controladores de los gags (plan 008 §6): `poking`, `are-u-still-here` e
// `i-see-you`. Monta el controlador del ZIP tal cual, sin modificarlo, y lo destruye en la
// limpieza del efecto (E6, E7). La decisión de qué gag toca y dónde es de quien lo usa.

// Inactividad de `are-u-still-here`, dentro de los 2–3 minutos de la spec. Provisional: el
// definitivo se aprueba en el Lab. Se pasa siempre; el 90 000 ms del ZIP no es regla funcional.
export const STILL_HERE_IDLE_MS = 150_000

export type SofiControllerOptions = {
  // Las causas de pausa compartidas con los demás gags de la escena.
  ambient: Ambient
  // Escena tranquila: nada se escribe, lee ni procesa. Sin ella no se pide ni una tira, ni
  // se carga el controlador, ni hay escuchas globales (catálogo §6; plan §7).
  calm: boolean
  // Inactividad de `are-u-still-here` en ms. Solo para demostrarla sin esperar (el Design Lab);
  // sin ella manda `STILL_HERE_IDLE_MS`. El valor definitivo lo aprueba el Lab (AV6).
  idleAfter?: number
}

// Lo común a los tres controladores que usa el adaptador.
type Controller = {
  pause(): void
  resume(): void
  reset(): void
  setRate(rate: number): void
  destroy(): void
}
// `onRest` avisa de si el gag está en reposo (patrón `quiet` de los propios controladores).
type Attach = (
  host: HTMLElement,
  onRest: (resting: boolean) => void,
  idleAfter: number,
) => Controller

// El `import()` va dentro de cada cargador: un import estático metería los tres controladores
// en el chunk de entrada (plan §7). Se importa antes de montar para no crear capas que luego
// haya que quitar si la limpieza llega mientras carga.
const CONTROLLERS: Record<GagId, () => Promise<Attach>> = {
  poking: async () => {
    const { attachPoking } = await import('../../styles/sprites/poking.js')
    return (host, onRest) =>
      attachPoking(host, { onChange: (state) => onRest(state === 'idle') })
  },
  'are-u-still-here': async () => {
    const { attachStillHere } =
      await import('../../styles/sprites/are-u-still-here.js')
    return (host, onRest, idleAfter) =>
      attachStillHere(host, {
        timing: { idleAfter },
        onChange: (state) => onRest(state === 'idle'),
      })
  },
  'i-see-you': async () => {
    const { attachISeeYou } = await import('../../styles/sprites/i-see-you.js')
    return (host, onRest) =>
      attachISeeYou(host, {
        // Mirar no cuenta como salir del reposo: solo reaccionar.
        onChange: (state) => onRest(state === 'idle' || state === 'watching'),
      })
  },
}

// Devuelve la clase del gag, que el consumidor aplica al anfitrión (el elemento de `sofi-blink`,
// sin hijos de React: el controlador le añade las capas). Es `undefined` hasta que las tiras
// del gag están decodificadas y mientras no pueda montarse. `kind` no cambia mientras vive el
// consumidor; para otro gag, otra instancia.
export function useSofiController(
  kind: GagId,
  host: HTMLElement | null,
  { ambient, calm, idleAfter = STILL_HERE_IDLE_MS }: SofiControllerOptions,
): string | undefined {
  const reduced = useReducedMotion()
  const rate = useSyncExternalStore(subscribeToRates, () => rateFor(kind))
  // Con movimiento reducido el gag no existe (D-1): ni controlador ni tiras.
  const enabled = calm && !reduced && host !== null
  const [className, setClassName] = useState(() => loadedClassOf(kind))
  const controller = useRef<Controller>(null)

  // Las capas las crea el controlador y piden sus tiras entonces (E12, E13): se decodifican
  // antes, y el controlador no se monta hasta que la clase está aplicada.
  useEffect(() => {
    if (!enabled || className) return
    let current = true
    // Un fallo deja a Sofi sin gag: nunca sin representación.
    loadSprite(kind).then(
      (loadedClass) => current && setClassName(loadedClass),
      () => {},
    )
    return () => {
      current = false
    }
  }, [enabled, kind, className])

  const applyCurrentRate = useEffectEvent((target: Controller) => {
    if (rate !== 1) target.setRate(rate)
  })

  useEffect(() => {
    if (!host || !enabled || !className) return
    let cancelled = false
    let teardown: (() => void) | undefined

    CONTROLLERS[kind]().then((attach) => {
      if (cancelled) return
      let resting = true
      const attached = attach(
        host,
        (nowResting) => {
          if (nowResting === resting) return
          resting = nowResting
          if (nowResting) ambient.deactivate(kind)
          else ambient.activate(kind)
        },
        idleAfter,
      )
      applyCurrentRate(attached)
      // `attachPoking` pierde el motivo al delegar: por eso `pause()` y `resume()` van sin
      // argumentos y es `ambient` quien agrega las causas (E6). `reset()` solo lo pide
      // `ambient` cuando otro gag sale del reposo (patrón `quiet` de los controladores).
      const unregister = ambient.register(kind, {
        pause: () => attached.pause(),
        resume: () => attached.resume(),
        reset: () => attached.reset(),
      })
      controller.current = attached
      teardown = () => {
        // Primero se da de baja, para que ninguna causa llegue a un controlador destruido.
        unregister()
        attached.destroy()
        controller.current = null
      }
    })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [enabled, kind, host, className, ambient, idleAfter])

  useEffect(() => {
    controller.current?.setRate(rate)
  }, [rate])

  // `setRate` solo mueve los temporizadores del controlador. Las animaciones CSS de sus capas
  // nacen a 1× con cada estado, así que se les aplica la velocidad al cambiarla, cuando el
  // controlador cambia de estado o de capas (así nacen ya a la velocidad común, también las que
  // tienen retardo y no avisan hasta que vence, como los Zzz) y en cada `animationstart` (como
  // `SofiSprite`, E5). A 1× no se toca nada: la velocidad original de un gag, como la de
  // `poking`, queda tal cual la dejan sus parciales.
  const touched = useRef(false)
  useEffect(() => {
    if (!host || !enabled || !className) return
    if (rate === 1) {
      if (touched.current) applyRate(host, 1)
      touched.current = false
      return
    }
    touched.current = true
    const apply = () => applyRate(host, rate)
    apply()
    const layers = new MutationObserver(apply)
    layers.observe(host, { attributes: true, childList: true, subtree: true })
    host.addEventListener('animationstart', apply)
    return () => {
      layers.disconnect()
      host.removeEventListener('animationstart', apply)
    }
  }, [host, enabled, className, rate])

  return enabled ? className : undefined
}
