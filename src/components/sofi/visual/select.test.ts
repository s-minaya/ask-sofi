import { describe, expect, it } from 'vitest'
import { selectVisual, wipeAfter, type SofiState } from './select'
import type { SofiAnimationId, SofiIntent } from './types'

const animation = (id: SofiAnimationId): SofiIntent => ({
  kind: 'animation',
  id,
})
const NONE: SofiIntent = { kind: 'none' }
const SOBER: SofiIntent = { kind: 'sober' }

describe('selectVisual: tabla del catálogo §5', () => {
  it.each<[string, SofiState, SofiIntent]>([
    ['reposo, sin intervención', {}, animation('sofi-blink')],
    ['habla de Sofi', { speaking: true }, animation('talking')],
    ['petición real pendiente', { processing: true }, animation('sofing')],
    [
      'carga real de la app o de una vista',
      { loading: true },
      animation('rolling'),
    ],
    [
      'necesita contexto',
      { outcome: { kind: 'needs_context' } },
      animation('needs-context'),
    ],
    [
      'error técnico ordinario',
      { outcome: { kind: 'error' } },
      animation('error'),
    ],
    [
      '«no sé más» o respuesta incierta',
      { feedback: 'uncertain' },
      animation('uncertain'),
    ],
    ['favorito guardado', { feedback: 'favorited' }, animation('favoriting')],
    ['borrado total efectivo', { wipe: true }, animation('memory-wipe')],
    [
      'seguridad no evaluada: sobria y estática',
      { safety: 'evaluation_unavailable' },
      SOBER,
    ],
    ['safety_concern: sin sprite', { safety: 'concern' }, NONE],
  ])('%s', (_case, state, expected) => {
    expect(selectVisual(state)).toEqual(expected)
  })

  it('`talking` depende de `speaking`, no de que se esté preguntando', () => {
    expect(selectVisual({ speaking: true })).toEqual(animation('talking'))
    // Una pausa del habla vuelve al reposo (la pose de pausa aprobada llega en AV5).
    expect(selectVisual({ speaking: false })).toEqual(animation('sofi-blink'))
  })

  describe('`interpreted`', () => {
    const interpreted: SofiState = {
      outcome: { kind: 'interpreted', signals: 2, tone: 'eureka' },
    }

    it('en producción se queda en reposo, aunque haya señales y tono', () => {
      expect(selectVisual(interpreted)).toEqual(animation('sofi-blink'))
      expect(selectVisual(interpreted, { lab: false })).toEqual(
        animation('sofi-blink'),
      )
    })

    it('con la marca del Lab elige `eureka` o `suspicious` según el tono pedido', () => {
      expect(selectVisual(interpreted, { lab: true })).toEqual(
        animation('eureka'),
      )
      expect(
        selectVisual(
          { outcome: { kind: 'interpreted', signals: 1, tone: 'suspicious' } },
          { lab: true },
        ),
      ).toEqual(animation('suspicious'))
    })

    it('no celebra un descubrimiento inexistente: sin señales o sin tono, reposo', () => {
      expect(
        selectVisual(
          { outcome: { kind: 'interpreted', signals: 0, tone: 'eureka' } },
          { lab: true },
        ),
      ).toEqual(animation('sofi-blink'))
      expect(
        selectVisual(
          { outcome: { kind: 'interpreted', signals: 3 } },
          { lab: true },
        ),
      ).toEqual(animation('sofi-blink'))
    })
  })

  describe('pasada única: al terminar se consulta el estado actual, sin cola', () => {
    it.each<[string, SofiState, SofiAnimationId]>([
      [
        'necesita contexto',
        { outcome: { kind: 'needs_context' } },
        'needs-context',
      ],
      ['error', { outcome: { kind: 'error' } }, 'error'],
      ['incertidumbre', { feedback: 'uncertain' }, 'uncertain'],
      ['favorito', { feedback: 'favorited' }, 'favoriting'],
    ])(
      '%s: al terminar queda la pose estable del reposo',
      (_case, state, id) => {
        expect(selectVisual(state)).toEqual(animation(id))
        expect(selectVisual({ ...state, settled: id })).toEqual(
          animation('sofi-blink'),
        )
      },
    )

    it('`eureka` terminada pasa a `talking` si Sofi está hablando', () => {
      const state: SofiState = {
        outcome: { kind: 'interpreted', signals: 1, tone: 'eureka' },
        speaking: true,
      }
      expect(selectVisual(state, { lab: true })).toEqual(animation('eureka'))
      expect(
        selectVisual({ ...state, settled: 'eureka' }, { lab: true }),
      ).toEqual(animation('talking'))
    })

    it('lo que ya terminó no vuelve a reproducirse ni se encola tras otra cosa', () => {
      // Un error pendiente se sustituye por la nueva petición...
      expect(
        selectVisual({ outcome: { kind: 'error' }, processing: true }),
      ).toEqual(animation('sofing'))
      // ...y el estado que llega después manda: no se reproduce el error vencido.
      expect(
        selectVisual({ outcome: { kind: 'interpreted', signals: 0 } }),
      ).toEqual(animation('sofi-blink'))
    })
  })
})

