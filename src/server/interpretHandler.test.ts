import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  answerKind,
  AREA_ANSWERS,
  PROFILE_AREAS,
} from '../domain/partner-profile/partnerProfile'
import {
  createFakeDecisionProvider,
  type FakeScenarioName,
} from '../infrastructure/ai/fakeDecisionProvider'
import type {
  EnglishPreparer,
  PreparerInput,
  PreparerResult,
} from '../infrastructure/language/englishPreparation'
import { TEST_POLICY_CONFIG } from '../test/analysisFixtures'
import { createInterpretHandler } from './interpretHandler'

const MESSAGE = 'Me hacía ilusión verte, pero bueno…'

const translating: EnglishPreparer = {
  prepare: async ({ message, context }) => ({
    ok: true,
    message: message.startsWith('Me hacía')
      ? 'I was looking forward to it.'
      : message,
    ...(context === undefined ? {} : { context: 'Translated context.' }),
    provenance: {
      service: 'fake-translator',
      result: 'translated',
      version: 'v1',
    },
  }),
}

function setup(
  scenario: FakeScenarioName = 'two-high-signals',
  preparer: EnglishPreparer = translating,
) {
  const provider = createFakeDecisionProvider(scenario)
  const inputs: PreparerInput[] = []
  const spy: EnglishPreparer = {
    prepare: async (input): Promise<PreparerResult> => {
      inputs.push(input)
      return preparer.prepare(input)
    },
  }
  const handler = createInterpretHandler({
    provider,
    preparer: spy,
    policy: TEST_POLICY_CONFIG,
  })
  return { handler, provider, inputs }
}

