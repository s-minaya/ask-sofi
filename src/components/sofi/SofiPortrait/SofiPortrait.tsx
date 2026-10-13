import { useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../../utils/cx'
import styles from './SofiPortrait.module.scss'

// La pantalla decide la expresión; el retrato elige fotograma. Cuando lleguen
// las animaciones de 008 cambiará el recurso, no este componente.
export type SofiExpression =
  'attentive' | 'thinking' | 'unconvinced' | 'oops' | 'talking'
export type SofiFrame = 'blink' | 0 | 1 | 2

// Provisional hasta 008: «pensando» y «poco convencida» usan los ojos entrecerrados,
// «ups» los cerrados y «hablando» el parpadeo, a la espera de su sprite propio.
export const EXPRESSION_FRAMES: Record<SofiExpression, SofiFrame> = {
  attentive: 'blink',
  thinking: 1,
  unconvinced: 1,
  oops: 2,
  talking: 'blink',
}

export type SofiCrop = {
  width: number
  height: number
  // Desplazamiento del sprite dentro del recorte, para encuadrar la cara.
  offsetX: number
  offsetY: number
  background?: string
  frame?: 'none' | 'border' | 'sticker'
}

type SofiPortraitProps = {
  // Lado en px con el que se pinta el fotograma.
  size: number
  expression?: SofiExpression
  frame?: SofiFrame
  crop?: SofiCrop
  // Describe la expresión cuando aporta; vacío cuando acompaña a un texto que ya lo dice.
  alt?: string
  outline?: boolean
  // Imagen estática que sustituye al parpadeo cuando carga. Mientras tanto, o si
  // falla, se ve el fotograma: Sofi nunca se queda sin representación.
  image?: string
  className?: string
  style?: CSSProperties
}

const FRAME_CLASS = {
  blink: undefined,
  0: styles.frame0,
  1: styles.frame1,
  2: styles.frame2,
}

export function SofiPortrait({
  size,
  expression = 'attentive',
  frame,
  crop,
  alt = '',
  outline = false,
  image,
  className,
  style,
}: SofiPortraitProps) {
  const shownFrame = frame ?? EXPRESSION_FRAMES[expression]
  const a11y = alt
    ? { role: 'img', 'aria-label': alt }
    : { 'aria-hidden': true as const }
  // Con recorte o imagen, la accesibilidad pasa al contenedor exterior.
  const wrapped = Boolean(crop || image)
  const placement = crop
    ? { margin: `${-crop.offsetY}px 0 0 ${-crop.offsetX}px` }
    : undefined
  const sprite = (
    <span
      className={cx(
        styles['sofi-blink'],
        styles.sprite,
        FRAME_CLASS[shownFrame],
        outline && styles.outline,
        !wrapped && className,
      )}
      style={{
        // Con imagen y sin recorte, el contenedor manda: la alternativa lo sigue.
        width: image && !crop ? '100%' : size,
        height: image && !crop ? '100%' : size,
        ...(wrapped ? placement : style),
      }}
      {...(wrapped ? { 'aria-hidden': true as const } : a11y)}
    />
  )

  if (!wrapped) return sprite

  const content = image ? (
    <PortraitImage
      key={image}
      src={image}
      size={size}
      outline={outline}
      style={placement}
      fallback={sprite}
    />
  ) : (
    sprite
  )

  if (!crop)
    return (
      <span
        className={cx(styles.portrait, className)}
        style={{ width: size, height: size, ...style }}
        {...a11y}
      >
        {content}
      </span>
    )

  return (
    <span
      className={cx(
        styles.crop,
        crop.frame === 'border' && styles.cropBorder,
        crop.frame === 'sticker' && styles.cropSticker,
        className,
      )}
      style={{
        width: crop.width,
        height: crop.height,
        background: crop.background,
        ...style,
      }}
      {...a11y}
    >
      {content}
    </span>
  )
}

type PortraitImageProps = {
  src: string
  size: number
  outline: boolean
  style?: CSSProperties
  fallback: ReactNode
}

// Una instancia por imagen (key): al cambiar de recurso vuelve a esperar su carga.
function PortraitImage({
  src,
  size,
  outline,
  style,
  fallback,
}: PortraitImageProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )
  return (
    <>
      {status !== 'ready' && fallback}
      {status !== 'failed' && (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          decoding="async"
          hidden={status !== 'ready'}
          className={cx(styles.image, outline && styles.outline)}
          style={style}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('failed')}
        />
      )}
    </>
  )
}
