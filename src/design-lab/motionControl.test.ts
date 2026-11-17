import { describe, expect, it } from 'vitest'
import { MOTION_PREFERENCES } from '../infrastructure/storage/preferencesStorage'
import {
  effectiveMotionLabel,
  MOTION_CONTROL_DEFAULT,
  MOTION_CONTROL_OPTIONS,
  WHY_FULL_LINK,
  WHY_FULL_TEXT,
} from './motionControl'

// T071: datos del prototipo del control de movimiento. Nada de esto escribe preferencias.

describe('MOTION_CONTROL_OPTIONS', () => {
  it('ofrece los tres valores de la preferencia en el orden aprobado: Reducido, Completo, Sistema', () => {
    expect(MOTION_CONTROL_OPTIONS.map((o) => o.value).sort()).toEqual(
      [...MOTION_PREFERENCES].sort(),
    )
    expect(MOTION_CONTROL_OPTIONS.map((o) => o.label)).toEqual([
      'Reducido',
      'Completo',
      'Sistema',
    ])
  })

  it('son solo etiquetas: ninguna opción lleva icono', () => {
    for (const option of MOTION_CONTROL_OPTIONS)
      expect(Object.keys(option).sort()).toEqual(['label', 'value'])
  })

  it('el valor predeterminado sigue al sistema', () => {
    expect(MOTION_CONTROL_DEFAULT).toBe('system')
  })

  it('la explicación es la aprobada, palabra por palabra', () => {
    expect(WHY_FULL_LINK).toBe('¿Por qué Completo?')
    expect(WHY_FULL_TEXT).toEqual([
      'La experiencia visual de Ask Sofi se disfruta mejor con todas las animaciones activadas.',
      '“Completo” reproduce todas las animaciones, incluso cuando tu dispositivo tiene activada la reducción de movimiento.',
    ])
  })
})

describe('effectiveMotionLabel', () => {
  it('dice quién manda: la elección o el sistema', () => {
    expect(effectiveMotionLabel('system', false)).toBe(
      'Completo, por el sistema',
    )
    expect(effectiveMotionLabel('system', true)).toBe(
      'Reducido, por el sistema',
    )
    expect(effectiveMotionLabel('reduce', false)).toBe('Reducido, por elección')
    expect(effectiveMotionLabel('full', true)).toBe('Completo, por elección')
  })
})
