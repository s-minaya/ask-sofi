import { describe, expect, it, vi } from 'vitest'
import {
  readConsultationDraft,
  saveConsultationDraft,
} from './consultationDraftStorage'
import { readPreferences, updatePreferences } from './preferencesStorage'
import { LEGACY_THEME_KEY, STORAGE_KEYS } from './storageKeys'
import {
  clearConsultation,
  clearHistory,
  clearUserData,
  subscribeToUserDataCleared,
} from './userData'

const HISTORY_KEY = 'ask-sofi:history:2026-01'

// Datos de otras aplicaciones del mismo origen: no deben tocarse nunca.
function seedForeignData() {
  window.localStorage.setItem('otra-app:tema', 'oscuro')
  window.localStorage.setItem('ask-sofi', 'sin dos puntos')
  window.localStorage.setItem('mi-ask-sofi:x', 'prefijo parecido')
  window.sessionStorage.setItem('otra-app:sesion', '1')
}

function expectForeignDataIntact() {
  expect(window.localStorage.getItem('otra-app:tema')).toBe('oscuro')
  expect(window.localStorage.getItem('ask-sofi')).toBe('sin dos puntos')
  expect(window.localStorage.getItem('mi-ask-sofi:x')).toBe('prefijo parecido')
  expect(window.sessionStorage.getItem('otra-app:sesion')).toBe('1')
}

describe('clearConsultation', () => {
  it('borra solo el estado temporal de la consulta', () => {
    seedForeignData()
    updatePreferences({ theme: 'dark' })
    saveConsultationDraft({ message: 'hola', context: 'ayer' })

    clearConsultation()

    expect(readConsultationDraft()).toEqual({ message: '', context: '' })
    expect(readPreferences().theme).toBe('dark')
    expectForeignDataIntact()
  })
})

describe('clearHistory', () => {
  it('borra solo las claves de historial de Ask Sofi', () => {
    seedForeignData()
    window.localStorage.setItem(HISTORY_KEY, '[]')
    window.localStorage.setItem('ask-sofi:history', '[]')
    window.localStorage.setItem('otra-app:history', '[]')
    updatePreferences({ theme: 'dark' })
    saveConsultationDraft({ message: 'hola', context: '' })

    clearHistory()

    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull()
    expect(window.localStorage.getItem('ask-sofi:history')).toBeNull()
    expect(window.localStorage.getItem('otra-app:history')).toBe('[]')
    expect(readPreferences().theme).toBe('dark')
    expect(readConsultationDraft().message).toBe('hola')
    expectForeignDataIntact()
  })

  it('no falla cuando no hay historial', () => {
    expect(() => clearHistory()).not.toThrow()
  })
})

describe('clearUserData', () => {
  it('elimina todos los datos de Ask Sofi y respeta los ajenos', () => {
    seedForeignData()
    window.localStorage.setItem(HISTORY_KEY, '[]')
    window.localStorage.setItem(LEGACY_THEME_KEY, '{"version":1,"data":"dark"}')
    updatePreferences({ theme: 'dark', sound: 'on' })
    saveConsultationDraft({ message: 'hola', context: 'ayer' })

    clearUserData()

    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (let index = 0; index < storage.length; index++) {
        expect(storage.key(index)).not.toMatch(/^ask-sofi:/)
      }
    }
    expectForeignDataIntact()
  })

  it('devuelve un estado inicial coherente', () => {
    updatePreferences({ theme: 'dark', sound: 'on' })
    saveConsultationDraft({ message: 'hola', context: 'ayer' })

    clearUserData()

    expect(readPreferences()).toEqual({ theme: 'system', sound: 'off' })
    expect(readConsultationDraft()).toEqual({ message: '', context: '' })
  })

  it('olvida también lo que solo estaba en memoria por no poder guardar', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    updatePreferences({ theme: 'dark' })
    saveConsultationDraft({ message: 'secreto', context: '' })
    expect(readPreferences().theme).toBe('dark')
    expect(readConsultationDraft().message).toBe('secreto')
    setItem.mockRestore()

    clearUserData()

    expect(readPreferences().theme).toBe('system')
    expect(readConsultationDraft().message).toBe('')
  })

  it('avisa al resto de la aplicación', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToUserDataCleared(listener)

    clearConsultation()
    expect(listener).not.toHaveBeenCalled()
    clearUserData()
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    clearUserData()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('usa claves con el namespace declarado', () => {
    expect(STORAGE_KEYS.preferences.startsWith('ask-sofi:')).toBe(true)
    expect(STORAGE_KEYS.consultationDraft.startsWith('ask-sofi:')).toBe(true)
  })
})
