import { APPROVED_CASES, E4_PROFILES } from './approvedData.ts'
import type { Design, Fixture, Pair } from './types.ts'

// E1 (006-plan §5.2). El texto, el inglés de referencia, las etiquetas y su
// procedencia vienen de los ficheros que aprobó la autora (`approvedData.ts`),
// y los expedientes de E4 del fichero aparte: aquí no se copian. Esta tabla solo
// añade lo que esos ficheros no dicen: origen en el registro, intención de
// diseño, pares y subconjunto canario. Sin entrada para un caso, o con una
// entrada sobrante, el módulo falla al cargarse.
export const REFERENCE_STATUS = 'author-approved'
export const LABELS_STATUS = 'author-approved'

type Meta = {
  source: string
  design?: Design[]
  pair?: Pair
  canary?: boolean
}

const minimal = (
  id: string,
  role: 'without_context' | 'with_context',
): Pair => ({
  id,
  kind: 'minimal',
  role,
})
const gender = (id: string, role: 'feminine' | 'masculine'): Pair => ({
  id,
  kind: 'gender',
  role,
})

// H01–H30 y C1–C20 del registro, T01–T08 de la evaluación del redactor o
// 'new' para los casos escritos para E1.
const META: Record<string, Meta> = {
  'e1-01': {
    source: 'H01',
    pair: minimal('P1', 'without_context'),
    canary: true,
  },
  'e1-02': { source: 'H02', pair: minimal('P1', 'with_context'), canary: true },
  'e1-03': { source: 'H03' },
  'e1-04': { source: 'H04', design: ['emoji_only'] },
  'e1-05': { source: 'H05', design: ['emoji_only'] },
  'e1-06': { source: 'H06', canary: true },
  'e1-07': { source: 'H07' },
  'e1-08': { source: 'H08', canary: true },
  'e1-09': { source: 'H09', design: ['explicit_boundary'], canary: true },
  'e1-10': { source: 'H10', pair: gender('G3', 'feminine') },
  'e1-11': { source: 'H10', pair: gender('G3', 'masculine') },
  'e1-12': { source: 'H11', canary: true },
  'e1-13': { source: 'H12', canary: true },
  'e1-14': { source: 'H13' },
  'e1-15': { source: 'T02' },
  'e1-16': { source: 'T03' },
  'e1-17': { source: 'T04' },
  'e1-18': { source: 'T05', canary: true },
  'e1-19': { source: 'T06' },
  'e1-20': { source: 'T07', design: ['emoji_only'] },
  'e1-21': { source: 'T08' },
  'e1-22': { source: 'C7', pair: minimal('P6', 'without_context') },
  'e1-23': { source: 'C7', pair: minimal('P6', 'with_context') },
  'e1-24': { source: 'C1' },
  'e1-25': { source: 'C1' },
  'e1-26': { source: 'C3', design: ['omitted_marker'], canary: true },
  'e1-27': { source: 'C3', design: ['omitted_marker'] },
  'e1-28': { source: 'H23', design: ['hyperbole_candidate'], canary: true },
  'e1-29': { source: 'new', design: ['hyperbole_candidate'] },
  'e1-30': { source: 'new', design: ['hyperbole_candidate'] },
  'e1-31': { source: 'new', design: ['hyperbole_candidate'] },
  'e1-32': { source: 'H24', design: ['safety_candidate'], canary: true },
  'e1-33': { source: 'H25', design: ['safety_candidate'] },
  'e1-34': { source: 'H26', design: ['safety_candidate'] },
  'e1-35': { source: 'C4', design: ['safety_candidate'] },
  'e1-36': { source: 'H27', design: ['injection'], canary: true },
  'e1-37': { source: 'H27', design: ['injection'] },
  'e1-38': { source: 'C13', design: ['injection'] },
  'e1-39': { source: 'new', pair: minimal('P2', 'without_context') },
  'e1-40': { source: 'new', pair: minimal('P2', 'with_context') },
  'e1-41': { source: 'new', pair: minimal('P3', 'without_context') },
  'e1-42': { source: 'new', pair: minimal('P3', 'with_context') },
  'e1-43': { source: 'new', pair: minimal('P4', 'without_context') },
  'e1-44': { source: 'new', pair: minimal('P4', 'with_context') },
  'e1-45': { source: 'new', pair: minimal('P5', 'without_context') },
  'e1-46': { source: 'new', pair: minimal('P5', 'with_context') },
  'e1-47': { source: 'new', pair: gender('G1', 'feminine') },
  'e1-48': { source: 'new', pair: gender('G1', 'masculine') },
  'e1-49': { source: 'new', pair: gender('G2', 'feminine') },
  'e1-50': { source: 'new', pair: gender('G2', 'masculine') },
  'e1-51': { source: 'new', pair: gender('G4', 'feminine') },
  'e1-52': { source: 'new', pair: gender('G4', 'masculine') },
  'e1-53': { source: 'new', design: ['profile_misleading'] },
  'e1-54': { source: 'new', design: ['profile_coherent'] },
  'e1-55': { source: 'new', design: ['profile_misleading'] },
  'e1-56': { source: 'new', design: ['profile_coherent'] },
  'e1-57': { source: 'new', design: ['profile_misleading'] },
  'e1-58': { source: 'new' },
  'e1-59': { source: 'new' },
  'e1-60': { source: 'new' },
  'e1-61': { source: 'new' },
  'e1-62': { source: 'new' },
  'e1-63': { source: 'new' },
  'e1-64': { source: 'new' },
  'e1-65': { source: 'new' },
}

const unknownMeta = Object.keys(META).filter(
  (id) => !APPROVED_CASES.some((approved) => approved.id === id),
)
if (unknownMeta.length > 0)
  throw new Error(`Metadatos sin caso aprobado: ${unknownMeta.join(', ')}.`)

const unknownProfiles = Object.keys(E4_PROFILES).filter(
  (id) => !APPROVED_CASES.some((approved) => approved.id === id),
)
if (unknownProfiles.length > 0)
  throw new Error(
    `Expediente E4 sin caso aprobado: ${unknownProfiles.join(', ')}.`,
  )

export const FIXTURES: readonly Fixture[] = APPROVED_CASES.map((approved) => {
  const meta = META[approved.id]
  if (meta === undefined)
    throw new Error(`${approved.id}: falta su entrada en los metadatos.`)
  const profile = E4_PROFILES[approved.id]

  return {
    id: approved.id,
    source: meta.source,
    message: approved.message,
    ...(approved.context === undefined ? {} : { context: approved.context }),
    ...(profile === undefined ? {} : { profile }),
    english: approved.english,
    design: meta.design ?? [],
    ...(meta.pair === undefined ? {} : { pair: meta.pair }),
    canary: meta.canary ?? false,
    labels: approved.labels,
    labelProvenance: approved.provenance,
    ...(approved.exception === undefined
      ? {}
      : { labelException: approved.exception }),
  }
})
