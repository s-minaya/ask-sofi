import type { ReadingView } from '../../features/consultation/screens/ResultScreens'
import {
  ADVICE,
  FIXTURE_CONTEXT,
  FIXTURE_MESSAGE,
  LEAD,
  MISSING_QUESTIONS,
  NEEDS_QUESTIONS,
  OTHER_VERSIONS,
  SPEECH,
} from '../fixtures'

// Escenarios deterministas de la Experience Preview: cada uno arranca siempre
// con los mismos datos y nunca hace una petición.
export const SCENARIOS = ['success', 'loading', 'error', 'needs'] as const
export type Scenario = (typeof SCENARIOS)[number]

export const SCENARIO_LABELS: Record<Scenario, string> = {
  success: 'Éxito',
  loading: 'Carga',
  error: 'Error',
  needs: 'Contexto insuficiente',
}

export const RESULT_LABELS: Record<Scenario, string> = {
  success: 'Lectura',
  loading: 'Resultado',
  error: 'Error',
  needs: 'Falta contexto',
}

export const STEPS = [
  'landing',
  'consultation',
  'processing',
  'result',
] as const
export type Step = (typeof STEPS)[number]

export type UiState =
  'idle' | 'submitting' | 'processing' | 'success' | 'needs_context' | 'error'
export const UI_STATES: ReadonlyArray<UiState> = [
  'idle',
  'submitting',
  'processing',
  'success',
  'needs_context',
  'error',
]

// Latencia simulada de la lectura: la de «Carga» no termina nunca.
export const SIMULATED_LATENCY_MS = 1600
export const SIMULATED_SUBMIT_MS = 450

export function fixtureFor(scenario: Scenario): {
  message: string
  context: string
} {
  if (scenario === 'needs') return { message: 'Vale.', context: '' }
  return { message: FIXTURE_MESSAGE, context: FIXTURE_CONTEXT }
}

export const READING: ReadingView = {
  speech: SPEECH.answer,
  lead: LEAD,
  leadTone: 'clear',
  others: OTHER_VERSIONS,
  confidence: 'medium',
  context: 'partial',
  missing: MISSING_QUESTIONS,
  advice: ADVICE,
}

export const NEEDS = {
  speech: SPEECH.needs,
  questions: NEEDS_QUESTIONS,
}

export type ScreenKey =
  'landing' | 'consultation' | 'processing' | 'success' | 'needs' | 'error'

export function screenFor(step: Step, scenario: Scenario): ScreenKey {
  if (step !== 'result') return step
  return scenario === 'loading' ? 'processing' : scenario
}

export function uiStateFor(
  step: Step,
  scenario: Scenario,
  submitting: boolean,
): UiState {
  const screen = screenFor(step, scenario)
  if (screen === 'landing') return 'idle'
  if (screen === 'consultation') return submitting ? 'submitting' : 'idle'
  if (screen === 'processing') return 'processing'
  if (screen === 'needs') return 'needs_context'
  return screen
}

// Qué componentes reales hay en cada pantalla y qué sigue siendo provisional.
export const SCREEN_COMPONENTS: Record<ScreenKey, ReadonlyArray<string>> = {
  landing: [
    'Ticker',
    'ThemeSwitch',
    'Burst',
    'SoundChoice',
    'Button',
    'PhotoBooth',
    'SofiDialog',
  ],
  consultation: [
    'SiteHeader',
    'SofiPortrait',
    'SofiDialog',
    'StepTag',
    'MessageInput',
    'ContextInput',
    'HintList',
    'Button',
    'TextLink',
  ],
  processing: [
    'SiteHeader',
    'SofiStage',
    'ProcessingState',
    'SofiPortrait · pensando',
    'Loader',
    'MessageBubble',
    'TextLink',
  ],
  success: [
    'SiteHeader',
    'SofiSpeech',
    'ReliabilityBadges',
    'InterpretationLead',
    'InterpretationList',
    'ConfidenceMeter',
    'FinePrint',
    'MissingData',
    'SofiAdvice',
  ],
  needs: [
    'SiteHeader',
    'SofiSpeech',
    'ContextQuestions',
    'ReliabilityBadges',
    'MessageBubble',
    'ContextInput',
    'Button',
  ],
  error: [
    'SiteHeader',
    'ErrorState',
    'SofiPortrait · ups',
    'MessageBubble',
    'Button',
  ],
}

export const SCREEN_PROVISIONAL: Record<ScreenKey, ReadonlyArray<string>> = {
  landing: ['Fotomatón con el spritesheet de parpadeo'],
  consultation: ['Spritesheet de parpadeo · 008'],
  processing: ['Expresión «pensando» = F1', 'Umbral de carga lenta'],
  success: [
    'Sprite «hablando» pendiente · 008',
    'Umbrales de confianza · dominio',
  ],
  needs: ['Expresión «poco convencida» = F1'],
  error: ['Expresión «ups» = F2', 'Textos de error'],
}

export const STATE_NOTES: Record<UiState, (scenario: Scenario) => string> = {
  idle: () => 'Portada o consulta en reposo. El audio aún no se ha preparado.',
  submitting: () => 'El botón espera mientras sale la petición simulada.',
  processing: (scenario) =>
    scenario === 'loading'
      ? 'En «Carga» la lectura no termina: así se revisa la espera larga.'
      : 'Sofi lee durante la latencia simulada y pasa sola al resultado.',
  success: () =>
    'Los resultados están disponibles aunque el texto siga escribiéndose.',
  needs_context: () =>
    'No es un error: Sofi pide contexto y no inventa porcentajes.',
  error: () =>
    'El mensaje y el contexto se conservan; «Reintentar» vuelve a procesar.',
}
