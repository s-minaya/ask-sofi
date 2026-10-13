// Limpieza y reescalado de las imágenes estáticas de Sofi (tech-stack §46.1).
// Lógica pura sobre píxeles RGBA: la lectura y escritura de archivos vive en el CLI.

export type RgbaImage = {
  width: number
  height: number
  data: Uint8Array
}

export type Crop = { x: number; y: number; width: number; height: number }

const copy = (image: RgbaImage): RgbaImage => ({
  ...image,
  data: Uint8Array.from(image.data),
})

// Algunos originales llegan sobre un fondo opaco casi negro. Solo es fondo lo
// conectado al borde (sin diagonales): el contorno y los huecos oscuros
// encerrados en el dibujo se conservan.
export function removeBackground(
  image: RgbaImage,
  maxChannel: number,
): RgbaImage {
  const result = copy(image)
  const { width, height, data } = result
  const isBackground = (p: number) =>
    data[p * 4 + 3] > 0 &&
    Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) <= maxChannel
  const pending: number[] = []
  for (let x = 0; x < width; x++) pending.push(x, (height - 1) * width + x)
  for (let y = 0; y < height; y++)
    pending.push(y * width, y * width + width - 1)

  while (pending.length) {
    const p = pending.pop()!
    if (!isBackground(p)) continue
    data[p * 4 + 3] = 0
    const x = p % width
    if (x > 0) pending.push(p - 1)
    if (x < width - 1) pending.push(p + 1)
    if (p >= width) pending.push(p - width)
    if (p < (height - 1) * width) pending.push(p + width)
  }
  return result
}

// El recorte del generador deja el cuerpo semitransparente (253–254) y polvo
// casi invisible alrededor: en pixel art cada píxel es opaco o no existe.
export function binarizeAlpha(image: RgbaImage): RgbaImage {
  const result = copy(image)
  for (let i = 3; i < result.data.length; i += 4)
    result.data[i] = result.data[i] >= 128 ? 255 : 0
  return result
}

// Motas opacas sueltas: grupos conectados (también en diagonal) de menos de `minArea` píxeles.
export function removeSpecks(
  image: RgbaImage,
  minArea: number,
): { image: RgbaImage; removed: number[] } {
  const result = copy(image)
  const { width, height, data } = result
  const seen = new Uint8Array(width * height)
  const removed: number[] = []

  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !data[start * 4 + 3]) continue
    seen[start] = 1
    const group = [start]
    for (let k = 0; k < group.length; k++) {
      const x = group[k] % width
      const y = Math.floor(group[k] / width)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const next = ny * width + nx
          if (seen[next] || !data[next * 4 + 3]) continue
          seen[next] = 1
          group.push(next)
        }
    }
    if (group.length < minArea) {
      for (const p of group) data[p * 4 + 3] = 0
      removed.push(group.length)
    }
  }
  return { image: result, removed }
}

// Media por área con alfa premultiplicado. A diferencia de los núcleos con
// lóbulos (Lanczos), no crea halos en el contorno, y un borde recto que cae en
// el límite entre dos píxeles de salida sigue siendo recto.
export function areaResize(
  image: RgbaImage,
  { width, height, crop }: { width: number; height: number; crop?: Crop },
): RgbaImage {
  const box = crop ?? { x: 0, y: 0, width: image.width, height: image.height }
  const scaleX = box.width / width
  const scaleY = box.height / height
  if (Math.abs(scaleX - scaleY) > 1e-9)
    throw new Error(
      `El recorte ${box.width}×${box.height} no tiene la proporción de ${width}×${height}`,
    )

  const out = new Uint8Array(width * height * 4)
  const { data } = image
  for (let oy = 0; oy < height; oy++) {
    const y0 = box.y + oy * scaleY
    const y1 = y0 + scaleY
    for (let ox = 0; ox < width; ox++) {
      const x0 = box.x + ox * scaleX
      const x1 = x0 + scaleX
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0)
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          // Fuera de la imagen cuenta como transparente.
          if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue
          const wx = Math.min(x + 1, x1) - Math.max(x, x0)
          const i = (y * image.width + x) * 4
          const weight = (data[i + 3] / 255) * wx * wy
          r += data[i] * weight
          g += data[i + 1] * weight
          b += data[i + 2] * weight
          a += weight
        }
      }
      const j = (oy * width + ox) * 4
      if (a > 0) {
        out[j] = Math.round(r / a)
        out[j + 1] = Math.round(g / a)
        out[j + 2] = Math.round(b / a)
      }
      out[j + 3] = Math.round((a / (scaleX * scaleY)) * 255)
    }
  }
  return { width, height, data: out }
}

// Antialias estrecho, como en los spritesheets; lo transparente no guarda color.
export function snapAlpha(image: RgbaImage): RgbaImage {
  const result = copy(image)
  const { data } = result
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 240) data[i] = 255
    else if (data[i] <= 15) data[i] = 0
    if (!data[i]) data[i - 3] = data[i - 2] = data[i - 1] = 0
  }
  return result
}

export type ImageComparison = {
  // Píxeles visibles en alguna de las dos que no son idénticos.
  mismatched: number
  // Error medio por canal en los píxeles sólidos en ambas (alfa ≥ 200), de 0 a 255.
  // En los bordes semitransparentes el color de referencia incluye el polvo que se limpia.
  meanRgbError: number
  // Píxeles con algún canal desviado más de 40: detalle perdido.
  pixelsOver40: number
  // Píxeles que aparecen o desaparecen.
  alphaFlips: number
}

const SOLID = 200

export function compareImages(a: RgbaImage, b: RgbaImage): ImageComparison {
  let mismatched = 0
  let error = 0
  let both = 0
  let pixelsOver40 = 0
  let alphaFlips = 0
  for (let i = 0; i < a.data.length; i += 4) {
    const alphaA = a.data[i + 3]
    const alphaB = b.data[i + 3]
    if (!alphaA && !alphaB) continue
    if ([0, 1, 2, 3].some((c) => a.data[i + c] !== b.data[i + c])) mismatched++
    if (Math.abs(alphaA - alphaB) > 128) alphaFlips++
    if (alphaA < SOLID || alphaB < SOLID) continue
    const diffs = [0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c]))
    error += diffs[0] + diffs[1] + diffs[2]
    both++
    if (Math.max(...diffs) > 40) pixelsOver40++
  }
  return {
    mismatched,
    meanRgbError: both ? error / both / 3 : 0,
    pixelsOver40,
    alphaFlips,
  }
}
