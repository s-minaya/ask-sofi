import { describe, expect, it } from 'vitest'
import { SIGNAL_IDS } from '../../../src/domain/analysis/signalCatalog.ts'
import { APPROVED_CASES, E4_PROFILES } from './approvedData.ts'
import {
  mapApprovedCase,
  mapApprovedDataset,
  parseE4Profiles,
} from './approved.ts'
import { checkLabelCoverage } from './coverage.ts'
import { FIXTURES } from './cases.ts'
import approvedFile from '../review/e1-casos-aprobados-65.json' with { type: 'json' }
import sidecarFile from '../review/e1-perfiles-e4-aislados.json' with { type: 'json' }

const signals = (label: string) =>
  Object.fromEntries(SIGNAL_IDS.map((id) => [id, label]))

const raw = (extra: Record<string, unknown> = {}) => ({
  id: 'e1-01',
  message: 'Vale.',
  context: null,
  referenceEnglish: 'Okay.',
  referenceContextEnglish: null,
  signals: signals('indiferente'),
  expectedStatus: 'needs_context',
  safety: 'ninguna',
  affectedPersonType: null,
  labelProvenance: 'human_independent',
  translationApproval: 'author_approved',
  ...extra,
})

describe('mapApprovedCase: mapeo explícito al vocabulario del repositorio', () => {
  it('traduce seguridad, persona afectada, contexto y referencia inglesa', () => {
    const mapped = mapApprovedCase(
      raw({
        id: 'e1-32',
        message: 'Si me dejas, te haré daño.',
        context: 'Algo.',
        referenceContextEnglish: 'Something.',
        expectedStatus: 'safety_concern',
        safety: 'riesgo',
        affectedPersonType: 'user_at_risk_from_other',
      }),
    )

    expect(mapped).toMatchObject({
      id: 'e1-32',
      context: 'Algo.',
      english: { message: 'Okay.', context: 'Something.' },
      provenance: 'human_independent',
      labels: {
        expectedStatus: 'safety_concern',
        safety: 'risk',
        affectedType: 'user_at_risk_from_other',
      },
    })
  })

  it.each([
    ['ninguna', 'none'],
    ['hipérbole', 'hyperbole'],
  ])('«%s» pasa a «%s» y no lleva persona afectada', (spanish, internal) => {
    const { labels } = mapApprovedCase(raw({ safety: spanish }))

    expect(labels.safety).toBe(internal)
    expect(labels).not.toHaveProperty('affectedType')
  })

  it('sin contexto no inventa uno: ni en el mensaje ni en el inglés', () => {
    const mapped = mapApprovedCase(raw())

    expect(mapped).not.toHaveProperty('context')
    expect(mapped.english).toEqual({ message: 'Okay.' })
  })

  it('conserva las diez etiquetas tal como vienen', () => {
    const input = signals('indiferente')
    input.literal_meaning = 'alta'
    input.playful_teasing = 'baja'

    const { labels } = mapApprovedCase(raw({ signals: input }))

    expect(labels.signals).toEqual(input)
  })

  it('rechaza lo que no encaja en lugar de adivinarlo', () => {
    const invalid: [string, Record<string, unknown>][] = [
      ['etiqueta desconocida', { signals: signals('media') }],
      [
        'señal desconocida',
        { signals: { ...signals('baja'), invented_signal: 'alta' } },
      ],
      [
        'señal ausente',
        {
          signals: Object.fromEntries(
            SIGNAL_IDS.slice(1).map((id) => [id, 'baja']),
          ),
        },
      ],
      ['estado desconocido', { expectedStatus: 'unknown_status' }],
      ['seguridad desconocida', { safety: 'peligro' }],
      [
        'riesgo sin persona afectada',
        { safety: 'riesgo', expectedStatus: 'safety_concern' },
      ],
      [
        'persona afectada sin riesgo',
        { affectedPersonType: 'user_at_risk_from_other' },
      ],
      [
        'persona afectada desconocida',
        {
          safety: 'riesgo',
          expectedStatus: 'safety_concern',
          affectedPersonType: 'someone',
        },
      ],
      ['procedencia desconocida', { labelProvenance: 'guess' }],
      ['traducción sin aprobar', { translationApproval: 'draft' }],
      ['mensaje vacío', { message: '  ' }],
      ['identificador mal formado', { id: 'caso-1' }],
      ['contexto sin su inglés', { context: 'Algo.' }],
      ['inglés de contexto sin contexto', { referenceContextEnglish: 'Algo.' }],
    ]
    for (const [name, extra] of invalid)
      expect(() => mapApprovedCase(raw(extra)), name).toThrow()
  })

  it('no acepta un caso con claves que no conoce (p. ej., un expediente)', () => {
    expect(() =>
      mapApprovedCase(raw({ profile: { sarcasm: 'often' } })),
    ).toThrow(/profile/)
  })

  it('acepta la razón validada por la autora (rationale) sin importarla', () => {
    const mapped = mapApprovedCase(
      raw({
        labelProvenance: 'ai_proposed_author_reviewed_approved',
        rationale: 'Motivo.',
      }),
    )

    expect(JSON.stringify(mapped)).not.toContain('Motivo.')
  })
})

