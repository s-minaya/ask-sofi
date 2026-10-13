import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PartnerProfile } from '../../domain/partner-profile/partnerProfile'
import {
  deletePartnerProfile,
  readPartnerProfile,
  savePartnerProfile,
  subscribeToPartnerProfile,
} from './partnerProfileStorage'
import { localArea } from './storageAreas'
import { STORAGE_KEYS } from './storageKeys'
import { clearConsultation, clearUserData } from './userData'

const KEY = STORAGE_KEYS.partnerProfile
const stored = () => window.localStorage.getItem(KEY)
const store = (value: unknown) =>
  window.localStorage.setItem(KEY, JSON.stringify(value))

// Una recarga solo conserva lo que llegó al almacenamiento.
const reload = () => localArea.resetMemory()

const PROFILE: PartnerProfile = {
  answers: { directness: 'drops-hints', messageStyle: 'varies' },
  notes: 'Contesta tarde los lunes',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('partnerProfileStorage', () => {
  it('no hay expediente al empezar', () => {
    expect(readPartnerProfile()).toEqual({ status: 'missing' })
  })

  describe('guardar', () => {
    it('crea el expediente con formato versionado en localStorage', () => {
      expect(savePartnerProfile(PROFILE)).toEqual({
        status: 'saved',
        profile: PROFILE,
      })

      expect(JSON.parse(stored() ?? '')).toEqual({ version: 1, data: PROFILE })
      expect(window.sessionStorage.length).toBe(0)
    })

    it('se recupera tras recargar', () => {
      savePartnerProfile(PROFILE)
      reload()

      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })
    })

    it('actualiza el expediente existente: solo hay uno', () => {
      savePartnerProfile(PROFILE)
      const edited: PartnerProfile = {
        answers: { sarcasm: 'often' },
        notes: '',
      }

      savePartnerProfile(edited)
      reload()

      expect(readPartnerProfile()).toEqual({ status: 'ok', value: edited })
    })

    it('guarda las notas sin espacios sobrantes y devuelve lo guardado', () => {
      const result = savePartnerProfile({ answers: {}, notes: '  Usa emojis ' })

      expect(result).toEqual({
        status: 'saved',
        profile: { answers: {}, notes: 'Usa emojis' },
      })
    })

    it('rechaza un expediente vacío sin tocar el guardado', () => {
      savePartnerProfile(PROFILE)

      expect(savePartnerProfile({ answers: {}, notes: '   ' })).toEqual({
        status: 'rejected',
        error: 'empty',
      })
      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })
    })

    it('rechaza unas notas demasiado largas', () => {
      expect(
        savePartnerProfile({ answers: {}, notes: 'a'.repeat(501) }),
      ).toEqual({ status: 'rejected', error: 'notes-too-long' })
      expect(stored()).toBeNull()
    })
  })

  describe('almacenamiento que falla', () => {
    it.each([
      ['bloqueado', new Error('bloqueado'), 'error'],
      ['sin espacio', new DOMException('lleno', 'QuotaExceededError'), 'quota'],
    ])('%s: lo guardado solo vive en memoria y se dice', (_, error, reason) => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw error
      })

      expect(savePartnerProfile(PROFILE)).toEqual({
        status: 'memory-only',
        reason,
        profile: PROFILE,
      })
      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })

      reload()
      expect(readPartnerProfile()).toEqual({ status: 'missing' })
    })

    it('sin acceso al almacenamiento, el expediente sigue disponible en la sesión', () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('denegado', 'SecurityError')
      })

      expect(savePartnerProfile(PROFILE)).toMatchObject({
        status: 'memory-only',
        reason: 'unavailable',
      })
      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })
    })
  })

  describe('datos guardados no válidos', () => {
    it.each([
      ['JSON roto', '{roto'],
      ['sin sobre de versión', JSON.stringify(PROFILE)],
      [
        'sin la forma de un expediente',
        JSON.stringify({ version: 1, data: 7 }),
      ],
      [
        'versión anterior sin migración',
        JSON.stringify({ version: 0, data: PROFILE }),
      ],
    ])('%s: nunca se utilizan', (_, raw) => {
      window.localStorage.setItem(KEY, raw)

      expect(readPartnerProfile()).toEqual({ status: 'invalid' })
    })

    it('un expediente nuevo sustituye a los datos no válidos', () => {
      window.localStorage.setItem(KEY, '{roto')

      expect(savePartnerProfile(PROFILE).status).toBe('saved')
      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })
    })

    it('una respuesta desconocida deja su área sin responder', () => {
      store({
        version: 1,
        data: {
          answers: { sarcasm: 'siempre', conflict: 'talk-now' },
          notes: '',
        },
      })

      expect(readPartnerProfile()).toEqual({
        status: 'ok',
        value: { answers: { conflict: 'talk-now' }, notes: '' },
      })
    })
  })

  describe('versión posterior de la aplicación', () => {
    const future = { version: 2, data: { formato: 'nuevo' } }

    it('no se interpreta', () => {
      store(future)

      expect(readPartnerProfile()).toEqual({
        status: 'newer-version',
        version: 2,
      })
    })

    it('no se sobrescribe: el guardado de esta sesión queda en memoria', () => {
      store(future)

      expect(savePartnerProfile(PROFILE)).toEqual({
        status: 'memory-only',
        reason: 'newer-version',
        profile: PROFILE,
      })
      expect(readPartnerProfile()).toEqual({ status: 'ok', value: PROFILE })

      reload()
      expect(JSON.parse(stored() ?? '')).toEqual(future)
    })
  })

  describe('eliminar', () => {
    it('borra el expediente también tras recargar', () => {
      savePartnerProfile(PROFILE)

      deletePartnerProfile()
      reload()

      expect(readPartnerProfile()).toEqual({ status: 'missing' })
      expect(stored()).toBeNull()
    })

    it('olvida también la copia que solo estaba en memoria', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })
      savePartnerProfile(PROFILE)

      deletePartnerProfile()

      expect(readPartnerProfile()).toEqual({ status: 'missing' })
    })

    it('no falla si no hay expediente', () => {
      expect(() => deletePartnerProfile()).not.toThrow()
    })
  })

  describe('avisos', () => {
    it('avisa al guardar, eliminar y borrar todos los datos', () => {
      const listener = vi.fn()
      const unsubscribe = subscribeToPartnerProfile(listener)

      savePartnerProfile(PROFILE)
      expect(listener).toHaveBeenCalledTimes(1)
      deletePartnerProfile()
      expect(listener).toHaveBeenCalledTimes(2)
      clearUserData()
      expect(listener).toHaveBeenCalledTimes(3)

      unsubscribe()
      savePartnerProfile(PROFILE)
      expect(listener).toHaveBeenCalledTimes(3)
    })

    it('no avisa por cambios ajenos ni por un guardado rechazado', () => {
      const listener = vi.fn()
      subscribeToPartnerProfile(listener)

      clearConsultation()
      savePartnerProfile({ answers: {}, notes: '' })

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
