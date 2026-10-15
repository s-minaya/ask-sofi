import { describe, expect, it } from 'vitest'
import {
  EMPTY_PARTNER_PROFILE,
  type PartnerProfile,
} from '../partner-profile/partnerProfile'
import { hasAnswers, selectAuthorizedProfile } from './profileSelection'

const profile = (
  answers: PartnerProfile['answers'],
  notes = '',
): PartnerProfile => ({ answers, notes })

describe('selectAuthorizedProfile', () => {
  it('sin autorización no envía nada, aunque exista un expediente local', () => {
    const local = profile({ directness: 'drops-hints', sarcasm: 'often' })

    expect(selectAuthorizedProfile(local, false)).toEqual({})
  })

  it('autorizado pero sin expediente no envía nada', () => {
    expect(selectAuthorizedProfile(undefined, true)).toEqual({})
    expect(selectAuthorizedProfile(EMPTY_PARTNER_PROFILE, true)).toEqual({})
  })

  it('excluye «No lo sé», «Depende», áreas sin responder y notas', () => {
    const local = profile(
      { directness: 'unknown', sarcasm: 'depends', conflict: 'unknown' },
      'Notas privadas sobre una tercera persona',
    )

    expect(selectAuthorizedProfile(local, true)).toEqual({})
  })

  it('con una respuesta concreta y otra desconocida, envía solo la concreta', () => {
    const local = profile({ sarcasm: 'often', personalSpace: 'unknown' })

    expect(selectAuthorizedProfile(local, true)).toEqual({ sarcasm: 'often' })
  })

  // answerKind() de 004 es la única autoridad: «Cambia según el momento» es concreta.
  it('trata `varies` como respuesta concreta', () => {
    const local = profile({ messageStyle: 'varies', initiative: 'depends' })

    expect(selectAuthorizedProfile(local, true)).toEqual({
      messageStyle: 'varies',
    })
  })

  it('conserva las seis áreas cuando todas son concretas', () => {
    const complete = profile({
      directness: 'says-it-clearly',
      sarcasm: 'rarely',
      conflict: 'talk-later',
      personalSpace: 'usually-yes',
      initiative: 'waits-for-me',
      messageStyle: 'short-direct',
    })

    expect(selectAuthorizedProfile(complete, true)).toEqual(complete.answers)
  })

  it('nunca incluye las notas', () => {
    const local = profile({ sarcasm: 'often' }, 'No debe salir')

    expect(JSON.stringify(selectAuthorizedProfile(local, true))).not.toContain(
      'No debe salir',
    )
  })

  it('no modifica el expediente recibido', () => {
    const local = profile({ sarcasm: 'often', conflict: 'unknown' }, 'n')
    const before = structuredClone(local)

    selectAuthorizedProfile(local, true)

    expect(local).toEqual(before)
  })
})

describe('hasAnswers', () => {
  it('es falso sin respuestas y verdadero con al menos una', () => {
    expect(hasAnswers(undefined)).toBe(false)
    expect(hasAnswers({})).toBe(false)
    expect(hasAnswers({ sarcasm: 'often' })).toBe(true)
  })

  it('no cuenta una clave sin valor', () => {
    expect(hasAnswers({ sarcasm: undefined })).toBe(false)
  })
})
