import { useEffect, useState } from 'react'
import {
  isProfileInvitationPending,
  markProfileInvitationPresented,
} from '../../infrastructure/storage/onboardingStorage'

// La invitación al expediente se ofrece una sola vez (004-spec §1). Se registra
// al presentarla, no al responderla: queda en pantalla durante esta visita a la
// consulta, hasta que se descarta, y no vuelve al recargar ni al regresar.
export function useProfileInvitation() {
  const [pending] = useState(isProfileInvitationPending)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (pending) markProfileInvitationPresented()
  }, [pending])

  return { visible: pending && !dismissed, dismiss: () => setDismissed(true) }
}
