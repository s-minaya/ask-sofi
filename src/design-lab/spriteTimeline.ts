// Línea de tiempo por fotograma del inspector (T060, catálogo §8). Se deriva de los fotogramas
// clave reales de la animación de la tira (`getKeyframes()`): no guarda duraciones ni fotogramas
// propios, y si los datos no permiten dibujarla sin inventar nada, no hay línea de tiempo.

// Lo que se usa de `getKeyframes()` de la animación de la tira de un parcial.
export type TimelineKeyframe = {
  computedOffset: number
  backgroundPositionX?: string | number | null
  easing?: string
}

export type TimelineStep = { start: number; end: number; frame: number }

export type Timeline = {
  // Duración de un ciclo, en ms, tal como la da la propia animación.
  duration: number
  frames: number
  steps: TimelineStep[]
}

// Fotograma que corresponde a una posición de la tira. Solo vale una posición que cae en un
// fotograma: cualquier otra cosa (otra unidad, un valor intermedio) no se redondea a uno.
export function frameOf(
  position: string | number | null | undefined,
  frames: number,
): number | null {
  if (typeof position !== 'string' || !position.endsWith('%')) return null
  const percent = Number(position.slice(0, -1))
  if (!Number.isFinite(percent)) return null
  if (frames <= 1) return percent === 0 ? 0 : null
  const exact = (percent / 100) * (frames - 1)
  const frame = Math.round(exact)
  // Los parciales escriben 33.3333 %: unas milésimas de margen, no un fotograma de margen.
  if (Math.abs(exact - frame) > 0.01 || frame < 0 || frame > frames - 1)
    return null
  return frame
}

export function buildTimeline(
  keyframes: readonly TimelineKeyframe[],
  duration: number,
  frames: number,
): Timeline | null {
  if (!Number.isFinite(duration) || duration <= 0 || frames < 1) return null
  const steps: TimelineStep[] = []
  for (const [index, keyframe] of keyframes.entries()) {
    const start = keyframe.computedOffset
    const end = keyframes[index + 1]?.computedOffset ?? 1
    // El último fotograma clave cierra el ciclo y los repetidos no ocupan tiempo.
    if (end <= start) continue
    const frame = frameOf(keyframe.backgroundPositionX, frames)
    // Entre fotogramas de una tira tiene que haber un salto, no una interpolación.
    if (frame === null || !keyframe.easing?.startsWith('steps(')) return null
    steps.push({ start, end, frame })
  }
  return steps.length ? { duration, frames, steps } : null
}

export function stepDuration(timeline: Timeline, step: TimelineStep): number {
  return Math.round((step.end - step.start) * timeline.duration)
}

// Lo que dura un fotograma en un ciclo, sumando todos sus tramos.
export function frameDuration(timeline: Timeline, frame: number): number {
  return timeline.steps
    .filter((step) => step.frame === frame)
    .reduce((total, step) => total + stepDuration(timeline, step), 0)
}

export function frameAtProgress(
  timeline: Timeline,
  progress: number | null,
): number {
  const at = progress ?? 0
  const step =
    timeline.steps.find((s) => at >= s.start && at < s.end) ??
    (at < 0 ? timeline.steps[0] : timeline.steps.at(-1)!)
  return step.frame
}

// Instante al que saltar para ver un fotograma: el centro de su primer tramo, porque en el borde
// exacto el navegador puede redondear al fotograma anterior.
export function seekTimeOfFrame(
  timeline: Timeline,
  frame: number,
): number | null {
  const step = timeline.steps.find((s) => s.frame === frame)
  return step ? ((step.start + step.end) / 2) * timeline.duration : null
}

// El progreso nunca llega a 1: sería el principio del siguiente ciclo.
const MAX_PROGRESS = 0.9999

export function progressAtPointer(
  clientX: number,
  bar: { left: number; width: number },
): number {
  if (bar.width <= 0) return 0
  return Math.min(Math.max((clientX - bar.left) / bar.width, 0), MAX_PROGRESS)
}

export function timeAtProgress(progress: number, duration: number): number {
  return progress * duration
}

// Mover el cabezal con el teclado: da la vuelta al ciclo en los dos extremos.
export function nudgeTime(
  current: number,
  delta: number,
  duration: number,
): number {
  return (((current + delta) % duration) + duration) % duration
}
