import { useEffect } from 'react'
import {
  MotionPreferenceProvider,
  type MotionPreference,
} from '../../app/providers/MotionPreference'
import { SoundProvider } from '../../app/providers/SoundProvider'
import { ThemeProvider } from '../../app/providers/ThemeProvider'
import { createAudioSimulation, createSimulatedAudio } from '../simulatedAudio'
import { ProfilePrototype } from './ProfilePrototype'
import { isPresetKey, PROFILE_PRESETS } from './profilePresets'

const params = new URLSearchParams(window.location.search)
const presetKey = params.get('preset')
const preset = PROFILE_PRESETS[isPresetKey(presetKey) ? presetKey : 'empty']
const motion: MotionPreference =
  params.get('motion') === 'reduce' ? 'reduce' : 'system'
// Un único documento por iframe: la simulación de audio vive a nivel de módulo.
const simulation = createAudioSimulation()
const createAudio = () => createSimulatedAudio(simulation)

// Documento de una composición del expediente dentro de un iframe del Design Lab.
export default function ProfileFrameRoot() {
  useEffect(() => {
    // Sin barras de desplazamiento: el ancho del marco es el de la «pantalla».
    document.documentElement.style.scrollbarWidth = 'none'
  }, [])

  return (
    <ThemeProvider>
      <SoundProvider createAudio={createAudio}>
        <MotionPreferenceProvider value={motion}>
          <ProfilePrototype preset={preset} />
        </MotionPreferenceProvider>
      </SoundProvider>
    </ThemeProvider>
  )
}
