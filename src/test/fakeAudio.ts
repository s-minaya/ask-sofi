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

export type FakeSource = {
  buffer: AudioBuffer | null
  loop: boolean
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  onended: (() => void) | null
  // Simula que el navegador termina de reproducir la fuente por sí solo.
  end: () => void
}

// Doble de AudioContext: permite decidir si el navegador deja sonar o no y ver qué fuentes
// y ganancias se crean. Lo comparten las pruebas de la voz y de los efectos.
export function fakeAudioContext({ running = false, allowResume = true } = {}) {
  const sources: FakeSource[] = []
  const gains: { disconnect: ReturnType<typeof vi.fn> }[] = []
  const context = {
    state: (running ? 'running' : 'suspended') as AudioContextState,
    currentTime: 0,
    destination: {} as AudioNode,
    resume: vi.fn(() => {
      if (!allowResume) return new Promise<void>(() => {})
      context.state = 'running'
      return Promise.resolve()
    }),
    close: vi.fn(() => Promise.resolve()),
    createBufferSource: vi.fn(() => {
      const source: FakeSource = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
        end: () => source.onended?.(),
      }
      sources.push(source)
      return source as unknown as AudioBufferSourceNode
    }),
    createGain: vi.fn(() => {
      const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }
      gains.push(gain)
      return gain as unknown as GainNode
    }),
    decodeAudioData: vi.fn(() =>
      Promise.resolve({ duration: 21 } as AudioBuffer),
    ),
  }
  return { context, sources, gains }
}
