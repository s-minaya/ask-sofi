export type PersistFailure = 'unavailable' | 'quota' | 'error' | 'newer-version'

// «persisted: false» significa que el valor solo vive en memoria durante esta
// sesión: quien guarda no debe presentarlo como conservado.
export type WriteResult =
  { persisted: true } | { persisted: false; reason: PersistFailure }

export type StorageArea = {
  read(key: string): string | null
  write(key: string, value: string): WriteResult
  remove(key: string): void
  keys(): string[]
  // Guarda solo en memoria y protege la clave: las escrituras siguientes tampoco
  // tocan el almacenamiento (p. ej. para no sobrescribir datos de una versión
  // futura). Solo `remove` levanta la protección.
  hold(key: string, value: string): void
  // Olvida lo que solo existía en memoria y las protecciones.
  resetMemory(): void
}

// Un navegador con el almacenamiento bloqueado lanza al acceder a la propiedad,
// no al usarla, así que el acceso se resuelve en cada operación.
type StorageGetter = () => Storage | null

function getStorage(getter: StorageGetter): Storage | null {
  try {
    return getter()
  } catch {
    return null
  }
}

function failureReason(error: unknown): PersistFailure {
  // DOMException no siempre hereda de Error entre realms, de ahí el duck typing.
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String(error.name)
      : ''
  // Firefox usa un nombre propio para la cuota agotada.
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ? 'quota'
    : 'error'
}

export function createStorageArea(getter: StorageGetter): StorageArea {
  // Valores que no han podido llegar al almacenamiento. `null` es una lápida:
  // la clave se eliminó pero el almacenamiento no dejó borrarla.
  const memory = new Map<string, string | null>()
  const held = new Set<string>()

  return {
    read(key) {
      if (memory.has(key)) return memory.get(key) ?? null
      const storage = getStorage(getter)
      if (!storage) return null
      try {
        return storage.getItem(key)
      } catch {
        return null
      }
    },

    write(key, value) {
      if (held.has(key)) {
        memory.set(key, value)
        return { persisted: false, reason: 'newer-version' }
      }
      const storage = getStorage(getter)
      if (!storage) {
        memory.set(key, value)
        return { persisted: false, reason: 'unavailable' }
      }
      try {
        storage.setItem(key, value)
        memory.delete(key)
        return { persisted: true }
      } catch (error) {
        memory.set(key, value)
        return { persisted: false, reason: failureReason(error) }
      }
    },

    remove(key) {
      held.delete(key)
      const storage = getStorage(getter)
      try {
        storage?.removeItem(key)
        memory.delete(key)
      } catch {
        memory.set(key, null)
      }
    },

    keys() {
      const found = new Set<string>()
      const storage = getStorage(getter)
      try {
        for (let index = 0; storage && index < storage.length; index++) {
          const key = storage.key(index)
          if (key !== null) found.add(key)
        }
      } catch {
        // Sin acceso: solo cuentan las claves en memoria.
      }
      for (const [key, value] of memory) {
        if (value === null) found.delete(key)
        else found.add(key)
      }
      return [...found]
    },

    hold(key, value) {
      memory.set(key, value)
      held.add(key)
    },

    resetMemory() {
      memory.clear()
      held.clear()
    },
  }
}
