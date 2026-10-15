// Catálogo v1 provisional de señales y vocabulario de las evaluaciones auxiliares.
// La fuente normativa de las definiciones es 005-plan.md §3.1: un test comprueba
// que coinciden. No es una taxonomía cerrada: cualquier cambio sube TAXONOMY_VERSION.

export const SIGNAL_KINDS = ['reading', 'cue'] as const
export type SignalKind = (typeof SIGNAL_KINDS)[number]

export const SIGNAL_CATALOG = [
  {
    id: 'literal_meaning',
    kind: 'reading',
    definition: 'Podría significar literalmente lo expresado.',
  },
  {
    id: 'seeking_reassurance',
    kind: 'reading',
    definition: 'Podría buscar tranquilidad, confirmación o afecto.',
  },
  {
    id: 'inviting_initiative',
    kind: 'reading',
    definition: 'Podría sugerir iniciativa o una propuesta del interlocutor.',
  },
  {
    id: 'requesting_space',
    kind: 'reading',
    definition: 'Expresa distancia, pausa o necesidad de tiempo.',
  },
  {
    id: 'expressing_disappointment',
    kind: 'reading',
    definition: 'Comunica decepción o expectativas frustradas.',
  },
  {
    id: 'expressing_annoyance',
    kind: 'reading',
    definition: 'Comunica irritación, fastidio o enfado.',
  },
  {
    id: 'setting_boundary',
    kind: 'reading',
    definition: 'Comunica una negativa o un límite que merece respeto.',
  },
  {
    id: 'playful_teasing',
    kind: 'cue',
    definition: 'Broma o provocación juguetona.',
  },
  {
    id: 'sarcastic_tone',
    kind: 'cue',
    definition: 'Ironía o sarcasmo como forma de decirlo.',
  },
  {
    id: 'indirect_hint',
    kind: 'cue',
    definition: 'Indirecta o comunicación insinuada.',
  },
] as const satisfies ReadonlyArray<{
  id: string
  kind: SignalKind
  definition: string
}>

export type SignalId = (typeof SIGNAL_CATALOG)[number]['id']

export const SIGNAL_IDS = SIGNAL_CATALOG.map(({ id }) => id)

// Seguridad y suficiencia no son señales de la pareja: se evalúan aparte.
export const TAXONOMY_VERSION = 1

export const SUFFICIENCY_LEVELS = [
  'insufficient',
  'partial',
  'sufficient',
] as const
export type SufficiencyLevel = (typeof SUFFICIENCY_LEVELS)[number]

// Lista extensible: quién puede estar en riesgo. No es una clasificación clínica.
export const AFFECTED_PERSON_TYPES = [
  'user_at_risk_from_other',
  'other_at_risk_of_self_harm',
  'user_at_risk_of_self_harm',
  'undetermined',
] as const
export type AffectedPersonType = (typeof AFFECTED_PERSON_TYPES)[number]
