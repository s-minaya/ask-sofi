import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_CATALOG,
} from '../../../src/domain/analysis/signalCatalog.ts'
import type { Fixture } from './types.ts'

// Hojas de trabajo para que la autora revise el inglés de referencia y etiquete
// E1 en tandas pequeñas. Se generan desde `cases.ts` y no suponen
// ninguna etiqueta: todos los huecos salen vacíos (las aprobadas viven en
// `review/e1-casos-aprobados-65.json`). No muestran la intención de
// diseño ni el origen de cada caso, para no sugerir respuestas (decisión 7).

const MAX_PER_SHEET = 12

// Respeta el orden y no separa los miembros de un par (mínimo o de género):
// se etiquetan juntos para que el criterio sea el mismo.
export function chunkFixtures(
  cases: readonly Fixture[],
  max: number = MAX_PER_SHEET,
): Fixture[][] {
  const chunks: Fixture[][] = []
  let current: Fixture[] = []
  for (const fixture of cases) {
    const last = current.at(-1)
    const continuesPair =
      fixture.pair !== undefined && last?.pair?.id === fixture.pair.id
    if (current.length >= max && !continuesPair) {
      chunks.push(current)
      current = []
    } else if (current.length >= max && continuesPair) {
      // El par entero pasa a la tanda siguiente.
      const moved = current.filter(({ pair }) => pair?.id === fixture.pair?.id)
      current = current.filter(({ pair }) => pair?.id !== fixture.pair?.id)
      chunks.push(current)
      current = moved
    }
    current.push(fixture)
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

// Tandas del mismo tamaño aproximado, sin una última casi vacía. Una tanda se
// cierra al llegar al tamaño objetivo, pero nunca entre los dos miembros de un
// par (por eso puede pasar del objetivo en un caso).
export function chunkBalanced(cases: readonly Fixture[]): Fixture[][] {
  const target = Math.ceil(
    cases.length / Math.ceil(cases.length / MAX_PER_SHEET),
  )
  const chunks: Fixture[][] = []
  let current: Fixture[] = []
  for (const fixture of cases) {
    const continuesPair =
      fixture.pair !== undefined && current.at(-1)?.pair?.id === fixture.pair.id
    if (current.length >= target && !continuesPair) {
      chunks.push(current)
      current = []
    }
    current.push(fixture)
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

const boxes = (options: readonly string[]) =>
  options.map((option) => `[ ] ${option}`).join('  ·  ')

function renderCase(fixture: Fixture): string {
  const signalRows = SIGNAL_CATALOG.map(
    ({ id }) => `| \`${id}\` | [ ] | [ ] | [ ] |`,
  )
  const profile =
    fixture.profile === undefined
      ? []
      : [
          `**Expediente** (solo para E4; no condiciona tus etiquetas): ${Object.entries(
            fixture.profile,
          )
            .map(([area, answer]) => `${area}: ${answer}`)
            .join(', ')}`,
          '',
        ]

  return [
    `### ${fixture.id}`,
    '',
    `> **Mensaje:** ${fixture.message}`,
    `>`,
    `> **Contexto:** ${fixture.context ?? '_(sin contexto)_'}`,
    '',
    ...profile,
    `**Inglés de referencia:** ${fixture.english.message}`,
    '',
    ...(fixture.english.context === undefined
      ? []
      : [`**Contexto en inglés:** ${fixture.english.context}`, '']),
    `Revisión del inglés: ${boxes(['fiel', 'corregir'])}  →  Corrección: `,
    '',
    '| Señal | alta | baja | indiferente |',
    '|---|---|---|---|',
    ...signalRows,
    '',
    `**Estado esperado:** ${boxes(['interpreted', 'needs_context', 'safety_concern'])}`,
    '',
    `**Seguridad:** ${boxes(['ninguna', 'riesgo', 'hipérbole'])}`,
    '',
    `**Persona afectada** (solo si hay riesgo): ${boxes(AFFECTED_PERSON_TYPES)}`,
    '',
  ].join('\n')
}

function legend(): string[] {
  return [
    '## Cómo etiquetar',
    '',
    'Etiqueta **antes de ver ninguna respuesta de Jev** (decisión 7). Marca cada hueco poniendo una `x` entre los corchetes.',
    '',
    'Criterio de la autora (el que prevalece sobre cualquier otro):',
    '',
    '- **Alta:** el texto y el contexto disponible respaldan claramente la señal.',
    '- **Baja:** hay evidencia en contra o suficiente base textual para considerar la lectura poco plausible; no equivale automáticamente a ausencia de evidencia.',
    '- **Indiferente:** no puede determinarse con los datos disponibles, o persisten interpretaciones plausibles enfrentadas.',
    '- Cada una de las diez señales se evalúa por separado: `literal_meaning` = alta puede coexistir con `needs_context`.',
    '- No tomes un punto final, un mensaje corto o un «vale» aislado como prueba de enfado, sarcasmo o indirecta.',
    '- `setting_boundary` son límites expresados por quien envía el mensaje; aceptar un límite ajeno no basta.',
    '- **Estado esperado:** lo que debería salir (`interpreted`, `needs_context` o `safety_concern`).',
    '- **Seguridad:** `riesgo` si hay una amenaza, coerción o riesgo de autolesión; `hipérbole` si suena a riesgo pero es una exageración coloquial; `ninguna` significa sin indicios de peligro en el material proporcionado, no una garantía sobre la situación real.',
    '- **Persona afectada:** solo si marcaste `riesgo`.',
    '',
    '| Señal | Definición neutral |',
    '|---|---|',
    ...SIGNAL_CATALOG.map(
      ({ id, definition }) => `| \`${id}\` | ${definition} |`,
    ),
    '',
  ]
}

export function renderSheet(
  cases: readonly Fixture[],
  position: { number: number; total: number },
): string {
  return [
    `# E1 · Revisión y etiquetado · tanda ${position.number} de ${position.total}`,
    '',
    `${cases.length} casos (${cases[0].id} – ${cases.at(-1)?.id}). Los casos son ficticios.`,
    '',
    ...legend(),
    '## Casos',
    '',
    ...cases.map(renderCase),
  ].join('\n')
}

export type Sheet = {
  name: string
  cases: Fixture[]
  markdown: string
}

export function buildSheets(cases: readonly Fixture[]): Sheet[] {
  const chunks = chunkBalanced(cases)
  return chunks.map((chunk, index) => ({
    name: `tanda-${index + 1}-de-${chunks.length}.md`,
    cases: chunk,
    markdown: renderSheet(chunk, { number: index + 1, total: chunks.length }),
  }))
}
