import { describe, expect, it } from 'vitest'
import {
  areaResize,
  binarizeAlpha,
  compareImages,
  removeBackground,
  removeSpecks,
  snapAlpha,
  type RgbaImage,
} from './sofiStatics.ts'

type Pixel = [number, number, number, number]

const CLEAR: Pixel = [0, 0, 0, 0]
const RED: Pixel = [255, 0, 0, 255]
const BLUE: Pixel = [0, 0, 255, 255]

function image(rows: Pixel[][]): RgbaImage {
  const height = rows.length
  const width = rows[0].length
  return { width, height, data: Uint8Array.from(rows.flat(2)) }
}

function pixel(img: RgbaImage, x: number, y: number): Pixel {
  const i = (y * img.width + x) * 4
  return [...img.data.subarray(i, i + 4)] as Pixel
}

const fill = (width: number, height: number, value: Pixel) =>
  image(Array.from({ length: height }, () => Array(width).fill(value)))

describe('removeBackground', () => {
  const BG: Pixel = [1, 0, 0, 255]
  const LINE: Pixel = [20, 12, 24, 255]

  it('vuelve transparente el fondo oscuro conectado al borde', () => {
    const source = image([
      [BG, BG, BG, BG],
      [BG, LINE, LINE, BG],
      [BG, LINE, RED, BG],
      [BG, BG, BG, BG],
    ])

    const result = removeBackground(source, 3)

    expect(pixel(result, 0, 0)).toEqual([1, 0, 0, 0])
    expect(pixel(result, 3, 3)[3]).toBe(0)
    expect(pixel(result, 1, 1)).toEqual(LINE)
    expect(pixel(result, 2, 2)).toEqual(RED)
  })

  it('conserva lo oscuro encerrado en el dibujo', () => {
    const source = image([
      [BG, LINE, LINE, LINE],
      [BG, LINE, BG, LINE],
      [BG, LINE, LINE, LINE],
    ])

    const result = removeBackground(source, 3)

    expect(pixel(result, 2, 1)).toEqual(BG)
  })

  it('no atraviesa el dibujo en diagonal', () => {
    const source = image([
      [BG, LINE, BG],
      [LINE, BG, LINE],
      [BG, LINE, BG],
    ])

    const result = removeBackground(source, 3)

    expect(pixel(result, 1, 1)).toEqual(BG)
  })

  it('no modifica la imagen de origen', () => {
    const source = image([[BG]])

    removeBackground(source, 3)

    expect(pixel(source, 0, 0)).toEqual(BG)
  })
})

describe('binarizeAlpha', () => {
  it('deja el alfa en 0 o 255 sin tocar el color', () => {
    const source = image([
      [
        [10, 20, 30, 253],
        [10, 20, 30, 128],
        [10, 20, 30, 127],
        [10, 20, 30, 3],
      ],
    ])

    const result = binarizeAlpha(source)

    expect([0, 1, 2, 3].map((x) => pixel(result, x, 0))).toEqual([
      [10, 20, 30, 255],
      [10, 20, 30, 255],
      [10, 20, 30, 0],
      [10, 20, 30, 0],
    ])
  })

  it('no modifica la imagen de origen', () => {
    const source = image([[[1, 2, 3, 200]]])

    binarizeAlpha(source)

    expect(pixel(source, 0, 0)).toEqual([1, 2, 3, 200])
  })
})

describe('removeSpecks', () => {
  it('borra los grupos opacos pequeños y conserva los grandes', () => {
    const source = image([
      [RED, CLEAR, CLEAR, BLUE, BLUE],
      [CLEAR, CLEAR, CLEAR, BLUE, BLUE],
      [CLEAR, CLEAR, CLEAR, BLUE, BLUE],
    ])

    const { image: result, removed } = removeSpecks(source, 2)

    expect(pixel(result, 0, 0)[3]).toBe(0)
    expect(pixel(result, 3, 0)).toEqual(BLUE)
    expect(removed).toEqual([1])
  })

  it('los píxeles en diagonal pertenecen al mismo grupo', () => {
    const source = image([
      [RED, CLEAR],
      [CLEAR, RED],
    ])

    expect(removeSpecks(source, 2).removed).toEqual([])
  })
})

describe('areaResize', () => {
  it('cada píxel es la media del área que cubre', () => {
    const source = image([
      [RED, RED, BLUE, BLUE],
      [RED, RED, BLUE, BLUE],
      [BLUE, BLUE, RED, RED],
      [BLUE, BLUE, RED, RED],
    ])

    const result = areaResize(source, { width: 2, height: 2 })

    expect(pixel(result, 0, 0)).toEqual(RED)
    expect(pixel(result, 1, 0)).toEqual(BLUE)
    expect(pixel(result, 0, 1)).toEqual(BLUE)
  })

  // Sin premultiplicar, el negro de los píxeles transparentes oscurecería el contorno.
  it('el color de los píxeles transparentes no se mezcla', () => {
    const source = image([
      [RED, CLEAR],
      [RED, CLEAR],
    ])

    expect(pixel(areaResize(source, { width: 1, height: 1 }), 0, 0)).toEqual([
      255, 0, 0, 128,
    ])
  })

  it('recorta una zona; lo que queda fuera de la imagen es transparente', () => {
    const source = fill(2, 2, RED)

    const result = areaResize(source, {
      width: 2,
      height: 2,
      crop: { x: 0, y: 1, width: 2, height: 2 },
    })

    expect(pixel(result, 0, 0)).toEqual(RED)
    expect(pixel(result, 0, 1)).toEqual(CLEAR)
  })

  it('una escala no entera reparte el área por fracciones', () => {
    const source = image(Array(3).fill([RED, RED, BLUE]))

    const result = areaResize(source, { width: 2, height: 2 })

    expect(pixel(result, 0, 0)).toEqual(RED)
    // 0,5 px rojo y 1 px azul.
    expect(pixel(result, 1, 0)).toEqual([85, 0, 170, 255])
  })

  it('rechaza un recorte que deformaría la imagen', () => {
    expect(() =>
      areaResize(fill(4, 2, RED), { width: 2, height: 2 }),
    ).toThrowError(/proporción/)
  })
})

describe('snapAlpha', () => {
  it('estrecha el antialias y vacía el color de lo transparente', () => {
    const source = image([
      [
        [9, 9, 9, 241],
        [9, 9, 9, 120],
        [9, 9, 9, 14],
      ],
    ])

    const result = snapAlpha(source)

    expect([0, 1, 2].map((x) => pixel(result, x, 0))).toEqual([
      [9, 9, 9, 255],
      [9, 9, 9, 120],
      [0, 0, 0, 0],
    ])
  })
})

describe('compareImages', () => {
  it('cuenta diferencias solo en píxeles visibles', () => {
    const a = image([[RED, [1, 2, 3, 0], BLUE]])
    const b = image([[RED, [9, 9, 9, 0], [0, 0, 200, 255]]])

    expect(compareImages(a, b)).toEqual({
      mismatched: 1,
      meanRgbError: 55 / 3 / 2,
      pixelsOver40: 1,
      alphaFlips: 0,
    })
  })

  it('el error de color ignora los bordes semitransparentes', () => {
    const a = image([[[255, 0, 0, 120], RED]])
    const b = image([[[0, 0, 0, 120], RED]])

    expect(compareImages(a, b)).toMatchObject({
      mismatched: 1,
      meanRgbError: 0,
    })
  })

  it('cuenta los píxeles que pasan de visibles a transparentes', () => {
    expect(compareImages(image([[RED]]), image([[CLEAR]])).alphaFlips).toBe(1)
  })
})
