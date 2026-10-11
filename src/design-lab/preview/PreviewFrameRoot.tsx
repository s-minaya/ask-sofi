import { useEffect, useState } from 'react'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../../app/providers/MotionPreference'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { createAudioSimulation, createSimulatedAudio } from '../simulatedAudio'
import { PreviewFlow } from './PreviewFlow'
import { readPreviewMessage, sendPreviewMessage } from './previewProtocol'
import { SCENARIOS, type Scenario } from './scenarios'

function readParams() {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('scenario')
  return {
    scenario: (SCENARIOS as ReadonlyArray<string>).includes(scenario ?? '')
      ? (scenario as Scenario)
      : 'success',
    motion: (params.get('motion') === 'reduce'
      ? 'reduce'
      : 'system') as MotionPreference,
    block: params.get('block') === '1',
  }
}

const initial = readParams()
// Un único documento por iframe: la simulación de audio vive a nivel de módulo.
const simulation = { ...createAudioSimulation(), block: initial.block }
const createAudio = () => createSimulatedAudio(simulation)

// Documento de la app simulada dentro del iframe de la Experience Preview.
export default function PreviewFrameRoot() {
  const [motion, setMotion] = useState<MotionPreference>(initial.motion)

  useEffect(() => {
    // Sin barras de desplazamiento: el ancho del marco es el de la «pantalla».
    document.documentElement.style.scrollbarWidth = 'none'
    const onMessage = (event: MessageEvent) => {
      const data = readPreviewMessage(event)
      if (data?.type !== 'ask-sofi:preview-command') return
      if (data.command.kind === 'motion') setMotion(data.command.value)
      if (data.command.kind === 'simulate-block') {
        simulation.block = data.command.value
        simulation.attempts = 0
      }
    }
    window.addEventListener('message', onMessage)
    sendPreviewMessage(window.parent, { type: 'ask-sofi:preview-ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <ThemeProvider>
      <SoundProvider createAudio={createAudio}>
        <MotionPreferenceProvider value={motion}>
          <PreviewFlow initialScenario={initial.scenario} />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
}
