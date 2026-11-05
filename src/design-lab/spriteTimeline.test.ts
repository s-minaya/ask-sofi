import { describe, expect, it } from 'vitest'
import {
  buildTimeline,
  frameAtProgress,
  frameDuration,
  frameOf,
  nudgeTime,
  progressAtPointer,
  seekTimeOfFrame,
  stepDuration,
  timeAtProgress,
  type TimelineKeyframe,
} from './spriteTimeline'

// Lo que devuelve `getKeyframes()` de la animación de la tira de un parcial: un fotograma por
// cambio de `background-position-x`, con `steps(1)` entre ellos. Valores de `_sofi-blink.scss`.
const BLINK: TimelineKeyframe[] = [
  { computedOffset: 0, backgroundPositionX: '0%', easing: 'steps(1)' },
  { computedOffset: 0.5, backgroundPositionX: '50%', easing: 'steps(1)' },
  { computedOffset: 0.75, backgroundPositionX: '100%', easing: 'steps(1)' },
  { computedOffset: 1, backgroundPositionX: '0%', easing: 'steps(1)' },
]

describe('frameOf', () => {
  it('traduce el porcentaje de la tira al fotograma', () => {
    expect(frameOf('0%', 3)).toBe(0)
    expect(frameOf('50%', 3)).toBe(1)
    expect(frameOf('100%', 3)).toBe(2)
    expect(frameOf('33.3333%', 4)).toBe(1)
    expect(frameOf('66.6667%', 4)).toBe(2)
  })

  it('una tira de un solo fotograma siempre es el 0', () => {
    expect(frameOf('0%', 1)).toBe(0)
  })

  it.each([
    ['una posición que no cae en un fotograma', '40%', 3],
    ['una unidad que no es porcentaje', '12px', 3],
    ['un valor ausente', undefined, 3],
    ['un valor no numérico', 'auto', 3],
    ['un fotograma fuera de la tira', '150%', 3],
  ])('no inventa un fotograma ante %s', (_name, value, frames) => {
    expect(frameOf(value, frames)).toBeNull()
  })
})

describe('buildTimeline', () => {
  it('saca los tramos de los fotogramas clave, sin duraciones propias', () => {
    const timeline = buildTimeline(BLINK, 4200, 3)

    expect(timeline).toEqual({
      duration: 4200,
      frames: 3,
      steps: [
        { start: 0, end: 0.5, frame: 0 },
        { start: 0.5, end: 0.75, frame: 1 },
        { start: 0.75, end: 1, frame: 2 },
      ],
    })
  })

  it('los tramos suman exactamente la duración de la animación', () => {
    const timeline = buildTimeline(BLINK, 4200, 3)!
    const total = timeline.steps.reduce(
      (sum, step) => sum + stepDuration(timeline, step),
      0,
    )
    expect(total).toBe(4200)
  })

  it('descarta los tramos de longitud cero', () => {
    const timeline = buildTimeline(
      [
        { computedOffset: 0, backgroundPositionX: '0%', easing: 'steps(1)' },
        { computedOffset: 0.5, backgroundPositionX: '50%', easing: 'steps(1)' },
        {
          computedOffset: 0.5,
          backgroundPositionX: '100%',
          easing: 'steps(1)',
        },
        { computedOffset: 1, backgroundPositionX: '0%', easing: 'steps(1)' },
      ],
      1000,
      3,
    )
    expect(timeline!.steps.map((step) => step.frame)).toEqual([0, 2])
  })

  it('el último fotograma clave no tiene tramo propio: cierra el ciclo', () => {
    const timeline = buildTimeline(BLINK, 4200, 3)!
    expect(timeline.steps.at(-1)).toMatchObject({ end: 1, frame: 2 })
  })

  it.each([
    ['una animación sin duración', BLINK, 0, 3],
    ['una duración infinita', BLINK, Infinity, 3],
    ['sin fotogramas clave', [], 4200, 3],
    ['una tira sin fotogramas', BLINK, 4200, 0],
  ])('no hay línea de tiempo con %s', (_name, keyframes, duration, frames) => {
    expect(buildTimeline(keyframes, duration, frames)).toBeNull()
  })

  it('no inventa fotogramas: una posición que no cae en uno invalida la línea', () => {
    expect(
      buildTimeline(
        [
          { computedOffset: 0, backgroundPositionX: '0%', easing: 'steps(1)' },
          {
            computedOffset: 0.5,
            backgroundPositionX: '40%',
            easing: 'steps(1)',
          },
          { computedOffset: 1, backgroundPositionX: '0%', easing: 'steps(1)' },
        ],
        1000,
        3,
      ),
    ).toBeNull()
  })

  it('no la dibuja si entre fotogramas hay una interpolación que no es de paso', () => {
    expect(
      buildTimeline(
        [
          { computedOffset: 0, backgroundPositionX: '0%', easing: 'linear' },
          { computedOffset: 1, backgroundPositionX: '100%', easing: 'linear' },
        ],
        1000,
        3,
      ),
    ).toBeNull()
  })
})

