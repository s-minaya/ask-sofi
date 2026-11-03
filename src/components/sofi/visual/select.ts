import type { SofiAnimationId, SofiIntent } from './types'

// Selección de la representación de Sofi: función pura del estado semántico actual
// (catálogo §5 y §6; orden de prioridades en plan 008 §11.3). No almacena estado de
// negocio —lo gestiona el flujo funcional, que le pasa las señales—, no conoce React,
// archivos ni controladores, y no decide el resultado del análisis: solo lo representa.

export type SofiState = {
  // Seguridad y privacidad (nivel 1 de la jerarquía, catálogo §6.1).
  quickExit?: boolean
  safety?: 'concern' | 'evaluation_unavailable'
  // Entre el borrado efectivo y el fin de su confirmación funcional (`wipeAfter`).
  wipe?: boolean
  // Flujo funcional activo (nivel 2).
  // Carga real y perceptible de la app o de una vista.
  loading?: boolean
  // Petición de análisis realmente pendiente.
  processing?: boolean
  // Último resultado conocido. Quien posee el estado lo retira cuando lo sustituye
  // una acción de la persona: no se reanuda una reacción obsoleta.
  outcome?:
    | { kind: 'interpreted'; signals: number; tone?: 'eureka' | 'suspicious' }
    | { kind: 'needs_context' }
    | { kind: 'error' }
  // `SofiSpeech.speaking`, no que se esté preguntando.
  speaking?: boolean
  // Feedback de una acción (nivel 3).
  feedback?: 'uncertain' | 'favorited'
  // La pasada única de esta reacción ya terminó. Quien posee el estado la limpia
  // cuando llega un nuevo disparador.
  settled?: SofiAnimationId
}

export type SelectOptions = {
  // Solo el Design Lab: `eureka` y `suspicious` esperan a las reglas de 006.
  lab?: boolean
}

const animation = (id: SofiAnimationId): SofiIntent => ({
  kind: 'animation',
  id,
})

function outcomeReaction(
  outcome: SofiState['outcome'],
  lab: boolean,
): SofiAnimationId | undefined {
  switch (outcome?.kind) {
    case 'needs_context':
      return 'needs-context'
    case 'error':
      return 'error'
    case 'interpreted':
      // Sin señales comunicables no hay descubrimiento que celebrar.
      return lab && outcome.signals > 0 ? outcome.tone : undefined
    default:
      return undefined
  }
}

export function selectVisual(
  state: SofiState,
  { lab = false }: SelectOptions = {},
): SofiIntent {
  if (state.quickExit || state.safety === 'concern') return { kind: 'none' }
  if (state.safety === 'evaluation_unavailable') return { kind: 'sober' }
  if (state.wipe) return animation('memory-wipe')
  if (state.loading) return animation('rolling')
  if (state.processing) return animation('sofing')

  // Las reacciones cuya ficha no lista el habla entre sus interrupciones (catálogo §4)
  // se reproducen antes de pasar a `talking`.
  const reaction =
    outcomeReaction(state.outcome, lab) ??
    (state.feedback === 'favorited' ? 'favoriting' : undefined)
  if (reaction && state.settled !== reaction) return animation(reaction)

  if (state.speaking) return animation('talking')

  // `uncertain` sí cede ante la intervención hablada prioritaria.
  if (state.feedback === 'uncertain' && state.settled !== 'uncertain')
    return animation('uncertain')

  return animation('sofi-blink')
}

// Contrato del borrado total con 009 (D-15, D-16): dos señales de la interfaz. El borrado
// efectivo inicia `memory-wipe`; el fin de su confirmación funcional devuelve a neutral.
// Ninguna espera a la animación: el valor sale de la señal, nunca del recurso.
export type WipeSignal = 'data-erased' | 'confirmation-ended'

export const wipeAfter = (signal: WipeSignal): boolean =>
  signal === 'data-erased'
