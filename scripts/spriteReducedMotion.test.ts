import { preprocessCSS, resolveConfig } from 'vite'
import { describe, expect, it } from 'vitest'
import { spriteReducedMotion } from './spriteReducedMotion.ts'

// Plan 008 §4.3 y §10 (punto 7): el plugin se ejecuta con la cadena real de Vite
// (Sass y PostCSS) sobre CSS escrito en la prueba, sin tocar los parciales.
const ROOT = process.cwd().replaceAll('\\', '/')
const IN_SCOPE = `${ROOT}/src/components/sofi/sprites/demo.scss`
const IN_SCOPE_CSS = `${ROOT}/src/components/sofi/sprites/demo.css`
const OUT_OF_SCOPE = `${ROOT}/src/components/ui/Demo/demo.scss`

const REDUCE_SYSTEM = ":where(:root:not([data-motion='full']))"
const REDUCE_FORCED = ":where(:root[data-motion='reduce'])"
const FULL_SYSTEM = ":where(:root:not([data-motion='reduce']))"
const FULL_FORCED = ":where(:root[data-motion='full'])"

async function run(code: string, file = IN_SCOPE): Promise<string> {
  const config = await resolveConfig(
    {
      configFile: false,
      root: process.cwd(),
      logLevel: 'silent',
      css: { postcss: { plugins: [spriteReducedMotion()] } },
    },
    'build',
  )
  return (await preprocessCSS(code, file, config)).code
}

const squash = (css: string) => css.replace(/\s+/g, ' ').trim()

