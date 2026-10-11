import { describe, expect, it } from 'vitest'
import { createStorageArea } from './storageArea'

// Almacenamiento falso que permite simular los fallos reales del navegador.
function fakeStorage(options: { failWrites?: 'quota' | 'error' } = {}) {
  const data = new Map<string, string>()
  const storage = {
    get length() {
      return data.size
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (options.failWrites === 'quota')
        throw new DOMException('lleno', 'QuotaExceededError')
      if (options.failWrites === 'error') throw new Error('bloqueado')
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => data.clear(),
  } satisfies Storage
  return { storage, data }
}

describe('createStorageArea', () => {
  it('lee, escribe y elimina valores', () => {
    const { storage, data } = fakeStorage()
    const area = createStorageArea(() => storage)

    expect(area.read('a')).toBeNull()
    expect(area.write('a', '1')).toEqual({ persisted: true })
    expect(data.get('a')).toBe('1')
    expect(area.read('a')).toBe('1')

    area.remove('a')
    expect(data.has('a')).toBe(false)
    expect(area.read('a')).toBeNull()
  })

  it('lista las claves guardadas', () => {
    const { storage } = fakeStorage()
    const area = createStorageArea(() => storage)
    area.write('a', '1')
    area.write('b', '2')

    expect(area.keys().sort()).toEqual(['a', 'b'])
  })

  it('funciona en memoria cuando el almacenamiento no está disponible', () => {
    const area = createStorageArea(() => null)

    expect(area.read('a')).toBeNull()
    expect(area.write('a', '1')).toEqual({
      persisted: false,
      reason: 'unavailable',
    })
    expect(area.read('a')).toBe('1')
    expect(area.keys()).toEqual(['a'])

    area.remove('a')
    expect(area.read('a')).toBeNull()
  })

  it('no lanza si acceder al almacenamiento falla', () => {
    const area = createStorageArea(() => {
      throw new DOMException('denegado', 'SecurityError')
    })

    expect(area.read('a')).toBeNull()
    expect(area.write('a', '1').persisted).toBe(false)
    expect(area.read('a')).toBe('1')
    expect(() => area.remove('a')).not.toThrow()
  })

  it('distingue la cuota agotada y conserva el valor en memoria', () => {
    const { storage, data } = fakeStorage({ failWrites: 'quota' })
    const area = createStorageArea(() => storage)

    expect(area.write('a', '1')).toEqual({ persisted: false, reason: 'quota' })
    expect(data.size).toBe(0)
    expect(area.read('a')).toBe('1')
  })

  it('distingue un error de escritura cualquiera', () => {
    const { storage } = fakeStorage({ failWrites: 'error' })
    const area = createStorageArea(() => storage)

    expect(area.write('a', '1')).toEqual({ persisted: false, reason: 'error' })
    expect(area.read('a')).toBe('1')
  })

  it('el valor en memoria tiene prioridad sobre uno antiguo del almacenamiento', () => {
    const { storage, data } = fakeStorage({ failWrites: 'quota' })
    data.set('a', 'antiguo')
    const area = createStorageArea(() => storage)

    area.write('a', 'nuevo')

    expect(area.read('a')).toBe('nuevo')
    expect(data.get('a')).toBe('antiguo')
  })

  it('una escritura correcta descarta la copia en memoria', () => {
    let failing = true
    const { storage, data } = fakeStorage()
    const area = createStorageArea(() =>
      failing
        ? {
            ...storage,
            getItem: storage.getItem,
            setItem: () => {
              throw new Error('bloqueado')
            },
          }
        : storage,
    )

    area.write('a', '1')
    failing = false
    area.write('a', '2')
    data.set('a', '3')

    // Si la copia en memoria siguiera viva, devolvería «2» en lugar de lo guardado.
    expect(area.read('a')).toBe('3')
  })

  it('no resucita un valor eliminado cuando el almacenamiento no deja borrar', () => {
    const { storage, data } = fakeStorage()
    data.set('a', '1')
    const area = createStorageArea(() => ({
      ...storage,
      getItem: storage.getItem,
      removeItem: () => {
        throw new Error('bloqueado')
      },
    }))

    area.remove('a')

    expect(area.read('a')).toBeNull()
  })

  it('mantiene un valor solo en memoria sin tocar el almacenamiento', () => {
    const { storage, data } = fakeStorage()
    data.set('a', 'versión futura')
    const area = createStorageArea(() => storage)

    area.hold('a', 'copia de sesión')

    expect(area.read('a')).toBe('copia de sesión')
    expect(data.get('a')).toBe('versión futura')
  })

  it('una clave retenida no vuelve a escribirse en el almacenamiento', () => {
    const { storage, data } = fakeStorage()
    data.set('a', 'versión futura')
    const area = createStorageArea(() => storage)
    area.hold('a', 'primera copia')

    expect(area.write('a', 'segunda copia')).toEqual({
      persisted: false,
      reason: 'newer-version',
    })
    expect(area.read('a')).toBe('segunda copia')
    expect(data.get('a')).toBe('versión futura')

    // Borrar es una decisión explícita y sí levanta la protección.
    area.remove('a')
    expect(data.has('a')).toBe(false)
    expect(area.write('a', 'nueva')).toEqual({ persisted: true })
  })

  it('reset olvida la memoria sin tocar el almacenamiento', () => {
    const { storage, data } = fakeStorage({ failWrites: 'error' })
    data.set('a', 'guardado')
    const area = createStorageArea(() => storage)
    area.write('a', 'solo memoria')

    area.resetMemory()

    expect(area.read('a')).toBe('guardado')
  })
})
