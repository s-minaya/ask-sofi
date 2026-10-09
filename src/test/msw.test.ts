import { describe, expect, it } from 'vitest'

describe('msw', () => {
  it('intercepta un endpoint de prueba sin servicios externos', async () => {
    const response = await fetch('https://ask-sofi.test/api/ping')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('falla ante peticiones no manejadas', async () => {
    await expect(fetch('https://unhandled.test/api')).rejects.toThrow()
  })
})
