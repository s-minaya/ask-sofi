import { createContext } from 'react'
import type { SpeechAudioStatus } from '../../infrastructure/audio/speechAudio'
import type { SoundPreference } from '../../infrastructure/storage/preferencesStorage'

export type SpeechVoice = {
  start: () => void
  stop: () => void
  fragment: (durationMs: number) => void
}

export type SoundContextValue = {
  // Estado actual: empieza en silencio en cada visita, porque el audio solo
  // puede prepararse dentro de un gesto.
  enabled: boolean
  // Lo que la persona eligió la última vez («off» si no se recuerda nada).
  preference: SoundPreference
  status: SpeechAudioStatus
  // Las tres acciones que preparan el audio deben llamarse desde un gesto.
  enable: () => void
  unlock: () => void
  toggle: () => void
  disable: () => void
  setVolume: (volume: number) => void
  // Lo que usa SofiSpeech: no hace nada si el sonido está desactivado o no está listo.
  voice: SpeechVoice
}

export const SoundContext = createContext<SoundContextValue | null>(null)
