import { useEffect, useState } from 'react'
import {
  loadedClassOf,
  loadSprite,
} from '../components/sofi/SofiSprite/loadSprite'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'
import type { Ambient, GagId } from '../components/sofi/visual/ambient'
import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  POKING_REDUCED_RESET_MS,
  REDUCED_LAYERS,
  pokingAccepts,
  seeYouShown,
  stillHereShown,
} from './reducedGags'

// Prototipo de la versión reducida de los gags (T066; aprobada el 2026-11-12: catálogo §7.2, plan
// §6). Solo del Lab: el adaptador de producción (`useSofiController`) no monta nada con movimiento
// reducido y no se toca; su mecanismo en producción está pendiente de autorizar (T088).
// Este es su espejo para ese caso: misma escena tranquila, mismas causas de pausa y un solo gag
// activo (`ambient`), con las máquinas de estados de los ZIP sin modificar (`reducedGags.ts`).
// Los tiempos van siempre a 1×: con movimiento reducido no hay animaciones que acompasar.

type Options = {
  ambient: Ambient
  calm: boolean
  idleAfter?: number
}

type Mount = (
  host: HTMLElement,
  onRest: (resting: boolean) => void,
  idleAfter: number,
) => {
  pause(): void
  resume(): void
  reset(): void
  destroy(): void
}

// Pausa con la pestaña oculta o con Sofi fuera de la pantalla, como los controladores.
function watchVisibility(
  host: HTMLElement,
  machine: { pause(reason: string): void; resume(reason: string): void },
  onHidden?: (hidden: boolean) => void,
) {
  const onVisibility = () => {
    onHidden?.(document.hidden)
    if (document.hidden) machine.pause('hidden')
    else machine.resume('hidden')
  }
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()
  const observer =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) =>
          entries.at(-1)?.isIntersecting
            ? machine.resume('offscreen')
            : machine.pause('offscreen'),
        )
      : null
  observer?.observe(host)
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    observer?.disconnect()
  }
}

const removeLayers = (host: HTMLElement, attribute: string) => {
  for (const layer of host.querySelectorAll(`:scope > [${attribute}]`))
    layer.remove()
}

