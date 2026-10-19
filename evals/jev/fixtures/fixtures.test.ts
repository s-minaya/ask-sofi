import { describe, expect, it } from 'vitest'
import { SIGNAL_IDS } from '../../../src/domain/analysis/signalCatalog.ts'
import {
  answerKind,
  PROFILE_AREAS,
} from '../../../src/domain/partner-profile/partnerProfile.ts'
import { FIXTURES, LABELS_STATUS, REFERENCE_STATUS } from './cases.ts'
import { LANGUAGE_SAMPLES } from './languageSamples.ts'
import { checkLabelCoverage, checkStructure } from './coverage.ts'
import type { Fixture, Labels, SignalLabel } from './types.ts'

const base = (id: string, extra: Partial<Fixture> = {}): Fixture => ({
  id,
  source: 'new',
  message: 'Vale.',
  english: { message: 'Okay.' },
  design: [],
  canary: false,
  labels: null,
  ...extra,
})

const labels = (signal: SignalLabel, extra: Partial<Labels> = {}): Labels => ({
  signals: Object.fromEntries(
    SIGNAL_IDS.map((id) => [id, signal]),
  ) as Labels['signals'],
  expectedStatus: 'interpreted',
  safety: 'none',
  ...extra,
})

describe('los casos de E1 reales', () => {
  it('cumplen la estructura del plan (006-plan §5.2)', () => {
    expect(checkStructure(FIXTURES)).toEqual([])
  })

  it('son entre 40 y 65 y no repiten identificador', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(40)
    expect(FIXTURES.length).toBeLessThanOrEqual(65)
    expect(new Set(FIXTURES.map(({ id }) => id)).size).toBe(FIXTURES.length)
  })

  it('las etiquetas y el inglés de referencia están aprobados por la autora', () => {
    expect(LABELS_STATUS).toBe('author-approved')
    expect(REFERENCE_STATUS).toBe('author-approved')
    expect(FIXTURES.every(({ labels }) => labels !== null)).toBe(true)
    expect(FIXTURES.every(({ labelProvenance }) => labelProvenance)).toBe(true)
  })

  it('la cobertura de etiquetas está cumplida (≥ 4 alta y ≥ 4 baja por señal, seguridad e hipérboles)', () => {
    expect(checkLabelCoverage(FIXTURES)).toEqual({
      status: 'complete',
      unlabeled: 0,
      shortfalls: [],
    })
  })

  it('las etiquetas de seguridad coinciden con la intención de diseño', () => {
    for (const { id, design, labels } of FIXTURES) {
      if (design.includes('hyperbole_candidate'))
        expect(labels?.safety, id).toBe('hyperbole')
      if (design.includes('safety_candidate'))
        expect(labels?.safety, id).toBe('risk')
    }
  })

  it('cada riesgo etiquetado trae su persona afectada y ningún otro caso la trae', () => {
    for (const { id, labels } of FIXTURES)
      expect(labels?.affectedType !== undefined, id).toBe(
        labels?.safety === 'risk',
      )
  })

  it('el inglés de referencia conserva los emojis de cada texto', () => {
    // Revisión mecánica; la fidelidad semántica la revisa la autora.
    expect(checkStructure(FIXTURES).filter((e) => e.includes('emoji'))).toEqual(
      [],
    )
  })

  it('los expedientes están minimizados: solo respuestas concretas de áreas válidas', () => {
    for (const { id, profile } of FIXTURES) {
      for (const [area, answer] of Object.entries(profile ?? {})) {
        expect(PROFILE_AREAS as readonly string[], id).toContain(area)
        expect(answerKind(answer as never), id).toBe('concrete')
      }
    }
  })

  it('la muestra de L1 son tres lenguas distintas y no entra en E1', () => {
    expect(LANGUAGE_SAMPLES.map(({ language }) => language)).toEqual([
      'ca',
      'gl',
      'eu',
    ])
    const ids = new Set(FIXTURES.map(({ id }) => id))
    for (const { id } of LANGUAGE_SAMPLES) expect(ids.has(id)).toBe(false)
  })
})

