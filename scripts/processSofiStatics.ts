// Procesa bajo demanda las imágenes estáticas de Sofi (tech-stack §46.1):
//   npm run assets:sofi            todas las del manifiesto
//   npm run assets:sofi -- <name>  solo las salidas que contienen <name>
// Lee los originales sin modificarlos y escribe los WebP de producción.
import { readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import sharp from 'sharp'
import {
  areaResize,
  binarizeAlpha,
  compareImages,
  removeBackground,
  removeSpecks,
  snapAlpha,
  type Crop,
  type RgbaImage,
} from './sofiStatics.ts'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCES = resolve(ROOT, 'spec/constitution/art-direction/sofi')
const OUTPUTS = resolve(ROOT, 'src/assets/sofi')

type Options = {
  width: number
  height: number
  // sharp no respeta paletas de 17–128 colores (devuelve 16); con 255 se
  // conservan los colores de detalle, como el morado del iris.
  colors: number
  minSpeckArea: number
}

type Asset = Partial<Options> & {
  source: string
  output: string
  crop?: Crop
  // Fondo opaco del original: lo conectado al borde con todos los canales ≤ este valor.
  background?: number
}

type Manifest = { defaults: Options; assets: Asset[] }

const manifest: Manifest = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'sofi-statics.json'), 'utf8'),
)

async function readRgba(input: string | Buffer): Promise<RgbaImage> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data: new Uint8Array(data) }
}

async function processAsset(asset: Asset) {
  const options = { ...manifest.defaults, ...asset }
  const source = resolve(SOURCES, asset.source)
  const output = resolve(OUTPUTS, asset.output)
  // Los originales nunca se sobrescriben.
  if (!output.startsWith(OUTPUTS))
    throw new Error(`Salida fuera de ${relative(ROOT, OUTPUTS)}: ${output}`)

  const read = await readRgba(source)
  // El fondo no es parte del dibujo: tampoco cuenta en la referencia de calidad.
  const original =
    asset.background === undefined
      ? read
      : removeBackground(read, asset.background)
  const size = {
    width: options.width,
    height: options.height,
    crop: asset.crop,
  }
  const { image: clean, removed } = removeSpecks(
    binarizeAlpha(original),
    options.minSpeckArea,
  )
  const resized = snapAlpha(areaResize(clean, size))

  const raw = {
    raw: { width: options.width, height: options.height, channels: 4 as const },
  }
  const indexed = await sharp(resized.data, raw)
    .png({ palette: true, colors: options.colors, dither: 0, effort: 10 })
    .toBuffer()
  const quantized = await readRgba(indexed)
  const webp = await sharp(quantized.data, raw)
    .webp({ lossless: true, effort: 6 })
    .toBuffer()

  // El WebP debe decodificarse exactamente como lo que se codificó.
  const decoded = await readRgba(webp)
  const roundTrip = compareImages(quantized, decoded)
  if (roundTrip.mismatched > 0)
    throw new Error(`${asset.output}: el WebP no es idéntico a lo codificado`)

  writeFileSync(output, webp)

  // Referencia: el mismo reescalado del original sin limpiar ni cuantizar.
  const quality = compareImages(areaResize(original, size), decoded)
  const colors = new Set<number>()
  for (let i = 0; i < decoded.data.length; i += 4)
    if (decoded.data[i + 3])
      colors.add(new DataView(decoded.data.buffer).getUint32(i))

  console.log(
    `${asset.output}: ${webp.length} B, ${colors.size} colores, ` +
      `error medio ${quality.meanRgbError.toFixed(2)}, ` +
      `${quality.pixelsOver40} px con error > 40, ` +
      `${quality.alphaFlips} px que aparecen o desaparecen, ` +
      `${removed.length} motas eliminadas`,
  )
}

const filter = process.argv[2]
const assets = manifest.assets.filter(
  (asset) => !filter || asset.output.includes(filter),
)
if (!assets.length) throw new Error(`Ningún asset coincide con «${filter}»`)
for (const asset of assets) await processAsset(asset)
