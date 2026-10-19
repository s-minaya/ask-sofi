import type { PolicyConfig } from '../domain/analysis/analysisPolicy'
import { createJevDecisionProvider } from '../infrastructure/ai/jevDecisionProvider'
import { JEV_POLICY_CONFIG } from '../infrastructure/ai/jevPolicyConfig'
import type { EnglishPreparer } from '../infrastructure/language/englishPreparation'
import type { InterpretHandlerDependencies } from './interpretHandler'

// El entorno llega como argumento: solo `api/interpret.ts` lee `process.env`
// (006-plan §2). Así la composición se prueba sin tocar el del proceso.
export type Env = Readonly<Record<string, string | undefined>>

export const AI_GATEWAY_KEY_VARIABLE = 'AI_GATEWAY_API_KEY'

// Ningún traductor está aprobado: L1 (006-plan §5.3) lo decide con datos y la
// autora lo confirma. T026 registra aquí el adaptador elegido.
const createApprovedPreparer = (): EnglishPreparer | undefined => undefined

export type ComposeParts = {
  policy: PolicyConfig | undefined
  createPreparer: (env: Env) => EnglishPreparer | undefined
  fetch: typeof fetch
}

// Falla cerrado (006-plan §3.1): sin credencial, sin traductor aprobado o sin
// PolicyConfig respaldada por experimentos no hay dependencias. La credencial es
// además la marca de autorización: no existe en ningún entorno desplegado hasta
// que `013` y la autora lo permitan (decisión 8). Nunca cae al fake ni a otro
// proveedor. Las piezas de `parts` solo las inyectan las pruebas.
export function composeInterpret(
  env: Env,
  parts: Partial<ComposeParts> = {},
): InterpretHandlerDependencies | undefined {
  const apiKey = env[AI_GATEWAY_KEY_VARIABLE]?.trim()
  const policy = 'policy' in parts ? parts.policy : JEV_POLICY_CONFIG
  const preparer = (parts.createPreparer ?? createApprovedPreparer)(env)
  if (!apiKey || policy === undefined || preparer === undefined)
    return undefined

  return {
    provider: createJevDecisionProvider({
      apiKey,
      readings: { mode: 'when-needed', policy },
      fetch: parts.fetch,
    }),
    preparer,
    policy,
  }
}
