import { describe, expect, it } from 'vitest'
import {
  AREA_ANSWERS,
  answerKind,
  clearAnswer,
  EMPTY_PARTNER_PROFILE,
  isProfileComplete,
  isProfileEmpty,
  NOTES_MAX_LENGTH,
  PROFILE_AREAS,
  prepareProfileForSave,
  setAnswer,
  setNotes,
  type PartnerProfile,
} from './partnerProfile'

describe('partnerProfile', () => {
  it('tiene las seis áreas de comunicación, en el orden de la ficha', () => {
    expect(PROFILE_AREAS).toEqual([
      'directness',
      'sarcasm',
      'conflict',
      'personalSpace',
      'initiative',
      'messageStyle',
    ])
  })

  // Los valores se guardan: no pueden depender del texto que se muestra.
  it('cada área ofrece sus respuestas con valores estables', () => {
    expect(AREA_ANSWERS).toEqual({
      directness: ['says-it-clearly', 'drops-hints', 'depends', 'unknown'],
      sarcasm: ['often', 'sometimes', 'rarely', 'depends', 'unknown'],
      conflict: ['talk-now', 'talk-later', 'depends', 'unknown'],
      personalSpace: ['usually-yes', 'usually-no', 'depends', 'unknown'],
      initiative: [
        'proposes-alternatives',
        'waits-for-me',
        'depends',
        'unknown',
      ],
      messageStyle: ['short-direct', 'long-expressive', 'varies', 'unknown'],
    })
  })

  it('empieza vacío: ninguna respuesta y sin notas', () => {
    expect(EMPTY_PARTNER_PROFILE).toEqual({ answers: {}, notes: '' })
    for (const area of PROFILE_AREAS)
      expect(EMPTY_PARTNER_PROFILE.answers[area]).toBeUndefined()
  })

  describe('respuestas', () => {
    it('se responden en cualquier orden sin tocar las demás', () => {
      const profile = setAnswer(
        setAnswer(EMPTY_PARTNER_PROFILE, 'messageStyle', 'short-direct'),
        'directness',
        'drops-hints',
      )

      expect(profile.answers).toEqual({
        messageStyle: 'short-direct',
        directness: 'drops-hints',
      })
    })

    it('se modifican sustituyendo la anterior', () => {
      const profile = setAnswer(
        setAnswer(EMPTY_PARTNER_PROFILE, 'sarcasm', 'often'),
        'sarcasm',
        'rarely',
      )

      expect(profile.answers.sarcasm).toBe('rarely')
    })

    it('se quitan: la pregunta vuelve a quedar sin responder', () => {
      const answered = setAnswer(
        setAnswer(EMPTY_PARTNER_PROFILE, 'conflict', 'talk-later'),
        'initiative',
        'waits-for-me',
      )

      const profile = clearAnswer(answered, 'conflict')

      expect(profile.answers).toEqual({ initiative: 'waits-for-me' })
      expect(answerKind(profile.answers.conflict)).toBe('unanswered')
    })

    it('no modifican el perfil original', () => {
      const original = setAnswer(EMPTY_PARTNER_PROFILE, 'sarcasm', 'often')

      setAnswer(original, 'sarcasm', 'rarely')
      clearAnswer(original, 'sarcasm')
      setNotes(original, 'Otra nota')

      expect(original).toEqual({ answers: { sarcasm: 'often' }, notes: '' })
      expect(EMPTY_PARTNER_PROFILE).toEqual({ answers: {}, notes: '' })
    })
  })

  describe('estados de una respuesta', () => {
    it('distingue sin responder, «No lo sé», «Depende» y una respuesta concreta', () => {
      expect(answerKind(undefined)).toBe('unanswered')
      expect(answerKind('unknown')).toBe('unknown')
      expect(answerKind('depends')).toBe('conditional')
      expect(answerKind('says-it-clearly')).toBe('concrete')
    })

    // La spec solo trata como incertidumbre «Depende» y «No lo sé».
    it('«Cambia bastante según el momento» es una respuesta concreta', () => {
      expect(answerKind('varies')).toBe('concrete')
    })

    it('todas las demás respuestas son concretas', () => {
      for (const area of PROFILE_AREAS)
        for (const answer of AREA_ANSWERS[area])
          if (answer !== 'depends' && answer !== 'unknown')
            expect(answerKind(answer)).toBe('concrete')
    })
  })

  describe('expediente vacío', () => {
    it('está vacío sin respuestas ni notas', () => {
      expect(isProfileEmpty(EMPTY_PARTNER_PROFILE)).toBe(true)
    })

    it('unas notas solo con espacios no cuentan', () => {
      expect(isProfileEmpty(setNotes(EMPTY_PARTNER_PROFILE, '  \n\t '))).toBe(
        true,
      )
    })

    it('una sola respuesta basta, aunque sea «No lo sé»', () => {
      expect(
        isProfileEmpty(setAnswer(EMPTY_PARTNER_PROFILE, 'conflict', 'unknown')),
      ).toBe(false)
    })

    it('una nota basta', () => {
      expect(
        isProfileEmpty(setNotes(EMPTY_PARTNER_PROFILE, 'Usa muchos emojis')),
      ).toBe(false)
    })

    it('al quitar la única respuesta vuelve a estar vacío', () => {
      const profile = clearAnswer(
        setAnswer(EMPTY_PARTNER_PROFILE, 'sarcasm', 'often'),
        'sarcasm',
      )

      expect(isProfileEmpty(profile)).toBe(true)
    })
  })

  describe('expediente completo', () => {
    const answered = (areas: readonly (typeof PROFILE_AREAS)[number][]) =>
      areas.reduce<PartnerProfile>(
        (profile, area) => setAnswer(profile, area, 'unknown'),
        EMPTY_PARTNER_PROFILE,
      )

    it('no lo está sin respuestas ni con solo notas', () => {
      expect(isProfileComplete(EMPTY_PARTNER_PROFILE)).toBe(false)
      expect(
        isProfileComplete(setNotes(EMPTY_PARTNER_PROFILE, 'Usa muchos emojis')),
      ).toBe(false)
    })

    it('no lo está con cinco de las seis áreas', () => {
      expect(isProfileComplete(answered(PROFILE_AREAS.slice(0, 5)))).toBe(false)
    })

    // «No lo sé» es una respuesta: las seis áreas son opcionales, pero completa
    // es completa aunque ninguna sea concreta.
    it('lo está con las seis, sean cuales sean sus respuestas', () => {
      expect(isProfileComplete(answered(PROFILE_AREAS))).toBe(true)
    })

    it('al quitar una respuesta deja de estarlo', () => {
      expect(
        isProfileComplete(clearAnswer(answered(PROFILE_AREAS), 'conflict')),
      ).toBe(false)
    })
  })

  describe('preparar para guardar', () => {
    it('rechaza un expediente vacío', () => {
      expect(
        prepareProfileForSave(setNotes(EMPTY_PARTNER_PROFILE, '   ')),
      ).toEqual({ ok: false, error: 'empty' })
    })

    it('acepta un expediente parcial y recorta los espacios de las notas', () => {
      const draft: PartnerProfile = {
        answers: { personalSpace: 'usually-yes' },
        notes: '  Contesta tarde los lunes  ',
      }

      expect(prepareProfileForSave(draft)).toEqual({
        ok: true,
        profile: {
          answers: { personalSpace: 'usually-yes' },
          notes: 'Contesta tarde los lunes',
        },
      })
    })

    it(`limita las notas a ${NOTES_MAX_LENGTH} caracteres`, () => {
      expect(NOTES_MAX_LENGTH).toBe(500)
      const atLimit = setNotes(EMPTY_PARTNER_PROFILE, 'a'.repeat(500))
      const overLimit = setNotes(EMPTY_PARTNER_PROFILE, 'a'.repeat(501))

      expect(prepareProfileForSave(atLimit).ok).toBe(true)
      expect(prepareProfileForSave(overLimit)).toEqual({
        ok: false,
        error: 'notes-too-long',
      })
    })

    // Lo que se valida es lo que se guarda: los espacios recortados no cuentan.
    it('mide la longitud después de recortar', () => {
      const draft = setNotes(EMPTY_PARTNER_PROFILE, ` ${'a'.repeat(500)} `)

      expect(prepareProfileForSave(draft).ok).toBe(true)
    })
  })
})
