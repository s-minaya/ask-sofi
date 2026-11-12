import { describe, expect, it } from 'vitest'
import {
  blockMask,
  buildHitShapes,
  cropAlpha,
  maskRects,
  maskToPath,
  pasteAlpha,
  renderHitShapesScss,
  type Alpha,
  type Mask,
} from './gagHitShapes.ts'

// T066: las partes visibles de Sofi, como máscara por bloques de la zona sensible. Lógica pura
// sobre el canal alfa; la lectura de los WebP y la escritura del SCSS viven en el CLI.

const alpha = (rows: number[][]): Alpha => ({
  width: rows[0].length,
  height: rows.length,
  data: Uint8Array.from(rows.flat()),
})
const blank = (width: number, height: number): Alpha => ({
  width,
  height,
  data: new Uint8Array(width * height),
})
const cells = (mask: Mask) =>
  Array.from({ length: mask.rows }, (_, r) =>
    Array.from(mask.cells.slice(r * mask.cols, (r + 1) * mask.cols)).join(''),
  )

// Reconstruye la máscara desde las órdenes de un trazado propio (`Mx yhWvHh-WZ` por rectángulo),
// para probar que el trazado cubre exactamente lo mismo que la máscara.
function rasterize(path: string, cols: number, rows: number): string[] {
  const grid = Array.from({ length: rows }, () => Array(cols).fill('0'))
  for (const match of path.matchAll(
    /M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)v(-?[\d.]+)h(-?[\d.]+)Z/g,
  )) {
    const [x, y, w, h] = [match[1], match[2], match[3], match[4]].map(Number)
    for (let r = y; r < y + h; r++)
      for (let c = x; c < x + w; c++) grid[r][c] = '1'
  }
  return grid.map((row) => row.join(''))
}

describe('blockMask', () => {
  it('un bloque es sensible si algún píxel suyo llega al umbral', () => {
    // 6×3 con bloques de 3: el primero tiene un píxel opaco; el segundo, solo uno tenue.
    const mask = blockMask(
      alpha([
        [0, 0, 0, 0, 0, 9],
        [0, 255, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ]),
      3,
      32,
    )
    expect(mask.cols).toBe(2)
    expect(mask.rows).toBe(1)
    expect(cells(mask)).toEqual(['10'])
  })

  it('con umbral 1 entra cualquier píxel que no sea transparente del todo', () => {
    const mask = blockMask(alpha([[0, 0, 0, 0, 0, 1]]), 3, 1)
    expect(cells(mask)).toEqual(['01'])
  })

  it('un borde que no es múltiplo del bloque cuenta como un bloque más', () => {
    const mask = blockMask(alpha([[0, 0, 0, 255]]), 3, 32)
    expect(mask.cols).toBe(2)
    expect(cells(mask)).toEqual(['01'])
  })

  it('una imagen vacía da una máscara vacía', () => {
    expect(cells(blockMask(blank(6, 6), 3, 1))).toEqual(['00', '00'])
  })
})

describe('pasteAlpha y cropAlpha', () => {
  it('pega con un desplazamiento y se queda con el mayor alfa donde se solapan', () => {
    const canvas = alpha([
      [0, 100, 0, 0],
      [0, 0, 0, 0],
    ])
    pasteAlpha(canvas, alpha([[50, 200]]), 1, 0)
    expect(Array.from(canvas.data)).toEqual([0, 100, 200, 0, 0, 0, 0, 0])
  })

  it('lo que cae fuera del lienzo se descarta sin error', () => {
    const canvas = blank(2, 2)
    pasteAlpha(canvas, alpha([[255, 255, 255]]), 1, 1)
    pasteAlpha(canvas, alpha([[255], [255]]), -1, -1)
    expect(Array.from(canvas.data)).toEqual([0, 0, 0, 255])
  })

  it('recorta una región de una tira', () => {
    const strip = alpha([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ])
    const piece = cropAlpha(strip, { x: 1, y: 0, width: 2, height: 2 })
    expect(piece.width).toBe(2)
    expect(Array.from(piece.data)).toEqual([2, 3, 6, 7])
  })
})

describe('maskRects y maskToPath', () => {
  const mask = (rows: string[]): Mask => ({
    cols: rows[0].length,
    rows: rows.length,
    cells: Uint8Array.from(rows.join('').split('').map(Number)),
  })

  it('une las filas contiguas con el mismo tramo en un solo rectángulo', () => {
    const rects = maskRects(mask(['0110', '0110', '0110']))
    expect(rects).toEqual([{ x: 1, y: 0, width: 2, height: 3 }])
  })

  it('no une tramos distintos ni filas separadas por un hueco', () => {
    const rects = maskRects(mask(['110', '011', '000', '110']))
    expect(rects).toEqual([
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 1, y: 1, width: 2, height: 1 },
      { x: 0, y: 3, width: 2, height: 1 },
    ])
  })

  it('un hueco dentro de una fila separa dos tramos', () => {
    expect(maskRects(mask(['1011']))).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 2, y: 0, width: 2, height: 1 },
    ])
  })

  it.each([
    ['una figura con hueco', ['01110', '11011', '11111', '00100']],
    ['dos islas', ['1100', '1100', '0011']],
    ['llena', ['111', '111']],
    ['vacía', ['000']],
  ])('el trazado de %s reconstruye exactamente la máscara', (_name, rows) => {
    const m = mask(rows)
    const path = maskToPath(m)
    expect(rasterize(path, m.cols, m.rows)).toEqual(rows)
  })

  it('una máscara vacía da un trazado vacío, que no recorta nada que pueda usarse', () => {
    expect(maskToPath(mask(['00', '00']))).toBe('')
  })

  it('el trazado es compacto: relativo y sin separadores de más', () => {
    expect(maskToPath(mask(['11', '11']))).toBe('M0 0h2v2h-2Z')
  })
})

