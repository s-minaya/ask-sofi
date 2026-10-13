import * as z from 'zod/mini'
import type { WriteResult } from './storageArea'
import { localArea } from './storageAreas'
import { STORAGE_KEYS } from './storageKeys'
import { readRecord, writeRecord } from './versionedRecord'

type Onboarding = { profileInvitationPresented: boolean }

// El registro solo se escribe tras presentar la invitación: un campo que no se
// entiende cuenta como presentado.
const onboardingRecord = {
  version: 1,
  schema: z.object({
    profileInvitationPresented: z.catch(z.boolean(), true),
  }),
}

// La invitación al expediente se ofrece una sola vez por dispositivo. Rechazarla,
// recargar o eliminar el expediente no la devuelve; solo el borrado global.
export function isProfileInvitationPending(): boolean {
  const stored = readRecord(
    localArea,
    STORAGE_KEYS.onboarding,
    onboardingRecord,
  )
  // Datos ilegibles o de una versión posterior: existen, así que ya se presentó.
  if (stored.status === 'missing') return true
  return stored.status === 'ok' && !stored.value.profileInvitationPresented
}

// Se registra al presentarla, no al responderla.
export function markProfileInvitationPresented(): WriteResult {
  const value: Onboarding = { profileInvitationPresented: true }
  return writeRecord(
    localArea,
    STORAGE_KEYS.onboarding,
    onboardingRecord,
    value,
  )
}
