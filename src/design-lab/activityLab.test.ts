import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_VARIANTS,
  activityReducer,
  activityView,
  createActivityState,
  cycleOf,
  pingPong,
  type ActivityState,
} from './activityLab'

// T068: prototipos del indicador de actividad (D-8). Lógica del Lab, no el componente
// definitivo (T079–T080).

describe('pingPong', () => {
  it('recorre los fotogramas de ida y vuelta sin repetir los extremos', () => {
    expect(pingPong(5)).toEqual([0, 1, 2, 3, 4, 3, 2, 1])
    expect(pingPong(4)).toEqual([0, 1, 2, 3, 2, 1])
    expect(pingPong(2)).toEqual([0, 1])
  })

  it('con un único fotograma no hay ciclo que recorrer', () => {
    expect(pingPong(1)).toEqual([0])
  })
})

describe('ACTIVITY_VARIANTS', () => {
  it('propone entre dos y tres variantes con identificadores únicos', () => {
    expect(ACTIVITY_VARIANTS.length).toBeGreaterThanOrEqual(2)
    expect(ACTIVITY_VARIANTS.length).toBeLessThanOrEqual(3)
    const ids = ACTIVITY_VARIANTS.map((variant) => variant.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(ACTIVITY_VARIANTS.map((variant) => [variant.id, variant] as const))(
    '%s: rejilla cuadrada, igual en todos los fotogramas y solo con píxeles',
    (_id, variant) => {
      expect(variant.frames.length).toBeGreaterThanOrEqual(3)
      const size = variant.frames[0].length
      for (const frame of variant.frames) {
        expect(frame).toHaveLength(size)
        for (const row of frame)
          expect(row).toMatch(new RegExp(`^[.#]{${size}}$`))
        expect(frame.join('')).toContain('#')
      }
    },
  )

  it.each(ACTIVITY_VARIANTS.map((variant) => [variant.id, variant] as const))(
    '%s: cada fotograma es distinto del siguiente, para que se vea la progresión',
    (_id, variant) => {
      const drawn = variant.frames.map((frame) => frame.join('/'))
      expect(new Set(drawn).size).toBe(drawn.length)
    },
  )

  it.each(ACTIVITY_VARIANTS.map((variant) => [variant.id, variant] as const))(
    '%s: ritmo propuesto y pose quieta válidos',
    (_id, variant) => {
      expect(variant.frameMs).toBeGreaterThan(0)
      expect(variant.stillFrame).toBeGreaterThanOrEqual(0)
      expect(variant.stillFrame).toBeLessThan(variant.frames.length)
    },
  )

  it('120 ms es el punto de partida de una de ellas (D-8), no de todas', () => {
    const rhythms = ACTIVITY_VARIANTS.map((variant) => variant.frameMs)
    expect(rhythms).toContain(120)
    expect(new Set(rhythms).size).toBeGreaterThan(1)
  })
})

describe('cycleOf', () => {
  it('da la secuencia de ida y vuelta y la posición de la pose quieta en ella', () => {
    const variant = {
      id: 'x',
      name: 'x',
      frames: [['#.'], ['.#'], ['##']].map((rows) => [rows[0], rows[0]]),
      frameMs: 100,
      stillFrame: 2,
    }
    expect(cycleOf(variant)).toEqual({
      sequence: [0, 1, 2, 1],
      stillIndex: 2,
      cycleMs: 400,
    })
  })
})

const at = (state: ActivityState, ms: number, reducedMotion = false) =>
  activityView(state, ms, reducedMotion)

describe('simulación de la operación', () => {
  it('sin operación no hay nada que indicar', () => {
    const view = at(createActivityState(), 0)
    expect(view).toMatchObject({
      pending: false,
      label: null,
      indicator: 'hidden',
    })
  })

  it('durante un análisis la etiqueta sigue el tiempo real y el indicador se anima', () => {
    const state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'analysis',
      at: 1000,
    })
    expect(at(state, 1000)).toMatchObject({
      pending: true,
      elapsedMs: 0,
      label: 'sofing…',
      indicator: 'animated',
    })
    expect(at(state, 5000)).toMatchObject({
      elapsedMs: 4000,
      label: 'cooking…',
    })
  })

  it('una carga usa su propia etiqueta', () => {
    const state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'loading',
      at: 0,
    })
    expect(at(state, 9000).label).toBe('rolling…')
  })

  it('con movimiento reducido el indicador queda quieto y la etiqueta fija (D-20)', () => {
    const state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'analysis',
      at: 0,
    })
    expect(at(state, 9000, true)).toMatchObject({
      label: 'sofing…',
      indicator: 'still',
    })
  })

  it('adelantar el reloj de la demostración equivale a que pase ese tiempo', () => {
    let state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'analysis',
      at: 0,
    })
    state = activityReducer(state, { type: 'skip', ms: 4000 })
    expect(at(state, 0)).toMatchObject({ elapsedMs: 4000, label: 'cooking…' })
  })

  it('con el resultado retenido por el primer ciclo ya no indica actividad (catálogo §6.4)', () => {
    let state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'analysis',
      at: 0,
    })
    state = activityReducer(state, { type: 'retain' })
    expect(state.phase).toBe('retained')
    expect(at(state, 1000)).toMatchObject({
      pending: false,
      label: null,
      indicator: 'hidden',
    })
  })

  it('la retención solo existe para el análisis: una carga no se retiene', () => {
    const loading = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'loading',
      at: 0,
    })
    expect(activityReducer(loading, { type: 'retain' })).toBe(loading)
  })

  it('al terminar deja de indicar actividad, también con movimiento reducido', () => {
    let state = activityReducer(createActivityState(), {
      type: 'start',
      kind: 'analysis',
      at: 0,
    })
    state = activityReducer(state, { type: 'finish' })
    expect(at(state, 0, true)).toMatchObject({
      label: null,
      indicator: 'hidden',
    })
  })

  it('terminar, retener o adelantar sin operación en curso no cambia nada', () => {
    const idle = createActivityState()
    expect(activityReducer(idle, { type: 'finish' })).toBe(idle)
    expect(activityReducer(idle, { type: 'retain' })).toBe(idle)
    expect(activityReducer(idle, { type: 'skip', ms: 4000 })).toBe(idle)
  })
})