describe('lectura de la línea de tiempo', () => {
  const timeline = buildTimeline(BLINK, 4200, 3)!

  it('dice qué fotograma se ve en cada instante', () => {
    expect(frameAtProgress(timeline, 0)).toBe(0)
    expect(frameAtProgress(timeline, 0.4999)).toBe(0)
    expect(frameAtProgress(timeline, 0.5)).toBe(1)
    expect(frameAtProgress(timeline, 0.75)).toBe(2)
    expect(frameAtProgress(timeline, 0.9999)).toBe(2)
  })

  it('con un progreso fuera de rango o sin él, se queda en los extremos', () => {
    expect(frameAtProgress(timeline, -1)).toBe(0)
    expect(frameAtProgress(timeline, 3)).toBe(2)
    expect(frameAtProgress(timeline, null)).toBe(0)
  })

  it('suma el tiempo de cada fotograma aunque aparezca en varios tramos', () => {
    // El 0 aparece en dos tramos (un cuarto y la mitad final del ciclo).
    const twice = buildTimeline(
      [
        { computedOffset: 0, backgroundPositionX: '0%', easing: 'steps(1)' },
        {
          computedOffset: 0.25,
          backgroundPositionX: '50%',
          easing: 'steps(1)',
        },
        { computedOffset: 0.5, backgroundPositionX: '0%', easing: 'steps(1)' },
        { computedOffset: 1, backgroundPositionX: '50%', easing: 'steps(1)' },
      ],
      2000,
      3,
    )!
    expect(frameDuration(twice, 0)).toBe(1500)
    expect(frameDuration(twice, 1)).toBe(500)
    expect(frameDuration(twice, 2)).toBe(0)
  })

  it('el centro del primer tramo de un fotograma es donde saltar a él', () => {
    // En el borde exacto el navegador puede redondear al fotograma anterior.
    expect(seekTimeOfFrame(timeline, 0)).toBe(1050)
    expect(seekTimeOfFrame(timeline, 1)).toBe(2625)
    expect(seekTimeOfFrame(timeline, 2)).toBe(3675)
    expect(frameAtProgress(timeline, 3675 / 4200)).toBe(2)
  })

  it('un fotograma que nunca se muestra no tiene a dónde saltar', () => {
    expect(
      seekTimeOfFrame(buildTimeline(BLINK.slice(0, 2), 100, 3)!, 2),
    ).toBeNull()
  })
})

describe('desplazamiento manual', () => {
  it('el puntero se traduce en un progreso dentro de la barra', () => {
    expect(progressAtPointer(150, { left: 100, width: 200 })).toBe(0.25)
    expect(progressAtPointer(100, { left: 100, width: 200 })).toBe(0)
  })

  it('el progreso nunca llega a 1, o la animación saltaría al principio del ciclo', () => {
    expect(progressAtPointer(300, { left: 100, width: 200 })).toBeLessThan(1)
    expect(progressAtPointer(900, { left: 100, width: 200 })).toBeLessThan(1)
    expect(progressAtPointer(-50, { left: 100, width: 200 })).toBe(0)
  })

  it('una barra sin ancho no divide por cero', () => {
    expect(progressAtPointer(10, { left: 0, width: 0 })).toBe(0)
  })

  it('traduce un progreso en el instante de la animación', () => {
    expect(timeAtProgress(0.5, 4200)).toBe(2100)
  })

  it('las flechas mueven 100 ms y dan la vuelta al ciclo', () => {
    expect(nudgeTime(1000, 100, 4200)).toBe(1100)
    expect(nudgeTime(1000, -100, 4200)).toBe(900)
    expect(nudgeTime(4150, 100, 4200)).toBe(50)
    expect(nudgeTime(50, -100, 4200)).toBe(4150)
  })
})
