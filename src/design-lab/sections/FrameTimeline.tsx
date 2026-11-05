import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cx } from '../../utils/cx'
import { formatDuration } from '../foundationsData'
import { LabNote, LabSub } from '../parts/LabParts'
import {
  buildTimeline,
  frameAtProgress,
  frameDuration,
  nudgeTime,
  progressAtPointer,
  seekTimeOfFrame,
  stepDuration,
  timeAtProgress,
  type Timeline,
  type TimelineKeyframe,
} from '../spriteTimeline'
import styles from './FrameTimeline.module.scss'

// Línea de tiempo por fotograma del inspector (T060, catálogo §8). Lee de la animación real de la
// tira del recurso (`getKeyframes()` y su tiempo): no guarda duraciones ni fotogramas propios.
// Dibuja la pista del cuerpo; las capas y los efectos (pseudoelementos, giros, opacidad) tienen
// sus propias pistas y solo se mueven con el cabezal.

type FrameTimelineProps = {
  // El escenario del recurso: de él cuelgan todas sus animaciones.
  scope: HTMLElement | null
  paused: boolean
  onPause: () => void
  // Para recorrer una pasada ya terminada: el navegador deja de exponer su animación y hay que
  // volver a lanzarla.
  onRestart: () => void
  // Una máquina de estados compone sus capas según el estado: no hay una pista única que dibujar.
  machine?: boolean
}

type Source = {
  timeline: Timeline | null
  image: string
  aspectRatio: string
}

// La animación de la tira del cuerpo: la del propio elemento (no la de un pseudoelemento) que
// mueve `background-position-x`.
function findMain(scope: HTMLElement): Animation | null {
  for (const animation of scope.getAnimations?.({ subtree: true }) ?? []) {
    const effect = animation.effect as KeyframeEffect | null
    if (!effect || effect.pseudoElement) continue
    if (
      effect
        .getKeyframes()
        .some((keyframe) => 'backgroundPositionX' in keyframe)
    )
      return animation
  }
  return null
}

function readSource(animation: Animation): Source {
  const effect = animation.effect as KeyframeEffect
  const style = getComputedStyle(effect.target as Element)
  const frames = parseInt(style.getPropertyValue('--sprite-frames'), 10) || 1
  return {
    timeline: buildTimeline(
      effect.getKeyframes() as TimelineKeyframe[],
      Number(effect.getComputedTiming().duration),
      frames,
    ),
    image: style.backgroundImage,
    aspectRatio: style.aspectRatio,
  }
}

// Una animación sigue viva mientras el elemento la tenga. Una pasada terminada puede seguir
// conectada y con estado «finished», pero ya no está entre las suyas: moverla no mueve nada.
const isLive = (
  animation: Animation | null,
  scope: HTMLElement | null,
): animation is Animation =>
  animation !== null &&
  scope?.getAnimations?.({ subtree: true }).includes(animation) === true

// Los tramos largos llevan rótulo, como en 4.4.
const LONG_STEP_MS = 1000
const FRAME_CLASS = [
  styles.frame0,
  styles.frame1,
  styles.frame2,
  styles.frame3,
  styles.frame4,
  styles.frame5,
]
const frameClass = (frame: number) => FRAME_CLASS[frame % FRAME_CLASS.length]

type Position = { percent: number; frame: number; ms: number }

