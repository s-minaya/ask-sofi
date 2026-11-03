import postcss, { type AtRule, type Rule } from 'postcss'
import { preprocessCSS, resolveConfig } from 'vite'
import { describe, expect, it } from 'vitest'

// VT2 (tasks 008): los 14 módulos dueños reales, compilados con la configuración real de
// Vite (Sass, el plugin de movimiento reducido y CSS Modules), frente a sus parciales
// compilados fuera del alcance del plugin. Las reglas deben coincidir con plan §4.3 y los
// parciales no se modifican. Las reglas de plan §4.3 en sí se prueban en
// scripts/spriteReducedMotion.test.ts.
const IDS = [
  'sofi-blink',
  'sofing',
  'rolling',
  'talking',
  'favoriting',
  'needs-context',
  'error',
  'uncertain',
  'memory-wipe',
  'poking',
  'are-u-still-here',
  'i-see-you',
  'eureka',
  'suspicious',
]

const sources = import.meta.glob<string>(
  ['/src/components/sofi/sprites/*.module.scss', '/src/styles/sprites/_*.scss'],
  { query: '?raw', import: 'default', eager: true },
)

const PREFIXES = {
  reduce: {
    system: ":where(:root:not([data-motion='full']))",
    forced: ":where(:root[data-motion='reduce'])",
  },
  'no-preference': {
    system: ":where(:root:not([data-motion='reduce']))",
    forced: ":where(:root[data-motion='full'])",
  },
} as const

const CONDITIONS = {
  '(prefers-reduced-motion: reduce)': 'reduce',
  '(prefers-reduced-motion: no-preference)': 'no-preference',
} as const

// Quita el hash de CSS Modules (`_nombre_1a2b3_1`) para comparar con el parcial sin módulo.
// Las URL de las tiras se rebasan desde el módulo: se devuelven a la forma del parcial.
const unhash = (css: string) =>
  css
    .replace(/_([\w-]+?)_[a-z0-9]{5}_\d+/g, '$1')
    .replaceAll('../../../styles/sprites/', '')
const squash = (css: string) => css.replace(/\s+/g, ' ').trim()

// La configuración real, con el plugin registrado en vite.config.ts.
const realConfig = resolveConfig(
  { configFile: 'vite.config.ts', logLevel: 'silent' },
  'build',
)

async function compile(code: string, file: string) {
  const config = await realConfig
  return (await preprocessCSS(code, file, config)).code
}

// Deshace la transformación del plugin: quita el prefijo del sitio, descarta los clones
// forzados y devuelve lo que habría sin él. Si el resultado coincide con el parcial, el
// plugin solo ha añadido lo que dice el plan.
function undo(css: string): string {
  const root = postcss.parse(unhash(css))
  const forced = new Set<string>(
    Object.values(PREFIXES).map(({ forced: prefix }) => prefix),
  )
  root.each((node) => {
    if (node.type === 'rule') {
      const first = (node as Rule).selectors[0] ?? ''
      if ([...forced].some((prefix) => first.startsWith(`${prefix} `)))
        node.remove()
    }
    if (node.type === 'atrule' && (node as AtRule).name === 'media') {
      const media = node as AtRule
      const motion =
        CONDITIONS[media.params.replace(/\s+/g, ' ') as keyof typeof CONDITIONS]
      media.walkRules((rule) => {
        rule.selectors = rule.selectors.map((selector) =>
          selector.replace(`${PREFIXES[motion].system} `, ''),
        )
      })
    }
  })
  return root.toString()
}

describe('VT2: módulos dueños reales con el plugin de movimiento reducido', () => {
  describe.each(IDS)('%s', (id) => {
    const modulePath = `${process.cwd()}/src/components/sofi/sprites/${id}.module.scss`
    const partialPath = `${process.cwd()}/src/styles/sprites/_${id}.scss`

    it('compila y el parcial queda fuera del alcance del plugin', async () => {
      const partial = await compile(
        sources[`/src/styles/sprites/_${id}.scss`],
        partialPath,
      )

      // Compilado por su ruta, el parcial conserva sus @media originales.
      expect(partial).not.toContain(':where(:root')
      expect(partial).toContain('@keyframes')
    })

    it('solo añade los prefijos y los clones de plan §4.3', async () => {
      const partial = await compile(
        sources[`/src/styles/sprites/_${id}.scss`],
        partialPath,
      )
      const output = await compile(
        sources[`/src/components/sofi/sprites/${id}.module.scss`],
        modulePath,
      )

      expect(squash(undo(output))).toBe(squash(unhash(partial)))
    })

    it('cada regla de cada bloque de movimiento tiene su par forzado justo detrás', async () => {
      const partial = await compile(
        sources[`/src/styles/sprites/_${id}.scss`],
        partialPath,
      )
      const output = unhash(
        await compile(
          sources[`/src/components/sofi/sprites/${id}.module.scss`],
          modulePath,
        ),
      )
      const root = postcss.parse(output)
      const nodes = root.nodes
      let blocks = 0

      nodes.forEach((node, index) => {
        if (node.type !== 'atrule' || node.name !== 'media') return
        blocks++
        const motion =
          CONDITIONS[
            node.params.replace(/\s+/g, ' ') as keyof typeof CONDITIONS
          ]
        expect(motion, `@media ${node.params}`).toBeDefined()
        const { system, forced } = PREFIXES[motion]
        const members = (node.nodes ?? []) as Rule[]
        const inPlace = members.flatMap((rule) =>
          rule.selectors.map((selector) => {
            expect(selector.startsWith(`${system} `)).toBe(true)
            return selector.slice(system.length + 1)
          }),
        )
        // Las reglas forzadas siguen al bloque, en el mismo orden y con las mismas declaraciones.
        const after = nodes
          .slice(index + 1, index + 1 + members.length)
          .map((next) => next as Rule)
        expect(after.map((rule) => rule.type)).toEqual(
          members.map(() => 'rule'),
        )
        expect(
          after.flatMap((rule) =>
            rule.selectors.map((selector) => {
              expect(selector.startsWith(`${forced} `)).toBe(true)
              return selector.slice(forced.length + 1)
            }),
          ),
        ).toEqual(inPlace)
        after.forEach((rule, position) => {
          expect(squash(rule.nodes.join(';'))).toBe(
            squash(members[position].nodes.join(';')),
          )
        })
      })

      // Ningún bloque queda sin transformar ni se añade otro.
      expect(blocks).toBe([...partial.matchAll(/@media /g)].length)
    })
  })

  it('el conjunto de los 14 usa las dos únicas condiciones admitidas', async () => {
    let total = 0
    for (const id of IDS) {
      const css = await compile(
        sources[`/src/styles/sprites/_${id}.scss`],
        `${process.cwd()}/src/styles/sprites/_${id}.scss`,
      )
      for (const match of css.matchAll(/@media ([^{]+)\{/g)) {
        total++
        expect(Object.keys(CONDITIONS)).toContain(
          match[1].replace(/\s+/g, ' ').trim(),
        )
      }
    }
    // 36 bloques «reduce» y 26 «no-preference» en los 14 parciales de los ZIP (VT2).
    expect(total).toBe(62)
  }, 60_000)
})
