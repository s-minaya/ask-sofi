import { useContext } from 'react'
import { SoundContext, type SoundContextValue } from '../app/providers/sound'

const SILENT: SoundContextValue = {
  enabled: false,
  status: 'off',
  enable: () => {},
  unlock: () => {},
  toggle: () => {},
  disable: () => {},
  setVolume: () => {},
  voice: { start: () => {}, stop: () => {}, fragment: () => {} },
}

// Fuera de un SoundProvider, Sofi simplemente escribe en silencio.
export function useSound(): SoundContextValue {
  return useContext(SoundContext) ?? SILENT
}