export function FrameTimeline({
  scope,
  paused,
  onPause,
  onRestart,
  machine = false,
}: FrameTimelineProps) {
  const [source, setSource] = useState<Source | null>(null)
  const [position, setPosition] = useState<Position>({
    percent: 0,
    frame: 0,
    ms: 0,
  })
  const animation = useRef<Animation | null>(null)
  const head = useRef<HTMLSpanElement>(null)
  // Instante al que ir cuando nazca la animación que se está reiniciando.
  const pending = useRef<number | null>(null)
  // La de la animación que se sigue, para usarla en el mismo fotograma en que se descubre.
  const followed = useRef<Timeline | null>(null)
  const timeline = source?.timeline ?? null

  const moveAll = (ms: number) => {
    for (const each of scope?.getAnimations?.({ subtree: true }) ?? [])
      each.currentTime = ms
  }

  const seek = (ms: number) => {
    if (!paused) onPause()
    if (isLive(animation.current, scope)) {
      moveAll(ms)
      return
    }
    // La animación ya terminó: se reinicia (ya en pausa) y se coloca al nacer la nueva.
    const waiting = pending.current !== null
    pending.current = ms
    if (!waiting) onRestart()
  }

  const follow = useEffectEvent(() => {
    const current = animation.current
    if (!isLive(current, scope)) {
      const found = scope ? findMain(scope) : null
      animation.current = found
      if (!found) return
      const read = readSource(found)
      followed.current = read.timeline
      setSource(read)
      if (pending.current !== null) {
        moveAll(pending.current)
        pending.current = null
      }
    }
    const main = animation.current
    if (!main) return
    const duration = Number(
      (main.effect as KeyframeEffect).getComputedTiming().duration,
    )
    const progress = (main.effect as KeyframeEffect).getComputedTiming()
      .progress
    if (progress === null || progress === undefined) return
    if (head.current) head.current.style.left = `${progress * 100}%`
    const frame = followed.current
      ? frameAtProgress(followed.current, progress)
      : 0
    const next = {
      percent: Math.round(progress * 100),
      frame,
      // Décimas: no hace falta volver a pintar cada fotograma por un milisegundo más.
      ms: Math.round((progress * duration) / 100) * 100,
    }
    setPosition((previous) =>
      previous.percent === next.percent &&
      previous.frame === next.frame &&
      previous.ms === next.ms
        ? previous
        : next,
    )
  })

  // El cabezal sigue a una animación que vive fuera de React: se lee en cada fotograma.
  useEffect(() => {
    if (!scope || machine) return
    let frame = 0
    const loop = () => {
      follow()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [scope, machine])

  if (machine) {
    return (
      <section className={styles.timeline} aria-label="Línea de tiempo">
        <LabSub>Línea de tiempo</LabSub>
        <LabNote>
          Una máquina de estados no tiene una línea de tiempo única: cada estado
          crea sus propias capas y su controlador decide cuándo cambian.
        </LabNote>
      </section>
    )
  }

  if (!source) {
    return (
      <section className={styles.timeline} aria-label="Línea de tiempo">
        <LabSub>Línea de tiempo</LabSub>
        <LabNote>
          Sin animación en curso: con movimiento reducido no hay nada que
          recorrer.
        </LabNote>
      </section>
    )
  }

  if (!timeline) {
    return (
      <section className={styles.timeline} aria-label="Línea de tiempo">
        <LabSub>Línea de tiempo</LabSub>
        <LabNote>
          Esta animación no se puede dibujar por fotogramas sin inventar nada:
          sus fotogramas clave no son saltos entre fotogramas de la tira.
        </LabNote>
      </section>
    )
  }

  const { duration, frames } = timeline
  const percentOf = (ms: number) => `${(ms / duration) * 100}%`

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    seek(
      timeAtProgress(
        progressAtPointer(event.clientX, { left: box.left, width: box.width }),
        duration,
      ),
    )
  }
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const now = position.percent
    const current = isLive(animation.current, scope)
      ? ((animation.current.effect as KeyframeEffect).getComputedTiming()
          .progress ?? 0) * duration
      : (now / 100) * duration
    const target = {
      ArrowLeft: () => nudgeTime(current, -100, duration),
      ArrowRight: () => nudgeTime(current, 100, duration),
      Home: () => 0,
      End: () => timeAtProgress(0.9999, duration),
    }[event.key]
    if (!target) return
    event.preventDefault()
    seek(target())
  }

  return (
    <section className={styles.timeline} aria-label="Línea de tiempo">
      <LabSub>Línea de tiempo</LabSub>
      <p className={styles.facts}>
        {frames} {frames === 1 ? 'fotograma' : 'fotogramas'} ·{' '}
        {formatDuration(duration)} por ciclo
      </p>

      <div className={styles.barWrap}>
        <div
          className={styles.bar}
          role="slider"
          tabIndex={0}
          aria-label="Posición en la animación"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={position.percent}
          aria-valuetext={`en el fotograma ${position.frame}, ${formatDuration(position.ms)} de ${formatDuration(duration)}`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId)
            onPointer(event)
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture?.(event.pointerId))
              onPointer(event)
          }}
          onKeyDown={onKey}
        >
          {timeline.steps.map((step) => (
            <span
              key={step.start}
              aria-hidden="true"
              className={frameClass(step.frame)}
              style={{ width: percentOf(stepDuration(timeline, step)) }}
            >
              {stepDuration(timeline, step) >= LONG_STEP_MS
                ? `F${step.frame} · ${formatDuration(stepDuration(timeline, step))}`
                : null}
            </span>
          ))}
          <span ref={head} aria-hidden="true" className={styles.head} />
        </div>
        <div className={styles.ends} aria-hidden="true">
          <span>0</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <ul className={styles.frames}>
        {Array.from({ length: frames }, (_, frame) => {
          const ms = frameDuration(timeline, frame)
          const target = seekTimeOfFrame(timeline, frame)
          return (
            <li key={frame}>
              <button
                type="button"
                className={cx(styles.thumb, frameClass(frame))}
                aria-label={`Ir al fotograma ${frame}, ${ms} ms`}
                aria-current={position.frame === frame ? 'true' : undefined}
                disabled={target === null}
                onClick={() => target !== null && seek(target)}
              >
                <span
                  aria-hidden="true"
                  className={styles.thumbImage}
                  style={thumbStyle(source, frame, frames)}
                />
                <span aria-hidden="true" className={styles.thumbLabel}>
                  <b>{frame}</b>
                  <span>{ms} ms</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <LabNote>
        La pista del cuerpo. Las capas y los efectos se mueven con ella, pero
        tienen su propia pista.
      </LabNote>
    </section>
  )
}

// La miniatura de un fotograma: el mismo recurso de la tira, a su posición.
function thumbStyle(
  source: Source,
  frame: number,
  frames: number,
): CSSProperties {
  return {
    backgroundImage: source.image,
    backgroundSize: `${frames * 100}% 100%`,
    backgroundPositionX: frames > 1 ? `${(frame / (frames - 1)) * 100}%` : '0%',
    aspectRatio: source.aspectRatio === 'auto' ? '1 / 1' : source.aspectRatio,
  }
}
