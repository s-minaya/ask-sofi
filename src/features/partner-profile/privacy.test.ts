import { describe, expect, it } from 'vitest'

// Contrato de privacidad del expediente (004-spec §6, AGENTS «Storage and
// privacy»): el código que lo trata no escribe en consola ni sale a la red, y
// solo accede al almacenamiento a través de la infraestructura de 003. Es una
// guardia sobre el código; la comprobación en navegador está en e2e/profile-privacy.
const sources = {
  ...import.meta.glob('./*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('../../domain/partner-profile/*.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('../../infrastructure/storage/partnerProfileStorage.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('../../infrastructure/storage/onboardingStorage.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
} as Record<string, string>

const production = Object.entries(sources).filter(
  ([path]) => !/\.test\.tsx?$/.test(path),
)

const FORBIDDEN: Array<[string, RegExp]> = [
  ['escribir en consola', /\bconsole\s*\./],
  ['pedir algo por la red', /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/],
  ['enviar una baliza', /sendBeacon/],
  ['cargar una imagen remota por código', /new Image\(/],
  [
    'acceder al almacenamiento directamente',
    /\b(localStorage|sessionStorage|indexedDB)\b/,
  ],
  ['escribir cookies', /document\.cookie/],
]

describe('privacidad del expediente', () => {
  it('revisa los ficheros del expediente', () => {
    expect(production.length).toBeGreaterThan(10)
  })

  for (const [what, pattern] of FORBIDDEN) {
    it(`ningún fichero del expediente intenta ${what}`, () => {
      const offenders = production
        .filter(([, code]) => pattern.test(code))
        .map(([path]) => path)
      expect(offenders).toEqual([])
    })
  }
})
