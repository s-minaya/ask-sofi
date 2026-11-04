import postcss from 'postcss'
import * as sass from 'sass'
import { describe, expect, it } from 'vitest'

// `u.reduced-motion` (plan 008 §4.2): dos reglas que no añaden especificidad al
// selector del consumidor. Se compila con Sass tal como lo hacen los CSS Modules.
const loadPaths = [`${process.cwd()}/src/styles`]

function compile(source: string): string {
  const css = sass.compileString(`@use 'utilities' as u;\n${source}`, {
    loadPaths,
    style: 'expanded',
  }).css
  // Sass quita las comillas de los valores de atributo que no las necesitan: se comparan sin ellas.
  return css.replaceAll('"', '').replaceAll("'", '')
}

const normalize = (css: string) => css.replace(/\s+/g, ' ').trim()

describe('u.reduced-motion', () => {
  it('genera la regla del sistema y la forzada, sin tocar la base', () => {
    const css = normalize(
      compile(
        `.a { animation: x 1s; @include u.reduced-motion { animation: none; } }`,
      ),
    )

    expect(css).toBe(
      normalize(`
        .a { animation: x 1s; }
        @media (prefers-reduced-motion: reduce) {
          :where(:root:not([data-motion=full])) .a { animation: none; }
        }
        :where(:root[data-motion=reduce]) .a { animation: none; }
      `),
    )
  })

  it('sin data-motion="full" la preferencia del sistema reduce; «full» la anula', () => {
    const css = compile(`.a { @include u.reduced-motion { opacity: 1; } }`)

    expect(css).toContain(':where(:root:not([data-motion=full])) .a')
    expect(css).toContain(':where(:root[data-motion=reduce]) .a')
  })

  it('no añade especificidad: quitando los :where queda el selector del consumidor', () => {
    const css = compile(`
      .b:hover { @include u.reduced-motion { color: red; } }
      .c .d { @include u.reduced-motion { color: red; } }
    `)
    const selectors = [...css.matchAll(/^\s*([^{}@]+?)\s*\{/gm)].map(
      (match) => match[1],
    )
    const reduced = selectors.filter((selector) => selector.includes(':where('))

    expect(reduced).toHaveLength(4)
    for (const selector of reduced) {
      const rest = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)\s*/g, '')
      expect(['.b:hover', '.c .d']).toContain(rest)
    }
  })

  it('funciona dentro de selectores anidados con &', () => {
    const css = compile(
      `.e { &.on { @include u.reduced-motion { color: red; } } }`,
    )

    expect(css).toContain(':where(:root:not([data-motion=full])) .e.on')
    expect(css).toContain(':where(:root[data-motion=reduce]) .e.on')
  })

  it('ya no depende de :global (el atributo no se convierte en clase local)', () => {
    expect(
      compile(`.a { @include u.reduced-motion { color: red; } }`),
    ).not.toContain(':global')
  })
})

// VT4 (tasks 008): en los módulos de la aplicación que usan el mixin, todas las reglas de
// movimiento reducido excluyen `full` (D-9). Antes de mover `SofiPortrait` al módulo dueño de
// `sofi-blink`, una de las 16 no lo hacía (E11). Los parciales de sprites no usan el mixin: su
// transformación es del plugin y la cubre `components/sofi/sprites/reducedMotion.test.ts`.
describe('módulos de la aplicación con u.reduced-motion', () => {
  const sources = import.meta.glob<string>(
    ['/src/**/*.module.scss', '!/src/components/sofi/sprites/*.module.scss'],
    { query: '?raw', import: 'default', eager: true },
  )
  const modules = Object.entries(sources)
    .filter(([, source]) => source.includes('@include u.reduced-motion'))
    .map(([path]) => path)

  const SYSTEM = ':where(:root:not([data-motion=full])) '
  const FORCED = ':where(:root[data-motion=reduce]) '

  const rulesOf = (path: string) => {
    const css = sass
      .compile(`${process.cwd()}${path}`, { loadPaths })
      .css.replaceAll('"', '')
      .replaceAll("'", '')
    const root = postcss.parse(css)
    const inReduce: string[] = []
    const outside: string[] = []
    const otherMedia: string[] = []
    root.walkRules((rule) => {
      const media = rule.parent?.type === 'atrule' ? rule.parent : undefined
      if (media && 'name' in media && media.name === 'media') {
        const condition = media.params.replace(/\s+/g, '')
        if (condition === '(prefers-reduced-motion:reduce)')
          inReduce.push(...rule.selectors)
        else if (condition.includes('prefers-reduced-motion'))
          otherMedia.push(media.params)
      } else if (rule.selector.includes('data-motion')) {
        outside.push(...rule.selectors)
      }
    })
    return { inReduce, outside, otherMedia }
  }

  it('son los 12 de E11 (o más): ninguno se queda sin mirar', () => {
    expect(modules.length).toBeGreaterThanOrEqual(12)
  })

  for (const path of modules) {
    it(`${path.replace('/src/', '')}: todas sus reglas reducidas excluyen «full»`, () => {
      const { inReduce, outside, otherMedia } = rulesOf(path)

      expect(inReduce.length).toBeGreaterThan(0)
      for (const selector of inReduce) {
        expect(selector.startsWith(SYSTEM), selector).toBe(true)
      }
      // La rama forzada es el clon de cada regla del sistema, y solo mira `reduce`.
      expect(outside).toHaveLength(inReduce.length)
      for (const selector of outside) {
        expect(selector.startsWith(FORCED), selector).toBe(true)
      }
      // Nada de otra forma de `prefers-reduced-motion` que no pase por el mixin.
      expect(otherMedia).toEqual([])
    })
  }
})
