// Cadenas que solo existen en el servidor (006-plan §7): si aparecen en el
// bundle del cliente, un módulo del servidor se ha colado o una credencial se ha
// expuesto. Los nombres de las variables del traductor se añaden cuando se
// apruebe uno (L1).
export const FORBIDDEN_IN_CLIENT = [
  'ai-gateway.vercel.sh',
  'AI_GATEWAY',
  'typesafe-ai',
  'disallowPromptTraining',
  'reportedTendencies',
] as const

export type Leak = { file: string; found: string }

// Devuelve dónde aparece cada cadena, nunca el contenido que la rodea.
export function findLeaks(files: Record<string, string>): Leak[] {
  return Object.entries(files).flatMap(([file, content]) =>
    FORBIDDEN_IN_CLIENT.filter((needle) => content.includes(needle)).map(
      (found) => ({ file, found }),
    ),
  )
}
