import { delay, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  parseDecisionPayload,
  type DecisionReply,
  type DecisionRequest,
} from '../../domain/analysis/decisionProvider'
import { TEST_POLICY_CONFIG } from '../../test/analysisFixtures'
import {
  AFFECTED,
  answersFor,
  API_KEY,
  gateway,
  READINGS,
  SAFETY,
  SUFFICIENCY,
  withOverrides,
  type Override,
} from '../../test/jevGateway'
import { createJevDecisionProvider, gatewayBodies } from './jevDecisionProvider'
import {
  INSTRUCTION_VERSION,
  PROFILE_PHRASES,
  SIGNAL_QUESTIONS,
} from './jevQuestions'

const MESSAGE = 'Me hacía ilusión verte, pero bueno…'
const plain = (extra: Partial<DecisionRequest['assessment']> = {}) => ({
  message: MESSAGE,
  ...extra,
})
const requestOf = (
  profile?: DecisionRequest['readings']['profile'],
  text = plain(),
): DecisionRequest => ({
  assessment: { ...text },
  readings: profile === undefined ? { ...text } : { ...text, profile },
})

const provider = (options: { timeoutMs?: number } = {}) =>
  createJevDecisionProvider({
    apiKey: API_KEY,
    readings: { mode: 'when-needed', policy: TEST_POLICY_CONFIG },
    ...options,
  })

const okReply = (reply: DecisionReply) => {
  if (!reply.ok) throw new Error('se esperaba una respuesta correcta')
  return reply
}
const estimatesOf = (reply: DecisionReply) => {
  const checked = parseDecisionPayload(okReply(reply).payload)
  if (!checked.ok) throw new Error('payload inválido')
  return checked.estimates
}

const PROFILE = { directness: 'drops-hints', sarcasm: 'often' } as const

