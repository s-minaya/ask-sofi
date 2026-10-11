import { describe, expect, it } from 'vitest'
import { formatCharacterCount, formatPercent, NARROW_NBSP } from './format'

describe('formatCharacterCount', () => {
  it('usa el singular solo para un carácter', () => {
    expect(formatCharacterCount(0)).toBe('0 caracteres')
    expect(formatCharacterCount(1)).toBe('1 carácter')
    expect(formatCharacterCount(27)).toBe('27 caracteres')
  })
})

describe('formatPercent', () => {
  it('separa el signo con un espacio fino que no se parte', () => {
    expect(NARROW_NBSP.charCodeAt(0)).toBe(0x202f)
    expect(formatPercent(52)).toBe(`52${NARROW_NBSP}%`)
    expect(formatPercent(8.6)).toBe(`9${NARROW_NBSP}%`)
  })
})
