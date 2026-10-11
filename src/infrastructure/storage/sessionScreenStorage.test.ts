import { describe, expect, it, vi } from 'vitest'
import { readSessionScreen, saveSessionScreen } from './sessionScreenStorage'
import { STORAGE_KEYS } from './storageKeys'

const stored = () => window.sessionStorage.getItem(STORAGE_KEYS.sessionScreen)

describe('sessionScreenStorage', () => {
  it('empieza en la portada', () => {
    expect(readSessionScreen()).toBe('landing')
  })

  it('guarda y recupera la consulta como pantalla activa', () => {
    saveSessionScreen('consultation')

    expect(JSON.parse(stored() ?? '')).toEqual({
      version: 1,
      data: 'consultation',
    })
    expect(readSessionScreen()).toBe('consultation')
  })

  it('la portada no deja rastro', () => {
    saveSessionScreen('consultation')
    saveSessionScreen('landing')

    expect(stored()).toBeNull()
    expect(readSessionScreen()).toBe('landing')
  })

  it('vive solo en sessionStorage', () => {
    saveSessionScreen('consultation')

    expect(window.localStorage.length).toBe(0)
  })

  it.each([
    ['JSON roto', '{roto'],
    ['pantalla desconocida', JSON.stringify({ version: 1, data: 'ajustes' })],
    [
      'versión incompatible',
      JSON.stringify({ version: 4, data: 'consultation' }),
    ],
  ])('ignora datos no válidos: %s', (_case, raw) => {
    window.sessionStorage.setItem(STORAGE_KEYS.sessionScreen, raw)

    expect(readSessionScreen()).toBe('landing')
  })

  it('no lanza con el almacenamiento bloqueado y lo mantiene en memoria', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })

    expect(() => saveSessionScreen('consultation')).not.toThrow()
    expect(readSessionScreen()).toBe('consultation')
    setItem.mockRestore()
  })
})
