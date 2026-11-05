import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPEECH_TIMING,
  type SpeechState,
} from '../components/sofi/SofiSpeech/speechTimeline'
import { PRODUCTION_RATES, rateFor } from '../components/sofi/visual/rates'
import type { Playback } from '../components/sofi/visual/registry'
import { SOFI_ANIMATION_IDS } from '../components/sofi/visual/types'
import { readPreferences } from '../infrastructure/storage/preferencesStorage'
import {
  SPEECH_TEXTS,
  createInspectorRun,
  createInspectorState,
  effectiveRate,
  createMotionLabState,
  formatElapsed,
  inspectorReducer,
  inspectorRunReducer,
  motionLabReducer,
  speechText,
  type InspectorAction,
  type InspectorRun,
  type InspectorRunAction,
  type InspectorState,
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

// Las opciones de fondo y el tamaño de partida son del inspector (T059); aquí solo importa
// que cada recurso conserve los suyos.
type Background = 'base' | 'alt'

const DEFAULTS = { size: 160, background: 'base' as Background }

function inspect(
  actions: ReadonlyArray<InspectorAction<Background>>,
  state: InspectorState<Background> = createInspectorState(DEFAULTS),
) {
  return actions.reduce(inspectorReducer<Background>, state)
}

const START = {
  rate: 1,
  paused: false,
  size: 160,
  background: 'base',
  pixelated: false,
}

describe('inspectorReducer', () => {
  it('starts every resource at 1×, playing and unpixelated, on the first entry of the catalogue', () => {
    const state = createInspectorState(DEFAULTS)
    expect(state.selected).toBe(SOFI_ANIMATION_IDS[0])
    expect(Object.keys(state.entries).sort()).toEqual(
      [...SOFI_ANIMATION_IDS].sort(),
    )
    for (const id of SOFI_ANIMATION_IDS)
      expect(state.entries[id]).toEqual(START)
  })

  it('changes only the selected resource', () => {
    const state = inspect([
      { type: 'select', id: 'sofing' },
      { type: 'rate', value: 0.5 },
      { type: 'paused', value: true },
      { type: 'size', value: 256 },
      { type: 'background', value: 'alt' },
      { type: 'pixelated', value: true },
    ])
    expect(state.entries.sofing).toEqual({
      rate: 0.5,
      paused: true,
      size: 256,
      background: 'alt',
      pixelated: true,
    })
    for (const id of SOFI_ANIMATION_IDS.filter((id) => id !== 'sofing'))
      expect(state.entries[id]).toEqual(START)
  })

  it('keeps the values of each resource when switching between entries', () => {
    const state = inspect([
      { type: 'select', id: 'talking' },
      { type: 'rate', value: 2 },
      { type: 'pixelated', value: true },
      { type: 'select', id: 'rolling' },
      { type: 'rate', value: 0.25 },
      { type: 'paused', value: true },
      { type: 'select', id: 'talking' },
    ])
    expect(state.selected).toBe('talking')
    expect(state.entries.talking).toEqual({
      ...START,
      rate: 2,
      pixelated: true,
    })
    expect(state.entries.rolling).toEqual({
      ...START,
      rate: 0.25,
      paused: true,
    })
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'ignores a speed or a size of %s and keeps the previous one',
    (value) => {
      const before = inspect([
        { type: 'rate', value: 2 },
        { type: 'size', value: 96 },
      ])
      expect(inspect([{ type: 'rate', value }], before)).toBe(before)
      expect(inspect([{ type: 'size', value }], before)).toBe(before)
    },
  )

  it('touches neither the public preferences, nor the production speeds, nor the speed SofiSprite reads', () => {
    const preferences = readPreferences()
    const production = JSON.stringify(PRODUCTION_RATES)

    inspect(
      SOFI_ANIMATION_IDS.flatMap((id) => [
        { type: 'select' as const, id },
        { type: 'rate' as const, value: 0.25 },
        { type: 'paused' as const, value: true },
        { type: 'pixelated' as const, value: true },
      ]),
    )

    expect(readPreferences()).toEqual(preferences)
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
    expect(JSON.stringify(PRODUCTION_RATES)).toBe(production)
    for (const id of SOFI_ANIMATION_IDS) expect(rateFor(id)).toBe(1)
  })
})

function drive(
  playback: Playback,
  actions: ReadonlyArray<InspectorRunAction>,
  run: InspectorRun = createInspectorRun(playback),
) {
  return actions.reduce(inspectorRunReducer, run)
}

describe('inspectorRunReducer', () => {
  it('starts as the resource is in production: its own playback, nothing cancelled, held or compared', () => {
    expect(createInspectorRun('loop')).toEqual({
      playback: 'loop',
      token: 0,
      cancelled: false,
      comparing: false,
      cycle: 'loop',
      held: false,
    })
    expect(createInspectorRun('once').cycle).toBe('once')
    expect(createInspectorRun('machine').cycle).toBe('loop')
  })

  it('rebuilds the instance with every new event, also when it is already running', () => {
    const run = drive('once', [{ type: 'event' }, { type: 'event' }])
    expect(run.token).toBe(2)
  })

  it('restarts what is shown from the beginning, keeping what was chosen', () => {
    const run = drive('loop', [
      { type: 'cycle', value: 'once' },
      { type: 'compare', value: true },
      { type: 'cancel' },
      { type: 'restart' },
    ])
    expect(run.token).toBe(2)
    expect(run.cancelled).toBe(true)
    expect(run.comparing).toBe(true)
    expect(run.cycle).toBe('once')
  })

  it('lets a single pass held after its first cycle play again when restarted', () => {
    const held = drive('loop', [
      { type: 'cycle', value: 'once' },
      { type: 'first-cycle' },
    ])
    expect(held.held).toBe(true)
    expect(drive('loop', [{ type: 'restart' }], held).held).toBe(false)
  })

  it('cancels halfway and a new event brings the resource back', () => {
    const cancelled = drive('once', [{ type: 'cancel' }])
    expect(cancelled.cancelled).toBe(true)
    expect(cancelled.token).toBe(0)
    const back = drive('once', [{ type: 'event' }], cancelled)
    expect(back.cancelled).toBe(false)
    expect(back.token).toBe(1)
  })

  it('compares with the original speed without touching anything else', () => {
    const run = drive('loop', [{ type: 'compare', value: true }])
    expect(run).toEqual({ ...createInspectorRun('loop'), comparing: true })
    expect(
      drive('loop', [{ type: 'compare', value: false }], run).comparing,
    ).toBe(false)
  })

  it('keeps a new event from changing the comparison', () => {
    const run = drive('loop', [
      { type: 'compare', value: true },
      { type: 'event' },
    ])
    expect(run.comparing).toBe(true)
  })

  it('applies the chosen speed, or the original while comparing', () => {
    const run = createInspectorRun('loop')
    expect(effectiveRate(0.5, run)).toBe(0.5)
    expect(effectiveRate(0.5, { ...run, comparing: true })).toBe(1)
  })

  describe('loop seen as a single pass', () => {
    it('holds after the first cycle and never again until the next event', () => {
      const run = drive('loop', [
        { type: 'cycle', value: 'once' },
        { type: 'first-cycle' },
      ])
      expect(run.held).toBe(true)
      expect(drive('loop', [{ type: 'event' }], run).held).toBe(false)
    })

    it('restarts from the beginning when the mode changes', () => {
      const run = drive('loop', [{ type: 'cycle', value: 'once' }])
      expect(run.token).toBe(1)
      expect(run.cycle).toBe('once')
    })

    it('does not hold a loop that is shown as a loop', () => {
      expect(drive('loop', [{ type: 'first-cycle' }]).held).toBe(false)
    })

    it('does not hold a resource that was cancelled', () => {
      const run = drive('loop', [
        { type: 'cycle', value: 'once' },
        { type: 'cancel' },
        { type: 'first-cycle' },
      ])
      expect(run.held).toBe(false)
    })
  })

  describe('single pass seen as a loop', () => {
    it('starts again at the end of every pass', () => {
      const run = drive('once', [
        { type: 'cycle', value: 'loop' },
        { type: 'end' },
        { type: 'end' },
      ])
      expect(run.token).toBe(3)
    })

    it('stays at the end of its pass when it is shown as a single pass', () => {
      const run = drive('once', [{ type: 'end' }])
      expect(run.token).toBe(0)
      expect(run.held).toBe(false)
    })

    it('does not start again after being cancelled', () => {
      const run = drive('once', [
        { type: 'cycle', value: 'loop' },
        { type: 'cancel' },
        { type: 'end' },
      ])
      expect(run.token).toBe(1)
    })
  })

  it('leaves the cycle of a state machine to its controller', () => {
    const run = drive('machine', [
      { type: 'cycle', value: 'once' },
      { type: 'first-cycle' },
      { type: 'end' },
    ])
    expect(run).toEqual(createInspectorRun('machine'))
  })
})