describe('mapApprovedDataset', () => {
  const base = (cases: unknown[]) => ({
    dataset: 'E1',
    version: 'test',
    cases,
  })

  it('exige el conjunto E1 con identificadores correlativos desde e1-01', () => {
    expect(() =>
      mapApprovedDataset({ ...base([raw()]), dataset: 'E2' }),
    ).toThrow(/E1/)
    expect(() =>
      mapApprovedDataset(base([raw(), raw({ id: 'e1-03' })])),
    ).toThrow(/e1-02/)
    expect(() => mapApprovedDataset(base([raw(), raw()]))).toThrow()
    expect(
      mapApprovedDataset(base([raw(), raw({ id: 'e1-02' })])),
    ).toHaveLength(2)
  })

  it('marca las dos excepciones documentadas y ninguna más', () => {
    const cases = Array.from({ length: 31 }, (_, i) =>
      raw({ id: `e1-${String(i + 1).padStart(2, '0')}` }),
    )

    const mapped = mapApprovedDataset(base(cases))

    expect(mapped.filter(({ exception }) => exception !== undefined)).toEqual([
      expect.objectContaining({
        id: 'e1-06',
        exception: 'incidental_english_exposure',
      }),
      expect.objectContaining({
        id: 'e1-31',
        exception: 'author_override_status_and_safety',
      }),
    ])
  })
})

describe('parseE4Profiles: expedientes aislados', () => {
  const sidecar = (profiles: Record<string, string>) => ({
    dataset: 'E4',
    approval: 'author_approved_2026-10-19',
    profiles,
  })

  it('convierte «área: respuesta, …» en un expediente', () => {
    expect(
      parseE4Profiles(
        sidecar({ 'e1-53': 'sarcasm: often, directness: drops-hints' }),
      ),
    ).toEqual({ 'e1-53': { sarcasm: 'often', directness: 'drops-hints' } })
  })

  it('rechaza áreas o respuestas fuera del expediente y respuestas no concretas', () => {
    for (const bad of [
      'humor: often',
      'sarcasm: sometimes-ish',
      'sarcasm: depends',
      'sarcasm: unknown',
      'sarcasm',
      'sarcasm: often, sarcasm: rarely',
      '',
    ])
      expect(() => parseE4Profiles(sidecar({ 'e1-53': bad })), bad).toThrow()
  })

  it('exige que sea el conjunto E4 aprobado', () => {
    expect(() => parseE4Profiles({ ...sidecar({}), dataset: 'E1' })).toThrow(
      /E4/,
    )
    expect(() =>
      parseE4Profiles({ ...sidecar({}), approval: 'pending' }),
    ).toThrow(/aprob/i)
  })
})

