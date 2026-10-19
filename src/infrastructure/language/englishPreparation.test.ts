import { describe, expect, it } from 'vitest'
import type {
  DecisionProvider,
  DecisionReply,
  DecisionRequest,
} from '../../domain/analysis/decisionProvider'
import {
  withEnglishPreparation,
  type EnglishPreparer,
  type PreparerInput,
  type PreparerResult,
} from './englishPreparation'

const INNER_REPLY: DecisionReply = {
  ok: true,
  payload: { safety: 0.01 },
  provenance: { id: 'inner' },
}

// Proveedor interno que anota lo que recibe: así se comprueba qué le llega a Jev.
function innerProvider(reply: DecisionReply = INNER_REPLY) {
  const requests: DecisionRequest[] = []
  const provider: DecisionProvider = {
    evaluate: async (request) => {
      requests.push(request)
      return reply
    },
  }
  return { provider, requests }
}

type Prepare = (
  input: PreparerInput,
) => PreparerResult | Promise<PreparerResult>

function preparer(prepare: Prepare) {
  const inputs: PreparerInput[] = []
  const service: EnglishPreparer = {
    prepare: async (input) => {
      inputs.push(input)
      return prepare(input)
    },
  }
  return { service, inputs }
}

const translated = (message: string, context?: string): PreparerResult => ({
  ok: true,
  message,
  ...(context === undefined ? {} : { context }),
  provenance: {
    service: 'fake-translator',
    result: 'translated',
    version: 'v1',
  },
})

const requestOf = (
  text: { message: string; context?: string },
  profile?: DecisionRequest['readings']['profile'],
): DecisionRequest => ({
  assessment: { ...text },
  readings: profile === undefined ? { ...text } : { ...text, profile },
})

const run = async (
  prepare: Prepare,
  request: DecisionRequest,
  reply?: DecisionReply,
) => {
  const service = preparer(prepare)
  const inner = innerProvider(reply)
  const prepared = withEnglishPreparation(service.service, inner.provider)
  const result = await prepared.evaluate(request)
  return { result, prepared, service, inner }
}

