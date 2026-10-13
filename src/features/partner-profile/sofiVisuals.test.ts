import { describe, expect, it } from 'vitest'
import guideSource from './sofiGuide.ts?raw'
import { SOFI_MOODS } from './sofiGuide'
import { SOFI_VISUALS, visualFor } from './sofiVisuals'

const imageName = (mood: (typeof SOFI_MOODS)[number]) => {
  const visual = SOFI_VISUALS[mood]
  return visual.kind === 'image'
    ? visual.src.split('/').pop()?.replace(/\..*$/, '')
    : `sprite:${visual.frame}`
}

describe('sofiVisuals', () => {
  it('todos los estados de Sofi tienen representación visual', () => {
    expect(Object.keys(SOFI_VISUALS).sort()).toEqual([...SOFI_MOODS].sort())
  })

  // Correspondencia provisional aprobada (004-plan §6).
  it('usa los placeholders aprobados para cada estado', () => {
    expect(
      Object.fromEntries(SOFI_MOODS.map((m) => [m, imageName(m)])),
    ).toEqual({
      inviting: 'sofi-peek',
      asking: 'sprite:blink',
      waiting: 'sprite:blink',
      acknowledging: 'sofi-smug',
      uncertain: 'sofi-thinking',
      saved: 'sofi-approved',
      validationError: 'sofi-surprised',
      deleting: 'sofi-thinking',
      deleted: 'sofi-neutral',
    })
  })

  it('cada imagen tiene un fotograma del parpadeo como alternativa', () => {
    for (const mood of SOFI_MOODS) {
      const visual = SOFI_VISUALS[mood]
      if (visual.kind === 'image')
        expect(['blink', 0, 1, 2]).toContain(visual.fallback)
    }
    expect(SOFI_VISUALS.uncertain).toMatchObject({ fallback: 1 })
    expect(SOFI_VISUALS.validationError).toMatchObject({ fallback: 2 })
  })

  it('Sofi asomándose indica dónde va el borde real de la interfaz', () => {
    expect(SOFI_VISUALS.inviting).toMatchObject({ kind: 'image', ledge: 0.875 })
  })

  describe('visualFor', () => {
    it('sin restricciones devuelve el placeholder del estado', () => {
      expect(visualFor('saved', { reducedMotion: false })).toBe(
        SOFI_VISUALS.saved,
      )
    })

    it('con movimiento reducido ningún estado se anima', () => {
      for (const mood of SOFI_MOODS) {
        const visual = visualFor(mood, { reducedMotion: true })
        if (visual.kind === 'sprite') expect(visual.frame).not.toBe('blink')
        else expect(visual.fallback).not.toBe('blink')
      }
    })
  })

  // Sustituir un placeholder no puede obligar a tocar la lógica del cuestionario.
  it('la lógica de estados no conoce ningún archivo multimedia', () => {
    expect(guideSource).not.toMatch(
      /from\s+['"][^'"]*(assets|sprites|\.webp|\.png)/,
    )
  })
})
