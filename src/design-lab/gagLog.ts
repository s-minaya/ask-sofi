import type { GagId } from '../components/sofi/visual/ambient'
import type { AmbientEvent } from './observeAmbient'

// Registro de lo que `ambient` hace con los gags, para que el Lab lo muestre (4.6 y 4.7).
export type GagLog = {
  active: GagId | null
  entries: Array<{ id: number; text: string }>
  nextId: number
}

export const GAG_LOG_LIMIT = 30

export function createGagLog(): GagLog {
  return { active: null, entries: [], nextId: 1 }
}

export function gagReducer(state: GagLog, event: AmbientEvent): GagLog {
  const text = (() => {
    switch (event.kind) {
      case 'activate':
        return event.accepted
          ? `${event.gag} se activa`
          : `${event.gag} no puede activarse: ya hay otro gag activo`
      case 'deactivate':
        return state.active === event.gag
          ? `${event.gag} vuelve al reposo`
          : undefined
      case 'pause':
        return `${event.gag} en pausa`
      case 'resume':
        return `${event.gag} reanuda`
      case 'unregister':
        return state.active === event.gag
          ? `${event.gag} se desmonta`
          : undefined
    }
  })()
  const releases =
    (event.kind === 'deactivate' || event.kind === 'unregister') &&
    state.active === event.gag
  const active =
    event.kind === 'activate' && event.accepted
      ? event.gag
      : releases
        ? null
        : state.active
  if (text === undefined) return { ...state, active }
  return {
    active,
    nextId: state.nextId + 1,
    entries: [...state.entries, { id: state.nextId, text }].slice(
      -GAG_LOG_LIMIT,
    ),
  }
}
