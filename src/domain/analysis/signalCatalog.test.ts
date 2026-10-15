import { describe, expect, it } from 'vitest'
import plan from '../../../spec/features/005-analysis-domain/005-plan.md?raw'
import {
  AFFECTED_PERSON_TYPES,
  SIGNAL_CATALOG,
  SIGNAL_IDS,
  SUFFICIENCY_LEVELS,
  TAXONOMY_VERSION,
} from './signalCatalog'

describe('catálogo de señales v1', () => {
  it('tiene las diez señales provisionales, con IDs estables', () => {
    expect(SIGNAL_IDS).toEqual([
      'literal_meaning',
      'seeking_reassurance',
      'inviting_initiative',
      'requesting_space',
      'expressing_disappointment',
      'expressing_annoyance',
      'setting_boundary',
      'playful_teasing',
      'sarcastic_tone',
      'indirect_hint',
    ])
    expect(new Set(SIGNAL_IDS).size).toBe(10)
  })

  it('distingue lecturas de pistas', () => {
    const kinds = Object.fromEntries(
      SIGNAL_CATALOG.map(({ id, kind }) => [id, kind]),
    )

    expect(kinds).toEqual({
      literal_meaning: 'reading',
      seeking_reassurance: 'reading',
      inviting_initiative: 'reading',
      requesting_space: 'reading',
      expressing_disappointment: 'reading',
      expressing_annoyance: 'reading',
      setting_boundary: 'reading',
      playful_teasing: 'cue',
      sarcastic_tone: 'cue',
      indirect_hint: 'cue',
    })
  })

  it('cada señal tiene una definición neutral de trabajo', () => {
    for (const { definition } of SIGNAL_CATALOG)
      expect(definition.trim().length).toBeGreaterThan(0)
  })

  // La fuente normativa es el plan: si cambia una definición hay que cambiarla en los dos sitios.
  it('las definiciones coinciden con las del plan', () => {
    for (const { id, kind, definition } of SIGNAL_CATALOG) {
      expect(plan).toContain(`| \`${id}\` | \`${kind}\` | ${definition} |`)
    }
  })

  it('no hay señales de suficiencia ni de seguridad: son evaluaciones auxiliares', () => {
    const ids: readonly string[] = SIGNAL_IDS
    for (const forbidden of [
      'insufficient_context',
      'unclear',
      'safety',
      'sufficiency',
    ])
      expect(ids).not.toContain(forbidden)
  })

  it('tiene versión de taxonomía', () => {
    expect(TAXONOMY_VERSION).toBe(1)
  })
})

describe('vocabulario auxiliar', () => {
  it('la suficiencia tiene tres niveles', () => {
    expect(SUFFICIENCY_LEVELS).toEqual([
      'insufficient',
      'partial',
      'sufficient',
    ])
  })

  it('el riesgo admite persona afectada no determinada', () => {
    expect(AFFECTED_PERSON_TYPES).toEqual([
      'user_at_risk_from_other',
      'other_at_risk_of_self_harm',
      'user_at_risk_of_self_harm',
      'undetermined',
    ])
  })
})
