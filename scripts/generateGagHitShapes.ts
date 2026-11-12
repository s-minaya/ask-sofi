// Regenera el parcial SCSS de la zona sensible de Sofi en la insignia (T066, Design Lab):
//   npm run assets:gag-hit
// Solo hace falta si cambian las tiras de `src/styles/sprites/`.
import { writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import { generateHitShapesScss, HIT_SHAPES_SCSS } from './gagHitShapesFiles.ts'

const scss = await generateHitShapesScss()
writeFileSync(HIT_SHAPES_SCSS, scss)
console.log(
  `${relative(process.cwd(), HIT_SHAPES_SCSS)}: ${scss.length} caracteres`,
)
