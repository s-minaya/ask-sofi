import talkingSoundUrl from '../assets/sofi/talking-sound.mp3'
import {
  createSpeechAudio,
  type AudioContextLike,
  type SpeechAudio,
} from '../infrastructure/audio/speechAudio'

// Simulaciones del Design Lab, fuera del código de producción: un AudioContext real
// envuelto para que el navegador «bloquee» el primer intento, y una descarga que falla.
export type AudioSimulation = {
  block: boolean
  unavailable: boolean
  attempts: number
}

export function createAudioSimulation(): AudioSimulation {
  return { block: false, unavailable: false, attempts: 0 }
}

function blockingContext(simulation: AudioSimulation): AudioContextLike {
  const Context =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Context) throw new Error('Web Audio no disponible')
  const real = new Context()
  const blocked = () => simulation.block && simulation.attempts <= 1

  return {
    get state() {
      return blocked() ? 'suspended' : real.state
    },
    get currentTime() {
      return real.currentTime
    },
    get destination() {
      return real.destination
    },
    resume() {
      simulation.attempts += 1
      // Como un navegador que no deja sonar: la promesa no se resuelve.
      if (blocked()) return new Promise<void>(() => {})
      return real.resume()
    },
    close: () => real.close(),
    createBufferSource: () => real.createBufferSource(),
    createGain: () => real.createGain(),
    decodeAudioData: (data) => real.decodeAudioData(data),
  }
}

export function createSimulatedAudio(simulation: AudioSimulation): SpeechAudio {
  return createSpeechAudio({
    src: talkingSoundUrl,
    createContext: () => blockingContext(simulation),
    fetchData: async (src) => {
      if (simulation.unavailable)
        throw new Error('Archivo de audio no disponible (simulado)')
      const response = await fetch(src)
      if (!response.ok)
        throw new Error(`Audio no disponible (${response.status})`)
      return response.arrayBuffer()
    },
  })
}
