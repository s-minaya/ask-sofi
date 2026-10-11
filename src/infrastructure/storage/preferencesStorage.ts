import * as z from 'zod/mini'
import { localArea } from './storageAreas'
import type { WriteResult } from './storageArea'
import { emitStorageChange, subscribeToStorageChanges } from './storageEvents'
import { LEGACY_THEME_KEY, STORAGE_KEYS } from './storageKeys'
import { readRecord, writeRecord } from './versionedRecord'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const SOUND_PREFERENCES = ['off', 'on'] as const
export type SoundPreference = (typeof SOUND_PREFERENCES)[number]

export type Preferences = {
  theme: ThemePreference
  sound: SoundPreference
}

// Solo lo que existe hoy. Nuevas preferencias se añaden aquí cuando una
// feature las necesite.
export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  sound: 'off',
}

// Cada campo se valida por separado: un valor desconocido no hace perder el resto.
const preferencesSchema = z.object({
  theme: z.catch(z.enum(THEME_PREFERENCES), DEFAULT_PREFERENCES.theme),
  sound: z.catch(z.enum(SOUND_PREFERENCES), DEFAULT_PREFERENCES.sound),
})

const PREFERENCES_RECORD = { version: 1, schema: preferencesSchema }

// Formato de la feature 002: solo el tema, en su propia clave.
const legacyThemeRecord = {
  version: 1,
  schema: z.enum(THEME_PREFERENCES),
}

export function readPreferences(): Preferences {
  const current = readRecord(
    localArea,
    STORAGE_KEYS.preferences,
    PREFERENCES_RECORD,
  )
  if (current.status === 'ok') return current.value
  // Datos inválidos o de una versión futura nunca se utilizan: valores por defecto.
  if (current.status !== 'missing') return DEFAULT_PREFERENCES

  const legacy = readRecord(localArea, LEGACY_THEME_KEY, legacyThemeRecord)
  return legacy.status === 'ok'
    ? { ...DEFAULT_PREFERENCES, theme: legacy.value }
    : DEFAULT_PREFERENCES
}

export function updatePreferences(patch: Partial<Preferences>): WriteResult {
  const result = writeRecord(
    localArea,
    STORAGE_KEYS.preferences,
    PREFERENCES_RECORD,
    {
      ...readPreferences(),
      ...patch,
    },
  )
  // Con la preferencia ya en su clave nueva, el rastro de la feature 002 sobra.
  if (result.persisted) localArea.remove(LEGACY_THEME_KEY)
  emitStorageChange('preferences')
  return result
}

// Cambios del propio documento, borrados y cambios hechos desde otro documento
// del mismo origen (p. ej. la vista previa del Design Lab dentro de un iframe).
export function subscribeToPreferences(
  listener: (preferences: Preferences) => void,
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEYS.preferences ||
      event.key === LEGACY_THEME_KEY ||
      // `localStorage.clear()` en otro documento llega sin clave.
      event.key === null
    )
      listener(readPreferences())
  }
  window.addEventListener('storage', onStorage)
  const unsubscribeLocal = subscribeToStorageChanges((scope) => {
    if (scope === 'preferences' || scope === 'all') listener(readPreferences())
  })
  return () => {
    window.removeEventListener('storage', onStorage)
    unsubscribeLocal()
  }
}
