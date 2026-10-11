import * as z from 'zod/mini'
import { sessionArea } from './storageAreas'
import { STORAGE_KEYS } from './storageKeys'
import { readRecord, writeRecord } from './versionedRecord'

// Navegación temporal de la sesión (tech-stack §35): qué pantalla estaba
// activa para que una recarga no devuelva a la portada a quien ya consulta.
export const SESSION_SCREENS = ['landing', 'consultation'] as const
export type SessionScreen = (typeof SESSION_SCREENS)[number]

const screenRecord = { version: 1, schema: z.enum(SESSION_SCREENS) }

export function readSessionScreen(): SessionScreen {
  const stored = readRecord(
    sessionArea,
    STORAGE_KEYS.sessionScreen,
    screenRecord,
  )
  return stored.status === 'ok' ? stored.value : 'landing'
}

export function saveSessionScreen(screen: SessionScreen): void {
  // La portada es el estado inicial: no necesita dejar nada guardado.
  if (screen === 'landing') sessionArea.remove(STORAGE_KEYS.sessionScreen)
  else
    writeRecord(sessionArea, STORAGE_KEYS.sessionScreen, screenRecord, screen)
}