describe('buildHitShapes', () => {
  // Cada tira se sustituye por una imagen del mismo tamaño que la real y opaca del todo: así se ve
  // dónde cae cada pieza sin depender del arte.
  const sizes: Record<string, [number, number]> = {
    'sofi-blink.webp': [1152, 384],
    'poking.webp': [384, 384],
    'poking-face.webp': [664, 160],
    'poking-hide.webp': [296, 486],
    'are-u-still-here.webp': [1152, 304],
  }
  const load = async (file: string): Promise<Alpha> => {
    const [width, height] = sizes[file]
    return { width, height, data: new Uint8Array(width * height).fill(255) }
  }
  const at = (mask: Mask, col: number, row: number) =>
    mask.cells[row * mask.cols + col]

  it('define las diez formas: seis de cuerpo en la rejilla del anfitrión y cuatro de capa', async () => {
    const shapes = await buildHitShapes(load)
    expect(Object.keys(shapes).sort()).toEqual([
      'asleep',
      'hands-hide',
      'hands-peek',
      'head-hide',
      'head-peek',
      'idle',
      'nodding',
      'offended',
      'startled',
      'stop',
    ])
    // 384 px de sprite en bloques de 3: la rejilla de los 128 px del anfitrión.
    for (const name of [
      'idle',
      'stop',
      'offended',
      'nodding',
      'asleep',
      'startled',
    ])
      expect([shapes[name].cols, shapes[name].rows]).toEqual([128, 128])
    // Una capa mide lo que su celda: 296 × 208 y 208 × 32 px de sprite.
    expect([shapes['head-hide'].cols, shapes['head-hide'].rows]).toEqual([
      99, 70,
    ])
    expect([shapes['hands-peek'].cols, shapes['hands-peek'].rows]).toEqual([
      70, 11,
    ])
  })

  it('el reposo es el fotograma 0 de sofi-blink: 384 × 384 del principio de la tira', async () => {
    const { idle } = await buildHitShapes(load)
    expect(idle.cells.every((cell) => cell === 1)).toBe(true)
  })

  it('«¡quieto!» suma la palma al reposo, donde la pone el parcial (40, 224)', async () => {
    // Con el reposo vacío, solo queda la palma.
    const empty = async (file: string): Promise<Alpha> =>
      file === 'sofi-blink.webp'
        ? { width: 1152, height: 384, data: new Uint8Array(1152 * 384) }
        : load(file)
    const { stop, idle } = await buildHitShapes(empty)
    expect(idle.cells.some(Boolean)).toBe(false)
    // La palma ocupa de x 40 a 176 y de y 224 a 384: bloques de 13 a 58 y de 74 a 127.
    expect(at(stop, 13, 74)).toBe(1)
    expect(at(stop, 58, 127)).toBe(1)
    expect(at(stop, 12, 74)).toBe(0)
    expect(at(stop, 13, 73)).toBe(0)
    expect(at(stop, 59, 100)).toBe(0)
  })

  it('cada pose de are-u-still-here va en su sitio (cabezada 48, 80; dormida 48, 96; susto 32, 80)', async () => {
    const empty = async (file: string): Promise<Alpha> =>
      file === 'sofi-blink.webp'
        ? { width: 1152, height: 384, data: new Uint8Array(1152 * 384) }
        : load(file)
    const { nodding, asleep, startled } = await buildHitShapes(empty)
    // La cabezada empieza en el bloque (16, 26) (80 / 3 = 26,7: el bloque que lo contiene).
    expect([
      at(nodding, 16, 26),
      at(nodding, 15, 26),
      at(nodding, 16, 25),
    ]).toEqual([1, 0, 0])
    expect([at(asleep, 16, 32), at(asleep, 16, 31)]).toEqual([1, 0])
    expect([at(startled, 10, 26), at(startled, 9, 26)]).toEqual([1, 0])
  })
})

describe('renderHitShapesScss', () => {
  it('un trazado largo baja a la línea siguiente, como lo deja Prettier', () => {
    const long = 'M0 0h1v1h-1Z'.repeat(8)
    const scss = renderHitShapesScss({ idle: long })
    expect(scss).toContain(`  idle:
    '${long}',
`)
  })

  it('escribe un mapa SCSS con un trazado por forma y avisa de que está generado', () => {
    const scss = renderHitShapesScss({ idle: 'M0 0h1v1h-1Z', stop: '' })
    expect(scss).toContain('generateGagHitShapes')
    expect(scss).toContain('$hit-shapes: (')
    expect(scss).toContain("  idle: 'M0 0h1v1h-1Z',")
    expect(scss).toContain("  stop: '',")
    expect(scss.endsWith(');\n')).toBe(true)
  })
})