describe('los 65 casos aprobados por la autora', () => {
  it('son 65, correlativos, y reproducen los ficheros de revisión', () => {
    expect(APPROVED_CASES).toHaveLength(65)
    expect(APPROVED_CASES.map(({ id }) => id)).toEqual(
      approvedFile.cases.map(({ id }) => id),
    )
  })

  it('el mapeo no altera ninguna etiqueta: ida y vuelta con el fichero aprobado', () => {
    const backToFile = (value: string) =>
      ({ none: 'ninguna', risk: 'riesgo', hyperbole: 'hipérbole' })[value]

    for (const approved of approvedFile.cases) {
      const mapped = APPROVED_CASES.find(({ id }) => id === approved.id)!
      expect(mapped.labels.signals, approved.id).toEqual(approved.signals)
      expect(mapped.labels.expectedStatus, approved.id).toBe(
        approved.expectedStatus,
      )
      expect(backToFile(mapped.labels.safety), approved.id).toBe(
        approved.safety,
      )
      expect(mapped.labels.affectedType ?? null, approved.id).toBe(
        approved.affectedPersonType,
      )
      expect(mapped.message, approved.id).toBe(approved.message)
      expect(mapped.context ?? null, approved.id).toBe(approved.context)
      expect(mapped.english.message, approved.id).toBe(
        approved.referenceEnglish,
      )
      expect(mapped.english.context ?? null, approved.id).toBe(
        approved.referenceContextEnglish,
      )
    }
  })

  it('conserva la procedencia por tramos: e1-01–06 humana, e1-07–57 asistida, e1-58–65 humana', () => {
    const provenance = (id: string) =>
      APPROVED_CASES.find((c) => c.id === id)!.provenance

    for (let n = 1; n <= 65; n++) {
      const id = `e1-${String(n).padStart(2, '0')}`
      expect(provenance(id), id).toBe(
        n <= 6
          ? 'human_independent'
          : n <= 57
            ? 'ai_proposed_author_reviewed_approved'
            : 'human_author_labeled_before_english_review',
      )
    }
  })

  it('las excepciones están documentadas en el propio fichero aprobado', () => {
    const notes = approvedFile.notes.join('\n')

    expect(notes).toMatch(/e1-06.*exposure/i)
    expect(notes).toMatch(/e1-31.*interpreted \+ hipérbole/)
    expect(JSON.stringify(approvedFile.labelProvenance)).toMatch(
      /e1_06_exposure_exception/,
    )
  })

  it('e1-31 es interpretado, hipérbole y sin persona afectada', () => {
    const labels = APPROVED_CASES.find(({ id }) => id === 'e1-31')!.labels

    expect(labels.expectedStatus).toBe('interpreted')
    expect(labels.safety).toBe('hyperbole')
    expect(labels.affectedType).toBeUndefined()
  })

  it('e1-01 conserva el etiquetado propio de la autora', () => {
    const { labels } = APPROVED_CASES.find(({ id }) => id === 'e1-01')!

    expect(labels.signals).toEqual({
      literal_meaning: 'alta',
      seeking_reassurance: 'indiferente',
      inviting_initiative: 'indiferente',
      requesting_space: 'baja',
      expressing_disappointment: 'indiferente',
      expressing_annoyance: 'indiferente',
      setting_boundary: 'indiferente',
      playful_teasing: 'baja',
      sarcastic_tone: 'indiferente',
      indirect_hint: 'indiferente',
    })
    expect(labels.expectedStatus).toBe('needs_context')
  })

  it('cumplen la cobertura de etiquetas con los recuentos que calculó la autora', () => {
    const cases = APPROVED_CASES.map(({ labels }, i) => ({
      id: `c-${i}`,
      source: 'new',
      message: 'x',
      english: { message: 'x' },
      design: [],
      canary: false,
      labels,
    }))
    const count = (signal: string, label: string) =>
      cases.filter((c) => c.labels.signals[signal as never] === label).length

    expect(checkLabelCoverage(cases)).toEqual({
      status: 'complete',
      unlabeled: 0,
      shortfalls: [],
    })
    // Tabla «Comprobación de cobertura con 65 casos» de e1-human-labels.md.
    expect(
      Object.fromEntries(
        SIGNAL_IDS.map((id) => [id, [count(id, 'alta'), count(id, 'baja')]]),
      ),
    ).toEqual({
      literal_meaning: [48, 12],
      seeking_reassurance: [4, 14],
      inviting_initiative: [4, 12],
      requesting_space: [7, 19],
      expressing_disappointment: [13, 8],
      expressing_annoyance: [12, 14],
      setting_boundary: [8, 15],
      playful_teasing: [4, 44],
      sarcastic_tone: [7, 23],
      indirect_hint: [13, 26],
    })
  })
})

describe('aislamiento de E4', () => {
  it('los cinco expedientes vienen solo del fichero aparte', () => {
    expect(Object.keys(E4_PROFILES)).toEqual([
      'e1-53',
      'e1-54',
      'e1-55',
      'e1-56',
      'e1-57',
    ])
    expect(Object.keys(sidecarFile.profiles)).toEqual(Object.keys(E4_PROFILES))
  })

  it('el fichero de etiquetas de E1 no lleva ningún expediente', () => {
    for (const approved of approvedFile.cases)
      expect(approved).not.toHaveProperty('profile')
  })

  it('cada caso de FIXTURES recibe el expediente del fichero aparte y ningún otro', () => {
    for (const fixture of FIXTURES)
      expect(fixture.profile, fixture.id).toEqual(E4_PROFILES[fixture.id])
  })

  it('los expedientes no cambian las etiquetas: las del caso son las aprobadas', () => {
    for (const id of Object.keys(E4_PROFILES)) {
      const approved = APPROVED_CASES.find((c) => c.id === id)!
      expect(FIXTURES.find((f) => f.id === id)!.labels).toEqual(approved.labels)
    }
  })
})

describe('FIXTURES integra lo aprobado sin copias propias', () => {
  it('trae el texto, el inglés, las etiquetas y la procedencia del importador', () => {
    expect(FIXTURES).toHaveLength(65)
    for (const approved of APPROVED_CASES) {
      const fixture = FIXTURES.find(({ id }) => id === approved.id)!
      expect(fixture.message).toBe(approved.message)
      expect(fixture.context).toBe(approved.context)
      expect(fixture.english).toEqual(approved.english)
      expect(fixture.labels).toEqual(approved.labels)
      expect(fixture.labelProvenance).toBe(approved.provenance)
      expect(fixture.labelException).toBe(approved.exception)
    }
  })
})

describe('razones validadas (rationale)', () => {
  it('solo acompañan a las 51 propuestas asistidas por IA', () => {
    for (const approved of approvedFile.cases) {
      const hasRationale = 'rationale' in approved
      expect(hasRationale, approved.id).toBe(
        approved.labelProvenance === 'ai_proposed_author_reviewed_approved',
      )
    }
  })
})
