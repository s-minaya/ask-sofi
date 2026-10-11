// Línea de tiempo del typewriter de Sofi: lógica pura, sin React ni temporizadores.
export type SpeechTiming = {
  charDelay: number
  shortPause: number
  longPause: number
  startDelay: number
}

// Valores por defecto, ajustables en Motion & Sound durante el desarrollo.
export const DEFAULT_SPEECH_TIMING: SpeechTiming = {
  charDelay: 28,
  shortPause: 170,
  longPause: 360,
  startDelay: 700,
}

// Con movimiento reducido el texto aparece completo; si hay sonido, lo acompaña un único fragmento breve.
export const REDUCED_MOTION_FRAGMENT_MS = 600

export type SpeechStatus = 'idle' | 'typing' | 'pause' | 'done'

export type SpeechStep = {
  // Caracteres ya visibles.
  index: number
  status: SpeechStatus
  // La voz suena con las letras y calla en cada pausa y al terminar.
  speaking: boolean
}

export type SpeechState = SpeechStep & { length: number }

export const INITIAL_STEP: SpeechStep = {
  index: 0,
  status: 'idle',
  speaking: false,
}

export type CharKind = 'long-pause' | 'short-pause' | 'space' | 'letter'

const LONG_PAUSE = '.…:?!'
const SHORT_PAUSE = ',;'

export function charKind(char: string): CharKind {
  if (LONG_PAUSE.includes(char)) return 'long-pause'
  if (SHORT_PAUSE.includes(char)) return 'short-pause'
  if (/\s/.test(char)) return 'space'
  return 'letter'
}

export function delayAfter(kind: CharKind, timing: SpeechTiming): number {
  if (kind === 'long-pause') return timing.longPause
  if (kind === 'short-pause') return timing.shortPause
  return timing.charDelay
}

// Revela un carácter más. Los espacios no cambian si la voz suena o calla.
export function nextStep(text: string, previous: SpeechStep): SpeechStep {
  const index = Math.min(previous.index + 1, text.length)
  const kind = charKind(text.charAt(index - 1))
  const done = index >= text.length
  const pause = kind === 'long-pause' || kind === 'short-pause'
  return {
    index,
    status: done ? 'done' : pause ? 'pause' : 'typing',
    speaking:
      done || pause ? false : kind === 'letter' ? true : previous.speaking,
  }
}

export function completeStep(text: string): SpeechStep {
  return { index: text.length, status: 'done', speaking: false }
}
