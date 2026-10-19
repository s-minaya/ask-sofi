import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_KEY, gateway } from '../../../src/test/jevGateway.ts'
import { main, type Io } from './run.ts'

function io() {
  const lines: string[] = []
  const written: { path: string; content: string }[] = []
  const fake: Io = {
    log: (line) => lines.push(line),
    error: (line) => lines.push(`ERROR ${line}`),
    write: (path, content) => written.push({ path, content }),
  }
  return { fake, lines, written, text: () => lines.join('\n') }
}

describe('main: en seco por defecto', () => {
  it('cuenta peticiones, tokens y coste sin enviar nada ni escribir ficheros', async () => {
    const received = gateway()
    const { fake, text, written } = io()

    const code = await main([], {}, fake)

    expect(code).toBe(0)
    expect(received).toHaveLength(0)
    expect(written).toHaveLength(0)
    expect(text()).toMatch(/en seco/i)
    expect(text()).toMatch(/peticiones/i)
    expect(text()).toMatch(/tokens/i)
    expect(text()).toMatch(/\$/)
    expect(text()).toMatch(/--live/)
  })

  it('con la credencial en el entorno sigue en seco si no se pide --live', async () => {
    const received = gateway()
    const { fake } = io()

    const code = await main([], { AI_GATEWAY_API_KEY: API_KEY }, fake)

    expect(code).toBe(0)
    expect(received).toHaveLength(0)
  })

  it('informa de que las etiquetas de la autora están completas, sin avisar de pendientes', async () => {
    const { fake, text } = io()

    await main([], {}, fake)

    expect(text()).toMatch(/etiquetas.*65 casos.*cobertura cumplida/i)
    expect(text()).not.toMatch(/pendientes/i)
  })

  it('nunca imprime la credencial', async () => {
    const { fake, text } = io()

    await main([], { AI_GATEWAY_API_KEY: API_KEY }, fake)

    expect(text()).not.toContain(API_KEY)
  })
})

describe('main: argumentos inválidos', () => {
  it('--live sin credencial ni topes termina con error y no envía nada', async () => {
    const received = gateway()
    const { fake, text } = io()

    const code = await main(['--live'], {}, fake)

    expect(code).toBe(1)
    expect(received).toHaveLength(0)
    expect(text()).toMatch(/AI_GATEWAY_API_KEY/)
  })

  it('un argumento desconocido termina con error', async () => {
    const { fake } = io()

    expect(await main(['--nada'], {}, fake)).toBe(1)
  })
})

describe('main: --live (pasarela simulada)', () => {
  const LIVE = [
    '--live',
    '--only',
    'canary',
    '--arms',
    'english',
    '--repetitions',
    '1',
    '--max-requests',
    '100',
    '--max-cost-usd',
    '0.5',
    '--label',
    'prueba',
  ]

  it('ejecuta, escribe el informe con fecha y no incluye la credencial', async () => {
    const received = gateway()
    const { fake, written, text } = io()

    const code = await main(LIVE, { AI_GATEWAY_API_KEY: API_KEY }, fake)

    expect(code).toBe(0)
    expect(received.length).toBeGreaterThan(0)
    expect(written).toHaveLength(1)
    expect(written[0].path).toMatch(
      /evals[\\/]jev[\\/]reports[\\/]prueba-\d{4}-\d{2}-\d{2}T/,
    )
    expect(written[0].path).toMatch(/\.json$/)
    expect(written[0].content).not.toContain(API_KEY)
    expect(JSON.parse(written[0].content).requestedModel).toBe(
      'typesafe-ai/jev',
    )
    expect(text()).not.toContain(API_KEY)
  })

  it('si se detiene por un 402, escribe el informe parcial y termina con error', async () => {
    gateway(() => HttpResponse.json({ error: {} }, { status: 402 }))
    const { fake, written, text } = io()

    const code = await main(LIVE, { AI_GATEWAY_API_KEY: API_KEY }, fake)

    expect(code).toBe(2)
    expect(JSON.parse(written[0].content).halted).toBe('status_402')
    expect(text()).toMatch(/status_402/)
  })
})
