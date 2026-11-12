import { describe, expect, it } from 'vitest'
import { createGagLog, gagReducer, type GagLog } from './gagLog'
import type { AmbientEvent } from './observeAmbient'

const run = (events: AmbientEvent[], from: GagLog = createGagLog()) =>
  events.reduce(gagReducer, from)

describe('gagReducer', () => {
  it('dar de baja el gag activo lo libera y lo anota', () => {
    const log = run([
      { kind: 'activate', gag: 'poking', accepted: true },
      { kind: 'unregister', gag: 'poking' },
    ])
    expect(log.active).toBeNull()
    expect(log.entries.map((entry) => entry.text)).toEqual([
      'poking se activa',
      'poking se desmonta',
    ])
  })

  it('dar de baja uno que no está activo no cambia nada ni ensucia el registro', () => {
    const before = run([{ kind: 'activate', gag: 'poking', accepted: true }])
    const after = run([{ kind: 'unregister', gag: 'i-see-you' }], before)
    expect(after.active).toBe('poking')
    expect(after.entries).toEqual(before.entries)
  })
})
