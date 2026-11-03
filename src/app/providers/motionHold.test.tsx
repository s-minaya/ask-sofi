import { act, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  readPreferences,
  subscribeToPreferences,
  updatePreferences,
  type MotionPreference,
} from '../../infrastructure/storage/preferencesStorage'
import { clearUserData } from '../../infrastructure/storage/userData'
import { setMediaQuery } from '../../test/matchMedia'
import { MotionPreferenceProvider } from './MotionPreference'
import { applyMotionPreference, holdMotion, isReducedMotion } from './motion'

// Plan 008 §5.2 (D-16): el borrado total restablece la preferencia a `system`, pero la
// reacción de `memory-wipe` mantiene el modo efectivo con el que empezó, con el único
// `data-motion` de <html>, hasta el fin de su confirmación funcional.
const SYSTEM_QUERY = '(prefers-reduced-motion: reduce)'
const html = () => document.documentElement

// Estado del arranque: la preferencia guardada, aplicada como hace `main.tsx`.
function start(preference: MotionPreference, systemReduces: boolean) {
  setMediaQuery(SYSTEM_QUERY, systemReduces)
  updatePreferences({ motion: preference })
  applyMotionPreference(readPreferences().motion)
}

// Un aplicador de la preferencia guardada que reacciona a los cambios, como el que
// tendrá el control de preferencia (C6): intenta escribir el valor restablecido.
const followStorage = () =>
  subscribeToPreferences(({ motion }) => applyMotionPreference(motion))

let stop: (() => void) | undefined
afterEach(() => stop?.())

// El hook se actualiza con la notificación de la reacción: dentro de `act`, como en React.
function hold() {
  let release!: ReturnType<typeof holdMotion>
  act(() => {
    release = holdMotion()
  })
  return release
}

const MODES: MotionPreference[] = ['system', 'reduce', 'full']

describe('holdMotion: modo efectivo durante memory-wipe', () => {
  describe.each(MODES)('preferencia inicial «%s»', (preference) => {
    it.each([false, true])(
      'con reduce del sistema = %s mantiene el modo hasta el fin de la confirmación',
      (systemReduces) => {
        const wasReduced = isReducedMotion(preference, systemReduces)
        start(preference, systemReduces)
        stop = followStorage()
        const { result } = renderHook(() => useReducedMotion())
        const release = hold()

        // El borrado efectivo restablece la preferencia guardada...
        clearUserData()
        expect(readPreferences().motion).toBe('system')
        // ...pero la reacción sigue en el modo con el que empezó, en CSS y en JS.
        expect(html().dataset.motion).toBe(wasReduced ? 'reduce' : 'full')
        expect(result.current).toBe(wasReduced)

        // Fin de la confirmación: se aplica la preferencia vigente, que es `system`.
        act(() => release(readPreferences().motion))
        expect(html().dataset.motion).toBeUndefined()
        expect(result.current).toBe(systemReduces)
        // Nada de lo borrado se restaura.
        expect(window.localStorage.length).toBe(0)
        expect(readPreferences().motion).toBe('system')
      },
    )
  })

  it('mantiene el modo aunque el sistema cambie a mitad de la reacción', () => {
    start('full', true)
    const { result } = renderHook(() => useReducedMotion())
    const release = hold()
    // Con `full` y el sistema pidiendo reducir, la reacción ya empezó animada.
    expect(result.current).toBe(false)

    act(() => setMediaQuery(SYSTEM_QUERY, false))
    act(() => setMediaQuery(SYSTEM_QUERY, true))
    expect(result.current).toBe(false)
    expect(html().dataset.motion).toBe('full')

    act(() => release('system'))
    expect(result.current).toBe(true)
  })

  it('interrumpirla aplica lo mismo y repetir el fin no vuelve a escribir', () => {
    start('reduce', false)
    const release = hold()
    clearUserData()

    act(() => release('system'))
    expect(html().dataset.motion).toBeUndefined()

    // Una segunda señal de fin (navegación tras la confirmación) no pisa nada.
    html().dataset.motion = 'full'
    act(() => release('system'))
    expect(html().dataset.motion).toBe('full')
  })

  it('una segunda reacción mientras dura la primera conserva el modo inicial', () => {
    start('reduce', false)
    const first = hold()
    applyMotionPreference('full')
    const second = hold()

    expect(second).toBe(first)
    expect(html().dataset.motion).toBe('reduce')

    act(() => second('system'))
    // Lo pedido durante la reacción (`full`) es lo vigente al terminar.
    expect(html().dataset.motion).toBe('full')
  })

  describe('coordinación con el proveedor de movimiento', () => {
    it('un cambio del valor del proveedor durante la reacción se aplica al terminar', () => {
      const { rerender } = render(
        <MotionPreferenceProvider value="reduce">x</MotionPreferenceProvider>,
      )
      const { result } = renderHook(() => useReducedMotion())
      const release = hold()
      expect(html().dataset.motion).toBe('reduce')

      rerender(
        <MotionPreferenceProvider value="full">x</MotionPreferenceProvider>,
      )
      // El proveedor no sobrescribe la reacción en curso...
      expect(html().dataset.motion).toBe('reduce')
      expect(result.current).toBe(true)

      // ...y lo que pidió es lo vigente al terminar, por encima de lo que diga el llamador.
      act(() => release('system'))
      expect(html().dataset.motion).toBe('full')
    })

    it('desmontar el proveedor durante la reacción no la interrumpe', () => {
      start('reduce', false)
      const { unmount } = render(
        <MotionPreferenceProvider value="reduce">x</MotionPreferenceProvider>,
      )
      const release = hold()

      unmount()
      expect(html().dataset.motion).toBe('reduce')

      act(() => release('system'))
      expect(html().dataset.motion).toBeUndefined()
    })
  })
})
