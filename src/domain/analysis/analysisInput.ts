import * as z from 'zod/mini'
import {
  answerKind,
  AREA_ANSWERS,
  PROFILE_AREAS,
  type ProfileAnswers,
} from '../partner-profile/partnerProfile'

export type AnalysisInput = {
  message: string
  context?: string
  // Ya autorizado y minimizado: solo respuestas concretas, sin notas.
  profile?: ProfileAnswers
}

export type InputLimits = { messageMaxLength: number; contextMaxLength: number }

// Provisionales (005-plan §4): caben con holgura en el presupuesto de jev.md §2.4.
export const DEFAULT_INPUT_LIMITS: InputLimits = {
  messageMaxLength: 2000,
  contextMaxLength: 4000,
}

export type InputIssue =
  | 'invalid_shape'
  | 'message_empty'
  | 'message_too_long'
  | 'context_too_long'
  | 'profile_not_minimized'

export type InputCheck =
  { ok: true; input: AnalysisInput } | { ok: false; issues: InputIssue[] }

// Estricto a propósito: una clave desconocida (las notas del expediente, por
// ejemplo) es entrada inválida, nunca algo que se descarta en silencio.
const profileSchema = z.strictObject(
  Object.fromEntries(
    PROFILE_AREAS.map((area) => [area, z.optional(z.enum(AREA_ANSWERS[area]))]),
  ),
)

const inputSchema = z.strictObject({
  message: z.string(),
  context: z.optional(z.string()),
  profile: z.optional(profileSchema),
})

export function parseAnalysisInput(
  raw: unknown,
  limits: InputLimits = DEFAULT_INPUT_LIMITS,
): InputCheck {
  const shape = inputSchema.safeParse(raw)
  if (!shape.success) return { ok: false, issues: ['invalid_shape'] }

  const { message, context } = shape.data
  const profile = shape.data.profile as ProfileAnswers | undefined
  const issues: InputIssue[] = []

  if (message.trim() === '') issues.push('message_empty')
  else if (message.length > limits.messageMaxLength)
    issues.push('message_too_long')

  // Un contexto en blanco es no tener contexto; uno largo nunca se trunca.
  const hasContext = context !== undefined && context.trim() !== ''
  if (hasContext && context.length > limits.contextMaxLength)
    issues.push('context_too_long')

  const answers: Record<string, string> = {}
  if (profile !== undefined) {
    for (const area of PROFILE_AREAS) {
      const answer = profile[area]
      if (answer === undefined) continue
      if (
        answerKind(answer) !== 'concrete' &&
        !issues.includes('profile_not_minimized')
      )
        issues.push('profile_not_minimized')
      answers[area] = answer
    }
  }

  if (issues.length > 0) return { ok: false, issues }

  const input: AnalysisInput = { message }
  if (hasContext) input.context = context
  if (profile !== undefined) input.profile = answers as ProfileAnswers
  return { ok: true, input }
}

// Marcadores que dejan las exportaciones de mensajería donde había contenido que
// no es texto. Lista cerrada y provisional: un marcador que no esté aquí sigue el
// flujo normal. Va normalizada (minúsculas, sin diacríticos, sin envoltorio).
const OMITTED_CONTENT_MARKERS: ReadonlySet<string> = new Set([
  'audio omitido',
  'imagen omitida',
  'video omitido',
  'sticker omitido',
  'gif omitido',
  'documento omitido',
  'multimedia omitido',
  'se elimino este mensaje',
  'eliminaste este mensaje',
  'audio omitted',
  'image omitted',
  'video omitted',
  'sticker omitted',
  'gif omitted',
  'document omitted',
  'media omitted',
  'this message was deleted',
  'you deleted this message',
])

function normalizeMarker(message: string): string {
  const trimmed = message.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim()
  const wrapped = /^<(.*)>$/s.exec(trimmed) ?? /^\[(.*)\]$/s.exec(trimmed)
  return (wrapped?.[1] ?? trimmed)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .replace(/\.+$/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Compara el mensaje entero, no subcadenas: «Te mando el audio omitido» es texto.
export function isOmittedContentMarker(message: string): boolean {
  return OMITTED_CONTENT_MARKERS.has(normalizeMarker(message))
}
