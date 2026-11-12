import { useEffect, useRef, useState } from 'react'
import { MotionPreferenceProvider } from '../../app/providers/MotionPreference'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import {
  GAGS_CHANNEL,
  configFromParams,
  type GagsChannelMessage,
  type GagsFrameConfig,
  type GagsFrameStatus,
} from '../gagProfile'
import { motionFromParam } from '../motionParam'
import { createAudioSimulation, createSimulatedAudio } from '../simulatedAudio'
import { ProfilePrototype } from './ProfilePrototype'
import { isPresetKey, PROFILE_PRESETS } from './profilePresets'

const params = new URLSearchParams(window.location.search)
const presetKey = params.get('preset')
const preset = PROFILE_PRESETS[isPresetKey(presetKey) ? presetKey : 'waiting']
const motion = motionFromParam(params.get('motion'))
const frameId = params.get('id') ?? 'marco'
// Un único documento por iframe: la simulación de audio vive a nivel de módulo.
const simulation = createAudioSimulation()
const createAudio = () => createSimulatedAudio(simulation)

// Documento del expediente con los tres gags (T066, ubicación A aprobada) dentro de un iframe del Design
// Lab. La composición es el `ProfileSheet` real; la configuración (qué gags, inactividad, zona
// sensible) llega de la página del Lab por un canal, sin recargar el marco, y el marco le cuenta
// cómo está la escena.
export default function GagsProfileFrameRoot() {
  const [config, setConfig] = useState<GagsFrameConfig>(() =>
    configFromParams(params),
  )
  // El canal se abre y se cierra con el efecto (también con StrictMode); `onStatus` lo usa mientras
  // está abierto.
  const channel = useRef<BroadcastChannel | null>(null)
  const [onStatus] = useState(
    () => (status: Omit<GagsFrameStatus, 'frame'>) => {
      const message: GagsChannelMessage = {
        type: 'status',
        status: { ...status, frame: frameId },
      }
      channel.current?.postMessage(message)
    },
  )

  useEffect(() => {
    document.documentElement.style.scrollbarWidth = 'none'
    if (typeof BroadcastChannel === 'undefined') return
    const opened = new BroadcastChannel(GAGS_CHANNEL)
    channel.current = opened
    opened.onmessage = (event: MessageEvent<GagsChannelMessage>) => {
      if (event.data.type === 'config') setConfig(event.data.config)
    }
    const hello: GagsChannelMessage = { type: 'hello' }
    opened.postMessage(hello)
    return () => {
      opened.onmessage = null
      opened.close()
      channel.current = null
    }
  }, [])

  return (
    <ThemeProvider>
      <SoundProvider createAudio={createAudio}>
        <MotionPreferenceProvider value={motion}>
          <ProfilePrototype preset={preset} gags={{ config, onStatus }} />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
}
