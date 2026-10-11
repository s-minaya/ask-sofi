import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, relative } from 'node:path'

// Lo que se publica es solo lo que emite `vite build`: lo que importa `src/` más
// `public/`. Este contrato impide que material de trabajo llegue a producción.
const ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.webp',
  '.woff2',
  '.mp3',
])

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(directory, entry.name))
      : [join(directory, entry.name)],
  )
}

test.describe('production build', () => {
  // Una sola compilación compartida por las tres comprobaciones.
  test.describe.configure({ mode: 'serial' })

  let outDir = ''
  let files: string[] = []

  test.beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'ask-sofi-build-'))
    execFileSync(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'build',
        '--outDir',
        outDir,
        '--emptyOutDir',
      ],
      { stdio: 'pipe' },
    )
    files = listFiles(outDir).map((file) => relative(outDir, file))
  })

  test.afterAll(() => {
    rmSync(outDir, { recursive: true, force: true })
  })

  test('only publishes the web file types the application needs', () => {
    const unexpected = files.filter(
      (file) => !ALLOWED_EXTENSIONS.has(extname(file)),
    )
    expect(unexpected).toEqual([])
  })

  test('does not publish the art direction, the logo master or the MSW worker', () => {
    const forbidden = files.filter((file) =>
      /art-direction|logo-master|approved-screens|design-lab-c|mockServiceWorker/i.test(
        file,
      ),
    )
    expect(forbidden).toEqual([])
  })

  test('does not ship the Design Lab, the mocks or their copy in the bundle', () => {
    const code = files
      .filter((file) => file.endsWith('.js') || file.endsWith('.html'))
      .map((file) => readFileSync(join(outDir, file), 'utf8'))
      .join('\n')

    for (const marker of [
      'Design Lab',
      'Experience Preview',
      'Demo · datos simulados',
      'mockServiceWorker',
      'setupWorker',
    ]) {
      expect(code, marker).not.toContain(marker)
    }
  })
})
