import {
  EMPTY_PARTNER_PROFILE,
  type PartnerProfile,
  type ProfileArea,
} from '../../domain/partner-profile/partnerProfile'
import type { GuideEvent } from '../../features/partner-profile/sofiGuide'
import type {
  SheetError,
  SheetNotice,
} from '../../features/partner-profile/ProfileSheet'

// Puntos de partida deterministas de las composiciones (004-plan §9). Desde
// cualquiera de ellos el prototipo sigue siendo interactivo, solo en memoria.
const PARTIAL: PartnerProfile = {
  answers: { directness: 'drops-hints', sarcasm: 'often' },
  notes: '',
}

const SAVED: PartnerProfile = {
  answers: {
    directness: 'drops-hints',
    sarcasm: 'sometimes',
    conflict: 'talk-later',
    personalSpace: 'unknown',
    messageStyle: 'short-direct',
  },
  notes: 'Cuando está trabajando contesta tarde y con monosílabos.',
}

export type ProfilePreset = {
  label: string
  view: 'consultation' | 'sheet'
  invitation: 'pending' | 'presented'
  saved: PartnerProfile | null
  draft: PartnerProfile
  area: ProfileArea
  events: ReadonlyArray<GuideEvent>
  notice?: SheetNotice
  error?: SheetError
}

const consultation = (
  label: string,
  invitation: ProfilePreset['invitation'],
  saved: PartnerProfile | null,
): ProfilePreset => ({
  label,
  view: 'consultation',
  invitation,
  saved,
  draft: saved ?? EMPTY_PARTNER_PROFILE,
  area: 'directness',
  events: [],
})

export const PROFILE_PRESETS = {
  'first-visit': consultation('Primera visita', 'pending', null),
  'later-empty': consultation('Sin expediente', 'presented', null),
  'later-saved': consultation('Con expediente', 'presented', SAVED),
  empty: {
    label: 'Sin completar',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: EMPTY_PARTNER_PROFILE,
    area: 'directness',
    events: [],
  },
  speaking: {
    label: 'Sofi hablando',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: PARTIAL,
    area: 'conflict',
    events: [],
  },
  answered: {
    label: 'Respuesta y reacción',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: { answers: { directness: 'drops-hints' }, notes: '' },
    area: 'directness',
    events: [{ type: 'answer', answer: 'drops-hints' }],
  },
  uncertain: {
    label: 'Incertidumbre',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: { answers: { ...PARTIAL.answers, conflict: 'depends' }, notes: '' },
    area: 'conflict',
    events: [{ type: 'answer', answer: 'depends' }],
  },
  // La sexta respuesta: la reacción se queda fija para revisar el comentario y la
  // guía hacia «Guardar». Con «Volver a empezar» se vuelve a verlo.
  completed: {
    label: 'Seis de seis',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: {
      answers: { ...SAVED.answers, initiative: 'waits-for-me' },
      notes: '',
    },
    area: 'messageStyle',
    events: [{ type: 'answer', answer: 'short-direct', completes: true }],
  },
  saved: {
    label: 'Guardado y editable',
    view: 'sheet',
    invitation: 'presented',
    saved: SAVED,
    draft: SAVED,
    area: 'directness',
    events: [{ type: 'saved', persisted: true }],
    notice: 'saved',
  },
  'empty-save': {
    label: 'Aviso: vacío',
    view: 'sheet',
    invitation: 'presented',
    saved: null,
    draft: EMPTY_PARTNER_PROFILE,
    area: 'directness',
    events: [{ type: 'saveRejected' }],
    error: 'empty',
  },
  memory: {
    label: 'Solo en memoria',
    view: 'sheet',
    invitation: 'presented',
    saved: PARTIAL,
    draft: PARTIAL,
    area: 'directness',
    events: [{ type: 'saved', persisted: false }],
    notice: 'memory',
  },
  deleting: {
    label: 'Confirmar eliminación',
    view: 'sheet',
    invitation: 'presented',
    saved: SAVED,
    draft: SAVED,
    area: 'directness',
    events: [{ type: 'requestDelete' }],
  },
} as const satisfies Record<string, ProfilePreset>

export type ProfilePresetKey = keyof typeof PROFILE_PRESETS

export const CONSULTATION_PRESETS = [
  'first-visit',
  'later-empty',
  'later-saved',
] as const satisfies ReadonlyArray<ProfilePresetKey>

export const SHEET_PRESETS = [
  'empty',
  'speaking',
  'answered',
  'uncertain',
  'completed',
  'saved',
  'empty-save',
  'memory',
  'deleting',
] as const satisfies ReadonlyArray<ProfilePresetKey>

export function isPresetKey(value: string | null): value is ProfilePresetKey {
  return value !== null && value in PROFILE_PRESETS
}
