import { afterEach, describe, expect, it } from 'vitest'
import { attachStillHere } from '../styles/sprites/are-u-still-here.js'
import { attachISeeYou } from '../styles/sprites/i-see-you.js'
import { TIMING, attachPoking } from '../styles/sprites/poking.js'
import {
  POKING_REDUCED_RESET_MS,
  REDUCED_LAYERS,
  pokingAccepts,
  seeYouShown,
  stillHereShown,
} from './reducedGags'

// Versión reducida de los gags (T066, aprobada el 2026-11-12): las máquinas de estados de los ZIP, sin
// modificar, pintadas con las poses fijas que cada parcial ya define para movimiento reducido. El
// Lab solo decide qué entradas cuentan y qué estado se pinta.

describe('poking reducido: reacciones de pie, sin esconderse', () => {
  it('los pinchazos cuentan hasta «ofendida»', () => {
    for (const state of ['idle', 'curious', 'skeptical', 'stop'] as const)
      expect(pokingAccepts(state)).toBe(true)
  })

  it('ofendida no pasa a esconderse: ni escondida, ni asomada, ni «nope», ni vuelta', () => {
    for (const state of ['offended', 'hide', 'peek', 'nope', 'return'] as const)
      expect(pokingAccepts(state)).toBe(false)
  })

  it('vuelve al reposo a los 5 s sin toques; el controlador (movimiento completo) sigue con 10 s', () => {
    expect(POKING_REDUCED_RESET_MS).toBe(5000)
    expect(TIMING.reset).toBe(10_000)
  })
})

describe('i-see-you reducido: la pillan y sonríe, sin seguir al puntero', () => {
  it('pillada se pinta tal cual, con la alerta fija', () => {
    expect(seeYouShown('caught')).toBe('caught')
  })

  it('el resto de la reacción es la sonrisa pícara, sin lengua ni risita', () => {
    for (const state of ['smirk', 'tease', 'giggle'] as const)
      expect(seeYouShown(state)).toBe('smirk')
  })

  it('mirar no se pinta: el reposo', () => {
    expect(seeYouShown('watching')).toBe('idle')
    expect(seeYouShown('idle')).toBe('idle')
  })
})

describe('are-u-still-here reducido: sin cabezadas ni susto', () => {
  it('las cabezadas se pintan como somnolienta, quieta', () => {
    expect(stillHereShown('nodding')).toBe('drowsy')
    expect(stillHereShown('drowsy')).toBe('drowsy')
  })

  it('el susto se pinta como la cara de pillada, sin estallido', () => {
    expect(stillHereShown('startled')).toBe('guilty')
    expect(stillHereShown('guilty')).toBe('guilty')
  })

  it('dormida y reposo, tal cual', () => {
    expect(stillHereShown('asleep')).toBe('asleep')
    expect(stillHereShown('idle')).toBe('idle')
  })
})

// Las capas que pinta cada parcial las crean los controladores; el Lab pinta las mismas.
describe('las capas son las que crea cada controlador del ZIP', () => {
  const hosts: HTMLElement[] = []
  const host = () => {
    const element = document.createElement('span')
    document.body.append(element)
    hosts.push(element)
    return element
  }
  afterEach(() => {
    for (const element of hosts.splice(0)) element.remove()
  })

  it.each([
    ['poking', attachPoking],
    ['i-see-you', attachISeeYou],
    ['are-u-still-here', attachStillHere],
  ] as const)('%s', (kind, attach) => {
    const element = host()
    const controller = attach(element)
    expect(REDUCED_LAYERS[kind]).toBe(element.innerHTML)
    controller.destroy()
  })
})
