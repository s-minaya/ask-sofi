import { describe, expect, it } from 'vitest'
import { SOFI_REGISTRY } from '../components/sofi/visual/registry'
import { SOFI_ANIMATION_IDS } from '../components/sofi/visual/types'
import {
  framesOfStrip,
  mainStripOf,
  PROPOSABLE,
  REDUCED_POSES,
} from './reducedPoses'

// T069: la comparación de poses reducidas cubre los 14 recursos y respeta lo ya fijado.

describe('REDUCED_POSES', () => {
  it('describe los 14 recursos del catálogo', () => {
    expect(Object.keys(REDUCED_POSES).sort()).toEqual(
      [...SOFI_ANIMATION_IDS].sort(),
    )
  })

  it('los tres gags (máquinas del registro) constan con su versión reducida aprobada', () => {
    for (const id of SOFI_ANIMATION_IDS) {
      expect(REDUCED_POSES[id].status === 'gag', id).toBe(
        SOFI_REGISTRY[id].playback === 'machine',
      )
    }
  })

  it('memory-wipe es la única fijada por el catálogo (ficha 015)', () => {
    const fixed = SOFI_ANIMATION_IDS.filter(
      (id) => REDUCED_POSES[id].status === 'catalog',
    )
    expect(fixed).toEqual(['memory-wipe'])
  })

  it('solo se proponen poses de recursos que aún usan la del parcial (D-2)', () => {
    expect(PROPOSABLE).toHaveLength(10)
    for (const id of PROPOSABLE) {
      expect(SOFI_REGISTRY[id].reducedPose, id).toBe('partial')
    }
  })
})

describe('framesOfStrip', () => {
  it('cuenta los fotogramas cuadrados de una tira', () => {
    expect(framesOfStrip(384 * 6, 384)).toBe(6)
    expect(framesOfStrip(384, 384)).toBe(1)
  })

  it('no inventa un número si la imagen no es una tira de cuadrados', () => {
    expect(framesOfStrip(500, 384)).toBeNull()
    expect(framesOfStrip(0, 384)).toBeNull()
    expect(framesOfStrip(384, 0)).toBeNull()
  })
})

describe('mainStripOf', () => {
  it('elige la tira principal entre las de su módulo dueño', () => {
    const strips = {
      '/src/styles/sprites/error.webp': '/a.webp',
      '/src/styles/sprites/error-face.webp': '/b.webp',
    }
    expect(mainStripOf('error', strips)).toBe('/a.webp')
    expect(mainStripOf('eureka', strips)).toBeUndefined()
  })
})
