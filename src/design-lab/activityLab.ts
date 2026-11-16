import {
  activityLabel,
  type ActivityKind,
} from '../components/sofi/visual/activityLabels'

// T068 · prototipos del indicador de actividad (spec 008 §4; D-8). Un guiño al indicador de
// trabajo de Claude Code: un glifo que florece y se recoge, de ida y vuelta, junto a una
// etiqueta que sigue la operación real. Los glifos son dibujos de píxel propios de Sofi, sin
// caracteres, logotipos ni código de Claude. No es el componente definitivo
// (`ActivityIndicator`, T079–T080). Lo aprobado con AV1 (variante `bloom`) consta en plan §11.6.

// Un fotograma es una rejilla cuadrada: «#» es un píxel encendido.
export type GlyphFrame = ReadonlyArray<string>

export type ActivityVariant = {
  id: string
  name: string
  frames: ReadonlyArray<GlyphFrame>
  // Ritmo propuesto: tiempo de cada paso del ciclo.
  frameMs: number
  // Fotograma que se ve quieto con movimiento reducido.
  stillFrame: number
}

export const ACTIVITY_VARIANTS: ReadonlyArray<ActivityVariant> = [
  {
    id: 'bloom',
    name: 'Destello',
    // El más cercano a la referencia: de un punto a un asterisco de ocho brazos.
    frames: [
      [
        '.......',
        '.......',
        '.......',
        '...#...',
        '.......',
        '.......',
        '.......',
      ],
      [
        '.......',
        '.......',
        '...#...',
        '..###..',
        '...#...',
        '.......',
        '.......',
      ],
      [
        '.......',
        '...#...',
        '...#...',
        '.#####.',
        '...#...',
        '...#...',
        '.......',
      ],
      [
        '.......',
        '.#.#.#.',
        '..###..',
        '.#####.',
        '..###..',
        '.#.#.#.',
        '.......',
      ],
      [
        '#..#..#',
        '.#.#.#.',
        '..###..',
        '#######',
        '..###..',
        '.#.#.#.',
        '#..#..#',
      ],
    ],
    frameMs: 120,
    stillFrame: 3,
  },
  {
    id: 'sparkle',
    name: 'Chispa',
    // Estrella de cuatro puntas, como las chispas de los sprites de Sofi.
    frames: [
      [
        '.......',
        '.......',
        '...#...',
        '..###..',
        '...#...',
        '.......',
        '.......',
      ],
      [
        '.......',
        '...#...',
        '..###..',
        '.#####.',
        '..###..',
        '...#...',
        '.......',
      ],
      [
        '...#...',
        '...#...',
        '..###..',
        '#######',
        '..###..',
        '...#...',
        '...#...',
      ],
      [
        '#..#..#',
        '...#...',
        '..###..',
        '#######',
        '..###..',
        '...#...',
        '#..#..#',
      ],
    ],
    frameMs: 150,
    stillFrame: 2,
  },
  {
    id: 'chunky',
    name: 'Píxel gordo',
    // Rejilla de 5: menos píxeles y más grandes. Alterna cruz y aspa al crecer.
    frames: [
      ['.....', '.....', '..#..', '.....', '.....'],
      ['.....', '..#..', '.###.', '..#..', '.....'],
      ['.....', '.#.#.', '..#..', '.#.#.', '.....'],
      ['#.#.#', '.###.', '#####', '.###.', '#.#.#'],
    ],
    frameMs: 180,
    stillFrame: 3,
  },
]

// Ida y vuelta sin repetir los extremos: 0 1 2 3 4 3 2 1 | 0 …
export function pingPong(count: number): number[] {
  const forward = Array.from({ length: count }, (_, index) => index)
  return [...forward, ...forward.slice(1, -1).reverse()]
}

export function cycleOf(
  variant: ActivityVariant,
  frameMs: number = variant.frameMs,
) {
  const sequence = pingPong(variant.frames.length)
  return {
    sequence,
    stillIndex: sequence.indexOf(variant.stillFrame),
    cycleMs: sequence.length * frameMs,
  }
}

// Simulación de la operación real que acompaña el indicador.
// `retained`: el resultado llegó y espera al primer ciclo de `sofing` (catálogo §6.4); la
// operación ya terminó.
export type ActivityPhase = 'idle' | 'pending' | 'retained' | 'done'

export type ActivityState = {
  kind: ActivityKind
  phase: ActivityPhase
  startedAt: number
}

export type ActivityAction =
  | { type: 'start'; kind: ActivityKind; at: number }
  | { type: 'skip'; ms: number }
  | { type: 'retain' }
  | { type: 'finish' }

export function createActivityState(): ActivityState {
  return { kind: 'analysis', phase: 'idle', startedAt: 0 }
}

export function activityReducer(
  state: ActivityState,
  action: ActivityAction,
): ActivityState {
  switch (action.type) {
    case 'start':
      return { kind: action.kind, phase: 'pending', startedAt: action.at }
    case 'skip':
      return state.phase === 'pending'
        ? { ...state, startedAt: state.startedAt - action.ms }
        : state
    case 'retain':
      // La retención es solo del análisis: la carga de una vista no espera (catálogo §6.4).
      return state.phase === 'pending' && state.kind === 'analysis'
        ? { ...state, phase: 'retained' }
        : state
    case 'finish':
      return state.phase === 'pending' || state.phase === 'retained'
        ? { ...state, phase: 'done' }
        : state
  }
}

export type IndicatorMode = 'animated' | 'still' | 'hidden'

export function activityView(
  state: ActivityState,
  now: number,
  reducedMotion: boolean,
) {
  const pending = state.phase === 'pending'
  const elapsedMs = pending ? Math.max(0, now - state.startedAt) : 0
  const label = activityLabel({
    kind: state.kind,
    pending,
    elapsedMs,
    reducedMotion,
  })
  const indicator: IndicatorMode = !pending
    ? 'hidden'
    : reducedMotion
      ? 'still'
      : 'animated'
  return { pending, elapsedMs, label, indicator }
}
