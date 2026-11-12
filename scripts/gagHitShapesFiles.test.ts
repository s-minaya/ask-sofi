import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { generateHitShapesScss, HIT_SHAPES_SCSS } from './gagHitShapesFiles.ts'

// Con las tiras reales (sin tocarlas): el SCSS versionado es el que sale de ellas.

describe('parcial de la zona sensible (con las tiras reales)', () => {
  it('está al día: regenerarlo da exactamente lo versionado', async () => {
    const committed = readFileSync(HIT_SHAPES_SCSS, 'utf8').replaceAll(
      '\r\n',
      '\n',
    )
    expect(await generateHitShapesScss()).toBe(committed)
  })

  it('cada forma tiene trazado: ninguna quedó vacía por un recorte mal puesto', async () => {
    const scss = await generateHitShapesScss()
    const entries = [...scss.matchAll(/^ {2}([\w-]+):\s*\n?\s*'([^']*)',$/gm)]
    expect(entries.map((entry) => entry[1])).toHaveLength(10)
    for (const [, name, path] of entries)
      expect(path.length, name).toBeGreaterThan(100)
  })
})
