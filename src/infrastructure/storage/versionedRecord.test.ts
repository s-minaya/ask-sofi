import * as z from 'zod/mini'
import { describe, expect, it } from 'vitest'
import { createStorageArea } from './storageArea'
import { readRecord, writeRecord } from './versionedRecord'

const spec = {
  version: 2,
  schema: z.object({ name: z.string() }),
}

function setup(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set('k', initial)
  const area = createStorageArea(
    () =>
      ({
        length: data.size,
        key: (index: number) => [...data.keys()][index] ?? null,
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
        clear: () => data.clear(),
      }) satisfies Storage,
  )
  return { area, data }
}

describe('readRecord', () => {
  it('indica que no hay nada guardado', () => {
    expect(readRecord(setup().area, 'k', spec)).toEqual({ status: 'missing' })
  })

  it('devuelve un valor válido de la versión actual', () => {
    const { area } = setup(
      JSON.stringify({ version: 2, data: { name: 'Ana' } }),
    )

    expect(readRecord(area, 'k', spec)).toEqual({
      status: 'ok',
      value: { name: 'Ana' },
    })
  })

  it.each([
    ['JSON roto', '{no es json'],
    ['texto plano', 'hola'],
    ['sin envoltorio', JSON.stringify({ name: 'Ana' })],
    ['versión no numérica', JSON.stringify({ version: '2', data: {} })],
    ['versión decimal', JSON.stringify({ version: 1.5, data: {} })],
    ['datos con otra forma', JSON.stringify({ version: 2, data: { name: 7 } })],
    ['datos ausentes', JSON.stringify({ version: 2 })],
    ['null', 'null'],
  ])('trata como inválido: %s', (_case, raw) => {
    expect(readRecord(setup(raw).area, 'k', spec)).toEqual({
      status: 'invalid',
    })
  })

  it('trata como inválida una versión anterior sin migración conocida', () => {
    const { area } = setup(
      JSON.stringify({ version: 1, data: { name: 'Ana' } }),
    )

    expect(readRecord(area, 'k', spec)).toEqual({ status: 'invalid' })
  })

  it('reconoce una versión futura sin interpretarla', () => {
    const { area } = setup(
      JSON.stringify({ version: 3, data: { otra: 'forma' } }),
    )

    expect(readRecord(area, 'k', spec)).toEqual({
      status: 'newer-version',
      version: 3,
    })
  })
})

describe('writeRecord', () => {
  it('guarda con el formato versionado', () => {
    const { area, data } = setup()

    expect(writeRecord(area, 'k', spec, { name: 'Ana' })).toEqual({
      persisted: true,
    })
    expect(JSON.parse(data.get('k') ?? '')).toEqual({
      version: 2,
      data: { name: 'Ana' },
    })
  })

  it('sustituye datos corruptos', () => {
    const { area, data } = setup('{roto')

    writeRecord(area, 'k', spec, { name: 'Ana' })

    expect(JSON.parse(data.get('k') ?? '').data).toEqual({ name: 'Ana' })
  })

  it('no sobrescribe datos de una versión futura y los sigue sirviendo en memoria', () => {
    const future = JSON.stringify({ version: 3, data: { otra: 'forma' } })
    const { area, data } = setup(future)

    expect(writeRecord(area, 'k', spec, { name: 'Ana' })).toEqual({
      persisted: false,
      reason: 'newer-version',
    })

    expect(data.get('k')).toBe(future)
    expect(readRecord(area, 'k', spec)).toEqual({
      status: 'ok',
      value: { name: 'Ana' },
    })

    // Un segundo guardado tampoco debe llegar a pisar los datos futuros.
    expect(writeRecord(area, 'k', spec, { name: 'Bea' }).persisted).toBe(false)
    expect(data.get('k')).toBe(future)
  })
})
