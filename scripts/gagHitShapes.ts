// Zona sensible de Sofi en la insignia (T066, prototipo del Design Lab): las partes visibles del
// sprite como máscara por bloques, para recortar con ella el área que responde al toque.
// Lógica pura sobre el canal alfa; la lectura de los WebP y la escritura del SCSS viven en
// `generateGagHitShapes.ts`.

export type Alpha = { width: number; height: number; data: Uint8Array }

// `cells[r * cols + c]` es 1 si el bloque (c, r) es sensible.
export type Mask = { cols: number; rows: number; cells: Uint8Array }

export type Rect = { x: number; y: number; width: number; height: number }

// Un bloque es sensible si algún píxel suyo llega al umbral: la máscara cubre siempre lo que se
// ve (nunca recorta un píxel pintado) y se pasa, como mucho, un bloque de píxeles de borde.
export function blockMask(
  alpha: Alpha,
  block: number,
  threshold: number,
): Mask {
  const cols = Math.ceil(alpha.width / block)
  const rows = Math.ceil(alpha.height / block)
  const cells = new Uint8Array(cols * rows)
  for (let y = 0; y < alpha.height; y++)
    for (let x = 0; x < alpha.width; x++)
      if (alpha.data[y * alpha.width + x] >= threshold)
        cells[Math.floor(y / block) * cols + Math.floor(x / block)] = 1
  return { cols, rows, cells }
}

// Pega `source` en `canvas` desplazada (atX, atY), con el mayor alfa donde se solapan. Lo que
// cae fuera del lienzo se descarta.
export function pasteAlpha(
  canvas: Alpha,
  source: Alpha,
  atX: number,
  atY: number,
): void {
  for (let y = 0; y < source.height; y++) {
    const cy = y + atY
    if (cy < 0 || cy >= canvas.height) continue
    for (let x = 0; x < source.width; x++) {
      const cx = x + atX
      if (cx < 0 || cx >= canvas.width) continue
      const value = source.data[y * source.width + x]
      const at = cy * canvas.width + cx
      if (value > canvas.data[at]) canvas.data[at] = value
    }
  }
}

export function cropAlpha(alpha: Alpha, rect: Rect): Alpha {
  const data = new Uint8Array(rect.width * rect.height)
  for (let y = 0; y < rect.height; y++)
    for (let x = 0; x < rect.width; x++) {
      const sx = rect.x + x
      const sy = rect.y + y
      if (sx >= 0 && sx < alpha.width && sy >= 0 && sy < alpha.height)
        data[y * rect.width + x] = alpha.data[sy * alpha.width + sx]
    }
  return { width: rect.width, height: rect.height, data }
}

// Rectángulos disjuntos que cubren exactamente la máscara: cada fila se parte en tramos y los
// tramos iguales de filas contiguas se unen, para que el trazado sea corto.
export function maskRects(mask: Mask): Rect[] {
  const rects: Rect[] = []
  // Los rectángulos de la fila anterior que aún pueden crecer hacia abajo, por «x:ancho».
  let open = new Map<string, Rect>()
  for (let r = 0; r < mask.rows; r++) {
    const next = new Map<string, Rect>()
    let c = 0
    while (c < mask.cols) {
      if (!mask.cells[r * mask.cols + c]) {
        c++
        continue
      }
      const start = c
      while (c < mask.cols && mask.cells[r * mask.cols + c]) c++
      const key = `${start}:${c - start}`
      const above = open.get(key)
      if (above) {
        above.height++
        next.set(key, above)
      } else {
        const rect = { x: start, y: r, width: c - start, height: 1 }
        rects.push(rect)
        next.set(key, rect)
      }
    }
    open = next
  }
  return rects
}

// Trazado de `clip-path: path()`: un subtrazado por rectángulo, con órdenes relativas. Vacío si
// la máscara no tiene ningún bloque.
export function maskToPath(mask: Mask): string {
  return maskRects(mask)
    .map(
      ({ x, y, width, height }) => `M${x} ${y}h${width}v${height}h${-width}Z`,
    )
    .join('')
}

// --- Qué se recorta de cada tira ---------------------------------------------------------------

// El anfitrión mide 128 px y el fotograma 384: un bloque de 3 px de sprite es 1 px de pantalla.
const BLOCK = 3
const FRAME = 384
// El cuerpo solo importa para el toque: un píxel apenas visible no cuenta. Las capas se recortan
// también al pintar, así que ahí entra cualquier píxel que no sea transparente del todo y no se
// pierde ni uno pintado.
const BODY_THRESHOLD = 32
const LAYER_THRESHOLD = 1

