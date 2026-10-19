import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  answersFor,
  API_KEY,
  gateway,
  SAFETY,
  withOverrides,
} from '../../../src/test/jevGateway.ts'
import { INSTRUCTION_VERSION } from '../../../src/infrastructure/ai/jevQuestions.ts'
import { FIXTURES } from '../fixtures/cases.ts'
import type { Fixture } from '../fixtures/types.ts'
import { parseArguments } from './arguments.ts'
import { estimatePlan, INPUT_PRICE_USD_PER_MILLION_TOKENS } from './estimate.ts'
import { runLive } from './live.ts'
import { buildPlan } from './plan.ts'

const fixture = (id: string, extra: Partial<Fixture> = {}): Fixture => ({
  id,
  source: 'new',
  message: 'Vale.',
  english: { message: 'Okay.' },
  design: [],
  canary: false,
  labels: null,
  ...extra,
})

describe('buildPlan', () => {
  const cases = [
    fixture('a'),
    fixture('b', {
      context: 'Cancelé la cena.',
      english: { message: 'Okay.', context: 'I cancelled dinner.' },
      canary: true,
    }),
    fixture('c', { profile: { sarcasm: 'often' }, canary: true }),
  ]

  it('una entrada por caso, brazo y repetición', () => {
    const plan = buildPlan(cases, {
      arms: ['english', 'spanish'],
      repetitions: 3,
      profile: 'none',
    })

    expect(plan).toHaveLength(3 * 2 * 3)
    expect(new Set(plan.map(({ key }) => key)).size).toBe(plan.length)
  })

  it('el brazo inglés usa la referencia y el español, el original', () => {
    const plan = buildPlan([cases[1]], {
      arms: ['english', 'spanish'],
      repetitions: 1,
      profile: 'none',
    })

    expect(plan[0].request.assessment).toEqual({
      message: 'Okay.',
      context: 'I cancelled dinner.',
    })
    expect(plan[1].request.assessment).toEqual({
      message: 'Vale.',
      context: 'Cancelé la cena.',
    })
  })

  it('sin expediente (E2) ninguna petición lo lleva, aunque el caso lo tenga', () => {
    const plan = buildPlan(cases, {
      arms: ['english'],
      repetitions: 1,
      profile: 'none',
    })

    for (const { request } of plan)
      expect(request.readings).not.toHaveProperty('profile')
  })

  it('con expediente (E4) solo entran los casos que lo tienen, y solo en las lecturas', () => {
    const plan = buildPlan(cases, {
      arms: ['english'],
      repetitions: 1,
      profile: 'as-is',
    })

    expect(plan.map(({ fixtureId }) => fixtureId)).toEqual(['c'])
    expect(plan[0].request.readings.profile).toEqual({ sarcasm: 'often' })
    expect(plan[0].request.assessment).not.toHaveProperty('profile')
  })

  it('el subconjunto canario filtra los casos', () => {
    const plan = buildPlan(cases, {
      arms: ['english'],
      repetitions: 1,
      profile: 'none',
      only: 'canary',
    })

    expect(plan.map(({ fixtureId }) => fixtureId)).toEqual(['b', 'c'])
  })

  it('con los casos reales: E2 son 57 × 2 brazos × 3 repeticiones', () => {
    const plan = buildPlan(FIXTURES, {
      arms: ['english', 'spanish'],
      repetitions: 3,
      profile: 'none',
    })

    expect(plan).toHaveLength(FIXTURES.length * 6)
  })

  it('es pura: no modifica los casos', () => {
    const before = structuredClone(cases)

    buildPlan(cases, { arms: ['english'], repetitions: 2, profile: 'as-is' })

    expect(cases).toEqual(before)
  })
})

