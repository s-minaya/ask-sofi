// Comprueba que el bundle del cliente no contiene nada del servidor:
//   npm run build && npm run verify:bundle
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { findLeaks } from './clientBundle.ts'

const DIST = resolve(import.meta.dirname, '..', 'dist')
const TEXT = /\.(js|mjs|css|html|map|json|txt|svg)$/

function textFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return textFiles(path)
    return TEXT.test(entry.name) ? [path] : []
  })
}

const files = Object.fromEntries(
  textFiles(DIST).map((path) => [
    relative(DIST, path).replaceAll('\\', '/'),
    readFileSync(path, 'utf-8'),
  ]),
)
const leaks = findLeaks(files)

if (leaks.length > 0) {
  for (const { file, found } of leaks)
    console.error(`${file}: contiene «${found}»`)
  process.exit(1)
}
console.log(
  `Bundle del cliente limpio (${Object.keys(files).length} ficheros revisados).`,
)