type Piece = { file: string; crop?: Rect; at?: [number, number] }
type ShapeSpec =
  | { kind: 'body'; pieces: Piece[] }
  | { kind: 'layer'; width: number; height: number; piece: Piece }

const at = (x: number, y: number): [number, number] => [x, y]

// Las cajas son las de los parciales (`_sofi-blink`, `_poking`, `_are-u-still-here`): cada pose
// ocupa en el fotograma el sitio que le da su parcial. Cada estado de la insignia usa la suya.
const IDLE: Piece = {
  file: 'sofi-blink.webp',
  crop: { x: 0, y: 0, width: FRAME, height: FRAME },
}
const HIDE = 'poking-hide.webp'
const layerOf = (width: number, height: number, y: number): ShapeSpec => ({
  kind: 'layer',
  width,
  height,
  piece: { file: HIDE, crop: { x: 0, y, width, height } },
})

export const HIT_SHAPE_SPECS: Record<string, ShapeSpec> = {
  // Reposo, curiosa, escéptica, somnolienta y las miradas: el fotograma 0 de `sofi-blink`.
  idle: { kind: 'body', pieces: [IDLE] },
  // «¡Quieto!»: el reposo con la palma levantada.
  stop: {
    kind: 'body',
    pieces: [
      IDLE,
      {
        file: 'poking-face.webp',
        crop: { x: 528, y: 0, width: 136, height: 160 },
        at: at(40, 224),
      },
    ],
  },
  // Ofendida y su vuelta: la pose entera.
  offended: { kind: 'body', pieces: [{ file: 'poking.webp' }] },
  nodding: {
    kind: 'body',
    pieces: [
      {
        file: 'are-u-still-here.webp',
        crop: { x: 0, y: 0, width: 304, height: 304 },
        at: at(48, 80),
      },
    ],
  },
  asleep: {
    kind: 'body',
    pieces: [
      {
        file: 'are-u-still-here.webp',
        crop: { x: 304, y: 0, width: 328, height: 288 },
        at: at(48, 96),
      },
    ],
  },
  // Susto y pillada: la misma pose.
  startled: {
    kind: 'body',
    pieces: [
      {
        file: 'are-u-still-here.webp',
        crop: { x: 632, y: 0, width: 344, height: 304 },
        at: at(32, 80),
      },
    ],
  },
  // Escondida (cabeza y manos de la celda 05) y asomada (06), de `poking-hide.webp`.
  'head-hide': layerOf(296, 208, 210),
  'head-peek': layerOf(296, 208, 0),
  'hands-hide': layerOf(208, 32, 420),
  'hands-peek': layerOf(208, 32, 454),
}

// `load` devuelve el canal alfa de una tira por su nombre de archivo.
export async function buildHitShapes(
  load: (file: string) => Promise<Alpha>,
): Promise<Record<string, Mask>> {
  const shapes: Record<string, Mask> = {}
  for (const [name, spec] of Object.entries(HIT_SHAPE_SPECS)) {
    if (spec.kind === 'layer') {
      const source = await load(spec.piece.file)
      const piece = cropAlpha(source, spec.piece.crop!)
      shapes[name] = blockMask(piece, BLOCK, LAYER_THRESHOLD)
      continue
    }
    const canvas: Alpha = {
      width: FRAME,
      height: FRAME,
      data: new Uint8Array(FRAME * FRAME),
    }
    for (const piece of spec.pieces) {
      const source = await load(piece.file)
      const [x, y] = piece.at ?? [0, 0]
      pasteAlpha(
        canvas,
        piece.crop ? cropAlpha(source, piece.crop) : source,
        x,
        y,
      )
    }
    shapes[name] = blockMask(canvas, BLOCK, BODY_THRESHOLD)
  }
  return shapes
}

// El parcial SCSS que usa el Lab: un mapa de trazados por nombre de forma.
export function renderHitShapesScss(paths: Record<string, string>): string {
  // Con el formato de Prettier: lo que pasa de 80 columnas baja a la línea siguiente.
  const rows = Object.entries(paths).flatMap(([name, path]) => {
    const line = `  ${name}: '${path}',`
    return line.length > 80 ? [`  ${name}:`, `    '${path}',`] : [line]
  })
  return [
    '// Generado por scripts/generateGagHitShapes.ts a partir de las tiras de src/styles/sprites/:',
    '// no se edita a mano (`npm run assets:gag-hit`). Zona sensible de Sofi en la insignia (T066).',
    '// Cada trazado es un `clip-path: path()` en px de pantalla: 1 px = un bloque de 3 px de sprite.',
    '$hit-shapes: (',
    ...rows,
    ');',
    '',
  ].join('\n')
}