describe('spriteReducedMotion', () => {
  describe('las cuatro reglas (plan §4.3)', () => {
    it('reduce: prefijo en el sitio y clon forzado justo después del bloque', async () => {
      const css = await run(`
        .a { animation: x 1s; }
        @media (prefers-reduced-motion: reduce) { .a { animation: none; } }
        .b { color: red; }
      `)

      expect(squash(css)).toBe(
        squash(`
          .a { animation: x 1s; }
          @media (prefers-reduced-motion: reduce) {
            ${REDUCE_SYSTEM} .a { animation: none; }
          }
          ${REDUCE_FORCED} .a { animation: none; }
          .b { color: red; }
        `),
      )
    })

    it('no-preference: prefijo en el sitio y clon forzado a «full»', async () => {
      const css = await run(`
        @media (prefers-reduced-motion: no-preference) { .a { animation: x 1s; } }
      `)

      expect(squash(css)).toBe(
        squash(`
          @media (prefers-reduced-motion: no-preference) {
            ${FULL_SYSTEM} .a { animation: x 1s; }
          }
          ${FULL_FORCED} .a { animation: x 1s; }
        `),
      )
    })

    it('prefija cada selector de una lista y todas las reglas del bloque', async () => {
      const css = await run(`
        @media (prefers-reduced-motion: reduce) {
          .a, .b > .c { animation: none; }
          .d::after { opacity: 1; }
        }
      `)

      for (const prefix of [REDUCE_SYSTEM, REDUCE_FORCED]) {
        expect(css).toContain(`${prefix} .a`)
        expect(css).toContain(`${prefix} .b > .c`)
        expect(css).toContain(`${prefix} .d::after`)
      }
    })

    it('el clon ocupa la misma posición en la cascada que su bloque', async () => {
      const css = await run(`
        @media (prefers-reduced-motion: no-preference) { .a { animation: x 1s; } }
        @media (prefers-reduced-motion: reduce) { .a { animation: none; } }
      `)

      const order = [
        FULL_SYSTEM,
        FULL_FORCED,
        REDUCE_SYSTEM,
        REDUCE_FORCED,
      ].map((prefix) => css.indexOf(prefix))
      expect(order.every((index) => index >= 0)).toBe(true)
      expect(order).toEqual([...order].sort((a, b) => a - b))
    })

    it('ningún prefijo añade especificidad: sin los :where queda el selector original', async () => {
      const css = await run(`
        @media (prefers-reduced-motion: reduce) { .a[data-x='1']:hover { animation: none; } }
      `)

      const rest = css
        .replace(/:where\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)\s*/g, '')
        .match(/\.a\[data-x=['"]1['"]\]:hover/g)
      expect(rest).toHaveLength(2)
    })

    it('admite espacios y mayúsculas distintos en la condición', async () => {
      const css = await run(`
        @media (Prefers-Reduced-Motion:reduce) { .a { animation: none; } }
      `)

      expect(css).toContain(`${REDUCE_FORCED} .a`)
    })

    it('no toca lo que queda fuera de los bloques, ni los @keyframes', async () => {
      const source = `
        .a { animation: x 1s; }
        @keyframes x { from { opacity: 0; } to { opacity: 1; } }
      `

      expect(squash(await run(source))).toBe(squash(source))
    })

    it('se compone con los CSS Modules: el atributo y :root no se convierten en clases locales', async () => {
      const css = await run(
        `@media (prefers-reduced-motion: reduce) { .a { animation: none; } }`,
        `${ROOT}/src/components/sofi/sprites/demo.module.scss`,
      )

      expect(css).toMatch(/:where\(:root:not\(\[data-motion='full'\]\)\) \._a_/)
      expect(css).toMatch(/:where\(:root\[data-motion='reduce'\]\) \._a_/)
    })
  })

  describe('alcance por ruta', () => {
    it('no modifica ningún CSS fuera de src/components/sofi/sprites/', async () => {
      const source = `
        .a { animation: x 1s; }
        @media (prefers-reduced-motion: reduce) { .a { animation: none; } }
        @media (min-width: 40em) { .a { color: red; } }
        html .b { color: blue; }
      `

      expect(squash(await run(source, OUT_OF_SCOPE))).toBe(squash(source))
    })

    it('reconoce la ruta con separadores de Windows', async () => {
      const css = await run(
        `@media (prefers-reduced-motion: reduce) { .a { animation: none; } }`,
        IN_SCOPE.replaceAll('/', '\\'),
      )

      expect(css).toContain(REDUCE_FORCED)
    })
  })

  describe('el build falla ante lo que el plan no admite', () => {
    it.each([
      ['otra media', `@media (min-width: 40em) { .a { color: red; } }`],
      [
        'una media de movimiento con otra forma',
        `@media (prefers-reduced-motion) { .a { color: red; } }`,
      ],
      [
        'una media combinada',
        `@media (prefers-reduced-motion: reduce) and (min-width: 40em) { .a { color: red; } }`,
      ],
      [
        'una media dentro de otra regla de grupo',
        `@supports (display: grid) { @media (prefers-reduced-motion: reduce) { .a { color: red; } } }`,
      ],
    ])('rechaza %s', async (_case, source) => {
      await expect(run(source)).rejects.toThrow(/sprite|movimiento|media/i)
    })

    it.each([
      ['html', 'html .a'],
      ['body', 'body .a'],
      [':root', ':root .a'],
      ['html como selector único', 'html'],
      ['en una lista', '.ok, body > .a'],
      ['con atributo', 'html[data-theme=dark] .a'],
    ])('rechaza el selector %s en un parcial', async (_case, selector) => {
      await expect(run(`${selector} { color: red; }`)).rejects.toThrow(
        /html|body|:root|sprite/i,
      )
    })

    it('también lo rechaza dentro de un bloque de movimiento', async () => {
      await expect(
        run(
          `@media (prefers-reduced-motion: reduce) { :root .a { color: red; } }`,
        ),
      ).rejects.toThrow(/:root|sprite/i)
    })

    it('no confunde clases, atributos o palabras con esos selectores', async () => {
      const css = await run(`
        .html, .body-copy, .rootless, [data-x='html'], [data-layer='body'] { color: red; }
      `)

      expect(css).toContain('.html')
      expect(css).toContain('[data-layer=body]')
    })

    it('rechaza reglas anidadas', async () => {
      await expect(
        run(`.a { color: red; & .b { color: blue; } }`, IN_SCOPE_CSS),
      ).rejects.toThrow(/anidad|sprite/i)
    })

    it('rechaza una media anidada dentro de una regla', async () => {
      await expect(
        run(
          `.a { @media (prefers-reduced-motion: reduce) { color: red; } }`,
          IN_SCOPE_CSS,
        ),
      ).rejects.toThrow(/anidad|sprite|media/i)
    })

    it('rechaza algo distinto de reglas dentro de un bloque de movimiento', async () => {
      await expect(
        run(
          `@media (prefers-reduced-motion: reduce) { @keyframes y { to { opacity: 0; } } }`,
        ),
      ).rejects.toThrow(/sprite|regla/i)
    })

    it('nombra el archivo en el error', async () => {
      await expect(
        run(`@media (min-width: 40em) { .a { color: red; } }`),
      ).rejects.toThrow(/demo\.scss/)
    })
  })
})
