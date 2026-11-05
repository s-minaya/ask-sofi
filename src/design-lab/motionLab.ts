import {
  DEFAULT_SPEECH_TIMING,
  type SpeechState,
  type SpeechTiming,
} from '../components/sofi/SofiSpeech/speechTimeline'
import type { Playback } from '../components/sofi/visual/registry'
import {
  SOFI_ANIMATION_IDS,
  type SofiAnimationId,
} from '../components/sofi/visual/types'
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

// Estado de sesión del inspector de recursos (catálogo §8): cada recurso guarda sus propios
// ajustes mientras dure el Lab. Vive en memoria; no es una preferencia pública ni la
// velocidad de producción (`visual/rates`).

export type InspectorEntry<Background extends string> = {
  rate: number
  paused: boolean
  size: number
  background: Background
  pixelated: boolean
}

export type InspectorState<Background extends string> = {
  selected: SofiAnimationId
  entries: Readonly<Record<SofiAnimationId, InspectorEntry<Background>>>
}

export type InspectorAction<Background extends string> =
  | { type: 'select'; id: SofiAnimationId }
  | { type: 'rate'; value: number }
  | { type: 'paused'; value: boolean }
  | { type: 'size'; value: number }
  | { type: 'background'; value: Background }
  | { type: 'pixelated'; value: boolean }

// El tamaño y el fondo de partida los elige el inspector; la velocidad parte siempre de 1×,
// la línea de tiempo original (catálogo §8), y sin pixelado, como se pinta en producción.
export function createInspectorState<Background extends string>(defaults: {
  size: number
  background: Background
}): InspectorState<Background> {
  const entry: InspectorEntry<Background> = {
    rate: 1,
    paused: false,
    size: defaults.size,
    background: defaults.background,
    pixelated: false,
  }
  return {
    selected: SOFI_ANIMATION_IDS[0],
    entries: Object.fromEntries(
      SOFI_ANIMATION_IDS.map((id) => [id, entry]),
    ) as InspectorState<Background>['entries'],
  }
}

// Mismo criterio que `setSessionRate`, que recibirá la velocidad: un factor positivo.
const isPositive = (value: number) => Number.isFinite(value) && value > 0

function updateSelected<Background extends string>(
  state: InspectorState<Background>,
  patch: Partial<InspectorEntry<Background>>,
): InspectorState<Background> {
  const id = state.selected
  return {
    ...state,
    entries: { ...state.entries, [id]: { ...state.entries[id], ...patch } },
  }
}

export function inspectorReducer<Background extends string>(
  state: InspectorState<Background>,
  action: InspectorAction<Background>,
): InspectorState<Background> {
  switch (action.type) {
    case 'select':
      return { ...state, selected: action.id }
    case 'rate':
      return isPositive(action.value)
        ? updateSelected(state, { rate: action.value })
        : state
    case 'size':
      return isPositive(action.value)
        ? updateSelected(state, { size: action.value })
        : state
    case 'paused':
      return updateSelected(state, { paused: action.value })
    case 'background':
      return updateSelected(state, { background: action.value })
    case 'pixelated':
      return updateSelected(state, { pixelated: action.value })
  }
}

// Lo transitorio de la instancia que se está mirando (catálogo §8): nuevo evento, cancelación,
// comparación con 1× y bucle frente a una pasada. Se pierde al cambiar de recurso, a
// diferencia de los ajustes del inspector, que se conservan.

export type InspectorCycle = 'loop' | 'once'

export type InspectorRun = {
  // Reproducción funcional del recurso en el registro. Una máquina la dirige su controlador.
  playback: Playback
  // Cambia con cada evento nuevo: quien pinta rehace la instancia y empieza desde el principio.
  token: number
  // Interrumpido a mitad: Sofi cede a `sofi-blink` hasta el siguiente evento.
  cancelled: boolean
  // Comparación temporal con la velocidad original; no sustituye a la elegida.
  comparing: boolean
  // Lo que se pide ver; parte del propio del recurso.
  cycle: InspectorCycle
  // Un bucle visto como pasada única ya dio su primera vuelta y se queda quieto.
  held: boolean
}

export type InspectorRunAction =
  | { type: 'event' }
  | { type: 'restart' }
  | { type: 'cancel' }
  | { type: 'compare'; value: boolean }
  | { type: 'cycle'; value: InspectorCycle }
  | { type: 'first-cycle' }
  | { type: 'end' }

export function createInspectorRun(playback: Playback): InspectorRun {
  return {
    playback,
    token: 0,
    cancelled: false,
    comparing: false,
    cycle: playback === 'once' ? 'once' : 'loop',
    held: false,
  }
}

export function inspectorRunReducer(
  run: InspectorRun,
  action: InspectorRunAction,
): InspectorRun {
  switch (action.type) {
    case 'event':
      return { ...run, token: run.token + 1, cancelled: false, held: false }
    case 'restart':
      // Lo que se ve empieza otra vez, con lo elegido intacto: sigue cancelado si lo estaba.
      return { ...run, token: run.token + 1, held: false }
    case 'cancel':
      return { ...run, cancelled: true, held: false }
    case 'compare':
      return { ...run, comparing: action.value }
    case 'cycle':
      // Una máquina no tiene bucle ni pasada: la dirige su controlador.
      if (run.playback === 'machine') return run
      return {
        ...run,
        cycle: action.value,
        token: run.token + 1,
        cancelled: false,
        held: false,
      }
    case 'first-cycle':
      // Solo un bucle visto como pasada única se queda quieto tras su primera vuelta.
      return !run.cancelled && run.playback === 'loop' && run.cycle === 'once'
        ? { ...run, held: true }
        : run
    case 'end':
      // Solo una pasada vista como bucle vuelve a empezar al terminar.
      return !run.cancelled && run.playback === 'once' && run.cycle === 'loop'
        ? { ...run, token: run.token + 1 }
        : run
  }
}

// La velocidad que se aplica: la elegida, o la original mientras se compara.
export function effectiveRate(rate: number, run: InspectorRun): number {
  return run.comparing ? 1 : rate
}
