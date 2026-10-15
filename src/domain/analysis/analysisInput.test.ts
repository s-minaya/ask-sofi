import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INPUT_LIMITS,
  isOmittedContentMarker,
  parseAnalysisInput,
} from './analysisInput'

const issuesOf = (
  raw: unknown,
  limits?: Parameters<typeof parseAnalysisInput>[1],
) => {
  const checked = parseAnalysisInput(raw, limits)
  return checked.ok ? [] : checked.issues
}

describe('parseAnalysisInput', () => {
  it('acepta un mensaje solo', () => {
    expect(parseAnalysisInput({ message: 'Vale.' })).toEqual({
      ok: true,
      input: { message: 'Vale.' },
    })
  })

  it('acepta mensaje, contexto y expediente minimizado, como campos distintos', () => {
    const raw = {
      message: 'Ya veremos',
      context: 'Le propuse ir al cine el sábado.',
      profile: { directness: 'drops-hints', sarcasm: 'often' },
    }

    expect(parseAnalysisInput(raw)).toEqual({ ok: true, input: raw })
  })

  it('conserva el texto tal como llega, sin recortarlo', () => {
    const checked = parseAnalysisInput({ message: '  Vale.  \n' })

    expect(checked).toEqual({ ok: true, input: { message: '  Vale.  \n' } })
  })

  describe('mensaje', () => {
    it('rechaza un mensaje vacío o solo con espacios', () => {
      expect(issuesOf({ message: '' })).toContain('message_empty')
      expect(issuesOf({ message: '   \n\t ' })).toContain('message_empty')
    })

    it('rechaza un mensaje que no es texto o falta', () => {
      expect(issuesOf({})).toEqual(['invalid_shape'])
      expect(issuesOf({ message: 42 })).toEqual(['invalid_shape'])
      expect(issuesOf({ message: null })).toEqual(['invalid_shape'])
    })

    it('rechaza una entrada que no es un objeto', () => {
      expect(issuesOf(null)).toEqual(['invalid_shape'])
      expect(issuesOf('Vale.')).toEqual(['invalid_shape'])
      expect(issuesOf(undefined)).toEqual(['invalid_shape'])
    })

    it('acepta exactamente la longitud máxima y rechaza una más, sin truncar', () => {
      const max = DEFAULT_INPUT_LIMITS.messageMaxLength

      expect(parseAnalysisInput({ message: 'a'.repeat(max) }).ok).toBe(true)

      const over = parseAnalysisInput({ message: 'a'.repeat(max + 1) })
      expect(over).toEqual({ ok: false, issues: ['message_too_long'] })
    })
  })

  describe('contexto', () => {
    it('es opcional', () => {
      const checked = parseAnalysisInput({ message: 'Vale.' })

      expect(checked.ok && 'context' in checked.input).toBe(false)
    })

    it('un contexto en blanco equivale a no tener contexto', () => {
      const checked = parseAnalysisInput({ message: 'Vale.', context: '  \n ' })

      expect(checked).toEqual({ ok: true, input: { message: 'Vale.' } })
    })

    it('rechaza un contexto demasiado largo sin truncarlo', () => {
      const max = DEFAULT_INPUT_LIMITS.contextMaxLength

      expect(
        parseAnalysisInput({ message: 'a', context: 'b'.repeat(max) }).ok,
      ).toBe(true)
      expect(issuesOf({ message: 'a', context: 'b'.repeat(max + 1) })).toEqual([
        'context_too_long',
      ])
    })

    it('rechaza un contexto que no es texto', () => {
      expect(issuesOf({ message: 'a', context: 7 })).toEqual(['invalid_shape'])
    })
  })

  describe('límites configurables', () => {
    it('usa los que se le pasan', () => {
      const limits = { messageMaxLength: 5, contextMaxLength: 3 }

      expect(issuesOf({ message: 'abcdef' }, limits)).toEqual([
        'message_too_long',
      ])
      expect(issuesOf({ message: 'abc', context: 'abcd' }, limits)).toEqual([
        'context_too_long',
      ])
      expect(parseAnalysisInput({ message: 'abcde' }, limits).ok).toBe(true)
    })

    it('informa de todos los problemas de longitud a la vez', () => {
      const limits = { messageMaxLength: 2, contextMaxLength: 2 }

      expect(
        issuesOf({ message: 'abc', context: 'abc' }, limits).sort(),
      ).toEqual(['context_too_long', 'message_too_long'])
    })
  })

  describe('expediente', () => {
    it('acepta un expediente vacío', () => {
      expect(parseAnalysisInput({ message: 'a', profile: {} })).toEqual({
        ok: true,
        input: { message: 'a', profile: {} },
      })
    })

    it('rechaza respuestas que no son concretas: no se filtra en silencio', () => {
      expect(
        issuesOf({ message: 'a', profile: { sarcasm: 'unknown' } }),
      ).toEqual(['profile_not_minimized'])
      expect(
        issuesOf({ message: 'a', profile: { conflict: 'depends' } }),
      ).toEqual(['profile_not_minimized'])
    })

    it('acepta `varies`: answerKind() la clasifica como concreta', () => {
      expect(
        parseAnalysisInput({
          message: 'a',
          profile: { messageStyle: 'varies' },
        }).ok,
      ).toBe(true)
    })

    it('rechaza las notas y cualquier clave que no sea un área', () => {
      expect(
        issuesOf({ message: 'a', profile: { sarcasm: 'often', notes: 'x' } }),
      ).toEqual(['invalid_shape'])
      expect(issuesOf({ message: 'a', profile: { humor: 'often' } })).toEqual([
        'invalid_shape',
      ])
    })

    it('rechaza un valor que no pertenece al área', () => {
      expect(issuesOf({ message: 'a', profile: { sarcasm: 'maybe' } })).toEqual(
        ['invalid_shape'],
      )
      expect(
        issuesOf({ message: 'a', profile: { sarcasm: 'says-it-clearly' } }),
      ).toEqual(['invalid_shape'])
    })

    it('ignora una clave sin valor', () => {
      const checked = parseAnalysisInput({
        message: 'a',
        profile: { sarcasm: undefined, conflict: 'talk-now' },
      })

      expect(checked).toEqual({
        ok: true,
        input: { message: 'a', profile: { conflict: 'talk-now' } },
      })
    })
  })

  it('rechaza claves desconocidas en la entrada', () => {
    expect(issuesOf({ message: 'a', partnerProfile: { notes: 'x' } })).toEqual([
      'invalid_shape',
    ])
  })
})

describe('isOmittedContentMarker', () => {
  it.each([
    'Audio omitido',
    'Imagen omitida',
    'Se eliminó este mensaje',
    'Se elimino este mensaje',
    'Eliminaste este mensaje',
    '<Multimedia omitido>',
    '  Sticker omitido.  ',
    '\u200eaudio omitido',
    'IMAGE OMITTED',
    '<Media omitted>',
    'This message was deleted',
    'vídeo omitido',
  ])('reconoce «%s» como marcador', (message) => {
    expect(isOmittedContentMarker(message)).toBe(true)
  })

  // Solo cuenta el mensaje entero: texto real con una mención no es un marcador.
  it.each([
    'Te mando el audio omitido',
    'Audio omitido, te lo cuento luego',
    'Vale.',
    'imagen',
    '🙃',
    '',
    '   ',
  ])('no trata «%s» como marcador', (message) => {
    expect(isOmittedContentMarker(message)).toBe(false)
  })
})
