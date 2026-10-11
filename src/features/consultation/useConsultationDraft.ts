import { useEffect, useState } from 'react'
import { createDebouncedWriter } from '../../infrastructure/storage/debouncedWriter'
import {
  EMPTY_CONSULTATION_DRAFT,
  readConsultationDraft,
  saveConsultationDraft,
  subscribeToConsultationDraftCleared,
  type ConsultationDraft,
} from '../../infrastructure/storage/consultationDraftStorage'
import { clearConsultation } from '../../infrastructure/storage/userData'

// Pausa tras la última pulsación antes de escribir en sessionStorage.
const SAVE_DELAY_MS = 400

// Mensaje y contexto de la consulta en curso. El estado sigue siendo local al
// formulario; sessionStorage solo lo recupera tras una recarga o al volver a
// entrar en la pantalla.
export function useConsultationDraft() {
  const [draft, setDraft] = useState<ConsultationDraft>(readConsultationDraft)
  const [writer] = useState(() =>
    createDebouncedWriter(saveConsultationDraft, SAVE_DELAY_MS),
  )

  useEffect(() => {
    const flush = () => writer.flush()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') writer.flush()
    }
    // En móvil la pestaña puede descartarse sin llegar a descargarse la página.
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    // Un borrado hecho desde fuera del formulario no debe revivir con una
    // escritura pendiente ni dejar texto obsoleto en pantalla.
    const unsubscribe = subscribeToConsultationDraftCleared(() => {
      writer.cancel()
      setDraft(EMPTY_CONSULTATION_DRAFT)
    })
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      unsubscribe()
      writer.flush()
    }
  }, [writer])

  const update = (patch: Partial<ConsultationDraft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    writer.schedule(next)
  }

  const clear = () => {
    writer.cancel()
    setDraft(EMPTY_CONSULTATION_DRAFT)
    clearConsultation()
  }

  return {
    message: draft.message,
    context: draft.context,
    setMessage: (message: string) => update({ message }),
    setContext: (context: string) => update({ context }),
    clear,
  }
}
