import { describe, expect, it } from 'vitest'
import {
  contrastLevel,
  contrastRatio,
  formatRatio,
  relativeLuminance,
} from './contrast'

describe('contrast', () => {
  it('uses the WCAG relative luminance of the extremes', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10)
  })

  it('computes the same ratio regardless of the order of the colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10)
    expect(contrastRatio('#100819', '#fff5e8')).toBeCloseTo(
      contrastRatio('#fff5e8', '#100819'),
      10,
    )
  })

  it('matches known ratios of the Ask Sofi palette', () => {
    expect(formatRatio(contrastRatio('#100819', '#fff5e8'))).toBe('18,2:1')
    expect(formatRatio(contrastRatio('#ff5c8d', '#fff5e8'))).toBe('2,7:1')
  })

  it('assigns levels from the exact ratio, not the rounded one', () => {
    expect(contrastLevel(7)).toBe('AAA')
    expect(contrastLevel(6.99)).toBe('AA')
    expect(contrastLevel(4.5)).toBe('AA')
    expect(contrastLevel(4.499)).toBeNull()
  })

  it('formats ratios with one decimal and a decimal comma', () => {
    expect(formatRatio(9.978)).toBe('10,0:1')
    expect(formatRatio(5.336)).toBe('5,3:1')
  })

  it('rejects colours it cannot measure', () => {
    expect(() => relativeLuminance('rgb(0 0 0)')).toThrow()
  })
})
