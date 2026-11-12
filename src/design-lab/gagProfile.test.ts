import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SOFI_MOODS } from '../features/partner-profile/sofiGuide'
import {
  DEFAULT_FRAME_CONFIG,
  GAG_SHEET_PRESETS,
  configFromParams,
  holdsControlFocus,
  isCalmMood,
  paramsFromConfig,
  trackGagTargets,
  watchControlFocus,
} from './gagProfile'
import { createAmbient } from '../components/sofi/visual/ambient'
import { PROFILE_PRESETS } from './profile/profilePresets'

// T066 · ubicación A del expediente (aprobada, spec §5): las reglas puras del prototipo.

describe('estados en los que pueden vivir los gags', () => {
  it('solo con Sofi esperando la respuesta', () => {
    const calm = SOFI_MOODS.filter(isCalmMood)
    expect(calm).toEqual(['waiting'])
  })

  it('no mientras habla, reacciona, confirma un borrado o invita (spec §5)', () => {
    for (const mood of [
      'asking',
      'inviting',
      'acknowledging',
      'uncertain',
      'saved',
      'validationError',
      'deleting',
      'deleted',
    ] as const)
      expect(isCalmMood(mood), mood).toBe(false)
  })
})

describe('configuración del marco por la URL', () => {
  it('sin parámetros es la configuración por defecto', () => {
    expect(configFromParams(new URLSearchParams())).toEqual(
      DEFAULT_FRAME_CONFIG,
    )
  })

  it('ida y vuelta', () => {
    const config = {
      gags: { poking: true, 'i-see-you': false, 'are-u-still-here': true },
      idle: 5000,
      showHit: true,
    }
    expect(configFromParams(paramsFromConfig(config))).toEqual(config)
  })

  it('sin gags marcados se distingue de «sin parámetro»', () => {
    const none = {
      ...DEFAULT_FRAME_CONFIG,
      gags: { poking: false, 'i-see-you': false, 'are-u-still-here': false },
    }
    expect(configFromParams(paramsFromConfig(none)).gags).toEqual(none.gags)
  })

  it('descarta lo que no es válido: inactividad absurda', () => {
    const config = configFromParams(new URLSearchParams('idle=12'))
    expect(config.idle).toBe(DEFAULT_FRAME_CONFIG.idle)
  })

  it('el antiguo parámetro de la lectura de interacción ya no existe', () => {
    expect(paramsFromConfig(DEFAULT_FRAME_CONFIG).has('interaction')).toBe(
      false,
    )
  })
})

describe('composiciones con las que se prueban', () => {
  it('existen, son del expediente y la primera empieza con Sofi esperando', () => {
    for (const key of GAG_SHEET_PRESETS)
      expect(PROFILE_PRESETS[key].view, key).toBe('sheet')
    expect(PROFILE_PRESETS.waiting.events).toEqual([{ type: 'speechEnded' }])
  })
})

describe('foco en un control del formulario', () => {
  const inside = () => true
  const outside = () => false
  const button = document.createElement('button')
  const radio = document.createElement('input')
  radio.type = 'radio'
  const textarea = document.createElement('textarea')
  const link = document.createElement('a')
  link.href = '#notas'
  const paragraph = document.createElement('p')

  it('cualquier control de la ficha con foco cuenta', () => {
    for (const element of [button, radio, textarea, link])
      expect(holdsControlFocus(element, inside), element.tagName).toBe(true)
  })

  it('lo que no es un control, o no es de la ficha, o no hay foco, no cuenta', () => {
    expect(holdsControlFocus(paragraph, inside)).toBe(false)
    expect(holdsControlFocus(button, outside)).toBe(false)
    expect(holdsControlFocus(null, inside)).toBe(false)
  })
})

