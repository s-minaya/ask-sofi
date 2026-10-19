import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { checkLabelCoverage } from '../fixtures/coverage.ts'
import { FIXTURES } from '../fixtures/cases.ts'
import { parseArguments } from './arguments.ts'
import { estimatePlan } from './estimate.ts'
import { runLive } from './live.ts'
import { buildPlan } from './plan.ts'

export type Io = {
  log: (line: string) => void
  error: (line: string) => void
  write: (path: string, content: string) => void
}

const REPORTS = resolve(import.meta.dirname, '..', 'reports')

export const nodeIo: Io = {
  log: (line) => console.log(line),
  error: (line) => console.error(line),
  write: (path, content) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content, 'utf-8')
  },
}

// Códigos de salida: 0 correcto, 1 argumentos o configuración inválidos,
// 2 ejecución real detenida antes de terminar (tope, 401, 402 o 403).
export async function main(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  io: Io = nodeIo,
): Promise<number> {
  let mode: ReturnType<typeof parseArguments>
  try {
    mode = parseArguments(argv, env)
  } catch (error) {
    io.error((error as Error).message)
    return 1
  }

  const plan = buildPlan(FIXTURES, mode.plan)
  const estimate = estimatePlan(plan)
  const labels = checkLabelCoverage(FIXTURES)
  io.log(
    `${mode.mode === 'dry' ? 'En seco' : 'Ejecución real'}: ${estimate.analyses} análisis, hasta ${estimate.maxRequests} peticiones.`,
  )
  io.log(
    `Estimación: ~${estimate.estimatedTokens} tokens de entrada, ~$${estimate.estimatedCostUsd.toFixed(4)} (0,042 $ por millón; la salida no se cobra).`,
  )
  if (labels.status === 'pending')
    io.log(
      `Etiquetas de la autora pendientes en ${labels.unlabeled} casos: la ejecución no se puede analizar hasta que existan.`,
    )
  else if (labels.status === 'insufficient')
    io.log(
      `Etiquetas de la autora aprobadas, pero la cobertura no se cumple: ${labels.shortfalls.join(' ')}`,
    )
  else
    io.log(
      `Etiquetas de la autora aprobadas en ${FIXTURES.length} casos: cobertura cumplida.`,
    )

  if (mode.mode === 'dry') {
    io.log(
      'No se ha enviado nada. Para llamar: --live con tope de peticiones y de coste, y la autorización expresa de la autora.',
    )
    return 0
  }

  const report = await runLive(plan, {
    apiKey: mode.apiKey,
    maxRequests: mode.limits.maxRequests,
    maxCostUsd: mode.limits.maxCostUsd,
  })
  const stamp = report.startedAt.replaceAll(':', '-')
  io.write(
    resolve(REPORTS, `${mode.label}-${stamp}.json`),
    JSON.stringify(report, null, 2),
  )
  io.log(
    `Hechas ${report.requests} peticiones, coste ${report.costUsd.toFixed(6)} $ (${report.costSource}).`,
  )
  if (report.halted !== undefined) {
    io.error(`Detenida: ${report.halted}.`)
    return 2
  }
  return 0
}
