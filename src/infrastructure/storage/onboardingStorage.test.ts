import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isProfileInvitationPending,
  markProfileInvitationPresented,
} from './onboardingStorage'
import {
  deletePartnerProfile,
  savePartnerProfile,
} from './partnerProfileStorage'
import { localArea } from './storageAreas'
import { STORAGE_KEYS } from './storageKeys'
import { clearUserData } from './userData'

const KEY = STORAGE_KEYS.onboarding
const reload = () => localArea.resetMemory()

afterEach(() => {
  vi.restoreAllMocks()
})

describe('onboardingStorage', () => {
  it('en la primera visita la invitación está pendiente', () => {
    expect(isProfileInvitationPending()).toBe(true)
  })

  it('una vez presentada, no vuelve a estar pendiente tras recargar', () => {
    expect(markProfileInvitationPresented()).toEqual({ persisted: true })
    reload()

    expect(isProfileInvitationPending()).toBe(false)
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '')).toEqual({
      version: 1,
      data: { profileInvitationPresented: true },
    })
  })

  it('crear y eliminar el expediente no la vuelve a mostrar', () => {
    markProfileInvitationPresented()
    savePartnerProfile({ answers: { sarcasm: 'often' }, notes: '' })

    deletePartnerProfile()
    reload()

    expect(isProfileInvitationPending()).toBe(false)
  })

  it('el borrado global la deja pendiente de nuevo', () => {
    markProfileInvitationPresented()

    clearUserData()
    reload()

    expect(isProfileInvitationPending()).toBe(true)
  })

  // Solo se registra después de presentarla: si existe, aunque no se entienda,
  // ya se presentó. Volver a mostrarla incumpliría «solo una vez».
  describe('datos que no se pueden leer', () => {
    it.each([
      ['JSON roto', '{roto'],
      ['otra forma', JSON.stringify({ version: 1, data: 'sí' })],
      ['versión posterior', JSON.stringify({ version: 2, data: {} })],
    ])('%s: se considera presentada', (_, raw) => {
      window.localStorage.setItem(KEY, raw)

      expect(isProfileInvitationPending()).toBe(false)
    })

    it('un campo no válido se considera presentado', () => {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ version: 1, data: { profileInvitationPresented: 3 } }),
      )

      expect(isProfileInvitationPending()).toBe(false)
    })

    it('no sobrescribe los datos de una versión posterior', () => {
      const future = JSON.stringify({ version: 2, data: { pasos: [] } })
      window.localStorage.setItem(KEY, future)

      expect(markProfileInvitationPresented()).toEqual({
        persisted: false,
        reason: 'newer-version',
      })
      expect(window.localStorage.getItem(KEY)).toBe(future)
    })
  })

  describe('almacenamiento que falla', () => {
    it('no se repite en la sesión, aunque no se haya podido guardar', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })

      expect(markProfileInvitationPresented()).toEqual({
        persisted: false,
        reason: 'error',
      })
      expect(isProfileInvitationPending()).toBe(false)
    })

    // Límite conocido: sin almacenamiento no hay forma de recordarlo entre visitas.
    it('tras recargar sin haberlo guardado vuelve a estar pendiente', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })
      markProfileInvitationPresented()

      reload()

      expect(isProfileInvitationPending()).toBe(true)
    })
  })
})
