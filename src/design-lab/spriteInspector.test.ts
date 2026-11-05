import { beforeAll, describe, expect, it } from 'vitest'
import { STILL_HERE_IDLE_MS } from '../components/sofi/useSofiController'
import { SOFI_REGISTRY } from '../components/sofi/visual/registry'
import { SOFI_ANIMATION_IDS } from '../components/sofi/visual/types'
import {
  BACKGROUND_DEFAULT,
  BACKGROUND_OPTIONS,
  CONTAINER_OPTIONS,
  PLAYBACK_NAMES,
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  RESOURCE_INFO,
  SIZE_DEFAULT,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  WIDTH_OPTIONS,
  availability,
  containerBox,
  formatRate,
  formatSize,
  hasSpeedControl,
  isGag,
  provideLabOnlyLoaders,
  stageBackground,
  stageMaxWidth,
  stripsOf,
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

describe('tamaño del inspector', () => {
  it('parte de 192 px y va de 64 a 512 px en pasos de 8 px', () => {
    expect([SIZE_DEFAULT, SIZE_MIN, SIZE_MAX, SIZE_STEP]).toEqual([
      192, 64, 512, 8,
    ])
    // El valor de partida cae en una marca del control.
    expect((SIZE_DEFAULT - SIZE_MIN) % SIZE_STEP).toBe(0)
  })

  it('escribe el tamaño en píxeles', () => {
    expect(formatSize(192)).toBe('192 px')
    expect(formatSize(64)).toBe('64 px')
  })
})

describe('fondos del escenario', () => {
  it('son los tres que ya tiene LabStage y se traducen a sus propiedades', () => {
    expect(BACKGROUND_OPTIONS.map((option) => option.value)).toEqual([
      'base',
      'plain',
      'dots',
    ])
    expect(stageBackground('base')).toEqual({ plain: false, dots: false })
    expect(stageBackground('plain')).toEqual({ plain: true, dots: false })
    expect(stageBackground('dots')).toEqual({ plain: false, dots: true })
  })

  it('parte de los puntos, el fondo del Lab para ver a Sofi', () => {
    expect(BACKGROUND_DEFAULT).toBe('dots')
  })
})

describe('contenedores representativos', () => {
  it('son el escenario entero, el busto apoyado en el borde y la insignia', () => {
    expect(CONTAINER_OPTIONS.map((option) => option.value)).toEqual([
      'stage',
      'box',
      'badge',
    ])
  })

  it('el escenario entero no recorta nada', () => {
    expect(containerBox('stage', 192)).toBeNull()
  })

  it('el busto apoyado y la insignia son los recortes aprobados a 192 px', () => {
    // Pantalla de error (README de dirección artística, decisión 6) y ficha de la insignia.
    expect(containerBox('box', 192)).toEqual({
      width: 155,
      height: 190,
      offsetX: 20,
      offsetY: 7,
      background: 'var(--tone-white)',
    })
    expect(containerBox('badge', 192)).toEqual({
      width: 96,
      height: 96,
      offsetX: 50,
      offsetY: 36,
      background: 'var(--tone-pink-soft)',
    })
  })

  it('el recorte escala con el tamaño del sprite para conservar la composición', () => {
    expect(containerBox('box', 96)).toMatchObject({
      width: 78,
      height: 95,
      offsetX: 10,
      offsetY: 4,
    })
    expect(containerBox('badge', 384)).toMatchObject({
      width: 192,
      height: 192,
      offsetX: 100,
      offsetY: 72,
    })
  })
})

describe('ancho del escenario', () => {
  it('ofrece el completo y el estrecho de móvil que ya usa el Lab (320 px)', () => {
    expect(WIDTH_OPTIONS.map((option) => option.value)).toEqual([
      'full',
      'narrow',
    ])
    expect(stageMaxWidth('full')).toBeUndefined()
    expect(stageMaxWidth('narrow')).toBe('320px')
  })
})

describe('tiras de cada recurso', () => {
  beforeAll(() => {
    provideLabOnlyLoaders()
  })

  it.each(SOFI_ANIMATION_IDS)(
    '%s: sus tiras son las de su módulo dueño',
    async (id) => {
      const strips = await stripsOf(id)
      const paths = Object.keys(strips)

      expect(paths.length).toBeGreaterThan(0)
      for (const path of paths) {
        expect(path).toMatch(new RegExp(`/sprites/${id}(-[^/]+)?\\.webp$`))
        expect(strips[path]).toBeTruthy()
      }
    },
  )

  it('para medirlas no se carga ningún módulo que no estuviera ya', async () => {
    // El estático viaja en la entrada: no pasa por ningún cargador.
    expect(SOFI_REGISTRY['sofi-blink'].load).toBeUndefined()
    expect(Object.keys(await stripsOf('sofi-blink'))).not.toHaveLength(0)
  })
})
