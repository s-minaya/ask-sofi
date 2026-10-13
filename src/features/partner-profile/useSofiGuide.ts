import { useEffect, useReducer, type ActionDispatch } from 'react'
import {
  guideReducer,
  REACTION_MS,
  type GuideEvent,
  type GuideState,
} from './sofiGuide'

// El reducer puro de Sofi (sofiGuide) con lo que le falta para vivir en pantalla:
// una reacción breve termina sola y, con la página oculta, Sofi deja de hablar.
// `heldReaction` es una reacción con la que arranca una composición del Design
// Lab y que se queda visible para revisarla.
export function useSofiGuide(
  init: () => GuideState,
  heldReaction?: number,
): [GuideState, ActionDispatch<[GuideEvent]>] {
  const [guide, dispatch] = useReducer(guideReducer, undefined, init)

  // Cada reacción tiene su temporizador: una nueva cancela el de la anterior, y
  // «reactionEnded» solo cierra la reacción que lo programó.
  useEffect(() => {
    const reaction = guide.reaction
    if (!reaction || reaction.id === heldReaction) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'reactionEnded', id: reaction.id }),
      REACTION_MS,
    )
    return () => window.clearTimeout(timer)
  }, [guide.reaction, heldReaction])

  // Con la página oculta, Sofi deja de hablar (004-spec §8).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: 'pageHidden' })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return [guide, dispatch]
}
