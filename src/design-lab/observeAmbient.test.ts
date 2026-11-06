import { describe, expect, it, vi } from 'vitest'
import { createAmbient } from '../components/sofi/visual/ambient'
import { observeAmbient, type AmbientEvent } from './observeAmbient'

// El Lab quiere ver qué hace `ambient` (un solo gag activo, pausas por causa) sin copiar su
// lógica: el envoltorio solo reenvía y cuenta lo que ocurre.
function setup() {
  const events: AmbientEvent[] = []
  const ambient = observeAmbient(createAmbient(), (event) => events.push(event))
  const target = () => ({ pause: vi.fn(), resume: vi.fn() })
  return { ambient, events, target }
}

describe('observeAmbient', () => {
  it('reenvía activate y deactivate con su resultado real', () => {
    const { ambient, events } = setup()
    expect(ambient.activate('poking')).toBe(true)
    // Otro gag no puede activarse mientras hay uno activo: lo dice `ambient`, no el Lab.
    expect(ambient.activate('i-see-you')).toBe(false)
    ambient.deactivate('poking')

    expect(events).toEqual([
      { kind: 'activate', gag: 'poking', accepted: true },
      { kind: 'activate', gag: 'i-see-you', accepted: false },
      { kind: 'deactivate', gag: 'poking' },
    ])
  })

  it('avisa de cada pausa y reanudación que llega al controlador, y solo de esas', () => {
    const { ambient, events, target } = setup()
    const poking = target()
    ambient.register('poking', poking)

    ambient.setCause('interaction', true)
    ambient.setCause('hidden', true)
    ambient.setCause('interaction', false)
    ambient.setCause('hidden', false)

    // Dos causas a la vez: una sola pausa y una sola reanudación.
    expect(events).toEqual([
      { kind: 'pause', gag: 'poking' },
      { kind: 'resume', gag: 'poking' },
    ])
    expect(poking.pause).toHaveBeenCalledTimes(1)
    expect(poking.resume).toHaveBeenCalledTimes(1)
  })

  it('mientras un gag está activo, los demás quedan pausados por ambient', () => {
    const { ambient, events, target } = setup()
    const poking = target()
    const seeYou = target()
    ambient.register('poking', poking)
    ambient.register('i-see-you', seeYou)

    ambient.activate('poking')

    expect(events).toContainEqual({ kind: 'pause', gag: 'i-see-you' })
    expect(seeYou.pause).toHaveBeenCalledTimes(1)
    expect(poking.pause).not.toHaveBeenCalled()
  })

  it('dar de baja un controlador sigue funcionando y no deja objetivos colgados', () => {
    const { ambient, events, target } = setup()
    const poking = target()
    const unregister = ambient.register('poking', poking)
    unregister()
    ambient.setCause('busy', true)
    expect(events).toEqual([])
    expect(poking.pause).not.toHaveBeenCalled()
  })
})
