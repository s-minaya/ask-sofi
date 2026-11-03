import { describe, expect, it } from 'vitest'

// Contrato estático de la carga de los sprites (plan 008 §10, «Build»; T043). Lo que la build
// confirma sobre sus archivos (`e2e/production-build.spec.ts`) tiene aquí su causa en el código:
// quién importa qué. Falla antes de compilar nada si alguien rompe la carga selectiva.
const OWNERS_DIR = '/src/components/sofi/sprites/'
const SPRITES_DIR = '/src/styles/sprites/'

const ownerSources = import.meta.glob<string>(
  [
    '/src/components/sofi/sprites/*.ts',
    '!/src/components/sofi/sprites/*.test.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
)
const globalStyles = import.meta.glob<string>('/src/styles/globals/*.scss', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const appSources = import.meta.glob<string>(
  [
    '/src/**/*.{ts,tsx,scss}',
    '!/src/**/*.test.{ts,tsx}',
    // Los .d.ts de los controladores no son código que importe nada.
    '!/src/**/*.d.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
)
const partials = import.meta.glob(`/src/styles/sprites/_*.scss`, {
  query: '?raw',
})

const withoutComments = (source: string) =>
  source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

describe('contrato estático de la carga de sprites', () => {
  // D-13: la carpeta no tiene un índice que arrastre todos los parciales a quien lo importe.
  it('no existe `_index.scss` en la carpeta de sprites ni nadie lo importa', () => {
    expect(Object.keys(partials)).not.toContain(`${SPRITES_DIR}_index.scss`)
    const offenders = Object.entries(appSources)
      .filter(([, source]) =>
        /sprites\/_?index\b/.test(withoutComments(source)),
      )
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })

  // Un sprite en los estilos globales viajaría con toda la aplicación (spec 008, Recursos).
  it('no hay sprites en los estilos globales', () => {
    expect(Object.keys(globalStyles).length).toBeGreaterThan(0)
    const offenders = Object.entries(globalStyles)
      .filter(([, source]) => /sprites?\b/i.test(withoutComments(source)))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })

  // E12: un glob central referenciaría desde la entrada las tiras de todos los recursos.
  it('cada módulo dueño solo lista las tiras de su propio prefijo', () => {
    const owners = Object.entries(ownerSources)
    expect(owners.length).toBe(14)
    for (const [path, source] of owners) {
      const id = path.slice(OWNERS_DIR.length, -'.ts'.length)
      const patterns = [
        ...withoutComments(source).matchAll(
          /'(\/src\/styles\/sprites\/[^']*)'/g,
        ),
      ].map((match) => match[1])

      expect(patterns.sort(), id).toEqual(
        [`${SPRITES_DIR}${id}-*.webp`, `${SPRITES_DIR}${id}.webp`].sort(),
      )
    }
  })

  it('ningún otro código de la aplicación lista las tiras con un glob', () => {
    const offenders = Object.entries(appSources)
      .filter(([path]) => !path.startsWith(OWNERS_DIR))
      .filter(([, source]) => {
        const code = withoutComments(source)
        return /import\.meta\.glob/.test(code) && /styles\/sprites/.test(code)
      })
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
