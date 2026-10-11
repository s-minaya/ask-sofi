import { cx } from '../../../utils/cx'
import { SofiPortrait, type SofiFrame } from '../SofiPortrait/SofiPortrait'
import styles from './PhotoBooth.module.scss'

const SHOTS: ReadonlyArray<{ frame: SofiFrame; background: string }> = [
  { frame: 0, background: 'var(--tone-pink-soft)' },
  { frame: 1, background: 'var(--tone-butter)' },
  { frame: 2, background: 'var(--tone-lilac)' },
]

type PhotoBoothProps = {
  // «auto»: vertical desde 1080 px y horizontal por debajo. El Lab puede fijar una.
  orientation?: 'auto' | 'vertical' | 'horizontal'
  // La tira vertical de la portada usa recortes de 180 px; la del Design Lab, de 150 px.
  size?: 'lg' | 'md'
  caption?: string
  className?: string
}

const VERTICAL = {
  lg: { sprite: 384, crop: 180, offsetX: 102, offsetY: 88 },
  md: { sprite: 320, crop: 150, offsetX: 85, offsetY: 74 },
}

// Decorativa: los fotogramas no tienen texto alternativo y el pie lo cuenta.
export function PhotoBooth({
  orientation = 'auto',
  size = 'lg',
  caption = 'Pillada leyendo tus mensajes',
  className,
}: PhotoBoothProps) {
  const vertical = VERTICAL[size]
  const showVertical = orientation !== 'horizontal'
  const showHorizontal = orientation !== 'vertical'
  return (
    <>
      {showVertical && (
        <figure
          className={cx(styles.strip, styles.vertical, className)}
          style={orientation === 'vertical' ? { display: 'grid' } : undefined}
        >
          {SHOTS.map((shot) => (
            <SofiPortrait
              key={String(shot.frame)}
              size={vertical.sprite}
              frame={shot.frame}
              crop={{
                width: vertical.crop,
                height: vertical.crop,
                offsetX: vertical.offsetX,
                offsetY: vertical.offsetY,
                background: shot.background,
              }}
            />
          ))}
          <figcaption className={styles.caption}>{caption}</figcaption>
        </figure>
      )}
      {showHorizontal && (
        <figure
          className={cx(styles.strip, styles.horizontal, className)}
          style={orientation === 'horizontal' ? { display: 'flex' } : undefined}
        >
          {SHOTS.map((shot) => (
            <SofiPortrait
              key={String(shot.frame)}
              size={192}
              frame={shot.frame}
              className={styles.small}
              crop={{
                width: 96,
                height: 96,
                offsetX: 48,
                offsetY: 42,
                background: shot.background,
              }}
            />
          ))}
          <figcaption className={styles.hidden}>
            Sofi en el fotomatón, {caption.toLowerCase()}
          </figcaption>
        </figure>
      )}
    </>
  )
}
