import { describe, expect, it } from 'vitest'
import { selectVisual } from '../components/sofi/visual/select'
import {
  createScenarioState,
  intentLabel,
  intentOf,
  isCalm,
  scenarioReducer,
  type ScenarioAction,
  type ScenarioState,
} from './scenarioLab'

// T064: el Lab simula, en local, lo que emitirán los dueños del estado (007, 009). Aquí solo se
// comprueba que las señales llegan a `selectVisual` y que lo que se ve es lo que éste decide:
// ninguna regla de prioridad ni de recurso vive en el Lab.

const run = (...actions: ScenarioAction[]): ScenarioState =>
  actions.reduce(scenarioReducer, createScenarioState())
const seen = (state: ScenarioState) => state.history

describe('escenarios de eventos del contrato', () => {
  it('empieza en reposo y no inventa nada', () => {
    const state = createScenarioState()
    expect(intentLabel(intentOf(state))).toBe('sofi-blink')
    expect(state.history).toEqual(['sofi-blink'])
    expect(state.log).toEqual([])
  })

  it('habla y calla: blink → talking → blink', () => {
    const state = run(
      { type: 'speaking', value: true },
      { type: 'speaking', value: false },
    )
    expect(seen(state)).toEqual(['sofi-blink', 'talking', 'sofi-blink'])
  })

  it('«Ver todo» corta el habla y deja el reposo', () => {
    const state = run({ type: 'speaking', value: true }, { type: 'show-all' })
    expect(intentLabel(intentOf(state))).toBe('sofi-blink')
    expect(state.signals.speaking).toBe(false)
  })

  it('petición pendiente: sofing, y una nueva invalida la reacción anterior', () => {
    const state = run(
      { type: 'request-done', outcome: 'error' },
      { type: 'request-pending' },
    )
    expect(intentLabel(intentOf(state))).toBe('sofing')
    expect(state.signals.outcome).toBeUndefined()
    expect(state.signals.speaking).toBe(false)
  })

  it.each([
    ['needs_context', 'needs-context'],
    ['error', 'error'],
    ['interpreted-none', 'sofi-blink'],
    ['interpreted-eureka', 'eureka'],
    ['interpreted-suspicious', 'suspicious'],
  ] as const)('processing → resultado «%s» pinta %s', (outcome, expected) => {
    const state = run(
      { type: 'request-pending' },
      { type: 'request-done', outcome },
    )
    expect(seen(state).slice(0, 3)).toEqual([
      'sofi-blink',
      'sofing',
      expected === 'sofi-blink' ? 'sofi-blink' : expected,
    ])
    expect(intentLabel(intentOf(state))).toBe(expected)
  })

  it('el tono de eureka y suspicious lo elige quien prueba: no se infiere de nada', () => {
    const eureka = run({ type: 'request-done', outcome: 'interpreted-eureka' })
    const suspicious = run({
      type: 'request-done',
      outcome: 'interpreted-suspicious',
    })
    expect(eureka.signals.outcome).toEqual({
      kind: 'interpreted',
      signals: 1,
      tone: 'eureka',
    })
    expect(suspicious.signals.outcome).toEqual({
      kind: 'interpreted',
      signals: 1,
      tone: 'suspicious',
    })
    // Sin señales comunicables no hay descubrimiento que celebrar.
    expect(
      run({ type: 'request-done', outcome: 'interpreted-none' }).signals
        .outcome,
    ).toEqual({ kind: 'interpreted', signals: 0 })
  })

  it('una pasada única que termina deja el reposo; lo que llega tarde se ignora', () => {
    const base = run({ type: 'request-done', outcome: 'needs_context' })
    expect(intentLabel(intentOf(base))).toBe('needs-context')

    const ended = scenarioReducer(base, {
      type: 'one-pass-ended',
      id: 'needs-context',
    })
    expect(intentLabel(intentOf(ended))).toBe('sofi-blink')

    // El fin de una animación que ya no se muestra no cambia nada: se consulta el estado actual.
    const stale = scenarioReducer(run({ type: 'request-pending' }), {
      type: 'one-pass-ended',
      id: 'needs-context',
    })
    expect(intentLabel(intentOf(stale))).toBe('sofing')
    expect(stale.signals.settled).toBeUndefined()
  })

  it('needs-context → uncertain: «No sé más» sustituye al resultado', () => {
    const state = run(
      { type: 'request-done', outcome: 'needs_context' },
      { type: 'one-pass-ended', id: 'needs-context' },
      { type: 'dont-know' },
      { type: 'one-pass-ended', id: 'uncertain' },
    )
    expect(seen(state)).toEqual([
      'sofi-blink',
      'needs-context',
      'sofi-blink',
      'uncertain',
      'sofi-blink',
    ])
  })

  it('favoriting → blink: una vez por guardado', () => {
    const state = run(
      { type: 'favorite-saved' },
      { type: 'one-pass-ended', id: 'favoriting' },
    )
    expect(seen(state)).toEqual(['sofi-blink', 'favoriting', 'sofi-blink'])
    // Un guardado nuevo vuelve a reproducirla.
    expect(
      intentLabel(intentOf(scenarioReducer(state, { type: 'favorite-saved' }))),
    ).toBe('favoriting')
  })

  it('el habla cede ante una reacción que no la lista entre sus interrupciones', () => {
    const state = run(
      { type: 'speaking', value: true },
      { type: 'favorite-saved' },
    )
    expect(intentLabel(intentOf(state))).toBe('favoriting')
    expect(
      intentLabel(
        intentOf(
          scenarioReducer(state, { type: 'one-pass-ended', id: 'favoriting' }),
        ),
      ),
    ).toBe('talking')
  })
})

