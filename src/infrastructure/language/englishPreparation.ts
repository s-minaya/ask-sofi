import type {
  DecisionProvider,
  DecisionReply,
  DecisionRequest,
} from '../../domain/analysis/decisionProvider'

// Puerto propio de infraestructura, no del dominio (006-plan §3.2). Solo el
// mensaje y el contexto pasan por él: el expediente nunca.
export type PreparerInput = { message: string; context?: string }

export type PreparerProvenance = {
  service: string
  result: 'translated' | 'already_english'
  // Versión de la configuración del servicio, no del servicio mismo.
  version: string
}

export type PreparerResult =
  | {
      ok: true
      message: string
      context?: string
      provenance: PreparerProvenance
    }
  | { ok: false; retryable: boolean }

export interface EnglishPreparer {
  prepare(input: PreparerInput): Promise<PreparerResult>
}

// Qué se hizo con el texto. Nunca contiene el texto.
export type LanguagePreparation =
  { result: 'skipped_no_letters' } | PreparerProvenance

export type PreparedProvider = DecisionProvider & {
  // Lo que hizo la última evaluación; el servidor lo lee al terminar.
  readonly preparation: LanguagePreparation | undefined
}

const BLOCKED: DecisionReply = { ok: false, retryable: false }

// Es una comprobación de caracteres, no de idioma (006-spec §2): sin letras no
// hay nada que traducir.
const hasLetters = (text: string) => /\p{L}/u.test(text)

const KEYCAP = /^[0-9#*]️?⃣$/u
const PICTOGRAPH = /\p{Extended_Pictographic}/u
const FLAG = /^\p{Regional_Indicator}{2}$/u
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })

// Los emojis se comparan como grafemas completos (tono, ZWJ, selector de
// variante incluidos), ordenados: traducir puede reordenar, no cambiar emojis.
function emojiGraphemes(text: string): string[] {
  const found: string[] = []
  for (const { segment } of segmenter.segment(text))
    if (PICTOGRAPH.test(segment) || FLAG.test(segment) || KEYCAP.test(segment))
      found.push(segment)
  return found.sort()
}

export const sameEmojis = (original: string, prepared: string) => {
  const before = emojiGraphemes(original)
  const after = emojiGraphemes(prepared)
  return (
    before.length === after.length &&
    before.every((emoji, index) => emoji === after[index])
  )
}

// Validación mecánica, común a cualquier proveedor. Superarla no demuestra
// fidelidad semántica (006-spec §2).
function isValid(input: PreparerInput, output: PreparerResult & { ok: true }) {
  if (output.message.trim() === '') return false
  if (!sameEmojis(input.message, output.message)) return false

  if (input.context === undefined) return output.context === undefined
  return (
    output.context !== undefined &&
    output.context.trim() !== '' &&
    sameEmojis(input.context, output.context)
  )
}

// Decorador del puerto de decisión (006-plan §3.1). Se crea en cada petición:
// guarda en `preparation` lo que hizo. Si prepara mal, Jev no se llama.
export function withEnglishPreparation(
  preparer: EnglishPreparer,
  inner: DecisionProvider,
): PreparedProvider {
  let preparation: LanguagePreparation | undefined

  return {
    get preparation() {
      return preparation
    },

    async evaluate(request: DecisionRequest): Promise<DecisionReply> {
      // El núcleo da el mismo texto a la evaluación y a las lecturas.
      const { message, context } = request.assessment
      const input: PreparerInput =
        context === undefined ? { message } : { message, context }

      if (
        !hasLetters(message) &&
        !(context !== undefined && hasLetters(context))
      ) {
        preparation = { result: 'skipped_no_letters' }
        return inner.evaluate(request)
      }

      let output: PreparerResult
      try {
        output = await preparer.prepare(input)
      } catch {
        // Causa desconocida: prudente. Nunca se muestra el texto de la excepción.
        return BLOCKED
      }
      if (!output.ok) return { ok: false, retryable: output.retryable }
      if (!isValid(input, output)) return BLOCKED

      preparation = output.provenance
      const text =
        output.context === undefined
          ? { message: output.message }
          : { message: output.message, context: output.context }
      return inner.evaluate({
        assessment: { ...text },
        readings:
          request.readings.profile === undefined
            ? { ...text }
            : { ...text, profile: request.readings.profile },
      })
    },
  }
}
