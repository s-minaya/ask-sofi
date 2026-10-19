import { describe, expect, it } from 'vitest'
import { FORBIDDEN_IN_CLIENT, findLeaks } from './clientBundle.ts'

describe('findLeaks', () => {
  it('no encuentra nada en un bundle limpio', () => {
    expect(
      findLeaks({
        'assets/index-abc.js': 'fetch("/api/interpret",{method:"POST"})',
        'index.html': '<div id="root"></div>',
      }),
    ).toEqual([])
  })

  it.each(FORBIDDEN_IN_CLIENT)(
    'detecta «%s» y dice en qué fichero',
    (needle) => {
      const leaks = findLeaks({
        'assets/limpio.js': 'console.log("hola")',
        'assets/index-abc.js': `const x = "${needle}"`,
      })

      expect(leaks).toEqual([{ file: 'assets/index-abc.js', found: needle }])
    },
  )

  it('informa de cada fichero y cada cadena, sin repetir', () => {
    const leaks = findLeaks({
      'a.js': 'ai-gateway.vercel.sh AI_GATEWAY_API_KEY ai-gateway.vercel.sh',
      'b.js': 'AI_GATEWAY_API_KEY',
    })

    expect(leaks).toEqual([
      { file: 'a.js', found: 'ai-gateway.vercel.sh' },
      { file: 'a.js', found: 'AI_GATEWAY' },
      { file: 'b.js', found: 'AI_GATEWAY' },
    ])
  })

  it('nunca devuelve el contenido del fichero, solo la cadena buscada', () => {
    const leaks = findLeaks({ 'a.js': 'secreto AI_GATEWAY_API_KEY=sk-123' })

    expect(JSON.stringify(leaks)).not.toContain('sk-123')
  })
})
