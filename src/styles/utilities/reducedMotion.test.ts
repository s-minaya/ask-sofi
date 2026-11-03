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
