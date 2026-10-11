import { describe, expect, it } from 'vitest'
import motionScss from '../styles/tokens/_motion.scss?raw'
import paletteScss from '../styles/tokens/_palette.scss?raw'
import spacingScss from '../styles/tokens/_spacing.scss?raw'
import themesScss from '../styles/tokens/_themes.scss?raw'
import blinkScss from '../styles/sprites/_sofi-blink.scss?raw'
import breakpointsScss from '../styles/utilities/_breakpoints.scss?raw'
import { contrastLevel, contrastRatio } from './contrast'
import {
  BLINK_TIMELINE,
  CONTRAST_PAIRS,
  DURATIONS_MS,
  SEMANTIC_TOKENS,
  SPACE_SCALE,
  THRESHOLDS,
  TONES,
  formatDuration,
} from './foundationsData'
import { rem } from '../utils/rem'

// Declaraciones «--nombre: valor;» de un fragmento de SCSS.
function declarations(source: string): Map<string, string> {
  const result = new Map<string, string>()
  for (const match of source.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    result.set(match[1], match[2].replace(/\s+/g, ' ').trim())
  }
  return result
}

function mixinBlock(source: string, name: string): string {
  const start = source.indexOf(`@mixin ${name} {`)
  if (start < 0) throw new Error(`No existe el mixin ${name}`)
  return source.slice(start, source.indexOf('\n}', start))
}

function colorTokens(theme: 'light' | 'dark'): Map<string, string> {
  const all = declarations(mixinBlock(themesScss, theme))
  return new Map([...all].filter(([name]) => name.startsWith('--color-')))
}

describe('Foundations data', () => {
  it.each(['light', 'dark'] as const)(
    'documents every semantic colour token of the %s theme with its real value',
    (theme) => {
      const real = colorTokens(theme)
      const documented = new Map(
        SEMANTIC_TOKENS.map((token) => [token.name, token[theme]]),
      )
      expect(documented).toEqual(real)
    },
  )

  it('matches the brand palette', () => {
    const real = declarations(paletteScss)
    for (const [key, hex] of Object.entries(TONES)) {
      const name = `--tone-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
      expect(real.get(name), name).toBe(hex)
    }
  })

  it('matches the spacing scale', () => {
    const real = declarations(spacingScss)
    SPACE_SCALE.forEach((value, index) => {
      // La escala se documenta en px (a 16 px por rem) y el código la emite en rem.
      expect(real.get(`--space-${index + 1}`)).toBe(rem(value))
    })
    expect(real.has(`--space-${SPACE_SCALE.length + 1}`)).toBe(false)
  })

  it('matches the structural thresholds', () => {
    for (const [name, value] of Object.entries(THRESHOLDS)) {
      expect(breakpointsScss).toContain(`$${name}: ${value}px;`)
    }
  })

  it('matches the motion durations', () => {
    const real = declarations(motionScss)
    for (const [name, ms] of Object.entries(DURATIONS_MS)) {
      const value = real.get(`--duration-${name}`) ?? ''
      const parsed = value.endsWith('ms')
        ? Number.parseFloat(value)
        : Number.parseFloat(value) * 1000
      expect(parsed, name).toBe(ms)
    }
  })

  it('draws the same blink timeline as the generated sprite partial', () => {
    const body = /\$timeline:\s*\(([^)]*)\)/.exec(blinkScss)?.[1] ?? ''
    const steps = body
      .split(',')
      .map((step) => step.trim())
      .filter(Boolean)
      .map((step) => step.split(/\s+/).map(Number))
    expect(steps).toEqual(BLINK_TIMELINE.map(([frame, ms]) => [frame, ms]))
    expect(BLINK_TIMELINE.reduce((total, [, ms]) => total + ms, 0)).toBe(
      DURATIONS_MS.blink,
    )
  })

  it('only lists text pairs that reach AA, except the one shown as not suitable', () => {
    const levels = CONTRAST_PAIRS.map((pair) =>
      contrastLevel(contrastRatio(pair.foreground, pair.background)),
    )
    expect(levels.slice(0, -1).every((level) => level !== null)).toBe(true)
    expect(levels.at(-1)).toBeNull()
  })

  it('formats durations as they are read in the Lab', () => {
    expect(formatDuration(120)).toBe('120 ms')
    expect(formatDuration(1000)).toBe('1 s')
    expect(formatDuration(4200)).toBe('4,2 s')
    expect(formatDuration(46000)).toBe('46 s')
  })
})
