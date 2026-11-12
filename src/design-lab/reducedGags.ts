import type { GagId } from '../components/sofi/visual/ambient'
import type { StillHereState } from '../styles/sprites/are-u-still-here.js'
import type { ISeeYouState } from '../styles/sprites/i-see-you.js'
import type { PokingState } from '../styles/sprites/poking.js'

// Versión reducida de los gags (T066), aprobada por la autora el 2026-11-12: la reacción estática
// del catálogo §7.2 (fichas 006, 008 y 009), con el mecanismo de plan §6. Sin movimiento continuo
// ni seguimiento animado.
//
// No hay arte nuevo ni controladores modificados: el Lab usa las máquinas de estados de los ZIP
// (`createPokingMachine`, `createISeeYouMachine`, `createStillHereMachine`, que los propios
// controladores ofrecen para pintar el estado a mano) y cada parcial ya define, con movimiento
// reducido, una pose fija por estado («se ven los mismos estados, sin desplazamientos»). Aquí solo
// se decide qué entradas cuentan y qué estado se pinta.

// Las capas que crea cada controlador (no las exporta). `reducedGags.test.ts` comprueba que son las
// mismas: si un ZIP las cambia, la prueba falla.
export const REDUCED_LAYERS: Record<GagId, string> = {
  poking:
    '<span data-poking-layer="body"><span data-poking-layer="face"></span><span data-poking-layer="palm"></span>' +
    '<span data-poking-layer="pose"></span><span data-poking-layer="head"></span></span>' +
    '<span data-poking-layer="hands"></span><span data-poking-layer="question"></span>' +
    '<span data-poking-layer="vein"></span>',
  'i-see-you':
    '<span data-i-see-you-layer="face"></span><span data-i-see-you-layer="alert"></span>' +
    '<span data-i-see-you-layer="sparkle"></span>',
  'are-u-still-here':
    '<span data-still-here-layer="body"><span data-still-here-layer="pose"></span>' +
    '<span data-still-here-layer="face"></span><span data-still-here-layer="mouth"></span></span>' +
    '<span data-still-here-layer="z1"></span><span data-still-here-layer="z2"></span>' +
    '<span data-still-here-layer="z3"></span><span data-still-here-layer="burst"></span>',
}

// `poking`: cada pinchazo sube un escalón de pie (curiosa, escéptica, «¡quieto!», ofendida) y ahí
// se queda hasta volver al reposo. Esconderse tras el borde, asomarse y volver a subir es la parte
// más aparatosa (Sofi desaparece de golpe): en reducido no ocurre.
//
// Espera sin toques hasta volver al reposo (aprobada el 2026-11-12, plan §6): 5 s en vez de los 10 s
// del controlador (`TIMING.reset`, que sigue mandando con movimiento completo). Se pasa con la
// opción `timing` de la máquina, sin modificarla.
export const POKING_REDUCED_RESET_MS = 5000

export function pokingAccepts(state: PokingState): boolean {
  return (
    state === 'idle' ||
    state === 'curious' ||
    state === 'skeptical' ||
    state === 'stop'
  )
}

// `i-see-you`: sin seguimiento no hay miradas; la pillan (cara y alerta fijas) y se queda con la
// sonrisa pícara hasta el reposo: dos cambios en vez de cinco.
export function seeYouShown(state: ISeeYouState): ISeeYouState {
  if (state === 'watching') return 'idle'
  if (state === 'tease' || state === 'giggle') return 'smirk'
  return state
}

// `are-u-still-here`: somnolienta y dormida, quietas; sin cabezadas (que, aun quietas, alternan la
// pose cuatro veces) y sin susto ni estallido al despertar: directamente la cara de pillada.
export function stillHereShown(state: StillHereState): StillHereState {
  if (state === 'nodding') return 'drowsy'
  if (state === 'startled') return 'guilty'
  return state
}