describe('vigilar el foco de los controles', () => {
  let first: HTMLButtonElement
  let second: HTMLButtonElement
  let outside: HTMLButtonElement
  let stop: () => void
  let seen: boolean[]

  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<main><button id="a">a</button><button id="b">b</button></main><button id="c">c</button>'
    first = document.getElementById('a') as HTMLButtonElement
    second = document.getElementById('b') as HTMLButtonElement
    outside = document.getElementById('c') as HTMLButtonElement
    seen = []
    stop = watchControlFocus(
      document,
      (element) => element.closest('main') !== null,
      (holds) => seen.push(holds),
    )
  })

  afterEach(() => {
    stop()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('empieza diciendo que no hay foco en un control', () => {
    expect(seen).toEqual([false])
  })

  it('avisa al ganar el foco, sin esperar', () => {
    first.focus()
    expect(seen).toEqual([false, true])
  })

  it('avisa al perderlo sin esperar (un toque fuera de los controles, el tabulador al salir)', () => {
    first.focus()
    first.blur()
    expect(seen).toEqual([false, true, false])
    vi.advanceTimersByTime(10)
    expect(seen).toEqual([false, true, false])
  })

  it('de un control a otro (Tab, flechas) nunca dice que se perdió', () => {
    first.focus()
    second.focus()
    vi.advanceTimersByTime(10)
    expect(seen).toEqual([false, true])
  })

  it('tampoco en el hueco entre los dos eventos, cuando el elemento activo es el documento', async () => {
    first.focus()
    // Como en el navegador: durante `focusout` el elemento activo ya es el documento y hay un
    // punto de control de microtareas antes de que llegue `focusin`.
    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => document.body,
    })
    first.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: second }),
    )
    await Promise.resolve()
    expect(seen).toEqual([false, true])
    delete (document as { activeElement?: unknown }).activeElement
    second.focus()
    vi.advanceTimersByTime(10)
    expect(seen).toEqual([false, true])
  })

  it('al salir de la ficha a un control de fuera cuenta como perderlo', () => {
    first.focus()
    outside.focus()
    expect(seen).toEqual([false, true, false])
  })

  it('si la ventana pierde el foco, el control sigue siendo el activo y los gags siguen suspendidos', () => {
    first.focus()
    // La ventana pierde el foco: `focusout` sin destino y sin que el elemento activo cambie.
    first.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    vi.advanceTimersByTime(10)
    expect(seen).toEqual([false, true])
  })

  it('al darse de baja deja de escuchar y no avisa de ninguna lectura pendiente', () => {
    first.focus()
    // `focusout` hacia fuera de la ficha con el elemento activo aún en el primero: la lectura de
    // confirmación, de llegar, volvería a decir que sí.
    first.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
    )
    expect(seen).toEqual([false, true, false])
    stop()
    vi.advanceTimersByTime(10)
    second.focus()
    expect(seen).toEqual([false, true, false])
  })
})

describe('devolver al reposo a todos los gags registrados (foco, spec §5)', () => {
  const target = () => ({ pause: vi.fn(), resume: vi.fn(), reset: vi.fn() })

  it('pide reset() a cada gag registrado, y solo cuando se le pide', () => {
    const { ambient, resetAll } = trackGagTargets(createAmbient())
    const poking = target()
    const eyes = target()
    ambient.register('poking', poking)
    ambient.register('i-see-you', eyes)
    expect(poking.reset).not.toHaveBeenCalled()
    resetAll()
    expect(poking.reset).toHaveBeenCalledTimes(1)
    expect(eyes.reset).toHaveBeenCalledTimes(1)
  })

  it('no cambia las reglas de ambient: una causa solo pausa, sin reset()', () => {
    const { ambient } = trackGagTargets(createAmbient())
    const poking = target()
    ambient.register('poking', poking)
    ambient.setCause('hidden', true)
    ambient.setCause('interaction', true)
    expect(poking.pause).toHaveBeenCalledTimes(1)
    expect(poking.reset).not.toHaveBeenCalled()
    ambient.setCause('hidden', false)
    ambient.setCause('interaction', false)
    expect(poking.resume).toHaveBeenCalledTimes(1)
  })

  it('reenvía activate y deactivate: un solo gag activo', () => {
    const { ambient } = trackGagTargets(createAmbient())
    ambient.register('poking', target())
    ambient.register('i-see-you', target())
    expect(ambient.activate('poking')).toBe(true)
    expect(ambient.activate('i-see-you')).toBe(false)
    ambient.deactivate('poking')
    expect(ambient.activate('i-see-you')).toBe(true)
  })

  it('un gag dado de baja ya no recibe reset(); el registro nuevo de StrictMode, sí', () => {
    const { ambient, resetAll } = trackGagTargets(createAmbient())
    const first = target()
    const second = target()
    const unregisterFirst = ambient.register('poking', first)
    ambient.register('poking', second)
    // La baja del primero llega después de que el segundo se registre.
    unregisterFirst()
    resetAll()
    expect(first.reset).not.toHaveBeenCalled()
    expect(second.reset).toHaveBeenCalledTimes(1)
  })
})
