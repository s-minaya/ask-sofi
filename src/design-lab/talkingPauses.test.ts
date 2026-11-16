import { describe, expect, it } from 'vitest'
import {
  APPROVED_TALKING,
  PAUSE_OPTIONS,
  phaseOf,
  jumpBetween,
  talkingView,
  type PausePolicy,
} from './talkingPauses'

// T070: las alternativas de pausa de `talking` (catálogo, ficha 004) y el paso
// `blink → talking`. Lógica pura del prototipo; lo que se ve se comprueba en el navegador.

const POLICIES: PausePolicy[] = ['blink', 'freeze', 'closed']

describe('PAUSE_OPTIONS', () => {
  it('compara las dos alternativas del catálogo, con la boca quieta en dos versiones', () => {
    expect(PAUSE_OPTIONS.map((option) => option.value)).toEqual(POLICIES)
  })
})

describe('APPROVED_TALKING', () => {
  it('es la combinación aprobada en AV5: congelada en la pausa, blink al terminar, espera al parpadeo', () => {
    expect(APPROVED_TALKING).toEqual({
      pause: 'freeze',
      end: 'blink',
      start: 'eyes-open',
    })
    expect(talkingView('pause', APPROVED_TALKING)).toEqual({
      animation: 'talking',
      hold: 'freeze',
    })
    expect(talkingView('done', APPROVED_TALKING)).toEqual({
      animation: 'sofi-blink',
      hold: 'none',
    })
  })
})

describe('phaseOf', () => {
  it('antes de la primera letra Sofi aún no ha hablado', () => {
    expect(phaseOf('idle', false)).toBe('before')
  })

  it('mientras suena la voz habla, en cualquier estado', () => {
    expect(phaseOf('typing', true)).toBe('speaking')
  })

  it('callada a mitad de texto es una pausa; al terminar, el final', () => {
    expect(phaseOf('pause', false)).toBe('pause')
    expect(phaseOf('typing', false)).toBe('pause')
    expect(phaseOf('done', false)).toBe('done')
  })
})

describe('talkingView', () => {
  it('antes de hablar, el reposo de sofi-blink en las tres', () => {
    for (const pause of POLICIES)
      expect(talkingView('before', { pause, end: 'pause' })).toEqual({
        animation: 'sofi-blink',
        hold: 'none',
      })
  })

  it('mientras habla, talking en marcha en las tres', () => {
    for (const pause of POLICIES)
      expect(talkingView('speaking', { pause, end: 'pause' })).toEqual({
        animation: 'talking',
        hold: 'none',
      })
  })

  it('en una pausa: vuelta a blink, talking congelado o talking con la boca cerrada', () => {
    const view = (pause: PausePolicy) =>
      talkingView('pause', { pause, end: 'pause' })
    expect(view('blink')).toEqual({ animation: 'sofi-blink', hold: 'none' })
    expect(view('freeze')).toEqual({ animation: 'talking', hold: 'freeze' })
    expect(view('closed')).toEqual({ animation: 'talking', hold: 'closed' })
  })

  it('al terminar, lo mismo que en la pausa (spec §2) o, para compararlo, sofi-blink', () => {
    for (const pause of POLICIES) {
      expect(talkingView('done', { pause, end: 'pause' })).toEqual(
        talkingView('pause', { pause, end: 'pause' }),
      )
      expect(talkingView('done', { pause, end: 'blink' })).toEqual({
        animation: 'sofi-blink',
        hold: 'none',
      })
    }
  })
})

describe('jumpBetween', () => {
  it('sin cambio de ojos ni de boca no hay salto', () => {
    expect(jumpBetween({ eyes: 0, mouth: 0 }, { eyes: 0, mouth: 0 })).toEqual({
      eyes: false,
      mouth: false,
    })
  })

  it('detecta por separado el salto de ojos y el de boca', () => {
    expect(jumpBetween({ eyes: 2, mouth: 0 }, { eyes: 0, mouth: 0 })).toEqual({
      eyes: true,
      mouth: false,
    })
    expect(jumpBetween({ eyes: 0, mouth: 3 }, { eyes: 0, mouth: 0 })).toEqual({
      eyes: false,
      mouth: true,
    })
  })

  it('sin lectura (jsdom, o una capa sin pista) no afirma nada', () => {
    expect(
      jumpBetween({ eyes: null, mouth: 0 }, { eyes: 0, mouth: 0 }),
    ).toEqual({ eyes: null, mouth: false })
  })
})
