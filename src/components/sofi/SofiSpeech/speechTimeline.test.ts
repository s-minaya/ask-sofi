import { describe, expect, it } from 'vitest'
import {
  charKind,
  completeStep,
  DEFAULT_SPEECH_TIMING,
  delayAfter,
  INITIAL_STEP,
  nextStep,
  type SpeechStep,
} from './speechTimeline'

function run(text: string): SpeechStep[] {
  const steps: SpeechStep[] = []
  let step = INITIAL_STEP
  while (step.status !== 'done') {
    step = nextStep(text, step)
    steps.push(step)
  }
  return steps
}

describe('speechTimeline', () => {
  it('clasifica pausas largas, cortas, espacios y letras', () => {
    expect(['.', '…', ':', '?', '!'].map(charKind)).toEqual(
      Array(5).fill('long-pause'),
    )
    expect([',', ';'].map(charKind)).toEqual(['short-pause', 'short-pause'])
    expect(charKind(' ')).toBe('space')
    expect(charKind('a')).toBe('letter')
    expect(charKind('«')).toBe('letter')
  })

  it('respira más tras un punto que tras una coma', () => {
    expect(delayAfter('long-pause', DEFAULT_SPEECH_TIMING)).toBe(360)
    expect(delayAfter('short-pause', DEFAULT_SPEECH_TIMING)).toBe(170)
    expect(delayAfter('letter', DEFAULT_SPEECH_TIMING)).toBe(28)
    expect(delayAfter('space', DEFAULT_SPEECH_TIMING)).toBe(28)
  })

  it('revela un carácter cada vez hasta completar el texto', () => {
    const steps = run('Vale.')

    expect(steps.map((step) => step.index)).toEqual([1, 2, 3, 4, 5])
    expect(steps.at(-1)).toEqual(completeStep('Vale.'))
  })

  it('la voz suena con las letras, sigue en los espacios y calla en cada pausa', () => {
    const steps = run('Ya, sí.')
    // Y a , ␠ s í .
    expect(steps.map((step) => step.speaking)).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
      false,
    ])
    expect(steps.map((step) => step.status)).toEqual([
      'typing',
      'typing',
      'pause',
      'typing',
      'typing',
      'typing',
      'done',
    ])
  })

  it('un texto vacío termina en el primer paso', () => {
    expect(nextStep('', INITIAL_STEP)).toEqual({
      index: 0,
      status: 'done',
      speaking: false,
    })
  })
})
