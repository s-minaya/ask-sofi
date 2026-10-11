import * as z from 'zod/mini'
import type { WriteResult } from './storageArea'
import { sessionArea } from './storageAreas'
import { subscribeToStorageChanges } from './storageEvents'
import { STORAGE_KEYS } from './storageKeys'
import { readRecord, writeRecord } from './versionedRecord'

// Solo lo que el formulario actual de la consulta contiene. El resultado de
// un análisis y su caché pertenecen a sus propias features.
export type ConsultationDraft = {
  message: string
  context: string
}

export const EMPTY_CONSULTATION_DRAFT: ConsultationDraft = {
  message: '',
  context: '',
}

const draftRecord = {
  version: 1,
  schema: z.object({ message: z.string(), context: z.string() }),
}

// sessionStorage: sobrevive a una recarga pero no al cierre de la pestaña.
export function readConsultationDraft(): ConsultationDraft {
  const stored = readRecord(
    sessionArea,
    STORAGE_KEYS.consultationDraft,
    draftRecord,
  )
  return stored.status === 'ok' ? stored.value : EMPTY_CONSULTATION_DRAFT
}

export function saveConsultationDraft(draft: ConsultationDraft): WriteResult {
  // Un formulario vacío no deja rastro en el almacenamiento.
  if (!draft.message && !draft.context) {
    sessionArea.remove(STORAGE_KEYS.consultationDraft)
    return { persisted: true }
  }
  return writeRecord(
    sessionArea,
    STORAGE_KEYS.consultationDraft,
    draftRecord,
    draft,
  )
}

// Borrados de la consulta, también los completos de datos de Ask Sofi.
export function subscribeToConsultationDraftCleared(
  listener: () => void,
): () => void {
  return subscribeToStorageChanges((scope) => {
    if (scope === 'consultation' || scope === 'all') listener()
  })
}
