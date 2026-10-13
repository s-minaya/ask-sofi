import { describe, expect, it, vi } from 'vitest'
import {
  readConsultationDraft,
  saveConsultationDraft,
} from './consultationDraftStorage'
import {
  isProfileInvitationPending,
  markProfileInvitationPresented,
} from './onboardingStorage'
import {
  deletePartnerProfile,
  readPartnerProfile,
  savePartnerProfile,
} from './partnerProfileStorage'
import { readPreferences, updatePreferences } from './preferencesStorage'
import { localArea } from './storageAreas'
import { LEGACY_THEME_KEY, STORAGE_KEYS } from './storageKeys'
import {
  clearConsultation,
  clearHistory,
  clearUserData,
  subscribeToUserDataCleared,
} from './userData'

const HISTORY_KEY = 'ask-sofi:history:2026-01'

const PROFILE = { answers: { conflict: 'talk-later' as const }, notes: 'Nota' }

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

describe('deletePartnerProfile', () => {
  it('borra solo el expediente', () => {
    seedForeignData()
    window.localStorage.setItem(HISTORY_KEY, '[]')
    updatePreferences({ theme: 'dark', sound: 'on' })
    saveConsultationDraft({ message: 'hola', context: 'ayer' })
    markProfileInvitationPresented()
    savePartnerProfile(PROFILE)

    deletePartnerProfile()

    expect(readPartnerProfile()).toEqual({ status: 'missing' })
    expect(readPreferences()).toEqual({ theme: 'dark', sound: 'on' })
    expect(readConsultationDraft()).toEqual({
      message: 'hola',
      context: 'ayer',
    })
    expect(isProfileInvitationPending()).toBe(false)
    expect(window.localStorage.getItem(HISTORY_KEY)).toBe('[]')
    expectForeignDataIntact()
  })
})

describe('clearUserData', () => {
  it('elimina todos los datos de Ask Sofi y respeta los ajenos', () => {
    seedForeignData()
    window.localStorage.setItem(HISTORY_KEY, '[]')
    window.localStorage.setItem(LEGACY_THEME_KEY, '{"version":1,"data":"dark"}')
    updatePreferences({ theme: 'dark', sound: 'on' })
    saveConsultationDraft({ message: 'hola', context: 'ayer' })
    savePartnerProfile(PROFILE)
    markProfileInvitationPresented()

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

  it('elimina el expediente y vuelve a dejar pendiente la invitación', () => {
    savePartnerProfile(PROFILE)
    markProfileInvitationPresented()

    clearUserData()
    localArea.resetMemory()

    expect(readPartnerProfile()).toEqual({ status: 'missing' })
    expect(isProfileInvitationPending()).toBe(true)
  })

  it('olvida también lo que solo estaba en memoria por no poder guardar', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('bloqueado')
      })
    updatePreferences({ theme: 'dark' })
    saveConsultationDraft({ message: 'secreto', context: '' })
    savePartnerProfile(PROFILE)
    markProfileInvitationPresented()
    expect(readPreferences().theme).toBe('dark')
    expect(readPartnerProfile().status).toBe('ok')
    expect(isProfileInvitationPending()).toBe(false)
    expect(readConsultationDraft().message).toBe('secreto')
    setItem.mockRestore()

    clearUserData()

    expect(readPreferences().theme).toBe('system')
    expect(readConsultationDraft().message).toBe('')
    expect(readPartnerProfile()).toEqual({ status: 'missing' })
    expect(isProfileInvitationPending()).toBe(true)
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
    // Sin el prefijo, el borrado global no los alcanzaría.
    for (const key of Object.values(STORAGE_KEYS))
      expect(key.startsWith('ask-sofi:')).toBe(true)
  })
})
