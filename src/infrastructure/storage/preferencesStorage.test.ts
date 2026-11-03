import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  subscribeToPreferences,
  updatePreferences,
} from './preferencesStorage'
import { emitStorageChange } from './storageEvents'
import { LEGACY_THEME_KEY, STORAGE_KEYS } from './storageKeys'

const stored = () => window.localStorage.getItem(STORAGE_KEYS.preferences)

function store(value: unknown) {
  window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(value))
}

describe('preferencesStorage', () => {
  it('empieza con los valores por defecto: tema y movimiento del sistema y sin sonido', () => {
    const defaults = { theme: 'system', sound: 'off', motion: 'system' }
    expect(readPreferences()).toEqual(defaults)
    expect(DEFAULT_PREFERENCES).toEqual(defaults)
  })

  it('guarda con formato versionado y recupera', () => {
    updatePreferences({ theme: 'dark' })
    updatePreferences({ sound: 'on' })

    expect(JSON.parse(stored() ?? '')).toEqual({
      version: 1,
      data: { theme: 'dark', sound: 'on', motion: 'system' },
    })
    expect(readPreferences()).toEqual({
      theme: 'dark',
      sound: 'on',
      motion: 'system',
    })
    // Las preferencias son persistentes: nunca viven en sessionStorage.
    expect(window.sessionStorage.length).toBe(0)
  })

  it('un cambio no pierde las demás preferencias', () => {
    store({ version: 1, data: { theme: 'light', sound: 'on' } })

    updatePreferences({ theme: 'dark' })

    expect(readPreferences()).toEqual({
      theme: 'dark',
      sound: 'on',
      motion: 'system',
    })
  })

  describe('movimiento (plan 008 §4.1)', () => {
    it.each(['system', 'reduce', 'full'] as const)(
      'guarda y recupera «%s» sin cambiar de versión',
      (motion) => {
        updatePreferences({ motion })

        expect(JSON.parse(stored() ?? '').version).toBe(1)
        expect(readPreferences().motion).toBe(motion)
      },
    )

    it('un registro anterior sin movimiento lo lee como «system»', () => {
      store({ version: 1, data: { theme: 'dark', sound: 'on' } })

      expect(readPreferences()).toEqual({
        theme: 'dark',
        sound: 'on',
        motion: 'system',
      })
    })

    it.each([
      ['desconocido', 'turbo'],
      ['de otro tipo', 3],
      ['nulo', null],
    ])('un valor %s vuelve a «system» y conserva el resto', (_case, motion) => {
      store({
        version: 1,
        data: { theme: 'dark', sound: 'on', motion },
      })

      expect(readPreferences()).toEqual({
        theme: 'dark',
        sound: 'on',
        motion: 'system',
      })
    })

    it('cambiar el movimiento no pierde el tema ni el sonido', () => {
      store({ version: 1, data: { theme: 'light', sound: 'on' } })

      updatePreferences({ motion: 'reduce' })

      expect(readPreferences()).toEqual({
        theme: 'light',
        sound: 'on',
        motion: 'reduce',
      })
    })
  })

  describe('datos de la feature 002', () => {
    const legacy = (data: unknown, version = 1) =>
      window.localStorage.setItem(
        LEGACY_THEME_KEY,
        JSON.stringify({ version, data }),
      )

    it.each(['light', 'dark', 'system'])(
      'recupera el tema «%s» ya guardado',
      (theme) => {
        legacy(theme)

        expect(readPreferences()).toEqual({
          theme,
          sound: 'off',
          motion: 'system',
        })
      },
    )

    it('lo migra al formato nuevo en el siguiente guardado, sin perder el tema', () => {
      legacy('dark')

      updatePreferences({ sound: 'on' })

      expect(JSON.parse(stored() ?? '')).toEqual({
        version: 1,
        data: { theme: 'dark', sound: 'on', motion: 'system' },
      })
      expect(window.localStorage.getItem(LEGACY_THEME_KEY)).toBeNull()
    })

    it('el formato nuevo tiene prioridad sobre el antiguo', () => {
      legacy('dark')
      store({ version: 1, data: { theme: 'light', sound: 'off' } })

      expect(readPreferences().theme).toBe('light')
    })

    it.each([
      ['valor desconocido', 'sepia', 1],
      ['versión incompatible', 'dark', 2],
    ])('ignora datos antiguos no válidos: %s', (_case, data, version) => {
      legacy(data, version)

      expect(readPreferences()).toEqual(DEFAULT_PREFERENCES)
    })
  })

  it.each([
    ['JSON roto', '{oscuro'],
    ['texto plano', 'dark'],
    ['sin envoltorio', JSON.stringify({ theme: 'dark', sound: 'on' })],
    [
      'datos que no son un objeto',
      JSON.stringify({ version: 1, data: 'dark' }),
    ],
  ])('usa los valores por defecto ante datos no válidos: %s', (_case, raw) => {
    window.localStorage.setItem(STORAGE_KEYS.preferences, raw)

    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('conserva los campos válidos cuando otro es inválido', () => {
    store({ version: 1, data: { theme: 'dark', sound: 'a todo volumen' } })

    expect(readPreferences()).toEqual({
      theme: 'dark',
      sound: 'off',
      motion: 'system',
    })
  })

  it('no pisa datos de una versión futura, pero la sesión sigue funcionando', () => {
    const future = JSON.stringify({ version: 2, data: { tema: 'oscuro' } })
    window.localStorage.setItem(STORAGE_KEYS.preferences, future)

    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES)
    expect(updatePreferences({ theme: 'dark' })).toEqual({
      persisted: false,
      reason: 'newer-version',
    })

    expect(stored()).toBe(future)
    expect(readPreferences().theme).toBe('dark')
  })

  it('sigue funcionando en memoria si el almacenamiento está bloqueado', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })

    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES)
    expect(updatePreferences({ theme: 'light' }).persisted).toBe(false)
    expect(readPreferences().theme).toBe('light')

    getItem.mockRestore()
    setItem.mockRestore()
  })

  describe('suscripción', () => {
    it('avisa de los cambios hechos desde otro documento', () => {
      const listener = vi.fn()
      const unsubscribe = subscribeToPreferences(listener)
      store({ version: 1, data: { theme: 'light', sound: 'off' } })

      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEYS.preferences }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'otra-clave', newValue: 'x' }),
      )
      unsubscribe()
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEYS.preferences }),
      )

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith({
        theme: 'light',
        sound: 'off',
        motion: 'system',
      })
    })

    it('avisa de los cambios y borrados del propio documento', () => {
      const listener = vi.fn()
      const unsubscribe = subscribeToPreferences(listener)

      updatePreferences({ theme: 'dark' })
      expect(listener).toHaveBeenLastCalledWith({
        theme: 'dark',
        sound: 'off',
        motion: 'system',
      })

      window.localStorage.clear()
      emitStorageChange('all')
      expect(listener).toHaveBeenLastCalledWith(DEFAULT_PREFERENCES)

      listener.mockClear()
      emitStorageChange('consultation')
      expect(listener).not.toHaveBeenCalled()
      unsubscribe()
    })
  })
})
