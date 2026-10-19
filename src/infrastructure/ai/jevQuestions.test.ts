import { describe, expect, it } from 'vitest'
import {
  answerKind,
  AREA_ANSWERS,
  PROFILE_AREAS,
} from '../../domain/partner-profile/partnerProfile'
import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_IDS,
} from '../../domain/analysis/signalCatalog'
import {
  AFFECTED_QUESTIONS,
  INSTRUCTION_VERSION,
  PROFILE_ABOUT,
  PROFILE_PHRASES,
  SAFETY_QUESTION,
  SIGNAL_QUESTIONS,
  SUFFICIENCY_QUESTION,
  allQuestions,
  instructionsText,
} from './jevQuestions'

describe('jevQuestions', () => {
  it('INSTRUCTION_VERSION es una cadena no vacía', () => {
    expect(typeof INSTRUCTION_VERSION).toBe('string')
    expect(INSTRUCTION_VERSION.trim()).not.toBe('')
  })

  describe('cobertura', () => {
    it('cada señal del catálogo tiene su pregunta', () => {
      expect(Object.keys(SIGNAL_QUESTIONS).sort()).toEqual(
        [...SIGNAL_IDS].sort(),
      )
    })

    it('los tres tipos nombrados de persona afectada tienen su pregunta; undetermined no se pregunta', () => {
      const named = AFFECTED_PERSON_TYPES.filter(
        (type) => type !== 'undetermined',
      )

      expect(Object.keys(AFFECTED_QUESTIONS).sort()).toEqual([...named].sort())
    })

    it('hay una pregunta de seguridad y otra de suficiencia', () => {
      expect(SAFETY_QUESTION.instructions).not.toBe('')
      expect(SUFFICIENCY_QUESTION.instructions).not.toBe('')
    })

    it('todas las preguntas tienen instrucciones y criterios para sí y para no', () => {
      for (const question of allQuestions()) {
        expect(question.instructions.trim(), question.key).not.toBe('')
        expect(question.criteria.true.trim(), question.key).not.toBe('')
        expect(question.criteria.false.trim(), question.key).not.toBe('')
      }
    })

    it('las claves de las preguntas no colisionan', () => {
      const keys = allQuestions().map(({ key }) => key)

      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  describe('redacción', () => {
    it('cada pregunta marca sus fronteras con «Not for:» (riesgos del registro §3)', () => {
      for (const question of allQuestions())
        expect(question.instructions, question.key).toContain('Not for:')
    })

    it('nombra los campos del estado y está en inglés', () => {
      for (const question of allQuestions()) {
        expect(question.instructions, question.key).toContain('partnerMessage')
        expect(question.instructions, question.key).not.toMatch(/[áéíóúñ¿¡]/i)
      }
    })

    it('un límite no se convierte en un reto ni una iniciativa pasa por encima de un «no»', () => {
      expect(SIGNAL_QUESTIONS.setting_boundary.instructions).toMatch(
        /romantic challenge/i,
      )
      expect(SIGNAL_QUESTIONS.inviting_initiative.instructions).toMatch(
        /never overrides/i,
      )
    })

    it('la suficiencia no penaliza un mensaje explícito que no da sus motivos', () => {
      expect(SUFFICIENCY_QUESTION.instructions).toMatch(/explicit/i)
      expect(SUFFICIENCY_QUESTION.instructions).toContain(
        "I don't want you to come today",
      )
    })

    it('la seguridad no se decide por palabras sueltas: nombra la hipérbole', () => {
      expect(SAFETY_QUESTION.instructions).toMatch(/hyperbole/i)
      expect(SAFETY_QUESTION.instructions).toMatch(/context/i)
    })

    it('seguridad, personas afectadas y suficiencia nunca mencionan el expediente', () => {
      const withoutProfile = [
        SAFETY_QUESTION,
        SUFFICIENCY_QUESTION,
        ...Object.values(AFFECTED_QUESTIONS),
      ]

      for (const question of withoutProfile)
        expect(instructionsText(question, { withProfile: false })).not.toMatch(
          /reportedTendencies/,
        )
    })
  })

  describe('instructionsText', () => {
    it('incorpora los criterios al texto, porque /v1/decisions solo documenta `instructions`', () => {
      const text = instructionsText(SIGNAL_QUESTIONS.literal_meaning, {
        withProfile: false,
      })

      expect(text).toContain(SIGNAL_QUESTIONS.literal_meaning.instructions)
      expect(text).toContain(SIGNAL_QUESTIONS.literal_meaning.criteria.true)
      expect(text).toContain(SIGNAL_QUESTIONS.literal_meaning.criteria.false)
    })

    it('las lecturas sin expediente no mencionan un campo que no existe', () => {
      for (const id of SIGNAL_IDS)
        expect(
          instructionsText(SIGNAL_QUESTIONS[id], { withProfile: false }),
          id,
        ).not.toMatch(/reportedTendencies/)
    })

    it('las lecturas con expediente nombran el campo y declaran que prevalece la evidencia actual', () => {
      for (const id of SIGNAL_IDS) {
        const text = instructionsText(SIGNAL_QUESTIONS[id], {
          withProfile: true,
        })

        expect(text, id).toContain('reportedTendencies')
        expect(text, id).toMatch(/follow the current evidence/i)
      }
    })
  })

  describe('frases del expediente', () => {
    it('declaran qué es el expediente: impresiones, no hechos', () => {
      expect(PROFILE_ABOUT).toMatch(/impressions, not facts/)
    })

    it('hay una frase en inglés por cada área y cada respuesta concreta', () => {
      for (const area of PROFILE_AREAS) {
        const concrete = AREA_ANSWERS[area].filter(
          (answer) => answerKind(answer) === 'concrete',
        )
        const phrases: Record<string, string> = PROFILE_PHRASES[area]

        expect(Object.keys(phrases).sort(), area).toEqual([...concrete].sort())
        for (const phrase of Object.values(phrases)) {
          expect(phrase.trim(), area).not.toBe('')
          expect(phrase, area).not.toMatch(/[áéíóúñ¿¡]/i)
        }
      }
    })

    it('«Depende» y «No lo sé» no tienen frase: nunca se envían', () => {
      for (const area of PROFILE_AREAS) {
        const phrases: Record<string, string> = PROFILE_PHRASES[area]

        expect(phrases).not.toHaveProperty('depends')
        expect(phrases).not.toHaveProperty('unknown')
      }
    })

    it('las frases son distintas entre sí, también entre áreas', () => {
      const all = PROFILE_AREAS.flatMap((area) =>
        Object.values<string>(PROFILE_PHRASES[area]),
      )

      expect(new Set(all).size).toBe(all.length)
    })
  })
})