const MOUNTS: Record<GagId, () => Promise<Mount>> = {
  // Solo el clic sobre su zona sensible, como en completo; los escalones de pie y nada más.
  poking: async () => {
    const { createPokingMachine } = await import('../styles/sprites/poking.js')
    return (host, onRest) => {
      host.insertAdjacentHTML('beforeend', REDUCED_LAYERS.poking)
      const machine = createPokingMachine({
        timing: { reset: POKING_REDUCED_RESET_MS },
        onChange: (state) => {
          host.dataset.poking = state
          onRest(state === 'idle')
        },
      })
      host.dataset.poking = machine.state
      const onClick = () => {
        if (pokingAccepts(machine.state)) machine.poke()
      }
      host.addEventListener('click', onClick)
      const stopWatching = watchVisibility(host, machine)
      return {
        pause: () => machine.pause(),
        resume: () => machine.resume(),
        reset: () => machine.reset(),
        destroy() {
          host.removeEventListener('click', onClick)
          stopWatching()
          machine.destroy()
          delete host.dataset.poking
          removeLayers(host, 'data-poking-layer')
        },
      }
    }
  },
  // Sin escuchas en la página ni miradas: solo el puntero o el dedo quieto encima de Sofi.
  'i-see-you': async () => {
    const { createISeeYouMachine } =
      await import('../styles/sprites/i-see-you.js')
    return (host, onRest) => {
      host.insertAdjacentHTML('beforeend', REDUCED_LAYERS['i-see-you'])
      const machine = createISeeYouMachine({
        onChange: (state) => {
          host.dataset.iSeeYou = seeYouShown(state)
          onRest(state === 'idle' || state === 'watching')
        },
      })
      host.dataset.iSeeYou = seeYouShown(machine.state)
      host.dataset.iSeeYouGaze = 'center'
      const onEnter = () => machine.hover(true)
      const onLeave = () => machine.hover(false)
      host.addEventListener('pointerenter', onEnter)
      host.addEventListener('pointerleave', onLeave)
      const stopWatching = watchVisibility(host, machine)
      return {
        pause: () => machine.pause(),
        resume: () => machine.resume(),
        reset: () => machine.reset(),
        destroy() {
          host.removeEventListener('pointerenter', onEnter)
          host.removeEventListener('pointerleave', onLeave)
          stopWatching()
          machine.destroy()
          delete host.dataset.iSeeYou
          delete host.dataset.iSeeYouGaze
          removeLayers(host, 'data-i-see-you-layer')
        },
      }
    }
  },
  // La misma actividad que en completo (la de `attachStillHere`), y la pestaña oculta cuenta como
  // inactividad.
  'are-u-still-here': async () => {
    const { createStillHereMachine, ACTIVITY } =
      await import('../styles/sprites/are-u-still-here.js')
    return (host, onRest, idleAfter) => {
      host.insertAdjacentHTML('beforeend', REDUCED_LAYERS['are-u-still-here'])
      const machine = createStillHereMachine({
        timing: { idleAfter },
        onChange: (state) => {
          host.dataset.stillHere = stillHereShown(state)
          onRest(state === 'idle')
        },
      })
      host.dataset.stillHere = stillHereShown(machine.state)
      const onActivity = (event: Event) => {
        if (
          event.type === 'pointermove' &&
          !(event as PointerEvent).movementX &&
          !(event as PointerEvent).movementY
        )
          return
        machine.wake()
      }
      const listen = { capture: true, passive: true }
      for (const type of ACTIVITY)
        document.addEventListener(type, onActivity, listen)
      let hiddenAt = 0
      const stopWatching = watchVisibility(host, machine, (hidden) => {
        if (hidden) hiddenAt = performance.now()
        else if (hiddenAt) {
          machine.away(performance.now() - hiddenAt)
          hiddenAt = 0
        }
      })
      return {
        pause: () => machine.pause(),
        resume: () => machine.resume(),
        reset: () => machine.reset(),
        destroy() {
          for (const type of ACTIVITY)
            document.removeEventListener(type, onActivity, listen)
          stopWatching()
          machine.destroy()
          delete host.dataset.stillHere
          removeLayers(host, 'data-still-here-layer')
        },
      }
    }
  },
}

// Devuelve la clase del gag con movimiento reducido (con movimiento completo, `undefined`: ahí
// manda `useSofiController`). Mismo contrato que el adaptador: el anfitrión es el elemento de
// `sofi-blink`, sin hijos de React, y la clase llega cuando sus tiras están decodificadas.
export function useReducedGag(
  kind: GagId,
  host: HTMLElement | null,
  { ambient, calm, idleAfter = STILL_HERE_IDLE_MS }: Options,
): string | undefined {
  const reduced = useReducedMotion()
  const enabled = calm && reduced && host !== null
  const [className, setClassName] = useState(() => loadedClassOf(kind))

  useEffect(() => {
    if (!enabled || className) return
    let current = true
    loadSprite(kind).then(
      (loaded) => current && setClassName(loaded),
      () => {},
    )
    return () => {
      current = false
    }
  }, [enabled, kind, className])

  useEffect(() => {
    if (!host || !enabled || !className) return
    let cancelled = false
    let teardown: (() => void) | undefined

    MOUNTS[kind]().then((mount) => {
      if (cancelled) return
      let resting = true
      const mounted = mount(
        host,
        (nowResting) => {
          if (nowResting === resting) return
          resting = nowResting
          if (nowResting) ambient.deactivate(kind)
          else ambient.activate(kind)
        },
        idleAfter,
      )
      const unregister = ambient.register(kind, {
        pause: () => mounted.pause(),
        resume: () => mounted.resume(),
        reset: () => mounted.reset(),
      })
      teardown = () => {
        unregister()
        mounted.destroy()
      }
    })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [enabled, kind, host, className, ambient, idleAfter])

  return enabled ? className : undefined
}
