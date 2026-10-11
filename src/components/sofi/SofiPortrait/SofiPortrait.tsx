import type { CSSProperties } from 'react'
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
  className,
  style,
}: SofiPortraitProps) {
  const shownFrame = frame ?? EXPRESSION_FRAMES[expression]
  const a11y = alt
    ? { role: 'img', 'aria-label': alt }
    : { 'aria-hidden': true as const }
  const sprite = (
    <span
      className={cx(
        styles['sofi-blink'],
        styles.sprite,
        FRAME_CLASS[shownFrame],
        outline && styles.outline,
        !crop && className,
      )}
      style={{
        width: size,
        height: size,
        ...(crop
          ? { margin: `${-crop.offsetY}px 0 0 ${-crop.offsetX}px` }
          : style),
      }}
      {...(crop ? { 'aria-hidden': true as const } : a11y)}
    />
  )

  if (!crop) return sprite

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
      {sprite}
    </span>
  )
}
