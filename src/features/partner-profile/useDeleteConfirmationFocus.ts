import { useEffect, useRef, type RefObject } from 'react'
import { DELETE_ID } from './ProfileSheet'
import type { GuideState } from './sofiGuide'

// Foco de la confirmación de eliminar: al abrirla va a su titular; al cancelar
// vuelve a «Eliminar expediente»; al confirmar, la acción de origen desaparece
// con el expediente y el foco pasa al titular de la ficha.
export function useDeleteConfirmationFocus(
  guide: GuideState,
  headingRef: RefObject<HTMLHeadingElement | null>,
) {
  const confirmRef = useRef<HTMLHeadingElement>(null)
  const confirming = useRef(guide.confirmingDelete)

  useEffect(() => {
    const was = confirming.current
    confirming.current = guide.confirmingDelete
    if (!was && guide.confirmingDelete) confirmRef.current?.focus()
    if (was && !guide.confirmingDelete) {
      if (guide.reaction?.cause === 'deleted') headingRef.current?.focus()
      else document.getElementById(DELETE_ID)?.focus()
    }
  }, [guide.confirmingDelete, guide.reaction, headingRef])

  return confirmRef
}
