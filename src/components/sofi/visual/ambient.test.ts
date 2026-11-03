import { describe, expect, it, vi } from 'vitest'
import { createAmbient } from './ambient'

// Catálogo §6.3 («Coordinación de easter eggs»): causas de pausa simultáneas, un `resume`
// de una causa no anula las restantes y solo un gag activo.
function target() {
  return { pause: vi.fn(), resume: vi.fn() }
}

describe('createAmbient: causas de pausa', () => {
  it('pausa al pasar de vacío a no vacío y reanuda al revés, sin argumentos', () => {
    const ambient = createAmbient()
    const poking = target()
    ambient.register('poking', poking)

    ambient.setCause('busy', true)
    expect(poking.pause).toHaveBeenCalledTimes(1)
    // `attachPoking` pierde el motivo al delegar: el adaptador nunca depende de él.
    expect(poking.pause).toHaveBeenCalledWith()

    ambient.setCause('busy', false)
    expect(poking.resume).toHaveBeenCalledTimes(1)
    expect(poking.resume).toHaveBeenCalledWith()
  })

  it('con varias causas, reanudar una no anula las demás', () => {
    const ambient = createAmbient()
    const gag = target()
    ambient.register('i-see-you', gag)

    ambient.setCause('busy', true)
    ambient.setCause('interaction', true)
    ambient.setCause('sensitive', true)
    ambient.setCause('hidden', true)
    expect(gag.pause).toHaveBeenCalledTimes(1)

    ambient.setCause('busy', false)
    ambient.setCause('interaction', false)
    ambient.setCause('sensitive', false)
    // La página oculta es una causa propia: sigue pausando cuando las demás se van.
    expect(gag.resume).not.toHaveBeenCalled()

    ambient.setCause('hidden', false)
    expect(gag.resume).toHaveBeenCalledTimes(1)
  })

  it('repetir una causa, o quitar una que no está, no llama al controlador', () => {
    const ambient = createAmbient()
    const gag = target()
    ambient.register('poking', gag)

    ambient.setCause('hidden', false)
    ambient.setCause('busy', true)
    ambient.setCause('busy', true)
    ambient.setCause('busy', false)
    ambient.setCause('busy', false)

    expect(gag.pause).toHaveBeenCalledTimes(1)
    expect(gag.resume).toHaveBeenCalledTimes(1)
  })

  it('un controlador que se registra con causas activas nace pausado', () => {
    const ambient = createAmbient()
    ambient.setCause('sensitive', true)
    const late = target()

    ambient.register('are-u-still-here', late)

    expect(late.pause).toHaveBeenCalledTimes(1)
    ambient.setCause('sensitive', false)
    expect(late.resume).toHaveBeenCalledTimes(1)
  })

  it('al darlo de baja, el controlador no recibe más llamadas', () => {
    const ambient = createAmbient()
    const gag = target()
    const unregister = ambient.register('poking', gag)

    unregister()
    ambient.setCause('busy', true)
    ambient.setCause('busy', false)

    expect(gag.pause).not.toHaveBeenCalled()
    expect(gag.resume).not.toHaveBeenCalled()
  })
})

describe('createAmbient: un solo gag activo', () => {
  function scene() {
    const ambient = createAmbient()
    const gags = {
      poking: target(),
      'i-see-you': target(),
      'are-u-still-here': target(),
    }
    for (const [id, gag] of Object.entries(gags))
      ambient.register(id as keyof typeof gags, gag)
    return { ambient, gags }
  }

  it('mientras uno está activo, los demás quedan pausados y él no', () => {
    const { ambient, gags } = scene()

    expect(ambient.activate('poking')).toBe(true)

    expect(gags.poking.pause).not.toHaveBeenCalled()
    expect(gags['i-see-you'].pause).toHaveBeenCalledTimes(1)
    expect(gags['are-u-still-here'].pause).toHaveBeenCalledTimes(1)

    ambient.deactivate('poking')
    expect(gags['i-see-you'].resume).toHaveBeenCalledTimes(1)
    expect(gags['are-u-still-here'].resume).toHaveBeenCalledTimes(1)
  })

  it('un segundo gag no puede activarse mientras haya uno activo', () => {
    const { ambient } = scene()

    expect(ambient.activate('poking')).toBe(true)
    expect(ambient.activate('i-see-you')).toBe(false)
    // Soltar el que no era el activo no libera al activo.
    ambient.deactivate('i-see-you')
    expect(ambient.activate('are-u-still-here')).toBe(false)

    ambient.deactivate('poking')
    expect(ambient.activate('i-see-you')).toBe(true)
  })

  it('otro gag activo y una causa de la escena se suman: se reanuda cuando no queda ninguna', () => {
    const { ambient, gags } = scene()
    const waiting = gags['i-see-you']

    ambient.activate('poking')
    ambient.setCause('busy', true)
    expect(waiting.pause).toHaveBeenCalledTimes(1)

    ambient.deactivate('poking')
    expect(waiting.resume).not.toHaveBeenCalled()

    ambient.setCause('busy', false)
    expect(waiting.resume).toHaveBeenCalledTimes(1)
  })

  it('una causa de la escena pausa también al gag activo', () => {
    const { ambient, gags } = scene()
    ambient.activate('poking')

    ambient.setCause('interaction', true)

    expect(gags.poking.pause).toHaveBeenCalledTimes(1)
  })

  it('dar de baja el gag activo libera a los demás', () => {
    const ambient = createAmbient()
    const active = target()
    const other = target()
    const unregister = ambient.register('poking', active)
    ambient.register('i-see-you', other)
    ambient.activate('poking')

    unregister()

    expect(other.resume).toHaveBeenCalledTimes(1)
    expect(ambient.activate('i-see-you')).toBe(true)
  })
})
