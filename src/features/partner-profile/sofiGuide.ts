import {
  answerKind,
  type ProfileAnswer,
  type ProfileArea,
} from '../../domain/partner-profile/partnerProfile'

// Estados de Sofi en el expediente (004-plan §5). Son de la interfaz: no se guardan
// y no saben nada de imágenes ni de spritesheets.
export const SOFI_MOODS = [
  'inviting',
  'asking',
  'waiting',
  'acknowledging',
  'uncertain',
  'saved',
  'validationError',
  'deleting',
  'deleted',
] as const
export type SofiMood = (typeof SOFI_MOODS)[number]

// Qué provocó una reacción breve: decide la expresión y el comentario corto.
export type ReactionCause =
  | 'answered'
  // La respuesta que completa las seis áreas; cuenta aunque sea «No lo sé».
  | 'completed'
  | 'uncertain'
  | 'cleared'
  | 'saved'
  | 'savedInMemory'
  | 'rejected'
  | 'discarded'
  | 'deleted'

const REACTION_MOOD: Record<ReactionCause, SofiMood> = {
  answered: 'acknowledging',
  completed: 'acknowledging',
  uncertain: 'uncertain',
  cleared: 'acknowledging',
  saved: 'saved',
  // Lo que solo vive en memoria no se celebra como guardado.
  savedInMemory: 'validationError',
  rejected: 'validationError',
  discarded: 'acknowledging',
  // Borrar no es un logro: Sofi se queda neutra.
  deleted: 'deleted',
}

// Breve: se ve, pero nunca retrasa ni bloquea la edición.
export const REACTION_MS = 1800

export type GuideState = {
  area: ProfileArea
  // Cada pregunta formulada es una intervención hablada nueva, con su número:
  // cambiarlo cancela el typewriter y la voz de la anterior.
  speech: { id: number; speaking: boolean }
  reaction: { cause: ReactionCause; id: number } | null
  confirmingDelete: boolean
  // Se completaron las seis áreas y falta celebrarlo con el salto de «Guardar».
  // Dura hasta que se vea (quien pinta avisa con «celebrated»): «Guardar» puede
  // estar fuera de la pantalla cuando se responde. Guardar, descartar o quitar la respuesta lo
  // dejan sin efecto.
  celebration: boolean
  // Numeración de intervenciones y reacciones: el reducer sigue siendo puro.
  seq: number
}

export type GuideEvent =
  | { type: 'selectArea'; area: ProfileArea }
  // El typewriter terminó o se omitió con «Ver todo».
  | { type: 'speechEnded' }
  // `completes`: esta respuesta deja las seis áreas respondidas con cambios sin
  // guardar. Lo decide quien conoce el borrador; el reductor no lo deduce.
  | { type: 'answer'; answer: ProfileAnswer; completes?: boolean }
  | { type: 'clearAnswer' }
  | { type: 'celebrated' }
  | { type: 'reactionEnded'; id: number }
  | { type: 'saved'; persisted: boolean }
  | { type: 'saveRejected' }
  | { type: 'discarded' }
  | { type: 'requestDelete' }
  | { type: 'cancelDelete' }
  | { type: 'deleted' }
  | { type: 'pageHidden' }

export function openGuide(area: ProfileArea, seq = 0): GuideState {
  return {
    area,
    speech: { id: seq + 1, speaking: true },
    reaction: null,
    confirmingDelete: false,
    celebration: false,
    seq: seq + 1,
  }
}

const silent = (state: GuideState): GuideState['speech'] =>
  state.speech.speaking ? { ...state.speech, speaking: false } : state.speech

// Una reacción no habla ni reinicia la pregunta: la deja escrita entera.
function react(state: GuideState, cause: ReactionCause): GuideState {
  return {
    ...state,
    speech: silent(state),
    reaction: { cause, id: state.seq + 1 },
    confirmingDelete: false,
    seq: state.seq + 1,
  }
}

export function guideReducer(state: GuideState, event: GuideEvent): GuideState {
  switch (event.type) {
    case 'selectArea':
      if (event.area === state.area) return state
      // Cambiar de pregunta no cancela lo que aún se debe celebrar.
      return {
        ...openGuide(event.area, state.seq),
        celebration: state.celebration,
      }
    case 'speechEnded':
    case 'pageHidden':
      if (!state.speech.speaking) return state
      return { ...state, speech: silent(state) }
    case 'answer': {
      if (event.completes)
        return { ...react(state, 'completed'), celebration: true }
      const kind = answerKind(event.answer)
      return react(
        state,
        kind === 'unknown' || kind === 'conditional' ? 'uncertain' : 'answered',
      )
    }
    case 'clearAnswer':
      return { ...react(state, 'cleared'), celebration: false }
    case 'celebrated':
      return state.celebration ? { ...state, celebration: false } : state
    case 'reactionEnded':
      if (state.reaction?.id !== event.id) return state
      return { ...state, reaction: null }
    case 'saved':
      return {
        ...react(state, event.persisted ? 'saved' : 'savedInMemory'),
        celebration: false,
      }
    case 'saveRejected':
      return react(state, 'rejected')
    case 'discarded':
      return { ...react(state, 'discarded'), celebration: false }
    case 'requestDelete':
      return {
        ...state,
        speech: silent(state),
        reaction: null,
        confirmingDelete: true,
      }
    case 'cancelDelete':
      return { ...state, confirmingDelete: false }
    case 'deleted':
      return { ...react(state, 'deleted'), celebration: false }
  }
}

export function isSpeaking(state: GuideState): boolean {
  return state.speech.speaking
}

export function moodOf(state: GuideState): SofiMood {
  if (state.confirmingDelete) return 'deleting'
  if (state.reaction) return REACTION_MOOD[state.reaction.cause]
  return state.speech.speaking ? 'asking' : 'waiting'
}
