// Genera las hojas de revisión y etiquetado de E1 desde `cases.ts`:
//   npm run eval:sheets
// Solo escribe y borra `tanda-*.md` en `evals/jev/review/`: las hojas se
// regeneran enteras y no se editan a mano. Los ficheros que aprobó la autora
// (JSON y registro de etiquetas) no se tocan.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FIXTURES } from './cases.ts'
import { buildSheets } from './reviewSheet.ts'

const OUT = resolve(import.meta.dirname, '..', 'review')
mkdirSync(OUT, { recursive: true })
// Al cambiar el número de casos cambia el de tandas: se retiran las anteriores.
for (const name of readdirSync(OUT))
  if (/^tanda-\d+-de-\d+\.md$/.test(name)) rmSync(resolve(OUT, name))
for (const sheet of buildSheets(FIXTURES))
  writeFileSync(resolve(OUT, sheet.name), sheet.markdown, 'utf-8')
console.log(`Hojas escritas en ${OUT}`)
