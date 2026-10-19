import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_IDS,
  type AffectedPersonType,
} from '../../../src/domain/analysis/signalCatalog.ts'
import {
  AREA_ANSWERS,
  answerKind,
  PROFILE_AREAS,
  type ProfileAnswer,
  type ProfileAnswers,
  type ProfileArea,
} from '../../../src/domain/partner-profile/partnerProfile.ts'
import type {
  LabelException,
  LabelProvenance,
  Labels,
  SignalLabel,
} from './types.ts'

// Importador de E1: traduce lo que aprobó la autora (`evals/jev/review/*.json`,
// vocabulario en español) al de los fixtures. El mapeo es explícito y estricto:
// ante cualquier valor que no conozca lanza un error en vez de adivinarlo, para
// que una etiqueta aprobada nunca cambie en silencio.

export type ApprovedCase = {
  id: string
  message: string
  context?: string
  english: { message: string; context?: string }
  labels: Labels
  provenance: LabelProvenance
  exception?: LabelException
}

const SIGNAL_LABELS: readonly SignalLabel[] = ['alta', 'baja', 'indiferente']
const STATUSES: readonly Labels['expectedStatus'][] = [
  'interpreted',
  'needs_context',
  'safety_concern',
]
const SAFETY: Record<string, Labels['safety']> = {
  ninguna: 'none',
  riesgo: 'risk',
  hipérbole: 'hyperbole',
}
const PROVENANCES: readonly LabelProvenance[] = [
  'human_independent',
  'ai_proposed_author_reviewed_approved',
  'human_author_labeled_before_english_review',
]
const CASE_KEYS = [
  'id',
  'message',
  'context',
  'referenceEnglish',
  'referenceContextEnglish',
  'signals',
  'expectedStatus',
  'safety',
  'affectedPersonType',
  'labelProvenance',
  'translationApproval',
  // Razón que la autora validó en las propuestas asistidas por IA. Es
  // documentación del fichero aprobado: se acepta, pero no se importa.
  'rationale',
]

// Ajustes que la autora documentó en `e1-human-labels.md` y en las notas del
// fichero aprobado (los tests lo comprueban). No se deducen de los datos.
const EXCEPTIONS: Readonly<Record<string, LabelException>> = {
  'e1-06': 'incidental_english_exposure',
  'e1-31': 'author_override_status_and_safety',
}

const ID = /^e1-\d{2}$/

function record(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${where}: se esperaba un objeto.`)
  return value as Record<string, unknown>
}

function text(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${where}: se esperaba un texto no vacío.`)
  return value
}

function optionalText(value: unknown, where: string): string | undefined {
  if (value === null) return undefined
  return text(value, where)
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  where: string,
): T {
  if (
    typeof value !== 'string' ||
    !(allowed as readonly string[]).includes(value)
  )
    throw new Error(`${where}: valor desconocido (${String(value)}).`)
  return value as T
}

