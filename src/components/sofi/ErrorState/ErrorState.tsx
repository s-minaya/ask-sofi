import type { Ref } from 'react'
import { Button } from '../../ui/Button/Button'
import { RetryIcon } from '../../ui/icons/icons'
import { Notice } from '../../ui/Notice/Notice'
import { TextLink } from '../../ui/TextLink/TextLink'
import styles from './ErrorState.module.scss'

export type ErrorKind = 'offline' | 'service' | 'unexpected'

// Textos provisionales: dicen qué ha pasado sin culpar a nadie y garantizan
// que no se ha perdido nada.
export const ERROR_COPY: Record<
  ErrorKind,
  { kicker: string; title: string; text: string }
> = {
  offline: {
    kicker: 'Sin conexión',
    title: 'Parece que no hay conexión',
    text: 'Cuando vuelva, reintenta: tu mensaje sigue aquí.',
  },
  service: {
    kicker: 'Error de conexión',
    title: 'Se ha cortado la línea',
    text: 'No he podido leer tu mensaje esta vez. Tu mensaje y tu contexto siguen aquí: no se ha perdido nada.',
  },
  unexpected: {
    kicker: 'Algo inesperado',
    title: 'Esto no me lo esperaba',
    text: 'Prueba otra vez en un momento; si sigue pasando, no es cosa tuya.',
  },
}

type ErrorStateProps = {
  kind?: ErrorKind
  onRetry: () => void
  onEdit: () => void
  titleAs?: 'h1' | 'h2' | 'h3'
  // Al aparecer tras una acción, el foco va a su titular.
  titleRef?: Ref<HTMLHeadingElement>
  // Solo cuando el error aparece después de una acción: entonces interrumpe.
  announce?: boolean
  className?: string
}

export function ErrorState({
  kind = 'service',
  onRetry,
  onEdit,
  titleAs = 'h2',
  titleRef,
  announce = false,
  className,
}: ErrorStateProps) {
  const copy = ERROR_COPY[kind]
  return (
    <Notice
      tone="danger"
      kicker={copy.kicker}
      title={copy.title}
      titleAs={titleAs}
      titleClassName={styles.title}
      titleRef={titleRef}
      role={announce ? 'alert' : undefined}
      className={className}
    >
      <p className={styles.text}>{copy.text}</p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          icon={<RetryIcon size={18} />}
          onClick={onRetry}
        >
          Reintentar
        </Button>
        <TextLink onClick={onEdit}>Editar mensaje</TextLink>
      </div>
    </Notice>
  )
}