const post = (body: unknown) =>
  new Request('https://ask-sofi.test/api/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

// Forma que usan las aserciones; el contrato real está en 006-plan §3.4.
type Body = {
  ok: boolean
  result: {
    status: string
    meta: {
      profileUsed: boolean
      provider: unknown
      languagePreparation?: unknown
    }
  }
  error: { code: string; retryable: boolean }
}

const call = async (
  handler: (request: Request) => Promise<Response>,
  request: Request,
) => {
  const response = await handler(request)
  return { response, body: (await response.json()) as Body }
}

describe('createInterpretHandler', () => {
  afterEach(() => vi.restoreAllMocks())

  describe('respuestas 200', () => {
    it.each([
      ['two-high-signals', 'interpreted'],
      ['context-needed', 'needs_context'],
      ['safety-concern', 'safety_concern'],
    ] as const)(
      'el escenario %s da %s con estado 200',
      async (scenario, status) => {
        const { handler } = setup(scenario)

        const { response, body } = await call(
          handler,
          post({ message: MESSAGE }),
        )

        expect(response.status).toBe(200)
        expect(body.ok).toBe(true)
        expect(body.result.status).toBe(status)
      },
    )

    it('responde JSON sin caché', async () => {
      const { handler } = setup()

      const { response } = await call(handler, post({ message: MESSAGE }))

      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('cache-control')).toBe('no-store')
    })

    it('añade a los metadatos la preparación lingüística, sin texto', async () => {
      const { handler } = setup()

      const { body } = await call(handler, post({ message: MESSAGE }))

      expect(body.result.meta.languagePreparation).toEqual({
        service: 'fake-translator',
        result: 'translated',
        version: 'v1',
      })
      expect(body.result.meta.provider).toEqual({
        id: 'fake',
        observedVersion: 'unknown',
      })
    })

    it('un texto sin letras se envía sin traducir y la procedencia lo recoge', async () => {
      const { handler, inputs, provider } = setup()

      const { body } = await call(handler, post({ message: '🙃' }))

      expect(inputs).toHaveLength(0)
      expect(provider.requests[0].assessment.message).toBe('🙃')
      expect(body.result.meta.languagePreparation).toEqual({
        result: 'skipped_no_letters',
      })
    })

    it('Jev recibe el texto preparado, no el original', async () => {
      const { handler, provider } = setup()

      await call(
        handler,
        post({ message: MESSAGE, context: 'Cancelé la cena.' }),
      )

      expect(provider.requests[0].assessment).toEqual({
        message: 'I was looking forward to it.',
        context: 'Translated context.',
      })
    })

    it('ni el resultado ni los metadatos contienen el mensaje, el contexto ni el expediente', async () => {
      const { handler } = setup()

      const { body } = await call(
        handler,
        post({
          message: MESSAGE,
          context: 'Contexto privado',
          profile: { directness: 'drops-hints' },
        }),
      )

      const serialized = JSON.stringify(body)
      expect(serialized).not.toContain('ilusión')
      expect(serialized).not.toContain('Contexto privado')
      expect(serialized).not.toContain('drops-hints')
      expect(serialized).not.toContain('looking forward')
    })
  })

  describe('errores del análisis', () => {
    it.each([
      ['invalid_input', 400, { message: '   ' }, 'two-high-signals', false],
      [
        'processing_unavailable',
        503,
        { message: 'a' },
        'provider-unavailable',
        true,
      ],
      [
        'processing_unavailable',
        503,
        { message: 'a' },
        'provider-refused',
        false,
      ],
      [
        'invalid_provider_response',
        502,
        { message: 'a' },
        'invalid-nan',
        false,
      ],
      [
        'safety_evaluation_unavailable',
        502,
        { message: 'a' },
        'safety-absent',
        false,
      ],
      [
        'safety_evaluation_unavailable',
        502,
        { message: 'a' },
        'safety-rejected',
        false,
      ],
    ] as const)(
      '%s → HTTP %i con el cuerpo { ok: false, error }',
      async (code, status, input, scenario, retryable) => {
        const { handler } = setup(scenario)

        const { response, body } = await call(handler, post(input))

        expect(response.status).toBe(status)
        expect(body).toEqual({ ok: false, error: { code, retryable } })
      },
    )

    it('el error no contiene texto del proveedor ni de la consulta', async () => {
      const { handler } = setup('provider-refused')

      const { body } = await call(handler, post({ message: 'Mensaje secreto' }))

      expect(JSON.stringify(body)).not.toContain('secreto')
    })
  })

  describe('entrada', () => {
    it.each([
      ['JSON ilegible', '{no es json'],
      ['un cuerpo vacío', ''],
      ['null', 'null'],
      ['un array', '[1, 2]'],
      ['una cadena', '"Vale."'],
    ])('%s → 400 invalid_input sin llamar a nadie', async (_, raw) => {
      const { handler, provider, inputs } = setup()

      const { response, body } = await call(handler, post(raw))

      expect(response.status).toBe(400)
      expect(body).toEqual({
        ok: false,
        error: { code: 'invalid_input', retryable: false },
      })
      expect(provider.requests).toHaveLength(0)
      expect(inputs).toHaveLength(0)
    })

    it.each([
      ['una clave desconocida', { message: 'a', other: 1 }],
      ['las notas en la raíz', { message: 'a', notes: 'x' }],
      [
        'las notas dentro del expediente',
        { message: 'a', profile: { notes: 'x' } },
      ],
      [
        'un área desconocida del expediente',
        { message: 'a', profile: { mood: 'x' } },
      ],
      [
        'un valor inválido del expediente',
        { message: 'a', profile: { sarcasm: 'always' } },
      ],
      ['un expediente que no es un objeto', { message: 'a', profile: 'often' }],
      ['un mensaje que no es una cadena', { message: 3 }],
    ])('%s → 400 invalid_input sin llamar a nadie', async (_, input) => {
      const { handler, provider, inputs } = setup()

      const { response, body } = await call(handler, post(input))

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('invalid_input')
      expect(provider.requests).toHaveLength(0)
      expect(inputs).toHaveLength(0)
    })
  })

  // El esquema de 004 (AREA_ANSWERS) decide qué valor es válido en cada área;
  // answerKind() solo clasifica los válidos. La validez se comprueba primero: un
  // valor inválido nunca puede desaparecer en la minimización como si fuera
  // «Depende» o «No lo sé».
  describe('validación del expediente antes de minimizar', () => {
    const INVALID = [
      ['una cadena desconocida', 'zzz'],
      ['mayúsculas distintas', 'Often'],
      ['con espacios', ' often'],
      ['una cadena vacía', ''],
      ['un número', 5],
      ['un booleano', true],
      ['null', null],
      ['un array', ['often']],
      ['un objeto', { value: 'often' }],
    ] as const

    describe.each(PROFILE_AREAS)('área %s', (area) => {
      it.each(INVALID)('rechaza %s', async (_, value) => {
        const { handler, provider, inputs } = setup()

        const { response, body } = await call(
          handler,
          post({ message: MESSAGE, profile: { [area]: value } }),
        )

        expect(response.status).toBe(400)
        expect(body.error).toEqual({ code: 'invalid_input', retryable: false })
        expect(provider.requests).toHaveLength(0)
        expect(inputs).toHaveLength(0)
      })

      it.each(AREA_ANSWERS[area])(
        'acepta el valor %s, y solo los concretos llegan a Jev',
        async (answer) => {
          const { handler, provider } = setup()

          const { response, body } = await call(
            handler,
            post({ message: MESSAGE, profile: { [area]: answer } }),
          )

          const concrete = answerKind(answer) === 'concrete'
          expect(response.status).toBe(200)
          expect(body.result.meta.profileUsed).toBe(concrete)
          expect(provider.requests[0].readings.profile).toEqual(
            concrete ? { [area]: answer } : undefined,
          )
        },
      )
    })

    it('«Depende» no vale en un área que no lo admite, aunque answerKind() lo clasifique como condicional', async () => {
      // messageStyle no tiene «depends» en 004 (tiene «varies»).
      expect(AREA_ANSWERS.messageStyle).not.toContain('depends')
      const { handler, provider } = setup()

      const { response, body } = await call(
        handler,
        post({ message: MESSAGE, profile: { messageStyle: 'depends' } }),
      )

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('invalid_input')
      expect(provider.requests).toHaveLength(0)
    })

    it('un valor de otra área es inválido aunque exista en otra', async () => {
      const { handler } = setup()

      const { response } = await call(
        handler,
        post({ message: MESSAGE, profile: { directness: 'often' } }),
      )

      expect(response.status).toBe(400)
    })

    it('un solo valor inválido invalida todo el expediente, aunque el resto sea válido', async () => {
      const { handler, provider } = setup()

      const { response } = await call(
        handler,
        post({
          message: MESSAGE,
          profile: {
            sarcasm: 'often',
            conflict: 'talk-now',
            initiative: 'maybe',
          },
        }),
      )

      expect(response.status).toBe(400)
      expect(provider.requests).toHaveLength(0)
    })

    it('un valor inválido también se rechaza junto a «Depende» y «No lo sé»', async () => {
      const { handler } = setup()

      const { response } = await call(
        handler,
        post({
          message: MESSAGE,
          profile: {
            directness: 'depends',
            sarcasm: 'unknown',
            conflict: 'zzz',
          },
        }),
      )

      expect(response.status).toBe(400)
    })

    it('«Depende» y «No lo sé» válidos se siguen filtrando junto a respuestas concretas', async () => {
      const { handler, provider } = setup()

      const { response, body } = await call(
        handler,
        post({
          message: MESSAGE,
          profile: {
            directness: 'depends',
            sarcasm: 'unknown',
            personalSpace: 'usually-yes',
            messageStyle: 'unknown',
          },
        }),
      )

      expect(response.status).toBe(200)
      expect(provider.requests[0].readings.profile).toEqual({
        personalSpace: 'usually-yes',
      })
      expect(body.result.meta.profileUsed).toBe(true)
    })
  })

  describe('minimización del expediente en el servidor', () => {
    it('descarta «Depende» y «No lo sé» y deja la respuesta concreta', async () => {
      const { handler, provider } = setup()

      const { body } = await call(
        handler,
        post({
          message: MESSAGE,
          profile: {
            directness: 'depends',
            sarcasm: 'unknown',
            conflict: 'talk-now',
          },
        }),
      )

      expect(provider.requests[0].readings.profile).toEqual({
        conflict: 'talk-now',
      })
      expect(body.result.meta.profileUsed).toBe(true)
    })

    it('un expediente sin respuestas concretas no se envía y profileUsed es false', async () => {
      const { handler, provider } = setup()

      const { response, body } = await call(
        handler,
        post({
          message: MESSAGE,
          profile: { directness: 'depends', sarcasm: 'unknown' },
        }),
      )

      expect(response.status).toBe(200)
      expect(provider.requests[0].readings).not.toHaveProperty('profile')
      expect(body.result.meta.profileUsed).toBe(false)
    })

    it('un expediente vacío no se envía', async () => {
      const { handler, provider } = setup()

      const { body } = await call(
        handler,
        post({ message: MESSAGE, profile: {} }),
      )

      expect(provider.requests[0].readings).not.toHaveProperty('profile')
      expect(body.result.meta.profileUsed).toBe(false)
    })

    it('el expediente no llega al preparador', async () => {
      const { handler, inputs } = setup()

      await call(
        handler,
        post({ message: MESSAGE, profile: { directness: 'drops-hints' } }),
      )

      expect(JSON.stringify(inputs)).not.toContain('drops-hints')
    })
  })

  describe('fallos de la preparación lingüística', () => {
    it.each([true, false])(
      'si el preparador falla (retryable %s) responde 503 y no llama al proveedor',
      async (retryable) => {
        const { handler, provider } = setup('two-high-signals', {
          prepare: async () => ({ ok: false, retryable }),
        })

        const { response, body } = await call(
          handler,
          post({ message: MESSAGE }),
        )

        expect(response.status).toBe(503)
        expect(body).toEqual({
          ok: false,
          error: { code: 'processing_unavailable', retryable },
        })
        expect(provider.requests).toHaveLength(0)
      },
    )

    it('si la salida no supera la validación mecánica responde 503 sin llamar al proveedor', async () => {
      const { handler, provider } = setup('two-high-signals', {
        prepare: async () => ({
          ok: true,
          message: 'Fine.',
          provenance: {
            service: 'fake-translator',
            result: 'translated',
            version: 'v1',
          },
        }),
      })

      const { response, body } = await call(
        handler,
        post({ message: 'Vale 👍🏽' }),
      )

      expect(response.status).toBe(503)
      expect(body.error.retryable).toBe(false)
      expect(provider.requests).toHaveLength(0)
    })
  })

  describe('composición incompleta: falla cerrado', () => {
    it('sin dependencias responde 503 processing_unavailable sin reintento', async () => {
      const handler = createInterpretHandler(undefined)

      const { response, body } = await call(handler, post({ message: MESSAGE }))

      expect(response.status).toBe(503)
      expect(body).toEqual({
        ok: false,
        error: { code: 'processing_unavailable', retryable: false },
      })
    })

    it('no consulta ni siquiera el cuerpo: la entrada no cambia la respuesta', async () => {
      const handler = createInterpretHandler(undefined)

      const { response } = await call(handler, post('{no es json'))

      expect(response.status).toBe(503)
    })
  })

  describe('método', () => {
    it.each(['GET', 'PUT', 'DELETE', 'PATCH'])(
      '%s → 405 con Allow: POST',
      async (method) => {
        const { handler, provider } = setup()

        const response = await handler(
          new Request('https://ask-sofi.test/api/interpret', { method }),
        )

        expect(response.status).toBe(405)
        expect(response.headers.get('allow')).toBe('POST')
        expect(provider.requests).toHaveLength(0)
      },
    )

    it('el 405 tampoco depende de la composición', async () => {
      const handler = createInterpretHandler(undefined)

      const response = await handler(
        new Request('https://ask-sofi.test/api/interpret', { method: 'GET' }),
      )

      expect(response.status).toBe(405)
    })
  })

  describe('registros', () => {
    it('no escribe nada en la consola, con éxito ni con error', async () => {
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
        (method) => vi.spyOn(console, method).mockImplementation(() => {}),
      )
      const { handler } = setup()
      const failing = setup('provider-unavailable').handler

      await call(
        handler,
        post({ message: MESSAGE, context: 'Contexto privado' }),
      )
      await call(failing, post({ message: MESSAGE }))
      await call(handler, post('{no es json'))

      for (const spy of spies) expect(spy).not.toHaveBeenCalled()
    })
  })

  it('una excepción inesperada no filtra su texto: 503 sin reintento', async () => {
    const handler = createInterpretHandler({
      provider: createFakeDecisionProvider('two-high-signals'),
      preparer: {
        prepare: async () => {
          throw new Error('clave-secreta')
        },
      },
      policy: TEST_POLICY_CONFIG,
    })

    const { response, body } = await call(handler, post({ message: MESSAGE }))

    expect(response.status).toBe(503)
    expect(JSON.stringify(body)).not.toContain('secreta')
  })
})