export function mapApprovedCase(input: unknown): ApprovedCase {
  const source = record(input, 'caso')
  const id = text(source.id, 'id')
  if (!ID.test(id)) throw new Error(`${id}: identificador mal formado.`)

  for (const key of Object.keys(source))
    if (!CASE_KEYS.includes(key))
      throw new Error(`${id}: clave que no se importa (${key}).`)

  if (source.translationApproval !== 'author_approved')
    throw new Error(`${id}: la traducción no está aprobada por la autora.`)

  const message = text(source.message, `${id}.message`)
  const context = optionalText(source.context, `${id}.context`)
  const english = text(source.referenceEnglish, `${id}.referenceEnglish`)
  const englishContext = optionalText(
    source.referenceContextEnglish,
    `${id}.referenceContextEnglish`,
  )
  if ((context === undefined) !== (englishContext === undefined))
    throw new Error(`${id}: el contexto y su inglés deben ir juntos.`)

  const rawSignals = record(source.signals, `${id}.signals`)
  for (const key of Object.keys(rawSignals))
    if (!(SIGNAL_IDS as readonly string[]).includes(key))
      throw new Error(`${id}: señal desconocida (${key}).`)
  const signals = Object.fromEntries(
    SIGNAL_IDS.map((signal) => {
      if (!(signal in rawSignals))
        throw new Error(`${id}: falta la señal ${signal}.`)
      return [
        signal,
        oneOf(rawSignals[signal], SIGNAL_LABELS, `${id}.${signal}`),
      ]
    }),
  ) as Labels['signals']

  const expectedStatus = oneOf(source.expectedStatus, STATUSES, `${id}.estado`)
  const safety = oneOf(source.safety, Object.keys(SAFETY), `${id}.seguridad`)
  const safetyLabel = SAFETY[safety]

  // La persona afectada solo existe cuando hay riesgo, y entonces es obligatoria.
  let affectedType: AffectedPersonType | undefined
  if (safetyLabel === 'risk')
    affectedType = oneOf(
      source.affectedPersonType,
      AFFECTED_PERSON_TYPES,
      `${id}.persona afectada`,
    )
  else if (source.affectedPersonType !== null)
    throw new Error(`${id}: persona afectada sin riesgo.`)

  return {
    id,
    message,
    ...(context === undefined ? {} : { context }),
    english: {
      message: english,
      ...(englishContext === undefined ? {} : { context: englishContext }),
    },
    labels: {
      signals,
      expectedStatus,
      safety: safetyLabel,
      ...(affectedType === undefined ? {} : { affectedType }),
    },
    provenance: oneOf(source.labelProvenance, PROVENANCES, `${id}.procedencia`),
  }
}

export function mapApprovedDataset(input: unknown): ApprovedCase[] {
  const file = record(input, 'conjunto')
  if (file.dataset !== 'E1') throw new Error('Se esperaba el conjunto E1.')
  if (!Array.isArray(file.cases)) throw new Error('Faltan los casos.')

  return file.cases.map((raw, index) => {
    const mapped = mapApprovedCase(raw)
    const expected = `e1-${String(index + 1).padStart(2, '0')}`
    if (mapped.id !== expected)
      throw new Error(`Se esperaba ${expected} y viene ${mapped.id}.`)
    const exception = EXCEPTIONS[mapped.id]
    return exception === undefined ? mapped : { ...mapped, exception }
  })
}

// Los expedientes de E4 viven en un fichero aparte y nunca se mezclan con las
// etiquetas de E1: cambian la entrada de Jev, no lo que la autora etiquetó.
export function parseE4Profiles(
  input: unknown,
): Record<string, ProfileAnswers> {
  const file = record(input, 'conjunto E4')
  if (file.dataset !== 'E4') throw new Error('Se esperaba el conjunto E4.')
  if (
    typeof file.approval !== 'string' ||
    !file.approval.startsWith('author_approved')
  )
    throw new Error('Los expedientes de E4 no están aprobados por la autora.')

  return Object.fromEntries(
    Object.entries(record(file.profiles, 'perfiles')).map(([id, line]) => [
      id,
      parseProfile(id, text(line, `${id}.perfil`)),
    ]),
  )
}

function parseProfile(id: string, line: string): ProfileAnswers {
  const answers: Record<string, string> = {}
  for (const part of line.split(',')) {
    const [area, answer, ...rest] = part.split(':').map((s) => s.trim())
    if (answer === undefined || answer === '' || rest.length > 0)
      throw new Error(`${id}: perfil mal formado («${part.trim()}»).`)
    if (!(PROFILE_AREAS as readonly string[]).includes(area))
      throw new Error(`${id}: área desconocida (${area}).`)
    if (
      !(AREA_ANSWERS[area as ProfileArea] as readonly string[]).includes(answer)
    )
      throw new Error(`${id}: respuesta desconocida (${area}: ${answer}).`)
    if (answerKind(answer as ProfileAnswer) !== 'concrete')
      throw new Error(
        `${id}: el perfil debe ser una respuesta concreta (${area}).`,
      )
    if (area in answers) throw new Error(`${id}: área repetida (${area}).`)
    answers[area] = answer
  }
  return answers as ProfileAnswers
}
