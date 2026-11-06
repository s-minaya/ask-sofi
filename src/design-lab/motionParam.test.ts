import { describe, expect, it } from 'vitest'
import { MOTION_PREFERENCES } from '../infrastructure/storage/preferencesStorage'
import { motionFromParam } from './motionParam'

// El selector global del Lab pasa su valor a los marcos (Preview y Perfil) por la URL o por
// mensaje. Sin esta lectura, `full` se perdía en silencio y los marcos volvían a `system`.
describe('motionFromParam', () => {
  it.each(MOTION_PREFERENCES)('conserva «%s»', (value) => {
    expect(motionFromParam(value)).toBe(value)
  })

  it.each([null, '', 'FULL', 'fast', 'reduced', ' reduce'])(
    'cae en «system» con un valor que no es una preferencia (%j)',
    (value) => {
      expect(motionFromParam(value)).toBe('system')
    },
  )
})
