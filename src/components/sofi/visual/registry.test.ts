import postcss, {
  type AtRule,
  type Container,
  type Declaration,
  type Document,
  type Rule,
} from 'postcss'
import * as sass from 'sass'
import { describe, expect, it } from 'vitest'
import { SOFI_REGISTRY, SOFI_STATICS } from './registry'
import { SOFI_ANIMATION_IDS, type SofiAnimationId } from './types'

// Integridad del registro (plan 008 §10, punto 5): la tabla de recursos de la capa visual
// contrastada con el catálogo y con los parciales de los ZIP, que son la fuente de verdad.
const SPRITES = '/src/styles/sprites/'

// Catálogo §3, «Reproducción funcional».
const CATALOG_PLAYBACK: Record<SofiAnimationId, 'loop' | 'once' | 'machine'> = {
  'sofi-blink': 'loop',
  sofing: 'loop',
  rolling: 'loop',
  talking: 'loop',
  favoriting: 'once',
  poking: 'machine',
  'are-u-still-here': 'machine',
  'i-see-you': 'machine',
  'needs-context': 'once',
  error: 'once',
  eureka: 'once',
  suspicious: 'once',
  uncertain: 'once',
  'memory-wipe': 'once',
}

const partialSources = import.meta.glob<string>('/src/styles/sprites/_*.scss', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const stripFiles = Object.keys(
  import.meta.glob('/src/styles/sprites/*.webp', {
    query: '?url',
    import: 'default',
  }),
).map((path) => path.slice(SPRITES.length))
const staticFiles = Object.keys(
  import.meta.glob('/src/assets/sofi/*.webp', {
    query: '?url',
    import: 'default',
  }),
).map((path) => path.split('/').pop())
const clientSources = Object.entries(
  import.meta.glob<string>('/src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)
  // Los .d.ts no devuelven su texto con ?raw.
  .filter(
    ([path, source]) => typeof source === 'string' && !path.endsWith('.d.ts'),
  )
const registrySource = clientSources.find(
  ([path]) => path === '/src/components/sofi/visual/registry.ts',
)?.[1]

const compiled = (id: SofiAnimationId) =>
  postcss.parse(sass.compile(`src/styles/sprites/_${id}.scss`).css)

const motion = (
  node: Rule | Declaration,
): 'reduce' | 'no-preference' | undefined => {
  let parent: Container | Document | undefined = node.parent
  for (; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as AtRule).name === 'media') {
      const params = (parent as AtRule).params.replace(/\s+/g, ' ')
      if (params.includes('no-preference')) return 'no-preference'
      if (params.includes('reduce')) return 'reduce'
    }
  }
  return undefined
}

const ids = [...SOFI_ANIMATION_IDS]

describe('registro de recursos visuales', () => {
  it('describe los 14 recursos del catálogo con su tipo de reproducción', () => {
    expect(Object.keys(SOFI_REGISTRY).sort()).toEqual(
      [...SOFI_ANIMATION_IDS].sort(),
    )
    expect(
      Object.fromEntries(ids.map((id) => [id, SOFI_REGISTRY[id].playback])),
    ).toEqual(CATALOG_PLAYBACK)
  })

  it('las entradas no llevan duraciones: la línea de tiempo es solo del parcial', () => {
    const allowed = [
      'load',
      'maskStrips',
      'playback',
      'reducedPose',
      'singlePassClass',
    ]
    for (const id of ids) {
      expect(Object.keys(SOFI_REGISTRY[id]).sort()).toEqual(
        expect.arrayContaining(['maskStrips', 'playback', 'reducedPose']),
      )
      for (const key of Object.keys(SOFI_REGISTRY[id]))
        expect(allowed).toContain(key)
    }
  })

  describe.each(ids)('%s', (id) => {
    const entry = SOFI_REGISTRY[id]
    const partial = partialSources[`${SPRITES}_${id}.scss`]

    it('su tira principal existe en src/styles/sprites/', () => {
      expect(stripFiles).toContain(`${id}.webp`)
    })

    it('su pose reducida es la del parcial, o un fotograma existente de otro recurso', () => {
      const pose = entry.reducedPose
      if (pose === 'partial') {
        const root = compiled(id)
        const animated: Rule[] = []
        root.walkRules((rule) => {
          if (
            rule.selector !== `.${id}` &&
            !rule.selector.startsWith(`.${id}.`)
          )
            return
          rule.walkDecls(/^animation(-name)?$/, (decl) => {
            if (decl.parent === rule && decl.value !== 'none')
              animated.push(rule)
          })
        })
        if (entry.playback === 'machine') {
          // Los gags solo se mueven bajo `no-preference`: con movimiento reducido no hay nada que mover.
          root.walkDecls(/^animation(-name)?$/, (decl) => {
            if (decl.value !== 'none')
              expect(
                motion(decl),
                `${id}: ${decl.parent && 'selector' in decl.parent ? String(decl.parent.selector) : ''}`,
              ).toBe('no-preference')
          })
        } else {
          // El recurso con animación base la anula bajo `reduce`: queda una pose fija propia.
          expect(animated.length).toBeGreaterThan(0)
          let cancelled = false
          root.walkRules(`.${id}`, (rule) => {
            if (motion(rule) !== 'reduce') return
            rule.walkDecls('animation', (decl) => {
              if (decl.value === 'none') cancelled = true
            })
          })
          expect(cancelled, `${id} no anula su animación con reduce`).toBe(true)
        }
      } else {
        expect(ids).toContain(pose.resource)
        const frames = [
          ...partialSources[`${SPRITES}_${pose.resource}.scss`].matchAll(
            /\$frames:\s*(\d+)/g,
          ),
        ].map((match) => Number(match[1]))
        expect(Number.isInteger(pose.frame)).toBe(true)
        expect(pose.frame).toBeGreaterThanOrEqual(0)
        expect(pose.frame).toBeLessThan(Math.max(...frames))
      }
    })

    it('marca la pasada única solo cuando el parcial la pide con animation-iteration-count: 1', () => {
      const asksForIt =
        /Para una sola pasada[\s\S]{0,100}?animation-iteration-count: 1/.test(
          partial,
        )
      expect(entry.singlePassClass === true, `${id}`).toBe(asksForIt)
      if (entry.playback === 'once' && !asksForIt) {
        // Ya llega como una sola pasada.
        expect(partial).toMatch(/Una sola pasada:/)
      }
      if (entry.singlePassClass) expect(entry.playback).toBe('once')
    })

    it('declara como máscara exactamente las tiras que el parcial usa con mask', () => {
      const masks = new Set<string>()
      compiled(id).walkDecls(/^(-webkit-)?mask(-image)?$/, (decl) => {
        for (const match of decl.value.matchAll(
          /url\(\s*["']?([^"')]+)["']?\s*\)/g,
        ))
          masks.add(match[1])
      })
      expect([...entry.maskStrips].sort()).toEqual([...masks].sort())
      for (const strip of entry.maskStrips) expect(stripFiles).toContain(strip)
    })
  })

  it('hoy la única tira de máscara es memory-wipe-dissolve', () => {
    const declared = ids.flatMap((id) => [...SOFI_REGISTRY[id].maskStrips])
    expect(declared).toEqual(['memory-wipe-dissolve.webp'])
  })

  describe('cargadores de los módulos dueños', () => {
    const withLoader = ids.filter((id) => SOFI_REGISTRY[id].load)

    it('eureka y suspicious no tienen cargador de producción y nadie más se queda sin él, salvo la estática', () => {
      expect(ids.filter((id) => !SOFI_REGISTRY[id].load).sort()).toEqual([
        'eureka',
        'sofi-blink',
        'suspicious',
      ])
      // Ni siquiera como `import()` sin usar: el bundler emitiría sus tiras (E12).
      expect(registrySource).toBeDefined()
      expect(registrySource).not.toMatch(/sprites\/(eureka|suspicious)\b/)
    })

    // Plan §7: `sofi-blink` es estática y su módulo ya está en la entrada (`SofiSprite` lo
    // importa como respaldo). Un `import()` suyo no movería nada a otro chunk y Vite lo avisa.
    it('sofi-blink es estática: su módulo no se importa de forma diferida', () => {
      expect(SOFI_REGISTRY['sofi-blink'].load).toBeUndefined()
      expect(registrySource).not.toMatch(/sprites\/sofi-blink\b/)
    })

    it.each(withLoader)(
      '%s carga su módulo dueño con su clase y exactamente sus tiras',
      async (id) => {
        const owner = await SOFI_REGISTRY[id].load?.()
        const expected = stripFiles.filter(
          (file) => file === `${id}.webp` || file.startsWith(`${id}-`),
        )
        expect(Object.keys(owner?.strips ?? {}).sort()).toEqual(
          expected.map((file) => `${SPRITES}${file}`).sort(),
        )
      },
    )
  })
})

describe('catálogo de estáticas (004-plan §6)', () => {
  it('reúne las seis estáticas aprobadas de src/assets/sofi/', () => {
    expect(Object.keys(SOFI_STATICS).sort()).toEqual(
      staticFiles.map((file) => file?.replace('.webp', '')).sort(),
    )
    for (const url of Object.values(SOFI_STATICS))
      expect(typeof url).toBe('string')
  })

  it('es el único sitio con rutas de imágenes de Sofi', () => {
    const offenders = clientSources
      .filter(([path]) => path !== '/src/components/sofi/visual/registry.ts')
      .filter(([, source]) =>
        /from\s+['"][^'"]*assets\/sofi\/[^'"]*\.webp['"]/.test(source),
      )
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })
})
