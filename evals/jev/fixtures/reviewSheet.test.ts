import { describe, expect, it } from 'vitest'
import { SIGNAL_CATALOG } from '../../../src/domain/analysis/signalCatalog.ts'
import { FIXTURES } from './cases.ts'
import {
  buildSheets,
  chunkBalanced,
  chunkFixtures,
  renderSheet,
} from './reviewSheet.ts'
import type { Fixture } from './types.ts'

const fixture = (id: string, extra: Partial<Fixture> = {}): Fixture => ({
  id,
  source: 'H24',
  message: `Mensaje ${id}`,
  english: { message: `Message ${id}` },
  design: ['hyperbole_candidate'],
  canary: false,
  labels: null,
  ...extra,
})

describe('chunkFixtures', () => {
  it('reparte en tandas de como máximo 12 conservando el orden', () => {
    const cases = Array.from({ length: 30 }, (_, i) => fixture(`c-${i}`))

    const chunks = chunkFixtures(cases, 12)

    expect(chunks.map((chunk) => chunk.length)).toEqual([12, 12, 6])
    expect(chunks.flat()).toEqual(cases)
  })

  it('no separa los miembros de un par: se etiquetan juntos', () => {
    const pair = (id: string, role: 'feminine' | 'masculine') =>
      fixture(id, { pair: { id: 'G', kind: 'gender', role } })
    const cases = [
      ...Array.from({ length: 11 }, (_, i) => fixture(`c-${i}`)),
      pair('g-a', 'feminine'),
      pair('g-b', 'masculine'),
      fixture('after'),
    ]

    const chunks = chunkFixtures(cases, 12)

    expect(chunks[0].map(({ id }) => id)).not.toContain('g-a')
    expect(chunks[1].map(({ id }) => id).slice(0, 2)).toEqual(['g-a', 'g-b'])
    expect(chunks.flat()).toEqual(cases)
  })
})

describe('las hojas de los casos reales', () => {
  const sheets = buildSheets(FIXTURES)

  it('son tandas de entre 8 y 12 casos y cubren todos una sola vez', () => {
    expect(sheets.length).toBeGreaterThanOrEqual(5)
    const counts = sheets.map(({ cases }) => cases.length)
    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(8)
      expect(count).toBeLessThanOrEqual(12)
    }
    expect(sheets.flatMap(({ cases }) => cases.map(({ id }) => id))).toEqual(
      FIXTURES.map(({ id }) => id),
    )
  })

  it('cada hoja trae mensaje, contexto, inglés de referencia y un hueco por cada etiqueta', () => {
    for (const sheet of sheets)
      for (const fixture of sheet.cases) {
        const block = sheet.markdown.split(`### ${fixture.id}\n`)[1]
        expect(block, fixture.id).toBeDefined()
        expect(block).toContain(fixture.message)
        expect(block).toContain(fixture.english.message)
        if (fixture.context !== undefined)
          expect(block).toContain(fixture.context)
        for (const { id } of SIGNAL_CATALOG)
          expect(block, `${fixture.id} ${id}`).toContain(`\`${id}\``)
      }
  })

  it('no deja nada marcado: las etiquetas las pone la autora', () => {
    for (const { markdown } of sheets) {
      expect(markdown).not.toMatch(/\[[xX]\]/)
      expect(markdown).toMatch(/\[ \]/)
    }
  })

  it('no sugiere etiquetas: ni intención de diseño ni identificadores del registro', () => {
    for (const { markdown } of sheets) {
      expect(markdown).not.toMatch(
        /hyperbole_candidate|safety_candidate|explicit_boundary|profile_misleading|profile_coherent|injection|omitted_marker|emoji_only/,
      )
      expect(markdown).not.toMatch(/\b(H|C|T)\d{1,2}\b/)
    }
  })

  it('incluye la leyenda con las diez señales y su definición neutral', () => {
    for (const { markdown } of sheets)
      for (const { id, definition } of SIGNAL_CATALOG) {
        expect(markdown).toContain(`\`${id}\``)
        expect(markdown).toContain(definition)
      }
  })

  it('la leyenda recoge el criterio de la autora, no el procedimiento propuesto por el agente', () => {
    for (const { markdown } of sheets) {
      expect(markdown).not.toMatch(/Procedimiento propuesto/)
      expect(markdown).toMatch(
        /\*\*Alta:\*\* el texto y el contexto disponible respaldan claramente la señal/,
      )
      expect(markdown).toMatch(
        /\*\*Baja:\*\* hay evidencia en contra o suficiente base textual para considerar la lectura poco plausible; no equivale automáticamente a ausencia de evidencia/,
      )
      expect(markdown).toMatch(
        /\*\*Indiferente:\*\* no puede determinarse con los datos disponibles, o persisten interpretaciones plausibles enfrentadas/,
      )
      expect(markdown).toMatch(
        /Cada una de las diez señales se evalúa por separado/,
      )
      expect(markdown).toMatch(
        /`literal_meaning` = alta puede coexistir con `needs_context`/,
      )
      expect(markdown).toMatch(
        /sin indicios de peligro en el material proporcionado/,
      )
      expect(markdown).toMatch(/límites expresados por quien envía el mensaje/)
    }
  })

  it('el inglés de referencia ya está aprobado: no se presenta como borrador', () => {
    for (const { markdown } of sheets) expect(markdown).not.toMatch(/borrador/i)
  })

  it('el expediente de un caso se muestra aparte y avisa de que no condiciona la etiqueta', () => {
    const withProfile = FIXTURES.find(({ profile }) => profile !== undefined)!
    const sheet = sheets.find(({ cases }) =>
      cases.some(({ id }) => id === withProfile.id),
    )!

    const block = sheet.markdown.split(`### ${withProfile.id}\n`)[1]

    expect(block).toMatch(/Expediente/)
    expect(block).toMatch(/no condiciona/i)
  })

  it('es determinista: la misma entrada da el mismo documento', () => {
    expect(buildSheets(FIXTURES).map(({ markdown }) => markdown)).toEqual(
      sheets.map(({ markdown }) => markdown),
    )
  })
})

describe('renderSheet', () => {
  it('un caso sin contexto lo dice, y el contexto no se inventa', () => {
    const markdown = renderSheet([fixture('a')], { number: 1, total: 1 })

    expect(markdown).toMatch(/sin contexto/i)
  })
})

describe('chunkBalanced', () => {
  it('reparte 65 casos en tandas parejas, de 12 como máximo y sin separar pares', () => {
    const cases = Array.from({ length: 65 }, (_, i) =>
      fixture(`c-${i}`, {
        ...(i === 10 || i === 11
          ? {
              pair: {
                id: 'G',
                kind: 'gender' as const,
                role: i === 10 ? ('feminine' as const) : ('masculine' as const),
              },
            }
          : {}),
      }),
    )

    const chunks = chunkBalanced(cases)

    expect(chunks.flat()).toEqual(cases)
    const sizes = chunks.map((chunk) => chunk.length)
    expect(Math.max(...sizes)).toBeLessThanOrEqual(12)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8)
    const withPair = chunks.filter((chunk) =>
      chunk.some(({ pair }) => pair?.id === 'G'),
    )
    expect(withPair).toHaveLength(1)
  })
})
