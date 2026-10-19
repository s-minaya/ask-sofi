import type {
  AffectedPersonType,
  SignalId,
} from '../../../src/domain/analysis/signalCatalog'
import type { ProfileAnswers } from '../../../src/domain/partner-profile/partnerProfile'

// E1 (006-plan §5.2): casos sintéticos en español, 100 % ficticios. Ningún dato
// real de nadie. Base de E2–E6, de L1 y de `011`.

// Etiquetas aprobadas por la autora, previas a ejecutar nada y sin ver
// respuestas de Jev (decisión 7). Vienen de `review/` por `approvedData.ts`;
// `labels` solo es null en datos sintéticos de los tests, y entonces la
// cobertura de etiquetas no se da por cumplida.
export type SignalLabel = 'alta' | 'baja' | 'indiferente'

// Cómo se obtuvo cada etiqueta (`006-plan` decisión 7). Las asistidas por IA y
// aprobadas por la autora no equivalen a un etiquetado humano independiente.
export type LabelProvenance =
  | 'human_independent'
  | 'ai_proposed_author_reviewed_approved'
  | 'human_author_labeled_before_english_review'

// Ajustes documentados sobre la procedencia de un caso concreto.
export type LabelException =
  'incidental_english_exposure' | 'author_override_status_and_safety'

export type Labels = {
  signals: Record<SignalId, SignalLabel>
  expectedStatus: 'interpreted' | 'needs_context' | 'safety_concern'
  safety: 'none' | 'risk' | 'hyperbole'
  // Obligatorio cuando `safety` es 'risk'.
  affectedType?: AffectedPersonType
}

// Intención de diseño del caso: para qué se escribió. No es una etiqueta ni un
// resultado esperado; la autora puede corregirla al etiquetar.
export type Design =
  | 'emoji_only'
  | 'omitted_marker'
  | 'explicit_boundary'
  | 'safety_candidate'
  | 'hyperbole_candidate'
  | 'injection'
  | 'profile_coherent'
  | 'profile_misleading'

export type Pair =
  | { id: string; kind: 'minimal'; role: 'without_context' | 'with_context' }
  | { id: string; kind: 'gender'; role: 'feminine' | 'masculine' }

export type Fixture = {
  id: string
  // H01–H30 y C1–C20 (`analysis-architecture-rationale.md` §19, §13.5), T01–T08
  // (`evals/llm-redactor/cases.ts`) o 'new' para un caso escrito para E1.
  source: string
  message: string
  context?: string
  // Solo respuestas concretas: ya minimizado, como llegaría a Jev (E4).
  profile?: ProfileAnswers
  // Inglés de referencia para medir a Jev sin el ruido del traductor (decisión 7).
  // Aprobado por la autora.
  english: { message: string; context?: string }
  design: Design[]
  pair?: Pair
  canary: boolean
  labels: Labels | null
  labelProvenance?: LabelProvenance
  labelException?: LabelException
}
