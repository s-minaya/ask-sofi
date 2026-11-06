import { fixtureFor, type Scenario, type Step } from './scenarios'
import type { GateReason } from './useResultGate'

// Estado del recorrido simulado. Lógica pura: se prueba sin navegador ni temporizadores.
export type FocusTarget = 'heading' | 'submit'

export type FlowState = {
  scenario: Scenario
  step: Step
  message: string
  context: string
  messageError: boolean
  contextError: boolean
  submitting: boolean
  slow: boolean
  // El resultado ya llegó (la operación terminó) pero aún no se presenta: lo retiene el primer
  // ciclo (catálogo §6.4). `Date.now()` de su llegada.
  arrivedAt: number | null
  // Por qué se presentó el último resultado; `null` si no pasó por la retención.
  gate: GateReason | null
  // Cada paso nuevo reinicia la espera, aunque se repita el mismo (al reintentar).
  run: number
  focus: { request: number; target: FocusTarget }
}

export type FlowAction =
  | { type: 'go'; step: Step; focus?: FocusTarget }
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'message'; value: string }
  | { type: 'context'; value: string }
  | { type: 'submit' }
  | { type: 'submitted' }
  | { type: 'slow' }
  | { type: 'arrived'; at: number }
  | { type: 'present'; reason: GateReason }
  | { type: 'clear' }
  | { type: 'new-query' }
  | { type: 'reread' }

export function initialFlowState(scenario: Scenario): FlowState {
  const fixture = fixtureFor(scenario)
  return {
    scenario,
    step: 'landing',
    message: fixture.message,
    context: fixture.context,
    messageError: false,
    contextError: false,
    submitting: false,
    slow: false,
    arrivedAt: null,
    gate: null,
    run: 0,
    focus: { request: 0, target: 'heading' },
  }
}

function go(
  state: FlowState,
  step: Step,
  target: FocusTarget = 'heading',
): FlowState {
  // «Carga» no tiene resultado: la lectura se queda esperando.
  const next =
    step === 'result' && state.scenario === 'loading' ? 'processing' : step
  return {
    ...state,
    step: next,
    submitting: false,
    slow: false,
    arrivedAt: null,
    gate: null,
    messageError: false,
    contextError: false,
    run: state.run + 1,
    focus: { request: state.focus.request + 1, target },
  }
}

export function previewReducer(
  state: FlowState,
  action: FlowAction,
): FlowState {
  switch (action.type) {
    case 'go':
      return go(state, action.step, action.focus)
    case 'scenario': {
      // Cada escenario arranca siempre con los mismos datos.
      const fixture = fixtureFor(action.scenario)
      const step =
        action.scenario === 'loading' && state.step === 'result'
          ? 'processing'
          : state.step
      return {
        ...state,
        scenario: action.scenario,
        step,
        message: fixture.message,
        context: fixture.context,
        messageError: false,
        contextError: false,
        submitting: false,
        slow: false,
        arrivedAt: null,
        gate: null,
        run: state.run + 1,
      }
    }
    case 'message':
      return {
        ...state,
        message: action.value,
        messageError: state.messageError && !action.value.trim(),
      }
    case 'context':
      return { ...state, context: action.value, contextError: false }
    case 'submit':
      // Mejor validar al enviar que desactivar el botón.
      if (!state.message.trim()) return { ...state, messageError: true }
      return { ...state, submitting: true, messageError: false }
    case 'submitted':
      return go(state, 'processing')
    case 'slow':
      return { ...state, slow: true }
    case 'arrived':
      // Solo mientras se procesa, y una sola vez por lectura.
      if (state.step !== 'processing' || state.arrivedAt !== null) return state
      return { ...state, arrivedAt: action.at }
    case 'present':
      // Un aviso tardío (cancelación, otro escenario, StrictMode) no presenta nada. «Carga» no
      // tiene resultado.
      if (
        state.step !== 'processing' ||
        state.arrivedAt === null ||
        state.scenario === 'loading'
      )
        return state
      return { ...go(state, 'result'), gate: action.reason }
    case 'clear':
      return { ...state, message: '', context: '', messageError: false }
    case 'new-query':
      return go({ ...state, message: '', context: '' }, 'consultation')
    case 'reread':
      if (!state.context.trim()) return { ...state, contextError: true }
      // Con contexto, el escenario pasa a «Éxito» de forma visible en los controles.
      return go({ ...state, scenario: 'success' }, 'processing')
  }
}
