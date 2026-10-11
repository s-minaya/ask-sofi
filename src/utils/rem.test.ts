import { describe, expect, it } from 'vitest'
import { rem } from './rem'

describe('rem', () => {
  it('converts design pixels to rem on a 16 px base', () => {
    expect(rem(16)).toBe('1rem')
    expect(rem(24)).toBe('1.5rem')
    expect(rem(11)).toBe('0.6875rem')
    expect(rem(0)).toBe('0rem')
  })
})
