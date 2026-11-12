import postcss, { type Declaration, type Rule } from 'postcss'
import * as sass from 'sass'
import { describe, expect, it } from 'vitest'
import { WIDE_EDGE_PERCENT } from './gagWide'

// T066 · decisión de la autora: los gags solo responden a toques sobre las partes visibles de Sofi
// (incluidas cabeza y manos cuando sobresalgan); las zonas transparentes no son interactivas. La
// zona sensible es CSS: se comprueba sobre el CSS compilado de cada módulo (la insignia móvil, 4.7,
// y el retrato grande, 4.8), y en navegador con los barridos de 008-verification §26 y §27. Aquí,
// lo que no debe romperse sin que salte: dónde vive cada regla y que ningún recorte toca lo pintado.

function load(file: string) {
  const css = sass.compile(file, { loadPaths: ['src/styles'] }).css
  const rules: Rule[] = []
  postcss.parse(css).walkRules((rule) => {
    rules.push(rule)
  })
  // Los módulos de CSS renombran las clases solo en la build; aquí el selector es `.host`.
  const declsOf = (selector: string) =>
    rules
      .filter((rule) => rule.selectors.includes(selector))
      .flatMap((rule) =>
        rule.nodes.filter((n): n is Declaration => n.type === 'decl'),
      )
  const valueIn = (selector: string, prop: string) =>
    declsOf(selector)
      .filter((decl) => decl.prop === prop)
      .at(-1)
  const pathClips = rules.flatMap((rule) =>
    rule.nodes
      .filter(
        (n): n is Declaration =>
          n.type === 'decl' &&
          n.prop === 'clip-path' &&
          n.value.startsWith('path('),
      )
      .map((decl) => ({ rule, decl })),
  )
  return { rules, valueIn, pathClips }
}

const badge = load('src/design-lab/sections/GagsSpec.module.scss')
const wide = load('src/design-lab/sections/GagsWideSpec.module.scss')
const profile = load('src/design-lab/profile/GagsProfile.module.scss')

const MODULES = [
  ['la insignia móvil (4.7)', badge],
  ['el retrato grande (4.8)', wide],
  ['el retrato del cuestionario (4.9)', profile],
] as const

