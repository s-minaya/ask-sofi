import { beforeAll, describe, expect, it } from 'vitest'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'
import { SOFI_REGISTRY } from '../components/sofi/visual/registry'
import { SOFI_ANIMATION_IDS } from '../components/sofi/visual/types'
import {
  PLAYBACK_NAMES,
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  RESOURCE_INFO,
  availability,
  formatRate,
  hasSpeedControl,
  isGag,
  provideLabOnlyLoaders,
} from './spriteInspector'

// Catálogo §3: 001–006 y 008–015; el 007 sigue reservado y no se reasigna.
const CATALOG_NUMBERS: Record<(typeof SOFI_ANIMATION_IDS)[number], string> = {
  'sofi-blink': '001',
  sofing: '002',
  rolling: '003',
  talking: '004',
  favoriting: '005',
  poking: '006',
  'are-u-still-here': '008',
  'i-see-you': '009',
  'needs-context': '010',
  error: '011',
  eureka: '012',
  suspicious: '013',
  uncertain: '014',
  'memory-wipe': '015',
}

describe('ficha de cada recurso', () => {
  it('describe los 14 recursos con el número del catálogo', () => {
    expect(Object.keys(RESOURCE_INFO).sort()).toEqual(
      [...SOFI_ANIMATION_IDS].sort(),
    )
    for (const id of SOFI_ANIMATION_IDS) {
      expect(RESOURCE_INFO[id].number).toBe(CATALOG_NUMBERS[id])
      expect(RESOURCE_INFO[id].intent.trim()).not.toBe('')
      expect(RESOURCE_INFO[id].activation.trim()).not.toBe('')
    }
    expect(Object.values(CATALOG_NUMBERS)).not.toContain('007')
  })

  it('nombra los tres tipos de reproducción del registro', () => {
    for (const id of SOFI_ANIMATION_IDS)
      expect(PLAYBACK_NAMES[SOFI_REGISTRY[id].playback]).toBeTruthy()
    expect(Object.keys(PLAYBACK_NAMES).sort()).toEqual([
      'loop',
      'machine',
      'once',
    ])
  })

  it('el umbral de inactividad que cuenta la ficha es el del adaptador', () => {
    expect(RESOURCE_INFO['are-u-still-here'].activation).toContain(
      String(STILL_HERE_IDLE_MS / 1000),
    )
  })

  it('dice la disponibilidad a partir del registro, sin copiarla', () => {
    expect(availability('sofi-blink')).toMatch(/estática/i)
    for (const id of ['eureka', 'suspicious'] as const)
      expect(availability(id)).toMatch(/solo en el lab/i)
    for (const id of SOFI_ANIMATION_IDS.filter((id) => SOFI_REGISTRY[id].load))
      expect(availability(id)).toMatch(/cargador de producción/i)
  })

  it('reconoce como gags exactamente las máquinas del registro', () => {
    expect(SOFI_ANIMATION_IDS.filter(isGag).sort()).toEqual(
      SOFI_ANIMATION_IDS.filter(
        (id) => SOFI_REGISTRY[id].playback === 'machine',
      ).sort(),
    )
  })
})

describe('velocidad del inspector', () => {
  it('va de 0,25× a 4× en pasos de 0,25×', () => {
    expect([RATE_MIN, RATE_MAX, RATE_STEP]).toEqual([0.25, 4, 0.25])
  })

  it('escribe el factor con coma decimal', () => {
    expect(formatRate(0.25)).toBe('0,25×')
    expect(formatRate(1)).toBe('1×')
    expect(formatRate(1.75)).toBe('1,75×')
    expect(formatRate(4)).toBe('4×')
  })
})

describe('velocidad de poking', () => {
  it('poking conserva su velocidad original: es el único recurso sin control de velocidad', () => {
    const without = SOFI_ANIMATION_IDS.filter((id) => !hasSpeedControl(id))
    expect(without).toEqual(['poking'])
  })
})

describe('recursos solo del Lab', () => {
  beforeAll(() => {
    provideLabOnlyLoaders()
    provideLabOnlyLoaders()
  })

  it('eureka y suspicious reciben un cargador con su clase y sus tiras', async () => {
    for (const id of ['eureka', 'suspicious'] as const) {
      const owner = await SOFI_REGISTRY[id].load?.()
      expect(owner?.className).toBeTruthy()
      expect(Object.keys(owner?.strips ?? {})).not.toHaveLength(0)
      for (const path of Object.keys(owner?.strips ?? {}))
        expect(path).toContain(`/sprites/${id}`)
    }
  })

  it('no cambia ningún otro recurso ni la estática', () => {
    expect(SOFI_REGISTRY['sofi-blink'].load).toBeUndefined()
    for (const id of SOFI_ANIMATION_IDS.filter(
      (id) => id !== 'eureka' && id !== 'suspicious' && id !== 'sofi-blink',
    ))
      expect(SOFI_REGISTRY[id].load).toBeTypeOf('function')
  })
})
