import { describe, expect, it, vi } from 'vitest'
import {
  parseThemePreference,
  readThemePreference,
  saveThemePreference,
  subscribeToThemePreference,
  THEME_STORAGE_KEY,
} from './themePreferenceStorage'

describe('themePreferenceStorage', () => {
  it('empieza en «system» cuando no hay nada guardado', () => {
    expect(readThemePreference()).toBe('system')
  })

  it('guarda la preferencia con versión y la recupera', () => {
    saveThemePreference('dark')

    expect(
      JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? ''),
    ).toEqual({
      version: 1,
      data: 'dark',
    })
    expect(readThemePreference()).toBe('dark')
  })

  it.each([
    ['JSON roto', '{oscuro'],
    ['valor desconocido', JSON.stringify({ version: 1, data: 'sepia' })],
    ['versión incompatible', JSON.stringify({ version: 2, data: 'dark' })],
    ['texto plano', 'dark'],
  ])('ignora datos no válidos: %s', (_case, raw) => {
    expect(parseThemePreference(raw)).toBe('system')
  })

  it('no rompe la aplicación si el almacenamiento no está disponible', () => {
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

    expect(readThemePreference()).toBe('system')
    expect(() => saveThemePreference('light')).not.toThrow()

    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('avisa de los cambios hechos desde otro documento', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToThemePreference(listener)

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: JSON.stringify({ version: 1, data: 'light' }),
      }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'otra-clave', newValue: 'x' }),
    )
    unsubscribe()
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: JSON.stringify({ version: 1, data: 'dark' }),
      }),
    )

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('light')
  })
})
