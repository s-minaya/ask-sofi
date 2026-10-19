import type { DecisionRequest } from '../../../src/domain/analysis/decisionProvider.ts'
import type { Fixture } from '../fixtures/types.ts'

export type Arm = 'english' | 'spanish'

export type PlanConfig = {
  // 'english' es el inglés de referencia (mide a Jev sin el ruido del
  // traductor, decisión 7); 'spanish' es el original.
  arms: Arm[]
  repetitions: number
  // 'none': nunca se envía expediente (E2, E3, E6). 'as-is': solo los casos que
  // lo tienen, con el expediente del caso (E4).
  profile: 'none' | 'as-is'
  only?: 'canary'
}

export type PlanEntry = {
  key: string
  fixtureId: string
  arm: Arm
  repetition: number
  request: DecisionRequest
}

function requestOf(
  fixture: Fixture,
  arm: Arm,
  withProfile: boolean,
): DecisionRequest {
  const source =
    arm === 'english'
      ? fixture.english
      : { message: fixture.message, context: fixture.context }
  const text =
    source.context === undefined
      ? { message: source.message }
      : { message: source.message, context: source.context }

  return {
    assessment: { ...text },
    readings:
      withProfile && fixture.profile !== undefined
        ? { ...text, profile: fixture.profile }
        : { ...text },
  }
}

// Pura: dice qué se enviaría, no envía nada.
export function buildPlan(
  fixtures: readonly Fixture[],
  config: PlanConfig,
): PlanEntry[] {
  const selected = fixtures.filter(
    (fixture) =>
      (config.only !== 'canary' || fixture.canary) &&
      (config.profile === 'none' || fixture.profile !== undefined),
  )

  return selected.flatMap((fixture) =>
    config.arms.flatMap((arm) =>
      Array.from({ length: config.repetitions }, (_, index) => ({
        key: `${fixture.id}|${arm}|${index + 1}`,
        fixtureId: fixture.id,
        arm,
        repetition: index + 1,
        request: requestOf(fixture, arm, config.profile === 'as-is'),
      })),
    ),
  )
}
