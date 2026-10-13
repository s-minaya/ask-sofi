import { useSound } from '../../../hooks/useSound'
import { SoundOffIcon } from '../../ui/icons/icons'
import { InlineNotice } from '../../ui/Notice/Notice'
import { TextLink } from '../../ui/TextLink/TextLink'

// Avisa de que el navegador ha bloqueado el sonido o de que no está disponible.
// Va en el flujo, bajo el diálogo: llega tras preparar el audio (~0,3 s, o más
// con red lenta) y es la ruta rara, así que lo que baja es lo que va debajo.
export function SoundNotice() {
  const sound = useSound()
  if (!sound.enabled) return null

  if (sound.status === 'blocked')
    return (
      <InlineNotice role="status" icon={<SoundOffIcon size={18} />}>
        <span>Tu navegador ha bloqueado el sonido.</span>
        <TextLink size="sm" onClick={sound.unlock}>
          Activar sonido
        </TextLink>
        <TextLink size="sm" onClick={sound.disable}>
          Seguir sin sonido
        </TextLink>
      </InlineNotice>
    )

  if (sound.status === 'unavailable')
    return (
      <InlineNotice
        role="status"
        tone="plain"
        icon={<SoundOffIcon size={18} />}
      >
        <span>
          El sonido no está disponible. Sofi seguirá escribiendo en silencio.
        </span>
      </InlineNotice>
    )

  return null
}
