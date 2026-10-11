import { fixtureFor, type Scenario, type Step } from './scenarios'

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
