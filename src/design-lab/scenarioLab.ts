import {
  selectVisual,
  wipeAfter,
  type SofiState,
  type WipeSignal,
} from '../components/sofi/visual/select'
import type {
  SofiAnimationId,
  SofiIntent,
} from '../components/sofi/visual/types'

// Escenarios del contrato visual en el Lab (T064). Esto NO es lógica funcional: es el estado
// que, en producción, poseerán quienes emiten las señales (007 y 009). Aquí lo simula una
// persona con botones. Lo que se ve sale siempre de `selectVisual` (prioridades, recurso,
// interrupciones) y de `wipeAfter`; este módulo solo guarda las señales y no decide nada de eso.
// Tampoco infiere resultados: cada resultado y su tono los elige quien prueba.

// Resultado simulado de una petición. Los tonos de `interpreted` los elige quien prueba: la
// regla que los decide es de 006 y no se anticipa.
export type SimulatedOutcome =
  | 'interpreted-eureka'
  | 'interpreted-suspicious'
  | 'interpreted-none'
  | 'needs_context'
  | 'error'

export type ScenarioAction =
  | { type: 'speaking'; value: boolean }
  | { type: 'show-all' }
  | { type: 'request-pending' }
  | { type: 'request-done'; outcome: SimulatedOutcome }
  | { type: 'dont-know' }
  | { type: 'favorite-saved' }
  // Fin de una pasada única de `SofiSprite`: quien lo recibe consulta el estado actual, sin cola.
  | { type: 'one-pass-ended'; id: SofiAnimationId }
  | { type: 'wipe'; signal: WipeSignal }
  | { type: 'quick-exit' }
  | { type: 'safety'; value: SofiState['safety'] }
  | { type: 'reset' }

export type ScenarioLogEntry = { id: number; text: string }

export type ScenarioState = {
  // Las señales que consume `selectVisual`, tal cual (`SofiState`).
  signals: SofiState
  // Lo que se ha ido viendo, sin repetir seguidos: la secuencia entre recursos.
  history: string[]
  log: ScenarioLogEntry[]
  nextId: number
}

const HISTORY_LIMIT = 12
const LOG_LIMIT = 30

export const intentOf = (state: ScenarioState): SofiIntent =>
  // `lab: true`: `eureka` y `suspicious` solo existen en el Lab, a la espera de 006.
  selectVisual(state.signals, { lab: true })

export function intentLabel(intent: SofiIntent): string {
  if (intent.kind === 'animation') return intent.id
  return intent.kind === 'sober' ? 'sobria' : 'sin sprite'
}

// Los gags solo viven en una escena tranquila: la representación de reserva y nada por encima
// (catálogo §6.1 y §6.3). Que algo ocupe la escena los cancela.
export const isCalm = (intent: SofiIntent): boolean =>
  intent.kind === 'animation' && intent.id === 'sofi-blink'

export function createScenarioState(): ScenarioState {
  return { signals: {}, history: ['sofi-blink'], log: [], nextId: 1 }
}

const OUTCOMES: Record<SimulatedOutcome, SofiState['outcome']> = {
  'interpreted-eureka': { kind: 'interpreted', signals: 1, tone: 'eureka' },
  'interpreted-suspicious': {
    kind: 'interpreted',
    signals: 1,
    tone: 'suspicious',
  },
  'interpreted-none': { kind: 'interpreted', signals: 0 },
  needs_context: { kind: 'needs_context' },
  error: { kind: 'error' },
}

const OUTCOME_NAMES: Record<SimulatedOutcome, string> = {
  'interpreted-eureka':
    'interpretada con señales (tono eureka, elegido a mano)',
  'interpreted-suspicious':
    'interpretada con señales (tono suspicious, elegido a mano)',
  'interpreted-none': 'interpretada sin señales comunicables',
  needs_context: 'falta de contexto',
  error: 'error técnico',
}

type Step = { signals: SofiState; lines: string[] }