describe('privacidad: el orden de las señales, sin persistencia simulada', () => {
  it('borrado efectivo → memory-wipe, y solo el fin de su confirmación vuelve a neutral', () => {
    const erased = run({ type: 'wipe', signal: 'data-erased' })
    expect(intentLabel(intentOf(erased))).toBe('memory-wipe')

    // Que la animación acabe no devuelve a neutral: lo hace la señal funcional.
    const animationEnded = scenarioReducer(erased, {
      type: 'one-pass-ended',
      id: 'memory-wipe',
    })
    expect(intentLabel(intentOf(animationEnded))).toBe('memory-wipe')

    const confirmed = scenarioReducer(animationEnded, {
      type: 'wipe',
      signal: 'confirmation-ended',
    })
    expect(seen(confirmed)).toEqual(['sofi-blink', 'memory-wipe', 'sofi-blink'])
  })

  it('el borrado no deja nada de lo anterior: el contenido borrado no se rehidrata', () => {
    const state = run(
      { type: 'request-done', outcome: 'error' },
      { type: 'speaking', value: true },
      { type: 'wipe', signal: 'data-erased' },
      { type: 'wipe', signal: 'confirmation-ended' },
    )
    expect(state.signals).toEqual({ wipe: false })
    expect(intentLabel(intentOf(state))).toBe('sofi-blink')
  })

  it('el registro cuenta el orden del contrato: primero el borrado real, luego la señal', () => {
    const erased = run({ type: 'wipe', signal: 'data-erased' })
    const texts = erased.log.map((entry) => entry.text)
    expect(texts[0]).toMatch(/borrado real/i)
    expect(texts[0]).toMatch(/no borra nada|no se borra nada/i)
    expect(texts[1]).toMatch(/data-erased/)
    expect(texts.join(' ')).not.toMatch(/guardado|almacenamiento borrado/i)
    expect(erased.log.map((entry) => entry.id)).toEqual([1, 2])
  })

  it('salida rápida: sin sprite, y antes que cualquier efecto se oculta y se cancela', () => {
    const state = run(
      { type: 'request-done', outcome: 'needs_context' },
      { type: 'quick-exit' },
    )
    expect(intentLabel(intentOf(state))).toBe('sin sprite')
    const texts = state.log.map((entry) => entry.text)
    expect(texts.slice(-3)).toEqual([
      expect.stringMatching(/oculto.*simulado/i),
      expect.stringMatching(/controladores cancelados/i),
      expect.stringMatching(/sin sprite ni animación/i),
    ])
  })

  it('salida rápida: jamás memory-wipe, aunque llegue un borrado después', () => {
    const state = run(
      { type: 'quick-exit' },
      { type: 'wipe', signal: 'data-erased' },
    )
    expect(intentLabel(intentOf(state))).toBe('sin sprite')
  })
})

describe('prioridades de seguridad', () => {
  it.each([
    ['concern', 'sin sprite'],
    ['evaluation_unavailable', 'sobria'],
  ] as const)(
    'safety %s prevalece sobre habla, petición, resultado, favorito y borrado',
    (safety, expected) => {
      const state = run(
        { type: 'safety', value: safety },
        { type: 'speaking', value: true },
        { type: 'request-pending' },
        { type: 'request-done', outcome: 'error' },
        { type: 'favorite-saved' },
        { type: 'wipe', signal: 'data-erased' },
      )
      expect(intentLabel(intentOf(state))).toBe(expected)
    },
  )

  it('al quitar la seguridad se representa el estado actual, sin cola de lo vencido', () => {
    const state = run(
      { type: 'safety', value: 'concern' },
      { type: 'speaking', value: true },
      { type: 'safety', value: undefined },
    )
    expect(intentLabel(intentOf(state))).toBe('talking')
  })

  it('lo que se ve sale siempre de selectVisual', () => {
    const state = run(
      { type: 'request-pending' },
      { type: 'request-done', outcome: 'interpreted-eureka' },
    )
    expect(intentOf(state)).toEqual(selectVisual(state.signals, { lab: true }))
  })
})

describe('escena tranquila para los gags', () => {
  it('solo en reposo: cualquier otra representación o prioridad cancela los gags', () => {
    expect(isCalm(intentOf(createScenarioState()))).toBe(true)
    for (const action of [
      { type: 'speaking', value: true },
      { type: 'request-pending' },
      { type: 'favorite-saved' },
      { type: 'wipe', signal: 'data-erased' },
      { type: 'quick-exit' },
      { type: 'safety', value: 'concern' },
      { type: 'safety', value: 'evaluation_unavailable' },
    ] as const) {
      expect(isCalm(intentOf(run(action)))).toBe(false)
    }
  })
})

describe('reiniciar', () => {
  it('vuelve al reposo y vacía el registro y el historial', () => {
    const state = run(
      { type: 'request-done', outcome: 'error' },
      { type: 'reset' },
    )
    expect(state).toEqual(createScenarioState())
  })

  it('el historial no crece sin límite', () => {
    let state = createScenarioState()
    for (let i = 0; i < 100; i++)
      state = scenarioReducer(state, {
        type: 'speaking',
        value: i % 2 === 0,
      })
    expect(state.history.length).toBeLessThanOrEqual(12)
    expect(state.log.length).toBeLessThanOrEqual(30)
  })
})
