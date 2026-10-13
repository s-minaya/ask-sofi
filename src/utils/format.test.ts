import { describe, expect, it } from 'vitest'
import {
  formatCharacterCount,
  formatCharacterLimit,
  formatPercent,
  NARROW_NBSP,
} from './format'

describe('formatCharacterCount', () => {
  it('usa el singular solo para un carácter', () => {
    expect(formatCharacterCount(0)).toBe('0 caracteres')
    expect(formatCharacterCount(1)).toBe('1 carácter')
    expect(formatCharacterCount(27)).toBe('27 caracteres')
  })
})

describe('formatCharacterLimit', () => {
  it('dice cuántos caracteres van de los permitidos', () => {
    expect(formatCharacterLimit(0, 500)).toBe('0 de 500 caracteres')
    expect(formatCharacterLimit(1, 500)).toBe('1 de 500 caracteres')
    expect(formatCharacterLimit(512, 500)).toBe('512 de 500 caracteres')
  })
})

describe('formatPercent', () => {
  it('separa el signo con un espacio fino que no se parte', () => {
    expect(NARROW_NBSP.charCodeAt(0)).toBe(0x202f)
    expect(formatPercent(52)).toBe(`52${NARROW_NBSP}%`)
    expect(formatPercent(8.6)).toBe(`9${NARROW_NBSP}%`)
  })
})
