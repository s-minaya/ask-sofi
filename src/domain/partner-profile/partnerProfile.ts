// Expediente de la pareja: patrones de comunicación que la persona usuaria
// observa. Solo describe respuestas; no interpreta ni puntúa a nadie.

export const PROFILE_AREAS = [
  'directness',
  'sarcasm',
  'conflict',
  'personalSpace',
  'initiative',
  'messageStyle',
] as const
export type ProfileArea = (typeof PROFILE_AREAS)[number]

// Valores que se guardan, en el orden de la ficha. El texto que se muestra vive
// en la interfaz: cambiarlo no puede invalidar expedientes ya guardados.
export const AREA_ANSWERS = {
  directness: ['says-it-clearly', 'drops-hints', 'depends', 'unknown'],
  sarcasm: ['often', 'sometimes', 'rarely', 'depends', 'unknown'],
  conflict: ['talk-now', 'talk-later', 'depends', 'unknown'],
  personalSpace: ['usually-yes', 'usually-no', 'depends', 'unknown'],
  initiative: ['proposes-alternatives', 'waits-for-me', 'depends', 'unknown'],
  messageStyle: ['short-direct', 'long-expressive', 'varies', 'unknown'],
} as const satisfies Record<ProfileArea, ReadonlyArray<string>>

export type AreaAnswer<A extends ProfileArea> = (typeof AREA_ANSWERS)[A][number]
export type ProfileAnswer = AreaAnswer<ProfileArea>

// Un área ausente está sin responder: es distinto de «No lo sé» y de «Depende».
export type ProfileAnswers = { [A in ProfileArea]?: AreaAnswer<A> }

export type PartnerProfile = {
  answers: ProfileAnswers
  notes: string
}

export const NOTES_MAX_LENGTH = 500

export const EMPTY_PARTNER_PROFILE: PartnerProfile = { answers: {}, notes: '' }

export type AnswerKind = 'unanswered' | 'unknown' | 'conditional' | 'concrete'

export function answerKind(answer: ProfileAnswer | undefined): AnswerKind {
  if (answer === undefined) return 'unanswered'
  if (answer === 'unknown') return 'unknown'
  if (answer === 'depends') return 'conditional'
  return 'concrete'
}

export function setAnswer<A extends ProfileArea>(
  profile: PartnerProfile,
  area: A,
  answer: AreaAnswer<A>,
): PartnerProfile {
  return { ...profile, answers: { ...profile.answers, [area]: answer } }
}

export function clearAnswer(
  profile: PartnerProfile,
  area: ProfileArea,
): PartnerProfile {
  const answers = { ...profile.answers }
  delete answers[area]
  return { ...profile, answers }
}

export function setNotes(
  profile: PartnerProfile,
  notes: string,
): PartnerProfile {
  return { ...profile, notes }
}

export function isProfileEmpty(profile: PartnerProfile): boolean {
  return (
    PROFILE_AREAS.every((area) => profile.answers[area] === undefined) &&
    profile.notes.trim() === ''
  )
}

// Las seis áreas con una respuesta, también «Depende» o «No lo sé»: las notas no
// cuentan. Completar la ficha no equivale a guardarla.
export function isProfileComplete(profile: PartnerProfile): boolean {
  return PROFILE_AREAS.every((area) => profile.answers[area] !== undefined)
}

export type ProfileSaveCheck =
  | { ok: true; profile: PartnerProfile }
  | { ok: false; error: 'empty' | 'notes-too-long' }

// Lo que se valida es exactamente lo que se guardará: notas sin espacios sobrantes.
export function prepareProfileForSave(draft: PartnerProfile): ProfileSaveCheck {
  const profile = setNotes(draft, draft.notes.trim())
  if (isProfileEmpty(profile)) return { ok: false, error: 'empty' }
  if (profile.notes.length > NOTES_MAX_LENGTH)
    return { ok: false, error: 'notes-too-long' }
  return { ok: true, profile }
}