describe('createJevDecisionProvider', () => {
  describe('petición sin expediente', () => {
    it('hace una sola petición con seguridad, afectados, suficiencia y las diez lecturas', async () => {
      const received = gateway()

      await provider().evaluate(requestOf())

      expect(received).toHaveLength(1)
      const names = received[0].body.questions.map(({ name }) => name)
      expect(names.sort()).toEqual(
        [SAFETY, SUFFICIENCY, ...AFFECTED, ...READINGS].sort(),
      )
      expect(
        received[0].body.questions.every(({ type }) => type === 'predicate'),
      ).toBe(true)
    })

    it('pide el alias de Jev con enrutado y privacidad fijos, sin fallbacks ni ZDR', async () => {
      const received = gateway()

      await provider().evaluate(requestOf())

      const { body } = received[0]
      expect(body.model).toBe('typesafe-ai/jev')
      expect(body.providerOptions).toEqual({
        gateway: { only: ['typesafe-ai'], disallowPromptTraining: true },
      })
      expect(JSON.stringify(body)).not.toMatch(
        /zeroDataRetention|"models"|fallback/i,
      )
    })

    it('envía la credencial en la cabecera y nunca en el cuerpo', async () => {
      const received = gateway()

      await provider().evaluate(requestOf())

      expect(received[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`)
      expect(received[0].headers.get('content-type')).toContain(
        'application/json',
      )
      expect(JSON.stringify(received[0].body)).not.toContain(API_KEY)
    })

    it('serializa el estado en `input`: mensaje y, si hay, situación actual', async () => {
      const received = gateway()

      await provider().evaluate(
        requestOf(undefined, plain({ context: 'Cancelé la cena.' })),
      )
      await provider().evaluate(requestOf())

      expect(JSON.parse(received[0].body.input)).toEqual({
        partnerMessage: MESSAGE,
        currentSituation: 'Cancelé la cena.',
      })
      expect(JSON.parse(received[1].body.input)).toEqual({
        partnerMessage: MESSAGE,
      })
    })

    it('incorpora los criterios a las instrucciones y no envía campos no documentados', async () => {
      const received = gateway()

      await provider().evaluate(requestOf())

      const literal = received[0].body.questions.find(
        ({ name }) => name === SIGNAL_QUESTIONS.literal_meaning.key,
      )
      expect(literal?.instructions).toContain(
        SIGNAL_QUESTIONS.literal_meaning.criteria.true,
      )
      expect(Object.keys(literal ?? {}).sort()).toEqual([
        'instructions',
        'name',
        'type',
      ])
      expect(received[0].body.input).not.toContain('reportedTendencies')
      expect(JSON.stringify(received[0].body.questions)).not.toContain(
        'reportedTendencies',
      )
    })
  })

  describe('petición con expediente', () => {
    it('A, sin expediente, va primero con seguridad, afectados y suficiencia; B, con él, después con las diez lecturas', async () => {
      const received = gateway()

      await provider().evaluate(requestOf(PROFILE))

      expect(received).toHaveLength(2)
      const [a, b] = received
      expect(a.body.questions.map(({ name }) => name).sort()).toEqual(
        [SAFETY, SUFFICIENCY, ...AFFECTED].sort(),
      )
      expect(b.body.questions.map(({ name }) => name).sort()).toEqual(
        [...READINGS].sort(),
      )
    })

    it('el expediente solo llega a B, como frases estables en inglés y nunca como valores codificados', async () => {
      const received = gateway()

      await provider().evaluate(requestOf(PROFILE))

      const [a, b] = received
      expect(JSON.stringify(a.body)).not.toMatch(
        /reportedTendencies|drops-hints|often|tend to drop hints/,
      )
      expect(JSON.parse(b.body.input).reportedTendencies).toEqual({
        about: expect.stringContaining('impressions, not facts'),
        directness: PROFILE_PHRASES.directness['drops-hints'],
        sarcasm: PROFILE_PHRASES.sarcasm.often,
      })
      expect(JSON.stringify(b.body)).not.toContain('drops-hints')
    })

    it('B mantiene el orden de las áreas del expediente y omite las que no están', async () => {
      const received = gateway()

      await provider().evaluate(
        requestOf({ messageStyle: 'varies', conflict: 'talk-now' }),
      )

      const tendencies = JSON.parse(received[1].body.input).reportedTendencies
      expect(Object.keys(tendencies)).toEqual([
        'about',
        'conflict',
        'messageStyle',
      ])
    })

    it('las lecturas de B declaran que prevalece la evidencia actual', async () => {
      const received = gateway()

      await provider().evaluate(requestOf(PROFILE))

      for (const { instructions } of received[1].body.questions)
        expect(instructions).toMatch(/follow the current evidence/i)
    })

    it('A y B reciben el mismo mensaje y la misma situación', async () => {
      const received = gateway()

      await provider().evaluate(
        requestOf(PROFILE, plain({ context: 'Cancelé la cena.' })),
      )

      const [a, b] = received.map(({ body }) => JSON.parse(body.input))
      expect(a.partnerMessage).toBe(b.partnerMessage)
      expect(a.currentSituation).toBe(b.currentSituation)
    })
  })

  describe('B solo se envía si el resultado depende de las lecturas (decisión 6)', () => {
    const peticiones = async (
      overrides: Record<string, Override>,
      request: DecisionRequest = requestOf(PROFILE),
    ) => {
      const received = gateway(withOverrides(overrides))
      const reply = await provider().evaluate(request)
      return { received, reply }
    }

    it('con indicios de seguridad no pide las lecturas y la seguridad prevalece', async () => {
      const { received, reply } = await peticiones({
        [SAFETY]: 0.9,
        [AFFECTED[0]]: 0.8,
      })

      expect(received).toHaveLength(1)
      expect(estimatesOf(reply).safety).toBe(0.9)
      expect(estimatesOf(reply).signals).toEqual({})
    })

    it.each([
      ['seguridad rechazada', { [SAFETY]: 'refusal' as const }],
      ['seguridad ausente', { [SAFETY]: 'omit' as const }],
      ['suficiencia rechazada', { [SUFFICIENCY]: 'refusal' as const }],
      ['suficiencia ausente', { [SUFFICIENCY]: 'omit' as const }],
    ])('con %s no pide las lecturas', async (_, overrides) => {
      const { received } = await peticiones(overrides)

      expect(received).toHaveLength(1)
    })

    it('con un marcador de contenido omitido no pide las lecturas', async () => {
      const { received } = await peticiones(
        {},
        requestOf(PROFILE, { message: 'Audio omitido' }),
      )

      expect(received).toHaveLength(1)
    })

    it('si A no se puede leer no pide las lecturas', async () => {
      const received = gateway(() => HttpResponse.json({ answers: 'x' }))

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(received).toHaveLength(1)
      expect(okReply(reply).payload).toBeNull()
    })

    it('si A trae un valor inválido no pide las lecturas: el núcleo rechazará la respuesta', async () => {
      const { received, reply } = await peticiones({ [SAFETY]: 1.5 })

      expect(received).toHaveLength(1)
      expect(parseDecisionPayload(okReply(reply).payload).ok).toBe(false)
    })

    it.each([
      ['insuficiente', 0.1],
      ['parcial', 0.45],
      ['suficiente', 0.9],
    ])('con contexto %s sí pide las lecturas', async (_, sufficiency) => {
      const { received } = await peticiones({ [SUFFICIENCY]: sufficiency })

      expect(received).toHaveLength(2)
    })

    it('con contexto insuficiente las lecturas traen los límites explícitos, que se conservan', async () => {
      const received = gateway((sent, index) =>
        withOverrides(
          index === 0
            ? { [SUFFICIENCY]: 0.1 }
            : { [SIGNAL_QUESTIONS.setting_boundary.key]: 0.9 },
        )(sent),
      )

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(received).toHaveLength(2)
      expect(estimatesOf(reply)).toMatchObject({
        sufficiency: 0.1,
        signals: { setting_boundary: 0.9 },
      })
    })

    it('sin expediente nunca hay una segunda petición', async () => {
      const { received } = await peticiones({ [SUFFICIENCY]: 0.1 }, requestOf())

      expect(received).toHaveLength(1)
    })

    it('un expediente vacío no cuenta: una sola petición', async () => {
      const received = gateway()

      await provider().evaluate(requestOf({}))

      expect(received).toHaveLength(1)
    })
  })

  describe('de respuesta a payload', () => {
    it('une lo de A y lo de B en un único payload', async () => {
      gateway(
        withOverrides({
          [SAFETY]: 0.02,
          [SUFFICIENCY]: 0.9,
          [SIGNAL_QUESTIONS.literal_meaning.key]: 0.7,
          [AFFECTED[1]]: 0.1,
        }),
      )

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(estimatesOf(reply)).toMatchObject({
        safety: 0.02,
        sufficiency: 0.9,
        signals: { literal_meaning: 0.7 },
        affected: { other_at_risk_of_self_harm: 0.1 },
      })
      expect(Object.keys(estimatesOf(reply).signals)).toHaveLength(10)
    })

    it('transmite la probabilidad recibida sin redondear ni recortar', async () => {
      const received = gateway(
        withOverrides({ [SIGNAL_QUESTIONS.literal_meaning.key]: 0.123456789 }),
      )

      const reply = await provider().evaluate(requestOf())

      expect(received).toHaveLength(1)
      expect(
        (okReply(reply).payload as { signals: Record<string, number> }).signals
          .literal_meaning,
      ).toBe(0.123456789)
    })

    it('un rechazo en seguridad o suficiencia es «rejected»', async () => {
      gateway(withOverrides({ [SAFETY]: 'refusal', [SUFFICIENCY]: 'refusal' }))

      const reply = await provider().evaluate(requestOf())

      expect(okReply(reply).payload).toMatchObject({
        safety: 'rejected',
        sufficiency: 'rejected',
      })
    })

    it('un rechazo en una lectura o en una persona afectada deja la clave ausente, nunca 0 ni false', async () => {
      gateway(
        withOverrides({
          [SIGNAL_QUESTIONS.sarcastic_tone.key]: 'refusal',
          [AFFECTED[0]]: 'refusal',
        }),
      )

      const reply = await provider().evaluate(requestOf())

      const estimates = estimatesOf(reply)
      expect(estimates.signals).not.toHaveProperty('sarcastic_tone')
      expect(estimates.affected).not.toHaveProperty('user_at_risk_from_other')
      expect(Object.keys(estimates.signals)).toHaveLength(9)
    })

    it('una pregunta sin respuesta deja la clave ausente', async () => {
      gateway(
        withOverrides({
          [SIGNAL_QUESTIONS.playful_teasing.key]: 'omit',
          [SAFETY]: 'omit',
        }),
      )

      const reply = await provider().evaluate(requestOf())

      const estimates = estimatesOf(reply)
      expect(estimates.signals).not.toHaveProperty('playful_teasing')
      expect(estimates.safety).toBeUndefined()
    })

    it('empareja las respuestas por nombre, no por posición', async () => {
      gateway(({ body }) =>
        HttpResponse.json({
          model: 'typesafe-ai/jev',
          answers: answersFor(body.questions, {
            [SIGNAL_QUESTIONS.literal_meaning.key]: 0.77,
          }).reverse(),
        }),
      )

      const reply = await provider().evaluate(requestOf())

      expect(estimatesOf(reply).signals.literal_meaning).toBe(0.77)
    })

    it.each([
      ['un texto', '0.5'],
      ['null', null],
      ['un booleano', true],
      ['fuera de rango', 1.7],
      ['negativo', -0.1],
    ])(
      'un valor de tipo o rango incorrecto (%s) pasa tal cual y el núcleo invalida la respuesta',
      async (_, probability) => {
        gateway(
          withOverrides({
            [SIGNAL_QUESTIONS.literal_meaning.key]: {
              type: 'predicate',
              name: SIGNAL_QUESTIONS.literal_meaning.key,
              probability,
            },
          }),
        )

        const reply = await provider().evaluate(requestOf())

        expect(parseDecisionPayload(okReply(reply).payload).ok).toBe(false)
      },
    )

    it('los centinelas de fallback (confidence 0, probabilities {}) invalidan toda la respuesta', async () => {
      gateway(
        withOverrides({
          [SIGNAL_QUESTIONS.literal_meaning.key]: {
            type: 'choice',
            name: SIGNAL_QUESTIONS.literal_meaning.key,
            choice: 'x',
            confidence: 0,
            probabilities: {},
          },
        }),
      )

      const reply = await provider().evaluate(requestOf())

      expect(parseDecisionPayload(okReply(reply).payload).ok).toBe(false)
    })

    it.each([
      ['un cuerpo que no es JSON', () => new HttpResponse('no es json')],
      ['un objeto vacío', () => HttpResponse.json({})],
      ['answers que no es un array', () => HttpResponse.json({ answers: 3 })],
      ['un array en vez de un objeto', () => HttpResponse.json([1, 2])],
      ['null', () => HttpResponse.json(null)],
    ])('con %s el payload es nulo', async (_, respond) => {
      gateway(respond)

      const reply = await provider().evaluate(requestOf())

      expect(okReply(reply).payload).toBeNull()
    })

    it('el adaptador no produce missingInformation: Jev no genera texto', async () => {
      gateway()

      const reply = await provider().evaluate(requestOf())

      expect(okReply(reply).payload).not.toHaveProperty('missingInformation')
    })
  })

  describe('fallos de toda la llamada', () => {
    const SECRET = 'texto-secreto-del-proveedor'

    it.each([
      [400, false],
      [401, false],
      [402, false],
      [403, false],
      [422, false],
      [404, false],
      [429, true],
      [500, true],
      [502, true],
      [503, true],
      [529, true],
    ])('el estado %i da retryable %s', async (status, retryable) => {
      gateway(() =>
        HttpResponse.json({ error: { message: SECRET } }, { status }),
      )

      const reply = await provider().evaluate(requestOf())

      expect(reply).toEqual({ ok: false, retryable })
    })

    it('402 por presupuesto agotado (quota_for_entity_exceeded) no es reintentable', async () => {
      gateway(() =>
        HttpResponse.json(
          { error: { message: SECRET, type: 'quota_for_entity_exceeded' } },
          { status: 402 },
        ),
      )

      expect(await provider().evaluate(requestOf())).toEqual({
        ok: false,
        retryable: false,
      })
    })

    it('un error de red es reintentable', async () => {
      gateway(() => HttpResponse.error())

      expect(await provider().evaluate(requestOf())).toEqual({
        ok: false,
        retryable: true,
      })
    })

    it('el tiempo de espera agotado es reintentable y corta la petición', async () => {
      gateway(async () => {
        await delay(500)
        return HttpResponse.json({ answers: [] })
      })

      const started = Date.now()
      const reply = await provider({ timeoutMs: 30 }).evaluate(requestOf())

      expect(reply).toEqual({ ok: false, retryable: true })
      expect(Date.now() - started).toBeLessThan(450)
    })

    it('ningún texto del proveedor ni la credencial salen del adaptador', async () => {
      gateway(() =>
        HttpResponse.json({ error: { message: SECRET } }, { status: 500 }),
      )

      const reply = await provider().evaluate(requestOf())

      expect(JSON.stringify(reply)).not.toContain(SECRET)
      expect(JSON.stringify(reply)).not.toContain(API_KEY)
    })

    it('no reintenta: un fallo transitorio es una sola petición', async () => {
      const received = gateway(() => new HttpResponse(null, { status: 503 }))

      await provider().evaluate(requestOf())

      expect(received).toHaveLength(1)
    })

    it('si A falla con expediente, no se pide B', async () => {
      const received = gateway(() => new HttpResponse(null, { status: 429 }))

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(reply).toEqual({ ok: false, retryable: true })
      expect(received).toHaveLength(1)
    })

    it('si B falla es un error técnico: nunca se devuelve A solo, sin fallback silencioso', async () => {
      const received = gateway((sent, index) =>
        index === 0
          ? withOverrides({ [SUFFICIENCY]: 0.1 })(sent)
          : new HttpResponse(null, { status: 503 }),
      )

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(received).toHaveLength(2)
      expect(reply).toEqual({ ok: false, retryable: true })
    })

    it('si B falla de forma no reintentable, el error tampoco lo es', async () => {
      gateway((sent, index) =>
        index === 0
          ? withOverrides({})(sent)
          : new HttpResponse(null, { status: 403 }),
      )

      expect(await provider().evaluate(requestOf(PROFILE))).toEqual({
        ok: false,
        retryable: false,
      })
    })

    it('si B no se puede leer, el payload lo invalida en el núcleo y no se devuelve A solo', async () => {
      gateway((sent, index) =>
        index === 0
          ? withOverrides({ [SUFFICIENCY]: 0.9 })(sent)
          : HttpResponse.json({ answers: 'x' }),
      )

      const reply = await provider().evaluate(requestOf(PROFILE))

      expect(okReply(reply).payload).toBeNull()
    })
  })

  describe('procedencia con A y B', () => {
    // Cada petición puede responder con su propio modelo (o sin él). Un único
    // `respondedModel` solo es honesto si todas las que contribuyen coinciden.
    const withModels = (
      modelA: string | undefined,
      modelB: string | undefined,
    ) =>
      gateway((sent, index) => {
        const model = index === 0 ? modelA : modelB
        return HttpResponse.json({
          ...(model === undefined ? {} : { model }),
          answers: answersFor(sent.body.questions, {}),
        })
      })

    it('con modelos coincidentes en A y B lo declara', async () => {
      const received = withModels('typesafe-ai/jev', 'typesafe-ai/jev')

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(received).toHaveLength(2)
      expect(provenance.respondedModel).toBe('typesafe-ai/jev')
    })

    it('con modelos distintos no atribuye todo el análisis a ninguno', async () => {
      const received = withModels('typesafe-ai/jev', 'otro/modelo')

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(received).toHaveLength(2)
      expect(provenance).not.toHaveProperty('respondedModel')
      expect(provenance.alias).toBe('typesafe-ai/jev')
    })

    it('si B no informa del modelo, el de A no se extiende a las lecturas de B', async () => {
      withModels('typesafe-ai/jev', undefined)

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(provenance).not.toHaveProperty('respondedModel')
    })

    it('si A no informa del modelo pero B sí, tampoco se atribuye a A', async () => {
      withModels(undefined, 'typesafe-ai/jev')

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(provenance).not.toHaveProperty('respondedModel')
    })

    it('si ninguna informa del modelo, no se declara', async () => {
      withModels(undefined, undefined)

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(provenance).not.toHaveProperty('respondedModel')
    })

    it('si B no se envía, el modelo de A es el único que respondió', async () => {
      const received = gateway(({ body }) =>
        HttpResponse.json({
          model: 'typesafe-ai/jev',
          answers: answersFor(body.questions, { [SAFETY]: 0.95 }),
        }),
      )

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(received).toHaveLength(1)
      expect(provenance.respondedModel).toBe('typesafe-ai/jev')
    })

    it('en modo experimental también exige coincidencia', async () => {
      withModels('typesafe-ai/jev', 'otro/modelo')

      const { provenance } = okReply(
        await createJevDecisionProvider({
          apiKey: API_KEY,
          readings: { mode: 'always' },
        }).evaluate(requestOf(PROFILE)),
      )

      expect(provenance).not.toHaveProperty('respondedModel')
    })

    it('nunca declara una versión observada', async () => {
      withModels('typesafe-ai/jev', 'typesafe-ai/jev')

      const { provenance } = okReply(
        await provider().evaluate(requestOf(PROFILE)),
      )

      expect(provenance).not.toHaveProperty('observedVersion')
    })
  })

  describe('procedencia', () => {
    it('declara el servicio, el alias pedido, el modelo que respondió y la versión de las instrucciones', async () => {
      gateway()

      const reply = okReply(await provider().evaluate(requestOf()))

      expect(reply.provenance).toEqual({
        id: 'jev',
        alias: 'typesafe-ai/jev',
        respondedModel: 'typesafe-ai/jev',
        instructionVersion: INSTRUCTION_VERSION,
      })
    })

    it('no inventa una versión observada', async () => {
      gateway()

      const { provenance } = okReply(await provider().evaluate(requestOf()))

      expect(provenance).not.toHaveProperty('observedVersion')
    })

    it('registra el modelo que respondió aunque no coincida con el pedido', async () => {
      gateway(({ body }) =>
        HttpResponse.json({
          model: 'otro/modelo',
          answers: answersFor(body.questions, {}),
        }),
      )

      const { provenance } = okReply(await provider().evaluate(requestOf()))

      expect(provenance.alias).toBe('typesafe-ai/jev')
      expect(provenance.respondedModel).toBe('otro/modelo')
    })

    it('si la respuesta no trae modelo, no se declara', async () => {
      gateway(({ body }) =>
        HttpResponse.json({ answers: answersFor(body.questions, {}) }),
      )

      const { provenance } = okReply(await provider().evaluate(requestOf()))

      expect(provenance).not.toHaveProperty('respondedModel')
    })

    it('no contiene texto de la consulta ni del proveedor', async () => {
      gateway(({ body }) =>
        HttpResponse.json({
          model: 'typesafe-ai/jev',
          answers: answersFor(body.questions, {}),
          provider_metadata: { gateway: { note: 'texto-del-proveedor' } },
        }),
      )

      const reply = await provider().evaluate(
        requestOf(PROFILE, plain({ context: 'Contexto privado' })),
      )

      const serialized = JSON.stringify(okReply(reply).provenance)
      expect(serialized).not.toContain('Contexto privado')
      expect(serialized).not.toContain(MESSAGE)
      expect(serialized).not.toContain('texto-del-proveedor')
    })
  })
})

// El runner de evaluación cuenta peticiones y tokens con esta función, sin red.
describe('gatewayBodies', () => {
  it('sin expediente es una sola petición con las quince preguntas', () => {
    const bodies = gatewayBodies(requestOf())

    expect(bodies.readings).toBeUndefined()
    expect(bodies.first.questions).toHaveLength(15)
  })

  it('con expediente son dos: A con cinco preguntas y B con las diez lecturas', () => {
    const bodies = gatewayBodies(requestOf(PROFILE))

    expect(bodies.first.questions).toHaveLength(5)
    expect(bodies.readings?.questions).toHaveLength(10)
    expect(JSON.stringify(bodies.first)).not.toContain('reportedTendencies')
    expect(bodies.readings?.input).toContain('reportedTendencies')
  })

  it('es lo que el adaptador envía por la red', async () => {
    const received = gateway()

    await provider().evaluate(requestOf(PROFILE))

    expect(received[0].body).toEqual(gatewayBodies(requestOf(PROFILE)).first)
  })
})

// Los experimentos miden las lecturas con expediente en todos los casos: no
// dependen de umbrales que todavía no existen (006-plan §5.1).
describe('lecturas siempre (modo de experimentos)', () => {
  const experimental = () =>
    createJevDecisionProvider({ apiKey: API_KEY, readings: { mode: 'always' } })

  it.each([
    ['indicios de seguridad', { [SAFETY]: 0.95 }],
    ['seguridad rechazada', { [SAFETY]: 'refusal' as const }],
    ['contexto insuficiente', { [SUFFICIENCY]: 0.1 }],
  ])('con %s pide las lecturas igualmente', async (_, overrides) => {
    const received = gateway(withOverrides(overrides))

    await experimental().evaluate(requestOf(PROFILE))

    expect(received).toHaveLength(2)
  })

  it('sin expediente sigue siendo una sola petición', async () => {
    const received = gateway()

    await experimental().evaluate(requestOf())

    expect(received).toHaveLength(1)
  })

  it('si B falla sigue siendo un error técnico', async () => {
    gateway((sent, index) =>
      index === 0
        ? withOverrides({})(sent)
        : new HttpResponse(null, { status: 503 }),
    )

    expect(await experimental().evaluate(requestOf(PROFILE))).toEqual({
      ok: false,
      retryable: true,
    })
  })
})
