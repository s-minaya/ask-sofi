import { describe, expect, it } from 'vitest'

// Valida que el runner de unit tests funciona de extremo a extremo.
describe('vitest runner', () => {
  it('ejecuta una aserción de lógica pura', () => {
    const sum = [1, 2, 3].reduce((acc, value) => acc + value, 0)

    expect(sum).toBe(6)
  })
})
