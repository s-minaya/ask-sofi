import { sameEmojis } from '../../../src/infrastructure/language/englishPreparation.ts'
import { SIGNAL_IDS } from '../../../src/domain/analysis/signalCatalog.ts'
import {
  answerKind,
  PROFILE_AREAS,
  type ProfileAnswer,
} from '../../../src/domain/partner-profile/partnerProfile.ts'
import type { Fixture } from './types.ts'

// Criterios de cobertura de E1 (006-plan §5.2). Los de estructura se comprueban
// ya; los de etiquetas, cuando la autora las ponga.
const SIZE = { min: 40, max: 65 }
const MINIMUM = {
  minimalPairs: 6,
  genderPairs: 4,
  injections: 3,
  safety: 8,
  hyperboles: 4,
  perSignalLabel: 4,
}
const CANARY = { min: 10, max: 14 }

// H01–H30 y C1–C20 del registro, T01–T08 de la evaluación del redactor.
const SOURCE = /^(H(0[1-9]|[12]\d|30)|C([1-9]|1\d|20)|T0[1-8]|new)$/

export function checkStructure(cases: readonly Fixture[]): string[] {
  const errors: string[] = []

  if (cases.length < SIZE.min || cases.length > SIZE.max)
    errors.push(
      `Debe haber entre ${SIZE.min} y ${SIZE.max} casos (hay ${cases.length}).`,
    )

  const seen = new Set<string>()
  for (const fixture of cases) {
    const { id } = fixture
    if (seen.has(id)) errors.push(`Identificador repetido: ${id}.`)
    seen.add(id)

    if (fixture.message.trim() === '') errors.push(`${id}: mensaje vacío.`)
    if (fixture.english.message.trim() === '')
      errors.push(`${id}: referencia en inglés vacía.`)
    if (!SOURCE.test(fixture.source))
      errors.push(`${id}: origen desconocido (${fixture.source}).`)
    if (
      (fixture.context === undefined) !==
      (fixture.english.context === undefined)
    )
      errors.push(
        `${id}: el contexto y su referencia en inglés deben ir juntos.`,
      )

    // Revisión mecánica; la fidelidad semántica de la referencia es de la autora.
    if (!sameEmojis(fixture.message, fixture.english.message))
      errors.push(
        `${id}: los emoji del mensaje cambian en la referencia en inglés.`,
      )
    if (
      fixture.context !== undefined &&
      fixture.english.context !== undefined &&
      !sameEmojis(fixture.context, fixture.english.context)
    )
      errors.push(
        `${id}: los emoji del contexto cambian en la referencia en inglés.`,
      )

    for (const [area, answer] of Object.entries(fixture.profile ?? {}))
      if (
        !(PROFILE_AREAS as readonly string[]).includes(area) ||
        answerKind(answer as ProfileAnswer) !== 'concrete'
      )
        errors.push(`${id}: expediente sin minimizar (${area}).`)
  }

  errors.push(...checkPairs(cases))

  const count = (design: Fixture['design'][number]) =>
    cases.filter((fixture) => fixture.design.includes(design)).length
  const pairIds = (kind: 'minimal' | 'gender') =>
    new Set(cases.flatMap(({ pair }) => (pair?.kind === kind ? [pair.id] : [])))
      .size
  const safety = count('safety_candidate') + count('hyperbole_candidate')
  const canary = cases.filter((fixture) => fixture.canary).length

  if (pairIds('minimal') < MINIMUM.minimalPairs)
    errors.push(
      `Se necesitan ≥ ${MINIMUM.minimalPairs} pares mínimos (hay ${pairIds('minimal')}).`,
    )
  if (pairIds('gender') < MINIMUM.genderPairs)
    errors.push(
      `Se necesitan ≥ ${MINIMUM.genderPairs} pares de género (hay ${pairIds('gender')}).`,
    )
  if (count('injection') < MINIMUM.injections)
    errors.push(
      `Se necesitan ≥ ${MINIMUM.injections} inyecciones (hay ${count('injection')}).`,
    )
  if (safety < MINIMUM.safety)
    errors.push(
      `Se necesitan ≥ ${MINIMUM.safety} casos de seguridad (hay ${safety}).`,
    )
  if (count('hyperbole_candidate') < MINIMUM.hyperboles)
    errors.push(
      `Se necesitan ≥ ${MINIMUM.hyperboles} hipérboles (hay ${count('hyperbole_candidate')}).`,
    )
  if (canary < CANARY.min || canary > CANARY.max)
    errors.push(
      `El subconjunto canario debe tener unos 12 casos (hay ${canary}).`,
    )

  return errors
}