describe('estimatePlan', () => {
  const config = {
    arms: ['english'] as ('english' | 'spanish')[],
    repetitions: 1,
    profile: 'none' as const,
  }

  it('cuenta una petición por análisis sin expediente', () => {
    const estimate = estimatePlan(
      buildPlan([fixture('a'), fixture('b')], config),
    )

    expect(estimate.analyses).toBe(2)
    expect(estimate.maxRequests).toBe(2)
  })

  it('con expediente cuenta como máximo dos peticiones por análisis', () => {
    const estimate = estimatePlan(
      buildPlan([fixture('a', { profile: { sarcasm: 'often' } })], {
        ...config,
        profile: 'as-is',
      }),
    )

    expect(estimate.analyses).toBe(1)
    expect(estimate.maxRequests).toBe(2)
  })

  it('estima los tokens con el tamaño real de las peticiones y el coste con el precio de jev.md', () => {
    const estimate = estimatePlan(buildPlan([fixture('a')], config))

    expect(estimate.estimatedTokens).toBeGreaterThan(500)
    expect(estimate.estimatedCostUsd).toBeCloseTo(
      (estimate.estimatedTokens * INPUT_PRICE_USD_PER_MILLION_TOKENS) /
        1_000_000,
      12,
    )
    // jev.md §4.3: 0,042 $ por millón de tokens de entrada; la salida no se cobra.
    expect(INPUT_PRICE_USD_PER_MILLION_TOKENS).toBe(0.042)
  })

  it('escala con repeticiones y brazos', () => {
    const one = estimatePlan(buildPlan(FIXTURES, config))
    const six = estimatePlan(
      buildPlan(FIXTURES, {
        arms: ['english', 'spanish'],
        repetitions: 3,
        profile: 'none',
      }),
    )

    expect(six.maxRequests).toBe(one.maxRequests * 6)
    expect(six.estimatedCostUsd).toBeGreaterThan(one.estimatedCostUsd * 5)
  })

  it('la ejecución base real cabe con holgura en el tope de 0,25 $ de 006-plan §5.2', () => {
    const base = estimatePlan(
      buildPlan(FIXTURES, {
        arms: ['english', 'spanish'],
        repetitions: 3,
        profile: 'none',
      }),
    )

    expect(base.estimatedCostUsd).toBeLessThan(0.25)
  })
})