describe('withEnglishPreparation', () => {
  describe('envío en inglés', () => {
    it('Jev recibe el texto preparado en la seguridad, la suficiencia y las lecturas', async () => {
      const { inner } = await run(
        () => translated('Fine.', 'I cancelled dinner.'),
        requestOf({ message: 'Vale.', context: 'Cancelé la cena.' }),
      )

      expect(inner.requests).toEqual([
        {
          assessment: { message: 'Fine.', context: 'I cancelled dinner.' },
          readings: { message: 'Fine.', context: 'I cancelled dinner.' },
        },
      ])
    })

    it('el original no se modifica: la petición recibida queda intacta', async () => {
      const request = requestOf({ message: 'Vale.' }, { sarcasm: 'often' })
      const before = structuredClone(request)

      await run(() => translated('Fine.'), request)

      expect(request).toEqual(before)
    })

    it('sin contexto no se envía ninguno', async () => {
      const { inner } = await run(
        () => translated('Fine.'),
        requestOf({ message: 'Vale.' }),
      )

      expect(inner.requests[0].assessment).toEqual({ message: 'Fine.' })
    })

    it('devuelve tal cual la respuesta del proveedor, éxito o fallo', async () => {
      const ok = await run(
        () => translated('Fine.'),
        requestOf({ message: 'a' }),
      )
      const failed = await run(
        () => translated('Fine.'),
        requestOf({ message: 'a' }),
        { ok: false, retryable: true },
      )

      expect(ok.result).toEqual(INNER_REPLY)
      expect(failed.result).toEqual({ ok: false, retryable: true })
    })
  })

  describe('el expediente', () => {
    it('nunca llega al preparador: solo el mensaje y el contexto', async () => {
      const { service } = await run(
        () => translated('Fine.', 'Context.'),
        requestOf(
          { message: 'Vale.', context: 'Contexto.' },
          { directness: 'drops-hints', sarcasm: 'often' },
        ),
      )

      expect(service.inputs).toEqual([
        { message: 'Vale.', context: 'Contexto.' },
      ])
      expect(JSON.stringify(service.inputs)).not.toMatch(/drops-hints|often/)
    })

    it('llega intacto a Jev, solo en las lecturas', async () => {
      const profile = { directness: 'drops-hints', sarcasm: 'often' } as const
      const { inner } = await run(
        () => translated('Fine.'),
        requestOf({ message: 'Vale.' }, profile),
      )

      expect(inner.requests[0].readings.profile).toEqual(profile)
      expect(inner.requests[0].assessment).not.toHaveProperty('profile')
    })
  })

  describe('emojis', () => {
    // Los emojis compuestos se conservan como grafemas completos. Traducir puede
    // reordenar el texto, no los emojis.
    const GRAPHEMES = [
      ['un modificador de tono', '👍🏽'],
      ['una secuencia ZWJ con género', '🤷‍♀️'],
      ['una secuencia ZWJ de familia', '👨‍👩‍👧'],
      ['una bandera', '🇪🇸'],
      ['una tecla', '1️⃣'],
      ['un emoji con selector de variante', '❤️'],
    ] as const

    it.each(GRAPHEMES)('sobrevive %s', async (_, emoji) => {
      const { result, inner } = await run(
        () => translated(`Sure, whatever ${emoji}`),
        requestOf({ message: `Claro, lo que tú digas ${emoji}` }),
      )

      expect(result).toEqual(INNER_REPLY)
      expect(inner.requests).toHaveLength(1)
    })

    it('admite que la traducción reordene los emojis', async () => {
      const { result } = await run(
        () => translated('🇪🇸 Sure 👍🏽'),
        requestOf({ message: 'Claro 👍🏽 🇪🇸' }),
      )

      expect(result.ok).toBe(true)
    })

    it('un mensaje con solo emojis y una palabra sigue el flujo normal', async () => {
      const { inner } = await run(
        () => translated('ok 🙃'),
        requestOf({ message: 'ok 🙃' }),
      )

      expect(inner.requests).toHaveLength(1)
    })

    it.each([
      ['perdido', '👍🏽', 'Sure.'],
      ['añadido', '👍🏽', 'Sure 👍🏽 🙃'],
      ['repetido de menos', '👍🏽👍🏽', 'Sure 👍🏽'],
      ['sin su modificador de tono', '👍🏽', 'Sure 👍'],
      ['sin su secuencia ZWJ', '🤷‍♀️', 'Sure 🤷'],
      ['sin su selector de variante', '❤️', 'Sure ❤'],
      ['con otra bandera', '🇪🇸', 'Sure 🇫🇷'],
      ['con otra tecla', '1️⃣', 'Sure 2️⃣'],
    ])('un emoji %s bloquea sin llamar a Jev', async (_, original, output) => {
      const { result, inner } = await run(
        () => translated(output),
        requestOf({ message: `Claro ${original}` }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(inner.requests).toHaveLength(0)
    })

    it('también se comprueban en el contexto', async () => {
      const { result, inner } = await run(
        () => translated('Fine.', 'I was sad.'),
        requestOf({ message: 'Vale.', context: 'Estaba triste 😢' }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(inner.requests).toHaveLength(0)
    })

    it('los emojis de un campo no compensan los del otro', async () => {
      const { result } = await run(
        () => translated('Fine.', 'I was sad 😢'),
        requestOf({ message: 'Vale 😢.', context: 'Estaba triste' }),
      )

      expect(result.ok).toBe(false)
    })
  })

  describe('salida inválida', () => {
    it.each([
      ['vacía', ''],
      ['solo espacios', '   \n '],
    ])('un mensaje %s bloquea sin llamar a Jev', async (_, output) => {
      const { result, inner } = await run(
        () => translated(output),
        requestOf({ message: 'Vale.' }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(inner.requests).toHaveLength(0)
    })

    it('un contexto vacío cuando había contexto bloquea', async () => {
      const { result, inner } = await run(
        () => translated('Fine.', ''),
        requestOf({ message: 'Vale.', context: 'Cancelé la cena.' }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(inner.requests).toHaveLength(0)
    })

    it('un contexto que aparece cuando no lo había bloquea', async () => {
      const { result, inner } = await run(
        () => translated('Fine.', 'Invented context.'),
        requestOf({ message: 'Vale.' }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(inner.requests).toHaveLength(0)
    })
  })

  describe('texto sin letras', () => {
    it.each(['🙃', '😤🤙', '🤷‍♀️', '?!', '123 ...'])(
      '«%s» no se envía al preparador y llega a Jev tal cual',
      async (message) => {
        const { service, inner, prepared } = await run(
          () => translated('no debería usarse'),
          requestOf({ message }),
        )

        expect(service.inputs).toHaveLength(0)
        expect(inner.requests[0].assessment).toEqual({ message })
        expect(prepared.preparation).toEqual({ result: 'skipped_no_letters' })
      },
    )

    it('con letras en el contexto sí se prepara, aunque el mensaje solo tenga emojis', async () => {
      const { service, inner } = await run(
        () => translated('🙃', 'I cancelled dinner.'),
        requestOf({ message: '🙃', context: 'Cancelé la cena.' }),
      )

      expect(service.inputs).toHaveLength(1)
      expect(inner.requests[0].assessment).toEqual({
        message: '🙃',
        context: 'I cancelled dinner.',
      })
    })

    it('«ok» tiene letras: su idioma es incierto y decide el preparador', async () => {
      const { service } = await run(
        () => ({
          ok: true,
          message: 'ok',
          provenance: {
            service: 'fake-translator',
            result: 'already_english',
            version: 'v1',
          },
        }),
        requestOf({ message: 'ok' }),
      )

      expect(service.inputs).toHaveLength(1)
    })
  })

  describe('fallos del preparador', () => {
    it.each([true, false])(
      'un fallo con retryable %s se devuelve igual y no se llama a Jev',
      async (retryable) => {
        const { result, inner } = await run(
          () => ({ ok: false, retryable }),
          requestOf({ message: 'Vale.' }),
        )

        expect(result).toEqual({ ok: false, retryable })
        expect(inner.requests).toHaveLength(0)
      },
    )

    it('una excepción es un fallo no reintentable que no filtra su texto', async () => {
      const { result, inner } = await run(
        () => {
          throw new Error('ECONNRESET clave-secreta')
        },
        requestOf({ message: 'Vale.' }),
      )

      expect(result).toEqual({ ok: false, retryable: false })
      expect(JSON.stringify(result)).not.toContain('secreta')
      expect(inner.requests).toHaveLength(0)
    })
  })

  describe('procedencia', () => {
    it('antes de usarse no hay procedencia', () => {
      const prepared = withEnglishPreparation(
        preparer(() => translated('x')).service,
        innerProvider().provider,
      )

      expect(prepared.preparation).toBeUndefined()
    })

    it.each(['translated', 'already_english'] as const)(
      'recoge el servicio, el resultado %s y la versión',
      async (outcome) => {
        const { prepared } = await run(
          () => ({
            ok: true,
            message: 'Fine.',
            provenance: {
              service: 'fake-translator',
              result: outcome,
              version: 'cfg-3',
            },
          }),
          requestOf({ message: 'Vale.' }),
        )

        expect(prepared.preparation).toEqual({
          service: 'fake-translator',
          result: outcome,
          version: 'cfg-3',
        })
      },
    )

    it('nunca contiene el texto del mensaje ni del contexto', async () => {
      const { prepared } = await run(
        () => translated('Secret message', 'Secret context'),
        requestOf({ message: 'Mensaje secreto', context: 'Contexto secreto' }),
      )

      const serialized = JSON.stringify(prepared.preparation)
      expect(serialized).not.toMatch(/ecret|ecreto/)
    })
  })
})
