import type { Arm, PlanConfig } from './plan.ts'

export type RunMode =
  | { mode: 'dry'; plan: PlanConfig }
  | {
      mode: 'live'
      plan: PlanConfig
      apiKey: string
      limits: { maxRequests: number; maxCostUsd: number }
      label: string
    }

const ARMS: readonly Arm[] = ['english', 'spanish']
const VALUE_FLAGS = new Set([
  '--arms',
  '--repetitions',
  '--profile',
  '--only',
  '--max-requests',
  '--max-cost-usd',
  '--label',
])

function positive(name: string, raw: string | undefined): number {
  const value = Number(raw)
  if (raw === undefined || !Number.isFinite(value) || value <= 0)
    throw new Error(`${name} es obligatorio y debe ser un número mayor que 0.`)
  return value
}

// En seco por defecto: nada se envía. Para llamar hacen falta `--live`, la
// credencial dedicada y un tope de peticiones y de coste (006-plan §5.1).
// Además, cada ejecución real necesita la autorización expresa de la autora (G2).
export function parseArguments(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): RunMode {
  const values = new Map<string, string>()
  let live = false
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === '--live') live = true
    else if (VALUE_FLAGS.has(flag)) {
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('--'))
        throw new Error(`${flag} necesita un valor.`)
      values.set(flag, value)
      index += 1
    } else throw new Error(`Argumento desconocido: ${flag}`)
  }

  const arms = (values.get('--arms') ?? ARMS.join(',')).split(',') as Arm[]
  if (arms.some((arm) => !ARMS.includes(arm)))
    throw new Error('--arms admite english y spanish.')

  const repetitions = Number(values.get('--repetitions') ?? 3)
  if (!Number.isInteger(repetitions) || repetitions < 1)
    throw new Error('--repetitions debe ser un entero mayor que 0.')

  const profile = values.get('--profile') ?? 'none'
  if (profile !== 'none' && profile !== 'as-is')
    throw new Error('--profile admite none y as-is.')

  const only = values.get('--only')
  if (only !== undefined && only !== 'canary')
    throw new Error('--only admite canary.')

  const plan: PlanConfig = {
    arms,
    repetitions,
    profile,
    ...(only === undefined ? {} : { only }),
  }
  if (!live) return { mode: 'dry', plan }

  const apiKey = env.AI_GATEWAY_API_KEY?.trim()
  if (!apiKey)
    throw new Error(
      '--live necesita la credencial dedicada en AI_GATEWAY_API_KEY.',
    )
  const label = values.get('--label') ?? 'run'
  if (!/^[a-z0-9-]+$/.test(label))
    throw new Error('--label solo admite minúsculas, números y guiones.')

  return {
    mode: 'live',
    plan,
    apiKey,
    label,
    limits: {
      maxRequests: positive('--max-requests', values.get('--max-requests')),
      maxCostUsd: positive('--max-cost-usd', values.get('--max-cost-usd')),
    },
  }
}
