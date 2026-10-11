import {
  DEFAULT_SPEECH_TIMING,
  type SpeechState,
  type SpeechTiming,
} from '../components/sofi/SofiSpeech/speechTimeline'
import type { SpeechAudioStatus } from '../infrastructure/audio/speechAudio'
import { SPEECH } from './fixtures'

// Estado del playground de Motion & Sound: lógica pura. Las marcas de tiempo llegan
// en cada acción, así el reductor no lee relojes.

export type SpeechTextKey = 'answer' | 'needs' | 'long' | 'custom'

export const SPEECH_TEXTS: Record<Exclude<SpeechTextKey, 'custom'>, string> = {
  answer: SPEECH.answer,
  needs: SPEECH.needsLong,
  long: SPEECH.manyPauses,
}

export const DEFAULT_CUSTOM_TEXT =
  'Antes de dar nada por hecho, pregúntale cómo lo lleva.'
export const DEFAULT_VOLUME = 60
const LOG_SIZE = 7

export type AudioSimulationFlags = { block: boolean; unavailable: boolean }

export type LogEntry = { id: number; time: string; message: string }

export type MotionLabState = {
  textKey: SpeechTextKey
  custom: string
  timing: SpeechTiming
  volume: number
  simulation: AudioSimulationFlags
  // Cambia cada vez que se crea un controlador de audio nuevo.
  audioGeneration: number
  playToken: number
  revealed: boolean
  // Solo se anuncia tras «Reproducir»: editar el texto no debe leerse a cada tecla.
  announce: boolean
  playing: boolean
  startedAt: number | null
  speech: SpeechState
  audio: SpeechAudioStatus
  log: ReadonlyArray<LogEntry>
  nextId: number
}

export type MotionLabAction =
  | { type: 'play'; at: number; reducedMotion: boolean }
  | { type: 'reveal'; at: number }
  | { type: 'text'; key: SpeechTextKey; at: number; reducedMotion: boolean }
  | { type: 'custom'; value: string }
  | { type: 'timing'; patch: Partial<SpeechTiming> }
  | { type: 'volume'; value: number }
  | { type: 'reset-config' }
  | { type: 'simulation'; patch: Partial<AudioSimulationFlags> }
  | { type: 'speech'; state: SpeechState; at: number }
  | { type: 'audio'; status: SpeechAudioStatus; at: number }
  | { type: 'sound-off'; at: number }

export function speechText(
  state: Pick<MotionLabState, 'textKey' | 'custom'>,
): string {
  return state.textKey === 'custom' ? state.custom : SPEECH_TEXTS[state.textKey]
}

function complete(text: string): SpeechState {
  return {
    index: text.length,
    length: text.length,
    status: 'done',
    speaking: false,
  }
}

export function createMotionLabState(): MotionLabState {
  const base = { textKey: 'answer' as const, custom: DEFAULT_CUSTOM_TEXT }
  return {
    ...base,
    timing: DEFAULT_SPEECH_TIMING,
    volume: DEFAULT_VOLUME,
    simulation: { block: false, unavailable: false },
    audioGeneration: 0,
    playToken: 0,
    revealed: false,
    announce: false,
    playing: false,
    startedAt: null,
    // Empieza con el texto completo a la vista; «Reproducir» lanza la escritura.
    speech: complete(speechText(base)),
    audio: 'off',
    log: [],
    nextId: 0,
  }
}

// «1,25 s» desde que empezó la reproducción.
export function formatElapsed(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(2).replace('.', ',')} s`
}

function withLog(
  state: MotionLabState,
  at: number,
  messages: ReadonlyArray<string>,
  reset = false,
): MotionLabState {
  let nextId = state.nextId
  const time = formatElapsed(
    state.startedAt === null ? 0 : at - state.startedAt,
  )
  const entries = messages.map((message) => ({ id: nextId++, time, message }))
  // Lo más reciente arriba.
  const log = [...entries.reverse(), ...(reset ? [] : state.log)].slice(
    0,
    LOG_SIZE,
  )
  return { ...state, log, nextId }
}

function play(
  state: MotionLabState,
  at: number,
  reducedMotion: boolean,
): MotionLabState {
  const text = speechText(state)
  const started: MotionLabState = {
    ...state,
    playToken: state.playToken + 1,
    revealed: false,
    announce: true,
    playing: !reducedMotion,
    startedAt: at,
    speech: reducedMotion
      ? complete(text)
      : { index: 0, length: text.length, status: 'idle', speaking: false },
  }
  return withLog(
    started,
    at,
    reducedMotion
      ? ['inicio', 'movimiento reducido: texto completo']
      : ['inicio'],
    true,
  )
}

const AUDIO_MESSAGES: Partial<Record<SpeechAudioStatus, string>> = {
  blocked: 'el navegador bloquea el audio',
  unavailable: 'audio no disponible',
}

export function motionLabReducer(
  state: MotionLabState,
  action: MotionLabAction,
): MotionLabState {
  switch (action.type) {
    case 'play':
      return play(state, action.at, action.reducedMotion)
    case 'text':
      return play(
        { ...state, textKey: action.key },
        action.at,
        action.reducedMotion,
      )
    case 'reveal': {
      if (!state.playing) return state
      const done = {
        ...state,
        revealed: true,
        playing: false,
        speech: complete(speechText(state)),
      }
      return withLog(done, action.at, ['ver todo'])
    }
    case 'custom':
      return {
        ...state,
        custom: action.value,
        revealed: true,
        announce: false,
        playing: false,
        speech: complete(action.value),
      }
    case 'timing':
      return { ...state, timing: { ...state.timing, ...action.patch } }
    case 'volume':
      return { ...state, volume: action.value }
    case 'reset-config':
      return { ...state, timing: DEFAULT_SPEECH_TIMING, volume: DEFAULT_VOLUME }
    case 'simulation':
      // Cada simulación estrena controlador: el sonido vuelve a silencio y el texto queda entero.
      return {
        ...state,
        simulation: { ...state.simulation, ...action.patch },
        audioGeneration: state.audioGeneration + 1,
        revealed: true,
        announce: false,
        playing: false,
        audio: 'off',
        speech: complete(speechText(state)),
      }
    case 'speech': {
      const previous = state.speech
      const next = action.state
      const updated = { ...state, speech: next }
      if (!state.playing) return updated
      if (next.status === 'pause') {
        return withLog(updated, action.at, [
          `pausa «${speechText(state).charAt(next.index - 1)}»`,
        ])
      }
      if (next.status === 'done') {
        // Si el texto salta al final de golpe, lo ha completado «Ver todo».
        const revealed = previous.index < next.length - 1
        return withLog({ ...updated, playing: false }, action.at, [
          revealed ? 'ver todo' : 'fin',
        ])
      }
      return updated
    }
    case 'audio': {
      const previous = state.audio
      const updated = { ...state, audio: action.status }
      if (action.status === previous) return updated
      if (action.status === 'ready' && previous === 'loading')
        return withLog(updated, action.at, ['audio listo'])
      const message = AUDIO_MESSAGES[action.status]
      return message ? withLog(updated, action.at, [message]) : updated
    }
    case 'sound-off':
      return withLog(state, action.at, ['sonido desactivado'])
  }
}