describe.each(MODULES)('zona sensible de %s (CSS compilado)', (_, css) => {
  const { rules, valueIn, pathClips } = css

  it('el anfitrión, por sí mismo, no responde a nada', () => {
    expect(valueIn('.host', 'pointer-events')?.value).toBe('none')
  })

  it('su ::after es la zona sensible: activa, sin contenido y recortada con la silueta', () => {
    expect(valueIn('.host::after', 'pointer-events')?.value).toBe('auto')
    expect(valueIn('.host::after', 'position')?.value).toBe('absolute')
    expect(valueIn('.host::after', 'clip-path')?.value).toMatch(/^path\("M/)
  })

  it('hay un recorte por estado de cuerpo y por capa, y ninguno vacío', () => {
    // 6 de cuerpo (reposo, quieto, ofendida, cabezada, dormida, susto) y cabeza y manos de la
    // escondida y de la asomada.
    expect(pathClips).toHaveLength(6 + 4)
    for (const { decl } of pathClips)
      expect(decl.value).toMatch(/^path\("M[MhvZ\d\s.-]+"\)$/)
  })

  it('ningún recorte toca lo pintado: todos van en un ::after sin contenido', () => {
    // Recortar una capa o el anfitrión cambiaría cómo se pinta el arte.
    for (const { rule } of pathClips)
      for (const selector of rule.selectors)
        expect(selector).toMatch(/::after$/)
  })

  it('con el cuerpo escondido, el ::after del anfitrión se apaga y solo responden cabeza y manos', () => {
    const hiding = rules.filter(
      (rule) =>
        rule.selector.includes('[data-poking=hide]') &&
        !rule.selector.includes('[data-poking-layer'),
    )
    expect(hiding.length).toBeGreaterThan(0)
    for (const rule of hiding) expect(rule.selector).toMatch(/::after$/)
    const body = hiding.at(-1)!
    expect(
      body.nodes.some(
        (n) =>
          n.type === 'decl' &&
          n.prop === 'pointer-events' &&
          n.value === 'none',
      ),
    ).toBe(true)

    for (const layer of ['head', 'hands']) {
      const own = rules.find(
        (rule) =>
          rule.selector.includes('[data-poking=hide]') &&
          rule.selector.endsWith(`[data-poking-layer=${layer}]::after`),
      )
      expect(own, layer).toBeDefined()
      expect(
        own!.nodes.some(
          (n) =>
            n.type === 'decl' &&
            n.prop === 'pointer-events' &&
            n.value === 'auto',
        ),
      ).toBe(true)
    }
  })

  it('las capas en sí dejan de ser sensibles (lo son sus ::after): el parcial de poking las hacía sensibles', () => {
    const layers = valueIn('.host [data-poking-layer]', 'pointer-events')
    expect(layers?.value).toBe('none')
    expect(layers?.important).toBe(true)
  })

  it('el tinte para revisarla solo pinta los ::after: no toca la forma ni lo pintado', () => {
    const tint = rules.filter((rule) => rule.selector.includes('.showHit'))
    expect(tint.length).toBeGreaterThan(0)
    for (const rule of tint) {
      for (const selector of rule.selectors)
        expect(selector).toMatch(/::after$/)
      expect(
        rule.nodes.every((n) => n.type === 'decl' && n.prop === 'background'),
      ).toBe(true)
    }
  })
})

describe('la insignia móvil (escala 1)', () => {
  it('su ::after mide lo que el anfitrión', () => {
    expect(badge.valueIn('.host::after', 'inset')?.value).toBe('0')
    expect(badge.valueIn('.host::after', 'transform')).toBeUndefined()
  })

  it('el recuadro sigue sin recortar: los efectos sobresalen', () => {
    expect(badge.valueIn('.badge', 'overflow')).toBeUndefined()
  })
})

describe('el retrato grande (escala 3)', () => {
  // Los trazados son los de la insignia, hechos para 128 px; el retrato mide 384, el fotograma real.
  const scaled = (selector: string) => ({
    width: wide.valueIn(selector, 'width')?.value,
    transform: wide.valueIn(selector, 'transform')?.value,
    origin: wide.valueIn(selector, 'transform-origin')?.value,
  })

  it('usa las mismas siluetas que la insignia, sin regenerarlas', () => {
    expect(wide.pathClips.map(({ decl }) => decl.value)).toEqual(
      badge.pathClips.map(({ decl }) => decl.value),
    )
  })

  it('su ::after es un tercio del anfitrión ampliado ×3 desde la esquina', () => {
    expect(scaled('.host::after')).toEqual({
      width: 'calc(100% / 3)',
      transform: 'scale(3)',
      origin: '0 0',
    })
    expect(wide.valueIn('.host::after', 'inset')).toBeUndefined()
  })

  it('no baja del borde de poking: lo de más abajo está tapado por el diálogo y es suyo', () => {
    // Durante la broma el anfitrión sube por encima del diálogo (`--poking-z`): sin este límite,
    // la silueta del cuerpo entero (que sigue pintada bajo el diálogo) le robaría los toques.
    expect(wide.valueIn('.host::after', 'height')?.value).toBe(
      'calc(var(--poking-edge, 100%) / 3)',
    )
    expect(wide.valueIn('.host', '--poking-edge')?.value).toBe(
      `${WIDE_EDGE_PERCENT}%`,
    )
  })

  it('las capas de cabeza y manos se amplían igual y llegan hasta su borde (las manos agarran el diálogo)', () => {
    expect(
      scaled(
        '.host :is([data-poking-layer=head], [data-poking-layer=hands])::after',
      ),
    ).toEqual({
      width: 'calc(100% / 3)',
      transform: 'scale(3)',
      origin: '0 0',
    })
    expect(
      wide.valueIn(
        '.host :is([data-poking-layer=head], [data-poking-layer=hands])::after',
        'height',
      )?.value,
    ).toBe('calc(100% / 3)')
  })
})

describe('el retrato del cuestionario (escala ×1,5 y ×3 según la pantalla)', () => {
  const { rules, valueIn, pathClips } = profile

  it('usa las mismas siluetas que la insignia, sin regenerarlas', () => {
    expect(pathClips.map(({ decl }) => decl.value)).toEqual(
      badge.pathClips.map(({ decl }) => decl.value),
    )
  })

  it('la escala sigue a la del retrato: ×1,5 a 192 px y ×3 a 384 px desde 1080 px', () => {
    const base = rules.find(
      (rule) => rule.selector === '.host' && rule.parent?.type === 'root',
    )
    expect(
      base?.nodes.find(
        (n): n is Declaration => n.type === 'decl' && n.prop === '--hit-scale',
      )?.value,
    ).toBe('1.5')
    const wideRule = rules.find(
      (rule) =>
        rule.selector === '.host' &&
        (rule.parent as postcss.AtRule).type === 'atrule' &&
        (rule.parent as postcss.AtRule).params.includes('min-width: 67.5em'),
    )
    expect(wideRule, 'regla de dos columnas').toBeDefined()
    expect(
      wideRule!.nodes.some(
        (n) => n.type === 'decl' && n.prop === '--hit-scale' && n.value === '3',
      ),
    ).toBe(true)
  })

  it('su ::after es la caja del anfitrión dividida por la escala y ampliada desde la esquina', () => {
    expect(valueIn('.host::after', 'width')?.value).toBe(
      'calc(100% / var(--hit-scale))',
    )
    expect(valueIn('.host::after', 'transform')?.value).toBe(
      'scale(var(--hit-scale))',
    )
    expect(valueIn('.host::after', 'transform-origin')?.value).toBe('0 0')
  })

  it('apoya en el borde del bocadillo (100 %): poking se esconde tras él, sin solape', () => {
    expect(valueIn('.host', '--poking-edge')?.value).toBe('100%')
    expect(valueIn('.host::after', 'height')?.value).toBe(
      'calc(var(--poking-edge, 100%) / var(--hit-scale))',
    )
  })

  it('decisión aprobada: la etiqueta «Sofi» queda por encima del retrato', () => {
    expect(valueIn('.stage figcaption', 'z-index')?.value).toBe('2')
  })
})