// Lo que cada evento cambia en las señales. Son las reglas del dueño que el contrato describe
// (`settled` se limpia con un disparador nuevo; una acción de la persona retira el resultado).
function step(state: ScenarioState, action: ScenarioAction): Step {
  const { signals } = state
  switch (action.type) {
    case 'speaking':
      return {
        signals: { ...signals, speaking: action.value },
        lines: [action.value ? 'Sofi empieza a hablar' : 'Sofi calla (pausa)'],
      }
    case 'show-all':
      return {
        signals: { ...signals, speaking: false },
        lines: ['«Ver todo»: se corta la voz y queda el texto completo'],
      }
    case 'request-pending':
      // Una consulta nueva invalida la reacción anterior (catálogo §6.3).
      return {
        signals: {
          ...signals,
          processing: true,
          outcome: undefined,
          feedback: undefined,
          settled: undefined,
          speaking: false,
        },
        lines: ['Petición realmente pendiente'],
      }
    case 'request-done':
      return {
        signals: {
          ...signals,
          processing: false,
          outcome: OUTCOMES[action.outcome],
          settled: undefined,
        },
        lines: [`Petición completada: ${OUTCOME_NAMES[action.outcome]}`],
      }
    case 'dont-know':
      // Una acción de la persona sustituye al resultado anterior.
      return {
        signals: {
          ...signals,
          outcome: undefined,
          feedback: 'uncertain',
          settled: undefined,
          speaking: false,
        },
        lines: ['«No sé más»'],
      }
    case 'favorite-saved':
      return {
        signals: { ...signals, feedback: 'favorited', settled: undefined },
        lines: ['Favorito guardado (simulado: el Lab no guarda nada)'],
      }
    case 'one-pass-ended': {
      const current = selectVisual(signals, { lab: true })
      // Lo que ya no se muestra no cuenta: se consulta el estado actual, sin cola.
      if (current.kind !== 'animation' || current.id !== action.id)
        return { signals, lines: [] }
      return {
        signals: { ...signals, settled: action.id },
        lines: [`Termina la pasada de ${action.id}`],
      }
    }
    case 'wipe':
      if (wipeAfter(action.signal)) {
        // El contenido borrado no se rehidrata: no queda nada de la conversación. La seguridad y la
        // salida rápida no son contenido del usuario y siguen mandando.
        return {
          signals: {
            wipe: true,
            quickExit: signals.quickExit,
            safety: signals.safety,
          },
          lines: [
            'Borrado real, inmediato: lo hace 009 (aquí no se borra nada)',
            'Señal data-erased → memory-wipe, sin esperar a la animación',
          ],
        }
      }
      return {
        signals: { ...signals, wipe: false },
        lines: [
          'Señal confirmation-ended → vuelve a neutral, sin temporizador propio',
        ],
      }
    case 'quick-exit':
      return {
        signals: { quickExit: true },
        lines: [
          'Contenido oculto y consulta temporal eliminada (simulado: no hay consulta)',
          'Controladores cancelados, antes de cualquier efecto',
          'Sin sprite ni animación, y sin memory-wipe',
        ],
      }
    case 'safety':
      return {
        signals: { ...signals, safety: action.value },
        lines: [
          action.value === 'concern'
            ? 'safety_concern: sin sprite ni humor'
            : action.value === 'evaluation_unavailable'
              ? 'safety_evaluation_unavailable: representación sobria'
              : 'Seguridad resuelta',
        ],
      }
    case 'reset':
      return { signals: {}, lines: [] }
  }
}

export function scenarioReducer(
  state: ScenarioState,
  action: ScenarioAction,
): ScenarioState {
  if (action.type === 'reset') return createScenarioState()

  const { signals, lines } = step(state, action)
  const next: ScenarioState = { ...state, signals }

  const log = [...state.log]
  let nextId = state.nextId
  for (const text of lines) log.push({ id: nextId++, text })
  next.log = log.slice(-LOG_LIMIT)
  next.nextId = nextId

  const label = intentLabel(intentOf(next))
  next.history =
    state.history.at(-1) === label
      ? state.history
      : [...state.history, label].slice(-HISTORY_LIMIT)
  return next
}
