import { localArea, sessionArea } from './storageAreas'
import type { StorageArea } from './storageArea'
import { emitStorageChange, subscribeToStorageChanges } from './storageEvents'
import {
  HISTORY_KEY_PREFIX,
  STORAGE_KEYS,
  STORAGE_NAMESPACE,
} from './storageKeys'

function removeWithPrefix(area: StorageArea, prefix: string) {
  // Se listan primero: borrar mientras se recorre desplaza los índices.
  for (const key of area.keys()) {
    if (key.startsWith(prefix)) area.remove(key)
  }
}

// Limpia solo el estado temporal de la consulta en curso.
export function clearConsultation(): void {
  sessionArea.remove(STORAGE_KEYS.consultationDraft)
  emitStorageChange('consultation')
}

// Elimina el historial persistente de Ask Sofi. Todavía no existe ningún
// dato de historial: la operación ya delimita qué le pertenecerá.
export function clearHistory(): void {
  removeWithPrefix(localArea, HISTORY_KEY_PREFIX)
}

// Elimina todo lo de Ask Sofi, en ambos almacenamientos y en memoria, y deja
// la aplicación en su estado inicial. No toca claves ajenas del mismo origen.
export function clearUserData(): void {
  // Lo que solo existía en memoria (por almacenamiento bloqueado) también es dato
  // del usuario. Se olvida antes de borrar para no perder las lápidas que deja
  // un borrado que el almacenamiento rechaza.
  localArea.resetMemory()
  sessionArea.resetMemory()
  removeWithPrefix(localArea, STORAGE_NAMESPACE)
  removeWithPrefix(sessionArea, STORAGE_NAMESPACE)
  emitStorageChange('all')
}

export function subscribeToUserDataCleared(listener: () => void): () => void {
  return subscribeToStorageChanges((scope) => {
    if (scope === 'all') listener()
  })
}
