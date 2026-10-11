import { describe, expect, it, vi } from 'vitest'
import {
  readConsultationDraft,
  saveConsultationDraft,
  subscribeToConsultationDraftCleared,
} from './consultationDraftStorage'
import { STORAGE_KEYS } from './storageKeys'
import { clearConsultation, clearUserData } from './userData'

const stored = () =>
  window.sessionStorage.getItem(STORAGE_KEYS.consultationDraft)

describe('consultationDraftStorage', () => {
  it('empieza vacío', () => {
    expect(readConsultationDraft()).toEqual({ message: '', context: '' })
  })

  it('guarda y recupera el borrador con formato versionado', () => {
    expect(
      saveConsultationDraft({ message: 'vale.', context: 'ayer' }),
    ).toEqual({
      persisted: true,
    })

    expect(JSON.parse(stored() ?? '')).toEqual({
      version: 1,
      data: { message: 'vale.', context: 'ayer' },
    })
    expect(readConsultationDraft()).toEqual({
      message: 'vale.',
      context: 'ayer',
    })
  })

  it('actualiza el borrador existente', () => {
    saveConsultationDraft({ message: 'vale', context: '' })
    saveConsultationDraft({ message: 'vale.', context: 'discutimos' })

    expect(readConsultationDraft()).toEqual({
      message: 'vale.',
      context: 'discutimos',
    })
  })

  it('no toca localStorage: el borrador es temporal', () => {
    saveConsultationDraft({ message: 'vale', context: 'ayer' })

    expect(window.localStorage.length).toBe(0)
  })

  it('un borrador vacío no deja rastro', () => {
    saveConsultationDraft({ message: 'vale', context: '' })
    saveConsultationDraft({ message: '', context: '' })

    expect(stored()).toBeNull()
  })

  it.each([
    ['JSON roto', '{roto'],
    [
      'campos de otro tipo',
      JSON.stringify({ version: 1, data: { message: 3 } }),
    ],
    ['versión incompatible', JSON.stringify({ version: 9, data: {} })],
  ])('ignora datos no válidos: %s', (_case, raw) => {
    window.sessionStorage.setItem(STORAGE_KEYS.consultationDraft, raw)

    expect(readConsultationDraft()).toEqual({ message: '', context: '' })
  })

  it('conserva el borrador en memoria si sessionStorage no deja escribir', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('lleno', 'QuotaExceededError')
      })

    const result = saveConsultationDraft({ message: 'vale', context: '' })

    expect(result).toEqual({ persisted: false, reason: 'quota' })
    expect(readConsultationDraft().message).toBe('vale')
    setItem.mockRestore()
  })

  it('no vuelca el contenido privado a la consola cuando falla', () => {
    const consoleSpies = (
      ['log', 'info', 'warn', 'error', 'debug'] as const
    ).map((method) => vi.spyOn(console, method).mockImplementation(() => {}))
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('lleno', 'QuotaExceededError')
      })

    saveConsultationDraft({ message: 'texto privado', context: 'más privado' })
    readConsultationDraft()

    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled()
    setItem.mockRestore()
    consoleSpies.forEach((spy) => spy.mockRestore())
  })

  it('avisa de los borrados de la consulta y de los completos', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToConsultationDraftCleared(listener)

    clearConsultation()
    clearUserData()
    unsubscribe()
    clearConsultation()

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
