import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPEECH_TIMING,
  type SpeechState,
} from '../components/sofi/SofiSpeech/speechTimeline'
import {
  SPEECH_TEXTS,
  createMotionLabState,
  formatElapsed,
  motionLabReducer,
  speechText,
  type MotionLabAction,
  type MotionLabState,
} from './motionLab'

function run(
  actions: ReadonlyArray<MotionLabAction>,
  state: MotionLabState = createMotionLabState(),
) {
  return actions.reduce(motionLabReducer, state)
}

function step(
  index: number,
  status: SpeechState['status'],
  speaking = false,
): SpeechState {
  return { index, length: SPEECH_TEXTS.answer.length, status, speaking }
}

const messages = (state: MotionLabState) =>
  state.log.map((entry) => entry.message)

describe('motionLabReducer', () => {
  it('starts with the whole answer visible, silent and with an empty log', () => {
    const state = createMotionLabState()
    expect(state.speech).toEqual(step(SPEECH_TEXTS.answer.length, 'done'))
    expect(state.audio).toBe('off')
    expect(state.log).toEqual([])
    expect(state.announce).toBe(false)
  })

  it('restarts the speech from the first character when playing', () => {
    const state = run([{ type: 'play', at: 1000, reducedMotion: false }])
    expect(state.playToken).toBe(1)
    expect(state.revealed).toBe(false)
    expect(state.announce).toBe(true)
    expect(state.speech).toEqual(step(0, 'idle'))
    expect(messages(state)).toEqual(['inicio'])
  })

  it('shows the full text at once with reduced motion', () => {
    const state = run([{ type: 'play', at: 0, reducedMotion: true }])
    expect(state.speech.status).toBe('done')
    expect(state.playing).toBe(false)
    expect(messages(state)).toEqual([
      'movimiento reducido: texto completo',
      'inicio',
    ])
  })

  it('logs pauses with the character that causes them and the natural end', () => {
    const text = SPEECH_TEXTS.answer
    const comma = text.indexOf(',') + 1
    const state = run([
      { type: 'play', at: 1000, reducedMotion: false },
      { type: 'speech', state: step(comma, 'pause'), at: 1500 },
      {
        type: 'speech',
        state: step(text.length - 1, 'typing', true),
        at: 9000,
      },
      { type: 'speech', state: step(text.length, 'done'), at: 9100 },
    ])
    expect(messages(state)).toEqual(['fin', 'pausa «,»', 'inicio'])
    expect(state.log[1].time).toBe('0,50 s')
    expect(state.playing).toBe(false)
  })

  it('tells a jump to the end apart from the natural end', () => {
    const state = run([
      { type: 'play', at: 0, reducedMotion: false },
      { type: 'speech', state: step(12, 'typing', true), at: 500 },
      {
        type: 'speech',
        state: step(SPEECH_TEXTS.answer.length, 'done'),
        at: 600,
      },
    ])
    expect(messages(state)[0]).toBe('ver todo')
  })

  it('does not log the speech before anything is played', () => {
    const state = run([
      {
        type: 'speech',
        state: step(SPEECH_TEXTS.answer.length, 'done'),
        at: 10,
      },
    ])
    expect(state.log).toEqual([])
  })

  it('only logs «Ver todo» from the panel while the text is being written', () => {
    expect(run([{ type: 'reveal', at: 0 }]).log).toEqual([])
    const state = run([
      { type: 'play', at: 0, reducedMotion: false },
      { type: 'reveal', at: 200 },
    ])
    expect(state.revealed).toBe(true)
    expect(state.speech.status).toBe('done')
    expect(messages(state)).toEqual(['ver todo', 'inicio'])
  })

  it('logs the audio transitions that matter and ignores each stop of the voice', () => {
    const state = run([
      { type: 'audio', status: 'loading', at: 0 },
      { type: 'audio', status: 'ready', at: 10 },
      { type: 'audio', status: 'playing', at: 20 },
      { type: 'audio', status: 'ready', at: 30 },
      { type: 'audio', status: 'blocked', at: 40 },
      { type: 'audio', status: 'blocked', at: 50 },
      { type: 'audio', status: 'unavailable', at: 60 },
    ])
    expect(messages(state)).toEqual([
      'audio no disponible',
      'el navegador bloquea el audio',
      'audio listo',
    ])
    expect(state.audio).toBe('unavailable')
  })

  it('starts a fresh, silent controller for every simulation change', () => {
    const state = run([
      { type: 'play', at: 0, reducedMotion: false },
      { type: 'audio', status: 'ready', at: 10 },
      { type: 'simulation', patch: { block: true } },
    ])
    expect(state.simulation).toEqual({ block: true, unavailable: false })
    expect(state.audioGeneration).toBe(1)
    expect(state.audio).toBe('off')
    expect(state.playing).toBe(false)
    expect(state.revealed).toBe(true)
    expect(state.speech.status).toBe('done')
  })

  it('plays the newly chosen text', () => {
    const state = run([
      { type: 'text', key: 'long', at: 0, reducedMotion: false },
    ])
    expect(speechText(state)).toBe(SPEECH_TEXTS.long)
    expect(state.speech).toEqual({
      index: 0,
      length: SPEECH_TEXTS.long.length,
      status: 'idle',
      speaking: false,
    })
  })

  it('shows a custom text whole while it is being edited, without announcing it', () => {
    const state = run([
      { type: 'text', key: 'custom', at: 0, reducedMotion: false },
      { type: 'custom', value: 'Hola.' },
    ])
    expect(speechText(state)).toBe('Hola.')
    expect(state.speech).toEqual({
      index: 5,
      length: 5,
      status: 'done',
      speaking: false,
    })
    expect(state.announce).toBe(false)
    expect(state.playing).toBe(false)
  })

  it('restores the default timing and volume', () => {
    const state = run([
      { type: 'timing', patch: { charDelay: 70, longPause: 0 } },
      { type: 'volume', value: 15 },
      { type: 'reset-config' },
    ])
    expect(state.timing).toEqual(DEFAULT_SPEECH_TIMING)
    expect(state.volume).toBe(60)
  })

  it('keeps only the seven most recent events', () => {
    const pauses = Array.from({ length: 10 }, (_, index) => ({
      type: 'speech' as const,
      state: step(SPEECH_TEXTS.answer.indexOf(',') + 1, 'pause'),
      at: index,
    }))
    const state = run([
      { type: 'play', at: 0, reducedMotion: false },
      ...pauses,
    ])
    expect(state.log).toHaveLength(7)
    expect(new Set(state.log.map((entry) => entry.id)).size).toBe(7)
  })

  it('formats elapsed time in seconds with a decimal comma', () => {
    expect(formatElapsed(0)).toBe('0,00 s')
    expect(formatElapsed(1234)).toBe('1,23 s')
  })
})
