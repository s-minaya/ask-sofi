import { preprocessCSS, resolveConfig } from 'vite'
import { describe, expect, it } from 'vitest'

// Contrato de los módulos dueños (tech-stack §46.1 paso 2; plan 008 §5.4): cada parcial
// importado de los ZIP tiene un único módulo que lo importa y que exporta su clase y las
// URL de sus tiras. Esta prueba no depende de que ya haya quien los consuma.
const IDS = [
  // Lote 1 (T006)
  'sofi-blink',
  'sofing',
  'rolling',
  'talking',
  'favoriting',
  'needs-context',
  'error',
  'uncertain',
  'memory-wipe',
  // Lote 2 (T007): gags
  'poking',
  'are-u-still-here',
  'i-see-you',
  // Lote 3 (T008): solo el Lab
  'eureka',
  'suspicious',
]

const partials = import.meta.glob<string>('/src/styles/sprites/_*.scss', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const moduleSources = import.meta.glob<string>(
  '/src/components/sofi/sprites/*.module.scss',
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
)
// Solo las claves: no hace falta cargar las tiras para saber cuáles existen.
const stripFiles = Object.keys(
  import.meta.glob('/src/styles/sprites/*.webp', {
    query: '?url',
    import: 'default',
  }),
).map((path) => path.split('/').pop() as string)
const owners = import.meta.glob<{
  className: string
  strips: Record<string, string>
}>(['./*.ts', '!./*.test.ts'], { eager: true })

const SPRITES_DIR = '/src/styles/sprites/'
const MODULES_DIR = '/src/components/sofi/sprites/'

// Las URL de las tiras que usa un parcial, sin los comentarios de línea.
function stripsUsedBy(partial: string): string[] {
  const code = partial.replace(/^\s*\/\/.*$/gm, '')
  return [...code.matchAll(/url\(\s*['"]([^'"]+)['"]\s*\)/g)].map(
    (match) => match[1],
  )
}

describe('módulos dueños de los parciales de sprites', () => {
  it('cada parcial importado tiene su módulo dueño y viceversa', () => {
    const partialIds = Object.keys(partials)
      .map((path) => path.slice(SPRITES_DIR.length + 1, -'.scss'.length))
      .filter((id) => id !== 'sprite')
    expect(partialIds.sort()).toEqual([...IDS].sort())
    expect(
      Object.keys(moduleSources)
        .map((path) => path.slice(MODULES_DIR.length, -'.module.scss'.length))
        .sort(),
    ).toEqual([...IDS].sort())
  })

  describe.each(IDS)('%s', (id) => {
    it('su módulo SCSS es solo el @use relativo de su parcial', () => {
      const source = moduleSources[`${MODULES_DIR}${id}.module.scss`]
      const code = source.replace(/^\s*\/\/.*$/gm, '').trim()
      expect(code).toBe(`@use '../../../styles/sprites/${id}';`)
    })

    it('las tiras que usa el parcial existen y llevan su prefijo', () => {
      const used = stripsUsedBy(partials[`${SPRITES_DIR}_${id}.scss`])
      expect(used.length).toBeGreaterThan(0)
      for (const file of used) {
        expect(stripFiles, `${id} referencia ${file}`).toContain(file)
        expect(
          file === `${id}.webp` || file.startsWith(`${id}-`),
          `${file} fuera de ${id}`,
        ).toBe(true)
      }
    })

    it('exporta la clase y exactamente las tiras de su prefijo', () => {
      const owner = owners[`./${id}.ts`]
      expect(owner, `falta sprites/${id}.ts`).toBeDefined()
      const expected = stripFiles
        .filter(
          (file) =>
            file === `${id}.webp` ||
            (file.startsWith(`${id}-`) && file.endsWith('.webp')),
        )
        .map((file) => `${SPRITES_DIR}${file}`)
      expect(Object.keys(owner.strips).sort()).toEqual(expected.sort())
      for (const url of Object.values(owner.strips))
        expect(typeof url).toBe('string')
    })

    it('compila y expone la clase del recurso con las tiras rebasadas desde su módulo', async () => {
      const config = await resolveConfig(
        { configFile: 'vite.config.ts' },
        'build',
      )
      const file = `${process.cwd()}/src/components/sofi/sprites/${id}.module.scss`
      const { code, modules } = await preprocessCSS(
        moduleSources[`${MODULES_DIR}${id}.module.scss`],
        file,
        config,
      )
      expect(modules?.[id], `la clase .${id}`).toBeTruthy()
      // Una tira sin rebasar (rota) no aparecería con esta ruta relativa al módulo.
      for (const strip of stripsUsedBy(partials[`${SPRITES_DIR}_${id}.scss`])) {
        expect(code).toContain(`../../../styles/sprites/${strip}`)
      }
    }, 30_000)
  })
})
