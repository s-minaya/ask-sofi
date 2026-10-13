import { describe, expect, it } from 'vitest'
import { partnerProfileSchema } from './partnerProfileSchema'

const parse = (data: unknown) => partnerProfileSchema.safeParse(data)

describe('partnerProfileSchema', () => {
  it('acepta un expediente completo', () => {
    const profile = {
      answers: {
        directness: 'says-it-clearly',
        sarcasm: 'sometimes',
        conflict: 'talk-now',
        personalSpace: 'usually-no',
        initiative: 'proposes-alternatives',
        messageStyle: 'long-expressive',
      },
      notes: 'Le cuesta hablar por mensaje',
    }

    expect(parse(profile)).toMatchObject({ success: true, data: profile })
  })

  it('acepta respuestas ausentes, que quedan sin responder', () => {
    expect(
      parse({ answers: { conflict: 'unknown' }, notes: '' }),
    ).toMatchObject({
      success: true,
      data: { answers: { conflict: 'unknown' }, notes: '' },
    })
  })

  // Un valor desconocido en un área no hace perder las demás respuestas.
  it('una respuesta que no pertenece a su área queda sin responder', () => {
    const result = parse({
      answers: { sarcasm: 'talk-now', directness: 'drops-hints' },
      notes: '',
    })

    expect(result.success).toBe(true)
    expect(result.data?.answers).toEqual({ directness: 'drops-hints' })
  })

  // toEqual ignora claves con undefined: aquí se comprueba que no se crean.
  it('las áreas sin responder no aparecen como claves', () => {
    const result = parse({
      answers: { sarcasm: 'talk-now', conflict: 'unknown' },
      notes: '',
    })

    expect(Object.keys(result.data?.answers ?? {})).toEqual(['conflict'])
  })

  it('ignora áreas que no existen', () => {
    const result = parse({
      answers: { attachmentStyle: 'anxious', initiative: 'waits-for-me' },
      notes: '',
    })

    expect(result.data?.answers).toEqual({ initiative: 'waits-for-me' })
  })

  it.each([42, 'a'.repeat(501), undefined])(
    'descarta unas notas no válidas (%s) sin perder las respuestas',
    (notes) => {
      const result = parse({ answers: { sarcasm: 'often' }, notes })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ answers: { sarcasm: 'often' }, notes: '' })
    },
  )

  it('rechaza datos sin la forma de un expediente', () => {
    expect(parse(null).success).toBe(false)
    expect(parse('perfil').success).toBe(false)
    expect(parse({ notes: '' }).success).toBe(false)
    expect(parse({ answers: [], notes: '' }).success).toBe(false)
    expect(parse({ answers: 'directness', notes: '' }).success).toBe(false)
  })
})
