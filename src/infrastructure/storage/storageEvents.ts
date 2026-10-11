// Avisos dentro del propio documento. El evento nativo `storage` solo llega
// a otros documentos, así que los borrados y cambios locales necesitan su
// propio canal para que React no conserve datos obsoletos.
//
// `all` es el borrado completo de datos de Ask Sofi.
export type StorageChangeScope = 'preferences' | 'consultation' | 'all'

type Listener = (scope: StorageChangeScope) => void

const listeners = new Set<Listener>()

export function emitStorageChange(scope: StorageChangeScope): void {
  for (const listener of [...listeners]) listener(scope)
}

export function subscribeToStorageChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
