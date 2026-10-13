import { SoundProvider } from '../../app/providers/SoundProvider'
import { SoundNotice } from '../../components/sofi/SoundNotice/SoundNotice'
import { Button } from '../../components/ui/Button/Button'
import { useSound } from '../../hooks/useSound'
import type { SpeechAudio } from '../../infrastructure/audio/speechAudio'
import { LabCap } from './LabParts'

// Un audio que el navegador «bloquea» siempre: solo para ver el aviso.
function blockedAudio(): SpeechAudio {
  return {
    prepare: async () => false,
    startVoice: () => {},
    stopVoice: () => {},
    playFragment: () => {},
    setVolume: () => {},
    disable: () => {},
    dispose: () => {},
    getStatus: () => 'blocked',
    subscribe: () => () => {},
  }
}

function Demo() {
  const sound = useSound()
  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: '36rem' }}>
      <div>
        <Button size="sm" variant="secondary" onClick={sound.enable}>
          Activar el sonido
        </Button>
      </div>
      <div>
        <LabCap>En el flujo · empuja lo que hay debajo</LabCap>
        <SoundNotice />
      </div>
    </div>
  )
}

export function SoundNoticeDemo() {
  return (
    <SoundProvider createAudio={blockedAudio}>
      <Demo />
    </SoundProvider>
  )
}