describe('selectVisual: jerarquía del catálogo §6.1', () => {
  // Cada fila: el estado combinado y lo que debe prevalecer.
  it.each<[string, SofiState, SofiIntent]>([
    [
      'procesar prevalece sobre habla, resultado anterior y feedback',
      {
        processing: true,
        speaking: true,
        outcome: { kind: 'needs_context' },
        feedback: 'favorited',
      },
      animation('sofing'),
    ],
    [
      'la carga prevalece sobre procesar',
      { loading: true, processing: true },
      animation('rolling'),
    ],
    [
      'la reacción al resultado va antes que el habla',
      { outcome: { kind: 'needs_context' }, speaking: true },
      animation('needs-context'),
    ],
    [
      '`uncertain` cede ante la intervención hablada (ficha 014)',
      { speaking: true, feedback: 'uncertain' },
      animation('talking'),
    ],
    [
      'el habla no corta `favoriting`: su ficha no la lista entre las interrupciones',
      { speaking: true, feedback: 'favorited' },
      animation('favoriting'),
    ],
    [
      'terminada la pasada de `favoriting`, sigue `talking`',
      { speaking: true, feedback: 'favorited', settled: 'favoriting' },
      animation('talking'),
    ],
    [
      'el borrado efectivo prevalece sobre el flujo',
      {
        wipe: true,
        processing: true,
        speaking: true,
        outcome: { kind: 'error' },
      },
      animation('memory-wipe'),
    ],
    [
      'seguridad no evaluada prevalece sobre un error cómico y sobre el borrado',
      {
        safety: 'evaluation_unavailable',
        outcome: { kind: 'error' },
        wipe: true,
        speaking: true,
      },
      SOBER,
    ],
    [
      'safety_concern cancela cualquier otra cosa',
      {
        safety: 'concern',
        wipe: true,
        processing: true,
        loading: true,
        speaking: true,
        outcome: { kind: 'error' },
        feedback: 'favorited',
      },
      NONE,
    ],
  ])('%s', (_case, state, expected) => {
    expect(selectVisual(state, { lab: true })).toEqual(expected)
  })
})

describe('selectVisual: matriz de interrupción del catálogo §6.3', () => {
  const everything: SofiState = {
    quickExit: true,
    safety: 'evaluation_unavailable',
    wipe: true,
    loading: true,
    processing: true,
    speaking: true,
    outcome: { kind: 'error' },
    feedback: 'favorited',
  }

  it('la salida rápida no anima nada, ni siquiera `memory-wipe`', () => {
    expect(selectVisual(everything)).toEqual(NONE)
    expect(selectVisual({ quickExit: true, wipe: true })).toEqual(NONE)
  })

  it('`memory-wipe` solo sale con el borrado efectivo y nunca en la salida rápida', () => {
    const outcomes: SofiState['outcome'][] = [
      undefined,
      { kind: 'error' },
      { kind: 'needs_context' },
      { kind: 'interpreted', signals: 2, tone: 'eureka' },
    ]
    const flags = [false, true]
    let evaluated = 0

    for (const quickExit of flags)
      for (const wipe of flags)
        for (const loading of flags)
          for (const processing of flags)
            for (const speaking of flags)
              for (const safety of [
                undefined,
                'concern',
                'evaluation_unavailable',
              ] as const)
                for (const outcome of outcomes)
                  for (const feedback of [
                    undefined,
                    'uncertain',
                    'favorited',
                  ] as const)
                    for (const lab of flags) {
                      const intent = selectVisual(
                        {
                          quickExit,
                          wipe,
                          loading,
                          processing,
                          speaking,
                          safety,
                          outcome,
                          feedback,
                        },
                        { lab },
                      )
                      evaluated++
                      const isWipe =
                        intent.kind === 'animation' &&
                        intent.id === 'memory-wipe'
                      if (isWipe) {
                        expect(wipe).toBe(true)
                        expect(quickExit).toBe(false)
                        expect(safety).toBeUndefined()
                      }
                      // `eureka` y `suspicious` solo existen en el Lab.
                      if (
                        !lab &&
                        intent.kind === 'animation' &&
                        (intent.id === 'eureka' || intent.id === 'suspicious')
                      )
                        throw new Error('eureka o suspicious en producción')
                      // Con seguridad en juego o salida rápida no hay humor ni glitch.
                      if ((quickExit || safety) && intent.kind === 'animation')
                        throw new Error(
                          'animación con seguridad o salida rápida',
                        )
                    }

    expect(evaluated).toBe(2 ** 5 * 3 * 4 * 3 * 2)
  })

  it('`safety_concern` y la seguridad no evaluada nunca muestran `error` ni humor', () => {
    for (const safety of ['concern', 'evaluation_unavailable'] as const) {
      const intent = selectVisual({ safety, outcome: { kind: 'error' } })
      expect(intent.kind).not.toBe('animation')
    }
  })

  it('una nueva consulta invalida la reacción anterior y no se solapan', () => {
    const before: SofiState = { outcome: { kind: 'needs_context' } }
    expect(selectVisual(before)).toEqual(animation('needs-context'))
    expect(selectVisual({ ...before, processing: true })).toEqual(
      animation('sofing'),
    )
  })
})

describe('borrado total: dos señales (D-15, D-16)', () => {
  it('el borrado efectivo inicia `memory-wipe` y el fin de la confirmación vuelve a neutral', () => {
    expect(selectVisual({})).toEqual(animation('sofi-blink'))

    const erased = wipeAfter('data-erased')
    expect(selectVisual({ wipe: erased })).toEqual(animation('memory-wipe'))

    // Nada espera a la animación: la señal de fin manda aunque el recurso no haya terminado.
    const ended = wipeAfter('confirmation-ended')
    expect(selectVisual({ wipe: ended })).toEqual(animation('sofi-blink'))
  })
})