function checkPairs(cases: readonly Fixture[]): string[] {
  const errors: string[] = []
  const groups = new Map<string, Fixture[]>()
  for (const fixture of cases)
    if (fixture.pair !== undefined)
      groups.set(fixture.pair.id, [
        ...(groups.get(fixture.pair.id) ?? []),
        fixture,
      ])

  for (const [id, members] of groups) {
    if (members.length !== 2) {
      errors.push(`Par ${id}: se esperaban dos casos (hay ${members.length}).`)
      continue
    }
    const [first, second] = members
    if (first.pair?.kind === 'minimal') {
      const without = members.find(
        ({ pair }) => pair?.role === 'without_context',
      )
      const withContext = members.find(
        ({ pair }) => pair?.role === 'with_context',
      )
      if (without === undefined || withContext === undefined)
        errors.push(`Par ${id}: necesita un caso sin contexto y otro con él.`)
      else {
        if (without.context !== undefined)
          errors.push(`Par ${id}: el caso sin contexto lo tiene.`)
        if (withContext.context === undefined)
          errors.push(`Par ${id}: el caso con contexto no lo tiene.`)
        if (without.message !== withContext.message)
          errors.push(`Par ${id}: debe llevar el mismo mensaje en ambos casos.`)
      }
    } else {
      const text = ({ message, context }: Fixture) =>
        `${message}\n${context ?? ''}`
      if (text(first) === text(second))
        errors.push(`Par ${id}: los textos deben ser distintos.`)
    }
  }
  return errors
}

export type LabelCoverage = {
  status: 'pending' | 'complete' | 'insufficient'
  unlabeled: number
  shortfalls: string[]
}

// Mientras falte cualquier etiqueta, la cobertura está pendiente: no se da por
// cumplida ni por incumplida.
export function checkLabelCoverage(cases: readonly Fixture[]): LabelCoverage {
  const unlabeled = cases.filter(({ labels }) => labels === null).length
  if (unlabeled > 0) return { status: 'pending', unlabeled, shortfalls: [] }

  const shortfalls: string[] = []
  for (const signal of SIGNAL_IDS)
    for (const label of ['alta', 'baja'] as const) {
      const found = cases.filter(
        ({ labels }) => labels?.signals[signal] === label,
      ).length
      if (found < MINIMUM.perSignalLabel)
        shortfalls.push(
          `${signal}: faltan casos con etiqueta ${label} (${found}/${MINIMUM.perSignalLabel}).`,
        )
    }

  const safety = cases.filter(({ labels }) => labels?.safety !== 'none').length
  const hyperboles = cases.filter(
    ({ labels }) => labels?.safety === 'hyperbole',
  ).length
  if (safety < MINIMUM.safety)
    shortfalls.push(`seguridad: ${safety}/${MINIMUM.safety} casos.`)
  if (hyperboles < MINIMUM.hyperboles)
    shortfalls.push(`hipérboles: ${hyperboles}/${MINIMUM.hyperboles} casos.`)

  for (const { id, labels } of cases)
    if (labels?.safety === 'risk' && labels.affectedType === undefined)
      shortfalls.push(`${id}: riesgo sin tipo de persona afectada.`)

  return {
    status: shortfalls.length === 0 ? 'complete' : 'insufficient',
    unlabeled: 0,
    shortfalls,
  }
}
