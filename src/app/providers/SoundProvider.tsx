import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import talkingSoundUrl from '../../assets/sofi/talking-sound.mp3'
import {
  createSpeechAudio,
  defaultCreateContext,
  type AudioContextLike,
  type SpeechAudio,
} from '../../infrastructure/audio/speechAudio'
import {
  readPreferences,
  updatePreferences,
  type SoundPreference,
} from '../../infrastructure/storage/preferencesStorage'
import { subscribeToUserDataCleared } from '../../infrastructure/storage/userData'
import { SoundContext } from './sound'

type SoundProviderProps = {
  // Permite sustituir el controlador (tests y simulaciones del Design Lab). Recibe el
  // contexto compartido, que se crea al pedirlo por primera vez; quien no lo use no crea ninguno.
  createAudio?: (context: () => AudioContextLike) => SpeechAudio
  // Crea el AudioContext compartido (tests).
  createContext?: () => AudioContextLike
  // Recuerda la elección de sonido entre visitas. Lo activa solo la aplicación
  // real: el Design Lab usa un audio simulado y no debe tocar las preferencias.
  persist?: boolean
  // No descarga ni prepara el audio al activar el sonido: lo hará la primera
  // acción que lo pida expresamente (`unlock`). La aplicación real lo usa para no
  // descargar un MP3 que no suena: solo la ficha del expediente reproduce la voz
  // de Sofi, y el gesto que la abre (o que activa el sonido dentro de ella) lo
  // prepara. El Design Lab no lo usa y conserva su comportamiento.
  deferAudio?: boolean
  children: ReactNode
}

const createDefaultAudio = (context: () => AudioContextLike) =>
  createSpeechAudio({ src: talkingSoundUrl, context })

export function SoundProvider({
  createAudio = createDefaultAudio,
  createContext = defaultCreateContext,
  persist = false,
  deferAudio = false,
  children,
}: SoundProviderProps) {
  // Dueño único del AudioContext compartido (D-11). Se crea cuando alguien lo pide por
  // primera vez, que es dentro del gesto que desbloquea el sonido: el navegador solo deja
  // iniciarlo así. Con el sonido desactivado, nadie lo pide.
  const contextRef = useRef<AudioContextLike | null>(null)
  const getContext = () => (contextRef.current ??= createContext())
  const [audio] = useState(() => createAudio(getContext))
  // Activo ahora mismo: siempre empieza en silencio, porque el navegador solo
  // deja preparar el audio dentro de un gesto.
  const [enabled, setEnabled] = useState(false)
  // Lo que la persona eligió la última vez; solo preselecciona la portada.
  const [preference, setPreference] = useState<SoundPreference>(() =>
    persist ? readPreferences().sound : 'off',
  )
  const status = useSyncExternalStore(
    audio.subscribe,
    audio.getStatus,
    audio.getStatus,
  )

  useEffect(
    () => () => {
      audio.dispose()
      // Lo último que se cierra: la voz ya no lo usa. Se olvida para que, si el proveedor
      // vuelve a mostrarse sin haberse desmontado, el siguiente gesto cree uno nuevo.
      const context = contextRef.current
      contextRef.current = null
      if (context) void context.close().catch(() => undefined)
    },
    [audio],
  )

  // Tras borrar los datos la aplicación vuelve al silencio inicial.
  useEffect(() => {
    if (!persist) return
    return subscribeToUserDataCleared(() => {
      setEnabled(false)
      setPreference('off')
      audio.disable()
    })
  }, [persist, audio])

  const remember = (next: SoundPreference) => {
    if (!persist || next === preference) return
    setPreference(next)
    updatePreferences({ sound: next })
  }

  // Debe llamarse dentro de un gesto: es donde el navegador deja preparar el audio.
  const unlock = () => {
    setEnabled(true)
    remember('on')
    void audio.prepare()
  }

  const enable = () => {
    if (!deferAudio) return unlock()
    setEnabled(true)
    remember('on')
  }

  const disable = () => {
    setEnabled(false)
    remember('off')
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
        preference,
        status,
        enable,
        unlock,
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
