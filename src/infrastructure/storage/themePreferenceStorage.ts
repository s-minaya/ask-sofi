import * as z from 'zod/mini'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

// Adaptador mínimo para la preferencia de tema. La capa general de
// persistencia llegará con la feature 003; esto no la anticipa.
export const THEME_STORAGE_KEY = 'ask-sofi:theme'
const DEFAULT_PREFERENCE: ThemePreference = 'system'

// Los datos persistidos llevan versión para poder migrarlos o ignorarlos.
const storedThemeSchema = z.object({
  version: z.literal(1),
  data: z.enum(THEME_PREFERENCES),
})

function getStorage(): Storage | null {
  // El acceso puede lanzar (modo privado, almacenamiento bloqueado).
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function parseThemePreference(raw: string | null): ThemePreference {
  if (raw === null) return DEFAULT_PREFERENCE
  try {
    const parsed = storedThemeSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data.data : DEFAULT_PREFERENCE
  } catch {
    return DEFAULT_PREFERENCE
  }
}

export function readThemePreference(): ThemePreference {
  const storage = getStorage()
  if (!storage) return DEFAULT_PREFERENCE
  try {
    return parseThemePreference(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_PREFERENCE
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ version: 1, data: preference }),
    )
  } catch {
    // Sin espacio o sin permiso: la preferencia se mantiene solo en esta sesión.
  }
}

// Avisa de cambios hechos desde otro documento del mismo origen,
// por ejemplo la vista previa del Design Lab dentro de un iframe.
export function subscribeToThemePreference(
  listener: (preference: ThemePreference) => void,
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY)
      listener(parseThemePreference(event.newValue))
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