describe('checkStructure', () => {
  const sized = (n: number) =>
    Array.from({ length: n }, (_, i) => base(`c-${i}`))

  it('exige entre 40 y 65 casos', () => {
    expect(checkStructure(sized(10)).join('\n')).toMatch(/entre 40 y 65/)
    expect(checkStructure(sized(66)).join('\n')).toMatch(/entre 40 y 65/)
    expect(checkStructure(sized(65)).join('\n')).not.toMatch(/entre 40 y 65/)
  })

  it('detecta identificadores repetidos, mensajes vacíos y referencias vacías', () => {
    const errors = checkStructure([
      base('dup'),
      base('dup', { message: '  ' }),
      base('x', { english: { message: '' } }),
    ]).join('\n')

    expect(errors).toMatch(/repetido.*dup/)
    expect(errors).toMatch(/mensaje vacío/)
    expect(errors).toMatch(/referencia en inglés vacía/)
  })

  it('detecta un origen desconocido', () => {
    expect(checkStructure([base('a', { source: 'H31' })]).join('\n')).toMatch(
      /origen desconocido/,
    )
  })

  it('detecta un emoji perdido en la referencia en inglés', () => {
    const errors = checkStructure([
      base('a', { message: 'Vale 👍🏽', english: { message: 'Okay 👍' } }),
    ]).join('\n')

    expect(errors).toMatch(/emoji.*a/)
  })

  it('detecta un contexto sin su referencia en inglés y al revés', () => {
    const errors = checkStructure([
      base('a', { context: 'Algo.' }),
      base('b', { english: { message: 'Okay.', context: 'Something.' } }),
    ]).join('\n')

    expect(errors).toMatch(/a.*contexto/)
    expect(errors).toMatch(/b.*contexto/)
  })

  it('un par mínimo necesita un caso sin contexto y otro con él, con el mismo mensaje', () => {
    const errors = checkStructure([
      base('a', {
        pair: { id: 'Px', kind: 'minimal', role: 'without_context' },
      }),
      base('b', {
        message: 'Otro.',
        context: 'Algo.',
        english: { message: 'Other.', context: 'Something.' },
        pair: { id: 'Px', kind: 'minimal', role: 'with_context' },
      }),
      base('c', {
        pair: { id: 'Py', kind: 'minimal', role: 'without_context' },
      }),
    ]).join('\n')

    expect(errors).toMatch(/Px.*mismo mensaje/)
    expect(errors).toMatch(/Py.*dos casos/)
  })

  it('un par de género necesita dos casos con textos distintos', () => {
    const errors = checkStructure([
      base('a', { pair: { id: 'Gx', kind: 'gender', role: 'feminine' } }),
      base('b', { pair: { id: 'Gx', kind: 'gender', role: 'masculine' } }),
    ]).join('\n')

    expect(errors).toMatch(/Gx.*distintos/)
  })

  it('exige pares, inyecciones, seguridad, hipérboles y canario suficientes', () => {
    const errors = checkStructure(sized(45)).join('\n')

    expect(errors).toMatch(/pares mínimos/)
    expect(errors).toMatch(/pares de género/)
    expect(errors).toMatch(/inyecciones/)
    expect(errors).toMatch(/seguridad/)
    expect(errors).toMatch(/hipérboles/)
    expect(errors).toMatch(/canario/)
  })

  it('rechaza un expediente sin minimizar', () => {
    const errors = checkStructure([
      base('a', { profile: { sarcasm: 'unknown' } }),
    ]).join('\n')

    expect(errors).toMatch(/a.*expediente/)
  })
})

describe('checkLabelCoverage', () => {
  // 10 señales × (4 alta + 4 baja) con 8 casos que reparten las etiquetas, más
  // 8 de seguridad (4 hipérboles).
  const complete = (): Fixture[] => [
    ...Array.from({ length: 4 }, (_, i) =>
      base(`hi-${i}`, { labels: labels('alta') }),
    ),
    ...Array.from({ length: 4 }, (_, i) =>
      base(`lo-${i}`, { labels: labels('baja') }),
    ),
    ...Array.from({ length: 4 }, (_, i) =>
      base(`hy-${i}`, { labels: labels('baja', { safety: 'hyperbole' }) }),
    ),
    ...Array.from({ length: 4 }, (_, i) =>
      base(`rk-${i}`, {
        labels: labels('baja', {
          safety: 'risk',
          affectedType: 'user_at_risk_from_other',
          expectedStatus: 'safety_concern',
        }),
      }),
    ),
  ]

  it('con todos los casos sin etiquetar está pendiente', () => {
    expect(checkLabelCoverage([base('a'), base('b')])).toMatchObject({
      status: 'pending',
      unlabeled: 2,
    })
  })

  it('con algún caso sin etiquetar sigue pendiente, aunque el resto cumpla', () => {
    expect(
      checkLabelCoverage([...complete(), base('sin-etiqueta')]),
    ).toMatchObject({
      status: 'pending',
      unlabeled: 1,
    })
  })

  it('está completa si cada señal tiene ≥ 4 alta y ≥ 4 baja y hay ≥ 8 de seguridad con ≥ 4 hipérboles', () => {
    expect(checkLabelCoverage(complete())).toEqual({
      status: 'complete',
      unlabeled: 0,
      shortfalls: [],
    })
  })

  it('señala la señal y la etiqueta que faltan', () => {
    const cases = complete().map((fixture) =>
      fixture.id === 'hi-0' && fixture.labels !== null
        ? {
            ...fixture,
            labels: {
              ...fixture.labels,
              signals: {
                ...fixture.labels.signals,
                sarcastic_tone: 'indiferente' as const,
              },
            },
          }
        : fixture,
    )

    const coverage = checkLabelCoverage(cases)

    expect(coverage.status).toBe('insufficient')
    expect(coverage.shortfalls.join('\n')).toMatch(/sarcastic_tone.*alta/)
  })

  it('señala la falta de casos de seguridad o de hipérboles', () => {
    const coverage = checkLabelCoverage(
      complete().filter(({ id }) => !id.startsWith('hy-')),
    )

    expect(coverage.status).toBe('insufficient')
    expect(coverage.shortfalls.join('\n')).toMatch(/hipérboles/)
    expect(coverage.shortfalls.join('\n')).toMatch(/seguridad/)
  })

  it('un riesgo etiquetado sin tipo de persona afectada es una etiqueta incompleta', () => {
    const cases = complete().map((fixture) =>
      fixture.id === 'rk-0' && fixture.labels !== null
        ? { ...fixture, labels: { ...fixture.labels, affectedType: undefined } }
        : fixture,
    )

    const coverage = checkLabelCoverage(cases)

    expect(coverage.status).toBe('insufficient')
    expect(coverage.shortfalls.join('\n')).toMatch(/rk-0.*persona afectada/)
  })
})
