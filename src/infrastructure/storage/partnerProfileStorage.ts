import {
  prepareProfileForSave,
  type PartnerProfile,
} from '../../domain/partner-profile/partnerProfile'
import { partnerProfileSchema } from '../../domain/partner-profile/partnerProfileSchema'
import type { PersistFailure } from './storageArea'
import { localArea } from './storageAreas'
import { emitStorageChange, subscribeToStorageChanges } from './storageEvents'
import { STORAGE_KEYS } from './storageKeys'
import { readRecord, writeRecord, type ReadOutcome } from './versionedRecord'

const PROFILE_RECORD = { version: 1, schema: partnerProfileSchema }

// Un único expediente por dispositivo. «invalid» y «newer-version» no se
// utilizan nunca: quien lee decide cómo presentarlos.
export function readPartnerProfile(): ReadOutcome<PartnerProfile> {
  return readRecord(localArea, STORAGE_KEYS.partnerProfile, PROFILE_RECORD)
}

export type ProfileSaveResult =
  | { status: 'saved'; profile: PartnerProfile }
  // Solo vive en memoria durante esta sesión: no debe presentarse como guardado.
  | { status: 'memory-only'; reason: PersistFailure; profile: PartnerProfile }
  | { status: 'rejected'; error: 'empty' | 'notes-too-long' }

// Guardar es siempre una acción explícita; devuelve lo que realmente se guardó.
export function savePartnerProfile(draft: PartnerProfile): ProfileSaveResult {
  const check = prepareProfileForSave(draft)
  if (!check.ok) return { status: 'rejected', error: check.error }

  const result = writeRecord(
    localArea,
    STORAGE_KEYS.partnerProfile,
    PROFILE_RECORD,
    check.profile,
  )
  emitStorageChange('partnerProfile')
  return result.persisted
    ? { status: 'saved', profile: check.profile }
    : { status: 'memory-only', reason: result.reason, profile: check.profile }
}

// Solo el expediente: preferencias, borradores y onboarding no cambian.
export function deletePartnerProfile(): void {
  localArea.remove(STORAGE_KEYS.partnerProfile)
  emitStorageChange('partnerProfile')
}

// Cambios del expediente y borrados completos de datos de Ask Sofi.
export function subscribeToPartnerProfile(listener: () => void): () => void {
  return subscribeToStorageChanges((scope) => {
    if (scope === 'partnerProfile' || scope === 'all') listener()
  })
}
