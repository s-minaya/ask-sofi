import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import talkingSoundUrl from '../../assets/sofi/talking-sound.mp3'
import {
  createSpeechAudio,
  type SpeechAudio,
} from '../../infrastructure/audio/speechAudio'
import { SoundContext } from './sound'

type SoundProviderProps = {
  // Permite sustituir el controlador (tests y simulaciones del Design Lab).
  createAudio?: () => SpeechAudio
  children: ReactNode
}

const createDefaultAudio = () => createSpeechAudio({ src: talkingSoundUrl })

export function SoundProvider({
  createAudio = createDefaultAudio,
  children,
}: SoundProviderProps) {
  const [audio] = useState(createAudio)
  const [enabled, setEnabled] = useState(false)
  const status = useSyncExternalStore(
    audio.subscribe,
    audio.getStatus,
    audio.getStatus,
  )

  useEffect(() => () => audio.dispose(), [audio])

  const enable = () => {
    setEnabled(true)
    void audio.prepare()
  }

  const disable = () => {
    setEnabled(false)
    audio.disable()
  }

  const voice = {
    start: () => {
      if (enabled) audio.startVoice()
    },
    stop: () => audio.stopVoice(),
    fragment: (durationMs: number) => {
      if (enabled) audio.playFragment(durationMs)
    },
  }

  return (
    <SoundContext
      value={{
        enabled,
        status,
        enable,
        unlock: enable,
        toggle: () => (enabled ? disable() : enable()),
        disable,
        setVolume: audio.setVolume,
        voice,
      }}
    >
      {children}
    </SoundContext>
  )
}
