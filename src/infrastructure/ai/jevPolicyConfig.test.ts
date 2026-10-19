import { describe, expect, it } from 'vitest'
import type { PolicyConfig } from '../../domain/analysis/analysisPolicy'
import plan from '../../../spec/features/006-jev-integration/006-plan.md?raw'
import { JEV_POLICY_CONFIG } from './jevPolicyConfig'

type PlanTable = { pending: string[]; values: Record<string, unknown> }

// Lee la tabla de «6. Valores provisionales de `PolicyConfig`». Una fila con
// «Pendiente» no tiene valor; las demás llevan un número, `true`/`false` o, para
// `policyVersion`, una cadena entre comillas.
function parsePlanTable(markdown: string): PlanTable {
  const section = /\n## 6\. [^\n]*\n([\s\S]*?)\n## 7\./.exec(markdown)?.[1]
  if (section === undefined) throw new Error('No se encuentra la sección 6')

  const table: PlanTable = { pending: [], values: {} }
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim())
    const name = /^`([\w.]+)`$/.exec(cells[1] ?? '')?.[1]
    if (name === undefined) continue

    const raw = cells[4] ?? ''
    if (raw === 'Pendiente') table.pending.push(name)
    else table.values[name] = JSON.parse(raw.replace(/^`|`$/g, ''))
  }
  return table
}

function configFrom(values: Record<string, unknown>): PolicyConfig {
  const at = (path: string) => values[path]
  return {
    policyVersion: at('policyVersion') as string,
    safety: {
      concernAt: at('safety.concernAt') as number,
      affectedTypeAt: at('safety.affectedTypeAt') as number,
    },
    sufficiency: {
      insufficientBelow: at('sufficiency.insufficientBelow') as number,
      sufficientFrom: at('sufficiency.sufficientFrom') as number,
      requestContextWhenPartial: at(
        'sufficiency.requestContextWhenPartial',
      ) as boolean,
    },
    signals: { communicableAt: at('signals.communicableAt') as number },
  }
}

const PARAMETERS = [
  'policyVersion',
  'safety.concernAt',
  'safety.affectedTypeAt',
  'sufficiency.insufficientBelow',
  'sufficiency.sufficientFrom',
  'sufficiency.requestContextWhenPartial',
  'signals.communicableAt',
]

describe('lector de la tabla del plan', () => {
  it('distingue las filas pendientes de las que tienen valor', () => {
    const table = parsePlanTable(`
## 6. Valores
| Parámetro | Fuente | Regla | Valor | Procedencia |
|---|---|---|---|---|
| \`policyVersion\` | — | x | "1" | E2 |
| \`safety.concernAt\` | E6 | x | 0.4 | E6 |
| \`signals.communicableAt\` | E2 | x | Pendiente | — |
| \`sufficiency.requestContextWhenPartial\` | E3 | x | true | E3 |

## 7. Otra cosa
| \`ignorada.fila\` | — | x | 9 | — |
`)

    expect(table.pending).toEqual(['signals.communicableAt'])
    expect(table.values).toEqual({
      policyVersion: '1',
      'safety.concernAt': 0.4,
      'sufficiency.requestContextWhenPartial': true,
    })
  })
})

describe('jevPolicyConfig', () => {
  const table = parsePlanTable(plan)

  it('el plan declara todos los parámetros de PolicyConfig y ninguno más', () => {
    expect([...table.pending, ...Object.keys(table.values)].sort()).toEqual(
      [...PARAMETERS].sort(),
    )
  })

  it('sin base experimental no exporta ninguna PolicyConfig: ningún valor inventado', () => {
    // Mientras alguna fila del plan diga «Pendiente», no hay configuración.
    if (table.pending.length > 0) expect(JEV_POLICY_CONFIG).toBeUndefined()
  })

  it('con todas las filas rellenas, exporta exactamente esos valores', () => {
    // Se activa en T027, cuando el plan tenga los valores con su procedencia.
    if (table.pending.length === 0)
      expect(JEV_POLICY_CONFIG).toEqual(configFrom(table.values))
  })

  it('una configuración solo existe si el plan la respalda', () => {
    expect(JEV_POLICY_CONFIG === undefined).toBe(table.pending.length > 0)
  })
})
