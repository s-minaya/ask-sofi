import { createContext } from 'react'
import type { SpeechAudioStatus } from '../../infrastructure/audio/speechAudio'

export type SpeechVoice = {
  start: () => void
  stop: () => void
  fragment: (durationMs: number) => void
}

export type SoundContextValue = {
  // Preferencia de la persona: empieza en silencio. Su persistencia llegará con 003.
  enabled: boolean
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
