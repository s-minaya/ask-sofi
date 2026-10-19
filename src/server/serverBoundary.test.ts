/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Guardas de la frontera cliente/servidor (006-plan §2 y §7). Leen el código
// fuente como texto: el cliente nunca debe poder importar el servidor ni los
// adaptadores reales, y solo `api/` toca el entorno del proceso.
const read = (files: Record<string, string>) =>
  Object.entries(files).filter(([path]) => !/\.test\.tsx?$/.test(path))

const sourceFiles = read(
  import.meta.glob<string>('/src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)
const apiFiles = read(
  import.meta.glob<string>('/api/**/*.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)

// Sin comentarios: una mención en un comentario no es un uso.
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const importsOf = (source: string) =>
  [
    ...code(source).matchAll(
      /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]/g,
    ),
  ].map((match) => match[1] ?? match[2])

// Lo que solo existe en el servidor. El cliente no lo importa.
const SERVER_ONLY = [
  /(^|\/)server\//,
  /\/jevDecisionProvider$/,
  /\/jevQuestions$/,
  /\/jevPolicyConfig$/,
  /\/englishPreparation$/,
  /\/language\//,
  /\/composeInterpret$/,
  /\/interpretHandler$/,
]

const isServerSide = (path: string) =>
  path.startsWith('/src/server/') ||
  path.startsWith('/src/infrastructure/language/') ||
  /^\/src\/infrastructure\/ai\/jev/.test(path) ||
  path.startsWith('/src/test/')

describe('detector de las guardas', () => {
  it('reconoce una importación del servidor y no se deja engañar por comentarios', () => {
    const violating = `import { x } from '../server/interpretHandler'`
    const commented = `// import { x } from '../server/interpretHandler'\nconst a = 1`

    expect(importsOf(violating)).toEqual(['../server/interpretHandler'])
    expect(importsOf(commented)).toEqual([])
    expect(
      SERVER_ONLY.some((rule) => rule.test('../server/interpretHandler')),
    ).toBe(true)
    expect(code('const a = process.env.X // process.env')).toContain(
      'process.env.X',
    )
    expect(code('// process.env.X')).not.toContain('process.env')
  })
})

describe('frontera cliente / servidor', () => {
  it('encuentra los ficheros que protege', () => {
    expect(sourceFiles.length).toBeGreaterThan(50)
    expect(apiFiles.map(([path]) => path)).toContain('/api/interpret.ts')
    expect(
      sourceFiles.some(([path]) => path === '/src/server/interpretHandler.ts'),
    ).toBe(true)
  })

  it('ningún módulo del cliente importa src/server ni los adaptadores reales', () => {
    const offenders = sourceFiles
      .filter(([path]) => !isServerSide(path))
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((target) => SERVER_ONLY.some((rule) => rule.test(target)))
          .map((target) => `${path} → ${target}`),
      )

    expect(offenders).toEqual([])
  })

  it('el cliente no importa nada de api/', () => {
    const offenders = sourceFiles.flatMap(([path, source]) =>
      importsOf(source)
        .filter((target) => /(^|\/)api\//.test(target))
        .map((target) => `${path} → ${target}`),
    )

    expect(offenders).toEqual([])
  })

  it('el servidor y api/ nunca importan el proveedor falso: no hay fallback al fake', () => {
    const server = [
      ...sourceFiles.filter(
        ([path]) => isServerSide(path) && !path.startsWith('/src/test/'),
      ),
      ...apiFiles,
    ]
    const offenders = server.flatMap(([path, source]) =>
      importsOf(source)
        .filter((target) => /fakeDecisionProvider/.test(target))
        .map((target) => `${path} → ${target}`),
    )

    expect(offenders).toEqual([])
  })

  it('el cliente no importa el proveedor falso fuera de las pruebas ni de la configuración de desarrollo', () => {
    // 005 lo creó para tests y escenarios; ningún componente lo usa hoy.
    const offenders = sourceFiles
      .filter(
        ([path]) =>
          !isServerSide(path) && !path.startsWith('/src/infrastructure/ai/'),
      )
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((target) => /fakeDecisionProvider/.test(target))
          .map((target) => `${path} → ${target}`),
      )

    expect(offenders).toEqual([])
  })
})

describe('entorno y credenciales', () => {
  it('solo api/ lee process.env', () => {
    const offenders = sourceFiles
      .filter(([, source]) => /process\.env\b/.test(code(source)))
      .map(([path]) => path)

    expect(offenders).toEqual([])
    expect(
      apiFiles.filter(([, source]) => /process\.env\b/.test(code(source))),
    ).toHaveLength(1)
  })

  it('ningún fichero del cliente ni del servidor usa variables VITE_ (llegarían al bundle)', () => {
    const offenders = [...sourceFiles, ...apiFiles]
      .filter(([, source]) => /VITE_/.test(code(source)))
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })

  it('api/ no contiene lógica: solo importa de src/server', () => {
    for (const [path, source] of apiFiles)
      for (const target of importsOf(source))
        expect(target, path).toMatch(/^\.\.\/src\/server\//)
  })

  it('el código del servidor no escribe en consola', () => {
    const server = [
      ...sourceFiles.filter(
        ([path]) => isServerSide(path) && !path.startsWith('/src/test/'),
      ),
      ...apiFiles,
    ]
    const offenders = server
      .filter(([, source]) => /\bconsole\./.test(code(source)))
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })

  it('.env.example no lleva valores reales ni prefijos que lleguen al cliente', () => {
    // Vite no permite importar ficheros .env*: se lee desde la raíz del proyecto.
    const envExample = readFileSync(
      resolve(process.cwd(), '.env.example'),
      'utf-8',
    )
    const assignments = envExample
      .split('\n')
      .filter((line) => /^[A-Z_][A-Z0-9_]*=/.test(line))

    expect(assignments.length).toBeGreaterThan(0)
    for (const line of assignments) {
      expect(line, line).toMatch(/^[A-Z_][A-Z0-9_]*=$/)
      expect(line, line).not.toMatch(/^VITE_/)
    }
  })
})
