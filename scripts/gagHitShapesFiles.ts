// Lee las tiras de Sofi y produce el parcial SCSS de la zona sensible (T066, Design Lab). Solo
// lee: no modifica ninguna tira ni controlador. La lógica pura está en `gagHitShapes.ts`.
import { resolve } from 'node:path'
import sharp from 'sharp'
import {
  buildHitShapes,
  maskToPath,
  renderHitShapesScss,
  type Alpha,
} from './gagHitShapes.ts'

const ROOT = resolve(import.meta.dirname, '..')
export const SPRITES = resolve(ROOT, 'src/styles/sprites')
export const HIT_SHAPES_SCSS = resolve(
  ROOT,
  'src/design-lab/sections/_gagHitShapes.scss',
)

async function loadAlpha(file: string): Promise<Alpha> {
  const { data, info } = await sharp(resolve(SPRITES, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const alpha = new Uint8Array(info.width * info.height)
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * info.channels + 3]
  return { width: info.width, height: info.height, data: alpha }
}

export async function generateHitShapesScss(): Promise<string> {
  const masks = await buildHitShapes(loadAlpha)
  const paths = Object.fromEntries(
    Object.entries(masks).map(([name, mask]) => [name, maskToPath(mask)]),
  )
  return renderHitShapesScss(paths)
}
