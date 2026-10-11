import { vi } from 'vitest'
import type {
  SpeechAudio,
  SpeechAudioStatus,
} from '../infrastructure/audio/speechAudio'

// Controlador de audio falso: registra las llamadas y permite fijar su estado.
// prepare() termina como indique `prepared` («blocked» simula un navegador que no deja sonar).
export function fakeAudio(
  prepared: 'ready' | 'blocked' | 'unavailable' = 'ready',
) {
  let status: SpeechAudioStatus = 'off'
  const listeners = new Set<() => void>()
  const set = (next: SpeechAudioStatus) => {
    status = next
    listeners.forEach((listener) => listener())
  }
  const audio: SpeechAudio & { set: typeof set } = {
    prepare: vi.fn(async () => {
      set(prepared)
      return status === 'ready'
    }),
    startVoice: vi.fn(),
    stopVoice: vi.fn(),
    playFragment: vi.fn(),
    setVolume: vi.fn(),
    disable: vi.fn(() => set('off')),
    dispose: vi.fn(),
    getStatus: () => status,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set,
  }
  return audio
}
