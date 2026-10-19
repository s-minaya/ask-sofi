import { describe, expect, it } from 'vitest'

// Guardia sobre el código (tech-stack §24 y §59, 005-spec «Núcleo y errores»): el
// dominio no depende de React, de SDKs de proveedores, del almacenamiento del
// navegador, del Design Lab ni del redactor. Una lista blanca de importaciones
// cubre todo lo anterior a la vez y falla ante cualquier dependencia nueva.
const read = (sources: Record<string, unknown>) =>
  Object.entries(sources as Record<string, string>).filter(
    ([path]) => !/\.test\.tsx?$/.test(path),
  )

const domain = read(
  import.meta.glob('./*.ts', { query: '?raw', import: 'default', eager: true }),
)
// Solo el fake: los adaptadores reales de la misma carpeta (006) llaman a la red.
const fake = read(
  import.meta.glob('../../infrastructure/ai/fakeDecisionProvider.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)

const importsOf = (code: string) =>
  [
    ...code.matchAll(
      /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g,
    ),
    ...code.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm),
  ].map((match) => match[1])

// ./x del propio dominio, ../x de otro módulo de src/domain, y Zod. Nada más.
const allowedInDomain = (specifier: string) =>
  specifier === 'zod/mini' ||
  specifier.startsWith('./') ||
  /^\.\.\/(?!\.\.\/)/.test(specifier)

// El fake implementa el contrato del dominio: solo puede conocer el dominio de análisis.
const allowedInFake = (specifier: string) =>
  specifier.startsWith('../../domain/analysis/')

const FORBIDDEN_USES: Array<[string, RegExp]> = [
  ['escribir en consola', /\bconsole\s*\./],
  ['pedir algo por la red', /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/],
  ['enviar una baliza', /sendBeacon/],
  [
    'acceder al almacenamiento',
    /\b(localStorage|sessionStorage|indexedDB)\b|document\.cookie/,
  ],
  ['tocar el DOM o la ventana', /\b(document|window|navigator)\./],
  ['depender del azar o de la hora', /Math\.random|Date\.now|new Date\(/],
]

describe('pureza del dominio de análisis', () => {
  it('revisa los ficheros del dominio y del proveedor falso', () => {
    expect(domain.length).toBeGreaterThanOrEqual(7)
    expect(fake.length).toBeGreaterThanOrEqual(1)
  })

  it('el dominio solo importa de sí mismo, del expediente de 004 y de Zod', () => {
    const offenders = domain.flatMap(([path, code]) =>
      importsOf(code)
        .filter((specifier) => !allowedInDomain(specifier))
        .map((specifier) => `${path} → ${specifier}`),
    )

    expect(offenders).toEqual([])
  })

  it('el dominio no sale de src/domain', () => {
    const offenders = domain.flatMap(([path, code]) =>
      importsOf(code)
        .filter((specifier) => /^\.\.\/[^/]+\//.test(specifier))
        .filter((specifier) => !specifier.startsWith('../partner-profile/'))
        .map((specifier) => `${path} → ${specifier}`),
    )

    expect(offenders).toEqual([])
  })

  it('el proveedor falso solo importa el contrato del dominio de análisis', () => {
    const offenders = fake.flatMap(([path, code]) =>
      importsOf(code)
        .filter((specifier) => !allowedInFake(specifier))
        .map((specifier) => `${path} → ${specifier}`),
    )

    expect(offenders).toEqual([])
  })

  for (const [what, pattern] of FORBIDDEN_USES) {
    it(`ni el dominio ni el fake intentan ${what}`, () => {
      const offenders = [...domain, ...fake]
        .filter(([, code]) => pattern.test(code))
        .map(([path]) => path)

      expect(offenders).toEqual([])
    })
  }
})
