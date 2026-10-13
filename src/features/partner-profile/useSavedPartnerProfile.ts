import { useEffect, useState } from 'react'
import type { PartnerProfile } from '../../domain/partner-profile/partnerProfile'
import {
  readPartnerProfile,
  subscribeToPartnerProfile,
} from '../../infrastructure/storage/partnerProfileStorage'

// Solo un expediente legible cuenta como guardado: un dato inválido o de una
// versión posterior no se utiliza (004-plan §3).
function readSaved(): PartnerProfile | null {
  const stored = readPartnerProfile()
  return stored.status === 'ok' ? stored.value : null
}

// El último expediente guardado en este dispositivo, al día con sus cambios y
// con el borrado global.
export function useSavedPartnerProfile(): PartnerProfile | null {
  const [profile, setProfile] = useState(readSaved)

  useEffect(() => subscribeToPartnerProfile(() => setProfile(readSaved())), [])

  return profile
}
