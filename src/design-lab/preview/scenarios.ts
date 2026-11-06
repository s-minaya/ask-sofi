import type { ReadingView } from '../../features/consultation/screens/ResultScreens'
import { PROVISIONAL_RETENTION_LIMIT_MS } from '../../components/sofi/visual/presentationGate'
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

// Lo que la mesa dice del paso del resultado por la retención del primer ciclo (T065): sin
// resultado todavía, retenido, o presentado por esta razón.
export type GateStatus =
  'none' | 'held' | 'inmediato' | 'ciclo' | 'límite' | 'reducido'

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

// Ajustes de la demostración de `presentationGate` (T065). Prototipo: ni el límite ni la latencia
// son valores aprobados. El límite es el provisional de producción (AV2 lo aprueba); aquí solo se
// puede probar otro, sin cambiar el de producción.
export type Tuning = {
  // Cuánto puede esperar un resultado no crítico al fin del primer ciclo.
  limitMs: number
  // Cuánto tarda la lectura simulada en terminar la operación.
  latencyMs: number
  // Velocidad de `sofing` (la vía de producción, `visual/rates`): con ella el primer ciclo dura menos.
  rate: number
}

export const DEFAULT_TUNING: Tuning = {
  limitMs: PROVISIONAL_RETENTION_LIMIT_MS,
  latencyMs: SIMULATED_LATENCY_MS,
  rate: 1,
}

// Cada campo válido sustituye al actual; uno inválido (NaN, negativo, velocidad no positiva) se
// ignora en lugar de romper la lectura.
export function mergeTuning(current: Tuning, patch: Partial<Tuning>): Tuning {
  const valid = (value: unknown, min: number, open = false): value is number =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (open ? value > min : value >= min)
  return {
    limitMs: valid(patch.limitMs, 0) ? patch.limitMs : current.limitMs,
    latencyMs: valid(patch.latencyMs, 0) ? patch.latencyMs : current.latencyMs,
    rate: valid(patch.rate, 0, true) ? patch.rate : current.rate,
  }
}

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
    'SofiSprite · sofing',
    'Loader',
    'MessageBubble',
    'TextLink',
  ],
  success: [
    'SiteHeader',
    'SofiSprite · talking',
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
    'SofiSprite · needs-context',
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
    'SofiSprite · error',
    'MessageBubble',
    'Button',
  ],
}

export const SCREEN_PROVISIONAL: Record<ScreenKey, ReadonlyArray<string>> = {
  landing: ['Fotomatón con el spritesheet de parpadeo'],
  consultation: ['Spritesheet de parpadeo · 008'],
  processing: ['Umbral de carga lenta', 'Límite de retención · AV2'],
  success: [
    'Pausas de talking · AV5',
    'Tono de eureka y suspicious · 006',
    'Umbrales de confianza · dominio',
  ],
  needs: ['Pose reducida · AV4'],
  error: ['Pose reducida · AV4', 'Textos de error'],
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