describe('runLive', () => {
  const plan = buildPlan([fixture('a'), fixture('b'), fixture('c')], {
    arms: ['english'],
    repetitions: 1,
    profile: 'none',
  })
  const limits = { maxRequests: 50, maxCostUsd: 1 }
  const run = (options: Partial<Parameters<typeof runLive>[1]> = {}) =>
    runLive(plan, {
      apiKey: API_KEY,
      ...limits,
      ...options,
    })

  it('ejecuta cada análisis y guarda la respuesta bruta de cada pregunta', async () => {
    gateway()

    const report = await run()

    expect(report.halted).toBeUndefined()
    expect(report.entries).toHaveLength(3)
    const [first] = report.entries
    expect(first.exchanges).toHaveLength(1)
    expect(first.exchanges[0].status).toBe(200)
    expect(first.exchanges[0].answers).toHaveLength(15)
    expect(first.exchanges[0].answers[0]).toMatchObject({ type: 'predicate' })
    expect(first.exchanges[0].latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('el informe lleva fecha, alias, modelo que respondió, versión observada y de instrucciones', async () => {
    gateway()

    const report = await run()

    expect(report.requestedModel).toBe('typesafe-ai/jev')
    expect(report.respondedModels).toEqual(['typesafe-ai/jev'])
    expect(report.observedVersion).toBe('unknown')
    expect(report.instructionVersion).toBe(INSTRUCTION_VERSION)
    expect(report.routing).toEqual({
      only: ['typesafe-ai'],
      disallowPromptTraining: true,
    })
    expect(report.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(report.requests).toBe(3)
  })

  it('el informe nunca contiene la credencial', async () => {
    gateway()

    const report = await run()

    expect(JSON.stringify(report)).not.toContain(API_KEY)
  })

  it('suma el coste que devuelve la respuesta', async () => {
    gateway(({ body }) =>
      HttpResponse.json({
        model: 'typesafe-ai/jev',
        answers: answersFor(body.questions, {}),
        provider_metadata: { gateway: { cost: '0.0000096' } },
      }),
    )

    const report = await run()

    expect(report.costUsd).toBeCloseTo(0.0000288, 10)
    expect(report.costSource).toBe('reported')
  })

  it('sin coste en la respuesta usa la estimación y lo declara', async () => {
    gateway()

    const report = await run()

    expect(report.costSource).toBe('estimated')
    expect(report.costUsd).toBeGreaterThan(0)
  })

  it('se detiene al llegar al tope de peticiones, sin superarlo', async () => {
    const received = gateway()

    const report = await run({ maxRequests: 2 })

    expect(received).toHaveLength(2)
    expect(report.entries).toHaveLength(2)
    expect(report.halted).toBe('max_requests')
  })

  it('se detiene al llegar al tope de coste acumulado', async () => {
    const received = gateway(({ body }) =>
      HttpResponse.json({
        model: 'typesafe-ai/jev',
        answers: answersFor(body.questions, {}),
        provider_metadata: { gateway: { cost: '0.01' } },
      }),
    )

    const report = await run({ maxCostUsd: 0.015 })

    // La segunda cruza el tope; la tercera ya no se envía (tope blando).
    expect(received).toHaveLength(2)
    expect(report.halted).toBe('max_cost')
  })

  it.each([401, 402, 403])(
    'ante el primer %i se detiene y no reintenta',
    async (status) => {
      const received = gateway(() =>
        HttpResponse.json({ error: {} }, { status }),
      )

      const report = await run()

      expect(received).toHaveLength(1)
      expect(report.halted).toBe(`status_${status}`)
      expect(report.entries).toHaveLength(1)
    },
  )

  it('un 429 o un 500 no detienen la ejecución ni se reintentan', async () => {
    const received = gateway((sent, index) =>
      index === 0
        ? HttpResponse.json({}, { status: 429 })
        : withOverrides({})(sent),
    )

    const report = await run()

    expect(received).toHaveLength(3)
    expect(report.entries[0].exchanges[0].status).toBe(429)
    expect(report.halted).toBeUndefined()
  })

  it('con expediente cuenta las dos peticiones contra el tope antes de enviarlas', async () => {
    const withProfile = buildPlan(
      [fixture('a', { profile: { sarcasm: 'often' } })],
      { arms: ['english'], repetitions: 1, profile: 'as-is' },
    )
    const received = gateway()

    const report = await runLive(withProfile, {
      apiKey: API_KEY,
      maxRequests: 1,
      maxCostUsd: 1,
    })

    expect(received).toHaveLength(0)
    expect(report.halted).toBe('max_requests')
  })

  it('rechaza ejecutar sin credencial o sin topes', async () => {
    gateway()

    await expect(run({ apiKey: '' })).rejects.toThrow(/credencial/i)
    await expect(run({ maxRequests: 0 })).rejects.toThrow(/tope/i)
    await expect(run({ maxCostUsd: 0 })).rejects.toThrow(/tope/i)
  })

  it('la seguridad rechazada se registra como respuesta bruta, sin interpretarla', async () => {
    gateway(withOverrides({ [SAFETY]: 'refusal' }))

    const report = await run()

    const refusal = report.entries[0].exchanges[0].answers.find(
      (answer) => answer.name === SAFETY,
    )
    expect(refusal).toMatchObject({ type: 'refusal' })
  })
})

describe('parseArguments', () => {
  it('por defecto es en seco: nada se envía', () => {
    expect(parseArguments([], {})).toEqual({
      mode: 'dry',
      plan: { arms: ['english', 'spanish'], repetitions: 3, profile: 'none' },
    })
  })

  it('--live sin credencial se rechaza', () => {
    expect(() =>
      parseArguments(
        ['--live', '--max-requests', '10', '--max-cost-usd', '0.05'],
        {},
      ),
    ).toThrow(/AI_GATEWAY_API_KEY/)
  })

  it.each([
    [['--live', '--max-cost-usd', '0.05'], /--max-requests/],
    [['--live', '--max-requests', '10'], /--max-cost-usd/],
    [
      ['--live', '--max-requests', '0', '--max-cost-usd', '0.05'],
      /--max-requests/,
    ],
    [
      ['--live', '--max-requests', '10', '--max-cost-usd', '-1'],
      /--max-cost-usd/,
    ],
  ])('--live exige topes válidos (%j)', (argv, message) => {
    expect(() => parseArguments(argv, { AI_GATEWAY_API_KEY: API_KEY })).toThrow(
      message,
    )
  })

  it('--live con credencial y topes pasa a modo en vivo', () => {
    const parsed = parseArguments(
      ['--live', '--max-requests', '10', '--max-cost-usd', '0.05'],
      { AI_GATEWAY_API_KEY: API_KEY },
    )

    expect(parsed).toMatchObject({
      mode: 'live',
      limits: { maxRequests: 10, maxCostUsd: 0.05 },
    })
  })

  it('admite brazos, repeticiones, expediente y canario', () => {
    expect(
      parseArguments(
        [
          '--arms',
          'english',
          '--repetitions',
          '1',
          '--profile',
          'as-is',
          '--only',
          'canary',
        ],
        {},
      ),
    ).toEqual({
      mode: 'dry',
      plan: {
        arms: ['english'],
        repetitions: 1,
        profile: 'as-is',
        only: 'canary',
      },
    })
  })

  it.each([
    [['--arms', 'french']],
    [['--repetitions', '0']],
    [['--profile', 'maybe']],
    [['--only', 'all']],
    [['--desconocido']],
  ])('rechaza argumentos inválidos (%j)', (argv) => {
    expect(() => parseArguments(argv, {})).toThrow()
  })
})
